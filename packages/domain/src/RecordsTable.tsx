import { useEffect, useMemo, useState, type ReactNode } from 'react';
import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  Button,
  ChevronLeft,
  ChevronRight,
  cn,
  EmptyState,
  Input,
  LoadingState,
  Search,
} from '@evolveiq/ui';

/**
 * One table for every list screen in the product — students, teachers,
 * classes, parents, schools, the activity library and the review queue.
 *
 * Sorting, searching and paging live here so that a management screen is only
 * a column definition plus a data hook.
 */

export interface RecordsTableColumn<TRow> {
  id: string;
  header: string;
  cell: (row: TRow) => ReactNode;
  /** Supplying this makes the column sortable. */
  sortValue?: (row: TRow) => string | number;
  align?: 'left' | 'right';
  /**
   * Hidden while the table itself is narrow, where only the essential columns
   * fit. Measured on the table, not the screen: the same phone-shell tablet has
   * more room than a desktop with the rail open.
   */
  isSecondary?: boolean;
  className?: string;
}

export interface RecordsTableProps<TRow> {
  rows: TRow[];
  columns: RecordsTableColumn<TRow>[];
  getRowId: (row: TRow) => string;
  /** Free-text search runs against this string. Omit to hide the search box. */
  searchableText?: (row: TRow) => string;
  searchPlaceholder?: string;
  /** Extra controls shown beside the search box. */
  toolbar?: ReactNode;
  onRowClick?: (row: TRow) => void;
  rowActions?: (row: TRow) => ReactNode;
  pageSize?: number;
  isLoading?: boolean;
  emptyTitle?: string;
  emptyDescription?: string;
  emptyAction?: ReactNode;
  caption: string;
  className?: string;
}

type SortState = { columnId: string; direction: 'asc' | 'desc' } | null;

const SECONDARY_COLUMN_CLASSES = 'hidden [@container(min-width:56rem)]:table-cell';

/*
 * Below 40rem (a phone, measured on the table like the secondary columns) a row no longer
 * fits on one line, so each one becomes a card: the first column as its heading, every other
 * column as a labelled line under it (the secondary ones too), its actions at the foot, and
 * the sortable headers as a "Sort by" bar above the cards. One table restyled, not a second
 * copy, and explicit roles keep it a table to screen readers whatever its display.
 */
const STACKED_TABLE = '[@container(max-width:40rem)]:block';
const STACKED_HEAD_ROW =
  "[@container(max-width:40rem)]:flex [@container(max-width:40rem)]:flex-wrap [@container(max-width:40rem)]:items-center [@container(max-width:40rem)]:gap-x-4 [@container(max-width:40rem)]:gap-y-1 [@container(max-width:40rem)]:px-5 [@container(max-width:40rem)]:py-2.5 [@container(max-width:40rem)]:before:text-xs [@container(max-width:40rem)]:before:font-bold [@container(max-width:40rem)]:before:text-ink-faint [@container(max-width:40rem)]:before:content-['Sort_by']";
// The table's `first:pl-5` / `last:pr-5` outrank a plain `p-0`, so stacked cells undo them by name.
const STACKED_EDGES = '[@container(max-width:40rem)]:first:pl-0 [@container(max-width:40rem)]:last:pr-0';
const STACKED_HEADER = `[@container(max-width:40rem)]:block [@container(max-width:40rem)]:p-0 ${STACKED_EDGES}`;
const STACKED_HIDDEN = '[@container(max-width:40rem)]:hidden';
const STACKED_ROW =
  '[@container(max-width:40rem)]:relative [@container(max-width:40rem)]:flex [@container(max-width:40rem)]:flex-col [@container(max-width:40rem)]:gap-2 [@container(max-width:40rem)]:px-5 [@container(max-width:40rem)]:py-4';
const STACKED_HEADING_CELL = `[@container(max-width:40rem)]:block [@container(max-width:40rem)]:p-0 [@container(max-width:40rem)]:text-left ${STACKED_EDGES}`;
const STACKED_LABELLED_CELL = `[@container(max-width:40rem)]:grid [@container(max-width:40rem)]:grid-cols-[minmax(0,7rem)_minmax(0,1fr)] [@container(max-width:40rem)]:items-baseline [@container(max-width:40rem)]:gap-x-3 [@container(max-width:40rem)]:p-0 [@container(max-width:40rem)]:text-left [@container(max-width:40rem)]:before:text-xs [@container(max-width:40rem)]:before:font-semibold [@container(max-width:40rem)]:before:text-ink-faint [@container(max-width:40rem)]:before:content-[attr(data-label)] ${STACKED_EDGES}`;
const STACKED_ACTIONS_CELL = `[@container(max-width:40rem)]:block [@container(max-width:40rem)]:p-0 [@container(max-width:40rem)]:pt-1 [@container(max-width:40rem)]:text-left ${STACKED_EDGES}`;
const STACKED_OPEN_CUE_CELL =
  '[@container(max-width:40rem)]:absolute [@container(max-width:40rem)]:right-4 [@container(max-width:40rem)]:top-4 [@container(max-width:40rem)]:w-auto [@container(max-width:40rem)]:p-0';

export function RecordsTable<TRow>({
  rows,
  columns,
  getRowId,
  searchableText,
  searchPlaceholder = 'Search',
  toolbar,
  onRowClick,
  rowActions,
  pageSize = 10,
  isLoading = false,
  emptyTitle = 'Nothing here yet',
  emptyDescription,
  emptyAction,
  caption,
  className,
}: RecordsTableProps<TRow>) {
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState<SortState>(null);
  const [page, setPage] = useState(0);

  const filteredRows = useMemo(() => {
    if (!searchableText || search.trim() === '') return rows;
    const needle = search.trim().toLowerCase();
    return rows.filter((row) => searchableText(row).toLowerCase().includes(needle));
  }, [rows, search, searchableText]);

  const sortedRows = useMemo(() => {
    if (!sort) return filteredRows;
    const column = columns.find((candidate) => candidate.id === sort.columnId);
    if (!column?.sortValue) return filteredRows;
    const direction = sort.direction === 'asc' ? 1 : -1;
    return [...filteredRows].sort((a, b) => {
      const left = column.sortValue!(a);
      const right = column.sortValue!(b);
      if (typeof left === 'number' && typeof right === 'number') {
        return (left - right) * direction;
      }
      return String(left).localeCompare(String(right)) * direction;
    });
  }, [filteredRows, sort, columns]);

  const pageCount = Math.max(1, Math.ceil(sortedRows.length / pageSize));

  // A filter that shortens the list must not strand the reader on a page
  // that no longer exists.
  useEffect(() => {
    setPage((current) => Math.min(current, pageCount - 1));
  }, [pageCount]);

  const visibleRows = sortedRows.slice(page * pageSize, page * pageSize + pageSize);

  const toggleSort = (columnId: string) => {
    setSort((current) => {
      if (current?.columnId !== columnId) return { columnId, direction: 'asc' };
      if (current.direction === 'asc') return { columnId, direction: 'desc' };
      return null;
    });
  };

  const hasToolbar = Boolean(searchableText) || Boolean(toolbar);
  const hasSortableColumn = columns.some((column) => column.sortValue);
  // A row that opens something says so with a chevron, unless it has its own actions.
  const hasOpenCue = Boolean(onRowClick) && !rowActions;

  return (
    <div
      className={cn(
        'overflow-hidden rounded-3xl border border-line/70 bg-white/85 shadow-card [container-type:inline-size]',
        className,
      )}
    >
      {hasToolbar ? (
        <div className="flex flex-col gap-3 border-b border-line-soft px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
          {searchableText ? (
            <div className="sm:max-w-xs sm:flex-1">
              <label className="sr-only" htmlFor={`${caption}-search`}>
                {searchPlaceholder}
              </label>
              <Input
                id={`${caption}-search`}
                type="search"
                leadingIcon={Search}
                value={search}
                placeholder={searchPlaceholder}
                className="h-10 rounded-full bg-surface-sunk/80"
                onChange={(event) => {
                  setSearch(event.target.value);
                  setPage(0);
                }}
              />
            </div>
          ) : (
            <span />
          )}
          {toolbar ? <div className="flex items-center gap-2">{toolbar}</div> : null}
        </div>
      ) : null}

      {isLoading ? <LoadingState label="Loading records" className="px-5" /> : null}

      {!isLoading && sortedRows.length === 0 ? (
        <EmptyState
          className="rounded-none border-none bg-transparent px-5 py-8"
          icon={search ? Search : undefined}
          title={search ? `Nothing matches “${search}”` : emptyTitle}
          description={
            search ? 'Try a shorter search, or clear it to see everything.' : emptyDescription
          }
          action={search ? null : emptyAction}
        />
      ) : null}

      {!isLoading && sortedRows.length > 0 ? (
        <>
          <div>
            {/* `relative` keeps the screen-reader-only labels (absolutely positioned) inside
                this box. Without it they hang off the right of a wide table, stretch the whole
                page, and a phone zooms out to fit it. */}
            <div className="relative overflow-x-auto">
              <table role="table" className={cn('w-full border-collapse text-sm', STACKED_TABLE)}>
                <caption className="sr-only">{caption}</caption>
                <thead role="rowgroup" className={cn(STACKED_TABLE, !hasSortableColumn && STACKED_HIDDEN)}>
                  <tr role="row" className={cn('border-b border-line-soft bg-surface-sunk/80', STACKED_HEAD_ROW)}>
                    {columns.map((column) => {
                      const isSorted = sort?.columnId === column.id;
                      const SortIcon = isSorted
                        ? sort.direction === 'asc'
                          ? ArrowUp
                          : ArrowDown
                        : ArrowUpDown;
                      return (
                        <th
                          key={column.id}
                          role="columnheader"
                          scope="col"
                          aria-sort={
                            isSorted
                              ? sort.direction === 'asc'
                                ? 'ascending'
                                : 'descending'
                              : undefined
                          }
                          className={cn(
                            'whitespace-nowrap px-4 py-3 text-xs font-bold text-ink-faint first:pl-5 last:pr-5',
                            column.align === 'right' ? 'text-right' : 'text-left',
                            column.isSecondary && SECONDARY_COLUMN_CLASSES,
                            // Only something to sort by belongs in the bar over the cards.
                            column.sortValue ? STACKED_HEADER : STACKED_HIDDEN,
                          )}
                        >
                          {column.sortValue ? (
                            <button
                              type="button"
                              onClick={() => toggleSort(column.id)}
                              className={cn(
                                'inline-flex items-center gap-1.5 rounded-md transition-colors hover:text-ink',
                                'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-iris-500',
                                isSorted && 'text-iris-700',
                              )}
                            >
                              {column.header}
                              <SortIcon
                                className={cn('size-3.5', isSorted ? 'opacity-100' : 'opacity-50')}
                              />
                            </button>
                          ) : (
                            column.header
                          )}
                        </th>
                      );
                    })}
                    {rowActions ? (
                      <th role="columnheader" scope="col" className={cn('px-4 py-3 pr-5 text-right', STACKED_HIDDEN)}>
                        <span className="sr-only">Actions</span>
                      </th>
                    ) : null}
                    {hasOpenCue ? (
                      <th role="columnheader" scope="col" className={cn('w-10 pr-4', STACKED_HIDDEN)}>
                        <span className="sr-only">Open</span>
                      </th>
                    ) : null}
                  </tr>
                </thead>
                <tbody role="rowgroup" className={STACKED_TABLE}>
                  {visibleRows.map((row) => (
                    <tr
                      key={getRowId(row)}
                      role="row"
                      onClick={onRowClick ? () => onRowClick(row) : undefined}
                      className={cn(
                        'group/row border-b border-line-soft transition-colors last:border-b-0',
                        onRowClick && 'cursor-pointer hover:bg-iris-50/50',
                        STACKED_ROW,
                      )}
                    >
                      {columns.map((column, index) => (
                        <td
                          key={column.id}
                          role="cell"
                          // Labels the line when the row is stacked; drawn by CSS, so it is never read twice.
                          data-label={index === 0 ? undefined : column.header}
                          className={cn(
                            'px-4 py-4 align-middle text-ink first:pl-5 last:pr-5',
                            column.align === 'right' ? 'text-right' : 'text-left',
                            column.isSecondary && SECONDARY_COLUMN_CLASSES,
                            column.className,
                            index === 0 ? STACKED_HEADING_CELL : STACKED_LABELLED_CELL,
                            index === 0 && hasOpenCue && '[@container(max-width:40rem)]:pr-8',
                          )}
                        >
                          <div className="min-w-0">{column.cell(row)}</div>
                        </td>
                      ))}
                      {rowActions ? (
                        <td
                          role="cell"
                          className={cn('px-4 py-3 pr-5 text-right', STACKED_ACTIONS_CELL)}
                          onClick={(event) => event.stopPropagation()}
                        >
                          {rowActions(row)}
                        </td>
                      ) : null}
                      {hasOpenCue ? (
                        <td role="cell" className={cn('w-10 pr-4 text-right', STACKED_OPEN_CUE_CELL)}>
                          <ChevronRight
                            aria-hidden="true"
                            className="ml-auto size-4 text-ink-faint transition-[color,transform] group-hover/row:translate-x-0.5 group-hover/row:text-iris-500"
                          />
                        </td>
                      ) : null}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {pageCount > 1 ? (
            <div className="flex items-center justify-between gap-3 border-t border-line-soft px-5 py-3">
              <p className="text-sm text-ink-muted">
                Showing {page * pageSize + 1} to{' '}
                {Math.min((page + 1) * pageSize, sortedRows.length)} of {sortedRows.length}
              </p>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  icon={ChevronLeft}
                  disabled={page === 0}
                  onClick={() => setPage((current) => Math.max(0, current - 1))}
                >
                  Previous
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  disabled={page >= pageCount - 1}
                  onClick={() => setPage((current) => Math.min(pageCount - 1, current + 1))}
                >
                  Next
                  <ChevronRight />
                </Button>
              </div>
            </div>
          ) : null}
        </>
      ) : null}
    </div>
  );
}
