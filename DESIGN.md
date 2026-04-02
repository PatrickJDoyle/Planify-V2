# Planify V2 Design System

## Identity

**Product:** Planify, the PermitFlow for Ireland. Enterprise planning application platform.
**Audience:** Architects, planning consultants, structural engineers. Professionals.
**Personality:** Calm, competent, precise. Think Linear meets a senior planning consultant.
**Not:** Flashy, consumer-y, startup-y. This is a professional workspace, not a marketing site.

## Classification: APP UI

Calm surface hierarchy, dense but readable, utility language, minimal chrome.
No marketing hero sections. No decorative gradients. No mood copy.

## Color

### Brand
| Token | Hex | Usage |
|-------|-----|-------|
| brand-50 | #e8f2f9 | Hover backgrounds, selected row |
| brand-100 | #c5dff0 | Light backgrounds, info banners |
| brand-500 | #1270AF | Primary buttons, active nav, links |
| brand-600 | #0f5a8f | Primary button hover |
| brand-700 | #0c4670 | Active/pressed states |

### Neutrals (Slate)
| Token | Hex | Usage |
|-------|-----|-------|
| neutral-0 | #ffffff | Background (light mode) |
| neutral-50 | #f8fafc | Subtle background, alternating rows |
| neutral-100 | #f1f5f9 | Muted background, card backgrounds |
| neutral-200 | #e2e8f0 | Borders |
| neutral-400 | #94a3b8 | Subtle text, placeholders |
| neutral-500 | #64748b | Muted text |
| neutral-700 | #334155 | Secondary text |
| neutral-900 | #0f172a | Primary text, sidebar background |

### Status (Agent + Planning)
| Token | Hex | Usage |
|-------|-----|-------|
| status-granted / complete | #16a34a | Complete badge, success states |
| status-refused / failed | #dc2626 | Failed badge, error states |
| status-pending / generating | #f59e0b | In-progress badge, generating states |
| brand-500 / researching | #1270AF | Research in-progress |
| status-appealed | #8b5cf6 | — |
| status-conditions | #0ea5e9 | — |

## Typography

**Font:** Manrope (via `--font-manrope` CSS variable)
**Scale (Tailwind):**

| Token | Size | Line Height | Usage |
|-------|------|-------------|-------|
| xs | 0.75rem | 1rem | Metadata, timestamps, badges |
| sm | 0.8125rem | 1.25rem | Secondary text, descriptions |
| base | 0.875rem | 1.5rem | Body text, form labels |
| lg | 1rem | 1.5rem | Subheadings, card titles |
| xl | 1.125rem | 1.75rem | Section headings |
| 2xl | 1.5rem | 2rem | Page titles |
| 3xl | 1.875rem | 2.25rem | Hero headings (rare in app) |

## Spacing & Radius

| Token | Value | Usage |
|-------|-------|-------|
| radius-sm | 4px | Badges, small elements |
| radius-md | 6px | Inputs, buttons |
| radius-lg | 8px | Cards |
| radius-xl | 12px | Modals, large containers |

Spacing follows Tailwind 4px grid: p-2 (8px), p-3 (12px), p-4 (16px), p-6 (24px).

## Layout

### Sidebar
- Width: 240px (expanded), 64px (collapsed)
- Background: neutral-900 (dark)
- Text: neutral-200
- Active item: brand-500 accent
- Navigation order: Projects (primary), Search, Alerts, Settings

### Content Area
- Offset by sidebar width (CSS variable)
- Header bar at top (project context, user avatar)
- Content padding: p-6 on desktop, p-4 on mobile
- Max content width: none (full width within margins)

### Responsive Breakpoints
- Mobile (<768px): sidebar collapses to bottom nav or hamburger
- Tablet (768-1024px): sidebar collapsed (64px)
- Desktop (>1024px): sidebar expanded (240px)

## Components

### AgentStatusCard (new)
- Full-width card, not in a grid
- Left accent border: 3px, colored by agent state
  - Researching: brand-500 (#1270AF) + pulse animation
  - Generating: status-pending (#f59e0b) + pulse animation
  - Complete: status-granted (#16a34a), solid
  - Failed: status-refused (#dc2626), solid
- Header: Agent icon (lucide) + agent name (lg, semibold) + StatusBadge
- Body: agent-specific content
  - Running: progress message + elapsed time
  - Complete: structured results (requirements list, fee, timeline)
  - Failed: error message + Retry button

### StatusBadge
- Based on existing Badge component
- Variants by status:
  - draft: neutral-100 bg, neutral-500 text
  - researching: brand-50 bg, brand-700 text
  - generating: amber-50 bg, amber-700 text
  - complete: green-50 bg, green-700 text
  - failed: red-50 bg, red-700 text

### ApplicationPackageChecklist
- Table layout (not card stack)
- Columns: Status icon, Document name, Action
- Status icons:
  - check-circle (green): generated, downloadable
  - loader (amber, spinning): generating
  - circle (neutral-300): not started / user provides
  - x-circle (red): failed
- Action column: "Download" button for generated, "You provide" text for manual items

## Interaction Patterns

### Agent Progress
- Polling every 5s (React Query refetchInterval)
- Smooth transitions between states (framer-motion, 200ms)
- Pulse animation on running agent cards (CSS animation, subtle)
- Progress bar for Document Agent (estimated %, not deterministic)

### Empty States
- Warm, action-oriented. Never just "No items found."
- Primary CTA for the next action
- Brief context explaining what this area will contain

### Error States
- Inline for form validation (red text below field)
- Card-level for agent failures (error message + Retry button)
- Page-level for API errors (centered message + Retry)

## Anti-patterns (do not use)

- Centered text on any screen (this is an app, not a landing page)
- Card grids for project list (use rows/table)
- Decorative elements (gradients, blobs, waves)
- Generic hero sections
- Emoji as UI elements
- Purple/violet accents (brand is blue)
- Equal-height card grids for agents (agents are sequential, not parallel)
