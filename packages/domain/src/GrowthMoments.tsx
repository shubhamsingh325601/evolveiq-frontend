import { useId, useState } from 'react';
import type { GrowthMoment } from '@evolveiq/api-client';
import { Award, Card, Check, cn, LoadingState, Quote, Sparkles, Star as StarIcon } from '@evolveiq/ui';
import { formatRelativeDay } from './format-date';
import { possessive } from './holistic-index';
import { OBSERVATION_AREA_LABELS } from './labels';

export interface GrowthMomentsProps {
  moments: GrowthMoment[];
  /** Whose moments, by first name ("Maya"). Students see their own as "Your Growth Moments". */
  name?: string;
  audience: 'student' | 'family' | 'staff';
  isLoading?: boolean;
  /** How many of the newest to list at first. */
  limit?: number;
  className?: string;
}

const KIND_STYLE = {
  star: { Icon: StarIcon, ring: 'bg-honey-50 text-honey-600 border-honey-100', fill: 'fill-honey-300' },
  activity: { Icon: Check, ring: 'bg-jade-50 text-jade-600 border-jade-100', fill: '' },
  milestone: { Icon: Award, ring: 'bg-iris-50 text-iris-600 border-iris-100', fill: '' },
} as const;

/**
 * The child's good days as a timeline: stars from school and home, activities
 * finished, and the milestones along the way. Every entry is something to be
 * proud of; nothing here is clinical, so it reads the same for the child, their
 * family and their teachers.
 */
export function GrowthMoments({ moments, name, audience, isLoading = false, limit = 6, className }: GrowthMomentsProps) {
  const [isShowingAll, setIsShowingAll] = useState(false);
  const headingId = useId();
  const isStudent = audience === 'student';
  const title = isStudent ? 'Your Growth Moments' : name ? `${possessive(name)} Growth Moments` : 'Growth Moments';
  const shown = isShowingAll ? moments : moments.slice(0, limit);
  const emptyText = isStudent
    ? 'Your good days will collect here: stars, activities you finish and big milestones.'
    : audience === 'family'
      ? `Stars, finished activities and milestones will collect here as ${name ?? 'your child'} grows.`
      : `Stars, finished activities and milestones appear here as ${name ?? 'they'} grow.`;

  return (
    <Card as="section" aria-labelledby={headingId} isPlayful className={cn('p-6 sm:p-7', className)}>
      <div className="flex items-center justify-between gap-3">
        <h2 id={headingId} className="flex items-center gap-2 text-lg font-black tracking-tight text-ink">
          <Sparkles className="size-5 shrink-0 text-honey-500" />
          {title}
        </h2>
        {moments.length > 0 ? (
          <span className="rounded-lg border border-honey-100 bg-honey-50 px-2 py-1 text-[0.625rem] font-bold uppercase tracking-wider text-honey-700">
            {moments.length} {moments.length === 1 ? 'moment' : 'moments'}
          </span>
        ) : null}
      </div>

      {isLoading ? (
        <LoadingState className="mt-4" label="Loading Growth Moments" />
      ) : moments.length === 0 ? (
        <p className="mt-4 text-sm font-medium leading-relaxed text-ink-muted">{emptyText}</p>
      ) : (
        <>
          <ol className="mt-5 flex flex-col">
            {shown.map((moment, position) => {
              const { Icon, ring, fill } = KIND_STYLE[moment.kind];
              const isLast = position === shown.length - 1;
              return (
                <li key={moment.id} className="relative flex gap-4 pb-5 last:pb-0">
                  {!isLast ? (
                    <span aria-hidden="true" className="absolute left-[1.0625rem] top-9 h-[calc(100%-2.25rem)] w-px bg-line" />
                  ) : null}
                  <span className={cn('flex size-9 shrink-0 items-center justify-center rounded-full border', ring)}>
                    <Icon className={cn('size-4', fill)} aria-hidden="true" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-[0.9375rem] font-bold text-ink">{moment.title}</p>
                    <p className="mt-0.5 text-xs font-semibold text-ink-faint">
                      {formatRelativeDay(moment.occurredAt)}
                      {moment.area ? ` · ${OBSERVATION_AREA_LABELS[moment.area]}` : ''}
                      {moment.givenBy ? ` · ${moment.givenBy.fullName}` : ''}
                    </p>
                    {moment.detail ? <Quote size="sm" className="mt-2">{moment.detail}</Quote> : null}
                  </div>
                </li>
              );
            })}
          </ol>
          {moments.length > limit ? (
            <button
              type="button"
              onClick={() => setIsShowingAll((value) => !value)}
              aria-expanded={isShowingAll}
              className="mt-4 rounded-full text-sm font-bold text-iris-600 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-iris-500"
            >
              {isShowingAll ? 'Show fewer' : `Show all ${moments.length}`}
            </button>
          ) : null}
        </>
      )}
    </Card>
  );
}
