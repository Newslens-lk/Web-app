"""Unit tests for the signup welcome email.

Two things are worth pinning down here, and neither needs mail credentials or
a live SMTP connection:

  1. The message itself — does it come out in the reader's language, is a
     reader-supplied display name safe to drop into an HTML body, and does a
     Sinhala subject line survive encoding?
  2. The delivery wrapper — do missing credentials degrade to logging rather
     than exploding, and does a mail-server failure stay contained instead of
     bubbling up into the signup request?

`smtplib.SMTP` is patched throughout, so nothing here opens a connection.
"""
import smtplib
from unittest.mock import patch

from app.core.config import get_settings
from app.core.email import send_email
from app.emails.welcome import build_welcome_email

# ---------------------------------------------------------------------------
# Message construction
# ---------------------------------------------------------------------------


def test_english_is_used_by_default():
    message = build_welcome_email(display_name="Dinithi")

    assert message.subject == "Welcome to NewsLens"
    assert "Hi Dinithi," in message.text


def test_sinhala_reader_gets_a_sinhala_message():
    message = build_welcome_email(display_name="Dinithi", locale="si")

    assert message.subject == "NewsLens වෙත සාදරයෙන් පිළිගනිමු"
    assert "ආයුබෝවන් Dinithi," in message.text
    # The whole body should have switched, not just the greeting.
    assert "Thanks for creating your NewsLens account" not in message.text


def test_an_unknown_locale_falls_back_to_english_rather_than_failing():
    message = build_welcome_email(display_name="Dinithi", locale="ta")

    assert message.subject == "Welcome to NewsLens"


def test_html_in_a_display_name_cannot_inject_markup():
    # Display names are reader-supplied and go straight into an HTML body.
    message = build_welcome_email(display_name="<script>alert(1)</script>")

    assert "<script>" not in message.html
    assert "&lt;script&gt;" in message.html


def test_both_an_html_and_a_plain_text_body_are_produced():
    # Text-only clients, and spam filters, both want the plain alternative.
    message = build_welcome_email(display_name="Dinithi")

    assert message.html.startswith("<!doctype html>")
    assert message.text.strip()
    # The plain part must really be plain — no markup leaking across.
    assert "<p" not in message.text
    assert "<a " not in message.text


def test_the_site_link_points_at_the_configured_site_url():
    settings = get_settings()

    message = build_welcome_email(display_name="Dinithi")

    assert settings.site_url in message.html
    assert settings.site_url in message.text


# ---------------------------------------------------------------------------
# Delivery
# ---------------------------------------------------------------------------


def _send(**overrides):
    payload = {
        "to": "reader@example.com",
        "subject": "Welcome to NewsLens",
        "html": "<p>hello</p>",
        "text": "hello",
    }
    payload.update(overrides)
    return send_email(**payload)


def _with_credentials(monkeypatch):
    monkeypatch.setenv("SMTP_USER", "newslens.test@gmail.com")
    monkeypatch.setenv("SMTP_PASSWORD", "abcdefghijklmnop")
    get_settings.cache_clear()


def test_without_credentials_the_message_is_logged_and_no_connection_is_opened(
    monkeypatch, caplog
):
    monkeypatch.setenv("SMTP_USER", "")
    monkeypatch.setenv("SMTP_PASSWORD", "")
    get_settings.cache_clear()

    with patch("app.core.email.smtplib.SMTP") as smtp, caplog.at_level("INFO"):
        assert _send() is True

    smtp.assert_not_called()
    assert "no SMTP_USER/SMTP_PASSWORD configured" in caplog.text
    assert "reader@example.com" in caplog.text

    get_settings.cache_clear()


def test_with_credentials_the_message_is_sent_over_an_upgraded_connection(monkeypatch):
    _with_credentials(monkeypatch)

    with patch("app.core.email.smtplib.SMTP") as smtp:
        server = smtp.return_value.__enter__.return_value
        assert _send() is True

    # The login must never travel over the plaintext connection Gmail opens.
    assert server.method_calls[0][0] == "starttls"
    server.login.assert_called_once_with("newslens.test@gmail.com", "abcdefghijklmnop")

    sent = server.send_message.call_args[0][0]
    assert sent["To"] == "reader@example.com"
    assert sent["From"] == "NewsLens <newslens.test@gmail.com>"
    # A hung server must not hold the connection open indefinitely.
    assert smtp.call_args.kwargs["timeout"] > 0

    get_settings.cache_clear()


def test_a_sinhala_subject_survives_header_encoding(monkeypatch):
    # Raw non-ASCII in a header arrives as mojibake; EmailMessage should be
    # encoding it instead.
    _with_credentials(monkeypatch)
    subject = "NewsLens වෙත සාදරයෙන් පිළිගනිමු"

    with patch("app.core.email.smtplib.SMTP") as smtp:
        server = smtp.return_value.__enter__.return_value
        assert _send(subject=subject) is True

    sent = server.send_message.call_args[0][0]
    assert sent["Subject"] == subject
    assert "utf-8" in str(sent).lower()

    get_settings.cache_clear()


def test_both_bodies_are_carried_with_html_preferred(monkeypatch):
    _with_credentials(monkeypatch)

    with patch("app.core.email.smtplib.SMTP") as smtp:
        server = smtp.return_value.__enter__.return_value
        _send()

    sent = server.send_message.call_args[0][0]
    assert sent.get_content_type() == "multipart/alternative"
    # In multipart/alternative the last part wins, so HTML must come second.
    assert [part.get_content_type() for part in sent.iter_parts()] == [
        "text/plain",
        "text/html",
    ]

    get_settings.cache_clear()


def test_a_rejected_login_is_reported_but_not_raised(monkeypatch, caplog):
    # By far the most common failure: the account password used in place of a
    # Gmail App Password. Signup has already succeeded, so this must not
    # become an exception.
    _with_credentials(monkeypatch)

    with patch("app.core.email.smtplib.SMTP") as smtp, caplog.at_level("ERROR"):
        server = smtp.return_value.__enter__.return_value
        server.login.side_effect = smtplib.SMTPAuthenticationError(535, b"bad credentials")
        assert _send() is False

    # The log should say what to actually do about it.
    assert "App Password" in caplog.text
    assert "2-Step Verification" in caplog.text

    get_settings.cache_clear()


def test_a_connection_failure_is_contained(monkeypatch):
    _with_credentials(monkeypatch)

    with patch("app.core.email.smtplib.SMTP", side_effect=OSError("connection refused")):
        assert _send() is False

    get_settings.cache_clear()
