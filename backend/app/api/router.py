from fastapi import APIRouter

from app.api import articles, events, health, sources, stats, admin

api_router = APIRouter()
api_router.include_router(health.router)
api_router.include_router(events.router)
api_router.include_router(articles.router)
api_router.include_router(sources.router)
api_router.include_router(stats.router)
api_router.include_router(admin.router)
