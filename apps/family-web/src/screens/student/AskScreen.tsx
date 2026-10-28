import {
  FEATURES,
  useHolisticIndex,
  useMyAssignments,
  useStars,
  useStreak,
  useStudentLevel,
} from '@evolveiq/api-client';
import { useAuth } from '@evolveiq/auth';
import { AssistantChat, firstNameOf } from '@evolveiq/domain';
import { LoadingState, PageHeader } from '@evolveiq/ui';
import {
  GUIDE_NAME,
  STUDENT_FALLBACK,
  STUDENT_SAFETY,
  studentGreeting,
  studentTopics,
} from '../../assistant-topics';

/**
 * The student's guide, in the middle of their tab bar: quick answers about
 * their missions, level, stars, streak and score, written in advance and
 * filled from their own data. Not a person and not a live chat.
 */
export function AskScreen() {
  const { user } = useAuth();
  const missions = useMyAssignments();
  const level = useStudentLevel();
  const stars = useStars(user?.id);
  const streak = useStreak(user?.id);
  const holistic = useHolisticIndex(FEATURES.holisticIndex ? user?.id : undefined);

  if (!user || missions.isLoading || level.isLoading || stars.isLoading) {
    return <LoadingState label="Getting the guide ready" />;
  }

  const firstName = firstNameOf(user.fullName);
  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6">
      <PageHeader title="Ask EvolvIQ" subtitle="Quick answers about your missions, level, stars and streak." />
      <AssistantChat
        name={GUIDE_NAME}
        greeting={studentGreeting(firstName)}
        topics={studentTopics({
          firstName,
          missions: missions.data ?? [],
          level: level.data,
          stars: stars.data ?? [],
          streakDays: streak.data?.days,
          holistic: holistic.data,
        })}
        fallback={STUDENT_FALLBACK}
        safety={STUDENT_SAFETY}
      />
    </div>
  );
}
