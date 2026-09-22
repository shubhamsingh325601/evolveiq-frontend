# EvolvIQ Frontend — Architecture

## Overview
EvolvIQ ships three responsive web apps that share one design system and one
domain model: **Family Web App** (Parent, Student), **School Web App**
(Teacher, Psychologist, School Admin), and **Admin Panel** (Platform Admin).
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
- **Styling**: Tailwind CSS + a shared token set (colors, spacing, type scale)
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
  .claude/
  docs/ (this file, SCOPE_OF_WORK.md, etc.)
```

## Shared domain components (packages/domain)
These map directly to the PRD's "Product Architecture Principles" and must
not be reimplemented per app:
- `ObservationForm` — one component, `variant="parent" | "teacher"` toggles
  the extra fields (Level, Learning-behaviour area) teachers submit.
- `ActivityPlayer` — one shell, pluggable renderers per type: MCQ, text,
  image-pick, 1–5 rating, media+response.
- `RecordsTable` — one table component (sorting, pagination, filters) reused
  across every management/list screen (students, teachers, classes, parents,
  schools, activity library, review queue).
- `AppSidebar` — one sidebar shell; each app passes a role-based menu config
  rather than forking the component.

## Role-based access
Each app has one entry point but the menu, routes, and visible data are
driven by the authenticated user's role (Student, Parent, Teacher,
Psychologist, School Admin, Platform Admin). Route guards live in
`packages/auth` and are the single place that encodes "who can see what" —
new roles or permission changes are made there, not per-screen.

## API integration
- All network calls go through `packages/api-client`, which wraps `fetch`,
  attaches auth headers, and exposes typed TanStack Query hooks
  (`useObservations`, `useActivityQueue`, etc.).
- No app talks to the backend directly; this keeps the contract in one place
  and makes it trivial to add optimistic updates or retry logic later.

## What's deliberately out of scope for MVP
Per the PRD's Scope Boundaries: no charts/graphs, no permission editor/audit
log UI, no parent–teacher chat, no drag-and-drop activity builder, no
native mobile shell. Don't build abstractions to anticipate these.

## Environments
- `local` — Vite dev server against a local backend (see evolveiq-backend)
- `staging` — deployed on merge to `main`
- `production` — deployed on tag/release (see BRANCHING_STRATEGY.md)
