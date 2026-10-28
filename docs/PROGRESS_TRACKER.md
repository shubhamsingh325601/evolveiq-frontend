# EvolvIQ Frontend — Progress Tracker

Status legend: `Not Started` / `In Progress` / `Blocked` / `Done`

Update this table as work lands — keep it in sync with merged PRs, not with plans.

> Every screen below is wired to evolveiq-backend's real API and still runs
> on the built-in demo backend in `packages/api-client/src/mock` when no API
> URL is set; see README.md.

## Setup
| Item | Status | Owner | Notes |
|---|---|---|---|
| Monorepo scaffold (pnpm workspaces, apps/, packages/) | Done | | pnpm workspaces, 3 apps + 5 packages |
| Shared config (eslint, tsconfig, tailwind preset) | Done | | `packages/config`; tokens defined once; dev-server API proxy |
| `packages/ui` design system baseline | Done | | Primitives incl. Quote, RuledList, StatTile and three SVG charts |
| Visual redesign ("Dawn" design system) | Done | | Tokens, primitives, shell and every screen; curated lucide icons; see README |
| Family app aligned to the client's prototype | Done | | Client feedback 9 Oct 2026: parent and student views follow the "EvolvIQMobile" Gemini canvas |
| Whole-product redesign on the prototypes' language | Done | | New shell (collapsible rail, context cards, top bar, notifications), KPI tiles on every working screen, sign-in and dev launcher |
| Query cache cleared on sign-in and sign-out | Done | | Fixes one person's cached data reaching the next person on the same device; dev-shell regression test |
| `packages/auth` — session + role guards | Done | | `RoleGuard` is the only role check. Email + password or student ID + PIN; rotating refresh tokens renewed once, across tabs; sign-out revokes the session on the server; 7 tests |
| `packages/api-client` — typed fetch + TanStack Query setup | Done | | Mirrors the backend contract (one shape per audience, paging, error codes); built-in demo backend with the backend's rules; 39 tests |
| Real backend integration (all three apps) | Done | | Verified against evolveiq-backend: every role through the full Observe → Review → Assign → Do → See loop in headless Chrome, plus token renewal, reload and two-tab checks |
| CI: lint + typecheck + test on PR | Done | | `.github/workflows/ci.yml`, also builds |
| Combined build: one sign-in screen for every role | Done | | Client feedback 21 Oct 2026; not yet committed. `tools/dev-shell` opens on `/sign-in` (email + password, or student ID + PIN) with test accounts named by role; replaces the role picker |
| No floating role switcher; switching from the account menu | Done | | Client feedback 21 Oct 2026; not yet committed. Staff switch role from the profile menu (combined build only, `AccountSwitchProvider`); parents and students never switch roles; parents switch between children there; 10 dev-shell tests |
| "Counsellor" for the psychologist role | Done | | Client feedback 21 Oct 2026; not yet committed. On screen only (`ROLE_LABELS`, copy); the API role stays `psychologist` |

## Shared domain components
| Item | Status | Owner | Notes |
|---|---|---|---|
| `ObservationForm` (parent/teacher variants) | Done | | 9 tests; opens on the tone — something to celebrate (a star, no Level) or something to look into; the backend's value lists (area, when, how often; teachers add learning-behaviour area, and Level on a concern) |
| Positive observations and stars | Done | | Client feedback 21 Oct 2026; not yet committed. `tone` in the contract and the demo backend, `useStars`, `StarBoard` (4 tests) on the student's home and progress, the parent's dashboard, the teacher's roster and profile; star notifications; a `star` gold token |
| `ActivityPlayer` shell + 5 type renderers | Done | | 6 tests; one question per activity, answers in the backend's typed shape |
| `RecordsTable` | Done | | 6 tests. Client feedback 28 Oct 2026; not yet committed: on a phone (the table narrower than 40rem) each row is a card, the first column its heading and the rest labelled lines; its scroll box now holds the screen-reader labels, which used to stretch a phone's whole page |
| `AppSidebar` (role-based menu config) | Done | | 3 tests; collapsible, with an app-supplied context card; same config drives `AppBottomNav` on phones (5 tests: an item can take the raised centre slot, `isCenter`, and carry a tag such as "Soon"); the account row opens the `AccountMenu` (4 tests) with app-supplied sections |
| `AssistantChat` — the EvolvIQ Guide | Done | | Client feedback 28 Oct 2026; not yet committed. Scripted: prepared topics matched by whole words, a safety reply checked first, says it is not a person; 5 tests |
| EHI charts: `RingsChart`, `TrendChart`, `RadarChart` | Done | | Hand-drawn SVG in `packages/ui`; palette validated; covered through `HolisticIndexCard` (3 tests) and `HolisticReport` (6 tests); `HolisticTrendCard` (trajectory) shared by the report and the family homes |
| EHI API contract | Done | | Served by the backend's progress module (`/students/:studentId/holistic-index`, backend `5b694d2`); `FEATURES.holisticIndex` on since 24 Oct 2026 |

## Family Web App
| Item | Status | Owner | Notes |
|---|---|---|---|
| Student: today's activities | Done | | Home as Daily Missions, XP per mission |
| Student: activity player integration | Done | | One completion per activity; finish screen shows XP earned and the streak |
| Student: progress/streak | Done | | Streak from the backend; seven-day marks from the student's own completions (Asia/Kolkata days) |
| Student: level and XP | Done | | Worked out in the frontend from finished activities: 10 XP each, a level every 100 |
| Student: stars | Done | | Client feedback 21 Oct 2026; not yet committed. Star count beside the streak, "Your stars" with the giver's words on Home and My progress, a star line on the rail, a notification per star |
| Student: own Holistic Report Card | Done | | Since 24 Oct 2026 (`FEATURES.holisticIndex`); from the home's report card and My progress |
| Student and parent: graphs and progress first | Done | | Client feedback 28 Oct 2026; not yet committed. Student home: level progress, score rings and "My superpowers" radar, then missions beside the report card; My progress: rings and trajectory, stars by month and the streak. Parent dashboard: rings and trajectory, counts, report card and stars by month, then the month in words |
| Student and parent: the EvolvIQ Guide ("Ask EvolvIQ") | Done | | Client feedback 28 Oct 2026; not yet committed. In the middle of the phone tab bar (on the rail on larger screens); answers filled from the person's own parent-safe data; points a worry to a trusted adult or the school; 2 app tests |
| Parent: children list + development info | Done | | One dashboard per child with a switcher; KPI tiles, this month's summary, activities done / to do |
| Parent: EvolvIQ Holistic Index | Done | | Since 24 Oct 2026; rings and trajectory lead the dashboard |
| Parent: Holistic Report Card | Done | | Since 24 Oct 2026; opened from the dashboard's report card |
| Parent: Explore tab | Done | | Client feedback 28 Oct 2026; not yet committed. In place of Siblings (still on the dashboard as "Compare strengths"); `/parent/explore` opens the child last open, with a switcher |
| Parent: observation submission | Done | | Shared `ObservationForm`: something to celebrate (a star at once) or something to look into |
| Parent: child's stars | Done | | Client feedback 21 Oct 2026; not yet committed. Stars tile, the child's star board (school and home), stars per child on the rail and in the account menu, notifications for stars from school |
| Parent: teacher notes (read-only) | Blocked | | No backend endpoint: rule B17 limits parents to their own observations, their child's activities, streak, growth areas, stars and monthly summary. A teacher's praise does reach parents now, as a star; concerns and notes still do not |
| Parent: growth areas + monthly summary | Done | | Plain language, no clinical scores; this month live, earlier months as the backend stored them |

## School Web App
| Item | Status | Owner | Notes |
|---|---|---|---|
| Teacher: student list | Done | | Students of the teacher's own classes; growth areas and awaiting-review counts |
| Teacher: observation submission (with Level, LB area) | Done | | `variant="teacher"`; "Give a star" and "Raise a concern" open it on the right kind; a star has no Level |
| Teacher: students' stars | Done | | Client feedback 21 Oct 2026; not yet committed. Stars column and "Stars given" tile on the roster, star board and badge on the profile, stars given on the rail |
| Teacher: direct activity assignment | Done | | Library filtered by type and title |
| Teacher: student profile (growth areas, progress, history) | Done | | Up to 5 growth areas, activities with the student's answers, and the teacher's own observations with the psychologist's note (teachers see only what they wrote, rule B7) |
| Psychologist: review queue + filters | Done | | All 5 filters as KPI tiles (counts from the API), plus school; concerns only (`tone=concern`), stars appear in a student's history for context |
| Psychologist: observation detail view | Done | | Metadata plus related history |
| Psychologist: tag area / recommend activity / review actions | Done | | One development area (needed for Significant), 1–10 recommended activities, teacher-only note; both close-out actions |
| Psychologist: activity authoring form | Done | | Plain form, no drag-and-drop; edit, with type and options locked once assigned; archive |

## Admin Panel
| Item | Status | Owner | Notes |
|---|---|---|---|
| School Admin: manage students/teachers/classes/parents | Done | | Create (students with ID + PIN), edit, switch accounts off and on; class teachers and students; parent links |
| School Admin: CRM integration (coming soon) | Done | | Client feedback 28 Oct 2026; not yet committed. A menu entry tagged "Soon" and a page saying what it will do, with the school's real record counts; nothing to connect yet; 2 tests |
| Platform Admin: manage schools + users across roles | Done | | Schools with live counts; accounts across every role and school |

## Quality
| Item | Status | Owner | Notes |
|---|---|---|---|
| Playwright e2e: full Observe→Review→Assign→Do→See path | Not Started | | A manual headless-Chrome run of the whole loop against the real backend passed (11 Oct 2026); a committed suite needs a backend in CI |
| Responsive QA pass (mobile/tablet/desktop) | In Progress | | 28 Oct 2026: every role's screens audited in headless Chrome at 360, 390, 768, 1024 and 1440px — seven list screens stretched a phone's page, fixed; no screen wider than the phone now; tables are cards on phones. Still to do: a visual pass of the guide, the Explore tab and the CRM page, and real devices |
