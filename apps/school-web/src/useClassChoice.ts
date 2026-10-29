import { useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';

export const ALL_CLASSES = 'all';
const STORAGE_KEY = 'evolveiq.teacher.class';

function stored(): string | null {
  try {
    return window.localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}

/**
 * The class a teacher picked in the class drop-down (client feedback, 29 Oct
 * 2026): in the address (`?class=`), so a link or a reload keeps it, and
 * remembered on the device, so the roster and the register open on the same
 * class. A class the teacher no longer teaches falls back to `fallback`.
 */
export function useClassChoice(classIds: string[], fallback: string = ALL_CLASSES): [string, (classId: string) => void] {
  const [params, setParams] = useSearchParams();
  const wanted = params.get('class') ?? stored();
  const isKnown = (id: string | null): id is string => id !== null && (id === ALL_CLASSES ? fallback === ALL_CLASSES : classIds.includes(id));
  const chosen = isKnown(wanted) ? wanted : fallback;

  const choose = useCallback(
    (classId: string) => {
      try {
        window.localStorage.setItem(STORAGE_KEY, classId);
      } catch {
        // Private browsing: the address still carries it.
      }
      setParams(
        (current) => {
          const next = new URLSearchParams(current);
          next.set('class', classId);
          return next;
        },
        { replace: true },
      );
    },
    [setParams],
  );

  return [chosen, choose];
}
