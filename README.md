# EvolvIQ Frontend

Three responsive web apps sharing one design system and one domain model, in a
single pnpm monorepo. See `docs/ARCHITECTURE.md` for why, and
`docs/SCOPE_OF_WORK.md` for what is in and out of scope.

## Running it

```bash
pnpm install

pnpm dev:family   # Parent + Student      → http://localhost:5173
pnpm dev:school   # Teacher + Psychologist → http://localhost:5174
pnpm dev:admin    # School + Platform admin → http://localhost:5175
```

With no backend configured, every app runs against the built-in demo: an
in-memory copy of the backend with the same routes, shapes and rules. The
sign-in screens list one-tap demo accounts. To sign in by hand, adults use
their email (`priya@family.test` parent, `rao@school.test` teacher,
`mehta@school.test` psychologist, `clara@school.test` school admin,
`tunde@evolveiq.test` platform admin) with the password `EvolvIQ-Demo-2026`;
students use their student ID (`RV-1001` is Maya) with the PIN `246810`.

```bash
pnpm lint        # eslint across every workspace
pnpm typecheck   # tsc --noEmit across every workspace
pnpm test        # vitest, 112 tests
pnpm build       # production build of all three apps
```

## Running against the real backend

The frontend talks to evolveiq-backend (`/api/v1`), checked out alongside this repo.

1. Start the backend with demo data (in `evolveiq-backend`):
   `npm run db:migrate && npm run db:seed-demo && npm run dev` — it listens on
   port 3000. The demo seed creates the same people as the built-in demo.
2. Copy `.env.example` to `.env` at this repo's root and set
   `VITE_API_BASE_URL=/api/v1`. Optionally set `VITE_SHOW_DEMO_ACCOUNTS=true`
   to keep the one-tap demo accounts on the sign-in screens.
3. `pnpm dev` (or any `pnpm dev:*`). The Vite dev server forwards `/api` to
   `VITE_API_PROXY_TARGET` (default `http://localhost:3000`), so the browser
   only ever talks to its own origin and the backend needs no CORS.

Put these variables in `.env` rather than on the command line: Git Bash on
Windows rewrites a value like `/api/v1` into a Windows path.

For a deployed build, set `VITE_API_BASE_URL` to the API's full URL and serve
the apps from the same site as the API (or enable CORS for them there).

What the client does with the API, in one place (`packages/api-client`):

- **Contract.** `types.ts` mirrors the backend's responses field for field,
  with one shape per audience (a parent's observation is not a teacher's with
  fields hidden). `endpoints.ts` lists every path. The mock in `mock/` serves
  the same shapes, so screens behave the same with or without a server.
- **Sessions.** Sign-in returns an access token (1 hour) and a rotating
  refresh token. On a 401 the client renews once and resends — one renewal
  shared by every request in flight, and one at a time across tabs, since a
  refresh token used twice ends the session (`packages/auth/src/session-store.ts`).
  Sign-out revokes the session on the server.
- **Lists.** Every list endpoint is paginated. Hooks collect every page
  (`list.ts`, capped at 5,000 rows) and `RecordsTable` sorts, searches and
  pages on screen; counts for KPI tiles come from the list metadata alone.
- **Not from the backend yet.** The EvolvIQ Holistic Index views and teacher
  notes for parents are hidden (`FEATURES.holisticIndex` in `features.ts`;
  the EHI components stay in `packages/domain`, tested). A student's level and
  XP are worked out here from the activities they have finished
  (`student-level.ts`: 10 XP each, a level every 100).

## Layout

```
apps/
  family-web/     Parent + Student
  school-web/     Teacher + Psychologist
  admin-panel/    School admin + Platform admin
tools/
  dev-shell/      Development launcher: all roles on one port. Not deployed.
packages/
  ui/             Design system primitives
  domain/         ObservationForm, ActivityPlayer, RecordsTable, AppSidebar
  api-client/     The backend contract, typed fetch with token renewal, TanStack Query hooks, built-in demo backend
  auth/           Sign-in, sessions across tabs, role guards, role→route map
  config/         Tailwind preset, tsconfig base, eslint preset, dev-server API proxy
```

The four components in `packages/domain` are shared by all three apps and are
never forked per app — they take props and variants instead.

## Two rules worth knowing before editing

**Parents and students never see clinical detail.** The backend answers
parents with their own shapes (`/family/...` routes), and those types have no
clinical field to show: no level, learning-behaviour area, development area,
psychologist note or reviewer. On top of that, the family hooks copy each
response field by field (`packages/api-client/src/redaction.ts`), so even a
field too many from the API would never reach a parent's cache or screen;
`redaction.test.ts` and `mock-transport.test.ts` cover it. And the query cache
is cleared whenever someone signs in or out (`AuthProvider`), so one person's
cached responses can never be served to whoever signs in next on the same
device; `DevShell.test.tsx` covers that.

**Roles are checked in one place.** `RoleGuard` in `packages/auth` wraps each
branch of the route tree. If a route is reachable, the data on it is allowed —
screens never check roles themselves.

## Design

The design system is called **Dawn**. Tokens live only in
`packages/config/tailwind-preset.js`; icons come from `packages/ui` (a curated
lucide set), never from `lucide-react` directly.

The product sits under a dawn sky: a night-indigo rail, a pale mist backdrop
that warms toward peach, and translucent white surfaces that pick up that
light. Only bars and dialogs, which scroll over content, pay for a backdrop
blur; cards are simply translucent.

Colour is semantic, one meaning per hue: **iris** (indigo into royal blue) is
action, **lilac** is a person's own words, **jade** is growth and completion,
**honey** is awaiting review, **coral** is flagged significant or destructive.
The full royal-blue-to-lilac gradient is kept for a few moments: the brand
mark, the main action, the active menu item and a student's finish
celebration. Nothing is coloured for decoration.

Two small sets sit outside that scheme. The **EHI's five pillars** (education,
skills, physical, wellbeing, character) have their own data colours — indigo,
emerald, amber, pink, violet — validated together as a colour-blind-safe set in
ring order. They only appear inside EHI charts, always beside the pillar's name
and value. **Flame** orange is a student's streak and nothing else.

The whole product follows the client's prototypes: heavy 800–900 weight
headings, cards with a hairline edge, and a row of KPI tiles opening each
working screen. The family app keeps the EHI as the one hero figure on a
parent's home and a deep indigo-to-plum header on the Holistic Report. Staff
screens lead with counts — the MVP deals in counts rather than charts — and
give the night panel to the one figure that matters most, such as a class's
average EHI. On the review queue the tiles are the filters.

The shell is the same in every app. A floating night rail carries the brand,
the role, a context card each app fills from data it already has (a teacher's
classes, the review pulse, a parent's children with their EHI, a student's
level, an admin's school in counts), the role's main action and the menu. It
narrows to its icons and remembers that. A glass top bar says where and when,
and holds the notifications bell, whose items each app builds from its own
data — the bell fetches nothing itself.

Two typefaces with a rule: **Literata (serif), in a lilac bubble, is only ever
used for text a person actually wrote about a child** — an observation, a
teacher note, a monthly summary. Lexend carries everything the system says
itself. Seeing the serif tells a reader, without a label, that these are
someone's own words.

Radius follows hierarchy: 12px controls, 20px cards, 28px for the rail, hero
panels and dialogs. Student-facing surfaces go one step rounder.

On phones the rail becomes a bottom tab bar driven by the same menu config, with
a role's main create action as the raised button in the middle. Motion answers
something a person did, with one exception: charts draw themselves in once when
they first appear. The one celebration plays when a student finishes an
activity, and `prefers-reduced-motion` turns all of it off.
