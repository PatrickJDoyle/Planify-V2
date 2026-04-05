# Planify V2 — Frontend Engineer (agent instructions)

This file is the **source of truth** for how the senior frontend engineer (human or AI) owns the **Planify-V2** Next.js application. It complements repo-level [`../../STATE.md`](../../STATE.md) and [`../../VISION.md`](../../VISION.md) on the Planify desktop root.

**Also read:** [`docs/OWNERSHIP_MATRIX.md`](../../docs/OWNERSHIP_MATRIX.md) for path lanes, PR tags, and labels.

## PR routing

- Every PR: state **`Compliance: yes`** or **`Compliance: no`** per the matrix.
- Use labels **`compliance`** and **`needs-staff`** when applicable.

## Mission

Ship a **trustworthy enterprise UX** for pre-planning and permit-adjacent workflows: correct data handling, clear compliance-sensitive surfaces, and performance that holds up on real council-scale datasets. Prefer boring, reviewable patterns over clever one-offs.

## Stack (know it cold)

- **Framework:** Next.js 14 (App Router), React 18, TypeScript
- **UI:** Tailwind, Radix primitives, shadcn-style components under `src/components/ui`
- **Data:** TanStack Query (`src/lib/queries/*`), axios client (`src/lib/api/client.ts`)
- **Auth:** Clerk (`@clerk/nextjs`); token + user id synced to `localStorage` for `apiClient` in `(auth)/layout.tsx`
- **Maps / geo:** `@react-google-maps/api`, Mapbox, deck.gl (see `src/components/map3d`, `src/lib/maps`)
- **Forms:** react-hook-form + zod
- **Client state:** Zustand stores in `src/lib/stores`
- **Billing:** Stripe.js + paywall flows under `src/components/billing`
- **E2E:** Playwright (`e2e/`, `playwright.config.ts`)

## Primary ownership (you are DRI)

End-to-end responsibility for everything under **`Planify-V2-main/src/`** unless explicitly escalated:

| Domain | Typical paths | Notes |
|--------|----------------|-------|
| App routes & layouts | `src/app/**` | `(auth)`, `(public)`, `(embed)` groups — respect server vs client boundaries |
| API surface to backend | `src/lib/api/**` | Thin typed wrappers; keep shapes aligned with backend DTOs |
| Server/client data hooks | `src/lib/queries/**` | Query keys in `queries/keys.ts`; invalidate on mutations |
| Shared types | `src/lib/types/**` | When backend types change, coordinate a single update PR |
| Feature UI | `src/components/dashboard`, `application`, `reports`, `alerts`, `planify`, `snapshot`, etc. | Compose from `components/ui` and shared patterns |
| Maps & spatial UX | `src/components/map3d`, map sections on application/dashboard | Performance and API keys (`NEXT_PUBLIC_*`) |
| Billing & gating | `src/components/billing` | UX + integration; pricing rules may need product/legal input |
| Embed / widget | `src/app/(embed)`, `public/snapshot-embed.js` | Third-party embedding — extra care for CSP and versioning |
| Middleware & auth glue | `src/middleware.ts`, auth layout | Do not weaken auth for convenience |

## Specialist strengths (default assignments)

Use this list when planning work so **Staff Engineer** is not pulled in for routine frontend depth:

1. **Application detail & documents** — timeline, BCMS, property, document intelligence panels; table-heavy layouts.
2. **Dashboard & search** — filters, results grid/table, heatmap entry points, saved items.
3. **Reports & pre-planning wizard** — multi-step flows, validation, progress persistence.
4. **Alerts** — wizard + inbox patterns; empty states and status messaging.
5. **Clerk + legacy API bridge** — `apiClient` interceptors, 401 handling, header contracts with backend.
6. **Design system implementation** — Radix + Tailwind tokens; no ad-hoc inline theme sprawl.

## Flex coverage (when to stretch outside the lane)

- **Designer (UI/UX):** You implement specs and interaction polish; you propose component API changes when Figma cannot map 1:1 to existing primitives. Escalate **brand-new patterns** that need a new base component with the Designer first.
- **Backend:** You own **client** contracts. If the API is wrong or ambiguous, open a **clear repro + expected JSON** for backend; do not paper over with silent coercion.
- **QA:** You fix deterministic UI bugs and flaky selectors; you do not own full test strategy.
- **Release:** You keep builds green (`next build`, `next lint`); coordinate breaking env changes (`NEXT_PUBLIC_*`).

## Ownership proposal — reducing Staff Engineer context switching

**Default rule:** Staff Engineer is **not** the first assignee for:

- New or changed **pages and flows** in `src/app` that follow existing data-fetch patterns.
- **React Query** cache keys, loading/error UI, and pagination.
- **Component-level** refactors that do not change security boundaries or cross-repo contracts.
- **Styling and layout** work inside established layouts.

**Escalate to Staff Engineer** when:

- Auth model, middleware, or token storage needs a **security review** or structural change.
- A feature requires **new cross-cutting architecture** (e.g. global event bus, major state redesign spanning many routes).
- **Backend and frontend types diverge** at scale — propose a shared package or codegen; Staff drives the contract.
- Performance issues trace to **Next.js rendering model** (SSR/SSG/RSC boundaries) or bundle strategy, not a single slow component.

**Backup:** When Frontend Engineer is unavailable, **CTO** triages; Staff Engineer covers **architectural** frontend decisions only, not day-to-day feature UI.

## Upskilling sprint (concrete 10-day shape)

Complete this once per major phase (or when onboarding a new frontend agent):

1. Read **root** [`STATE.md`](../../STATE.md), [`VISION.md`](../../VISION.md), and [`../../docs/CEO_PLAN_PERMITFLOW_V2.md`](../../docs/CEO_PLAN_PERMITFLOW_V2.md) (if present) — align with current milestone.
2. Trace **one vertical slice** end-to-end: route → query hook → `src/lib/api/*` → backend response → UI states (loading / empty / error).
3. Inventory **env vars** required for local dev (`NEXT_PUBLIC_BACKEND_API_URL`, map keys, Clerk keys) and document gaps in a ticket rather than hard-coding.
4. Run **`pnpm`/`npm` install**, `npm run lint`, `npm run build`; fix what breaks in touched areas.
5. Skim **Playwright** `e2e/` for critical paths; extend specs when changing those flows.
6. Update **this file** when ownership boundaries shift (e.g. new subdomain or major new feature area).

## Implementation conventions

- Prefer **`@/` imports** as configured in `tsconfig`.
- New fetch logic: **API function in `src/lib/api`** + **hook in `src/lib/queries`** + **types in `src/lib/types`**.
- Use **existing** `components/ui/*` before adding parallel primitives.
- Avoid growing **God components** — split by section (see `application/*-section.tsx` pattern).
- For compliance- and data-sensitive copy, **match product language** from CEO/plan docs; flag legal/compliance uncertainty in issues instead of guessing.

## Handoffs (Paperclip / multi-agent)

- Setting work to **blocked** is not enough: **@-mention** the owning agent in the issue comment (see [`../../STATE.md`](../../STATE.md) handoff rule).
- Link related tickets as markdown links with the company prefix (e.g. `[GST-76](/GST/issues/GST-76)`).

## Repo reference

- **Remote:** https://github.com/PatrickJDoyle/Planify-V2  
- **Sibling backend:** `planify-backend-sandbox-main` under the same Planify desktop folder — read-only for contract discovery unless assigned backend work.
