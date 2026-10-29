import { useId, useState } from 'react';
import { Link, Navigate, useParams } from 'react-router-dom';
import { isApiError, useChildren, useHealthProfile, useSaveHealthProfile } from '@evolveiq/api-client';
import { CareNeedsCard, firstNameOf, HealthProfileForm, possessive } from '@evolveiq/domain';
import {
  Button,
  Card,
  ChevronRight,
  EmptyState,
  ErrorState,
  HeartPulse,
  LoadingState,
  PageHeader,
  Pencil,
  ShieldCheck,
} from '@evolveiq/ui';
import { ChildSwitcher } from '../../components/ChildSwitcher';
import { WellbeingPanel } from '../../components/WellbeingPanel';
import { useLastChildId } from '../../useLastChildId';

const healthPath = (childId: string) => `/parent/health/${childId}`;

/**
 * The Health tab's own address (client feedback, 29 Oct 2026: Health in place
 * of Privacy in the parent's tab bar). It opens the child the parent had open
 * last, else the first; links from before (`/parent/children/:childId/wellbeing`)
 * land here too.
 */
export function HealthLandingScreen() {
  const { childId: childInPath } = useParams<{ childId: string }>();
  const lastChildId = useLastChildId();
  const children = useChildren();

  if (childInPath) return <Navigate to={healthPath(childInPath)} replace />;
  if (children.isLoading) return <LoadingState label="Loading" />;
  if (children.isError) return <ErrorState onRetry={() => void children.refetch()} />;

  const list = children.data ?? [];
  const child = list.find((candidate) => candidate.id === lastChildId) ?? list[0];
  if (child) return <Navigate to={healthPath(child.id)} replace />;

  return (
    <div className="flex flex-col gap-8">
      <PageHeader title="Health" subtitle="What the school should know to look after your child." />
      <EmptyState
        icon={HeartPulse}
        title="No children linked to your account yet"
        description="Your school adds this link. Ask the school office if you were expecting to see someone here."
      />
    </div>
  );
}

/**
 * A child's health, for their parent: what the school should know to look
 * after them — conditions such as diabetes, asthma, ADHD or dyslexia, allergies,
 * medicine and who to call — and the same daily check-in the child keeps. The
 * family writes the care needs; the child's teachers, the counsellor and the
 * school office read them.
 */
export function HealthScreen() {
  const { childId } = useParams<{ childId: string }>();
  const children = useChildren();
  const health = useHealthProfile(childId);
  const save = useSaveHealthProfile(childId ?? '');
  const [isEditing, setIsEditing] = useState(false);
  const editHeadingId = useId();

  if (children.isLoading) return <LoadingState label="Loading" />;
  const child = (children.data ?? []).find((candidate) => candidate.id === childId);
  if (children.isError || !child) {
    return <ErrorState title="We could not open that page" description="Go back to your children and try again." />;
  }
  const name = firstNameOf(child.fullName);
  const error = save.isError ? (isApiError(save.error) ? save.error.message : 'We could not save that. Try again.') : undefined;

  return (
    <div className="flex flex-col gap-8">
      {(children.data ?? []).length > 1 ? (
        <ChildSwitcher students={children.data ?? []} currentChildId={child.id} pathFor={healthPath} />
      ) : null}
      <PageHeader title={`${possessive(name)} health`} subtitle={`What the school should know to look after ${name}, and how ${name} is each day.`} />

      {isEditing ? (
        <Card as="section" aria-labelledby={editHeadingId} isPlayful className="p-6 sm:p-8">
          <h2 id={editHeadingId} className="text-lg font-black tracking-tight text-ink">
            Health and care
          </h2>
          <p className="mb-6 mt-1 text-sm font-medium text-ink-muted">
            {possessive(name)} teachers, the school counsellor and the school office will see this, so they can take care of {name} at school.
          </p>
          <HealthProfileForm
            key={health.data?.updatedAt ?? 'new'}
            profile={health.data}
            name={name}
            isSaving={save.isPending}
            error={error}
            submitLabel="Save for the school"
            onCancel={() => setIsEditing(false)}
            onSubmit={async (input) => {
              try {
                await save.mutateAsync(input);
                setIsEditing(false);
              } catch {
                // The error is shown in the form; keep what was typed.
              }
            }}
          />
        </Card>
      ) : (
        <CareNeedsCard
          profile={health.data}
          name={name}
          audience="family"
          isLoading={health.isLoading}
          action={
            <Button size="sm" variant="secondary" icon={Pencil} onClick={() => setIsEditing(true)}>
              {health.data?.updatedAt ? 'Edit' : 'Add'}
            </Button>
          }
        />
      )}
      {save.isSuccess && !isEditing ? (
        <p role="status" className="-mt-4 text-sm font-semibold text-jade-700">
          Saved. {possessive(name)} school can see it now.
        </p>
      ) : null}

      <section aria-label="Daily check-in" className="flex flex-col gap-4">
        <h2 className="text-lg font-black tracking-tight text-ink">How {name} is each day</h2>
        <WellbeingPanel studentId={child.id} studentName={child.fullName} audience="family" />
      </section>

      <Link
        to="/parent/privacy"
        className="flex items-center gap-3 self-start rounded-2xl border border-line bg-white/80 px-4 py-3 text-sm font-semibold text-ink shadow-card hover:border-iris-200"
      >
        <ShieldCheck className="size-5 text-jade-500" />
        Privacy and safety: what is recorded, and who sees it
        <ChevronRight className="size-4 text-ink-faint" />
      </Link>
    </div>
  );
}
