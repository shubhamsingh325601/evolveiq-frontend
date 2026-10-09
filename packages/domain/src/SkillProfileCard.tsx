import type { ReactNode } from 'react';
import type { SkillScore } from '@evolveiq/api-client';
import { Card, cn, RadarChart, type IconComponent } from '@evolveiq/ui';

export interface SkillProfileCardProps {
  title: string;
  skills: SkillScore[];
  /** A link or chip at the end of the title row, e.g. "Deep dive". */
  action?: ReactNode;
  icon?: IconComponent;
  iconClassName?: string;
  /** The student's home wears a gradient strip along the top edge. */
  hasAccentStrip?: boolean;
  className?: string;
}

/** The skill profile as a radar — "My superpowers" to a student. */
export function SkillProfileCard({
  title,
  skills,
  action,
  icon: Icon,
  iconClassName,
  hasAccentStrip = false,
  className,
}: SkillProfileCardProps) {
  return (
    <Card isPlayful className={cn('relative overflow-hidden p-6', className)}>
      {hasAccentStrip ? (
        <span
          aria-hidden="true"
          className="absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r from-iris-500 via-lilac-500 to-jade-400"
        />
      ) : null}
      <div className="flex items-center justify-between gap-3">
        <h2 className="flex items-center gap-2 text-lg font-black tracking-tight text-ink">
          {Icon ? <Icon className={cn('size-5 shrink-0', iconClassName)} /> : null}
          {title}
        </h2>
        {action}
      </div>
      <RadarChart
        className="mt-3"
        label={title}
        axes={skills.map((skill) => ({ label: skill.skill, value: skill.score }))}
      />
    </Card>
  );
}
