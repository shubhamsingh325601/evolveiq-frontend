import { useState, type FormEvent } from 'react';
import { isUsingMockBackend, type HolisticDimension } from '@evolveiq/api-client';
import {
  Avatar,
  BrandMark,
  Button,
  ChevronRight,
  cn,
  DawnBackdrop,
  FormField,
  GrowthRings,
  Input,
  RingsChart,
} from '@evolveiq/ui';
import { HOLISTIC_DIMENSION_COLOR_CLASSES } from './holistic-index';
import { HOLISTIC_DIMENSION_LABELS } from './labels';

export interface DemoAccount {
  email: string;
  /** "Name, what they do": the part before the comma is drawn as the name. */
  label: string;
}

export interface SignInLayoutProps {
  appName: string;
  /** Who this app is for, in one line. */
  audienceLine: string;
  /** A real observation, shown as one of the things the index is built from. */
  showcase: { body: string; attribution: string };
  demoAccounts: DemoAccount[];
  onSignIn: (email: string) => Promise<unknown>;
  isSigningIn?: boolean;
  error?: string;
}

/** An example index for the welcome panel — the product's headline idea, shown once. */
const EXAMPLE_PILLARS: { dimension: HolisticDimension; value: number }[] = [
  { dimension: 'education', value: 82 },
  { dimension: 'skills', value: 76 },
  { dimension: 'physical', value: 80 },
  { dimension: 'wellbeing', value: 74 },
  { dimension: 'character', value: 79 },
];

function splitLabel(label: string): { name: string; detail: string } {
  const [name = label, ...rest] = label.split(',');
  const detail = rest.join(',').trim();
  return { name: name.trim(), detail: detail.charAt(0).toUpperCase() + detail.slice(1) };
}

/**
 * Shared sign-in frame. Each app supplies its own words and accounts; the
 * layout, form wiring and error handling live here once. The welcome panel
 * leads with what EvolvIQ is for: an index of how a child is growing, built
 * from what the people around them actually noticed.
 */
export function SignInLayout({
  appName,
  audienceLine,
  showcase,
  demoAccounts,
  onSignIn,
  isSigningIn = false,
  error,
}: SignInLayoutProps) {
  const [email, setEmail] = useState('');

  const submit = (event: FormEvent) => {
    event.preventDefault();
    void onSignIn(email.trim());
  };

  return (
    <div className="relative grid min-h-dvh lg:grid-cols-[1.08fr_1fr]">
      <DawnBackdrop />

      <section className="relative isolate m-3 flex flex-col gap-10 overflow-hidden rounded-3xl bg-rail px-6 py-7 text-white shadow-raised sm:px-10 sm:py-9 lg:m-4 lg:mr-0 lg:justify-between lg:px-12 lg:py-12">
        <GrowthRings className="absolute -bottom-48 -right-48 -z-10 size-[40rem] text-white/[0.06]" />
        <span
          aria-hidden="true"
          className="absolute -left-24 top-1/3 -z-10 size-80 rounded-full bg-iris-500/25 blur-3xl"
        />

        <div className="flex items-center gap-3">
          <BrandMark />
          <p className="text-xl font-black tracking-tight">{appName}</p>
        </div>

        <div className="max-w-xl">
          <p className="text-4xl font-black leading-[1.05] tracking-tight sm:text-5xl">
            Beyond marks.
            <br />
            Understand the child.
          </p>
          <p className="mt-5 max-w-md text-base leading-7 text-white/75">
            What parents and teachers notice, reviewed by a school psychologist, becomes one
            living picture of how a child is growing.
          </p>
        </div>

        <figure className="hidden max-w-xl rounded-3xl bg-white/[0.07] p-6 ring-1 ring-inset ring-white/15 backdrop-blur-sm lg:block">
          <figcaption className="text-sm font-bold text-white">
            The EvolvIQ Holistic Index
            <span className="mt-0.5 block text-xs font-medium text-white/60">
              Five pillars, one number a family can follow over the years
            </span>
          </figcaption>
          <RingsChart
            isInverse
            className="mt-5"
            label="An example EvolvIQ Holistic Index of 78 across five pillars"
            centerValue={78}
            centerLabel="EHI"
            series={EXAMPLE_PILLARS.map((pillar) => ({
              key: pillar.dimension,
              label: HOLISTIC_DIMENSION_LABELS[pillar.dimension],
              value: pillar.value,
              colorClass: HOLISTIC_DIMENSION_COLOR_CLASSES[pillar.dimension],
            }))}
          />
          <blockquote className="mt-6 border-t border-white/10 pt-5">
            <p className="font-serif text-[0.9375rem] leading-7 text-white/90">{showcase.body}</p>
            <footer className="mt-2 text-xs text-white/60">
              {showcase.attribution}. One of the observations an index like this is built from.
            </footer>
          </blockquote>
        </figure>
      </section>

      <section className="flex items-center justify-center px-6 pb-12 pt-4 sm:px-12 lg:py-12">
        <div className="w-full max-w-sm">
          <h1 className="text-4xl font-black tracking-tight text-ink">Sign in</h1>
          <p className="mt-2 text-base font-medium text-ink-muted">{audienceLine}</p>

          <form onSubmit={submit} className="mt-8 flex flex-col gap-5">
            <FormField label="Email address" error={error}>
              <Input
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="you@school.example"
              />
            </FormField>
            <Button type="submit" size="lg" isLoading={isSigningIn}>
              Sign in
            </Button>
          </form>

          {isUsingMockBackend ? (
            <div className="mt-10">
              <div className="flex items-center gap-3">
                <span aria-hidden="true" className="h-px flex-1 bg-line" />
                <p className="text-xs font-semibold text-ink-faint">Or open a demo account</p>
                <span aria-hidden="true" className="h-px flex-1 bg-line" />
              </div>
              <ul className="mt-4 flex flex-col gap-2.5">
                {demoAccounts.map((account) => {
                  const { name, detail } = splitLabel(account.label);
                  return (
                    <li key={account.email}>
                      <button
                        type="button"
                        disabled={isSigningIn}
                        onClick={() => void onSignIn(account.email)}
                        className={cn(
                          'group flex w-full items-center gap-3 rounded-2xl border border-line/70 bg-white/85 px-3.5 py-3 text-left shadow-card transition-[border-color,box-shadow]',
                          'hover:border-iris-200 hover:shadow-raised disabled:cursor-not-allowed disabled:opacity-60',
                          'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-iris-500',
                        )}
                      >
                        <Avatar name={name} />
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-sm font-bold text-ink">{name}</span>
                          <span className="block truncate text-xs text-ink-muted">
                            {detail || account.email}
                          </span>
                        </span>
                        <ChevronRight className="size-4 shrink-0 text-ink-faint transition-[color,transform] group-hover:translate-x-0.5 group-hover:text-iris-500" />
                      </button>
                    </li>
                  );
                })}
              </ul>
              <p className="mt-4 text-xs text-ink-faint">
                No backend is connected yet, so these sign you straight in.
              </p>
            </div>
          ) : null}
        </div>
      </section>
    </div>
  );
}
