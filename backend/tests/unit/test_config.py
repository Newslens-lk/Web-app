"""Unit tests for app.core.config — §3.1.8 of the test plan.

Two separate concerns get tested here:
  1. Does Settings actually resolve values correctly (defaults, env var
     overrides, the derived database_url/cors_origin_list properties)?
  2. Does get_settings()'s @lru_cache behave the way the rest of the app
     assumes it does — and can a test safely clear it without breaking
     every other test that runs after it?

Note: Settings normally reads backend/.env by default (env_file=".env" in
its model_config). Passing `_env_file=None` when constructing Settings
directly bypasses that, so these tests see pure code-level defaults
instead of accidentally picking up whatever's in this machine's real
.env file — otherwise "defaults" tests would be lying depending on who
runs them.
"""
from app.core.config import Settings, get_settings


def test_defaults_are_used_when_no_env_or_dotenv_present():
    settings = Settings(_env_file=None)

    assert settings.db_host == "news-db"
    assert settings.db_port == 5432
    assert settings.admin_api_key == "changeme"
    assert settings.cors_origins == "http://localhost:3000"


def test_database_url_is_built_from_the_individual_db_fields():
    settings = Settings(
        _env_file=None,
        db_user="news",
        db_password="news",
        db_host="localhost",
        db_port=5433,
        db_name="news_pipeline_test",
    )

    assert settings.database_url == "postgresql+psycopg://news:news@localhost:5433/news_pipeline_test"


def test_cors_origin_list_splits_strips_and_drops_empty_entries():
    settings = Settings(
        _env_file=None, cors_origins="http://localhost:3000, https://example.com ,,"
    )

    assert settings.cors_origin_list == ["http://localhost:3000", "https://example.com"]


def test_cors_origin_list_handles_a_single_origin():
    settings = Settings(_env_file=None, cors_origins="http://localhost:3000")

    assert settings.cors_origin_list == ["http://localhost:3000"]


def test_environment_variables_override_defaults(monkeypatch):
    monkeypatch.setenv("DB_HOST", "custom-host-from-env")

    settings = Settings(_env_file=None)

    assert settings.db_host == "custom-host-from-env"


# ---------------------------------------------------------------------------
# get_settings() caching behavior — the thing flagged as a real risk in the
# test plan (§5): a stale lru_cache could leak config between tests.
# ---------------------------------------------------------------------------


def test_get_settings_returns_the_same_cached_instance():
    first = get_settings()
    second = get_settings()

    # Not just equal — the exact same object, since every module in the
    # app (admin.py, stats.py, ...) relies on this being one shared
    # singleton rather than a fresh Settings() per call.
    assert first is second


def test_cache_clear_lets_a_test_safely_pick_up_new_env_vars(monkeypatch):
    original = get_settings()

    monkeypatch.setenv("ADMIN_API_KEY", "temporary-test-key")
    get_settings.cache_clear()
    updated = get_settings()

    assert updated.admin_api_key == "temporary-test-key"
    assert updated is not original

    # Restore real settings for every test that runs after this one —
    # without this, get_settings() would keep returning a Settings
    # instance built from an env var monkeypatch already reverted.
    get_settings.cache_clear()
