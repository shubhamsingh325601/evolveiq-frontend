import type { StudentLevel } from '@evolveiq/api-client';
import { SidebarCard } from '@evolveiq/domain';
import { Star } from '@evolveiq/ui';

export interface LevelSidebarCardProps {
  level: StudentLevel;
  /** Stars given for something good someone noticed. */
  starCount: number;
}

const RADIUS = 24;

/** A student's level on the rail: a ring filling up towards the next one, and their stars. */
export function LevelSidebarCard({ level, starCount }: LevelSidebarCardProps) {
  const percent = Math.min(100, Math.round((level.xp / level.xpForNextLevel) * 100));
  const toGo = Math.max(0, level.xpForNextLevel - level.xp);

  return (
    <SidebarCard title="Your level">
      <div className="flex items-center gap-4">
        <div className="relative size-16 shrink-0">
          <svg viewBox="0 0 60 60" aria-hidden="true" className="size-full">
            <circle cx="30" cy="30" r={RADIUS} fill="none" stroke="currentColor" strokeWidth={6} className="text-white/10" />
            <circle
              cx="30"
              cy="30"
              r={RADIUS}
              fill="none"
              stroke="currentColor"
              strokeWidth={6}
              strokeLinecap="round"
              pathLength={100}
              strokeDasharray={`${percent} 100`}
              transform="rotate(-90 30 30)"
              className="animate-ring-fill text-jade-300"
            />
          </svg>
          <span className="absolute inset-0 flex items-center justify-center text-xl font-black text-white">
            {level.level}
          </span>
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm font-bold text-white">{level.title}</p>
          <p className="mt-0.5 text-xs text-white/60">
            {toGo} XP to level {level.level + 1}
          </p>
        </div>
      </div>
      <p className="mt-3 flex items-center gap-2 border-t border-white/10 pt-3 text-sm font-bold text-white">
        <Star aria-hidden="true" className="size-4 fill-star-400 text-star-400" />
        {starCount} {starCount === 1 ? 'star' : 'stars'}
        <span className="text-xs font-medium text-white/55">earned</span>
      </p>
    </SidebarCard>
  );
}
