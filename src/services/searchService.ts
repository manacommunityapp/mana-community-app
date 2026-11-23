import { apiClient } from './common/apiClient';

export interface GlobalSearchResult {
  type: 'RESIDENT' | 'MAINTENANCE' | 'EVENT' | 'NOTICE' | 'VISITOR';
  id: number;
  title: string;
  subtitle: string;
  /** Relative frontend path for the result, e.g. "/residents/123". */
  url: string;
}

interface SearchEnvelope {
  success?: boolean;
  data?: GlobalSearchResult[] | null;
  message?: string;
}

/** An Error whose `name` is "AbortError", so callers can swallow only cancellations. */
function abortError(): Error {
  const err = new Error('Search request aborted');
  err.name = 'AbortError';
  return err;
}

/**
 * Settles with the request, or rejects with an AbortError as soon as `signal` aborts.
 *
 * NOTE: `apiClient.get` does not accept a fetch `signal`, so the underlying HTTP
 * request is not cancelled at the network layer — this guarantees the *caller*
 * never observes a stale response. Real cancellation needs a `signal` passthrough
 * in `services/common/apiClient.ts`.
 */
function raceWithAbort<T>(promise: Promise<T>, signal: AbortSignal): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    if (signal.aborted) {
      reject(abortError());
      return;
    }
    const onAbort = () => reject(abortError());
    signal.addEventListener('abort', onAbort, { once: true });
    promise.then(
      (value) => {
        signal.removeEventListener('abort', onAbort);
        resolve(value);
      },
      (err) => {
        signal.removeEventListener('abort', onAbort);
        reject(err);
      }
    );
  });
}

export async function globalSearch(
  query: string,
  limit = 20,
  signal?: AbortSignal
): Promise<GlobalSearchResult[]> {
  if (!query.trim()) return [];
  if (signal?.aborted) throw abortError();

  const params = new URLSearchParams({ q: query, limit: String(limit) });
  const request = apiClient.get<SearchEnvelope>(`/search?${params.toString()}`);
  const response = await (signal ? raceWithAbort(request, signal) : request);

  if (signal?.aborted) throw abortError();
  if (response && response.success === false) {
    throw new Error(response.message || 'Search request failed');
  }
  // Never hand back a non-array: a {success:true, data:null} body must not become `null`.
  return Array.isArray(response?.data) ? response.data : [];
}
