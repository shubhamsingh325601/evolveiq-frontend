import type { SupportCategory, SupportStatus } from '@evolveiq/api-client';

/** How a 1–5 mood reads. The words are gentle on purpose: this is a check-in, not a score. */
export const MOOD_LABELS: Record<number, string> = {
  1: 'Rough',
  2: 'Low',
  3: 'Okay',
  4: 'Good',
  5: 'Great',
};

export const ENERGY_LABELS: Record<number, string> = {
  1: 'Very tired',
  2: 'Tired',
  3: 'Steady',
  4: 'Lively',
  5: 'Full of energy',
};

/** Minutes as "7 h 30 min", "45 min" or "8 h". */
export function formatMinutes(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  if (hours === 0) return `${rest} min`;
  return rest === 0 ? `${hours} h` : `${hours} h ${rest} min`;
}

export const SUPPORT_CATEGORY_OPTIONS: { value: SupportCategory; label: string }[] = [
  { value: 'learning', label: 'Learning support' },
  { value: 'attention', label: 'Attention and focus' },
  { value: 'speech_language', label: 'Speech and language' },
  { value: 'sensory', label: 'Sensory needs' },
  { value: 'physical_access', label: 'Physical access' },
  { value: 'emotional', label: 'Emotional support' },
  { value: 'gifted', label: 'Stretch and enrichment' },
  { value: 'other', label: 'Other' },
];

export const SUPPORT_STATUS_OPTIONS: { value: SupportStatus; label: string }[] = [
  { value: 'active', label: 'In place' },
  { value: 'in_review', label: 'Being reviewed' },
  { value: 'closed', label: 'Closed' },
];
