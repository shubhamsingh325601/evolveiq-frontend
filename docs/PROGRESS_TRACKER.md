# EvolvIQ Frontend — Progress Tracker

Status legend: `Not Started` / `In Progress` / `Blocked` / `Done`

Update this table as work lands — keep it in sync with merged PRs, not with plans.

> Every screen below is wired to evolveiq-backend's real API
> (`feature/api-client-real-backend`, not yet merged) and still runs on the
> built-in demo backend in `packages/api-client/src/mock` when no API URL is
> set; see README.md.

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
| Real backend integration (all three apps) | Done | | Not yet merged. Verified against evolveiq-backend: every role through the full Observe → Review → Assign → Do → See loop in headless Chrome, plus token renewal, reload and two-tab checks |
| CI: lint + typecheck + test on PR | Done | | `.github/workflows/ci.yml`, also builds |

## Shared domain components
| Item | Status | Owner | Notes |
|---|---|---|---|
| `ObservationForm` (parent/teacher variants) | Done | | 5 tests; the backend's value lists (area, when, how often; teachers add Level and learning-behaviour area) |
| `ActivityPlayer` shell + 5 type renderers | Done | | 6 tests; one question per activity, answers in the backend's typed shape |
| `RecordsTable` | Done | | 5 tests |
| `AppSidebar` (role-based menu config) | Done | | 3 tests; collapsible, with an app-supplied context card; same config drives `AppBottomNav` on phones (3 tests) |
| EHI charts: `RingsChart`, `TrendChart`, `RadarChart` | Done | | Hand-drawn SVG in `packages/ui`; palette validated; covered through `HolisticIndexCard` (3 tests) and `HolisticReport` (6 tests) |
| EHI API contract | Blocked | | The backend has no EHI endpoint or scoring formula yet. EHI views are switched off (`FEATURES.holisticIndex`); the components above stay ready |

## Family Web App
| Item | Status | Owner | Notes |
|---|---|---|---|
| Student: today's activities | Done | | Home as Daily Missions, XP per mission |
| Student: activity player integration | Done | | One completion per activity; finish screen shows XP earned and the streak |
| Student: progress/streak | Done | | Streak from the backend; seven-day marks from the student's own completions (Asia/Kolkata days) |
| Student: level and XP | Done | | Worked out in the frontend from finished activities: 10 XP each, a level every 100 |
| Student: own Holistic Report Card | Blocked | | Hidden until the backend serves an EHI |
| Parent: children list + development info | Done | | One dashboard per child with a switcher; KPI tiles, this month's summary, activities done / to do |
| Parent: EvolvIQ Holistic Index | Blocked | | Hidden until the backend serves an EHI |
| Parent: Holistic Report Card | Blocked | | Hidden until the backend serves an EHI |
| Parent: observation submission | Done | | Shared `ObservationForm` |
| Parent: teacher notes (read-only) | Blocked | | No backend endpoint: rule B17 limits parents to their own observations, their child's activities, streak, growth areas and monthly summary. Screen removed until that changes |
| Parent: growth areas + monthly summary | Done | | Plain language, no clinical scores; this month live, earlier months as the backend stored them |

## School Web App
| Item | Status | Owner | Notes |
|---|---|---|---|
| Teacher: student list | Done | | Students of the teacher's own classes; growth areas and awaiting-review counts |
| Teacher: observation submission (with Level, LB area) | Done | | `variant="teacher"` |
| Teacher: direct activity assignment | Done | | Library filtered by type and title |
| Teacher: student profile (growth areas, progress, history) | Done | | Up to 5 growth areas, activities with the student's answers, and the teacher's own observations with the psychologist's note (teachers see only what they wrote, rule B7) |
| Psychologist: review queue + filters | Done | | All 5 filters as KPI tiles (counts from the API), plus school |
| Psychologist: observation detail view | Done | | Metadata plus related history |
| Psychologist: tag area / recommend activity / review actions | Done | | One development area (needed for Significant), 1–10 recommended activities, teacher-only note; both close-out actions |
| Psychologist: activity authoring form | Done | | Plain form, no drag-and-drop; edit, with type and options locked once assigned; archive |

## Admin Panel
| Item | Status | Owner | Notes |
|---|---|---|---|
| School Admin: manage students/teachers/classes/parents | Done | | Create (students with ID + PIN), edit, switch accounts off and on; class teachers and students; parent links |
| Platform Admin: manage schools + users across roles | Done | | Schools with live counts; accounts across every role and school |

## Quality
| Item | Status | Owner | Notes |
|---|---|---|---|
| Playwright e2e: full Observe→Review→Assign→Do→See path | Not Started | | A manual headless-Chrome run of the whole loop against the real backend passed (11 Oct 2026); a committed suite needs a backend in CI |
| Responsive QA pass (mobile/tablet/desktop) | Not Started | | Redesign screenshot-checked at 390, 820 and 1440px in headless Chrome; prototype-aligned family screens at 390, 430 and 1440px; not yet verified on devices |
