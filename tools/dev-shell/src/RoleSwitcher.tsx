import { useNavigate } from 'react-router-dom';
import { ROLE_LABELS, useAuth } from '@evolveiq/auth';

/**
 * A small marker that this is the dev launcher rather than the real app, and
 * the way back to the role picker.
 */
export function RoleSwitcher() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  if (!user) return null;

  return (
    <div className="fixed bottom-3 right-3 z-50 flex items-center gap-3 rounded-full border border-line bg-surface/95 py-1.5 pl-4 pr-1.5 backdrop-blur">
      <span className="text-sm text-ink-muted">
        Viewing as <span className="text-ink">{ROLE_LABELS[user.role]}</span>
      </span>
      <button
        type="button"
        onClick={() => {
          signOut();
          navigate('/', { replace: true });
        }}
        className="rounded-full bg-ink px-3 py-1.5 text-sm font-medium text-ink-inverse transition-colors hover:bg-teal-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-500"
      >
        Switch role
      </button>
    </div>
  );
}
