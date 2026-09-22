# EvolvIQ Frontend — Project Instructions

Read these before working in this repo, in this order:
1. `docs/ARCHITECTURE.md` — stack, monorepo layout, shared domain components
2. `docs/SCOPE_OF_WORK.md` — what's in/out of scope for the MVP, by role
3. `docs/NAMING_CONVENTIONS.md`
4. `docs/BRANCHING_STRATEGY.md`
5. `docs/PROGRESS_TRACKER.md` — update this when a tracked item's status changes

## Non-negotiables
- Three apps (`apps/family-web`, `apps/school-web`, `apps/admin-panel`) share
  one design system and one set of domain components
  (`ObservationForm`, `ActivityPlayer`, `RecordsTable`, `AppSidebar`) in
  `packages/domain` and `packages/ui`. Never fork these per app — extend via
  props/variants instead.
- Don't build anything listed under "Explicitly out of scope" in
  docs/SCOPE_OF_WORK.md (charts, permission editor, chat, drag-and-drop
  builder, native mobile, CSV import) unless the user explicitly asks for it.
- Parent-facing views never surface clinical scores or psychologist notes —
  this is a hard product rule, not a styling choice.
- All network access goes through `packages/api-client` — no ad-hoc `fetch`
  calls in app code.

## When making changes
- Follow docs/NAMING_CONVENTIONS.md for files, components, branches, and commits.
- Update docs/PROGRESS_TRACKER.md when you complete a tracked item.
- New shared behavior belongs in `packages/*`, not duplicated across apps.
