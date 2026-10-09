import type { Activity, Assignment, Student, TeacherNote, User } from '@evolveiq/api-client';
import { firstNameOf, type AppNotification } from '@evolveiq/domain';
import { ClipboardList, MessageCircle, Star, Target } from '@evolveiq/ui';

export interface FamilyNotificationSources {
  user: User;
  students: Student[];
  notes: TeacherNote[];
  assignments: Assignment[];
  activities: Activity[];
}

/**
 * What a parent or student would want to hear about, built from data the
 * family app already loads: notes from teachers, activities set, and
 * activities finished. Nothing clinical is ever among it.
 */
export function familyNotifications({
  user,
  students,
  notes,
  assignments,
  activities,
}: FamilyNotificationSources): AppNotification[] {
  const titleById = new Map(activities.map((activity) => [activity.id, activity.title]));
  const titleOf = (activityId: string) => titleById.get(activityId) ?? 'an activity';

  if (user.role === 'student') {
    return assignments.map((assignment): AppNotification =>
      assignment.completedAt
        ? {
            id: `done-${assignment.id}`,
            title: `You finished ${titleOf(assignment.activityId)}`,
            detail: `+${assignment.xp} XP`,
            at: assignment.completedAt,
            to: '/student/progress',
            tone: 'jade',
            icon: Star,
          }
        : {
            id: `mission-${assignment.id}`,
            title: `New mission: ${titleOf(assignment.activityId)}`,
            detail: `Worth ${assignment.xp} XP when you finish it`,
            at: assignment.assignedAt,
            to: `/student/activities/${assignment.id}`,
            tone: 'iris',
            icon: Target,
          },
    );
  }

  if (user.role === 'parent') {
    const firstNameById = new Map(students.map((student) => [student.id, firstNameOf(student.name)]));
    const nameOf = (studentId: string) => firstNameById.get(studentId) ?? 'your child';

    const fromTeachers = notes.map(
      (note): AppNotification => ({
        id: `note-${note.id}`,
        title: `${note.authorName} left a note about ${nameOf(note.studentId)}`,
        detail: note.body,
        at: note.createdAt,
        to: `/parent/children/${note.studentId}/notes`,
        tone: 'lilac',
        icon: MessageCircle,
      }),
    );
    const activity = assignments.map((assignment): AppNotification =>
      assignment.completedAt
        ? {
            id: `done-${assignment.id}`,
            title: `${nameOf(assignment.studentId)} finished ${titleOf(assignment.activityId)}`,
            at: assignment.completedAt,
            to: `/parent/children/${assignment.studentId}`,
            tone: 'jade',
            icon: Star,
          }
        : {
            id: `set-${assignment.id}`,
            title: `New activity for ${nameOf(assignment.studentId)}: ${titleOf(assignment.activityId)}`,
            detail: `Set by ${assignment.assignedByName}`,
            at: assignment.assignedAt,
            to: `/parent/children/${assignment.studentId}`,
            tone: 'iris',
            icon: ClipboardList,
          },
    );
    return [...fromTeachers, ...activity];
  }

  return [];
}
