import { cn } from './class-names';

export interface BrandMarkProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const SIZE_CLASSES = {
  sm: 'size-8 rounded-[10px]',
  md: 'size-10 rounded-xl',
  lg: 'size-14 rounded-2xl',
} as const;

/**
 * The EvolvIQ mark: a seed and two growth rings, each left open — growth that
 * is still going on. Decorative; the product name always sits beside it.
 */
export function BrandMark({ size = 'md', className }: BrandMarkProps) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        'inline-flex shrink-0 items-center justify-center bg-gradient-to-br from-iris-400 via-iris-500 to-lilac-600 text-white shadow-glow',
        SIZE_CLASSES[size],
        className,
      )}
    >
      <svg viewBox="0 0 24 24" fill="none" className="size-[64%]">
        <circle cx="12" cy="12" r="2.4" fill="currentColor" />
        <path
          d="M12 7.2a4.8 4.8 0 1 1-4.8 4.8"
          stroke="currentColor"
          strokeWidth="1.9"
          strokeLinecap="round"
        />
        <path
          d="M12 2.75A9.25 9.25 0 1 1 2.75 12"
          stroke="currentColor"
          strokeWidth="1.9"
          strokeLinecap="round"
          opacity="0.55"
        />
      </svg>
    </span>
  );
}
