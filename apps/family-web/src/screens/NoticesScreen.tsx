import { useAuth } from '@evolveiq/auth';
import { useHonours, useNotices } from '@evolveiq/api-client';
import { HonourCard, NoticeBoard } from '@evolveiq/domain';
import { ErrorState, PageHeader, SectionTitle, Trophy } from '@evolveiq/ui';

/**
 * The school's notice board for a family: events, activities, policy updates
 * and the numbers to call, with this month's celebrations on top — the Staff of
 * the Month, and the child's own honours (never another child's).
 */
export function NoticesScreen() {
  const { user } = useAuth();
  const notices = useNotices();
  const honours = useHonours();
  if (notices.isError) return <ErrorState onRetry={() => void notices.refetch()} />;

  const latestMonth = (honours.data ?? []).map((h) => h.month).sort().at(-1);
  const celebrations = (honours.data ?? []).filter((h) => h.month === latestMonth);

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        title="Notice board"
        subtitle={user?.role === 'student' ? 'What is happening at your school.' : 'What is happening at school, and who to call in an emergency.'}
      />
      {celebrations.length > 0 ? (
        <section className="flex flex-col gap-4">
          <SectionTitle icon={Trophy} iconClassName="text-star-500">
            Celebrations
          </SectionTitle>
          <div className="grid gap-4 md:grid-cols-2">
            {celebrations.map((honour) => (
              <HonourCard key={honour.id} honour={honour} />
            ))}
          </div>
        </section>
      ) : null}
      <NoticeBoard notices={notices.data ?? []} isLoading={notices.isLoading} />
    </div>
  );
}
