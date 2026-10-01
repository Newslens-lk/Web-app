from io import BytesIO

import httpx
import pytest
from PIL import Image

from app.core.article_images import find_image_url, usable_image_url
from app.schemas.article import ImageResponse

BAD_IMAGE = "https://cdn.lankadeepa.lk/assets/uploads/image_8df7de9e07.png"


def photo(width=640, height=360):
    buffer = BytesIO()
    Image.new("RGB", (width, height)).save(buffer, format="PNG")
    return buffer.getvalue()


def image_client(html, images):
    def handle(request):
        if request.url.path == "/story":
            return httpx.Response(200, text=html)
        data = images.get(request.url.path)
        return httpx.Response(200, content=data) if data else httpx.Response(404)

    return httpx.Client(transport=httpx.MockTransport(handle), follow_redirects=True)


def test_lankadeepa_uses_body_photo_instead_of_shared_metadata_icon():
    html = f'''
        <meta property="og:image" content="{BAD_IMAGE}">
        <img src="/advertisement.png">
        <div class="article-body sinhala-body"><p><img src="/story.png" /></p></div>
        <img src="/related-story.png">
    '''
    with image_client(html, {"/story.png": photo()}) as client:
        assert find_image_url(client, "https://www.lankadeepa.lk/story") == (
            "https://www.lankadeepa.lk/story.png"
        )


def test_tiny_metadata_image_is_rejected_even_when_meta_claims_large_dimensions():
    html = '''<meta property="og:image" content="/tiny.png">
        <meta property="og:image:width" content="1200">
        <div class="entry-content"><img data-src="/large.png" src="/pixel.png"></div>'''
    with image_client(html, {"/tiny.png": photo(36, 36), "/large.png": photo()}) as client:
        assert find_image_url(client, "https://news.example/story") == (
            "https://news.example/large.png"
        )


def test_does_not_use_ads_or_related_stories_when_article_has_no_photo():
    html = f'''<meta property="og:image" content="{BAD_IMAGE}">
        <div class="article-body"><p>Text only</p></div>
        <div><img src="/related.png"></div>'''
    with image_client(html, {"/related.png": photo()}) as client:
        assert find_image_url(client, "https://www.lankadeepa.lk/story") is None


def test_broken_candidate_falls_back_to_next_metadata_image():
    html = '''<meta property="og:image" content="/broken.png">
        <meta name="twitter:image" content="/good.png">'''
    with image_client(html, {"/broken.png": b"not an image", "/good.png": photo()}) as client:
        assert find_image_url(client, "https://news.example/story").endswith("/good.png")


def test_page_failure_propagates_so_repair_can_preserve_existing_value():
    with httpx.Client(transport=httpx.MockTransport(lambda r: httpx.Response(503))) as client:
        with pytest.raises(httpx.HTTPStatusError):
            find_image_url(client, "https://news.example/story")


@pytest.mark.parametrize("url", [BAD_IMAGE, BAD_IMAGE + "?v=2", "data:image/png;base64,abc"])
def test_placeholder_urls_are_hidden_from_article_responses(url):
    assert usable_image_url(url) is None
    assert ImageResponse(image_url=url).image_url is None
