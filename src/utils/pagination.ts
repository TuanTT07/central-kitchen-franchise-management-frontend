export const DEFAULT_API_PAGE_SIZE = 100;
export const DEFAULT_MAX_PAGE_FETCH = 50;

export function getPaginatedItems<T>(data: unknown): T[] {
  if (!data || typeof data !== 'object') return [];
  const source = data as Record<string, unknown>;
  const items = (source.items ?? source.content) as T[] | undefined;
  return Array.isArray(items) ? items : [];
}

export function getTotalPages(data: unknown): number {
  if (!data || typeof data !== 'object') return 1;
  const source = data as Record<string, unknown>;
  const totalPages = Number(source.totalPages ?? 1);
  return Number.isFinite(totalPages) && totalPages > 0 ? totalPages : 1;
}

export async function fetchAllPages<T>(options: {
  fetchPage: (page: number, size: number) => Promise<{ items: T[]; totalPages?: number }>;
  pageSize?: number;
  maxPages?: number;
}): Promise<T[]> {
  const pageSize = options.pageSize ?? DEFAULT_API_PAGE_SIZE;
  const maxPages = options.maxPages ?? DEFAULT_MAX_PAGE_FETCH;

  const first = await options.fetchPage(0, pageSize);
  const firstItems = first.items ?? [];
  const totalPages = Math.max(1, Math.min(Number(first.totalPages ?? 1), maxPages));
  if (totalPages <= 1) return firstItems;

  const rest = await Promise.all(
    Array.from({ length: totalPages - 1 }, (_, i) => options.fetchPage(i + 1, pageSize))
  );
  return [...firstItems, ...rest.flatMap((page) => page.items ?? [])];
}
