"""Unit tests for app.api.events._build_bias_distribution.

Pure function, no DB, no FastAPI — the easiest possible starting point.
"""
from types import SimpleNamespace

from app.api.events import _build_bias_distribution

ALL_ZERO = {"far_left": 0, "left": 0, "center": 0, "right": 0, "far_right": 0}


def make_article(bias_label):
    """A minimal stand-in for an Article ORM object.

    _build_bias_distribution only ever reads `.bias_label`, so a real
    Article instance (which would need a DB session to construct properly)
    is unnecessary here — SimpleNamespace gives us just that one attribute.
    """
    return SimpleNamespace(bias_label=bias_label)


def test_counts_a_normal_mix_of_known_labels():
    articles = [
        make_article("left"),
        make_article("left"),
        make_article("center"),
        make_article("right"),
    ]

    result = _build_bias_distribution(articles)

    assert result.model_dump() == {
        "far_left": 0,
        "left": 2,
        "center": 1,
        "right": 1,
        "far_right": 0,
    }


def test_none_label_is_not_counted():
    articles = [make_article(None)]

    result = _build_bias_distribution(articles)

    assert result.model_dump() == ALL_ZERO


def test_unrecognized_label_is_ignored():
    articles = [make_article("nonsense")]

    result = _build_bias_distribution(articles)

    assert result.model_dump() == ALL_ZERO


def test_label_matching_is_case_insensitive():
    articles = [make_article("LEFT"), make_article("Left")]

    result = _build_bias_distribution(articles)

    assert result.left == 2


def test_empty_list_gives_an_all_zero_distribution():
    result = _build_bias_distribution([])

    assert result.model_dump() == ALL_ZERO
