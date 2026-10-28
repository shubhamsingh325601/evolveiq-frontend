import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { RecordsTable, type RecordsTableColumn } from './RecordsTable';

interface Row {
  id: string;
  name: string;
  score: number;
}

const ROWS: Row[] = [
  { id: '1', name: 'Maya Ahluwalia', score: 3 },
  { id: '2', name: 'Arjun Ahluwalia', score: 1 },
  { id: '3', name: 'Devan D’Souza', score: 2 },
];

const COLUMNS: RecordsTableColumn<Row>[] = [
  { id: 'name', header: 'Name', cell: (row) => row.name, sortValue: (row) => row.name },
  { id: 'score', header: 'Score', cell: (row) => row.score, sortValue: (row) => row.score },
];

function renderTable(overrides: Partial<Parameters<typeof RecordsTable<Row>>[0]> = {}) {
  return render(
    <RecordsTable
      caption="People"
      rows={ROWS}
      columns={COLUMNS}
      getRowId={(row) => row.id}
      searchableText={(row) => row.name}
      {...overrides}
    />,
  );
}

describe('RecordsTable', () => {
  it('narrows the rows to what the search matches', async () => {
    const user = userEvent.setup();
    renderTable();

    expect(screen.getAllByRole('row')).toHaveLength(4); // header + 3

    await user.type(screen.getByRole('searchbox'), 'Devan');

    expect(screen.getByText('Devan D’Souza')).toBeInTheDocument();
    expect(screen.queryByText('Maya Ahluwalia')).not.toBeInTheDocument();
  });

  it('explains an empty search result instead of showing a blank table', async () => {
    const user = userEvent.setup();
    renderTable();

    await user.type(screen.getByRole('searchbox'), 'Nobody');

    expect(screen.getByText(/Nothing matches/)).toBeInTheDocument();
  });

  it('sorts ascending, then descending, then returns to the original order', async () => {
    const user = userEvent.setup();
    renderTable();

    const readNames = () =>
      screen.getAllByRole('row').slice(1).map((row) => row.textContent?.replace(/\d+$/, '') ?? '');

    const sortButton = screen.getByRole('button', { name: /Score/ });

    await user.click(sortButton);
    expect(readNames()[0]).toContain('Arjun');

    await user.click(sortButton);
    expect(readNames()[0]).toContain('Maya');

    await user.click(sortButton);
    expect(readNames()[0]).toContain('Maya Ahluwalia');
  });

  it('pages through rows and does not strand the reader past the last page', async () => {
    const user = userEvent.setup();
    renderTable({ pageSize: 2 });

    expect(screen.getByText('Showing 1 to 2 of 3')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Next' }));
    expect(screen.getByText('Showing 3 to 3 of 3')).toBeInTheDocument();

    // Searching down to a single row must pull the reader back to page one.
    await user.type(screen.getByRole('searchbox'), 'Maya');
    expect(screen.getByText('Maya Ahluwalia')).toBeInTheDocument();
  });

  it('opens a row when the screen supplies a click handler', async () => {
    const user = userEvent.setup();
    const onRowClick = vi.fn();
    renderTable({ onRowClick });

    await user.click(screen.getByText('Maya Ahluwalia'));

    expect(onRowClick).toHaveBeenCalledWith(ROWS[0]);
  });

  it('labels every cell after the first, for the cards a phone shows instead of columns', () => {
    renderTable();

    const [, firstRow] = screen.getAllByRole('row');
    const cells = within(firstRow!).getAllByRole('cell');
    // The first column is the card's heading; the rest are labelled lines. The label is drawn
    // from this attribute by CSS, so a screen reader still hears the column header, once.
    expect(cells[0]).not.toHaveAttribute('data-label');
    expect(cells[1]).toHaveAttribute('data-label', 'Score');
    expect(screen.getByRole('table', { name: 'People' })).toBeInTheDocument();
  });
});
