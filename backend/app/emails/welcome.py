"""The welcome message sent once, when an account is created.

This is transactional mail — a direct reply to something the reader just did —
so it carries no unsubscribe link and needs no opt-in. The recurring "new
coverage is available" digest is a different kind of message and will need
both.

Copy is written per language rather than translated field by field, because
the two read differently as whole sentences.
"""
import html as html_escaping
from dataclasses import dataclass

from app.core.config import get_settings

_SUPPORTED_LOCALES = ("en", "si")


@dataclass(frozen=True)
class Message:
    subject: str
    html: str
    text: str


def build_welcome_email(*, display_name: str, locale: str = "en") -> Message:
    if locale not in _SUPPORTED_LOCALES:
        locale = "en"

    site_url = get_settings().site_url
    copy = _COPY[locale]

    # The display name is reader-supplied, so it is escaped before going
    # anywhere near the HTML body.
    safe_name = html_escaping.escape(display_name)

    text = (
        f"{copy['greeting'].format(name=display_name)}\n\n"
        f"{copy['body']}\n\n"
        f"{copy['cta']}: {site_url}\n\n"
        f"{copy['signoff']}\n"
        f"{copy['disclaimer']}\n"
    )

    return Message(
        subject=copy["subject"],
        html=_render_html(copy=copy, safe_name=safe_name, site_url=site_url),
        text=text,
    )


def _render_html(*, copy: dict[str, str], safe_name: str, site_url: str) -> str:
    # Styles are inline because email clients strip <style> blocks, and the
    # layout stays to a single centered column for the same reason: floats and
    # flexbox are unreliable across Outlook, Gmail and Apple Mail.
    return f"""\
<!doctype html>
<html lang="{copy['lang']}">
  <body style="margin:0;padding:24px;background:#f5f5f0;
               font-family:'Segoe UI',Helvetica,Arial,sans-serif;color:#171a1c;">
    <div style="max-width:520px;margin:0 auto;background:#ffffff;
                border:1px solid #dad7cc;border-radius:10px;padding:28px;">
      <p style="margin:0 0 20px;font-size:22px;font-weight:600;">
        news<span style="color:#b9752a;font-style:italic;">Lens</span>
      </p>
      <p style="margin:0 0 14px;font-size:16px;">
        {copy['greeting'].format(name=safe_name)}
      </p>
      <p style="margin:0 0 22px;font-size:15px;line-height:1.6;color:#3d4347;">
        {copy['body']}
      </p>
      <p style="margin:0 0 26px;">
        <a href="{site_url}"
           style="display:inline-block;background:#1b4b5a;color:#ffffff;
                  text-decoration:none;padding:11px 20px;border-radius:6px;
                  font-size:14px;font-weight:600;">{copy['cta']}</a>
      </p>
      <p style="margin:0 0 6px;font-size:13px;color:#5b6165;">{copy['signoff']}</p>
      <p style="margin:0;font-size:12px;color:#8a8f91;line-height:1.5;">
        {copy['disclaimer']}
      </p>
    </div>
  </body>
</html>
"""


_COPY: dict[str, dict[str, str]] = {
    "en": {
        "lang": "en",
        "subject": "Welcome to NewsLens",
        "greeting": "Hi {name},",
        "body": (
            "Thanks for creating your NewsLens account. You can now follow how "
            "different Sri Lankan outlets cover the same story, side by side."
        ),
        "cta": "Open NewsLens",
        "signoff": "— The NewsLens team, Group 17, University of Moratuwa",
        "disclaimer": (
            "Bias labels shown on the site are model predictions, not verified "
            "facts, and are not an authoritative rating of any news organisation."
        ),
    },
    "si": {
        "lang": "si",
        "subject": "NewsLens වෙත සාදරයෙන් පිළිගනිමු",
        "greeting": "ආයුබෝවන් {name},",
        "body": (
            "ඔබේ NewsLens ගිණුම සෑදීම ගැන ස්තූතියි. එකම පුවත ශ්‍රී ලංකාවේ විවිධ මාධ්‍ය "
            "ආයතන වාර්තා කරන ආකාරය දැන් ඔබට එකට සසඳා බැලිය හැකිය."
        ),
        "cta": "NewsLens විවෘත කරන්න",
        "signoff": "— NewsLens කණ්ඩායම, 17 වන කණ්ඩායම, මොරටුව විශ්ව විද්‍යාලය",
        "disclaimer": (
            "වෙබ් අඩවියේ දැක්වෙන නැඹුරු ලේබල යනු ආකෘතියක පුරෝකථන මිස තහවුරු කළ කරුණු "
            "නොවේ. ඒවා කිසිදු ප්‍රවෘත්ති ආයතනයක් පිළිබඳ බලයලත් ඇගයීමක් නොවේ."
        ),
    },
}
