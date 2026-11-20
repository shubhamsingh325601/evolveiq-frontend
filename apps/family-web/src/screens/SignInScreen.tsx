import { DEMO_PASSWORD, DEMO_PIN } from '@evolveiq/api-client';
import { ROLE_LABELS, useSignInForApp } from '@evolveiq/auth';
import { ROLE_ICONS, SignInLayout, type DemoAccount } from '@evolveiq/domain';
import { FAMILY_AUDIENCE, FAMILY_OTHER_URL, type FamilyAudience } from '../family-audience';

const DEMO_ACCOUNTS: DemoAccount[] = [
  {
    role: ROLE_LABELS.parent,
    person: 'Priya Ahluwalia, two children',
    icon: ROLE_ICONS.parent,
    credentials: { email: 'priya@family.test', password: DEMO_PASSWORD },
  },
  {
    role: ROLE_LABELS.student,
    person: 'Maya Ahluwalia',
    icon: ROLE_ICONS.student,
    credentials: { studentId: 'RV-1001', pin: DEMO_PIN },
  },
  {
    role: ROLE_LABELS.parent,
    person: 'Neil D’Souza, one child',
    icon: ROLE_ICONS.parent,
    credentials: { email: 'neil@family.test', password: DEMO_PASSWORD },
  },
];

const AUDIENCE_LINE: Record<FamilyAudience, string> = {
  both: 'For parents and their children.',
  parents: 'For parents. Sign in with the email your school has for you.',
  students: 'For students. Sign in with the ID and PIN from your school.',
};

const hostOf = (url: string) => url.replace(/^https?:\/\//, '').replace(/\/$/, '');

export function SignInScreen({ audience = FAMILY_AUDIENCE, otherUrl = FAMILY_OTHER_URL }: { audience?: FamilyAudience; otherUrl?: string | undefined }) {
  const { signInToApp, error, isSigningIn } = useSignInForApp('family');
  const isStudentAccount = (account: DemoAccount) => 'studentId' in account.credentials;
  const demoAccounts =
    audience === 'both' ? DEMO_ACCOUNTS : DEMO_ACCOUNTS.filter((account) => isStudentAccount(account) === (audience === 'students'));
  const footnote =
    otherUrl && audience !== 'both' ? (
      <>
        {audience === 'parents' ? 'A student? ' : 'A parent? '}
        <a href={otherUrl} className="font-semibold text-iris-700 underline-offset-2 hover:underline">
          Sign in at {hostOf(otherUrl)}
        </a>
      </>
    ) : undefined;

  return (
    <SignInLayout
      appName="EvolvIQ"
      audienceLine={AUDIENCE_LINE[audience]}
      allowsStudents={audience !== 'parents'}
      isStudentsOnly={audience === 'students'}
      {...(footnote ? { footnote } : {})}
      showcase={{
        body: 'Maya stayed with the tangram puzzle for almost ten minutes without being prompted, which is the longest she has worked on one thing this term.',
        attribution: 'Sunita Rao, her teacher — a star for Maya',
      }}
      demoAccounts={demoAccounts}
      onSignIn={signInToApp}
      isSigningIn={isSigningIn}
      {...(error ? { error } : {})}
    />
  );
}
