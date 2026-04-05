# Planify — ownership matrix (paths & lanes)

This matrix applies to the **desktop Planify pair**: `Planify-V2-main` (Next.js app) and sibling `planify-backend-sandbox-main` (Nest/API). Adjust paths if your clone layout differs.

## Compliance & data integrity (primary owner)

**Compliance & data integrity** (authZ invariants, audit expectations, PII/DSR, sensitive migrations, retention) is owned by the **Compliance Engineer**. **Staff Engineer** stays involved for **cross-cutting architecture**, **security-sensitive structure**, and **pre-landing review** of shipping branches—not as the compliance lane DRI.

## PR routing (required in description or labels)

Every PR should state **`Compliance: yes`** or **`Compliance: no`** (touching compliance-adjacent surfaces per this doc = **yes**).

**Suggested labels**

| Label | Meaning |
|-------|---------|
| `compliance` | Touches compliance lane; needs **Compliance Engineer** review (add **Staff** if also `needs-staff`) |
| `needs-staff` | Cross-cutting architecture, security-sensitive, or contract drift; Staff Engineer should review |

Use both when a change is compliance-heavy *and* architectural.

## Lane summary

| Lane | Default owner | Staff involvement | Escalation |
|------|----------------|-------------------|------------|
| **Frontend UX** | Frontend Engineer | API contract / auth boundary changes | CTO |
| **Design** | Designer | design-system / new primitives | Staff if API or permissions change |
| **Backend feature** | Implementer of record (team) | greenfield architecture | Staff |
| **Compliance & data integrity** | **Compliance Engineer** | cross-cutting / structural overlap | CTO on policy ambiguity |
| **Security hardening** | Senior Security Engineer | overlaps with Staff on app design | CTO |
| **Release & delivery** | Release Engineer | risky infra / shared contracts | CTO |

## Path matrix — `Planify-V2-main`

| Path glob | Primary | Compliance (`yes`?) | Forbidden / escalate |
|-----------|---------|---------------------|----------------------|
| `src/app/**` | Frontend | yes if auth routes, embed, or PII surfaces | Do not weaken middleware/auth for convenience |
| `src/middleware.ts`, `(auth)/layout.tsx` | Frontend + **Compliance** | **yes** | Compliance for authZ/data exposure; Staff for structural Next/auth architecture |
| `src/lib/api/**`, `src/lib/types/**` | Frontend | yes if permissions / PII DTOs | Align with backend; Staff if shared contract |
| `src/lib/queries/**` | Frontend | yes if caching sensitive data | Invalidate rules must match auth |
| `src/components/billing/**` | Frontend | **yes** | Legal/pricing with product; Compliance + Staff on gating logic |
| `src/components/map3d/**`, `src/lib/maps/**` | Frontend | usually no | API keys / embed CSP → Compliance if policy; Staff if structural |
| `public/snapshot-embed.js`, `(embed)/**` | Frontend | **yes** (third-party boundary) | Compliance + Staff review for CSP/versioning |
| `e2e/**`, `playwright.config.ts` | QA + Frontend | yes for permission-gated journeys | Flakes owned by QA |
| `package.json`, `next.config.*` | Release + Frontend | yes if security headers / CSP | Release owns release impact |

## Path matrix — `planify-backend-sandbox-main`

| Path glob | Primary | Compliance (`yes`?) | Notes |
|-----------|---------|---------------------|-------|
| `src/modules/compliance/**` | **Compliance Engineer** | **yes** | Parser, storage, reports, processors |
| `src/modules/users/**`, auth/session guards | Backend + **Compliance** | **yes** | AuthZ changes = compliance lane; Staff if shared architecture |
| `src/modules/planify/**` (services, prompts, processors) | Backend | **yes** if LLM/PII/document intel | Trust boundaries, prompt injection, retention |
| `src/modules/feasibility-snapshot/**` | Backend | **yes** (research/PII) | Sub-agents / orchestration |
| `src/modules/document-intelligence/**` | Backend | **yes** | Storage and extraction |
| `src/sync-agent/**` | Backend | **yes** (ingestion) | Council data + extraction pipeline |
| `src/jobs/**`, `*.cron.*` | Backend + Release | **yes** if retention/DSR/imports | Idempotency and backfills |
| `src/common/**`, `src/config/**` | Backend | yes if feature flags touch compliance | Shared utilities |
| `test/**`, `*.spec.ts` | QA + implementer | yes for compliance modules | |

## Reviewer defaults (suggested)

| Author lane | Default reviewers (in order) |
|-------------|------------------------------|
| Frontend, `Compliance: no` | Frontend peer → merge when green |
| Frontend, `Compliance: yes` | **Compliance Engineer** → Staff if `needs-staff` or structural → Security if auth/data exposure |
| Backend, `Compliance: no` | Backend peer → Staff only if architecture/contract |
| Backend, `Compliance: yes` | **Compliance Engineer** → Staff optional (architecture) → Security optional |
| Release / infra | Release → Staff for risky shared config; Compliance if compliance-tagged |

## Escalation ladder

1. **Implementer** fixes and tests.
2. **Lane owner** (table above) for domain judgment.
3. **Compliance Engineer** for **`Compliance: yes`** domain judgment (authZ, audit, PII, retention, migrations on sensitive tables).
4. **Staff Engineer** for cross-cutting design, security-sensitive paths, contract drift, and **pre-landing structural review** before release.
5. **Senior Security Engineer** for threat model / exploit path.
6. **CTO** for policy, production incident tradeoffs, or headcount/process.

## Related docs

- Role-specific instructions: [`agents/README.md`](../agents/README.md)
- Repo hub: [`AGENTS.md`](../AGENTS.md)
