import { useState, type FormEvent } from 'react';
import { isUsingMockBackend } from '@evolveiq/api-client';
import {
  Avatar,
  BrandMark,
  Button,
  DawnBackdrop,
  FormField,
  GrowthRings,
  Input,
  Quote,
} from '@evolveiq/ui';

export interface DemoAccount {
  email: string;
  label: string;
}

export interface SignInLayoutProps {
  appName: string;
  /** Who this app is for, in one line. */
  audienceLine: string;
  /** A real observation, shown as the thing the product is actually built on. */
  showcase: { body: string; attribution: string };
  demoAccounts: DemoAccount[];
  onSignIn: (email: string) => Promise<unknown>;
  isSigningIn?: boolean;
  error?: string;
}

/**
 * Shared sign-in frame. Each app supplies its own words and accounts; the
 * layout, form wiring and error handling live here once.
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
    <div className="relative grid min-h-dvh lg:grid-cols-[1.05fr_1fr]">
      <DawnBackdrop />

      <section className="relative isolate m-3 flex flex-col justify-between gap-10 overflow-hidden rounded-3xl bg-hero px-6 py-7 text-white shadow-raised sm:px-10 sm:py-9 lg:m-4 lg:mr-0 lg:px-12 lg:py-12">
        <GrowthRings className="absolute -bottom-44 -right-44 -z-10 size-[38rem] text-white/[0.12]" />

        <div className="flex items-center gap-3">
          <BrandMark className="bg-none bg-white/15 shadow-none ring-1 ring-inset ring-white/30" />
          <p className="text-lg font-semibold tracking-tight">{appName}</p>
        </div>

        <div className="max-w-xl">
          <p className="text-4xl font-semibold leading-[1.1] tracking-tight sm:text-5xl">
            Beyond marks.
            <br />
            Understand the child.
          </p>
          <Quote
            isInverse
            size="lg"
            className="mt-10 hidden lg:block"
            attribution={showcase.attribution}
          >
            {showcase.body}
          </Quote>
        </div>

        <p className="hidden max-w-sm text-sm text-white/80 lg:block">
          Every child here is understood through what the people around them
          actually noticed.
        </p>
      </section>

      <section className="flex items-center justify-center px-6 pb-12 pt-6 sm:px-12 lg:py-12">
        <div className="w-full max-w-sm">
          <h1 className="text-3xl font-semibold tracking-tight text-ink sm:text-4xl">Sign in</h1>
          <p className="mt-2 text-base text-ink-muted">{audienceLine}</p>

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
              <p className="text-sm font-medium text-ink">Accounts for this demo</p>
              <p className="mt-1 text-sm text-ink-muted">
                No backend is connected yet, so any of these signs you straight in.
              </p>
              <ul className="mt-4 flex flex-col gap-2">
                {demoAccounts.map((account) => (
                  <li key={account.email}>
                    <button
                      type="button"
                      onClick={() => setEmail(account.email)}
                      className="flex w-full items-center gap-3 rounded-2xl border border-white/80 bg-white/70 px-3 py-2.5 text-left shadow-card transition-colors hover:border-iris-200 hover:bg-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-iris-500"
                    >
                      <Avatar name={account.label.split(',')[0] ?? account.label} size="sm" />
                      <span className="min-w-0">
                        <span className="block truncate text-sm font-medium text-ink">
                          {account.label}
                        </span>
                        <span className="block truncate text-sm text-ink-muted">
                          {account.email}
                        </span>
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>
      </section>
    </div>
  );
}
