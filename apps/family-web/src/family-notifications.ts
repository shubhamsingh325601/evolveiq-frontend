import {
  XP_PER_ACTIVITY,
  type FamilyAssignment,
  type Person,
  type SessionUser,
  type Star as StarRecord,
  type StudentAssignment,
} from '@evolveiq/api-client';
import { firstNameOf, type AppNotification } from '@evolveiq/domain';
import { ClipboardList, Star, Target } from '@evolveiq/ui';

export interface FamilyNotificationSources {
  user: SessionUser;
  /** A student's own assignments. */
  missions: StudentAssignment[];
  /** A student's own stars. */
  myStars: StarRecord[];
  /** A parent's children, and each child's activities and stars. */
  children: Person[];
  assignmentsByChild: Map<string, FamilyAssignment[]>;
  starsByChild: Map<string, StarRecord[] | undefined>;
}

/**
 * What a parent or student would want to hear about, built from data the
 * family app already loads: activities set and finished, and stars given.
 * Nothing clinical is ever among it — a parent's data has no clinical field to
 * use, and a star is something good by definition.
 */
export function familyNotifications({
  user,
  missions,
  myStars,
  children,
  assignmentsByChild,
  starsByChild,
}: FamilyNotificationSources): AppNotification[] {
  if (user.role === 'student') {
    const missionNews = missions.map((mission): AppNotification =>
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
    const starNews = myStars.map(
      (star): AppNotification => ({
        id: `star-${star.id}`,
        title: `${star.givenBy.fullName} gave you a star`,
        detail: star.description,
        at: star.createdAt,
        to: '/student/today',
        tone: 'star',
        icon: Star,
      }),
    );
    return [...starNews, ...missionNews];
  }

  if (user.role === 'parent') {
    return children.flatMap((child) => {
      const name = firstNameOf(child.fullName);
      const activityNews = (assignmentsByChild.get(child.id) ?? []).map(
        (assignment): AppNotification =>
          assignment.completedAt
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
              },
      );
      // Stars from school. The ones this parent gave are their own news already.
      const starNews = (starsByChild.get(child.id) ?? [])
        .filter((star) => star.givenBy.role === 'teacher')
        .map(
          (star): AppNotification => ({
            id: `star-${star.id}`,
            title: `${name} got a star from ${star.givenBy.fullName}`,
            detail: star.description,
            at: star.createdAt,
            to: `/parent/children/${child.id}`,
            tone: 'star',
            icon: Star,
          }),
        );
      return [...starNews, ...activityNews];
    });
  }

  return [];
}
