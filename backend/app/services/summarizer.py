"""Event topic assignment and summary generation via OpenAI API.

Two separate operations:
  1. assign_topic   — lightweight, uses only article titles to pick a topic
                      label. Designed to run in bulk across all events.
  2. generate_summary — expensive, sends full article bodies to produce a
                        Sinhala summary. Triggered on-demand by the user.

Both write directly to the existing Event.topic / Event.summary columns.
"""

import logging
import os
import time
from uuid import UUID

from openai import OpenAI
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.article import Article
from app.models.event import Event

logger = logging.getLogger(__name__)

TOPIC_TAXONOMY = [
    "politics",
    "sports",
    "business",
    "technology",
    "crime",
    "health",
    "education",
    "entertainment",
    "environment",
    "military_defence",
    "disaster",
    "transport",
    "religion",
    "other",
]

_TOPIC_LIST = ", ".join(TOPIC_TAXONOMY)

# -- prompts ------------------------------------------------------------------

_TOPIC_SYSTEM_PROMPT = (
    "You are a news classifier. You will receive the headlines of several "
    "Sinhala news articles that all cover the same event. You must:\n"
    "1. Write a short common headline in Sinhala (max 15 words) that captures "
    "what all the articles are about. Do not copy any single headline.\n"
    "2. Assign exactly one topic label from this list: " + _TOPIC_LIST + "\n\n"
    "Respond in EXACTLY this format (no markdown, no extra text):\n"
    "TITLE: <common headline in Sinhala>\n"
    "TOPIC: <one label from the list>"
)

_SUMMARY_SYSTEM_PROMPT = (
    "You are a neutral news analyst. You will receive a set of Sinhala news "
    "articles that all cover the same event. Produce a concise, neutral "
    "summary in Sinhala that synthesizes all articles. Do not favour any "
    "single source. 3-5 sentences.\n\n"
    "Respond with ONLY the summary text, nothing else."
)

# Bulk rate-limiting.
BULK_BATCH_SIZE = 10
BULK_BATCH_DELAY_SECONDS = 5

# Model to use for both topic and summary generation.
_MODEL = os.environ.get("OPENAI_MODEL", "gpt-4o-mini")


def _get_client() -> OpenAI:
    api_key = os.environ.get("OPENAI_API_KEY")
    if not api_key:
        raise RuntimeError("OPENAI_API_KEY environment variable is not set")
    return OpenAI(api_key=api_key)


def _chat(client: OpenAI, system: str, user: str, max_tokens: int) -> str:
    response = client.chat.completions.create(
        model=_MODEL,
        max_tokens=max_tokens,
        messages=[
            {"role": "system", "content": system},
            {"role": "user", "content": user},
        ],
    )
    return (response.choices[0].message.content or "").strip()


def _to_str(event_id) -> str:
    """Convert any event_id (UUID object, string, etc.) to a plain string."""
    if isinstance(event_id, UUID):
        return str(event_id)
    return str(event_id)


# -- step 1: topic assignment -------------------------------------------------

def _build_titles_message(articles: list[Article]) -> str:
    lines: list[str] = []
    for i, a in enumerate(articles, 1):
        source = a.source_name or "unknown"
        title = (a.title or "").strip()
        lines.append(f"{i}. [{source}] {title}")
    return "\n".join(lines)


def _parse_topic_response(text: str) -> tuple[str, str]:
    """Extract title and topic from the structured response."""
    title = ""
    topic = "other"
    for line in text.strip().splitlines():
        if line.startswith("TITLE:"):
            title = line[len("TITLE:"):].strip()
        elif line.startswith("TOPIC:"):
            raw = line[len("TOPIC:"):].strip().lower()
            topic = raw if raw in TOPIC_TAXONOMY else "other"
    return title, topic


def assign_topic(
    db: Session,
    event_id,
    *,
    force: bool = False,
) -> str:
    """Classify an event and generate a common headline using article titles."""
    eid = _to_str(event_id)

    event = db.get(Event, eid)
    if event is None:
        raise ValueError(f"Event {eid} not found")

    if event.topic and event.representative_title and not force:
        return event.topic

    articles = list(
        db.scalars(
            select(Article)
            .where(Article.event_id == eid)
            .order_by(Article.published_at.asc().nullslast())
        )
    )
    if not articles:
        raise ValueError(f"Event {eid} has no articles")

    client = _get_client()
    raw = _chat(client, _TOPIC_SYSTEM_PROMPT, _build_titles_message(articles), 128)
    title, topic = _parse_topic_response(raw)

    event.topic = topic
    if title:
        event.representative_title = title

    db.commit()

    logger.info("Assigned topic for event %s → %s (title: %s)", eid, topic, title[:50] if title else "none")
    return topic


def assign_topics_bulk(db: Session) -> dict:
    """Bulk-assign topics for every event that has no topic yet."""
    pending_ids = list(
        db.scalars(
            select(Event.event_id).where(
                (Event.topic.is_(None)) | (Event.representative_title.is_(None))
            )
        )
    )

    stats = {"total": len(pending_ids), "done": 0, "failed": 0}
    logger.info("Bulk topic assignment: %d events pending", len(pending_ids))

    for i, eid in enumerate(pending_ids):
        try:
            assign_topic(db, eid, force=False)
            stats["done"] += 1
        except Exception as exc:
            logger.error("Failed to assign topic for event %s: %s", eid, exc)
            stats["failed"] += 1
            db.rollback()

        if (i + 1) % BULK_BATCH_SIZE == 0:
            time.sleep(BULK_BATCH_DELAY_SECONDS)

    logger.info(
        "Bulk topic assignment complete: %d done, %d failed out of %d",
        stats["done"], stats["failed"], stats["total"],
    )
    return stats


# -- step 2: summary generation (on-demand) -----------------------------------

def _build_full_message(articles: list[Article]) -> str:
    parts: list[str] = []
    for i, a in enumerate(articles, 1):
        source = a.source_name or "unknown"
        title = (a.title or "").strip()
        body = (a.body or "").strip()
        if len(body) > 4000:
            body = body[:4000] + "…"
        parts.append(f"--- Article {i} [{source}] ---\nTitle: {title}\n\n{body}")
    return "\n\n".join(parts)


def generate_summary(
    db: Session,
    event_id,
    *,
    force: bool = False,
) -> str:
    """Generate a Sinhala summary for an event using full article bodies."""
    eid = _to_str(event_id)

    event = db.get(Event, eid)
    if event is None:
        raise ValueError(f"Event {eid} not found")

    if event.summary and not force:
        return event.summary

    articles = list(
        db.scalars(
            select(Article)
            .where(Article.event_id == eid)
            .order_by(Article.published_at.asc().nullslast())
        )
    )
    if not articles:
        raise ValueError(f"Event {eid} has no articles")

    client = _get_client()
    summary = _chat(client, _SUMMARY_SYSTEM_PROMPT, _build_full_message(articles), 1024)
    event.summary = summary

    # If the topic wasn't assigned yet, do it now while we have the articles.
    if not event.topic or force:
        raw = _chat(client, _TOPIC_SYSTEM_PROMPT, _build_titles_message(articles), 128)
        title, topic = _parse_topic_response(raw)
        event.topic = topic
        if title:
            event.representative_title = title

    db.commit()

    logger.info("Generated summary for event %s", eid)
    return summary
