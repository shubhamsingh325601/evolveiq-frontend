import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ENDPOINTS } from '../endpoints';
import { request } from '../http-client';
import { queryKeys } from '../query-keys';
import type { ImportReport, ImportRequest } from '../types';

/**
 * Checks (a dry run) or imports a spreadsheet's students, teachers or parents.
 * The answer is a report row by row; nothing is created unless every row is fine.
 */
export function useImportPeople() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (importRequest: ImportRequest) =>
      (await request<{ report: ImportReport }>('POST', ENDPOINTS.imports.people, { body: importRequest })).report,
    onSuccess: (report) => {
      if (report.created === 0) return;
      void queryClient.invalidateQueries({ queryKey: queryKeys.users.all });
      void queryClient.invalidateQueries({ queryKey: queryKeys.classes.all });
      void queryClient.invalidateQueries({ queryKey: queryKeys.parentLinks.all });
    },
  });
}
