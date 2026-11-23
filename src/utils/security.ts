import { createLogger } from './logger';

const log = createLogger('Security');

const REQUIRED_ENV_VARS = ['VITE_API_BASE_URL', 'VITE_WS_BASE_URL'] as const;

/** Redirect to HTTPS in production if the page is loaded over HTTP. */
export function enforceHttps(): void {
  if (
    import.meta.env.PROD &&
    window.location.protocol === 'http:' &&
    window.location.hostname !== 'localhost'
  ) {
    log.warn('Insecure HTTP detected in production — redirecting to HTTPS');
    window.location.replace(
      window.location.href.replace(/^http:/, 'https:'),
    );
  }
}

/** Warn in production if critical environment variables are missing. */
export function validateEnvConfig(): void {
  if (!import.meta.env.PROD) return;
  const missing = REQUIRED_ENV_VARS.filter(
    (k) => !(import.meta as any).env?.[k],
  );
  if (missing.length > 0) {
    log.error('Missing required environment variables', missing);
  }
}
