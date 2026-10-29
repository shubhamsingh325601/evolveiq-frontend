import { describe, expect, it } from 'vitest';
import { parseCsv, toCsv } from './csv';
import { readImportTable, templateCsv } from './import-columns';

describe('parseCsv', () => {
  it('reads what a spreadsheet saves: quotes, commas and line breaks in cells, Windows endings, a BOM', () => {
    const text = '﻿Full name,Class,Note\r\n"Rao, Asha",4B,"Says ""hi""\nevery day"\r\n\r\nBen Thomas,5C,\r\n';
    expect(parseCsv(text)).toEqual([
      ['Full name', 'Class', 'Note'],
      ['Rao, Asha', '4B', 'Says "hi"\nevery day'],
      ['Ben Thomas', '5C', ''],
    ]);
  });

  it('round-trips the templates it writes', () => {
    const rows = [['a,b', 'c"d', 'plain']];
    expect(parseCsv(toCsv(rows))).toEqual(rows);
  });
});

describe('readImportTable', () => {
  it('matches columns by header in any order or case, and splits lists', () => {
    const table = parseCsv('email,NAME,classes taught,Password,Notes\nimran@example.com,Imran Ali,"4B; 5C",Secret-Password-1,ignored\n');
    const read = readImportTable('teacher', table);
    expect(read.rows).toEqual([{ fullName: 'Imran Ali', email: 'imran@example.com', password: 'Secret-Password-1', classNames: ['4B', '5C'] }]);
    expect(read.ignoredHeaders).toEqual(['Notes']);
    expect(read.missingHeaders).toEqual([]);
  });

  it('says which required columns are missing', () => {
    const read = readImportTable('student', parseCsv('Name,Class\nAsha,4B\n'));
    expect(read.missingHeaders).toEqual(['Student ID', 'PIN']);
    expect(read.rows).toEqual([{ fullName: 'Asha', className: '4B' }]);
  });

  it('writes a template whose headers read back as the import’s own columns', () => {
    for (const role of ['student', 'teacher', 'parent'] as const) {
      const read = readImportTable(role, parseCsv(templateCsv(role)));
      expect(read.missingHeaders).toEqual([]);
      expect(read.ignoredHeaders).toEqual([]);
      expect(read.rows).toHaveLength(1);
    }
  });
});
