import { cn } from './class-names';

export interface AvatarProps {
  name: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

const SIZE_CLASSES = {
  sm: 'size-8 text-xs',
  md: 'size-10 text-sm',
  lg: 'size-12 text-base',
  xl: 'size-16 text-xl',
} as const;

/**
 * Four quiet variations inside the iris and lilac family, picked by name, so
 * people in a list are easier to tell apart. Never jade, honey or coral: those
 * hues carry a status and a person is not a status.
 */
const PALETTES = [
  'from-iris-100 to-lilac-200 text-iris-800',
  'from-lilac-100 to-iris-200 text-lilac-700',
  'from-iris-50 to-iris-200 text-iris-700',
  'from-lilac-50 to-lilac-200 text-lilac-700',
] as const;

function initialsOf(name: string): string {
  const parts = name.trim().split(/\s+/);
  const first = parts[0]?.[0] ?? '';
  const last = parts.length > 1 ? (parts[parts.length - 1]?.[0] ?? '') : '';
  return (first + last).toUpperCase();
}

function paletteFor(name: string): string {
  let hash = 0;
  for (const character of name) hash = (hash * 31 + character.charCodeAt(0)) >>> 0;
  return PALETTES[hash % PALETTES.length] ?? PALETTES[0];
}

export function Avatar({ name, size = 'md', className }: AvatarProps) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        'inline-flex shrink-0 items-center justify-center rounded-full bg-gradient-to-br font-semibold ring-2 ring-white/90',
        SIZE_CLASSES[size],
        paletteFor(name),
        className,
      )}
    >
      {initialsOf(name)}
    </span>
  );
}
