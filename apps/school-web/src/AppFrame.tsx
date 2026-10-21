import { Outlet } from 'react-router-dom';
import {
  useClassRoster,
  useReviewQueue,
  useReviewQueueCounts,
  useSchool,
  useTeacherObservations,
  type ReviewQueueFilters,
} from '@evolveiq/api-client';
import { ROLE_LABELS, useAuth } from '@evolveiq/auth';
import { AppLayout } from '@evolveiq/domain';
import { menuForRole } from './app-menu';
import { ClassesSidebarCard } from './components/ClassesSidebarCard';
import { ReviewPulseCard } from './components/ReviewPulseCard';
import { REVIEW_FILTERS } from './review-filters';
import { staffNotifications } from './staff-notifications';

/** The counts behind the counsellor's review pulse; the queue's tiles share their cache entries. */
const PULSE_FILTERS = {
  pending: REVIEW_FILTERS.pending,
  significantPending: { ...REVIEW_FILTERS.pending, level: 'significant' },
  all: REVIEW_FILTERS.all,
} satisfies Record<string, ReviewQueueFilters>;

export function AppFrame() {
  const { user, signOut } = useAuth();
  const isTeacher = user?.role === 'teacher';
  const isPsychologist = user?.role === 'psychologist';

  const roster = useClassRoster({ isEnabled: isTeacher });
  const ownObservations = useTeacherObservations({ isEnabled: isTeacher });
  const pending = useReviewQueue(REVIEW_FILTERS.pending, { isEnabled: isPsychologist });
  const pulse = useReviewQueueCounts(PULSE_FILTERS, { isEnabled: isPsychologist });
  const school = useSchool(isTeacher ? user?.schoolId : undefined);

  if (!user) return null;

  const own = ownObservations.data ?? [];
  const ownPending = own.filter((entry) => entry.status === 'pending').length;
  const starsGiven = own.filter((entry) => entry.tone === 'positive').length;
  const contextCard = isTeacher ? (
    <ClassesSidebarCard
      classes={roster.classes}
      students={roster.students}
      pendingCount={ownPending}
      starsGiven={starsGiven}
    />
  ) : isPsychologist ? (
    <ReviewPulseCard pending={pulse.pending} significantPending={pulse.significantPending} total={pulse.all} />
  ) : null;
  const contextLabel = isTeacher ? school.data?.name : 'All schools';

  return (
    <AppLayout
      appName="EvolvIQ"
      roleLabel={ROLE_LABELS[user.role]}
      sections={menuForRole(user.role, pulse.pending ?? 0)}
      userName={user.fullName}
      onSignOut={signOut}
      {...(contextLabel ? { contextLabel } : {})}
      contextCard={contextCard}
      notificationsKey={user.id}
      notifications={staffNotifications({
        user,
        pending: pending.data ?? [],
        ownObservations: own,
        studentNameById: new Map(roster.students.map((student) => [student.id, student.fullName])),
      })}
    >
      <Outlet />
    </AppLayout>
  );
}
