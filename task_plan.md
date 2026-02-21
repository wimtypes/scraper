# 📋 task_plan.md — Master Task Plan

> Living document. Updated after every meaningful action.

---

## 🎯 North Star Goal
> ⚠️ PENDING — To be defined after Discovery Q1.

---

## 🔖 Phase Checklist

### Protocol 0: Initialization ✅
- [x] Create `gemini.md`
- [x] Create `task_plan.md`
- [x] Create `findings.md`
- [x] Create `progress.md`
- [ ] Answer 5 Discovery Questions 
- [ ] Research scraping methods for each source 
    %%awesome, i want these website: https://www.therundown.ai/%%
- [ ] Confirm Data Schema in `gemini.md`
- [ ] Get Blueprint approval

---

### Phase 1: B — Blueprint 🟡 IN PROGRESS
- [ ] Discovery Q1: North Star outcome
- [ ] Discovery Q2: Integrations & API keys
- [ ] Discovery Q3: Source of Truth (data location)
- [ ] Discovery Q4: Delivery Payload (output destination)
- [ ] Discovery Q5: Behavioral rules / constraints
- [ ] Define JSON Input shape in `gemini.md`
- [ ] Define JSON Output/Payload shape in `gemini.md`
- [ ] Research relevant GitHub repos / libraries
- [ ] Blueprint approved by user

---

### Phase 2: L — Link ⬜ NOT STARTED
- [ ] Verify `.env` credentials exist and are valid
- [ ] Build minimal handshake scripts in `tools/`
- [ ] All external services confirmed responding

---

### Phase 3: A — Architect ⬜ NOT STARTED
- [ ] Write SOPs in `architecture/`
- [ ] Build Layer 3 tools in `tools/`
- [ ] Run end-to-end test
- [ ] Self-annealing repair loop complete (all errors resolved)

---

### Phase 4: S — Stylize ⬜ NOT STARTED
- [ ] Format output payload (Slack blocks / Notion / CSV / etc.)
- [ ] Build UI/dashboard if required
- [ ] User reviews stylized result

---

### Phase 5: T — Trigger ⬜ NOT STARTED
- [ ] Move to cloud / production environment
- [ ] Set up automation trigger (Cron / Webhook / Listener)
- [ ] Finalize Maintenance Log in `gemini.md`

---

## 📁 Planned File Structure
```
├── gemini.md            # Project Constitution
├── .env                 # API Keys/Secrets
├── task_plan.md         # This file
├── findings.md          # Research & discoveries
├── progress.md          # Run log & errors
├── architecture/        # Layer 1: SOPs
├── tools/               # Layer 3: Python tools
└── .tmp/                # Ephemeral intermediates
```
