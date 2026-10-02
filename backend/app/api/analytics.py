"""Aggregate article predictions for research; never assign labels to publishers."""

from itertools import combinations
from datetime import date, datetime, time, timedelta, timezone

from fastapi import APIRouter, Depends, HTTPException, Query, Response
from sqlalchemy import case, func, select
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.article import Article
from app.schemas.analytics import (
    AnalyticsInsights, AnalyticsOverview, AnalyticsStories, DividedStory, PublisherPair, StoryDot, BiasCategory, BiasCount,
    LanguageCount, PublisherAnalytics, PublisherFreshness, TimelineWeek,
)
from app.schemas.event import BIAS_LABELS

COLOMBO = timezone(timedelta(hours=5, minutes=30))
CATEGORIES = (*BIAS_LABELS, "unclassified")


router = APIRouter(prefix="/analytics", tags=["analytics"])


def distribution(counts: dict[str, int]) -> list[BiasCount]:
    total = sum(counts.values())
    return [
        BiasCount(
            label=label, count=counts.get(label, 0),
            percentage=round(counts.get(label, 0) * 100 / total, 2) if total else 0,
        )
        for label in CATEGORIES
    ]


def filter_conditions(source: list[str] | None, bias_label: str | None):
    """Non-date filters shared by every analytics endpoint."""
    sources = sorted({name.strip() for name in source or [] if name.strip()})
    normalized = func.lower(func.trim(Article.bias_label))
    label = case((normalized.in_(BIAS_LABELS), normalized), else_="unclassified")
    conditions = []
    if sources:
        conditions.append(Article.source_name.in_(sources))
    if bias_label:
        conditions.append(label == bias_label)
    return sources, label, conditions


def colombo(value: datetime) -> datetime:
    # Naive values come from databases that drop the offset; treat them as local.
    return value.astimezone(COLOMBO) if value.tzinfo else value.replace(tzinfo=COLOMBO)


@router.get("/overview", response_model=AnalyticsOverview)
def overview(
    response: Response,
    date_from: date | None = None,
    date_to: date | None = None,
    source: list[str] | None = Query(default=None, max_length=50),
    bias_label: BiasCategory | None = None,
    db: Session = Depends(get_db),
) -> AnalyticsOverview:
    response.headers["Cache-Control"] = "no-store"
    if date_from and date_to and date_from > date_to:
        raise HTTPException(status_code=422, detail="Start date must not be after end date")
    sources, label, conditions = filter_conditions(source, bias_label)

    # Count before date filtering so readers know what cannot be placed in time.
    undated = db.scalar(
        select(func.count()).select_from(Article)
        .where(*conditions, Article.published_at.is_(None))
    ) or 0
    if date_from:
        conditions.append(Article.published_at >= datetime.combine(date_from, time.min, COLOMBO))
    if date_to:
        conditions.append(Article.published_at <= datetime.combine(date_to, time.max, COLOMBO))
    totals = db.execute(
        select(
            func.count(Article.article_id),
            func.count(func.distinct(Article.event_id)),
            func.count(func.distinct(Article.source_name)),
        ).where(*conditions)
    ).one()
    rows = db.execute(
        select(Article.source_name, label, func.count())
        .where(*conditions).group_by(Article.source_name, label)
    ).all()
    overall = dict.fromkeys(CATEGORIES, 0)
    publishers: dict[str, dict[str, int]] = {}
    for name, category, count in rows:
        overall[category] += count
        publishers.setdefault(name, dict.fromkeys(CATEGORIES, 0))[category] += count
    date_filtered = date_from is not None or date_to is not None
    return AnalyticsOverview(
        date_from=date_from, date_to=date_to, sources=sources, bias_label=bias_label,
        total_articles=totals[0], total_events=totals[1], total_sources=totals[2],
        missing_publication_dates=0 if date_filtered else undated,
        undated_excluded=undated if date_filtered else 0,
        bias_distribution=distribution(overall),
        publishers=[
            PublisherAnalytics(
                source_name=name, article_count=sum(counts.values()),
                bias_distribution=distribution(counts),
            )
            for name, counts in sorted(
                publishers.items(), key=lambda item: (-sum(item[1].values()), item[0])
            )
        ],
    )


@router.get("/insights", response_model=AnalyticsInsights)
def insights(
    response: Response,
    date_from: date | None = None,
    date_to: date | None = None,
    source: list[str] | None = Query(default=None, max_length=50),
    bias_label: BiasCategory | None = None,
    db: Session = Depends(get_db),
) -> AnalyticsInsights:
    """Weekly timeline and data-quality facts for the same filters."""
    response.headers["Cache-Control"] = "no-store"
    if date_from and date_to and date_from > date_to:
        raise HTTPException(status_code=422, detail="Start date must not be after end date")
    _, label, conditions = filter_conditions(source, bias_label)
    if date_from:
        conditions.append(Article.published_at >= datetime.combine(date_from, time.min, COLOMBO))
    if date_to:
        conditions.append(Article.published_at <= datetime.combine(date_to, time.max, COLOMBO))
    rows = db.execute(
        select(
            Article.source_name, label, Article.published_at, Article.language,
        ).where(*conditions)
    ).all()

    totals = dict.fromkeys(CATEGORIES, 0)
    weeks: dict[date, dict[str, int]] = {}
    languages: dict[str, int] = {}
    publishers: dict[str, list] = {}  # name -> [articles, dated, first, latest]
    for name, category, published_at, language in rows:
        lang = (language or "").strip().lower() or "unknown"
        languages[lang] = languages.get(lang, 0) + 1
        totals[category] += 1
        stats = publishers.setdefault(name, [0, 0, None, None])
        stats[0] += 1
        if published_at is not None:
            day = colombo(published_at).date()
            week = day - timedelta(days=day.weekday())
            weeks.setdefault(week, dict.fromkeys(CATEGORIES, 0))[category] += 1
            stats[1] += 1
            stats[2] = day if stats[2] is None else min(stats[2], day)
            stats[3] = day if stats[3] is None else max(stats[3], day)

    timeline = []
    if weeks:
        week = min(weeks)
        while week <= max(weeks):  # keep empty weeks so scraping gaps stay visible
            counts = weeks.get(week, dict.fromkeys(CATEGORIES, 0))
            timeline.append(TimelineWeek(week_start=week, total=sum(counts.values()), counts=counts))
            week += timedelta(days=7)

    return AnalyticsInsights(
        date_from=date_from, date_to=date_to, total_articles=len(rows),
        categories=distribution(totals), timeline=timeline,
        languages=[LanguageCount(language=k, count=v) for k, v in sorted(
            languages.items(), key=lambda item: (-item[1], item[0]))],
        publishers=[
            PublisherFreshness(
                source_name=name, article_count=s[0], dated_articles=s[1],
                first_published=s[2], latest_published=s[3],
            ) for name, s in sorted(publishers.items(), key=lambda item: (-item[1][0], item[0]))
        ],
    )


LEAN = {"far_left": -2, "left": -1, "center": 0, "right": 1, "far_right": 2}
MIN_PAIR_EVENTS = 3


@router.get("/stories", response_model=AnalyticsStories)
def stories(
    response: Response,
    date_from: date | None = None,
    date_to: date | None = None,
    source: list[str] | None = Query(default=None, max_length=50),
    bias_label: BiasCategory | None = None,
    limit: int = Query(default=10, ge=1, le=30),
    db: Session = Depends(get_db),
) -> AnalyticsStories:
    """Events covered by two or more publishers: how far apart their predicted leans are."""
    response.headers["Cache-Control"] = "no-store"
    if date_from and date_to and date_from > date_to:
        raise HTTPException(status_code=422, detail="Start date must not be after end date")
    _, label, conditions = filter_conditions(source, bias_label)
    if date_from:
        conditions.append(Article.published_at >= datetime.combine(date_from, time.min, COLOMBO))
    if date_to:
        conditions.append(Article.published_at <= datetime.combine(date_to, time.max, COLOMBO))
    rows = db.execute(
        select(Article.event_id, Article.source_name, label, Article.title, Article.published_at)
        .where(*conditions, Article.event_id.is_not(None))
    ).all()

    events: dict[str, dict[str, list[int]]] = {}
    headlines: dict[str, tuple] = {}
    for event_id, name, category, title, published_at in rows:
        if category not in LEAN:
            continue  # unclassified articles have no position on the spectrum
        key = str(event_id)
        events.setdefault(key, {}).setdefault(name, []).append(LEAN[category])
        # The earliest article gives the story its headline; undated ones sort last.
        when = colombo(published_at).timestamp() if published_at else float("inf")
        if key not in headlines or when < headlines[key][0]:
            headlines[key] = (when, title)

    cards, gaps = [], {}
    shared = unanimous = 0
    for key, by_source in events.items():
        if len(by_source) < 2:
            continue
        shared += 1
        leans = {name: sum(v) / len(v) for name, v in by_source.items()}
        spread = max(leans.values()) - min(leans.values())
        unanimous += spread == 0
        cards.append(DividedStory(
            event_id=key, headline=headlines[key][1].strip(), spread=round(spread, 3),
            dots=[StoryDot(source_name=n, lean=round(leans[n], 3), articles=len(by_source[n]))
                  for n in sorted(leans, key=lambda n: (leans[n], n))],
        ))
        for a, b in combinations(sorted(leans), 2):
            total = gaps.setdefault((a, b), [0, 0.0, 0])
            total[0] += 1
            total[1] += abs(leans[a] - leans[b])
            total[2] += abs(leans[a] - leans[b]) >= 1
    cards.sort(key=lambda c: (-c.spread, -len(c.dots), c.event_id))
    return AnalyticsStories(
        date_from=date_from, date_to=date_to, shared_events=shared, unanimous_events=unanimous,
        min_pair_events=MIN_PAIR_EVENTS, stories=cards[:limit],
        pairs=[PublisherPair(source_a=a, source_b=b, shared_events=n, differing_events=differing,
                             mean_gap=round(total / n, 3))
               for (a, b), (n, total, differing) in sorted(gaps.items())],
    )
