import type { FamilyAssignment, ParentObservation, Role, Star } from './types';

const PARENT_FACING_ROLES: Role[] = ['parent', 'student'];

/**
 * Hard product rule (see .claude/CLAUDE.md): parent- and student-facing views
 * never surface clinical scores or psychologist notes.
 *
 * The backend already answers parents with their own allow-listed shapes.
 * These copy those shapes field by field as the family hooks receive them, so
 * if the API ever sent a field too many it would still never reach a parent's
 * cache or screen. They never spread a response, so a new field cannot slip
 * through by default.
 */
export function toParentObservation(raw: ParentObservation): ParentObservation {
  return {
    id: raw.id,
    studentId: raw.studentId,
    tone: raw.tone,
    area: raw.area,
    description: raw.description,
    when: raw.when,
    howOften: raw.howOften,
    status: raw.status,
    createdAt: raw.createdAt,
  };
}

/**
 * A star reaches students and parents as well as staff, so it is copied the
 * same way: the words, the area and who gave it — never a learning-behaviour
 * area, Level or anything else that might arrive beside them.
 */
export function toStar(raw: Star): Star {
  return {
    id: raw.id,
    studentId: raw.studentId,
    area: raw.area,
    description: raw.description,
    givenBy: { fullName: raw.givenBy.fullName, role: raw.givenBy.role },
    createdAt: raw.createdAt,
  };
}

export function toFamilyAssignment(raw: FamilyAssignment): FamilyAssignment {
  return {
    id: raw.id,
    title: raw.title,
    isDone: raw.isDone,
    assignedAt: raw.assignedAt,
    completedAt: raw.completedAt,
  };
}

export function canSeeClinicalDetail(role: Role): boolean {
  return !PARENT_FACING_ROLES.includes(role);
}
