import type { ImportRole, ParentImportRow, StudentImportRow, TeacherImportRow } from '@evolveiq/api-client';
import { toCsv } from './csv';

/** A request takes at most this many rows (the backend's limit). */
export const MAX_IMPORT_ROWS = 500;

type Field = 'fullName' | 'studentId' | 'pin' | 'className' | 'parentEmail' | 'email' | 'password' | 'classNames' | 'childStudentIds';

interface ColumnSpec {
  field: Field;
  header: string;
  /** Other ways a spreadsheet might head the column (compared without case, spaces or punctuation). */
  aliases: string[];
  isList?: boolean;
  isRequired?: boolean;
  example: string;
}

const NAME: ColumnSpec = { field: 'fullName', header: 'Full name', aliases: ['name', 'student name', 'teacher name', 'parent name'], isRequired: true, example: '' };

/** The columns of each kind of import, in template order. */
export const IMPORT_COLUMNS: Record<ImportRole, ColumnSpec[]> = {
  student: [
    { ...NAME, example: 'Asha Rao' },
    { field: 'studentId', header: 'Student ID', aliases: ['id', 'admission number', 'roll number', 'login id'], isRequired: true, example: 'RV-2001' },
    { field: 'pin', header: 'PIN', aliases: ['pin code', 'password'], isRequired: true, example: '123456' },
    { field: 'className', header: 'Class', aliases: ['class name', 'section', 'grade'], example: '4B' },
    { field: 'parentEmail', header: 'Parent email', aliases: ['parent', 'parent email address', 'guardian email'], example: 'parent@example.com' },
  ],
  teacher: [
    { ...NAME, example: 'Imran Ali' },
    { field: 'email', header: 'Email', aliases: ['email address', 'e-mail'], isRequired: true, example: 'imran@example.com' },
    { field: 'password', header: 'Password', aliases: ['initial password'], isRequired: true, example: 'Choose-A-Password-1' },
    { field: 'classNames', header: 'Classes', aliases: ['class', 'class names', 'classes taught'], isList: true, example: '4B; 5C' },
  ],
  parent: [
    { ...NAME, example: 'Mira Thomas' },
    { field: 'email', header: 'Email', aliases: ['email address', 'e-mail'], isRequired: true, example: 'mira@example.com' },
    { field: 'password', header: 'Password', aliases: ['initial password'], isRequired: true, example: 'Choose-A-Password-1' },
    { field: 'childStudentIds', header: 'Children student IDs', aliases: ['children', 'child student id', 'student ids', 'child'], isList: true, example: 'RV-2001; RV-2002' },
  ],
};

const squash = (header: string) => header.toLowerCase().replace(/[^a-z0-9]/g, '');

export type ImportRows =
  | { role: 'student'; rows: StudentImportRow[] }
  | { role: 'teacher'; rows: TeacherImportRow[] }
  | { role: 'parent'; rows: ParentImportRow[] };

export interface ReadImport {
  rows: ImportRows['rows'];
  /** Headers the file had that no column matched: left out, and said so. */
  ignoredHeaders: string[];
  /** Required columns the file has no header for. */
  missingHeaders: string[];
}

/**
 * Lines a parsed CSV up with the import's columns by header — in any order, in
 * any case, with the usual alternative names — and turns each line into a row.
 * A list cell ("4B; 5C") is split on semicolons, commas or bars.
 */
export function readImportTable(role: ImportRole, table: string[][]): ReadImport {
  const [headerRow = [], ...lines] = table;
  const columns = IMPORT_COLUMNS[role];
  const indexByField = new Map<Field, number>();
  const ignoredHeaders: string[] = [];
  headerRow.forEach((header, index) => {
    const key = squash(header);
    const column = columns.find((c) => squash(c.header) === key || c.aliases.some((alias) => squash(alias) === key));
    if (column && !indexByField.has(column.field)) indexByField.set(column.field, index);
    else if (header.trim() !== '') ignoredHeaders.push(header.trim());
  });
  const missingHeaders = columns.filter((c) => c.isRequired && !indexByField.has(c.field)).map((c) => c.header);

  const rows = lines.map((line) => {
    const row: Record<string, string | string[]> = {};
    for (const column of columns) {
      const index = indexByField.get(column.field);
      if (index === undefined) continue;
      const value = (line[index] ?? '').trim();
      if (column.isList) {
        const items = value.split(/[;,|]/).map((item) => item.trim()).filter(Boolean);
        if (items.length > 0) row[column.field] = items;
      } else if (value !== '' || column.isRequired) {
        // A password keeps its spaces; everything else is trimmed.
        row[column.field] = column.field === 'password' ? (line[index] ?? '') : value;
      }
    }
    return row;
  });
  return { rows: rows as ImportRows['rows'], ignoredHeaders, missingHeaders };
}

/** The template to fill in: the headers, and one example row to overwrite. */
export function templateCsv(role: ImportRole): string {
  const columns = IMPORT_COLUMNS[role];
  return toCsv([columns.map((c) => c.header), columns.map((c) => c.example)]);
}
