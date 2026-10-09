# EvolvIQ Frontend — Scope of Work

Source of truth: `EvolvIQ_MVP_Scope_Confirmation.pdf` (Sept 2026). This file
translates that PRD into frontend-specific deliverables.

**Change, 9 Oct 2026 (client feedback):** the parent and student views must
follow the client's Gemini prototype (the "EvolvIQMobile" canvas) as closely
as possible and lead with the product's USP, the **EvolvIQ Holistic Index
(EHI)** — including its chart and graph views. That brings the EHI views below
into scope and narrows the "no charts" exclusion to everything else. The
teacher view was accepted as it is.

## Apps to build
1. **Family Web App** — Parent, Student
2. **School Web App** — Teacher, Psychologist
3. **Admin Panel** — School Admin, Platform Admin

## In scope by role

### Every signed-in role
- One shell: a collapsible rail with the role's at-a-glance context card, a top
  bar, and a notifications bell built from data the app already loads
- KPI tiles made of counts (no charts) at the top of working screens

### Student (Family Web App)
- Home: today's assigned activities as Daily Missions, with XP per mission
- Level and XP progress, streak
- Activity player: MCQ, text, image pick, 1–5 rating, media + response
- Progress/streak indicator on completion
- Own Holistic Report Card (EHI trajectory, skill profile, strengths, Growth Playbook)
- No access to any other student's data

### Parent (Family Web App)
- Dashboard per child, with a switcher between children
- EvolvIQ Holistic Index: score, change since last year, five-pillar rings
- Holistic Report Card: EHI trajectory over the years, skill profile radar,
  strengths, year-by-year card, Growth Playbook, save as PDF / share
- Observation submission form (area, free text, when, how often)
- Teacher notes (read-only)
- Growth areas + monthly summary (plain-language, not clinical)
- No access to clinical scores or psychologist notes. The EHI is a
  development index, not a clinical score; it carries no observation levels,
  significance flags or psychologist notes

### Teacher (School Web App)
- Own students list
- Observation submission form (area, free text, when, how often, Level,
  Learning-behaviour area)
- Direct activity assignment
- Student progress tracking
- Student profile: up to 5 growth areas, activity progress, full observation history
- Each student's EvolvIQ Holistic Index on the roster and profile, and the same
  Holistic Report Card the family sees

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
- Charts/graphs on any dashboard, apart from the EHI views on the parent and
  student screens listed above
- Prototype features beyond the confirmed MVP, until the client confirms them:
  SOS / safety centre, health and medical records, Explore (admissions, fests,
  maps), alumni network, splash / intro tour / consent flow, settings and
  language switch, AI career-path predictions
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
