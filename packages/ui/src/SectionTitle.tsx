import type { ReactNode } from 'react';
import { cn } from './class-names';
import type { IconComponent } from './icons';

export interface SectionTitleProps {
  children: ReactNode;
  /** Drawn before the title in its own colour, e.g. a target for missions. */
  icon?: IconComponent;
  iconClassName?: string;
  /** A link or button at the far end, such as "Deep dive". */
  action?: ReactNode;
  as?: 'h2' | 'h3';
  className?: string;
}

/** The heavy heading that opens a section on the family app's screens. */
export function SectionTitle({
  children,
  icon: Icon,
  iconClassName,
  action,
  as: Tag = 'h2',
  className,
}: SectionTitleProps) {
  return (
    <div className={cn('flex items-center justify-between gap-3', className)}>
      <Tag className="flex items-center gap-2 text-lg font-black tracking-tight text-ink">
        {Icon ? <Icon className={cn('size-5 shrink-0 text-iris-500', iconClassName)} /> : null}
        {children}
      </Tag>
      {action}
    </div>
  );
}
