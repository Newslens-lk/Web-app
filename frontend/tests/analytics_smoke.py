"""Local browser smoke test (running app with article data required).

uv run --with playwright python frontend/tests/analytics_smoke.py
Uses installed Edge; set ANALYTICS_BROWSER_CHANNEL for another Playwright channel.
Only connects to localhost. No login or credentials required.
"""

import os
from pathlib import Path

from playwright.sync_api import expect, sync_playwright

root = Path(__file__).resolve().parents[2]
artifacts = root / "frontend" / "test-results"
artifacts.mkdir(exist_ok=True)

with sync_playwright() as p:
    browser = p.chromium.launch(channel=os.getenv("ANALYTICS_BROWSER_CHANNEL", "msedge"))
    context = browser.new_context(viewport={"width": 1280, "height": 900})
    page = context.new_page()
    errors = []
    page.on("pageerror", lambda error: errors.append(str(error)))
    page.goto("http://localhost:3000/analytics")
    expect(page).to_have_url("http://localhost:3000/analytics")
    expect(page.get_by_role("heading", name="How publishers cover the news")).to_be_visible()
    expect(page.locator("canvas")).to_have_count(2)
    page.wait_for_function("""() => [...document.querySelectorAll('canvas')].every(c => {
        const pixels = c.getContext('2d').getImageData(0, 0, c.width, c.height).data;
        return pixels.some((v, i) => i % 4 === 3 && v > 0);
    })""")
    page.screenshot(path=str(artifacts / "analytics-desktop.png"), full_page=True)
    page.get_by_label("Lankadeepa", exact=True).check()
    page.get_by_role("button", name="Apply filters").click()
    expect(page).to_have_url("http://localhost:3000/analytics?date_from=&date_to=&bias_label=&source=lankadeepa")
    expect(page.get_by_role("table").nth(1).locator("tbody tr")).to_have_count(1)
    page.get_by_label("Published from").fill("2099-01-01")
    page.get_by_role("button", name="Apply filters").click()
    expect(page.get_by_text("No articles match these filters.", exact=False)).to_be_visible()
    page.get_by_role("link", name="Reset", exact=True).click()
    expect(page.locator("canvas")).to_have_count(2)
    expect(page.get_by_label("Lankadeepa", exact=True)).not_to_be_checked()
    expect(page.get_by_label("Published from")).to_have_value("")
    page.set_viewport_size({"width": 390, "height": 844})
    expect(page.get_by_role("heading", name="Publisher comparison")).to_be_visible()
    page.wait_for_function("document.documentElement.scrollWidth <= window.innerWidth")
    page.screenshot(path=str(artifacts / "analytics-mobile.png"), full_page=True)
    overflow = page.evaluate("""() => [...document.querySelectorAll('main *')]
        .filter(e => e.getBoundingClientRect().right > innerWidth + 1)
        .slice(0, 12).map(e => ({tag: e.tagName, classes: e.className,
            width: e.getBoundingClientRect().width}))""")
    assert page.evaluate("document.documentElement.scrollWidth <= window.innerWidth"), overflow
    assert not errors, errors
    browser.close()
    print("PASS: public access, charts, source filter, empty state, reset, mobile layout")
