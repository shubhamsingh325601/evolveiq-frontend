import { levelForCompletedCount } from '../student-level';
import type { StudentLevel } from '../types';
import { useMyAssignments } from './useAssignments';

/**
 * The signed-in student's level and XP, worked out from the activities they
 * have finished. It shares the student's assignment list, so finishing an
 * activity (which refreshes that list) moves it on by itself.
 */
export function useStudentLevel(options: { isEnabled?: boolean } = {}) {
  const assignments = useMyAssignments(options);
  const data: StudentLevel | undefined = assignments.data
    ? levelForCompletedCount(assignments.data.filter((assignment) => assignment.isDone).length)
    : undefined;
  return { data, isLoading: assignments.isLoading, isError: assignments.isError };
}
