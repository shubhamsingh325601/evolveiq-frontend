import { useState, type FormEvent } from 'react';
import { isUsingMockBackend } from '@evolveiq/api-client';
import { Button, Card, FormField, Input, Quote } from '@evolveiq/ui';

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
    <div className="grid min-h-dvh lg:grid-cols-[1.1fr_1fr]">
      <section className="flex flex-col justify-between bg-teal-800 px-6 py-10 text-ink-inverse sm:px-12 lg:py-14">
        <p className="text-lg font-semibold tracking-tight">{appName}</p>

        <div className="max-w-xl py-14">
          <Quote size="lg" className="text-teal-50">
            <span className="text-teal-50">{showcase.body}</span>
          </Quote>
          <p className="mt-4 text-sm text-teal-200">{showcase.attribution}</p>
        </div>

        <p className="max-w-sm text-sm text-teal-200">
          Every child here is understood through what the people around them
          actually noticed.
        </p>
      </section>

      <section className="flex items-center justify-center px-6 py-12 sm:px-12">
        <div className="w-full max-w-sm">
          <h1 className="text-3xl font-semibold tracking-tight text-ink">Sign in</h1>
          <p className="mt-2 text-sm text-ink-muted">{audienceLine}</p>

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
            <Card className="mt-8 px-5 py-4">
              <p className="text-sm font-medium text-ink">Accounts for this demo</p>
              <p className="mt-1 text-sm text-ink-muted">
                No backend is connected yet, so any of these signs you straight in.
              </p>
              <ul className="mt-3 flex flex-col gap-2">
                {demoAccounts.map((account) => (
                  <li key={account.email}>
                    <button
                      type="button"
                      onClick={() => setEmail(account.email)}
                      className="w-full rounded border border-line px-3 py-2 text-left text-sm transition-colors hover:border-line-strong hover:bg-surface-sunk focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-500"
                    >
                      <span className="block font-medium text-ink">{account.label}</span>
                      <span className="block text-ink-muted">{account.email}</span>
                    </button>
                  </li>
                ))}
              </ul>
            </Card>
          ) : null}
        </div>
      </section>
    </div>
  );
}
