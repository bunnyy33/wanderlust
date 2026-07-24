import * as Sentry from "@sentry/nextjs";

/**
 * Sentry server-side configuration.
 * Only active when SENTRY_DSN is set.
 */
Sentry.init({
  dsn: process.env.SENTRY_DSN,
  tracesSampleRate: 0.1,
  environment: process.env.NODE_ENV,
  enabled: !!process.env.SENTRY_DSN,
});
