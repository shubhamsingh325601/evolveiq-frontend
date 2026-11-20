import type { ClassDetail } from '@evolveiq/api-client';
import { cn, FormField, Select } from '@evolveiq/ui';
import { ALL_CLASSES } from '../useClassChoice';

const studentCount = (count: number) => `${count} ${count === 1 ? 'student' : 'students'}`;

export interface ClassFilterProps {
  /** Every class the teacher teaches (the whole roster, not the filtered list). */
  classes: ClassDetail[];
  value: string;
  onChange: (classId: string) => void;
  /** Offer "All my classes" first (default). The register works on one class at a time. */
  allowAll?: boolean;
  className?: string;
}

/**
 * The teacher's class drop-down (client feedback, 29 Oct and 20 Nov 2026). Each
 * teacher screen that lists students narrows to the class picked here; the
 * choice follows the teacher from screen to screen (`useClassFilter`).
 */
export function ClassFilter({ classes, value, onChange, allowAll = true, className }: ClassFilterProps) {
  if (classes.length === 0) return null;
  const total = classes.reduce((sum, detail) => sum + detail.students.length, 0);
  return (
    <FormField label="Class" className={cn('w-full max-w-xs', className)}>
      <Select value={value} onChange={(event) => onChange(event.target.value)}>
        {allowAll ? <option value={ALL_CLASSES}>All my classes · {studentCount(total)}</option> : null}
        {classes.map((detail) => (
          <option key={detail.class.id} value={detail.class.id}>
            {detail.class.name} · {studentCount(detail.students.length)}
          </option>
        ))}
      </Select>
    </FormField>
  );
}
