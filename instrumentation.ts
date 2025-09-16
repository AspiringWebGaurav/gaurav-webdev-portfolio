import * as Sentry from '@sentry/nextjs';

export async function register() {
  // Initialize development terminal silencer first
  if (process.env.NODE_ENV === 'development') {
    await import('@/utils/devTerminalSilencer');
  }

  if (process.env.NEXT_RUNTIME === 'nodejs') {
    await import('./sentry.server.config');
  }

  if (process.env.NEXT_RUNTIME === 'edge') {
    await import('./sentry.edge.config');
  }
}

export const onRequestError = Sentry.captureRequestError;
