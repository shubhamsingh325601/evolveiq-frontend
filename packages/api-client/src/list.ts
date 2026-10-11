import { request, type RequestOptions } from './http-client';
import type { Pagination } from './types';

/**
 * Every backend list is paginated (`page`, `limit` ≤ 100, `pagination` beside
 * the items). Screens show lists in `RecordsTable`, which sorts, searches and
 * pages on its own, so the hooks collect every page. The cap keeps a runaway
 * list from hanging a screen; at MVP sizes no list comes near it.
 */
const PAGE_LIMIT = 100;
const MAX_PAGES = 50;

type ListResponse<TKey extends string, T> = Record<TKey, T[]> & { pagination: Pagination };

export async function fetchAllPages<T, TKey extends string = string>(
  path: string,
  key: TKey,
  query: RequestOptions['query'] = {},
  signal?: AbortSignal,
): Promise<T[]> {
  const items: T[] = [];
  for (let page = 1; page <= MAX_PAGES; page += 1) {
    const response = await request<ListResponse<TKey, T>>('GET', path, {
      query: { ...query, page, limit: PAGE_LIMIT },
      ...(signal ? { signal } : {}),
    });
    items.push(...response[key]);
    if (!response.pagination.hasNextPage) break;
  }
  return items;
}

/** How many records match, from the list's own metadata: one tiny request, no rows. */
export async function fetchTotal(
  path: string,
  query: RequestOptions['query'] = {},
  signal?: AbortSignal,
): Promise<number> {
  const response = await request<{ pagination: Pagination }>('GET', path, {
    query: { ...query, page: 1, limit: 1 },
    ...(signal ? { signal } : {}),
  });
  return response.pagination.total;
}
