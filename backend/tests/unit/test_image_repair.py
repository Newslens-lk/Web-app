import json
import sys
from types import SimpleNamespace
from unittest.mock import MagicMock

import httpx

from scripts import backfill_article_images as repair

BAD_URL = "https://cdn.lk/image_8df7de9e07.png"


def setup_repair(monkeypatch, tmp_path, *extra):
    article = SimpleNamespace(article_id="a1", url="https://news.lk/story", image_url=BAD_URL)
    db = MagicMock()
    db.scalars.return_value = [article]
    session = MagicMock()
    session.__enter__.return_value = db
    monkeypatch.setattr(repair, "SessionLocal", lambda: session)
    backup = tmp_path / "repair.json"
    monkeypatch.setattr(sys, "argv", [
        "repair", "--source", "lankadeepa", "--replace-url", BAD_URL,
        "--backup", str(backup), *extra,
    ])
    return article, db, backup


def test_repair_targets_exact_url_and_backs_up_old_value(monkeypatch, tmp_path):
    article, db, backup = setup_repair(monkeypatch, tmp_path)
    monkeypatch.setattr(repair, "find_image_url", lambda *args: "https://news.lk/photo.jpg")
    repair.main()
    assert article.image_url == "https://news.lk/photo.jpg"
    saved = json.loads(backup.read_text())
    assert saved == [{
        "article_id": "a1", "old_image_url": BAD_URL,
        "new_image_url": "https://news.lk/photo.jpg",
    }]
    db.commit.assert_called_once()
    query = str(db.scalars.call_args.args[0].compile(compile_kwargs={"literal_binds": True}))
    assert f"articles.image_url = '{BAD_URL}'" in query
    assert "articles.source_name = 'lankadeepa'" in query


def test_dry_run_never_commits_or_writes_backup(monkeypatch, tmp_path):
    _, db, backup = setup_repair(monkeypatch, tmp_path, "--dry-run")
    monkeypatch.setattr(repair, "find_image_url", lambda *args: None)
    repair.main()
    db.commit.assert_not_called()
    db.rollback.assert_called_once()
    assert not backup.exists()


def test_page_timeout_preserves_stored_image(monkeypatch, tmp_path):
    article, db, backup = setup_repair(monkeypatch, tmp_path)

    def timeout(*args):
        raise httpx.ReadTimeout("timeout")

    monkeypatch.setattr(repair, "find_image_url", timeout)
    repair.main()
    assert article.image_url == BAD_URL
    db.commit.assert_not_called()
    assert not backup.exists()
