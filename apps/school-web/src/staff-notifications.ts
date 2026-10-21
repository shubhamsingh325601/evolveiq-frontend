import type { ReviewObservation, SessionUser, TeacherObservation } from '@evolveiq/api-client';
import { firstNameOf, OBSERVATION_AREA_LABELS, type AppNotification } from '@evolveiq/domain';
import { Check, CircleAlert, Inbox, MessageCircle, NotebookPen } from '@evolveiq/ui';

export interface StaffNotificationSources {
  user: SessionUser;
  /** Psychologists: the pending part of the review queue. */
  pending: ReviewObservation[];
  /** Teachers: the observations they wrote. */
  ownObservations: TeacherObservation[];
  /** Teachers: their students, to name them. */
  studentNameById: Map<string, string>;
}

/**
 * What a teacher or psychologist would want to hear about, built from data the
 * school app already loads. Nothing here is fetched for the bell alone.
 */
export function staffNotifications({
  user,
  pending,
  ownObservations,
  studentNameById,
}: StaffNotificationSources): AppNotification[] {
  if (user.role === 'psychologist') {
    return pending.map((entry): AppNotification => {
      const name = firstNameOf(entry.student.fullName);
      const area = OBSERVATION_AREA_LABELS[entry.area].toLowerCase();
      if (entry.level === 'significant') {
        return {
          id: `significant-${entry.id}`,
          title: `${name} was flagged significant`,
          detail: `${entry.author.fullName}, ${area}`,
          at: entry.createdAt,
          to: `/review-queue/${entry.id}`,
          tone: 'coral',
          icon: CircleAlert,
        };
      }
      if (entry.author.role === 'parent') {
        return {
          id: `parent-${entry.id}`,
          title: `A parent wrote about ${name}`,
          detail: entry.description,
          at: entry.createdAt,
          to: `/review-queue/${entry.id}`,
          tone: 'lilac',
          icon: NotebookPen,
        };
      }
      return {
        id: `new-${entry.id}`,
        title: `New observation about ${name}`,
        detail: `${entry.author.fullName}, ${area}`,
        at: entry.createdAt,
        to: `/review-queue/${entry.id}`,
        tone: 'honey',
        icon: Inbox,
      };
    });
  }

  if (user.role === 'teacher') {
    return ownObservations
      .filter((entry) => entry.status === 'reviewed' && entry.reviewedAt)
      .map((entry): AppNotification => {
        const name = firstNameOf(studentNameById.get(entry.studentId) ?? 'a student');
        return entry.teacherOnlyNote
          ? {
              id: `note-${entry.id}`,
              title: `The counsellor left you a note about ${name}`,
              detail: entry.teacherOnlyNote,
              at: entry.reviewedAt!,
              to: `/teacher/students/${entry.studentId}`,
              tone: 'iris',
              icon: MessageCircle,
            }
          : {
              id: `reviewed-${entry.id}`,
              title: `Your observation about ${name} was reviewed`,
              detail: OBSERVATION_AREA_LABELS[entry.area],
              at: entry.reviewedAt!,
              to: `/teacher/students/${entry.studentId}`,
              tone: 'jade',
              icon: Check,
            };
      });
  }

  return [];
}
