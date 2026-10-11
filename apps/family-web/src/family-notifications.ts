import {
  XP_PER_ACTIVITY,
  type FamilyAssignment,
  type Person,
  type SessionUser,
  type StudentAssignment,
} from '@evolveiq/api-client';
import { firstNameOf, type AppNotification } from '@evolveiq/domain';
import { ClipboardList, Star, Target } from '@evolveiq/ui';

export interface FamilyNotificationSources {
  user: SessionUser;
  /** A student's own assignments. */
  missions: StudentAssignment[];
  /** A parent's children, and each child's activities. */
  children: Person[];
  assignmentsByChild: Map<string, FamilyAssignment[]>;
}

/**
 * What a parent or student would want to hear about, built from data the
 * family app already loads: activities set, and activities finished. Nothing
 * clinical is ever among it — a parent's data has no clinical field to use.
 */
export function familyNotifications({
  user,
  missions,
  children,
  assignmentsByChild,
}: FamilyNotificationSources): AppNotification[] {
  if (user.role === 'student') {
    return missions.map((mission): AppNotification =>
      mission.completion
        ? {
            id: `done-${mission.id}`,
            title: `You finished ${mission.activity.title}`,
            detail: `+${XP_PER_ACTIVITY} XP`,
            at: mission.completion.completedAt,
            to: '/student/progress',
            tone: 'jade',
            icon: Star,
          }
        : {
            id: `mission-${mission.id}`,
            title: `New mission: ${mission.activity.title}`,
            detail: `Worth ${XP_PER_ACTIVITY} XP when you finish it`,
            at: mission.assignedAt,
            to: `/student/activities/${mission.id}`,
            tone: 'iris',
            icon: Target,
          },
    );
  }

  if (user.role === 'parent') {
    return children.flatMap((child) =>
      (assignmentsByChild.get(child.id) ?? []).map((assignment): AppNotification => {
        const name = firstNameOf(child.fullName);
        return assignment.completedAt
          ? {
              id: `done-${assignment.id}`,
              title: `${name} finished ${assignment.title}`,
              at: assignment.completedAt,
              to: `/parent/children/${child.id}`,
              tone: 'jade',
              icon: Star,
            }
          : {
              id: `set-${assignment.id}`,
              title: `New activity for ${name}: ${assignment.title}`,
              at: assignment.assignedAt,
              to: `/parent/children/${child.id}`,
              tone: 'iris',
              icon: ClipboardList,
            };
      }),
    );
  }

  return [];
}
