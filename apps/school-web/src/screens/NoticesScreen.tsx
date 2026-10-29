import { useAuth } from '@evolveiq/auth';
import { useHonours, useNotices } from '@evolveiq/api-client';
import { HonourWall, NoticeBoard } from '@evolveiq/domain';
import { ErrorState, Megaphone, PageHeader, SectionTitle, Trophy } from '@evolveiq/ui';

/**
 * The notice board for school staff: the school's celebration wall (Staff and
 * Students of the Month, for teachers), then events, activities, trainings,
 * policy updates and emergency numbers — staff notices included.
 */
export function NoticesScreen() {
  const { user } = useAuth();
  const isTeacher = user?.role === 'teacher';
  const notices = useNotices();
  // The wall is a school's; counsellors work across schools, so theirs is the board alone.
  const honours = useHonours({}, { isEnabled: isTeacher });
  if (notices.isError) return <ErrorState onRetry={() => void notices.refetch()} />;

  return (
    <div className="flex flex-col gap-10">
      <PageHeader title="Notice board" subtitle="Celebrations, what is coming up, policy updates, and who to call in an emergency." />
      {isTeacher ? (
        <section className="flex flex-col gap-4">
          <SectionTitle icon={Trophy} iconClassName="text-star-500">
            Wall of fame
          </SectionTitle>
          <HonourWall honours={honours.data ?? []} isLoading={honours.isLoading} monthLimit={2} />
        </section>
      ) : null}
      <section className="flex flex-col gap-4">
        <SectionTitle icon={Megaphone} iconClassName="text-honey-500">
          Notices
        </SectionTitle>
        <NoticeBoard notices={notices.data ?? []} isLoading={notices.isLoading} showsAudience />
      </section>
    </div>
  );
}
