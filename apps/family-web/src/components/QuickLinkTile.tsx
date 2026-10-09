import { Link } from 'react-router-dom';
import { cn, type IconComponent } from '@evolveiq/ui';

export interface QuickLinkTileProps {
  to: string;
  label: string;
  icon: IconComponent;
  /** Background, text and border classes for the round icon well. */
  iconClassName: string;
}

/** A square shortcut on the parent's home: an icon in a well, and a name. */
export function QuickLinkTile({ to, label, icon: Icon, iconClassName }: QuickLinkTileProps) {
  return (
    <Link
      to={to}
      className={cn(
        'flex flex-col items-center justify-center gap-3 rounded-3xl border border-white/80 bg-white/75 p-5 text-center shadow-card transition-[border-color,transform] hover:border-iris-200 active:scale-[0.98]',
        'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-iris-500',
      )}
    >
      <span
        className={cn('flex size-12 items-center justify-center rounded-full border', iconClassName)}
      >
        <Icon className="size-6" />
      </span>
      <span className="text-sm font-bold text-ink">{label}</span>
    </Link>
  );
}
