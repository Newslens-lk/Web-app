from app.preprocessing.cleaning import clean_text


def test_clean_text_strips_html_and_collapses_whitespace() -> None:
    raw = "<p>Hello   <b>world</b></p>\n\n  test"
    assert clean_text(raw) == "Hello world test"
