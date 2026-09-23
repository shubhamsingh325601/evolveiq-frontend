import type { Observation, Role } from './types';

const PARENT_FACING_ROLES: Role[] = ['parent', 'student'];

/**
 * Hard product rule (see .claude/CLAUDE.md): parent- and student-facing views
 * never surface clinical scores or psychologist notes.
 *
 * This is enforced here, in the data layer, rather than by hiding fields in a
 * component — a new parent screen cannot leak these fields by accident because
 * they never reach the client in the first place.
 */
export function redactObservationForRole(observation: Observation, role: Role): Observation {
  if (!PARENT_FACING_ROLES.includes(role)) return observation;

  const {
    level: _level,
    learningBehaviourArea: _learningBehaviourArea,
    teacherOnlyNote: _teacherOnlyNote,
    taggedAreas: _taggedAreas,
    reviewedById: _reviewedById,
    ...parentSafe
  } = observation;

  return { ...parentSafe, isSignificant: false };
}

export function redactObservationsForRole(
  observations: Observation[],
  role: Role,
): Observation[] {
  return observations.map((observation) => redactObservationForRole(observation, role));
}

export function canSeeClinicalDetail(role: Role): boolean {
  return !PARENT_FACING_ROLES.includes(role);
}
