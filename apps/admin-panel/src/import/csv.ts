/**
 * A small, strict reader for the CSV a spreadsheet saves ("Save as → CSV"):
 * commas between cells, double quotes around a cell that holds a comma, a quote
 * or a line break, and "" for a quote inside one. Excel's byte-order mark and
 * Windows line endings are fine. Wholly empty lines are skipped.
 */
export function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = '';
  let isQuoted = false;
  const source = text.startsWith('﻿') ? text.slice(1) : text;

  const endCell = () => {
    row.push(cell);
    cell = '';
  };
  const endRow = () => {
    endCell();
    if (row.some((value) => value.trim() !== '')) rows.push(row);
    row = [];
  };

  for (let index = 0; index < source.length; index += 1) {
    const char = source[index];
    if (isQuoted) {
      if (char === '"') {
        if (source[index + 1] === '"') {
          cell += '"';
          index += 1;
        } else {
          isQuoted = false;
        }
      } else {
        cell += char;
      }
    } else if (char === '"' && cell.trim() === '') {
      cell = '';
      isQuoted = true;
    } else if (char === ',') {
      endCell();
    } else if (char === '\n' || char === '\r') {
      if (char === '\r' && source[index + 1] === '\n') index += 1;
      endRow();
    } else {
      cell += char;
    }
  }
  if (cell !== '' || row.length > 0) endRow();
  return rows;
}

/** One cell, quoted only when it has to be, for the downloadable templates. */
function csvCell(value: string): string {
  return /[",\r\n]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value;
}

export function toCsv(rows: string[][]): string {
  return `${rows.map((row) => row.map(csvCell).join(',')).join('\r\n')}\r\n`;
}
