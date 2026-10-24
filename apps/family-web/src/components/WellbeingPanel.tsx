import { Link } from 'react-router-dom';
import { isApiError, useRecordCheckin, useWellnessCheckins } from '@evolveiq/api-client';
import { businessDate } from '@evolveiq/api-client';
import { firstNameOf, possessive, WellbeingCheckinForm, WellbeingTrend } from '@evolveiq/domain';
import { buttonClasses, Card, ErrorState, LoadingState, ShieldCheck } from '@evolveiq/ui';

export interface WellbeingPanelProps {
  studentId: string;
  studentName: string;
  audience: 'student' | 'family';
}

/**
 * A child's daily wellbeing check-in and the last two weeks of them. Nothing is
 * recorded until a parent has allowed it, and the card says so plainly.
 */
export function WellbeingPanel({ studentId, studentName, audience }: WellbeingPanelProps) {
  const name = firstNameOf(studentName);
  const checkins = useWellnessCheckins(studentId, 30);
  const record = useRecordCheckin(studentId);

  if (checkins.isLoading) return <LoadingState label="Loading" />;
  if (checkins.isError || !checkins.data) return <ErrorState onRetry={() => void checkins.refetch()} />;
  const data = checkins.data;

  if (!data.isTracking) {
    return (
      <Card as="section" aria-label="Wellbeing check-ins are off" isPlayful className="flex flex-col items-start gap-4 p-6">
        <h2 className="flex items-center gap-2 text-lg font-black tracking-tight text-ink">
          <ShieldCheck className="size-5 shrink-0 text-jade-500" />
          Check-ins are off
        </h2>
        {audience === 'student' ? (
          <p className="text-sm font-medium leading-relaxed text-ink-muted">
            A short daily check-in helps you notice how you feel. Ask your parent to turn it on, and it will appear here.
          </p>
        ) : (
          <>
            <p className="text-sm font-medium leading-relaxed text-ink-muted">
              A short daily note on {possessive(name)} mood, energy, sleep and activity. Nothing is recorded unless you allow it, and you can switch it off at
              any time.
            </p>
            <Link to="/parent/privacy" className={buttonClasses({ size: 'sm' })}>
              Choose in Privacy & safety
            </Link>
          </>
        )}
      </Card>
    );
  }

  const today = businessDate(new Date());
  const hasToday = data.checkins.some((c) => c.day === today);
  const error = record.isError ? (isApiError(record.error) ? record.error.message : 'We could not save that. Try again.') : undefined;

  return (
    <div className="flex flex-col gap-6">
      <Card as="section" aria-label="Today’s check-in" isPlayful className="p-6">
        <h2 className="text-lg font-black tracking-tight text-ink">
          {audience === 'student' ? 'How are you today?' : `How is ${name} today?`}
        </h2>
        <p className="mt-1 mb-5 text-sm font-medium text-ink-muted">
          {audience === 'student' ? 'There are no right answers. It is just for you.' : 'A quick note. There are no right answers.'}
        </p>
        <WellbeingCheckinForm
          name={name}
          audience={audience}
          hasToday={hasToday}
          isSaving={record.isPending}
          error={error}
          onSubmit={(checkin) => record.mutate(checkin)}
        />
        {record.isSuccess ? (
          <p role="status" className="mt-4 text-sm font-semibold text-jade-700">
            Saved. Thank you.
          </p>
        ) : null}
      </Card>
      <WellbeingTrend data={data} />
    </div>
  );
}
