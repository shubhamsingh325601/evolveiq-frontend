import { useChildren, useConsents, useSetConsent, type ConsentPurpose, type Person } from '@evolveiq/api-client';
import { firstNameOf, possessive } from '@evolveiq/domain';
import { Card, Checkbox, ErrorState, LoadingState, PageHeader, ShieldCheck } from '@evolveiq/ui';

const SECTIONS: { title: string; points: string[] }[] = [
  {
    title: 'What we keep',
    points: [
      'What teachers and you write about your child: stars and observations, with their area and date.',
      'The activities your child has been set and the ones they finished.',
      'Wellbeing check-ins (mood, energy, sleep and active time) only if you turn them on below.',
      'Health and care needs that you or the school office add on the Health tab: conditions, allergies, medicine, what to do and who to call.',
      'Nothing else: no photos, location or medical files.',
    ],
  },
  {
    title: 'Who can see it',
    points: [
      'You see your own children. Your child sees their own stars, activities and report.',
      'Teachers see the students in their classes. The school counsellor can see any student.',
      'Wellbeing check-ins stay with your family unless you choose to share them with the school.',
      'Health and care needs are for the school to look after your child: your child’s teachers, the school counsellor and the school office see them.',
      'A concern a teacher or counsellor writes stays with the school team. Parents and children see good news, activities and gentle next steps only.',
    ],
  },
  {
    title: 'About the Holistic Index',
    points: [
      'The EvolvIQ Holistic Index is a simple, documented score from what was noticed and what was finished. It is not an AI, not a test result and not a diagnosis.',
      'It starts at a neutral 50 and moves as more is noticed. Every insight shows what it is based on.',
      'Wellbeing check-ins and school support notes are never used in the index.',
      'If you worry about your child’s health or development, please speak to the school or a qualified professional. The index cannot answer that.',
    ],
  },
  {
    title: 'Keeping children safe',
    points: [
      'There is no chat, and children cannot message each other or share anything outside their own account.',
      'Ask your child’s school to correct anything recorded about your child. They manage the records.',
    ],
  },
];

function ChildChoices({ child }: { child: Person }) {
  const consents = useConsents(child.id);
  const setConsent = useSetConsent(child.id);
  const name = firstNameOf(child.fullName);

  return (
    <Card as="section" aria-label={`${possessive(name)} choices`} isPlayful className="p-6">
      <h3 className="text-base font-black tracking-tight text-ink">{possessive(name)} choices</h3>
      {consents.isLoading ? <LoadingState label="Loading" /> : null}
      {consents.isError ? <ErrorState onRetry={() => void consents.refetch()} /> : null}
      <ul className="mt-3 flex flex-col gap-3">
        {(consents.data ?? []).map((consent) => {
          // Sharing means nothing while check-ins are off, so it waits for the first choice.
          const isWaiting = consent.purpose === 'wellness_sharing' && !consents.data?.some((c) => c.purpose === 'wellness_tracking' && c.granted);
          return (
            <li key={consent.purpose}>
              <Checkbox
                label={consent.label}
                checked={consent.granted}
                disabled={isWaiting || setConsent.isPending}
                onChange={(event) => setConsent.mutate({ purpose: consent.purpose as ConsentPurpose, granted: event.target.checked })}
              />
              {isWaiting ? <p className="mt-1 pl-8 text-xs font-medium text-ink-faint">Turn on check-ins first.</p> : null}
              {consent.decidedAt ? (
                <p className="mt-1 pl-8 text-xs font-medium text-ink-faint">
                  Last changed {new Date(consent.decidedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                </p>
              ) : null}
            </li>
          );
        })}
      </ul>
      {setConsent.isError ? (
        <p role="alert" className="mt-3 text-sm font-semibold text-coral-700">
          We could not save that. Try again.
        </p>
      ) : null}
    </Card>
  );
}

/** A plain-language privacy and child-safety page, with the family's own choices about wellbeing check-ins. */
export function PrivacyScreen() {
  const children = useChildren();
  return (
    <div className="flex flex-col gap-8">
      <PageHeader title="Privacy & safety" subtitle="What EvolvIQ keeps about your child, who can see it, and what you decide." />

      {children.data && children.data.length > 0 ? (
        <section aria-label="Your choices" className="flex flex-col gap-4">
          <h2 className="text-lg font-black tracking-tight text-ink">Your choices</h2>
          <p className="-mt-2 text-sm font-medium text-ink-muted">
            Nothing here is on until you turn it on. You can change your mind at any time. Turning check-ins off hides them from everyone and keeps nothing new.
          </p>
          <div className="grid gap-6 lg:grid-cols-2">
            {children.data.map((child) => (
              <ChildChoices key={child.id} child={child} />
            ))}
          </div>
        </section>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-2">
        {SECTIONS.map((section) => (
          <Card key={section.title} as="section" isPlayful className="p-6">
            <h2 className="flex items-center gap-2 text-lg font-black tracking-tight text-ink">
              <ShieldCheck className="size-5 shrink-0 text-jade-500" />
              {section.title}
            </h2>
            <ul className="mt-3 flex flex-col gap-2.5">
              {section.points.map((point) => (
                <li key={point} className="text-sm font-medium leading-relaxed text-ink-muted">
                  {point}
                </li>
              ))}
            </ul>
          </Card>
        ))}
      </div>
    </div>
  );
}
