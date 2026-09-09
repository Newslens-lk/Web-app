from fastapi import APIRouter

from app.api import admin, articles, events, health, sources, stats

api_router = APIRouter()
api_router.include_router(health.router)
api_router.include_router(events.router)
api_router.include_router(articles.router)
api_router.include_router(sources.router)
api_router.include_router(stats.router)
api_router.include_router(admin.router)
