import { useCallback, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import type { ClassDetail, ClassRoster, RosterStudent } from '@evolveiq/api-client';

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
 * remembered on the device, so every teacher screen opens on the same class.
 * A class the teacher no longer teaches falls back to `fallback`.
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

export interface ClassFilterState {
  classChoice: string;
  setClassChoice: (classId: string) => void;
  /** The classes the drop-down leaves on screen: all of them, or the one picked. */
  classes: ClassDetail[];
  /** Their students, in the roster's order. */
  students: RosterStudent[];
}

export interface ClassFilterOptions {
  /** Offer "All my classes" (default). The register works on one class at a time. */
  allowAll?: boolean;
  /**
   * A student a link asked for (`?studentId=`). If they are in another class
   * than the one picked, the drop-down moves to their class, once, so they are
   * on the list.
   */
  studentId?: string | undefined;
}

/**
 * The class drop-down applied to the roster (client feedback, 20 Nov 2026: on
 * every teacher screen that lists students). The choice is shared by all of
 * them, so moving from the roster to the register or a report keeps the class.
 */
export function useClassFilter(roster: ClassRoster, { allowAll = true, studentId }: ClassFilterOptions = {}): ClassFilterState {
  const classIds = roster.classes.map((detail) => detail.class.id);
  const [classChoice, setClassChoice] = useClassChoice(classIds, allowAll ? ALL_CLASSES : classIds[0]);

  const followed = useRef<string | undefined>(undefined);
  const classOfStudent = studentId ? roster.classIdByStudentId.get(studentId) : undefined;
  useEffect(() => {
    if (!studentId || !classOfStudent || followed.current === studentId) return;
    followed.current = studentId;
    if (classChoice !== ALL_CLASSES && classChoice !== classOfStudent) setClassChoice(classOfStudent);
  }, [studentId, classOfStudent, classChoice, setClassChoice]);

  const isAll = classChoice === ALL_CLASSES;
  return {
    classChoice,
    setClassChoice,
    classes: isAll ? roster.classes : roster.classes.filter((detail) => detail.class.id === classChoice),
    students: isAll ? roster.students : roster.students.filter((student) => student.classId === classChoice),
  };
}
