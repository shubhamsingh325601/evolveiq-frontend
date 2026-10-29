# EvolvIQ Frontend — Scope of Work

Source of truth: `EvolvIQ_MVP_Scope_Confirmation.pdf` (Sept 2026). This file
translates that PRD into frontend-specific deliverables.

**Change, 9 Oct 2026 (client feedback):** the parent and student views must
follow the client's Gemini prototype (the "EvolvIQMobile" canvas) as closely
as possible and lead with the product's USP, the **EvolvIQ Holistic Index
(EHI)** — including its chart and graph views. That brings the EHI views below
into scope and narrows the "no charts" exclusion to everything else. The
teacher view was accepted as it is.

**Change, 21 Oct 2026 (client feedback):**
- Observations "shouldn't be only negative or psychological — they can be
  good and cheering too". Everyone who records one first chooses **something
  to celebrate** or **something to look into**. Something to celebrate is a
  **star** on the child's profile straight away: never reviewed, never given a
  Level, so never flagged Significant and never turned into a growth area.
  Something to look into goes to the review queue as before.
- Teachers' good reviews become rewards: stars, with the giver's words, on the
  child's own home, the parent's dashboard and the teacher's roster and
  profile.
- The psychologist role is called the school **Counsellor** on screen.
- The floating "Switch role" pill is gone. Staff switch role from the account
  menu (the profile) in the test build; parents and students never switch
  roles — a parent switches between their children instead.
- The combined build opens on one dedicated sign-in screen for every role,
  with test accounts named by role: Parent, Student, Teacher, Counsellor,
  School admin, Platform admin.

**Change, 28 Oct 2026 (client feedback):**
- "Make the platform responsive." The list screens (every `RecordsTable`)
  stretched a phone's page sideways and hid columns off the edge; on a phone
  each row is now a card with every value labelled, and no screen is wider than
  the phone. Checked on every role's screens at 360, 390, 768, 1024 and 1440px.
- A **CRM integration** entry for the school admin, announced as **coming
  soon**: what it will do and the school's real record counts. Nothing is
  integrated and nothing on the page pretends to be.
- A **chatbot in the centre** of the family app's tab bar, for students and
  parents: the **EvolvIQ Guide** ("Ask EvolvIQ"). Static — every answer is
  written in advance and filled from the person's own data; no live agent, no
  AI, no person behind it, and it says so. A worry ("scared", "bullied",
  "emergency"…) is answered first by pointing to a trusted adult or the school.
- The **order** of the family screens: the graphs and progress, the USP, come
  first — the EHI rings and trajectory on the parent's dashboard, then the
  counts, the Holistic Report Card and the stars by month; level progress, the
  rings and "My superpowers" radar on the student's home, then the missions.
- **Explore** replaces **Siblings** in the parent's tabs (Siblings is still one
  tap from the dashboard, as "Compare strengths").

**Change, 29 Oct 2026 (client feedback):**
- **Health** replaces **Privacy** in the parent's tabs, like the student's own
  "How I feel": the child's **health and care needs** — conditions the school
  should know about (diabetes, asthma, epilepsy, a severe allergy, on
  medication, specially abled, visually or hearing impaired, dyslexia, ADHD,
  autism, speech and language, other), allergies, medication, blood group,
  what the school should do and who to call — and the daily check-in. It is
  the family's word, not a clinical record or a medical file, and never feeds
  the EHI. Privacy & safety and the notice board move to the account menu.
- Teachers get a **class drop-down** on the roster; each student's **days in
  this month** ("18/26 days": present or late, out of the days the register
  was taken), from a register the teacher takes on a new **Attendance**
  screen; and **special-care** flags from the health and care needs, with the
  whole card (and a number to call) on the student's profile, "for special
  care and attention by school and teachers".
- School and platform admins **import** students, teachers and parents from a
  spreadsheet (CSV): every row is checked first, and nothing is created until
  every row is right. "Pulling data" from the school's own system is the CRM
  integration, still coming soon; adding by hand stays. **Remove** sits
  beside Edit: an account with no records, a class (its students stay, in no
  class) or an empty school. An account with records is switched off instead,
  so the school keeps what happened.
- A **notice board**: events, activities, trainings, policies and government
  updates, and emergency contacts (tap to call). The school admin posts for
  their school; the platform admin for one school or every school. Staff,
  parents and students read it in their own apps, for their audience.
- **Staff reviews**: once a month the school admin rates each teacher 1–5 on
  teaching, engagement, punctuality, teamwork and communication with parents,
  with a word of feedback. Private to the admin and the teacher.
- A **wall of fame**: a **Staff of the Month** "promoted on the wall", and
  **Students of the Month** to encourage children. Staff see the school's
  whole wall; a family sees the Staff of the Month and their own child's
  honours only — a student still never sees another student's data — and a
  child named is congratulated on their own home and their parent's dashboard.

## Apps to build
1. **Family Web App** — Parent, Student
2. **School Web App** — Teacher, Psychologist
3. **Admin Panel** — School Admin, Platform Admin

## In scope by role

### Every signed-in role
- One shell: a collapsible rail with the role's at-a-glance context card, a top
  bar, and a notifications bell built from data the app already loads
- An account menu (the profile) at the foot of the rail and behind the avatar
  on phones: who is signed in, what they can switch between, and sign out
- KPI tiles made of counts (no charts) at the top of working screens
- Every screen usable at phone width without sideways scrolling; list screens
  show each row as a labelled card on a phone

### Student and Parent (Family Web App)
- The EvolvIQ Guide in the middle of the phone tab bar (on the rail on larger
  screens): prepared answers about the person's own missions, level, stars,
  streak and score, or about their children, stars, the Holistic Index,
  concerns, Explore and privacy. Never a live chat or an AI

### Student (Family Web App)
- Home: level progress and the EHI graphs first (score rings, "My superpowers"
  radar, the Holistic Report Card), then today's assigned activities as Daily
  Missions, with XP per mission
- Level and XP progress, streak
- Activity player: MCQ, text, image pick, 1–5 rating, media + response
- Progress/streak indicator on completion
- Their stars, each with the words of the teacher or parent who gave it
- Own Holistic Report Card (EHI trajectory, skill profile, strengths, Growth Playbook)
- The school's notice board, and a celebration on their home when they are
  Student of the Month
- No access to any other student's data

### Parent (Family Web App)
- Dashboard per child, with a switcher between children (on the dashboard, the
  rail and the account menu), led by the graphs and progress
- EvolvIQ Holistic Index: score, change since last year, five-pillar rings,
  trajectory
- Explore (a tab): ideas to try together, starting from the child's strengths
- Holistic Report Card: EHI trajectory over the years, skill profile radar,
  strengths, year-by-year card, Growth Playbook, save as PDF / share
- Observation submission form (something to celebrate or something to look
  into; area, free text, when, how often)
- The child's stars, from school and from home, with the giver's words
- Health (a tab): the child's health and care needs, written by the parent and
  read by the school, and the daily check-in
- The school's notice board, the Staff of the Month, and their own child's
  honours
- Teacher notes (read-only)
- Growth areas + monthly summary (plain-language, not clinical)
- No access to clinical scores or psychologist notes. The EHI is a
  development index, not a clinical score; it carries no observation levels,
  significance flags or psychologist notes

### Teacher (School Web App)
- Own students list, with each student's stars, narrowed to one class from a
  drop-down
- Attendance: take or correct a class's register (present, late, absent) for
  today or the last 30 days; each student's days in this month on the roster
  and profile
- Each student's health and care needs: flags on the roster, the whole card on
  the profile
- The notice board with the school's wall of fame; their own monthly reviews
- Observation submission form: something to celebrate (a star) or something
  to look into; area, free text, when, how often, Learning-behaviour area, and
  Level for a concern only
- "Give a star" and "Raise a concern" from the roster and the student profile
- Direct activity assignment
- Student progress tracking
- Student profile: stars, up to 5 growth areas, activity progress, full observation history
- Each student's EvolvIQ Holistic Index on the roster and profile, and the same
  Holistic Report Card the family sees

### Psychologist — "Counsellor" on screen (School Web App)
- Observation review queue with filters: Pending, Significant, From
  parents, Reviewed, school — concerns only; stars never wait for review
- Observation detail view (metadata + related history)
- Development-area tagging
- Activity recommend/assign from library
- Optional teacher-only note field
- Actions: "Assign & mark reviewed" / "No action needed"
- Activity authoring via simple form (no drag-and-drop builder)
- The notice board (staff notices of every school)

### School Admin (Admin Panel)
- Manage students, teachers, classes, parents (list/create/edit/remove — RecordsTable-driven)
- Import students, teachers and parents from a spreadsheet, checked row by row
- Each student's health and care needs
- The notice board: post, change, pin and take down
- Staff reviews, and the wall of fame (Staff and Students of the Month)
- CRM integration, shown as coming soon (no integration built)

### Platform Admin (Admin Panel)
- Add and remove (empty) schools, manage users across roles
- Import a school's people from a spreadsheet
- Notices for one school or for every school

## Explicitly out of scope (do not build)
- Charts/graphs on any dashboard, apart from the EHI views on the parent and
  student screens listed above
- Prototype features beyond the confirmed MVP, until the client confirms them:
  SOS / safety centre, medical files, report uploads and "verified vitals"
  (the health and care needs above are in, since 29 Oct 2026), Explore beyond
  the ideas page (admissions, fests, maps), alumni network, splash / intro
  tour / consent flow, settings and language switch, AI career-path predictions
- More than 5 growth areas per student
- Permission editor, audit log UI
- Parent–teacher chat, a live or AI chat assistant (the EvolvIQ Guide is
  scripted)
- A working CRM integration or school-system sync (only its coming-soon page
  is in scope; spreadsheet import is in since 29 Oct 2026)
- Guardian hierarchies, multi-school students
- Drag-and-drop activity builder
- Billing/payments UI
- Native mobile app (responsive web only)
- A public wall: another family's child is never shown on a family's screens

## Definition of done (per screen/feature)
- Matches the role's data-visibility rules (see ARCHITECTURE.md access rules)
- Uses the shared `ObservationForm` / `ActivityPlayer` / `RecordsTable` /
  `AppSidebar` components — no per-app forks
- Has a Vitest/RTL test for the primary interaction path
- Responsive at mobile, tablet, desktop breakpoints
