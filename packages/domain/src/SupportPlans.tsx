import { useId, useState, type FormEvent } from 'react';
import type { NewSupportPlan, SupportCategory, SupportPlan, SupportPlanChanges, SupportStatus } from '@evolveiq/api-client';
import { Badge, Button, Card, cn, FormField, HeartHandshake, Lock, Plus, Select, Textarea, Input } from '@evolveiq/ui';
import { SUPPORT_CATEGORY_OPTIONS, SUPPORT_STATUS_OPTIONS } from './wellbeing';

export interface SupportPlansProps {
  plans: SupportPlan[];
  onCreate: (plan: NewSupportPlan) => Promise<unknown> | void;
  onUpdate: (planId: string, changes: SupportPlanChanges) => Promise<unknown> | void;
  isSaving?: boolean;
  error?: string | undefined;
  className?: string;
}

const dateFormat = new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' });
const formatDay = (day: string) => dateFormat.format(new Date(`${day}T00:00:00Z`));

const STATUS_TONE: Record<SupportStatus, 'growth' | 'pending' | 'neutral'> = {
  active: 'growth',
  in_review: 'pending',
  closed: 'neutral',
};

/**
 * The special-needs workflow for school staff: what a student needs, what works
 * in class, and when to look again. It is only ever shown to teachers and the
 * counsellor, it is not part of the Holistic Index, and a plan is closed rather
 * than deleted so the history stays.
 */
export function SupportPlans({ plans, onCreate, onUpdate, isSaving = false, error, className }: SupportPlansProps) {
  const headingId = useId();
  const [isAdding, setIsAdding] = useState(false);
  const [category, setCategory] = useState<SupportCategory>('learning');
  const [summary, setSummary] = useState('');
  const [strategies, setStrategies] = useState('');
  const [reviewOn, setReviewOn] = useState('');
  const [problem, setProblem] = useState<string | undefined>();

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (summary.trim() === '') {
      setProblem('Describe what the student needs.');
      return;
    }
    setProblem(undefined);
    try {
      await onCreate({
        category,
        summary: summary.trim(),
        ...(strategies.trim() !== '' && { strategies: strategies.trim() }),
        ...(reviewOn !== '' && { reviewOn }),
      });
      setSummary('');
      setStrategies('');
      setReviewOn('');
      setIsAdding(false);
    } catch {
      // The error prop explains it; keep what was typed.
    }
  };

  return (
    <Card as="section" aria-labelledby={headingId} className={cn('p-6', className)}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 id={headingId} className="flex items-center gap-2 text-lg font-black tracking-tight text-ink">
            <HeartHandshake className="size-5 shrink-0 text-lilac-500" />
            Support plans
          </h2>
          <p className="mt-1 flex items-center gap-1.5 text-xs font-semibold text-ink-faint">
            <Lock className="size-3.5" /> School staff only. Never shown to the family.
          </p>
        </div>
        {!isAdding ? (
          <Button size="sm" variant="secondary" icon={Plus} onClick={() => setIsAdding(true)}>
            New plan
          </Button>
        ) : null}
      </div>

      {isAdding ? (
        <form onSubmit={(event) => void submit(event)} className="mt-5 flex flex-col gap-4 rounded-2xl bg-surface-sunken p-4" aria-label="New support plan" noValidate>
          <FormField label="Kind of support">
            <Select value={category} onChange={(e) => setCategory(e.target.value as SupportCategory)}>
              {SUPPORT_CATEGORY_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </Select>
          </FormField>
          <FormField label="What the student needs" hint="In plain words, so any colleague can read it.">
            <Textarea rows={3} maxLength={1000} value={summary} onChange={(e) => setSummary(e.target.value)} />
          </FormField>
          <FormField label="What works in class" isOptional>
            <Textarea rows={3} maxLength={2000} value={strategies} onChange={(e) => setStrategies(e.target.value)} />
          </FormField>
          <FormField label="Review on" isOptional>
            <Input type="date" value={reviewOn} onChange={(e) => setReviewOn(e.target.value)} />
          </FormField>
          {problem || error ? (
            <p role="alert" className="text-sm font-semibold text-coral-700">
              {problem ?? error}
            </p>
          ) : null}
          <div className="flex gap-3">
            <Button type="submit" isLoading={isSaving}>
              Save plan
            </Button>
            <Button type="button" variant="quiet" onClick={() => setIsAdding(false)}>
              Cancel
            </Button>
          </div>
        </form>
      ) : null}

      {plans.length === 0 && !isAdding ? (
        <p className="mt-4 text-sm font-medium text-ink-muted">No support plans for this student.</p>
      ) : (
        <ul className="mt-5 flex flex-col gap-4">
          {plans.map((plan) => (
            <li key={plan.id} className="rounded-2xl border border-line-soft p-4">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-sm font-black text-ink">{plan.categoryLabel}</span>
                <Badge tone={STATUS_TONE[plan.status]}>{plan.statusLabel}</Badge>
                {plan.isReviewDue ? <Badge tone="significant">Review due</Badge> : null}
              </div>
              <p className="mt-2 text-sm font-medium leading-relaxed text-ink">{plan.summary}</p>
              {plan.strategies ? (
                <p className="mt-2 text-sm leading-relaxed text-ink-muted">
                  <span className="font-bold text-ink">What works: </span>
                  {plan.strategies}
                </p>
              ) : null}
              <p className="mt-2 text-xs font-medium text-ink-faint">
                Opened by {plan.createdBy.fullName}, {formatDay(plan.createdAt.slice(0, 10))}
                {plan.reviewOn ? ` · review on ${formatDay(plan.reviewOn)}` : ''}
              </p>
              <div className="mt-3 max-w-56">
                <label className="sr-only" htmlFor={`${plan.id}-status`}>
                  Status of the {plan.categoryLabel} plan
                </label>
                <Select id={`${plan.id}-status`} value={plan.status} onChange={(e) => void onUpdate(plan.id, { status: e.target.value as SupportStatus })}>
                  {SUPPORT_STATUS_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </Select>
              </div>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
