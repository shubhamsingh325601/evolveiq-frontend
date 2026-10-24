import {
  isApiError,
  useCreateSupportPlan,
  useSupportPlans,
  useUpdateSupportPlan,
  useWellnessCheckins,
} from '@evolveiq/api-client';
import { SupportPlans, WellbeingTrend } from '@evolveiq/domain';
import { ErrorState, LoadingState } from '@evolveiq/ui';

/**
 * What school staff can see beyond stars: the family's wellbeing check-ins, only
 * when the family has shared them, and the student's support plans, which are
 * for staff alone. Neither feeds the Holistic Index.
 */
export function StudentSupport({ studentId }: { studentId: string }) {
  const wellness = useWellnessCheckins(studentId, 30);
  const plans = useSupportPlans(studentId);
  const create = useCreateSupportPlan(studentId);
  const update = useUpdateSupportPlan(studentId);

  const message = (error: unknown) => (isApiError(error) ? error.message : 'We could not save that. Try again.');
  const error = create.isError ? message(create.error) : update.isError ? message(update.error) : undefined;

  return (
    <>
      {wellness.isLoading ? <LoadingState label="Loading" /> : null}
      {wellness.data ? <WellbeingTrend data={wellness.data} /> : null}
      {wellness.isError ? <ErrorState onRetry={() => void wellness.refetch()} /> : null}

      {plans.isLoading ? <LoadingState label="Loading" /> : null}
      {plans.isError ? <ErrorState onRetry={() => void plans.refetch()} /> : null}
      {plans.data ? (
        <SupportPlans
          plans={plans.data}
          isSaving={create.isPending}
          error={error}
          onCreate={(plan) => create.mutateAsync(plan)}
          onUpdate={(planId, changes) => update.mutateAsync({ planId, changes })}
        />
      ) : null}
    </>
  );
}
