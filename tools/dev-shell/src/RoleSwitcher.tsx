import { useNavigate } from 'react-router-dom';
import { ROLE_LABELS, useAuth } from '@evolveiq/auth';

/**
 * A small marker that this is the dev launcher rather than the real app, and
 * the way back to the role picker. On phones it sits above the app's tab bar.
 */
export function RoleSwitcher() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  if (!user) return null;

  return (
    <div className="fixed bottom-[6.25rem] right-3 z-40 flex items-center gap-3 rounded-full border border-white/70 bg-white/85 py-1.5 pl-4 pr-1.5 shadow-raised backdrop-blur-xl lg:bottom-4 lg:right-4">
      <span className="text-sm text-ink-muted">
        Viewing as <span className="text-ink">{ROLE_LABELS[user.role]}</span>
      </span>
      <button
        type="button"
        onClick={() => {
          signOut();
          navigate('/', { replace: true });
        }}
        className="rounded-full bg-night px-3.5 py-1.5 text-sm font-medium text-white transition-colors hover:bg-iris-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-iris-500"
      >
        Switch role
      </button>
    </div>
  );
}
