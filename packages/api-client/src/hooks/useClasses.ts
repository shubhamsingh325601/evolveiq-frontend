import { useMutation, useQueries, useQuery, useQueryClient } from '@tanstack/react-query';
import { ENDPOINTS } from '../endpoints';
import { request } from '../http-client';
import { fetchAllPages } from '../list';
import { queryKeys } from '../query-keys';
import type { ClassDetail, ClassGroup, Person } from '../types';

/** School admins: every class of their school. Teachers: the classes they teach. */
export function useClasses(options: { isEnabled?: boolean } = {}) {
  return useQuery({
    queryKey: queryKeys.classes.list(),
    queryFn: ({ signal }) => fetchAllPages<ClassGroup>(ENDPOINTS.classes.list, 'classes', {}, signal),
    enabled: options.isEnabled ?? true,
  });
}

function fetchClass(classId: string, signal?: AbortSignal): Promise<ClassDetail> {
  return request<ClassDetail>('GET', ENDPOINTS.classes.detail(classId), signal ? { signal } : {});
}

export function useClass(classId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.classes.detail(classId ?? ''),
    queryFn: ({ signal }) => fetchClass(classId!, signal),
    enabled: Boolean(classId),
  });
}

/** A student on a roster, with the class they are in. */
export interface RosterStudent extends Person {
  classId: string;
  className: string;
}

export interface ClassRoster {
  classes: ClassDetail[];
  /** Everyone in those classes, by name. A student is in one class at most. */
  students: RosterStudent[];
  /** The class each placed student is in. */
  classIdByStudentId: Map<string, string>;
  isLoading: boolean;
  isError: boolean;
  /** Loads the classes and every class again. */
  refetch: () => void;
}

/**
 * Every class the caller can see, opened, with its teachers and students. For
 * a teacher this is "my students"; for a school admin, who is placed where.
 * Each class keeps its own cache entry.
 */
export function useClassRoster(options: { isEnabled?: boolean } = {}): ClassRoster {
  const queryClient = useQueryClient();
  const classes = useClasses(options);
  const details = useQueries({
    queries: (classes.data ?? []).map((group) => ({
      queryKey: queryKeys.classes.detail(group.id),
      queryFn: ({ signal }: { signal: AbortSignal }) => fetchClass(group.id, signal),
    })),
    combine: (results) => ({
      data: results.flatMap((result) => (result.data ? [result.data] : [])),
      isLoading: results.some((result) => result.isLoading),
      isError: results.some((result) => result.isError),
    }),
  });

  const students: RosterStudent[] = details.data
    .flatMap((detail) =>
      detail.students.map((student) => ({
        ...student,
        classId: detail.class.id,
        className: detail.class.name,
      })),
    )
    .sort((a, b) => a.fullName.localeCompare(b.fullName));

  return {
    classes: details.data,
    students,
    classIdByStudentId: new Map(students.map((student) => [student.id, student.classId])),
    isLoading: classes.isLoading || details.isLoading,
    isError: classes.isError || details.isError,
    refetch: () => void queryClient.invalidateQueries({ queryKey: queryKeys.classes.all }),
  };
}

/** School admins only. The school comes from the admin's own account. */
export function useCreateClass() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (group: { name: string }) =>
      (await request<{ class: ClassGroup }>('POST', ENDPOINTS.classes.list, { body: group })).class,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.classes.all });
    },
  });
}

export function useRenameClass() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ classId, name }: { classId: string; name: string }) =>
      (await request<{ class: ClassGroup }>('PATCH', ENDPOINTS.classes.detail(classId), { body: { name } }))
        .class,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.classes.all });
    },
  });
}

export interface ClassMemberChanges {
  classId: string;
  addTeacherIds?: string[];
  removeTeacherIds?: string[];
  addStudentIds?: string[];
  removeStudentIds?: string[];
  /**
   * Where each student being added is now. A student is in one class at most,
   * so they leave the old class first.
   */
  currentClassIdByStudentId?: Map<string, string>;
}

/**
 * Applies a class's teacher and student changes, one call per change, in an
 * order the rules allow: removals before additions, and a moving student out
 * of their old class before into the new one.
 */
export function useUpdateClassMembers() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      classId,
      addTeacherIds = [],
      removeTeacherIds = [],
      addStudentIds = [],
      removeStudentIds = [],
      currentClassIdByStudentId = new Map(),
    }: ClassMemberChanges) => {
      for (const teacherId of removeTeacherIds) {
        await request('DELETE', ENDPOINTS.classes.teacher(classId, teacherId));
      }
      for (const studentId of removeStudentIds) {
        await request('DELETE', ENDPOINTS.classes.student(classId, studentId));
      }
      for (const teacherId of addTeacherIds) {
        await request('PUT', ENDPOINTS.classes.teacher(classId, teacherId));
      }
      for (const studentId of addStudentIds) {
        const currentClassId = currentClassIdByStudentId.get(studentId);
        if (currentClassId === classId) continue;
        if (currentClassId) await request('DELETE', ENDPOINTS.classes.student(currentClassId, studentId));
        await request('PUT', ENDPOINTS.classes.student(classId, studentId));
      }
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.classes.all });
    },
  });
}

/** Moves one student: out of their class (if any), into another (if given). */
export function useSetStudentClass() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      studentId,
      fromClassId,
      toClassId,
    }: {
      studentId: string;
      fromClassId?: string;
      toClassId?: string;
    }) => {
      if (fromClassId === toClassId) return;
      if (fromClassId) await request('DELETE', ENDPOINTS.classes.student(fromClassId, studentId));
      if (toClassId) await request('PUT', ENDPOINTS.classes.student(toClassId, studentId));
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.classes.all });
    },
  });
}
