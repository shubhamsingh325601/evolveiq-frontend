# EvolvIQ Frontend — Scope of Work

Source of truth: `EvolvIQ_MVP_Scope_Confirmation.pdf` (Sept 2026). This file
translates that PRD into frontend-specific deliverables.

## Apps to build
1. **Family Web App** — Parent, Student
2. **School Web App** — Teacher, Psychologist
3. **Admin Panel** — School Admin, Platform Admin

## In scope by role

### Student (Family Web App)
- Today's assigned activities view
- Activity player: MCQ, text, image pick, 1–5 rating, media + response
- Progress/streak indicator on completion
- No access to any other student's data

### Parent (Family Web App)
- Children list + development info
- Observation submission form (area, free text, when, how often)
- Teacher notes (read-only)
- Growth areas + monthly summary (plain-language, not clinical)
- No access to clinical scores or psychologist notes

### Teacher (School Web App)
- Own students list
- Observation submission form (area, free text, when, how often, Level,
  Learning-behaviour area)
- Direct activity assignment
- Student progress tracking
- Student profile: up to 5 growth areas, activity progress, full observation history

### Psychologist (School Web App)
- Observation review queue with filters: Pending, Significant, From
  parents, Reviewed, school
- Observation detail view (metadata + related history)
- Development-area tagging
- Activity recommend/assign from library
- Optional teacher-only note field
- Actions: "Assign & mark reviewed" / "No action needed"
- Activity authoring via simple form (no drag-and-drop builder)

### School Admin (Admin Panel)
- Manage students, teachers, classes, parents (list/create/edit — RecordsTable-driven)

### Platform Admin (Admin Panel)
- Add schools, manage users across roles

## Explicitly out of scope (do not build)
- Charts/graphs on any dashboard
- More than 5 growth areas per student
- Permission editor, audit log UI
- Parent–teacher chat
- Guardian hierarchies, multi-school students
- Drag-and-drop activity builder
- Billing/payments UI
- Native mobile app (responsive web only)
- CSV import (PRD marks this V1, not MVP)

## Definition of done (per screen/feature)
- Matches the role's data-visibility rules (see ARCHITECTURE.md access rules)
- Uses the shared `ObservationForm` / `ActivityPlayer` / `RecordsTable` /
  `AppSidebar` components — no per-app forks
- Has a Vitest/RTL test for the primary interaction path
- Responsive at mobile, tablet, desktop breakpoints
