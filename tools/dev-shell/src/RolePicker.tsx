import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ROLE_APP, ROLE_HOME_PATH, ROLE_LABELS, useAuth } from '@evolveiq/auth';
import { ErrorState } from '@evolveiq/ui';
import { APP_GROUPS, DEMO_PEOPLE, type DemoPerson } from './demo-people';

/**
 * The launcher. Picking someone signs in as them and hands the page over to
 * whichever of the three apps serves that role.
 */
export function RolePicker() {
  const { signIn } = useAuth();
  const navigate = useNavigate();
  const [busyEmail, setBusyEmail] = useState<string | null>(null);
  const [error, setError] = useState<string>();

  const open = async (person: DemoPerson) => {
    setBusyEmail(person.email);
    setError(undefined);
    try {
      const user = await signIn(person.email);
      navigate(ROLE_HOME_PATH[user.role], { replace: true });
    } catch {
      setError(`Could not sign in as ${person.name}. Is the mock backend still in use?`);
      setBusyEmail(null);
    }
  };

  return (
    <div className="min-h-dvh bg-paper">
      <div className="mx-auto w-full max-w-4xl px-4 py-12 sm:px-6 lg:py-16">
        <header className="border-b border-line pb-8">
          <p className="text-lg font-semibold tracking-tight text-ink">EvolvIQ</p>
          <h1 className="mt-6 max-w-prose font-serif text-4xl leading-tight text-ink">
            Open the product as anyone
          </h1>
          <p className="mt-4 max-w-prose text-base leading-7 text-ink-muted">
            All three apps, on one port, with the same seed data. Pick a person
            and you are signed in as them. This launcher is for development only
            and is never deployed.
          </p>
        </header>

        {error ? <ErrorState className="mt-8" title="That did not open" description={error} /> : null}

        <div className="mt-10 flex flex-col gap-10">
          {APP_GROUPS.map((group) => {
            const people = DEMO_PEOPLE.filter((person) => ROLE_APP[person.role] === group.id);
            return (
              <section key={group.id}>
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <h2 className="text-xl font-semibold text-ink">{group.name}</h2>
                  <p className="text-sm text-ink-faint">{group.note}</p>
                </div>

                <ul className="mt-4 grid gap-3 sm:grid-cols-2">
                  {people.map((person) => (
                    <li key={person.email}>
                      <button
                        type="button"
                        onClick={() => void open(person)}
                        disabled={busyEmail !== null}
                        className="h-full w-full rounded-md border border-line bg-surface px-5 py-4 text-left transition-colors hover:border-teal-500 hover:bg-teal-50/40 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-500 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        <span className="flex items-baseline justify-between gap-3">
                          <span className="text-base font-medium text-ink">
                            {ROLE_LABELS[person.role]}
                          </span>
                          {busyEmail === person.email ? (
                            <span className="text-sm text-teal-600">Opening…</span>
                          ) : null}
                        </span>
                        <span className="mt-1 block font-serif text-lg text-ink">
                          {person.name}
                        </span>
                        <span className="mt-2 block text-sm leading-6 text-ink-muted">
                          {person.summary}
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              </section>
            );
          })}
        </div>

        <footer className="mt-12 border-t border-line pt-6">
          <p className="max-w-prose text-sm leading-6 text-ink-muted">
            Switching roles here is the same as signing out and signing back in —
            nothing is shared between roles. To run one app the way it ships, use
            <code className="mx-1 rounded bg-surface-sunk px-1.5 py-0.5 text-ink">
              pnpm dev:family
            </code>
            ,
            <code className="mx-1 rounded bg-surface-sunk px-1.5 py-0.5 text-ink">
              pnpm dev:school
            </code>
            or
            <code className="mx-1 rounded bg-surface-sunk px-1.5 py-0.5 text-ink">
              pnpm dev:admin
            </code>
            .
          </p>
        </footer>
      </div>
    </div>
  );
}
