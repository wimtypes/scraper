# 🗂️ SOP-01: Newsletter RSS Scraper

**Version:** 1.0
**Tool:** `tools/scrape.py`
**Status:** Active

---

## Goal
Fetch the latest AI newsletter articles from two RSS feeds, filter to the last 24 hours, and output a canonical `articles.json` file to `.tmp/`.

## Inputs
| Input | Type | Description |
|---|---|---|
| None | — | Script is self-contained; reads from hardcoded RSS feed URLs |

## Outputs
| Output | Location | Format |
|---|---|---|
| Scraped articles | `.tmp/articles.json` | JSON (see schema in `gemini.md`) |

## Sources
| Source | Feed URL | Platform |
|---|---|---|
| Ben's Bites | `https://bensbites.substack.com/feed` | Substack (Atom/RSS) |
| The Rundown AI | `https://rss.beehiiv.com/feeds/2R3C6Bt5wj.xml` | Beehiiv (RSS) |

## Logic Steps
1. For each source, fetch the RSS XML via `requests` with a User-Agent header.
2. Parse XML using `feedparser`.
3. For each entry, extract: `title`, `link`, `published`, `summary`.
4. Filter: only keep entries where `published_at >= now - 24h`.
5. Deduplicate: hash the URL with SHA-256 to produce `id`.
6. Normalize output into canonical Article schema.
7. Write `{ scraped_at, articles: [...] }` to `.tmp/articles.json`.

## Error Handling
- If a feed is unreachable: log error to stderr, continue with other feeds (do NOT crash).
- If `published` field is missing: use `scraped_at` as fallback (log a warning).
- If `.tmp/` directory does not exist: create it automatically.

## Rate Limiting
- Add a 1-second delay between each feed fetch.
- Do not re-fetch within 5 minutes (check `scraped_at` in existing `.tmp/articles.json`).

## Known Constraints
- Substack RSS (`bensbites.substack.com/feed`) returns Atom XML — `feedparser` handles both.
- Beehiiv RSS includes full article HTML in `<content:encoded>` — use `entry.content[0].value` if summary is empty.
- Some Beehiiv entries may be promotional — filter these by checking if `title` is empty.
