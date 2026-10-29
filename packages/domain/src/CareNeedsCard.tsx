import { useId, type ReactNode } from 'react';
import type { HealthProfile } from '@evolveiq/api-client';
import { Card, cn, Droplet, HeartHandshake, HeartPulse, LoadingState, Phone, Pill, TriangleAlert, type IconComponent } from '@evolveiq/ui';
import { formatDay } from './format-date';
import { possessive } from './holistic-index';
import { HEALTH_CONDITION_LABELS, ROLE_WORDS } from './school-life';

export interface CareNeedsCardProps {
  profile: HealthProfile | undefined;
  /** The child's first name. */
  name: string;
  /** The family sees who can read it; staff see who told the school. */
  audience: 'family' | 'staff';
  isLoading?: boolean;
  /** Such as an Edit button, top right. */
  action?: ReactNode;
  className?: string;
}

function Row({ icon: Icon, label, children }: { icon: IconComponent; label: string; children: ReactNode }) {
  return (
    <div className="flex gap-3">
      <span aria-hidden="true" className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-xl bg-coral-50 text-coral-600 ring-1 ring-inset ring-coral-100">
        <Icon className="size-4" />
      </span>
      <div className="min-w-0">
        <dt className="text-xs font-bold uppercase tracking-wide text-ink-faint">{label}</dt>
        <dd className="mt-0.5 text-sm font-medium leading-relaxed text-ink">{children}</dd>
      </div>
    </div>
  );
}

/**
 * What the school should know to look after a child (client feedback, 29 Oct
 * 2026): conditions such as diabetes, asthma, ADHD or dyslexia, allergies,
 * medicine, what to do, and who to call. The family writes it and the staff who
 * teach the child read it. It is the family's word, not a clinical record, and
 * it never feeds the Holistic Index.
 */
export function CareNeedsCard({ profile, name, audience, isLoading = false, action, className }: CareNeedsCardProps) {
  const headingId = useId();
  const isRecorded = Boolean(profile?.updatedAt);
  const contact = profile?.emergencyContact;

  return (
    <Card as="section" aria-labelledby={headingId} isPlayful={audience === 'family'} className={cn('p-6', className)}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 id={headingId} className="flex items-center gap-2 text-lg font-black tracking-tight text-ink">
            <HeartPulse className="size-5 shrink-0 text-coral-500" />
            Health and care
          </h2>
          <p className="mt-1 text-sm font-medium text-ink-muted">
            {audience === 'family'
              ? `What the school knows, so they can look after ${name}.`
              : `What ${possessive(name)} family and the school office have told us.`}
          </p>
        </div>
        {action}
      </div>

      {isLoading ? <LoadingState label="Loading" /> : null}

      {!isLoading && !isRecorded ? (
        <p className="mt-4 rounded-2xl bg-surface-sunken px-4 py-3 text-sm font-medium text-ink-muted">
          {audience === 'family'
            ? `Nothing recorded yet. Add anything the school should know about ${name}: a condition, an allergy, medicine, or who to call.`
            : `Nothing recorded. ${possessive(name)} parent or the school office can add it.`}
        </p>
      ) : null}

      {!isLoading && profile && isRecorded ? (
        <>
          {profile.conditions.length > 0 ? (
            <ul aria-label="Conditions" className="mt-4 flex flex-wrap gap-2">
              {profile.conditions.map((condition) => (
                <li
                  key={condition}
                  className="rounded-full bg-coral-50 px-3 py-1 text-xs font-bold text-coral-700 ring-1 ring-inset ring-coral-100"
                >
                  {HEALTH_CONDITION_LABELS[condition]}
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-4 text-sm font-medium text-ink-muted">No conditions recorded.</p>
          )}

          <dl className="mt-5 grid gap-4 sm:grid-cols-2">
            {profile.careNotes ? (
              <div className="sm:col-span-2">
                <Row icon={HeartHandshake} label="What to do">
                  {profile.careNotes}
                </Row>
              </div>
            ) : null}
            {profile.allergies ? (
              <Row icon={TriangleAlert} label="Allergies">
                {profile.allergies}
              </Row>
            ) : null}
            {profile.medications ? (
              <Row icon={Pill} label="Medication">
                {profile.medications}
              </Row>
            ) : null}
            {profile.bloodGroup ? (
              <Row icon={Droplet} label="Blood group">
                {profile.bloodGroup}
              </Row>
            ) : null}
            {contact ? (
              <Row icon={Phone} label="In an emergency, call">
                {contact.name}
                {contact.relation ? ` (${contact.relation.toLowerCase()})` : ''}
                {' · '}
                <a href={`tel:${contact.phone.replace(/[^\d+]/g, '')}`} className="font-bold text-iris-700 underline-offset-2 hover:underline">
                  {contact.phone}
                </a>
              </Row>
            ) : null}
          </dl>

          {profile.updatedAt ? (
            <p className="mt-5 text-xs font-medium text-ink-faint">
              {profile.updatedBy
                ? `Last updated by ${profile.updatedBy.fullName} (${ROLE_WORDS[profile.updatedBy.role]}), ${formatDay(profile.updatedAt)}.`
                : `Last updated ${formatDay(profile.updatedAt)}.`}
              {audience === 'family' ? ` Seen by ${possessive(name)} teachers, the school counsellor and the school office.` : ''}
            </p>
          ) : null}
        </>
      ) : null}
    </Card>
  );
}
