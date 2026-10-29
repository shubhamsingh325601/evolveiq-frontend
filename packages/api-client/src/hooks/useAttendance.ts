import { useMutation, useQueries, useQuery, useQueryClient } from '@tanstack/react-query';
import { addDays, addMonths, businessDate, businessMonth } from '../business-time';
import { ENDPOINTS } from '../endpoints';
import { request } from '../http-client';
import { queryKeys } from '../query-keys';
import type { AttendanceMark, AttendanceStudent, ClassAttendance } from '../types';

export interface DayRange {
  /** "YYYY-MM-DD", Asia/Kolkata. */
  from: string;
  to: string;
}

/** A month so far: its first day to today, or to its last day once it is over. */
export function monthRange(month: string = businessMonth(), today: string = businessDate()): DayRange {
  const lastDay = addDays(`${addMonths(month, 1)}-01`, -1);
  return { from: `${month}-01`, to: lastDay < today ? lastDay : today };
}

function fetchAttendance(classId: string, range: DayRange, signal?: AbortSignal): Promise<ClassAttendance> {
  return request<{ attendance: ClassAttendance }>('GET', ENDPOINTS.classes.attendance(classId), {
    query: { from: range.from, to: range.to },
    ...(signal ? { signal } : {}),
  }).then((response) => response.attendance);
}

/** One class's register over a range: teachers of the class and the school admin. */
export function useClassAttendance(classId: string | undefined, range: DayRange) {
  return useQuery({
    queryKey: queryKeys.attendance.class(classId ?? '', range.from, range.to),
    queryFn: ({ signal }) => fetchAttendance(classId!, range, signal),
    enabled: Boolean(classId),
  });
}

/** Several classes' registers over the same range, each student's counts by student. */
export function useClassesAttendance(classIds: string[], range: DayRange, options: { isEnabled?: boolean } = {}) {
  return useQueries({
    queries: classIds.map((classId) => ({
      queryKey: queryKeys.attendance.class(classId, range.from, range.to),
      queryFn: ({ signal }: { signal: AbortSignal }) => fetchAttendance(classId, range, signal),
      enabled: options.isEnabled ?? true,
    })),
    combine: (results) => {
      const byStudentId = new Map<string, AttendanceStudent>();
      const schoolDaysByClassId = new Map<string, number>();
      for (const result of results) {
        if (!result.data) continue;
        schoolDaysByClassId.set(result.data.classId, result.data.days.length);
        for (const student of result.data.students) byStudentId.set(student.id, student);
      }
      return { byStudentId, schoolDaysByClassId, isLoading: results.some((result) => result.isLoading) };
    },
  });
}

/** Takes or corrects one day's register. Students left out keep what they had. */
export function useMarkAttendance(classId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ day, records }: { day: string; records: AttendanceMark[] }) =>
      (await request<{ attendance: ClassAttendance }>('PUT', ENDPOINTS.classes.attendanceDay(classId, day), { body: { records } }))
        .attendance,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.attendance.all });
    },
  });
}
