# 📜 gemini.md — Project Constitution
> **Law**: This file governs all data schemas, behavioral rules, and architectural invariants.
> Only update when a schema changes, a rule is added, or the architecture is modified.

---

## 🗂️ Project Identity
| Field | Value |
|---|---|
| **Project Name** | AI Pulse Dashboard |
| **System Pilot** | Antigravity — B.L.A.S.T. Protocol |
| **Initialized** | 2026-02-21 |
| **Status** | 🟢 Architect Phase — Building |

---

## 🏗️ Data Schema

### Article Object (Canonical Unit)
```json
{
  "id": "string (sha256 hash of url)",
  "source": "string (e.g. 'bens_bites' | 'the_rundown_ai')",
  "source_label": "string (e.g. \"Ben's Bites\" | \"The Rundown AI\")",
  "title": "string",
  "summary": "string | null",
  "url": "string",
  "published_at": "ISO 8601 datetime string",
  "scraped_at": "ISO 8601 datetime string",
  "tags": ["string"],
  "saved": false
}
```

### Scraper Output (`.tmp/articles.json`)
```json
{
  "scraped_at": "ISO 8601 datetime string",
  "articles": [Article, ...]
}
```

### localStorage Schema (Dashboard → browser)
```json
{
  "ai_pulse_articles": [Article, ...],
  "ai_pulse_saved_ids": ["id1", "id2", ...],
  "ai_pulse_last_fetch": "ISO 8601 datetime string"
}
```

---

## 📐 Architectural Invariants
1. LLMs decide; Python tools execute. Business logic is always deterministic.
2. All intermediate/temporary files live in `.tmp/`. They are ephemeral.
3. Secrets live **only** in `.env`. Never hardcode credentials.
4. A project is only **complete** when the payload reaches its final cloud destination.
5. If logic changes → update `architecture/*.md` SOP **before** changing code.
6. **24-hour filter**: Only articles published within the last 24 hours are surfaced.
7. **Deduplication**: Articles are keyed by SHA-256 hash of their URL. No duplicates.
8. **Saved articles persist**: Saved state is managed by localStorage; refreshing does NOT lose saves.

---

## 📏 Behavioral Rules
1. Show articles from the last 24 hours only. If none — show a "no new articles" empty state.
2. Saved articles persist across page refreshes via localStorage.
3. Rate-limit scraping: respect source servers (1 request/second minimum delay).
4. No paywalled content — only scrape publicly accessible articles/posts.
5. Dashboard auto-refreshes article data by re-running scraper server-side (later: via Supabase).
6. Design must be gorgeous, interactive, and premium. No generic or plain styling.

---

## 🔗 Integrations & Services
| Service | Purpose | Status | Details |
|---|---|---|---|
| Ben's Bites (Substack) | Newsletter scrape | ✅ Confirmed | RSS: `https://bensbites.substack.com/feed` |
| The Rundown AI (Beehiiv) | Newsletter scrape | ✅ Confirmed | RSS: `https://rss.beehiiv.com/feeds/2R3C6Bt5wj.xml` |
| Supabase | Cloud persistence (future) | 🔜 Phase 5 | Not yet configured |
| Reddit | AI subreddits (future) | 🔜 Phase 2+ | Not in scope for MVP |

---

## 🏗️ Phase 1 Architecture (MVP)
```
scraper/
├── gemini.md            # This file — Project Constitution
├── task_plan.md         # Phase checklist
├── findings.md          # Research journal
├── progress.md          # Run log
├── .env                 # (future) API keys
├── architecture/
│   └── 01_scraper_sop.md
├── tools/
│   └── scrape.py        # RSS scraper (Ben's Bites + Rundown AI)
├── dashboard/
│   ├── index.html       # Main dashboard
│   ├── style.css        # Premium CSS
│   ├── app.js           # Dashboard logic
│   └── server.py        # Simple HTTP server + /api/articles endpoint
└── .tmp/
    └── articles.json    # Scraped output (ephemeral)
```

---

## 🛠️ Maintenance Log
| Date | Change | Author |
|---|---|---|
| 2026-02-21 | Project initialized via B.L.A.S.T. Protocol 0 | System Pilot |
| 2026-02-21 | Discovery answers received. Schema defined. Blueprint approved. | System Pilot |
| 2026-02-21 | RSS feeds confirmed: Substack (Ben's Bites), Beehiiv (Rundown AI) | System Pilot |
