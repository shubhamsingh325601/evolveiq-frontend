import { useId } from 'react';
import { cn } from './class-names';
import { Star } from './icons';

export interface RatingStarsProps {
  /** 0–5. A display rounds to the nearest whole star; the caller prints the number beside it. */
  value: number;
  /** Given, the stars become a 1–5 choice (native radios, so arrow keys work). */
  onChange?: (value: number) => void;
  /** What is being rated, for screen readers: "Teaching quality". */
  label: string;
  size?: 'sm' | 'md';
  className?: string;
}

const STARS = [1, 2, 3, 4, 5];

/** Five stars, read-only or as a 1–5 choice. Gold is the product's colour for something good. */
export function RatingStars({ value, onChange, label, size = 'md', className }: RatingStarsProps) {
  const name = useId();
  const iconSize = size === 'sm' ? 'size-4' : 'size-6';
  const filled = Math.round(value);

  if (!onChange) {
    return (
      <span role="img" aria-label={`${label}: ${value} of 5`} className={cn('inline-flex items-center gap-0.5', className)}>
        {STARS.map((n) => (
          <Star key={n} className={cn(iconSize, n <= filled ? 'fill-star-400 text-star-500' : 'text-line')} />
        ))}
      </span>
    );
  }

  return (
    <div role="radiogroup" aria-label={label} className={cn('inline-flex items-center gap-0.5', className)}>
      {STARS.map((n) => (
        <label key={n} className="group cursor-pointer">
          <input
            type="radio"
            name={name}
            value={n}
            checked={value === n}
            onChange={() => onChange(n)}
            aria-label={`${n} of 5`}
            className="peer sr-only"
          />
          <span className="flex rounded-md p-0.5 transition-transform group-hover:scale-110 peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-iris-500">
            <Star className={cn(iconSize, n <= value ? 'fill-star-400 text-star-500' : 'text-line')} />
          </span>
        </label>
      ))}
    </div>
  );
}
