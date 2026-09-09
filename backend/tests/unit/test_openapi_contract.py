"""API contract tests — §3.1.3 of the test plan.

The frontend's frontend/src/lib/types.ts hand-duplicates these response
shapes in TypeScript; nothing generates one from the other. These tests
lock in each schema's exact field set against what the frontend actually
expects, so an accidental rename/removal in a Pydantic schema fails here
instead of silently breaking the frontend at runtime.

Also confirms every documented endpoint is present, and that FastAPI's
OpenAPI generation itself doesn't fail outright (e.g. a bad response_model
annotation can break /openapi.json entirely, taking the interactive docs
down with it).
"""
import pytest


@pytest.fixture
def openapi_schema(client):
    response = client.get("/openapi.json")
    assert response.status_code == 200
    return response.json()


def schema_fields(openapi_schema, component_name):
    return set(openapi_schema["components"]["schemas"][component_name]["properties"].keys())


def test_openapi_schema_is_generated_successfully(openapi_schema):
    assert "paths" in openapi_schema
    assert "components" in openapi_schema


EXPECTED_PATHS = {
    "/api/health",
    "/api/articles",
    "/api/articles/{article_id}",
    "/api/articles/{article_id}/similar",
    "/api/events",
    "/api/events/{event_id}",
    "/api/sources",
    "/api/stats",
    "/api/admin/pipeline/trigger",
    "/api/admin/pipeline/status",
    "/api/admin/pipeline/history",
}


def test_every_documented_endpoint_is_present(openapi_schema):
    actual_paths = set(openapi_schema["paths"].keys())

    missing = EXPECTED_PATHS - actual_paths
    assert not missing, f"Endpoints missing from the OpenAPI schema: {missing}"


# ---------------------------------------------------------------------------
# Field-set contract checks, one per schema the frontend depends on.
# Each expected set below mirrors a type in frontend/src/lib/types.ts —
# keep them in sync by hand until these two sides are ever generated
# from one source of truth.
# ---------------------------------------------------------------------------


def test_article_summary_matches_the_frontend_contract(openapi_schema):
    assert schema_fields(openapi_schema, "ArticleSummary") == {
        "article_id", "source_name", "url", "title",
        "published_at", "bias_label", "bias_confidence", "event_id",
    }


def test_article_detail_matches_the_frontend_contract(openapi_schema):
    assert schema_fields(openapi_schema, "ArticleDetail") == {
        "article_id", "source_name", "url", "title", "body", "language",
        "published_at", "scraped_at", "bias_label", "bias_confidence",
        "bias_scores", "event_id",
    }


def test_similar_article_matches_the_frontend_contract(openapi_schema):
    assert schema_fields(openapi_schema, "SimilarArticle") == {
        "article_id", "title", "source_name", "published_at", "bias_label", "distance",
    }


def test_event_summary_matches_the_frontend_contract(openapi_schema):
    assert schema_fields(openapi_schema, "EventSummary") == {
        "event_id", "summary", "topic", "article_count", "source_count",
        "window_start", "window_end", "created_at", "representative_title", "sources",
    }


def test_event_detail_matches_the_frontend_contract(openapi_schema):
    assert schema_fields(openapi_schema, "EventDetail") == {
        "event_id", "summary", "topic", "article_count", "source_count",
        "window_start", "window_end", "articles", "bias_distribution",
    }


def test_article_in_event_matches_the_frontend_contract(openapi_schema):
    assert schema_fields(openapi_schema, "ArticleInEvent") == {
        "article_id", "source_name", "url", "title", "body",
        "published_at", "bias_label", "bias_confidence", "bias_scores",
    }


def test_source_info_matches_the_frontend_contract(openapi_schema):
    assert schema_fields(openapi_schema, "SourceInfo") == {
        "source_name", "source_type", "article_count", "latest_article_at",
    }


def test_stats_matches_the_frontend_contract(openapi_schema):
    assert schema_fields(openapi_schema, "Stats") == {
        "total_articles", "total_events", "total_sources", "articles_today",
        "events_today", "bias_breakdown", "articles_per_source", "last_pipeline_run",
    }


def test_pipeline_run_matches_the_frontend_contract(openapi_schema):
    assert schema_fields(openapi_schema, "PipelineRun") == {
        "dag_run_id", "state", "start_date", "end_date", "tasks",
    }
