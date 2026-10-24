import { useId, useState, type FormEvent } from 'react';
import type { NewWellnessCheckin } from '@evolveiq/api-client';
import { Button, cn, FormField, Input } from '@evolveiq/ui';
import { ENERGY_LABELS, MOOD_LABELS } from './wellbeing';

export interface WellbeingCheckinFormProps {
  /** Who the check-in is about, for the wording: "How is Maya today?". */
  name: string;
  /** The student answering for themselves, or a parent answering for them. */
  audience: 'student' | 'family';
  onSubmit: (checkin: NewWellnessCheckin) => void;
  isSaving?: boolean;
  error?: string | undefined;
  /** True once today's check-in is already recorded; sending again replaces it. */
  hasToday?: boolean;
}

interface ScaleProps {
  legend: string;
  labels: Record<number, string>;
  value: number | null;
  onChange: (value: number) => void;
  name: string;
}

function Scale({ legend, labels, value, onChange, name }: ScaleProps) {
  return (
    <fieldset>
      <legend className="text-sm font-bold text-ink">{legend}</legend>
      <div className="mt-2 grid grid-cols-5 gap-2">
        {[1, 2, 3, 4, 5].map((option) => (
          <label key={option} className="cursor-pointer">
            <input
              type="radio"
              name={name}
              value={option}
              checked={value === option}
              onChange={() => onChange(option)}
              className="peer sr-only"
            />
            <span
              className={cn(
                'flex h-full flex-col items-center gap-1 rounded-2xl border border-line bg-white px-1 py-3 text-center transition-colors',
                'hover:border-iris-300 peer-checked:border-iris-500 peer-checked:bg-iris-50',
                'peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-iris-500',
              )}
            >
              <span className="text-lg font-black text-ink">{option}</span>
              <span className="text-[0.6875rem] font-semibold leading-tight text-ink-muted">{labels[option]}</span>
            </span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}

/**
 * The daily wellbeing check-in: mood and energy from 1 to 5, and optionally how
 * long was slept and how long was spent being active. It is a note, not a test:
 * nothing is graded and nothing is compared with other children.
 */
export function WellbeingCheckinForm({ name, audience, onSubmit, isSaving = false, error, hasToday = false }: WellbeingCheckinFormProps) {
  const id = useId();
  const [mood, setMood] = useState<number | null>(null);
  const [energy, setEnergy] = useState<number | null>(null);
  const [sleepHours, setSleepHours] = useState('');
  const [activeMinutes, setActiveMinutes] = useState('');
  const [problem, setProblem] = useState<string | undefined>();

  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (mood === null || energy === null) {
      setProblem('Choose how it feels for both mood and energy.');
      return;
    }
    const sleep = sleepHours.trim() === '' ? undefined : Math.round(Number(sleepHours) * 60);
    const active = activeMinutes.trim() === '' ? undefined : Math.round(Number(activeMinutes));
    if ((sleep !== undefined && (!Number.isFinite(sleep) || sleep < 0 || sleep > 1080)) || (active !== undefined && (!Number.isFinite(active) || active < 0 || active > 720))) {
      setProblem('Sleep is 0 to 18 hours, and active time 0 to 720 minutes.');
      return;
    }
    setProblem(undefined);
    onSubmit({ mood, energy, ...(sleep !== undefined && { sleepMinutes: sleep }), ...(active !== undefined && { activeMinutes: active }) });
  };

  const who = audience === 'student' ? 'you' : name;
  return (
    <form onSubmit={submit} className="flex flex-col gap-5" aria-label="Wellbeing check-in" noValidate>
      <Scale legend={`How is ${audience === 'student' ? 'your mood' : `${name}’s mood`} today?`} labels={MOOD_LABELS} value={mood} onChange={setMood} name={`${id}-mood`} />
      <Scale legend={`How much energy has ${who} got today?`} labels={ENERGY_LABELS} value={energy} onChange={setEnergy} name={`${id}-energy`} />
      <div className="grid gap-4 sm:grid-cols-2">
        <FormField label="Sleep last night, in hours" isOptional>
          <Input type="number" inputMode="decimal" min={0} max={18} step={0.5} value={sleepHours} onChange={(e) => setSleepHours(e.target.value)} />
        </FormField>
        <FormField label="Active time today, in minutes" isOptional>
          <Input type="number" inputMode="numeric" min={0} max={720} step={5} value={activeMinutes} onChange={(e) => setActiveMinutes(e.target.value)} />
        </FormField>
      </div>
      {problem || error ? (
        <p role="alert" className="text-sm font-semibold text-coral-700">
          {problem ?? error}
        </p>
      ) : null}
      <div>
        <Button type="submit" isLoading={isSaving}>
          {hasToday ? 'Update today’s check-in' : 'Save check-in'}
        </Button>
      </div>
    </form>
  );
}
