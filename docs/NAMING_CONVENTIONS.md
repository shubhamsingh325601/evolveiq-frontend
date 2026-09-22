# Naming Conventions — Frontend

## Files & folders
- Components: `PascalCase.tsx` (e.g. `ObservationForm.tsx`)
- Hooks: `useCamelCase.ts` (e.g. `useActivityQueue.ts`)
- Everything else (utils, config, non-component modules): `kebab-case.ts`
- Test files: colocated, `<name>.test.ts(x)`
- One component per file; file name matches the exported component name.

## Code
- Components, types, interfaces: `PascalCase`
- Variables, functions, hooks: `camelCase`
- Constants (module-level, immutable): `UPPER_SNAKE_CASE`
- Booleans read as a question: `isLoading`, `hasError`, `canEdit`

## React specifics
- Props type: `<ComponentName>Props`
- Context: `<Name>Context` + `<Name>Provider` + `use<Name>()` hook, no bare `useContext` calls outside the hook
- Query hooks named after the resource, not the HTTP verb: `useObservations`, not `useGetObservations`

## CSS / Tailwind
- No new class-name systems — Tailwind utility classes directly in JSX.
- Shared design tokens (colors, spacing) live only in `packages/config/tailwind-preset`, never redefined per app.

## Routes
- Path segments: `kebab-case` (e.g. `/review-queue/:observationId`)
- Route param names: `camelCase` (e.g. `:studentId`)

## Git
- Branches: see BRANCHING_STRATEGY.md
- Commits: [Conventional Commits](https://www.conventionalcommits.org/) —
  `feat(school): add review queue significant filter`,
  `fix(family): correct streak off-by-one`,
  `chore(infra): add playwright ci job`
  Allowed types: `feat`, `fix`, `chore`, `refactor`, `test`, `docs`.
  Scope matches the branch `<scope>` list in BRANCHING_STRATEGY.md.

## Environment variables
- `VITE_` prefix (required by Vite to expose to client), `UPPER_SNAKE_CASE`:
  `VITE_API_BASE_URL`, `VITE_AUTH_DOMAIN`
