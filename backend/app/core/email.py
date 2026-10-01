"""Transactional email delivery over SMTP.

Configured for Gmail by default, which needs an App Password rather than the
account password — see backend/.env.example.

Sending is best-effort by design. Every failure path — no credentials, a
refused connection, a rejected login — is logged and swallowed, never raised.
The caller (account registration) must not fail because mail could not be
sent: the user's account exists either way, and a 500 at signup because a mail
server was briefly unreachable would be a worse bug than a missing email.

With `smtp_user` or `smtp_password` unset the message is written to the log
instead of sent. That keeps the backend runnable for a teammate who has no
mail credentials, and stops development and tests from mailing real people.
"""
import logging
import smtplib
from email.message import EmailMessage

from app.core.config import get_settings

logger = logging.getLogger(__name__)

_TIMEOUT_SECONDS = 15.0


def send_email(*, to: str, subject: str, html: str, text: str) -> bool:
    """Send one message. Returns True when it was sent (or logged in dev mode).

    `text` is not optional: a plain-text alternative alongside the HTML keeps
    the message out of spam folders and readable in clients that refuse HTML.
    """
    settings = get_settings()

    if not settings.smtp_user or not settings.smtp_password:
        logger.info(
            "Email not sent (no SMTP_USER/SMTP_PASSWORD configured).\n"
            "  To:      %s\n  Subject: %s\n  Body:\n%s",
            to,
            subject,
            text,
        )
        return True

    message = _build_message(
        to=to,
        subject=subject,
        html=html,
        text=text,
        sender=settings.smtp_user,
        sender_name=settings.email_from_name,
    )

    try:
        with smtplib.SMTP(
            settings.smtp_host, settings.smtp_port, timeout=_TIMEOUT_SECONDS
        ) as server:
            # Gmail's port 587 opens unencrypted and upgrades; the login below
            # must never travel before this succeeds.
            server.starttls()
            server.login(settings.smtp_user, settings.smtp_password)
            server.send_message(message)
    except smtplib.SMTPAuthenticationError:
        # Overwhelmingly the most common failure here, and the message Gmail
        # returns is unhelpful, so spell out the two real causes.
        logger.exception(
            "SMTP login rejected for %s. Gmail needs a 16-character App "
            "Password (not the account password), and App Passwords require "
            "2-Step Verification to be enabled.",
            settings.smtp_user,
        )
        return False
    except (smtplib.SMTPException, OSError):
        # Refused connection, DNS failure, timeout, or a rejection mid-send.
        logger.exception("Could not send email to %s via %s", to, settings.smtp_host)
        return False

    logger.info("Sent %r to %s", subject, to)
    return True


def _build_message(
    *, to: str, subject: str, html: str, text: str, sender: str, sender_name: str
) -> EmailMessage:
    """A multipart/alternative message carrying both bodies.

    `EmailMessage` encodes headers and payloads as UTF-8 on its own, which is
    what makes a Sinhala subject line survive the trip — a raw SMTP string
    would arrive as mojibake.
    """
    message = EmailMessage()
    message["Subject"] = subject
    message["From"] = f"{sender_name} <{sender}>"
    message["To"] = to
    message.set_content(text)
    # Added second, so clients that can render HTML prefer it: in
    # multipart/alternative the last part wins.
    message.add_alternative(html, subtype="html")
    return message
