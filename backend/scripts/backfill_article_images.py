"""Populate article image_url values from article-page metadata.

Run inside the backend container after the image_url column has been created:
    python -m scripts.backfill_article_images --limit 100

Repair a confirmed bad URL (backs up original values before committing):
    python -m scripts.backfill_article_images --source lankadeepa --replace-url URL
"""

from __future__ import annotations

import argparse
import json
from datetime import datetime, timezone
from pathlib import Path

import httpx
from sqlalchemy import select

from app.core.article_images import find_image_url
from app.db.session import SessionLocal
from app.models.article import Article


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--limit", type=int, default=100)
    parser.add_argument("--source", help="Only process one source name")
    parser.add_argument("--replace-url", help="Repair only records with this exact image URL")
    parser.add_argument("--dry-run", action="store_true", help="Preview without writing changes")
    parser.add_argument("--backup", type=Path, help="New JSON backup file; must not already exist")
    args = parser.parse_args()
    if args.limit < 1:
        parser.error("--limit must be positive")

    with SessionLocal() as db, httpx.Client(
        follow_redirects=True,
        timeout=8,
        headers={"User-Agent": "NewsLens image metadata fetcher/1.0"},
    ) as client:
        query = (
            select(Article)
            .where(
                Article.image_url == args.replace_url
                if args.replace_url else Article.image_url.is_(None)
            )
            .order_by(Article.published_at.desc().nullslast(), Article.article_id)
        )
        if args.source:
            query = query.where(Article.source_name == args.source)
        query = query.limit(args.limit)

        articles = list(db.scalars(query))
        changes = []
        failed = 0
        for article in articles:
            try:
                image_url = find_image_url(client, article.url)
            except httpx.HTTPError as exc:
                failed += 1
                print(f"[fetch failed; unchanged] {article.article_id}: {type(exc).__name__}")
                continue
            if image_url == article.image_url:
                continue
            changes.append({
                "article_id": article.article_id,
                "old_image_url": article.image_url,
                "new_image_url": image_url,
            })
            article.image_url = image_url
            print(f"[image] {article.article_id} <- {image_url or 'no suitable photo'}", flush=True)

        if args.dry_run:
            db.rollback()
        elif changes:
            backup = args.backup or Path(
                f"image-repair-{datetime.now(timezone.utc):%Y%m%dT%H%M%S%fZ}.json"
            )
            with backup.open("x", encoding="utf-8") as output:
                json.dump(changes, output, indent=2)
            print(f"Backup: {backup}", flush=True)
            db.commit()
        action = "Would update" if args.dry_run else "Updated"
        print(f"{action} {len(changes)} of {len(articles)} articles; {failed} fetch failures.")


if __name__ == "__main__":
    main()
