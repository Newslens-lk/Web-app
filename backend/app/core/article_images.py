"""Select article photos without accepting publisher icons or tiny thumbnails."""

from html.parser import HTMLParser
from io import BytesIO
from urllib.parse import unquote, urljoin, urlsplit

import httpx
from PIL import Image, UnidentifiedImageError

# Confirmed Lankadeepa OG image: an identical 36 x 36 icon on unrelated stories.
REJECTED_FILENAMES = {
    "image_8df7de9e07.png", "logo.png", "logo.jpg", "favicon.ico",
    "placeholder.png", "placeholder.jpg", "no-image.png", "no-image.jpg",
}
MIN_WIDTH = 320
MIN_HEIGHT = 160
MAX_IMAGE_BYTES = 8 * 1024 * 1024


def usable_image_url(value: str | None) -> str | None:
    if not value:
        return None
    value = value.strip()
    try:
        parts = urlsplit(value)
        filename = unquote(parts.path).rsplit("/", 1)[-1].lower()
        if parts.scheme not in {"http", "https"} or not parts.hostname:
            return None
        if filename in REJECTED_FILENAMES:
            return None
    except ValueError:
        return None
    return value


class ArticleImageParser(HTMLParser):
    """Only collect body photos inside explicit article-content containers.

    Do not fall back to arbitrary page images: those include ads and other stories.
    """

    BODY_CLASSES = {"article-body", "article-content", "entry-content", "post-content"}
    VOID_TAGS = {
        "area", "base", "br", "col", "embed", "hr", "img", "input", "link",
        "meta", "param", "source", "track", "wbr",
    }

    def __init__(self):
        super().__init__()
        self.metadata: list[str] = []
        self.body: list[str] = []
        self.stack: list[tuple[str, bool]] = []

    def handle_starttag(self, tag, attrs):
        values = dict(attrs)
        inside_body = bool(self.stack and self.stack[-1][1])
        classes = set((values.get("class") or "").split())
        inside_body |= bool(classes & self.BODY_CLASSES)
        inside_body |= values.get("itemprop") == "articleBody"
        if tag == "meta":
            prop = (values.get("property") or values.get("name") or "").lower()
            if prop in {"og:image", "twitter:image", "twitter:image:src"}:
                if values.get("content"):
                    self.metadata.append(values["content"])
        if tag == "img" and inside_body:
            # Lazy-loading attributes often hold the real photo while src is a pixel.
            for key in ("data-src", "data-original", "src"):
                if values.get(key):
                    self.body.append(values[key])
        if tag not in self.VOID_TAGS:
            self.stack.append((tag, inside_body))

    def handle_startendtag(self, tag, attrs):
        self.handle_starttag(tag, attrs)
        if tag not in self.VOID_TAGS:
            self.handle_endtag(tag)

    def handle_endtag(self, tag):
        for index in range(len(self.stack) - 1, -1, -1):
            if self.stack[index][0] == tag:
                del self.stack[index:]
                break


def valid_image(client: httpx.Client, url: str) -> bool:
    """Check actual image bytes; metadata can report false dimensions."""
    try:
        with client.stream("GET", url) as response:
            response.raise_for_status()
            if not usable_image_url(str(response.url)):
                return False
            data = bytearray()
            for chunk in response.iter_bytes():
                data.extend(chunk)
                if len(data) > MAX_IMAGE_BYTES:
                    return False
            with Image.open(BytesIO(data)) as photo:
                width, height = photo.size
                photo.verify()
                return width >= MIN_WIDTH and height >= MIN_HEIGHT
    except (httpx.HTTPError, OSError, ValueError, UnidentifiedImageError,
            Image.DecompressionBombError):
        return False


def find_image_url(client: httpx.Client, article_url: str) -> str | None:
    # Let page-fetch failures propagate: repair must not erase records on a timeout.
    response = client.get(article_url)
    response.raise_for_status()
    parser = ArticleImageParser()
    parser.feed(response.text)
    host = urlsplit(str(response.url)).hostname or ""
    # Lankadeepa metadata is known to be unreliable; prefer its article-body photos.
    candidates = (
        parser.body + parser.metadata
        if host == "lankadeepa.lk" or host.endswith(".lankadeepa.lk")
        else parser.metadata + parser.body
    )
    seen = set()
    for candidate in candidates:
        url = usable_image_url(urljoin(str(response.url), candidate))
        if not url or url in seen:
            continue
        seen.add(url)
        if valid_image(client, url):
            return url
    return None
