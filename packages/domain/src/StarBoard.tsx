import { useId, useState, type ReactNode } from 'react';
import type { Star } from '@evolveiq/api-client';
import { Card, cn, LoadingState, Quote, Star as StarIcon } from '@evolveiq/ui';
import { OBSERVATION_AREA_ICONS } from './area-icons';
import { formatRelativeDay } from './format-date';
import { possessive } from './holistic-index';
import { OBSERVATION_AREA_LABELS, STAR_GIVER_LABELS } from './labels';

export interface StarBoardProps {
  stars: Star[];
  /** Whose stars, by first name ("Maya"). Students see their own as "Your stars". */
  name?: string;
  audience: 'student' | 'family' | 'staff';
  isLoading?: boolean;
  /** How many of the newest to list at first; the count always covers them all. */
  limit?: number;
  /** A button at the end of the heading, such as "Give a star". */
  action?: ReactNode;
  className?: string;
}

/** The little row of stars under the count stops growing here, and says "+n" instead. */
const MAX_DRAWN = 12;

function countFrom(stars: Star[], role: 'teacher' | 'parent'): number {
  return stars.filter((star) => star.givenBy.role === role).length;
}

/**
 * A child's stars: one for every good thing a teacher or their parent noticed,
 * each with the giver's own words. It is the product's reward for the good
 * days — a count to be proud of, and the reasons behind it — so it reads the
 * same to the child, their family and their teachers, in their own terms.
 */
export function StarBoard({ stars, name, audience, isLoading = false, limit = 3, action, className }: StarBoardProps) {
  const [isShowingAll, setIsShowingAll] = useState(false);
  const headingId = useId();
  const count = stars.length;
  const fromSchool = countFrom(stars, 'teacher');
  const fromHome = countFrom(stars, 'parent');
  const shown = isShowingAll ? stars : stars.slice(0, limit);
  const isStudent = audience === 'student';

  const title = isStudent ? 'Your stars' : name ? `${possessive(name)} stars` : 'Stars';
  const sources = [fromSchool > 0 ? `${fromSchool} from school` : null, fromHome > 0 ? `${fromHome} from home` : null]
    .filter(Boolean)
    .join(' · ');
  const emptyText = isStudent
    ? 'When your teacher or your family notices something great you did, it lands here as a star.'
    : audience === 'family'
      ? `When ${name ?? 'your child'} does something good, add it as something to celebrate. Teachers give stars too.`
      : `Give ${name ?? 'them'} one when you notice something good.`;

  return (
    <Card
      as="section"
      aria-labelledby={headingId}
      isPlayful
      className={cn('relative isolate overflow-hidden p-6 sm:p-7', className)}
    >
      <span
        aria-hidden="true"
        className="absolute -right-16 -top-24 -z-10 size-64 rounded-full bg-gradient-to-br from-star-100 to-star-200/60 blur-3xl"
      />

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex min-w-0 items-center gap-4">
          <span
            aria-hidden="true"
            className="flex size-16 shrink-0 animate-star-pop items-center justify-center rounded-2xl bg-gradient-to-br from-star-300 to-star-500 shadow-[0_14px_30px_-14px_rgba(202,138,4,0.85)] ring-4 ring-white/70"
          >
            <StarIcon className="size-8 fill-white text-white" />
          </span>
          <div className="min-w-0">
            <h2 id={headingId} className="text-lg font-black tracking-tight text-ink">
              {title}
            </h2>
            <p className="mt-0.5 flex items-baseline gap-2">
              <span className="text-4xl font-black leading-none tracking-tight text-ink tabular-nums">{count}</span>
              <span className="text-sm font-bold text-ink-muted">{count === 1 ? 'star' : 'stars'}</span>
            </p>
            {sources ? <p className="mt-1.5 text-sm font-medium text-star-800">{sources}</p> : null}
          </div>
        </div>
        {action}
      </div>

      {count > 0 ? (
        <div aria-hidden="true" className="mt-5 flex flex-wrap items-center gap-1.5">
          {stars.slice(0, MAX_DRAWN).map((star) => (
            <StarIcon key={star.id} className="size-5 fill-star-400 text-star-500" />
          ))}
          {count > MAX_DRAWN ? (
            <span className="ml-1 text-sm font-black text-star-800">+{count - MAX_DRAWN}</span>
          ) : null}
        </div>
      ) : null}

      {isLoading ? <LoadingState className="mt-4" /> : null}

      {!isLoading && count === 0 ? (
        <p className="mt-5 max-w-prose text-sm text-ink-muted">
          <span className="font-bold text-ink">No stars yet. </span>
          {emptyText}
        </p>
      ) : null}

      {isStudent && count > 0 ? (
        <p className="mt-4 text-sm font-semibold text-ink">
          Every star is something good someone noticed about you. Keep going!
        </p>
      ) : null}

      {shown.length > 0 ? (
        <ul className="mt-6 flex flex-col gap-5">
          {shown.map((star) => {
            const AreaIcon = OBSERVATION_AREA_ICONS[star.area];
            const giver = isStudent
              ? star.givenBy.role === 'teacher'
                ? 'your teacher'
                : 'at home'
              : STAR_GIVER_LABELS[star.givenBy.role];
            return (
              <li key={star.id} className="flex gap-3.5">
                {/* On a phone the words get the whole width; the area line carries the star instead. */}
                <span
                  aria-hidden="true"
                  className="mt-0.5 hidden size-9 shrink-0 items-center justify-center rounded-full bg-star-50 ring-1 ring-inset ring-star-200 sm:flex"
                >
                  <StarIcon className="size-4 fill-star-400 text-star-500" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="flex items-center gap-1.5 text-xs font-bold text-ink-muted">
                    <StarIcon aria-hidden="true" className="size-3.5 fill-star-400 text-star-500 sm:hidden" />
                    <AreaIcon className="size-3.5" />
                    {OBSERVATION_AREA_LABELS[star.area]}
                  </p>
                  <Quote
                    size="sm"
                    className="mt-2"
                    attribution={`${star.givenBy.fullName}, ${giver} · ${formatRelativeDay(star.createdAt)}`}
                  >
                    {star.description}
                  </Quote>
                </div>
              </li>
            );
          })}
        </ul>
      ) : null}

      {count > limit ? (
        <button
          type="button"
          onClick={() => setIsShowingAll((current) => !current)}
          className="mt-5 rounded-lg text-sm font-semibold text-iris-600 hover:text-iris-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-iris-500"
        >
          {isShowingAll ? 'Show the newest only' : `Show all ${count} stars`}
        </button>
      ) : null}
    </Card>
  );
}
