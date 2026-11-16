import type { AchievementBadgeDefinition } from '@evolveiq/api-client';
import { Award, Card, cn, SectionTitle } from '@evolveiq/ui';

export interface AchievementBadgesProps {
  badges: AchievementBadgeDefinition[];
  className?: string;
}

/**
 * Milestones crossed — a streak kept, activities finished, stars earned —
 * shown as badges. Unlike a Star, a badge carries no one's words; it only
 * marks that a line was crossed, so it never needs an empty state: a child
 * with nothing yet simply sees nothing here.
 */
export function AchievementBadges({ badges, className }: AchievementBadgesProps) {
  if (badges.length === 0) return null;

  return (
    <Card isPlayful className={cn('p-6', className)}>
      <SectionTitle icon={Award} iconClassName="text-jade-500">
        Badges
      </SectionTitle>
      <ul className="mt-4 flex flex-wrap gap-2">
        {badges.map((badge) => (
          <li
            key={badge.id}
            className="flex items-center gap-1.5 rounded-full bg-jade-50 px-3 py-1.5 text-xs font-bold text-jade-700 ring-1 ring-inset ring-jade-100"
          >
            <Award className="size-3.5" />
            {badge.label}
          </li>
        ))}
      </ul>
    </Card>
  );
}
