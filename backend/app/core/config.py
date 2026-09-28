from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    environment: str = "development"

    db_host: str = "news-db"
    db_port: int = 5432
    db_name: str = "news_pipeline"
    db_user: str = "news"
    db_password: str = "news"

    cors_origins: str = "http://localhost:3000"

    airflow_base_url: str = "http://airflow-apiserver:8080"
    airflow_user: str = "airflow"
    airflow_password: str = "airflow"

    admin_api_key: str = "changeme"
    admin_email: str = ""
    admin_password: str = ""
    admin_display_name: str = "NewsLens Admin"
    auth_secret: str = "change-this-auth-secret"

    # Transactional email over SMTP (Gmail by default). With no username or
    # password the app logs the message instead of sending it, so the backend
    # runs without credentials and development never mails a real person by
    # accident.
    smtp_host: str = "smtp.gmail.com"
    smtp_port: int = 587
    smtp_user: str = ""
    smtp_password: str = ""
    # Display name beside the sender address. Gmail rewrites the address itself
    # to the authenticated account, so only the name here is ours to choose.
    email_from_name: str = "NewsLens"
    # Where "visit the site" links in emails point.
    site_url: str = "http://localhost:3000"

    @property
    def database_url(self) -> str:
        return f"postgresql+psycopg://{self.db_user}:{self.db_password}@{self.db_host}:{self.db_port}/{self.db_name}"

    @property
    def cors_origin_list(self) -> list[str]:
        return [o.strip() for o in self.cors_origins.split(",") if o.strip()]


@lru_cache
def get_settings() -> Settings:
    return Settings()
