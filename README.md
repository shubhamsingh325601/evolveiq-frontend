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

There is no backend yet, so every app runs against an in-memory mock that
serves realistic data. Sign in with any of the accounts listed on the sign-in
screen — for example `priya@family.test` (parent), `rao@school.test` (teacher),
`mehta@school.test` (psychologist), `clara@school.test` (school admin) or
`tunde@evolveiq.test` (platform admin).

```bash
pnpm lint        # eslint across every workspace
pnpm typecheck   # tsc --noEmit across every workspace
pnpm test        # vitest, 75 tests
pnpm build       # production build of all three apps
```

## Connecting the real backend

Everything the frontend knows about the API is in two files:

| File | What to change |
|---|---|
| `packages/api-client/src/endpoints.ts` | The paths, if they differ from what is assumed there |
| `.env` at the repo root (copy `.env.example`) | `VITE_API_BASE_URL=https://…` |

One `.env` at the repo root configures all three apps. Setting
`VITE_API_BASE_URL` is enough to switch every screen over: `http-client.ts`
routes to the mock only while that variable is empty. No screen, hook or
component changes.

The backend is expected to answer JSON, accept `Authorization: Bearer <token>`,
and return `{ user, token }` from the login endpoint. The shapes it should
return are the exported types in `packages/api-client/src/types.ts`; the mock in
`packages/api-client/src/mock/fixtures.ts` is a working example of each.

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
  api-client/     Typed fetch, TanStack Query hooks, mock backend
  auth/           Session, role guards, role→route map
  config/         Tailwind preset, tsconfig base, eslint preset
```

The four components in `packages/domain` are shared by all three apps and are
never forked per app — they take props and variants instead.

## Two rules worth knowing before editing

**Parents and students never see clinical detail.** This is enforced in
`packages/api-client/src/redaction.ts`, not by hiding fields in a component, so
a new parent screen cannot leak level, learning-behaviour area, psychologist
notes or the significance flag by accident. `packages/api-client/src/redaction.test.ts`
covers it. The EvolvIQ Holistic Index that parents and students see is a
development index with no clinical field in its type at all;
`mock-transport.test.ts` checks the response carries nothing else. And the
query cache is cleared whenever someone signs in or out (`AuthProvider`), so a
teacher's cached, unredacted responses can never be served to a parent who
signs in next on the same device; `DevShell.test.tsx` covers that.

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
