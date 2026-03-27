// This file configures the initialization of Sentry on the server.
// The config you add here will be used whenever the server handles a request.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: 'https://5aa387b23d3f3190b2228ef4681880bb@o4509470513299456.ingest.us.sentry.io/4510538993172480',

  // Define how likely traces are sampled. Adjust this value in production, or use tracesSampler for greater control.
  tracesSampleRate: 0.2,

  // Enable logs to be sent to Sentry
  enableLogs: true,

  // Enable sending user PII (Personally Identifiable Information)
  // https://docs.sentry.io/platforms/javascript/guides/nextjs/configuration/options/#sendDefaultPii
  sendDefaultPii: false,

  // Ignore source map parsing errors from node_modules
  ignoreErrors: [
    'Invalid source map',
    'sourceMapURL could not be parsed',
    /source map/i,
  ],

  beforeSend(event) {
    // Strip sensitive user data
    if (event.request?.headers) {
      delete event.request.headers.authorization;
      delete event.request.headers.cookie;
    }

    // Filter out source map errors from node_modules
    if (event.exception) {
      const errorMessage = event.exception.values?.[0]?.value || '';
      if (
        errorMessage.includes('Invalid source map') ||
        errorMessage.includes('sourceMapURL could not be parsed') ||
        errorMessage.includes('node_modules')
      ) {
        return null; // Don't send this event to Sentry
      }
    }

    return event;
  },
});
