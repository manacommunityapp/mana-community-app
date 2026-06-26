// Plain const object instead of an enum so the file is type-erasable
// (tsconfig `erasableSyntaxOnly`); numeric values preserve level ordering.
const LogLevel = {
  DEBUG: 0,
  INFO: 1,
  WARN: 2,
  ERROR: 3,
} as const;
type LogLevel = (typeof LogLevel)[keyof typeof LogLevel];

const LEVEL_LABELS: Record<LogLevel, string> = {
  [LogLevel.DEBUG]: "DEBUG",
  [LogLevel.INFO]: "INFO",
  [LogLevel.WARN]: "WARN",
  [LogLevel.ERROR]: "ERROR",
};

const IS_PROD = import.meta.env.PROD;
const MIN_LEVEL: LogLevel = IS_PROD ? LogLevel.WARN : LogLevel.DEBUG;

let sessionCorrelationId: string | null = null;

export function setCorrelationId(id: string | null) {
  sessionCorrelationId = id;
}

export function getCorrelationId(): string | null {
  return sessionCorrelationId;
}

interface LogEntry {
  level: string;
  ts: string;
  tag: string;
  message: string;
  correlationId?: string;
  error?: string;
  stack?: string;
  data?: unknown;
}

function buildEntry(
  level: LogLevel,
  tag: string,
  message: string,
  error?: unknown,
  data?: unknown,
): LogEntry {
  const entry: LogEntry = {
    level: LEVEL_LABELS[level],
    ts: new Date().toISOString(),
    tag,
    message,
  };
  if (sessionCorrelationId) entry.correlationId = sessionCorrelationId;
  if (error instanceof Error) {
    entry.error = error.message;
    if (error.stack) entry.stack = error.stack;
  } else if (error !== undefined) {
    entry.error = String(error);
  }
  if (data !== undefined) entry.data = data;
  return entry;
}

const BUFFER: LogEntry[] = [];
const BUFFER_MAX = 50;
let flushTimer: ReturnType<typeof setTimeout> | null = null;

function bufferEntry(entry: LogEntry) {
  BUFFER.push(entry);
  if (BUFFER.length >= BUFFER_MAX) {
    flush();
  } else if (!flushTimer) {
    flushTimer = setTimeout(flush, 30_000);
  }
}

function flush() {
  if (flushTimer) {
    clearTimeout(flushTimer);
    flushTimer = null;
  }
  if (BUFFER.length === 0) return;

  const batch = BUFFER.splice(0);
  const token = localStorage.getItem("mana_token");
  if (!token) return;

  const body = JSON.stringify(batch);
  if (navigator.sendBeacon) {
    const blob = new Blob([body], { type: "application/json" });
    navigator.sendBeacon("/api/frontend-logs", blob);
  } else {
    fetch("/api/frontend-logs", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body,
      keepalive: true,
    }).catch(() => {});
  }
}

function emit(
  level: LogLevel,
  tag: string,
  message: string,
  error?: unknown,
  data?: unknown,
) {
  if (level < MIN_LEVEL) return;

  const entry = buildEntry(level, tag, message, error, data);

  if (!IS_PROD) {
    const prefix = `[${entry.level}] [${tag}]`;
    const args: unknown[] = [prefix, message];
    if (error) args.push(error);
    if (data !== undefined) args.push(data);

    if (level >= LogLevel.ERROR) console.error(...args);
    else if (level >= LogLevel.WARN) console.warn(...args);
    else console.log(...args);
  }

  if (level >= LogLevel.ERROR) {
    bufferEntry(entry);
  }
}

window.addEventListener("beforeunload", flush);

export function createLogger(tag: string) {
  return {
    debug: (msg: string, data?: unknown) => emit(LogLevel.DEBUG, tag, msg, undefined, data),
    info: (msg: string, data?: unknown) => emit(LogLevel.INFO, tag, msg, undefined, data),
    warn: (msg: string, error?: unknown) => emit(LogLevel.WARN, tag, msg, error),
    error: (msg: string, error?: unknown, data?: unknown) =>
      emit(LogLevel.ERROR, tag, msg, error, data),
  };
}

export const logger = createLogger("App");
