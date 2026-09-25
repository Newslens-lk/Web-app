from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.router import api_router
from app.core.config import get_settings
from app.core.security import hash_password
from app.db.session import engine
from app.models.user import User  # noqa: F401

settings = get_settings()

app = FastAPI(title="NewsLens API", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router, prefix="/api")


@app.on_event("startup")
def create_auth_tables() -> None:
    # The project does not yet have a migration system. Only the new auth table
    # is created here; existing pipeline tables are left untouched.
    User.__table__.create(bind=engine, checkfirst=True)
    if settings.admin_email and settings.admin_password:
        from sqlalchemy import select

        from app.db.session import SessionLocal

        with SessionLocal() as db:
            admin_email = settings.admin_email.strip().lower()
            admin = db.scalar(select(User).where(User.email == admin_email))
            if not admin:
                db.add(
                    User(
                        email=admin_email,
                        display_name=settings.admin_display_name,
                        password_hash=hash_password(settings.admin_password),
                        role="admin",
                    )
                )
                db.commit()
