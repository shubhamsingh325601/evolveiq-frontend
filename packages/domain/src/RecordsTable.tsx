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
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-sm">
                <caption className="sr-only">{caption}</caption>
                <thead>
                  <tr className="border-b border-line-soft bg-surface-sunk/80">
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
                      <th scope="col" className="px-4 py-3 pr-5 text-right">
                        <span className="sr-only">Actions</span>
                      </th>
                    ) : null}
                    {hasOpenCue ? (
                      <th scope="col" className="w-10 pr-4">
                        <span className="sr-only">Open</span>
                      </th>
                    ) : null}
                  </tr>
                </thead>
                <tbody>
                  {visibleRows.map((row) => (
                    <tr
                      key={getRowId(row)}
                      onClick={onRowClick ? () => onRowClick(row) : undefined}
                      className={cn(
                        'group/row border-b border-line-soft transition-colors last:border-b-0',
                        onRowClick && 'cursor-pointer hover:bg-iris-50/50',
                      )}
                    >
                      {columns.map((column) => (
                        <td
                          key={column.id}
                          className={cn(
                            'px-4 py-4 align-middle text-ink first:pl-5 last:pr-5',
                            column.align === 'right' ? 'text-right' : 'text-left',
                            column.isSecondary && SECONDARY_COLUMN_CLASSES,
                            column.className,
                          )}
                        >
                          {column.cell(row)}
                        </td>
                      ))}
                      {rowActions ? (
                        <td
                          className="px-4 py-3 pr-5 text-right"
                          onClick={(event) => event.stopPropagation()}
                        >
                          {rowActions(row)}
                        </td>
                      ) : null}
                      {hasOpenCue ? (
                        <td className="w-10 pr-4 text-right">
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
