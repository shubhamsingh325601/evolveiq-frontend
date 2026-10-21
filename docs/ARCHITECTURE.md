# EvolvIQ Frontend — Architecture

## Overview
EvolvIQ ships three responsive web apps that share one design system and one
domain model: **Family Web App** (Parent, Student), **School Web App**
(Teacher, Psychologist, School Admin), and **Admin Panel** (Platform Admin).
On screen the Psychologist is the school **Counsellor** (client feedback, 21
Oct 2026); in code and in the API the role is still `psychologist`.
Rather than three unrelated repos, the frontend is a single **monorepo** so
the shared pieces called out in the PRD — one observation component, one
activity-player shell, one records-table, one sidebar — are built once and
consumed three times.

## Stack
- **Language**: TypeScript (strict mode)
- **Framework**: React 18 + Vite
- **Routing**: React Router v6, per-app route trees, role-guarded routes
- **Server state**: TanStack Query (all API reads/writes go through it)
- **Client/UI state**: React Context + small Zustand stores where Context isn't enough
- **Styling**: Tailwind CSS + a shared token set (colors, spacing, type scale) — the "Dawn" design system, described in README.md
- **Icons**: lucide-react, re-exported as a curated set from `packages/ui`; apps never import it directly
- **Forms**: React Hook Form + Zod schemas (schemas shared with backend contracts where practical)
- **Package management**: pnpm workspaces
- **Testing**: Vitest + React Testing Library; Playwright for critical-path e2e (login, observe→assign→do→see)

## Monorepo layout
```
evolveiq-frontend/
  apps/
    family-web/        # Parent + Student
    school-web/         # Teacher + Psychologist
    admin-panel/          # School Admin + Platform Admin
  packages/
    ui/                 # Design system: buttons, inputs, layout primitives
    domain/             # Shared feature components (see below)
    api-client/         # Typed fetch layer + TanStack Query hooks
    auth/               # Auth context, role guards, session handling
    config/             # eslint, tsconfig, tailwind presets shared across packages
  tools/
    dev-shell/          # the combined build: one sign-in, all three apps on one port
  .claude/
  docs/ (this file, SCOPE_OF_WORK.md, etc.)
```

## Shared domain components (packages/domain)
These map directly to the PRD's "Product Architecture Principles" and must
not be reimplemented per app:
- `ObservationForm` — one component, `variant="parent" | "teacher"` toggles
  the extra fields (Level, Learning-behaviour area) teachers submit. It opens
  on the tone (`ObservationTonePicker`): something to celebrate is a star for
  the child and never carries a Level; something to look into goes to the
  review queue.
- `ActivityPlayer` — one shell, pluggable renderers per type: MCQ, text,
  image-pick, 1–5 rating, media+response.
- `RecordsTable` — one table component (sorting, pagination, filters) reused
  across every management/list screen (students, teachers, classes, parents,
  schools, activity library, review queue).
- `AppSidebar` — one sidebar shell; each app passes a role-based menu config
  rather than forking the component. On phones, `AppBottomNav` renders the
  same config as a tab bar, so the two never disagree. `AppLayout` wraps both
  with `AppTopBar` (place, date, notifications). Apps pass a `contextCard`
  (built on `SidebarCard`) and a list of `AppNotification`s, both computed
  from queries the app already runs — the shell never fetches on its own.
  The `AccountMenu` (the profile: the account row at the foot of the rail, the
  avatar on phones) takes `accountSections` from the app — a parent's
  children, to switch between — and, only inside an `AccountSwitchProvider`,
  the accounts the shell lets this person switch to. Only the combined build
  provides one (see below), so an app on its own never offers role switching.

`StarBoard` shows a child's stars — the count, where they came from (school or
home) and the giver's words — the same way to the child, their family and their
teachers, each in their own terms.

## Role-based access
Each app has one entry point but the menu, routes, and visible data are
driven by the authenticated user's role (Student, Parent, Teacher,
Psychologist, School Admin, Platform Admin). Route guards live in
`packages/auth` and are the single place that encodes "who can see what" —
new roles or permission changes are made there, not per-screen.

## API integration
- All network calls go through `packages/api-client`, which wraps `fetch`,
  attaches the access token, and exposes typed TanStack Query hooks
  (`useReviewQueue`, `useMyAssignments`, etc.).
- The contract is evolveiq-backend's `/api/v1`, mirrored in `types.ts` with
  one response shape per audience. Parent-only data comes from the backend's
  `/family/` routes, and the family hooks copy it field by field
  (`redaction.ts`) so nothing clinical can reach a parent's cache.
- Sessions: an access token (1 hour) and a rotating refresh token. A 401 is
  renewed once and resent; renewals are shared by every request in flight and
  serialised across tabs (Web Locks), because the backend treats a refresh
  token used twice as stolen and ends the session. The session lives in
  `packages/auth` (`session-store.ts`), outside React.
- Every list endpoint is paginated; hooks collect every page and
  `RecordsTable` pages on screen. KPI counts come from list metadata
  (`limit=1`), never from loading the rows.
- Observations carry a `tone` (`positive` / `concern`). A positive one is
  `celebrated` at once and appears as a star (`/students/:studentId/stars`,
  one parent-safe shape for every audience, copied field by field by
  `toStar`). The counsellor's queue always asks for `tone=concern`
  (`apps/school-web/src/review-filters.ts`). The backend accepts `tone` from
  its `20261021…` migrations on, so deploy the backend before a frontend that
  sends it.
- With `VITE_API_BASE_URL` unset, the same paths are answered by the in-memory
  mock in `api-client/src/mock`, which keeps the backend's roles and rules. It
  backs the demo and every app-level test.
- No app talks to the backend directly; this keeps the contract in one place
  and makes it trivial to add optimistic updates or retry logic later.

## Charts
The only charts are the EvolvIQ Holistic Index views on the parent and
student screens (in scope since the client's feedback of 9 Oct 2026; see
SCOPE_OF_WORK.md). They are hand-drawn SVG in `packages/ui` (`RingsChart`,
`TrendChart`, `RadarChart`) rather than a charting library: small, testable in
jsdom, styled from the same tokens, and readable without hover — every value
is printed or listed beside its chart, and the trajectory reads with the arrow
keys. `packages/domain` gives them their EHI meaning (`HolisticIndexCard`,
`HolisticReport`, `SkillProfileCard`).

The backend does not serve an EHI yet (there is no scoring formula), so the
EHI views are switched off (`FEATURES.holisticIndex` in `packages/api-client`)
and no screen shows a made-up index. The components above stay, with their
tests, ready to be wired to an EHI endpoint.

## What's deliberately out of scope for MVP
Per the PRD's Scope Boundaries: no charts/graphs beyond the EHI views, no
permission editor/audit log UI, no parent–teacher chat, no drag-and-drop
activity builder, no native mobile shell. Don't build abstractions to
anticipate these.

## Running all three at once: the combined build
`tools/dev-shell` serves the whole product on a single port. It opens on one
sign-in screen for every role (`/sign-in`, with test accounts named by role:
Parent, Student, Teacher, Counsellor, School admin, Platform admin) and mounts
one product app's route tree at a time, chosen by the signed-in role. It is
what the client tests (`pnpm --filter @evolveiq/dev-shell build`, deployed on
Render since 12 Oct 2026), so its test accounts are always on.

Staff can switch role from the account menu: the shell wraps the app in an
`AccountSwitchProvider` that offers the other staff test accounts (Teacher,
Counsellor, School admin, Platform admin) and signs out and back in as the one
chosen. Parents and students are offered no role switch. There is no floating
switcher. The three apps remain independently buildable — they do not import
the shell or know it exists.

## Environments
- `local` — Vite dev server against a local backend (see evolveiq-backend)
- `staging` — deployed on merge to `main`
- `production` — deployed on tag/release (see BRANCHING_STRATEGY.md)
