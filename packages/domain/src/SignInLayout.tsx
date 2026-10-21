import { useState, type FormEvent } from 'react';
import {
  DEMO_PASSWORD,
  DEMO_PIN,
  FEATURES,
  isUsingMockBackend,
  type Credentials,
  type HolisticDimension,
} from '@evolveiq/api-client';
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
  SegmentedControl,
  type IconComponent,
} from '@evolveiq/ui';
import { showsDemoAccounts } from './demo-accounts';
import { HOLISTIC_DIMENSION_COLOR_CLASSES } from './holistic-index';
import { HOLISTIC_DIMENSION_LABELS } from './labels';

/** A one-tap test account, named for the role it opens. */
export interface DemoAccount {
  /** The role, drawn as the heading: "Parent", "Teacher", "Counsellor". */
  role: string;
  /** Who that is in the demo, e.g. "Priya Ahluwalia, two children". */
  person: string;
  credentials: Credentials;
  /** Drawn in place of the person's initials. */
  icon?: IconComponent;
}

export interface SignInLayoutProps {
  appName: string;
  /** Who this app is for, in one line. */
  audienceLine: string;
  /** A real observation, shown as one of the things the product is built from. */
  showcase: { body: string; attribution: string };
  demoAccounts: DemoAccount[];
  /** The family app signs students in too, with their student ID and PIN. */
  allowsStudents?: boolean;
  /** The adults' tab when students can sign in too. "Parent" in the family app. */
  adultTabLabel?: string;
  /**
   * Offer the test accounts whatever the environment says. The combined test
   * build does; each app on its own shows them only with the demo backend or
   * `VITE_SHOW_DEMO_ACCOUNTS=true`.
   */
  isShowingDemoAccounts?: boolean;
  onSignIn: (credentials: Credentials) => Promise<unknown>;
  isSigningIn?: boolean;
  error?: string;
}

/** An example index for the welcome panel — shown only once the EHI is served. */
const EXAMPLE_PILLARS: { dimension: HolisticDimension; value: number }[] = [
  { dimension: 'education', value: 82 },
  { dimension: 'skills', value: 76 },
  { dimension: 'physical', value: 80 },
  { dimension: 'wellbeing', value: 74 },
  { dimension: 'character', value: 79 },
];

/** The product's loop, in order: what happens after someone notices something. */
const LOOP_STEPS = [
  { name: 'Observe', detail: 'A parent or teacher notices' },
  { name: 'Review', detail: 'A counsellor reads concerns' },
  { name: 'Assign', detail: 'Activities are chosen' },
  { name: 'Do', detail: 'The child takes part' },
  { name: 'See', detail: 'Progress and stars show' },
] as const;

function signInNameOf(credentials: Credentials): string {
  return 'email' in credentials ? credentials.email : credentials.studentId;
}

type Mode = 'adult' | 'student';

/**
 * Shared sign-in frame. Each app supplies its own words and accounts; the
 * layout, form wiring and error handling live here once. Adults sign in with
 * their email and password, students with the student ID and PIN their school
 * gave them — one endpoint for every role.
 */
export function SignInLayout({
  appName,
  audienceLine,
  showcase,
  demoAccounts,
  allowsStudents = false,
  adultTabLabel = 'Parent',
  isShowingDemoAccounts = showsDemoAccounts,
  onSignIn,
  isSigningIn = false,
  error,
}: SignInLayoutProps) {
  const [mode, setMode] = useState<Mode>('adult');
  const [identifier, setIdentifier] = useState('');
  const [secret, setSecret] = useState('');
  const isStudent = allowsStudents && mode === 'student';

  const submit = (event: FormEvent) => {
    event.preventDefault();
    const name = identifier.trim();
    void onSignIn(isStudent ? { studentId: name, pin: secret } : { email: name, password: secret });
  };

  const switchMode = (next: Mode) => {
    setMode(next);
    setIdentifier('');
    setSecret('');
  };

  return (
    <div className="relative min-h-dvh lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] xl:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)]">
      <DawnBackdrop />

      {/*
        Edge to edge: a band across the top on phones, the whole left half on
        desktop, where it holds still while the form side scrolls. It scrolls
        itself only on a window too short to show all of it.
      */}
      <section className="relative isolate flex flex-col bg-rail px-6 pb-10 pt-6 text-white sm:px-10 sm:pb-12 sm:pt-8 lg:sticky lg:top-0 lg:h-dvh lg:justify-between lg:gap-10 lg:overflow-y-auto lg:px-12 lg:py-10 xl:px-16 2xl:px-20 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {/* Clipped in a layer of their own, so the decoration never makes the panel scroll. */}
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
          <GrowthRings className="absolute -bottom-64 -right-64 size-[46rem] text-white/[0.06]" />
          <span className="absolute -left-32 top-1/4 size-96 rounded-full bg-iris-500/25 blur-3xl" />
        </div>

        <div className="flex items-center gap-3">
          <BrandMark />
          <p className="text-xl font-black tracking-tight">{appName}</p>
        </div>

        <div className="mt-10 max-w-2xl lg:mt-0">
          {/* Sized to the window on desktop, so the two lines stay two lines. */}
          <p className="text-4xl font-black leading-[1.04] tracking-tight sm:text-5xl sm:leading-[1.04] lg:text-[length:clamp(2.25rem,3.6vw,3.75rem)]">
            Beyond marks.
            <br />
            Understand the child.
          </p>
          <p className="mt-5 max-w-md text-base leading-7 text-white/75">
            What parents and teachers notice — the wins as well as the worries — becomes one
            living picture of how a child is growing. Good news turns into stars; concerns
            reach the school counsellor.
          </p>
        </div>

        <div className="hidden max-w-xl lg:block">
          {FEATURES.holisticIndex ? (
            <figure className="mb-10">
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
            </figure>
          ) : null}

          {/* Lilac and the serif: a person's own words about a child, as everywhere else. */}
          <figure className="border-l-2 border-lilac-300/80 pl-5">
            <blockquote>
              <p className="font-serif text-base leading-7 text-white/90 xl:text-lg xl:leading-8">
                {showcase.body}
              </p>
            </blockquote>
            <figcaption className="mt-3 text-sm text-white/60">{showcase.attribution}</figcaption>
          </figure>

          <ol aria-label="How EvolvIQ works" className="mt-10 grid grid-cols-5">
            {LOOP_STEPS.map((step, index) => (
              <li key={step.name}>
                <span aria-hidden="true" className="flex items-center">
                  <span
                    className={cn(
                      'size-2.5 shrink-0 rounded-full',
                      // Lit: the note above is where every step starts.
                      index === 0
                        ? 'bg-lilac-300 shadow-[0_0_0_4px_rgba(196,170,251,0.2)]'
                        : 'ring-1 ring-inset ring-white/40',
                    )}
                  />
                  {index < LOOP_STEPS.length - 1 ? (
                    <span className="mx-2 h-px flex-1 bg-white/15" />
                  ) : null}
                </span>
                <p className="mt-3 text-sm font-semibold text-white">{step.name}</p>
                <p className="mt-0.5 hidden pr-3 text-xs text-white/55 xl:block">{step.detail}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="flex items-center justify-center px-6 py-10 sm:px-12 lg:min-h-dvh lg:py-12">
        <div className="w-full max-w-sm">
          <h1 className="text-4xl font-black tracking-tight text-ink">Sign in</h1>
          <p className="mt-2 text-base font-medium text-ink-muted">{audienceLine}</p>

          {allowsStudents ? (
            <SegmentedControl
              className="mt-6"
              label="Who is signing in"
              value={mode}
              onChange={switchMode}
              options={[
                { value: 'adult' as const, label: adultTabLabel },
                { value: 'student' as const, label: 'Student' },
              ]}
            />
          ) : null}

          <form onSubmit={submit} className="mt-6 flex flex-col gap-5">
            {isStudent ? (
              <>
                <FormField label="Student ID" hint="It is on the card your school gave you.">
                  <Input
                    autoComplete="username"
                    autoCapitalize="characters"
                    required
                    value={identifier}
                    onChange={(event) => setIdentifier(event.target.value)}
                    placeholder="RV-1001"
                  />
                </FormField>
                <FormField label="PIN" error={error}>
                  <Input
                    type="password"
                    inputMode="numeric"
                    autoComplete="current-password"
                    maxLength={32}
                    required
                    value={secret}
                    onChange={(event) => setSecret(event.target.value)}
                  />
                </FormField>
              </>
            ) : (
              <>
                <FormField label="Email address">
                  <Input
                    type="email"
                    autoComplete="email"
                    required
                    value={identifier}
                    onChange={(event) => setIdentifier(event.target.value)}
                    placeholder="you@school.example"
                  />
                </FormField>
                <FormField label="Password" error={error}>
                  <Input
                    type="password"
                    autoComplete="current-password"
                    required
                    value={secret}
                    onChange={(event) => setSecret(event.target.value)}
                  />
                </FormField>
              </>
            )}
            <Button type="submit" size="lg" isLoading={isSigningIn}>
              Sign in
            </Button>
          </form>
          <p className="mt-4 text-sm text-ink-muted">
            No account yet? Your school sets one up for you.
          </p>

          {isShowingDemoAccounts && demoAccounts.length > 0 ? (
            <div className="mt-10">
              <div className="flex items-center gap-3">
                <span aria-hidden="true" className="h-px flex-1 bg-line" />
                <p className="text-xs font-semibold text-ink-faint">Or use a test account</p>
                <span aria-hidden="true" className="h-px flex-1 bg-line" />
              </div>
              <ul aria-label="Test accounts" className="mt-4 flex flex-col gap-2.5">
                {demoAccounts.map((account) => {
                  const Icon = account.icon;
                  const signInName = signInNameOf(account.credentials);
                  return (
                    <li key={signInName}>
                      <button
                        type="button"
                        disabled={isSigningIn}
                        onClick={() => void onSignIn(account.credentials)}
                        className={cn(
                          'group flex w-full items-center gap-3 rounded-2xl border border-line/70 bg-white/85 px-3.5 py-3 text-left shadow-card transition-[border-color,box-shadow]',
                          'hover:border-iris-200 hover:shadow-raised disabled:cursor-not-allowed disabled:opacity-60',
                          'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-iris-500',
                        )}
                      >
                        {Icon ? (
                          <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-iris-50 text-iris-600 ring-1 ring-inset ring-iris-100">
                            <Icon className="size-5" />
                          </span>
                        ) : (
                          <Avatar name={account.person} />
                        )}
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-sm font-bold text-ink">{account.role}</span>
                          {/* What to type comes first, so it is the part that never gets cut off. */}
                          <span className="block truncate text-xs text-ink-muted">
                            <span className="font-semibold text-ink">{signInName}</span> · {account.person}
                          </span>
                        </span>
                        <ChevronRight className="size-4 shrink-0 text-ink-faint transition-[color,transform] group-hover:translate-x-0.5 group-hover:text-iris-500" />
                      </button>
                    </li>
                  );
                })}
              </ul>
              <p className="mt-4 text-xs leading-5 text-ink-faint">
                To type one in instead: adults use the password{' '}
                <span className="whitespace-nowrap font-semibold text-ink-muted">{DEMO_PASSWORD}</span>, students the
                PIN <span className="whitespace-nowrap font-semibold text-ink-muted">{DEMO_PIN}</span>.{' '}
                {isUsingMockBackend
                  ? 'No backend is connected, so these open the built-in demo.'
                  : 'They come from the demo seed.'}
              </p>
            </div>
          ) : null}
        </div>
      </section>
    </div>
  );
}
