from fastapi import APIRouter

from app.api import admin, analytics, articles, auth, events, health, sources, stats, summarization

api_router = APIRouter()
api_router.include_router(health.router)
api_router.include_router(events.router)
api_router.include_router(articles.router)
api_router.include_router(sources.router)
api_router.include_router(stats.router)
api_router.include_router(admin.router)
api_router.include_router(auth.router)
api_router.include_router(analytics.router)
api_router.include_router(summarization.router)
