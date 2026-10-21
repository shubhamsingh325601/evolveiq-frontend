import { useId } from 'react';
import type { ObservationTone } from '@evolveiq/api-client';
import { Check, cn, Search, Star, type IconComponent } from '@evolveiq/ui';
import { OBSERVATION_TONE_LABELS, OBSERVATION_TONES } from './labels';

export interface ObservationTonePickerProps {
  value: ObservationTone | null;
  onChange: (tone: ObservationTone) => void;
  /** What happens next for each choice, in the words of the screen it is on. */
  descriptions: Record<ObservationTone, string>;
  name?: string;
  className?: string;
}

const TONE_STYLES: Record<
  ObservationTone,
  { icon: IconComponent; iconClassName: string; selected: string; well: string; wellSelected: string }
> = {
  positive: {
    icon: Star,
    iconClassName: 'fill-current',
    selected: 'border-star-400 bg-star-50/90 shadow-[0_0_0_3px_rgba(250,204,21,0.28)]',
    well: 'bg-star-50 text-star-500 ring-star-200',
    wellSelected: 'bg-star-400 text-white ring-star-400',
  },
  concern: {
    icon: Search,
    iconClassName: '',
    selected: 'border-iris-400 bg-iris-50/90 shadow-[0_0_0_3px_rgba(85,88,230,0.12)]',
    well: 'bg-iris-50 text-iris-600 ring-iris-100',
    wellSelected: 'bg-iris-500 text-white ring-iris-500',
  },
};

/**
 * The first choice when recording an observation: something good, which
 * becomes a star for the child, or something to look into, which goes to the
 * school counsellor. Native radios stay in the DOM for keyboards and screen
 * readers; the cards are what people see and tap.
 */
export function ObservationTonePicker({ value, onChange, descriptions, name, className }: ObservationTonePickerProps) {
  const generatedName = useId();
  const groupName = name ?? generatedName;

  return (
    <div className={cn('grid gap-3 sm:grid-cols-2', className)}>
      {OBSERVATION_TONES.map((tone) => {
        const style = TONE_STYLES[tone];
        const Icon = style.icon;
        const isSelected = value === tone;
        return (
          <label
            key={tone}
            className={cn(
              'relative flex cursor-pointer gap-4 rounded-2xl border p-4 transition-[border-color,background-color,box-shadow] duration-150 sm:p-5',
              isSelected ? style.selected : 'border-line bg-white/80 hover:border-iris-200 hover:bg-white',
              'has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-iris-500',
            )}
          >
            <input
              type="radio"
              name={groupName}
              value={tone}
              checked={isSelected}
              onChange={() => onChange(tone)}
              className="sr-only"
            />
            <span
              aria-hidden="true"
              className={cn(
                'flex size-11 shrink-0 items-center justify-center rounded-xl ring-1 ring-inset transition-colors',
                isSelected ? style.wellSelected : style.well,
              )}
            >
              <Icon className={cn('size-5', style.iconClassName)} />
            </span>
            <span className="min-w-0 flex-1 pr-6">
              <span className="block text-base font-bold text-ink">{OBSERVATION_TONE_LABELS[tone]}</span>
              <span className="mt-1 block text-sm leading-5 text-ink-muted">{descriptions[tone]}</span>
            </span>
            <span
              aria-hidden="true"
              className={cn(
                'absolute right-4 top-4 flex size-5 items-center justify-center rounded-full border-2 transition-colors',
                isSelected ? 'border-transparent bg-ink text-white' : 'border-line-strong bg-white',
              )}
            >
              {isSelected ? <Check className="size-3" strokeWidth={3} /> : null}
            </span>
          </label>
        );
      })}
    </div>
  );
}
