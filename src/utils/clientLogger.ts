/**
 * Structured client-side logger.
 * Outputs to console with structured context for future Sentry/Datadog wiring.
 * Shape matches what those services expect: { level, message, correlationId, ...extra }
 */

const IS_PROD = typeof import.meta !== 'undefined' && import.meta.env?.PROD;

export const clientLogger = {
  error(message: string, context?: { correlationId?: string; [key: string]: unknown }): void {
    console.error('[mana]', message, { level: 'error', ...context });
    // TODO: forward to Sentry/Datadog:
    // window.__sentry?.captureMessage(message, { level: 'error', extra: context });
  },

  warn(message: string, context?: Record<string, unknown>): void {
    if (!IS_PROD) {
      console.warn('[mana]', message, { level: 'warn', ...context });
    }
  },

  info(message: string, context?: Record<string, unknown>): void {
    if (!IS_PROD) {
      console.info('[mana]', message, { level: 'info', ...context });
    }
  },
};
