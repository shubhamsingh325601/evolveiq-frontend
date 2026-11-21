import { useState } from 'react';
import { Link } from 'react-router-dom';
import { FEATURES, useChildren } from '@evolveiq/api-client';
import { ROLE_LABELS, useAuth } from '@evolveiq/auth';
import { ChangePasswordDialog } from '@evolveiq/domain';
import {
  Avatar,
  buttonClasses,
  Card,
  ChevronRight,
  KeyRound,
  LogOut,
  PageHeader,
  SectionTitle,
  ShieldCheck,
  Siren,
  Users,
} from '@evolveiq/ui';
import { ChildPinDialog } from '../../components/ChildPinDialog';

const ROW =
  'flex items-center gap-3 px-5 py-4 text-sm font-bold text-ink transition-colors hover:bg-iris-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-iris-500';

/** The Profile tab: who is signed in, their children, and where to manage privacy. */
export function ProfileScreen() {
  const { user, signOut, changePassword } = useAuth();
  const children = useChildren();
  // Forgotten passwords and PINs (21 Nov 2026): the parent's own, and a child's.
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [pinFor, setPinFor] = useState<{ id: string; fullName: string } | null>(null);
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
          <p className="mt-1 text-sm text-ink-muted">If a child forgets their PIN, set a new one here.</p>
          <Card isPlayful className="mt-3 overflow-hidden">
            <ul className="divide-y divide-line-soft">
              {(children.data ?? []).map((child) => (
                <li key={child.id} className="flex items-center">
                  <Link to={`/parent/children/${child.id}`} className={`${ROW} min-w-0 flex-1`}>
                    <Avatar name={child.fullName} size="sm" />
                    <span className="flex-1 truncate">{child.fullName}</span>
                    <ChevronRight className="size-4 text-ink-faint" />
                  </Link>
                  <button
                    type="button"
                    onClick={() => setPinFor(child)}
                    aria-label={`Set a new PIN for ${child.fullName}`}
                    className="mr-3 inline-flex shrink-0 items-center gap-1.5 rounded-full px-3 py-2 text-sm font-semibold text-iris-600 transition-colors hover:bg-iris-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-iris-500"
                  >
                    <KeyRound className="size-4" />
                    New PIN
                  </button>
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
            <li>
              <button type="button" onClick={() => setIsChangingPassword(true)} className={`${ROW} w-full text-left`}>
                <KeyRound className="size-5 text-iris-600" />
                <span className="flex-1">Change password</span>
                <ChevronRight className="size-4 text-ink-faint" />
              </button>
            </li>
          </ul>
        </Card>
      </section>

      <button type="button" onClick={signOut} className={buttonClasses({ variant: 'secondary' })}>
        <LogOut />
        Sign out
      </button>

      <ChangePasswordDialog
        isOpen={isChangingPassword}
        onClose={() => setIsChangingPassword(false)}
        onChangePassword={changePassword}
      />
      <ChildPinDialog child={pinFor} onClose={() => setPinFor(null)} />
    </div>
  );
}
