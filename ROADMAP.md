# Planify V2 — Product Roadmap

> **Strategic Position**: EirePlan owns policy/workflow (RAG, validation, drafting).
> Planify owns **ground truth** — what was actually granted, refused, built, sold.
> Build the Planning Intelligence Workspace that enterprise architects & planners live in.

---

## The Competition

| | EirePlan | Planify |
|---|---|---|
| Policy RAG (dev plans) | ✅ | ❌ (Sprint 4) |
| Validation shield | ✅ | ❌ (Sprint 4) |
| AI drafting | ✅ | ❌ (Sprint 4) |
| Real application outcomes | ❌ | ✅ |
| BCMS commencement data | ❌ | ✅ |
| PPR property sales | ❌ | ✅ |
| Heatmap / spatial analytics | ❌ | ✅ |
| Alert monitoring at scale | ❌ | ✅ |
| Pricing | €139/seat/mo | TBD |

---

## Sprint 1 — Complete the Core
> **Goal**: Every feature that exists must work end-to-end. No broken tabs, no placeholder pages.
> An enterprise prospect can demo the product without hitting a dead end.

### 1.1 Application Detail — Full 8-Tab Experience
> **Status**: ✅ DONE

| Task | Status |
|------|--------|
| Remove hardcoded fake AI/sentiment data from Overview | ✅ Done |
| Replace with real Development Description + Scale metrics | ✅ Done |
| Add Marker pin to Google Maps view | ✅ Done |
| Enhance zoning card with description + plan name | ✅ Done |
| Fix Related tab to navigate internally (not open council site) | ✅ Done |
| Rename "Prices" tab to "Nearby Sales" | ✅ Done |

---

### 1.2 Alerts — Full CRUD + Inbox
> **Status**: ✅ DONE

| Task | Status |
|------|--------|
| Create alert mutations wired (all 3 scopes) | ✅ Done |
| Delete alert wired | ✅ Done |
| Alerts list page: real data, loading/empty states | ✅ Done |
| AlertWizard: address geocoding for radius alerts | ✅ Done |
| Inbox: mark read/unread, star, archive — all wired | ✅ Done |
| Inbox: bulk select + bulk actions (read, star, archive) | ✅ Done |
| Inbox: tab filtering (all / unread / starred / archived) | ✅ Done |
| Inbox: pagination | ✅ Done |
| Inbox: StatusBadge bug fixed (was rendering nothing) | ✅ Done |
| Cache invalidation: archive/bulk now updates unread badge | ✅ Done |
| Sidebar unread badge: polls every 30s via useUnreadCount | ✅ Done |

---

### 1.3 Billing / Stripe
> **Status**: ⬜ TODO

| Task | Status |
|------|--------|
| Billing page shows current plan + usage summary | ⬜ Todo |
| "Manage Billing" → redirect to Stripe portal | ⬜ Todo |
| Pricing plans page CTAs trigger entrypoint for unpaid users | ⬜ Todo |
| Paywall modal blocks gated features with upgrade CTA | ⬜ Todo |

---

## Sprint 2 — The Differentiator: Projects Workspace
> **Goal**: Transform Planify from a search tool into a professional workspace.
> An architect creates a Project around a site. Everything flows from it.
> This is what EirePlan calls a "Planning Hub" — we build it better with real data.

| Task | Status |
|------|--------|
| `/projects` — project list page (create, list, delete) | ⬜ Todo |
| `/projects/[id]` — project workspace shell with tabs | ⬜ Todo |
| Site Intelligence tab: zoning, nearby apps, commencements, sales | ⬜ Todo |
| Monitored Applications tab: pinned applications for this project | ⬜ Todo |
| Alerts tab: radius alert scoped to project site | ⬜ Todo |
| Notes tab: client-side notes per project | ⬜ Todo |
| "Add to Project" button on Application Detail page | ⬜ Todo |
| Project persistence strategy (user_locations + favourites API) | ⬜ Todo |

---

## Sprint 3 — AI Intelligence Layer
> **Goal**: Grounded AI that answers questions no other tool can answer.
> Not a chatbot. Context-aware. Backed exclusively by real Irish planning outcomes.
> "What % of residential extensions in Fingal were refused in the last 2 years?"

| Task | Status |
|------|--------|
| AI Research Assistant panel (embedded in Projects + Application Detail) | ⬜ Todo |
| Wire to existing `/applications/conversational` NLP endpoint | ⬜ Todo |
| Context injection: pass current site coordinates + authority to queries | ⬜ Todo |
| Suggested questions based on application type / location | ⬜ Todo |
| Commencement rate queries (BCMS data) | ⬜ Todo |
| Property value queries (PPR data) | ⬜ Todo |
| Citation display: show which applications back each answer | ⬜ Todo |

---

## Sprint 4 — Enterprise Scale + Policy Layer
> **Goal**: Full stack product. Compete with EirePlan on policy. Sell to large firms.

| Task | Status |
|------|--------|
| Organisation / team management (invite, roles, shared projects) | ⬜ Todo |
| Bulk export (CSV / PDF of application lists and site reports) | ⬜ Todo |
| API access tier for larger firms | ⬜ Todo |
| Policy RAG: index all 31 Irish local authority development plans | ⬜ Todo |
| AI can answer "What does the Fingal Dev Plan say about this zone?" | ⬜ Todo |
| Validation shield: flag missing documents pre-submission | ⬜ Todo |
| Planning statement drafting (AI-assisted, grounded in precedents) | ⬜ Todo |

---

## Architecture Constraints

- **Backend is locked** — no modifications to `/planify-backend/`. All features built on existing APIs.
- **Auth**: Clerk. All new routes go inside `src/app/(auth)/`.
- **State**: Zustand for UI state, TanStack Query for server state. Follow existing patterns.
- **Design**: Brand blue `#1270AF`, slate neutrals, `enterprise` aesthetic. No consumer-facing UI patterns.
- **No V1 changes** — V1 is being sunset. All work goes into `/Planify-V2/`.
