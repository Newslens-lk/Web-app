"""Populate article image_url values from article-page metadata.

Run inside the backend container after the image_url column has been created:
    python scripts/backfill_article_images.py --limit 100
"""

from __future__ import annotations

import argparse
from html.parser import HTMLParser
from urllib.parse import urljoin

import httpx
from sqlalchemy import select

from app.db.session import SessionLocal
from app.models.article import Article


class ImageMetadataParser(HTMLParser):
    def __init__(self) -> None:
        super().__init__()
        self.image_url: str | None = None

    def handle_starttag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        if tag != "meta" or self.image_url:
            return
        values = {key.lower(): value for key, value in attrs}
        prop = (values.get("property") or values.get("name") or "").lower()
        if prop in {"og:image", "twitter:image", "twitter:image:src"}:
            self.image_url = values.get("content")


def find_image_url(client: httpx.Client, article_url: str) -> str | None:
    try:
        response = client.get(article_url)
        response.raise_for_status()
    except httpx.HTTPError:
        return None

    parser = ImageMetadataParser()
    parser.feed(response.text)
    return urljoin(article_url, parser.image_url) if parser.image_url else None


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--limit", type=int, default=100)
    parser.add_argument("--source", help="Only process one source name")
    args = parser.parse_args()

    with SessionLocal() as db, httpx.Client(
        follow_redirects=True,
        timeout=8,
        headers={"User-Agent": "NewsLens image metadata fetcher/1.0"},
    ) as client:
        query = (
            select(Article)
            .where(Article.image_url.is_(None))
            .order_by(Article.published_at.desc().nullslast())
        )
        if args.source:
            query = query.where(Article.source_name == args.source)
        query = query.limit(args.limit)

        articles = list(db.scalars(query))
        updated = 0
        for article in articles:
            image_url = find_image_url(client, article.url)
            if image_url:
                article.image_url = image_url
                updated += 1
                print(f"[image] {article.article_id} <- {image_url}")
            else:
                print(f"[none]  {article.article_id}")

        db.commit()
        print(f"Updated {updated} of {len(articles)} articles.")


if __name__ == "__main__":
    main()
