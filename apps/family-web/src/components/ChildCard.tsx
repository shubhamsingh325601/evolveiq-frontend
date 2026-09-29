import { Link } from 'react-router-dom';
import { useGrowthAreas, useObservations, type Student } from '@evolveiq/api-client';
import {
  ageFromDateOfBirth,
  DEVELOPMENT_AREA_ICONS,
  DEVELOPMENT_AREA_LABELS,
  formatRelativeDay,
} from '@evolveiq/domain';
import { Avatar, Badge, Card, ChevronRight } from '@evolveiq/ui';

export interface ChildCardProps {
  child: Student;
}

/**
 * One child on the parent's home: who they are, what they are working on,
 * and the latest thing someone noticed, in that person's own words. The whole
 * card opens the child; the link itself is named by the child alone.
 */
export function ChildCard({ child }: ChildCardProps) {
  const growthAreas = useGrowthAreas(child.id);
  const observations = useObservations({ studentId: child.id });

  const latest = [...(observations.data ?? [])].sort((a, b) =>
    b.observedAt.localeCompare(a.observedAt),
  )[0];

  return (
    <Card
      as="li"
      isPlayful
      className="group relative flex flex-col gap-5 p-6 transition-[border-color,box-shadow] hover:border-iris-200 hover:shadow-raised"
    >
      <div className="flex items-center gap-4">
        <Avatar name={child.name} size="xl" />
        <div className="min-w-0 flex-1">
          <Link
            to={`/parent/children/${child.id}`}
            className="text-xl font-semibold tracking-tight text-ink after:absolute after:inset-0 after:rounded-3xl focus-visible:outline-none focus-visible:after:outline focus-visible:after:outline-2 focus-visible:after:outline-offset-2 focus-visible:after:outline-iris-500"
          >
            {child.name}
          </Link>
          <p className="mt-0.5 text-sm text-ink-muted">
            {ageFromDateOfBirth(child.dateOfBirth)} years old
          </p>
        </div>
        <ChevronRight className="size-5 text-ink-faint transition-[color,transform] group-hover:translate-x-0.5 group-hover:text-iris-500" />
      </div>

      {(growthAreas.data ?? []).length > 0 ? (
        <ul className="flex flex-wrap gap-2" aria-label="Growth areas being worked on">
          {(growthAreas.data ?? []).map((area) => (
            <li key={area.id}>
              <Badge tone="growth" icon={DEVELOPMENT_AREA_ICONS[area.area]}>
                {DEVELOPMENT_AREA_LABELS[area.area]}
              </Badge>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-ink-muted">No growth areas open.</p>
      )}

      {latest ? (
        <figure className="rounded-2xl bg-lilac-50/80 px-4 py-3.5">
          <blockquote className="line-clamp-3 font-serif text-base leading-7 text-ink">
            {latest.body}
          </blockquote>
          <figcaption className="mt-2 text-xs text-ink-muted">
            {latest.authorName}, {formatRelativeDay(latest.observedAt)}
          </figcaption>
        </figure>
      ) : null}
    </Card>
  );
}
