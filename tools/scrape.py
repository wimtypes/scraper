#!/usr/bin/env python3
"""
tools/scrape.py
Layer 3 Tool — Newsletter RSS Scraper
B.L.A.S.T. Protocol | AI Pulse Dashboard

Fetches articles from:
  - Ben's Bites (Substack RSS)
  - The Rundown AI (Beehiiv RSS)

Filters to last 24 hours, deduplicates by URL hash,
and writes canonical JSON to .tmp/articles.json.
"""

import hashlib
import json
import os
import sys
import time
from datetime import datetime, timezone, timedelta
from pathlib import Path

try:
    import feedparser
    import requests
except ImportError:
    print("ERROR: Missing dependencies. Run: pip install feedparser requests", file=sys.stderr)
    sys.exit(1)

# ── Configuration ────────────────────────────────────────────────────────────
ROOT = Path(__file__).parent.parent
TMP_DIR = ROOT / ".tmp"
OUTPUT_FILE = TMP_DIR / "articles.json"
REFETCH_COOLDOWN_MINUTES = 5  # Don't re-fetch if last scrape was <5 min ago

SOURCES = [
    {
        "id": "bens_bites",
        "label": "Ben's Bites",
        "url": "https://bensbites.substack.com/feed",
        "color": "#f97316",  # orange
        "emoji": "🍪",
    },
    {
        "id": "the_rundown_ai",
        "label": "The Rundown AI",
        "url": "https://rss.beehiiv.com/feeds/2R3C6Bt5wj.xml",
        "color": "#6366f1",  # indigo
        "emoji": "⚡",
    },
]

HEADERS = {
    "User-Agent": "Mozilla/5.0 (compatible; AIPulseDashboard/1.0; +https://github.com/ai-pulse)",
    "Accept": "application/rss+xml, application/xml, text/xml, */*",
}


# ── Helpers ──────────────────────────────────────────────────────────────────
def url_to_id(url: str) -> str:
    """Deterministic surrogate key: SHA-256 of article URL."""
    return hashlib.sha256(url.encode("utf-8")).hexdigest()[:16]


def parse_date(entry) -> datetime | None:
    """Extract a timezone-aware datetime from a feedparser entry."""
    # feedparser normalizes published_parsed into time.struct_time (UTC)
    if hasattr(entry, "published_parsed") and entry.published_parsed:
        return datetime(*entry.published_parsed[:6], tzinfo=timezone.utc)
    if hasattr(entry, "updated_parsed") and entry.updated_parsed:
        return datetime(*entry.updated_parsed[:6], tzinfo=timezone.utc)
    return None


def get_summary(entry) -> str:
    """Best-effort summary extraction from feedparser entry."""
    # Try content first (Beehiiv puts full HTML here)
    if hasattr(entry, "content") and entry.content:
        raw = entry.content[0].get("value", "")
        # Strip HTML tags naively for a plain-text preview
        import re
        clean = re.sub(r"<[^>]+>", " ", raw)
        clean = re.sub(r"\s+", " ", clean).strip()
        return clean[:400] + ("…" if len(clean) > 400 else "")
    # Fallback to summary/description
    if hasattr(entry, "summary") and entry.summary:
        import re
        clean = re.sub(r"<[^>]+>", " ", entry.summary)
        clean = re.sub(r"\s+", " ", clean).strip()
        return clean[:400] + ("…" if len(clean) > 400 else "")
    return ""


def should_skip_refetch() -> bool:
    """Return True if we scraped recently enough to skip."""
    if not OUTPUT_FILE.exists():
        return False
    try:
        data = json.loads(OUTPUT_FILE.read_text(encoding="utf-8"))
        last = datetime.fromisoformat(data.get("scraped_at", ""))
        if last.tzinfo is None:
            last = last.replace(tzinfo=timezone.utc)
        age_minutes = (datetime.now(timezone.utc) - last).total_seconds() / 60
        if age_minutes < REFETCH_COOLDOWN_MINUTES:
            print(f"Skipping fetch — last scrape was {age_minutes:.1f} min ago (cooldown: {REFETCH_COOLDOWN_MINUTES} min)")
            return True
    except Exception:
        pass
    return False


# ── Core Scraper ─────────────────────────────────────────────────────────────
def fetch_source(source: dict, cutoff: datetime) -> list[dict]:
    """Fetch and parse one RSS source. Returns list of Article dicts."""
    print(f"\nFetching {source['label']} ({source['url']})...")
    articles = []

    try:
        resp = requests.get(source["url"], headers=HEADERS, timeout=15)
        resp.raise_for_status()
    except Exception as e:
        print(f"  FETCH ERROR: {e}", file=sys.stderr)
        return []

    feed = feedparser.parse(resp.text)
    entries = feed.entries

    if not entries:
        print(f"  No entries found in feed.")
        return []

    scraped_at = datetime.now(timezone.utc).isoformat()
    skipped_old = 0
    skipped_no_title = 0

    for entry in entries:
        title = getattr(entry, "title", "").strip()
        if not title:
            skipped_no_title += 1
            continue

        url = getattr(entry, "link", "").strip()
        if not url:
            continue

        pub_date = parse_date(entry)
        if pub_date is None:
            # Use scraped_at as fallback
            print(f"  No publish date for: '{title}' — using scraped_at")
            pub_date = datetime.now(timezone.utc)

        # 24-hour filter
        if pub_date < cutoff:
            skipped_old += 1
            continue

        summary = get_summary(entry)

        # Tags from feedparser categories
        tags = []
        if hasattr(entry, "tags"):
            tags = [t.get("term", "") for t in entry.tags if t.get("term")]

        articles.append({
            "id": url_to_id(url),
            "source": source["id"],
            "source_label": source["label"],
            "source_color": source["color"],
            "source_emoji": source["emoji"],
            "title": title,
            "summary": summary,
            "url": url,
            "published_at": pub_date.isoformat(),
            "scraped_at": scraped_at,
            "tags": tags,
            "saved": False,
        })

    print(f"  Found {len(articles)} articles (skipped {skipped_old} old, {skipped_no_title} no-title)")
    return articles


def scrape_all() -> dict:
    """Main scrape orchestrator."""
    now = datetime.now(timezone.utc)
    cutoff = now - timedelta(hours=24)

    print(f"Scraping at {now.strftime('%Y-%m-%d %H:%M:%S UTC')}")
    print(f"24h cutoff: {cutoff.strftime('%Y-%m-%d %H:%M:%S UTC')}")

    all_articles = []
    seen_ids = set()

    for i, source in enumerate(SOURCES):
        articles = fetch_source(source, cutoff)
        for article in articles:
            if article["id"] not in seen_ids:
                all_articles.append(article)
                seen_ids.add(article["id"])
        if i < len(SOURCES) - 1:
            time.sleep(1)  # Rate limit between sources

    # Sort by published_at descending
    all_articles.sort(key=lambda a: a["published_at"], reverse=True)

    return {
        "scraped_at": now.isoformat(),
        "cutoff_hours": 24,
        "total": len(all_articles),
        "articles": all_articles,
    }


# ── Entry Point ───────────────────────────────────────────────────────────────
def main():
    # Check cooldown
    if should_skip_refetch():
        data = json.loads(OUTPUT_FILE.read_text(encoding="utf-8"))
        print(f"Returning cached data: {data['total']} articles")
        return data

    # Ensure .tmp/ exists
    TMP_DIR.mkdir(parents=True, exist_ok=True)

    # Scrape
    result = scrape_all()

    # Write output
    OUTPUT_FILE.write_text(json.dumps(result, indent=2, ensure_ascii=False), encoding="utf-8")
    print(f"\nDone. {result['total']} articles written to {OUTPUT_FILE}")
    return result


if __name__ == "__main__":
    main()
