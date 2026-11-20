/** Envelope the backend wraps all responses in. */
export interface ApiResponseEnvelope<T> {
  success: boolean;
  data: T;
  message: string | null;
  correlationId: string | null;
  timestamp: string;
}

/** Standard paginated list response. */
export interface PageResponse<T> {
  items: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  hasNext: boolean;
  hasPrevious: boolean;
}

export function isPageResponse<T>(v: unknown): v is PageResponse<T> {
  return (
    typeof v === 'object' &&
    v !== null &&
    'items' in v &&
    'totalElements' in v &&
    Array.isArray((v as PageResponse<T>).items)
  );
}

/** Typed API error carrying correlationId and traceId for support tracing. */
export class ApiError extends Error {
  constructor(
    message: string,
    public readonly correlationId?: string,
    public readonly statusCode?: number,
    public readonly traceId?: string,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

/** Last correlationId seen in a response — used by error UIs. */
let _lastCorrelationId: string | undefined;

export function setLastCorrelationId(id: string | undefined): void {
  _lastCorrelationId = id;
}

export function getLastCorrelationId(): string | undefined {
  return _lastCorrelationId;
}

/** Last traceId seen in an outgoing request or server response. */
let _lastTraceId: string | undefined;

export function setLastTraceId(id: string | undefined): void {
  _lastTraceId = id;
}

export function getLastTraceId(): string | undefined {
  return _lastTraceId;
}
