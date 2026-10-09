import type { StudentLevel } from '@evolveiq/api-client';
import { Card } from '@evolveiq/ui';

export interface LevelProgressProps {
  level: StudentLevel;
}

/** How close the student is to their next level, as XP. */
export function LevelProgress({ level }: LevelProgressProps) {
  const nextLevel = level.level + 1;
  const percent = Math.min(100, Math.round((level.xp / level.xpForNextLevel) * 100));

  return (
    <Card isPlayful className="p-4 sm:p-5">
      <div className="flex items-end justify-between gap-3">
        <p className="text-xs font-bold uppercase tracking-widest text-ink-muted">
          Progress to level {nextLevel}
        </p>
        <p className="rounded-md bg-iris-50 px-2 py-0.5 text-[0.625rem] font-black text-iris-600">
          {level.xp} / {level.xpForNextLevel} XP
        </p>
      </div>
      <div
        role="progressbar"
        aria-label={`Progress to level ${nextLevel}`}
        aria-valuemin={0}
        aria-valuemax={level.xpForNextLevel}
        aria-valuenow={level.xp}
        aria-valuetext={`${level.xp} of ${level.xpForNextLevel} XP`}
        className="mt-2 h-3 w-full overflow-hidden rounded-full bg-iris-50"
      >
        <div
          className="h-full rounded-full bg-gradient-to-r from-iris-500 to-lilac-500 transition-[width] duration-500"
          style={{ width: `${percent}%` }}
        />
      </div>
    </Card>
  );
}
