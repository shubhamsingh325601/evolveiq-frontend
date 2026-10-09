# EvolvIQ Frontend — Progress Tracker

Status legend: `Not Started` / `In Progress` / `Blocked` / `Done`

Update this table as work lands — keep it in sync with merged PRs, not with plans.

> Every screen below runs against the in-memory mock backend in
> `packages/api-client/src/mock`. Setting `VITE_API_BASE_URL` switches all of
> them to the real API with no screen changes; see README.md.

## Setup
| Item | Status | Owner | Notes |
|---|---|---|---|
| Monorepo scaffold (pnpm workspaces, apps/, packages/) | Done | | pnpm workspaces, 3 apps + 5 packages |
| Shared config (eslint, tsconfig, tailwind preset) | Done | | `packages/config`; tokens defined once |
| `packages/ui` design system baseline | Done | | Primitives incl. Quote, RuledList, StatTile and three SVG charts |
| Visual redesign ("Dawn" design system) | Done | | Tokens, primitives, shell and every screen; curated lucide icons; see README |
| Family app aligned to the client's prototype | Done | | Client feedback 9 Oct 2026: parent and student views follow the "EvolvIQMobile" Gemini canvas |
| Whole-product redesign on the prototypes' language | Done | | New shell (collapsible rail, context cards, top bar, notifications), KPI tiles on every working screen, sign-in and dev launcher |
| Query cache cleared on sign-in and sign-out | Done | | Fixes one person's cached data (incl. unredacted observations) reaching the next person on the same device; dev-shell regression test |
| `packages/auth` — session + role guards | Done | | `RoleGuard` is the only role check |
| `packages/api-client` — typed fetch + TanStack Query setup | Done | | Mock transport until the API URL lands |
| CI: lint + typecheck + test on PR | Done | | `.github/workflows/ci.yml`, also builds |

## Shared domain components
| Item | Status | Owner | Notes |
|---|---|---|---|
| `ObservationForm` (parent/teacher variants) | Done | | 4 tests |
| `ActivityPlayer` shell + 5 type renderers | Done | | 3 tests |
| `RecordsTable` | Done | | 5 tests |
| `AppSidebar` (role-based menu config) | Done | | 3 tests; collapsible, with an app-supplied context card; same config drives `AppBottomNav` on phones (3 tests) |
| EHI charts: `RingsChart`, `TrendChart`, `RadarChart` | Done | | Hand-drawn SVG in `packages/ui`; palette validated; covered through `HolisticIndexCard` (3 tests) and `HolisticReport` (6 tests) |
| EHI and level/XP API contract + mock | Done | | `/students/:id/holistic-index`, `/students/:id/level`, `xp` on assignments; 6 mock tests |

## Family Web App
| Item | Status | Owner | Notes |
|---|---|---|---|
| Student: today's activities | Done | | Home as Daily Missions, XP per mission |
| Student: activity player integration | Done | | Mock data; finish screen shows XP earned |
| Student: progress/streak | Done | | Seven-day marks; streak flame on home |
| Student: level and XP | Done | | Level title, progress to next level |
| Student: own Holistic Report Card | Done | | Shared `HolisticReport` |
| Parent: children list + development info | Done | | One dashboard per child with a switcher |
| Parent: EvolvIQ Holistic Index | Done | | Score, change since last year, five-pillar rings |
| Parent: Holistic Report Card | Done | | Trajectory, skill profile, annual card, Growth Playbook, PDF and share |
| Parent: observation submission | Done | | Shared `ObservationForm` |
| Parent: teacher notes (read-only) | Done | | Mock data |
| Parent: growth areas + monthly summary | Done | | Plain language, no clinical scores |

## School Web App
| Item | Status | Owner | Notes |
|---|---|---|---|
| Teacher: student list | Done | | Shared `RecordsTable`; KPI tiles and EHI per student |
| Teacher: observation submission (with Level, LB area) | Done | | `variant="teacher"` |
| Teacher: direct activity assignment | Done | | Filterable library |
| Teacher: student profile (growth areas, progress, history) | Done | | Caps growth areas at 5; EHI card and the Holistic Report |
| Psychologist: review queue + filters | Done | | All 5 filters as KPI tiles, plus school |
| Psychologist: observation detail view | Done | | Metadata plus related history |
| Psychologist: tag area / recommend activity / review actions | Done | | Both close-out actions |
| Psychologist: activity authoring form | Done | | Plain form, no drag-and-drop |

## Admin Panel
| Item | Status | Owner | Notes |
|---|---|---|---|
| School Admin: manage students/teachers/classes/parents | Done | | All four, create and edit |
| Platform Admin: manage schools + users across roles | Done | | Role filter across schools |

## Quality
| Item | Status | Owner | Notes |
|---|---|---|---|
| Playwright e2e: full Observe→Review→Assign→Do→See path | Not Started | | Vitest/RTL covers each app separately |
| Responsive QA pass (mobile/tablet/desktop) | Not Started | | Redesign screenshot-checked at 390, 820 and 1440px in headless Chrome; prototype-aligned family screens at 390, 430 and 1440px; not yet verified on devices |
