import { Outlet } from 'react-router-dom';
import {
  businessMonth,
  useClassRoster,
  useHonours,
  useNotices,
  useReviewQueue,
  useReviewQueueCounts,
  useSchool,
  useStaffReviews,
  useTeacherObservations,
  type ReviewQueueFilters,
} from '@evolveiq/api-client';
import { ROLE_LABELS, useAuth } from '@evolveiq/auth';
import { AppLayout, formatMonth, schoolLifeNotifications, type AccountMenuSection } from '@evolveiq/domain';
import { Award } from '@evolveiq/ui';
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
  const notices = useNotices({}, { isEnabled: Boolean(user) });
  const honours = useHonours({}, { isEnabled: isTeacher });
  const reviews = useStaffReviews({}, { isEnabled: isTeacher });

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
  // A teacher's own monthly reviews: private, so in their account menu rather than on a shared page.
  const latestReview = (reviews.data ?? [])[0];
  const accountSections: AccountMenuSection[] = isTeacher
    ? [
        {
          title: 'You',
          items: [
            {
              id: 'reviews',
              label: 'Your reviews',
              detail: latestReview
                ? `${formatMonth(latestReview.month)}: ${latestReview.average.toFixed(1)} of 5`
                : `None yet for ${formatMonth(businessMonth())}`,
              to: '/teacher/reviews',
              icon: Award,
            },
          ],
        },
      ]
    : [];

  return (
    <AppLayout
      appName="EvolvIQ"
      roleLabel={ROLE_LABELS[user.role]}
      sections={menuForRole(user.role, pulse.pending ?? 0)}
      userName={user.fullName}
      onSignOut={signOut}
      {...(contextLabel ? { contextLabel } : {})}
      contextCard={contextCard}
      accountSections={accountSections}
      notificationsKey={user.id}
      notifications={[
        ...staffNotifications({
          user,
          pending: pending.data ?? [],
          ownObservations: own,
          studentNameById: new Map(roster.students.map((student) => [student.id, student.fullName])),
        }),
        ...schoolLifeNotifications({
          notices: notices.data ?? [],
          honours: honours.data ?? [],
          viewerId: user.id,
          noticesPath: '/notices',
          honourPath: (honour) => (honour.kind === 'student_of_month' ? `/teacher/students/${honour.honoree.id}` : '/notices'),
        }),
      ]}
    >
      <Outlet />
    </AppLayout>
  );
}
