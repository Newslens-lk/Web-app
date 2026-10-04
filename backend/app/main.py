import logging

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.router import api_router
from app.core.config import get_settings
from app.core.security import hash_password
from app.db.session import engine
from app.models.user import User  # noqa: F401

settings = get_settings()

# Uvicorn only attaches handlers to its own loggers, so without this the
# application's own log records are discarded — including the email body that
# app.core.email writes when no mail credentials are configured. basicConfig is a
# no-op if the root logger already has a handler, so it will not fight a
# hosting environment that sets up its own.
logging.basicConfig(level=logging.INFO, format="%(levelname)s:     %(name)s - %(message)s")

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
    # Article records are owned by the pipeline database. Add this nullable
    # column without changing or replacing the existing table.
    from sqlalchemy import text

    with engine.begin() as connection:
        connection.execute(text("ALTER TABLE articles ADD COLUMN IF NOT EXISTS image_url TEXT"))
        connection.execute(text("ALTER TABLE events ADD COLUMN IF NOT EXISTS representative_title TEXT"))
        # create() above skips a users table that already exists, so a column
        # added after the first deployment needs this too.
        connection.execute(
            text(
                "ALTER TABLE users ADD COLUMN IF NOT EXISTS "
                "locale VARCHAR(5) NOT NULL DEFAULT 'en'"
            )
        )
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
