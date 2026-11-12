import { Link } from 'react-router-dom';
import { FEATURES, useChildren } from '@evolveiq/api-client';
import { ROLE_LABELS, useAuth } from '@evolveiq/auth';
import {
  Avatar,
  buttonClasses,
  Card,
  ChevronRight,
  LogOut,
  PageHeader,
  SectionTitle,
  ShieldCheck,
  Siren,
  Users,
} from '@evolveiq/ui';

const ROW =
  'flex items-center gap-3 px-5 py-4 text-sm font-bold text-ink transition-colors hover:bg-iris-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-iris-500';

/** The Profile tab: who is signed in, their children, and where to manage privacy. */
export function ProfileScreen() {
  const { user, signOut } = useAuth();
  const children = useChildren();
  if (!user) return null;

  return (
    <div className="flex flex-col gap-8">
      <PageHeader title="Profile" />

      <Card isPlayful className="flex items-center gap-5 p-6">
        <Avatar name={user.fullName} size="xl" />
        <div className="min-w-0">
          <p className="truncate text-xl font-black tracking-tight text-ink">{user.fullName}</p>
          <p className="text-sm font-semibold text-ink-muted">{ROLE_LABELS[user.role]}</p>
        </div>
      </Card>

      {(children.data ?? []).length > 0 ? (
        <section>
          <SectionTitle>Your children</SectionTitle>
          <Card isPlayful className="mt-3 overflow-hidden">
            <ul className="divide-y divide-line-soft">
              {(children.data ?? []).map((child) => (
                <li key={child.id}>
                  <Link to={`/parent/children/${child.id}`} className={ROW}>
                    <Avatar name={child.fullName} size="sm" />
                    <span className="flex-1">{child.fullName}</span>
                    <ChevronRight className="size-4 text-ink-faint" />
                  </Link>
                </li>
              ))}
            </ul>
          </Card>
        </section>
      ) : null}

      <section>
        <SectionTitle>Settings</SectionTitle>
        <Card isPlayful className="mt-3 overflow-hidden">
          <ul className="divide-y divide-line-soft">
            {FEATURES.holisticIndex && (children.data ?? []).length > 1 ? (
              <li>
                <Link to="/parent/siblings" className={ROW}>
                  <Users className="size-5 text-iris-600" />
                  <span className="flex-1">Compare strengths</span>
                  <ChevronRight className="size-4 text-ink-faint" />
                </Link>
              </li>
            ) : null}
            <li>
              <Link to="/parent/safety" className={ROW}>
                <Siren className="size-5 text-coral-700" />
                <span className="flex-1">SOS and helplines</span>
                <ChevronRight className="size-4 text-ink-faint" />
              </Link>
            </li>
            <li>
              <Link to="/parent/privacy" className={ROW}>
                <ShieldCheck className="size-5 text-jade-500" />
                <span className="flex-1">Privacy & safety</span>
                <ChevronRight className="size-4 text-ink-faint" />
              </Link>
            </li>
          </ul>
        </Card>
      </section>

      <button type="button" onClick={signOut} className={buttonClasses({ variant: 'secondary' })}>
        <LogOut />
        Sign out
      </button>
    </div>
  );
}
