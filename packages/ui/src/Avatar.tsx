import { cn } from './class-names';

export interface AvatarProps {
  name: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const SIZE_CLASSES = {
  sm: 'size-7 text-xs',
  md: 'size-9 text-sm',
  lg: 'size-12 text-base',
} as const;

function initialsOf(name: string): string {
  const parts = name.trim().split(/\s+/);
  const first = parts[0]?.[0] ?? '';
  const last = parts.length > 1 ? (parts[parts.length - 1]?.[0] ?? '') : '';
  return (first + last).toUpperCase();
}

export function Avatar({ name, size = 'md', className }: AvatarProps) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        'inline-flex shrink-0 items-center justify-center rounded-full bg-teal-50 font-medium text-teal-700',
        SIZE_CLASSES[size],
        className,
      )}
    >
      {initialsOf(name)}
    </span>
  );
}
