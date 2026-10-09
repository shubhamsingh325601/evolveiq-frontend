import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ROLE_APP, ROLE_HOME_PATH, ROLE_LABELS, useAuth } from '@evolveiq/auth';
import {
  Avatar,
  BrandMark,
  ChevronRight,
  DawnBackdrop,
  ErrorState,
  GrowthRings,
  HeartHandshake,
  School,
  ShieldCheck,
  type IconComponent,
} from '@evolveiq/ui';
import { APP_GROUPS, DEMO_PEOPLE, type DemoPerson } from './demo-people';

const GROUP_ICONS: Record<(typeof APP_GROUPS)[number]['id'], IconComponent> = {
  family: HeartHandshake,
  school: School,
  admin: ShieldCheck,
};

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
    <div className="relative min-h-dvh">
      <DawnBackdrop />
      <div className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 lg:py-10">
        <header className="relative isolate overflow-hidden rounded-3xl bg-rail px-6 py-8 text-white shadow-raised sm:px-10 sm:py-10">
          <GrowthRings className="absolute -bottom-52 -right-40 -z-10 size-[34rem] text-white/[0.07]" />
          <div className="flex items-center gap-3">
            <BrandMark />
            <p className="text-lg font-black tracking-tight">EvolvIQ</p>
            <span className="ml-1 rounded-full bg-white/10 px-2.5 py-0.5 text-xs font-semibold text-white/75 ring-1 ring-inset ring-white/15">
              Development launcher
            </span>
          </div>
          <h1 className="mt-8 max-w-2xl text-4xl font-black tracking-tight sm:text-5xl">
            Open the product as anyone
          </h1>
          <p className="mt-4 max-w-prose text-base leading-7 text-white/75">
            All three apps, on one port, with the same seed data. Pick a person and you are
            signed in as them. This launcher is for development only and is never deployed.
          </p>
        </header>

        {error ? <ErrorState className="mt-8" title="That did not open" description={error} /> : null}

        <div className="mt-10 flex flex-col gap-10">
          {APP_GROUPS.map((group) => {
            const people = DEMO_PEOPLE.filter((person) => ROLE_APP[person.role] === group.id);
            const GroupIcon = GROUP_ICONS[group.id];
            return (
              <section key={group.id}>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <span className="flex size-10 items-center justify-center rounded-xl bg-iris-50 text-iris-600 ring-1 ring-inset ring-iris-100">
                      <GroupIcon className="size-5" />
                    </span>
                    <h2 className="text-xl font-black tracking-tight text-ink">{group.name}</h2>
                  </div>
                  <p className="text-sm font-medium text-ink-faint">{group.note}</p>
                </div>

                <ul className="mt-4 grid gap-4 sm:grid-cols-2">
                  {people.map((person) => (
                    <li key={person.email}>
                      <button
                        type="button"
                        onClick={() => void open(person)}
                        disabled={busyEmail !== null}
                        className="group flex h-full w-full items-start gap-4 rounded-3xl border border-line/70 bg-white/85 p-5 text-left shadow-card transition-[border-color,box-shadow,transform] hover:-translate-y-0.5 hover:border-iris-200 hover:shadow-raised focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-iris-500 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        <Avatar name={person.name} size="lg" />
                        <span className="min-w-0 flex-1">
                          <span className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
                            <span className="text-lg font-black tracking-tight text-ink">
                              {person.name}
                            </span>
                            {busyEmail === person.email ? (
                              <span className="text-sm font-semibold text-iris-600">Opening…</span>
                            ) : null}
                          </span>
                          <span className="mt-1 inline-flex rounded-full bg-iris-50 px-2.5 py-0.5 text-xs font-semibold text-iris-700 ring-1 ring-inset ring-iris-100">
                            {ROLE_LABELS[person.role]}
                          </span>
                          <span className="mt-2 block text-sm leading-6 text-ink-muted">
                            {person.summary}
                          </span>
                        </span>
                        <ChevronRight className="mt-3 size-5 shrink-0 text-ink-faint transition-[color,transform] group-hover:translate-x-0.5 group-hover:text-iris-500" />
                      </button>
                    </li>
                  ))}
                </ul>
              </section>
            );
          })}
        </div>

        <footer className="mt-12 border-t border-line pt-6">
          <p className="max-w-prose text-sm leading-7 text-ink-muted">
            Switching roles here is the same as signing out and signing back in —
            nothing is shared between roles. To run one app the way it ships, use
            <code className="mx-1 rounded-md bg-white/80 px-1.5 py-0.5 text-ink ring-1 ring-line">
              pnpm dev:family
            </code>
            ,
            <code className="mx-1 rounded-md bg-white/80 px-1.5 py-0.5 text-ink ring-1 ring-line">
              pnpm dev:school
            </code>
            or
            <code className="mx-1 rounded-md bg-white/80 px-1.5 py-0.5 text-ink ring-1 ring-line">
              pnpm dev:admin
            </code>
            .
          </p>
        </footer>
      </div>
    </div>
  );
}
