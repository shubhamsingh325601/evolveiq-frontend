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
| `packages/ui` design system baseline | Done | | 19 primitives incl. Quote, RuledList |
| Visual redesign ("Dawn" design system) | Done | | Tokens, primitives, shell and every screen; curated lucide icons; see README |
| `packages/auth` — session + role guards | Done | | `RoleGuard` is the only role check |
| `packages/api-client` — typed fetch + TanStack Query setup | Done | | Mock transport until the API URL lands |
| CI: lint + typecheck + test on PR | Done | | `.github/workflows/ci.yml`, also builds |

## Shared domain components
| Item | Status | Owner | Notes |
|---|---|---|---|
| `ObservationForm` (parent/teacher variants) | Done | | 4 tests |
| `ActivityPlayer` shell + 5 type renderers | Done | | 3 tests |
| `RecordsTable` | Done | | 5 tests |
| `AppSidebar` (role-based menu config) | Done | | 3 tests; same config drives `AppBottomNav` on phones (3 tests) |

## Family Web App
| Item | Status | Owner | Notes |
|---|---|---|---|
| Student: today's activities | Done | | Mock data |
| Student: activity player integration | Done | | Mock data |
| Student: progress/streak | Done | | Seven-day marks, no chart |
| Parent: children list + development info | Done | | Mock data |
| Parent: observation submission | Done | | Shared `ObservationForm` |
| Parent: teacher notes (read-only) | Done | | Mock data |
| Parent: growth areas + monthly summary | Done | | Plain language, no scores |

## School Web App
| Item | Status | Owner | Notes |
|---|---|---|---|
| Teacher: student list | Done | | Shared `RecordsTable` |
| Teacher: observation submission (with Level, LB area) | Done | | `variant="teacher"` |
| Teacher: direct activity assignment | Done | | Filterable library |
| Teacher: student profile (growth areas, progress, history) | Done | | Caps growth areas at 5 |
| Psychologist: review queue + filters | Done | | All 5 filters, plus school |
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
| Responsive QA pass (mobile/tablet/desktop) | Not Started | | Redesign screenshot-checked at 390, 820 and 1440px in headless Chrome; not yet verified on devices |
