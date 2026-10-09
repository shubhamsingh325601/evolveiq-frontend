import type { Activity, Assignment, Observation, Student, User } from '@evolveiq/api-client';
import {
  DEVELOPMENT_AREA_LABELS,
  firstNameOf,
  type AppNotification,
} from '@evolveiq/domain';
import { Check, CircleAlert, Inbox, NotebookPen, Star } from '@evolveiq/ui';

export interface StaffNotificationSources {
  user: User;
  observations: Observation[];
  students: Student[];
  assignments: Assignment[];
  activities: Activity[];
}

/**
 * What a teacher or psychologist would want to hear about, built from data the
 * school app already loads. Nothing here is fetched for the bell alone.
 */
export function staffNotifications({
  user,
  observations,
  students,
  assignments,
  activities,
}: StaffNotificationSources): AppNotification[] {
  const firstNameById = new Map(students.map((student) => [student.id, firstNameOf(student.name)]));
  const nameOf = (studentId: string) => firstNameById.get(studentId) ?? 'a student';
  const titleById = new Map(activities.map((activity) => [activity.id, activity.title]));

  if (user.role === 'psychologist') {
    return observations
      .filter((entry) => entry.status === 'pending')
      .map((entry): AppNotification => {
        const area = DEVELOPMENT_AREA_LABELS[entry.area];
        if (entry.isSignificant) {
          return {
            id: `significant-${entry.id}`,
            title: `${nameOf(entry.studentId)} was flagged significant`,
            detail: `${entry.authorName}, ${area.toLowerCase()}`,
            at: entry.createdAt,
            to: `/review-queue/${entry.id}`,
            tone: 'coral',
            icon: CircleAlert,
          };
        }
        if (entry.authorRole === 'parent') {
          return {
            id: `parent-${entry.id}`,
            title: `A parent wrote about ${nameOf(entry.studentId)}`,
            detail: entry.body,
            at: entry.createdAt,
            to: `/review-queue/${entry.id}`,
            tone: 'lilac',
            icon: NotebookPen,
          };
        }
        return {
          id: `new-${entry.id}`,
          title: `New observation about ${nameOf(entry.studentId)}`,
          detail: `${entry.authorName}, ${area.toLowerCase()}`,
          at: entry.createdAt,
          to: `/review-queue/${entry.id}`,
          tone: 'honey',
          icon: Inbox,
        };
      });
  }

  if (user.role === 'teacher') {
    const reviewed = observations
      .filter((entry) => entry.authorId === user.id && entry.reviewedAt)
      .map(
        (entry): AppNotification => ({
          id: `reviewed-${entry.id}`,
          title: `Your observation about ${nameOf(entry.studentId)} was reviewed`,
          detail:
            entry.status === 'no-action-needed'
              ? 'No action needed this time.'
              : DEVELOPMENT_AREA_LABELS[entry.area],
          at: entry.reviewedAt!,
          to: `/teacher/students/${entry.studentId}`,
          tone: 'iris',
          icon: Check,
        }),
      );
    const fromParents = observations
      .filter((entry) => entry.authorRole === 'parent')
      .map(
        (entry): AppNotification => ({
          id: `parent-${entry.id}`,
          title: `${entry.authorName} wrote about ${nameOf(entry.studentId)}`,
          detail: entry.body,
          at: entry.createdAt,
          to: `/teacher/students/${entry.studentId}`,
          tone: 'lilac',
          icon: NotebookPen,
        }),
      );
    const finished = assignments
      .filter((assignment) => assignment.completedAt)
      .map(
        (assignment): AppNotification => ({
          id: `finished-${assignment.id}`,
          title: `${nameOf(assignment.studentId)} finished ${titleById.get(assignment.activityId) ?? 'an activity'}`,
          at: assignment.completedAt!,
          to: `/teacher/students/${assignment.studentId}`,
          tone: 'jade',
          icon: Star,
        }),
      );
    return [...reviewed, ...fromParents, ...finished];
  }

  return [];
}
