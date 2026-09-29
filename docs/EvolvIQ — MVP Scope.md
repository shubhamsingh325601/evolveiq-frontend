# EvolvIQ — MVP Scope Confirmation

Scope summary for review and confirmation | September 2026

## Core Product Idea

EvolvIQ is a school platform built around observation and child development. The core loop is: Observe Review Assign Do See. Teachers and parents record observations, a psychologist reviews them and assigns an activity, the student completes the activity, and parents/teachers see development and progress.

## 1. Applications & Roles

The MVP consists of three responsive web applications: Family Web App, School Web App, and Admin Panel. The PRD identifies Student, Parent, Teacher and Psychologist as the core user roles, with School Admin and Platform Admin handling administration.

## 2. MVP Functional Scope

## Student

• View today’s assigned activities.

• Complete activities through the activity player.

• Supported activity types: MCQ, text, image pick, 1–5 rating, and media + response.

• Completion contributes to progress and streak.

• Student access is restricted to their own activity/progress experience.

## Parent

• View own children and development information.

• Submit observations with area, free text, when, and how often.

• Read teacher notes.

• View growth areas and monthly summary in development language.

• Clinical scores and psychologist notes remain inaccessible to the parent.

## Teacher

• View own students.

• Submit observations with area, free text, when, how often, Level (Mild / Moderate / Significant), and Learning-behaviour area.

• Assign activities directly.

• Track student progress.

• View student profile, up to 5 growth areas, activity progress, and full observation history.

## Psychologist

• Access the observation review queue.

• Filter observations by Pending, Significant, From parents, Reviewed, and school.

• Review observation details, metadata, and related history.

• Tag a development area.

• Recommend/assign an activity from the activity library.

• Add an optional teacher-only note.

• Choose Assign & mark reviewed or No action needed.


- Author activities through a simple form.

## School / Platform Administration

- School Admin: manage students, teachers, classes and parents.

- Platform Admin: add schools and manage users across roles.

- Basic counts and lists are used rather than chart-heavy dashboards.

- CSV import is identified in the PRD as a V1 requirement rather than core MVP functionality.

## 3. Core Workflow

- 1. Observe: Parent or teacher submits an observation.

- 2. Review: Psychologist reviews the observation and identifies the development area.

- 3. Assign: Psychologist selects/recommends an activity from the library.

- 4. Do: Student completes the activity.

- 5. See: Parent and teacher view development/progress information.

## 4. Product Architecture Principles

- One observation component with parent and teacher variants.

- One activity-player shell supporting five activity types.

- One reusable records-table component across management screens.

- One sidebar component per app with role-based menu sets.

- Responsive web apps; no native mobile build in the current scope.

## 5. Scope Boundaries

The PRD explicitly excludes from V1: charts/graphs on dashboards, more than five growth areas per student, permission editor and audit log, parent–teacher chat, guardian hierarchies and multi-school students, drag-and-drop activity builder, billing/payments, and native mobile apps.

## 6. Confirmation Requested

Please review the above MVP scope and confirm that the listed features and implementation boundaries accurately represent the agreed MVP. Development initiation will proceed based on the confirmed scope. Any requested changes should be identified before development kickoff.
