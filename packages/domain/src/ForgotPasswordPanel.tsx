import { useEffect, useState, type FormEvent } from 'react';
import {
  DEMO_RESET_CODE,
  isApiError,
  isUsingMockBackend,
  useForgotPassword,
  useResetPassword,
} from '@evolveiq/api-client';
import { ArrowLeft, Button, FormField, Input } from '@evolveiq/ui';

/** The backend sends at most one code a minute to an account. */
const RESEND_AFTER_SECONDS = 60;
const MIN_PASSWORD_LENGTH = 10;

export interface ForgotPasswordPanelProps {
  /** Whatever was typed on the sign-in form, so it need not be typed twice. */
  initialEmail?: string;
  /** The new password is set: sign in with it. */
  onReset: (credentials: { email: string; password: string }) => void;
  onBack: () => void;
}

type Step = 'email' | 'code';

interface Problems {
  email?: string;
  code?: string;
  newPassword?: string;
  confirm?: string;
}

const NETWORK_PROBLEM = 'We could not reach EvolvIQ. Check your connection and try again.';
const SERVER_PROBLEM = 'Something went wrong on our side. Try again in a moment.';

/** The reset step's error, on the field it belongs to, in words someone can act on. */
function resetProblems(error: unknown): Problems {
  if (!isApiError(error)) return { code: NETWORK_PROBLEM };
  if (error.code === 'INVALID_RESET_CODE') {
    return { code: 'That code is wrong or has expired. Check the email, or send a new code.' };
  }
  if (error.code === 'VALIDATION_ERROR') {
    const fields = error.fieldIssues.map((issue) => issue.field);
    if (fields.includes('newPassword')) return { newPassword: `Use ${MIN_PASSWORD_LENGTH} to 128 characters.` };
    if (fields.includes('code')) return { code: 'Enter the 6 digits from the email.' };
  }
  return { code: SERVER_PROBLEM };
}

/**
 * Forgot password, for adults: a 6-digit code by email, then a new password on
 * this same screen — the same on every site and inside the installed apps.
 * Students have no email: their parent or school sets a new PIN.
 */
export function ForgotPasswordPanel({ initialEmail = '', onReset, onBack }: ForgotPasswordPanelProps) {
  const forgot = useForgotPassword();
  const reset = useResetPassword();
  const [step, setStep] = useState<Step>('email');
  const [email, setEmail] = useState(initialEmail.trim());
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [problems, setProblems] = useState<Problems>({});
  const [resendIn, setResendIn] = useState(0);

  useEffect(() => {
    if (resendIn <= 0) return;
    const timer = window.setTimeout(() => setResendIn((seconds) => seconds - 1), 1000);
    return () => window.clearTimeout(timer);
  }, [resendIn]);

  const sendCode = async (event?: FormEvent) => {
    event?.preventDefault();
    const address = email.trim();
    if (!address) {
      setProblems({ email: 'Enter the email address you sign in with.' });
      return;
    }
    setProblems({});
    try {
      await forgot.mutateAsync(address);
      setEmail(address);
      setCode('');
      setStep('code');
      setResendIn(RESEND_AFTER_SECONDS);
    } catch (caught) {
      setProblems({ email: isApiError(caught) ? SERVER_PROBLEM : NETWORK_PROBLEM });
    }
  };

  const setPassword = async (event: FormEvent) => {
    event.preventDefault();
    const found: Problems = {};
    if (!/^[0-9]{6}$/.test(code)) found.code = 'Enter the 6 digits from the email.';
    if (newPassword.length < MIN_PASSWORD_LENGTH) found.newPassword = `Use at least ${MIN_PASSWORD_LENGTH} characters.`;
    else if (confirm !== newPassword) found.confirm = 'The two passwords are not the same.';
    setProblems(found);
    if (Object.keys(found).length > 0) return;
    try {
      await reset.mutateAsync({ email, code, newPassword });
      onReset({ email, password: newPassword });
    } catch (caught) {
      setProblems(resetProblems(caught));
    }
  };

  const backLink = (
    <button
      type="button"
      onClick={onBack}
      className="mt-6 inline-flex items-center gap-1.5 text-sm font-semibold text-iris-600 hover:text-iris-700"
    >
      <ArrowLeft className="size-4" />
      Back to sign in
    </button>
  );

  if (step === 'email') {
    return (
      <div>
        <h1 className="text-4xl font-black tracking-tight text-ink">Forgot password</h1>
        <p className="mt-2 text-base font-medium text-ink-muted">
          Enter the email you sign in with. We will send you a 6-digit code to set a new password.
        </p>
        <form onSubmit={(event) => void sendCode(event)} className="mt-6 flex flex-col gap-5" noValidate>
          <FormField label="Email address" error={problems.email}>
            <Input
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="you@school.example"
            />
          </FormField>
          <Button type="submit" size="lg" isLoading={forgot.isPending}>
            Send code
          </Button>
        </form>
        <p className="mt-4 text-sm text-ink-muted">Students: ask your parent or your school to set a new PIN.</p>
        {backLink}
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-4xl font-black tracking-tight text-ink">Check your email</h1>
      <p className="mt-2 text-base font-medium text-ink-muted">
        If <span className="font-semibold text-ink">{email}</span> belongs to an account, a 6-digit code is on its
        way. It works for 15 minutes.
      </p>
      {isUsingMockBackend ? (
        <p className="mt-3 text-sm text-ink-faint">
          No backend is connected, so no email is sent: the demo code is{' '}
          <span className="font-semibold text-ink-muted">{DEMO_RESET_CODE}</span>.
        </p>
      ) : null}
      <form onSubmit={(event) => void setPassword(event)} className="mt-6 flex flex-col gap-5" noValidate>
        <FormField label="Code from the email" error={problems.code}>
          <Input
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={6}
            required
            value={code}
            onChange={(event) => {
              setCode(event.target.value.replace(/\D/g, '').slice(0, 6));
              // A new attempt: the last code's error no longer applies.
              setProblems((current) => ({ ...current, code: undefined }));
            }}
            placeholder="123456"
          />
        </FormField>
        <FormField label="New password" hint={`At least ${MIN_PASSWORD_LENGTH} characters.`} error={problems.newPassword}>
          <Input
            type="password"
            autoComplete="new-password"
            required
            value={newPassword}
            onChange={(event) => setNewPassword(event.target.value)}
          />
        </FormField>
        <FormField label="New password again" error={problems.confirm}>
          <Input
            type="password"
            autoComplete="new-password"
            required
            value={confirm}
            onChange={(event) => setConfirm(event.target.value)}
          />
        </FormField>
        <Button type="submit" size="lg" isLoading={reset.isPending}>
          Set new password
        </Button>
      </form>
      <p className="mt-4 text-sm text-ink-muted">
        No email? Check your spam folder, or{' '}
        {resendIn > 0 ? (
          <span>send a new code in {resendIn} s.</span>
        ) : (
          <button
            type="button"
            onClick={() => void sendCode()}
            disabled={forgot.isPending}
            className="font-semibold text-iris-600 hover:text-iris-700 disabled:opacity-60"
          >
            send a new code.
          </button>
        )}{' '}
        <button
          type="button"
          onClick={() => {
            setProblems({});
            setStep('email');
          }}
          className="font-semibold text-iris-600 hover:text-iris-700"
        >
          Use a different email.
        </button>
      </p>
      {backLink}
    </div>
  );
}
