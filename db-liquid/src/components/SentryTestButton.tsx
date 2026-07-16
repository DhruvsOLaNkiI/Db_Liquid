import { Sentry } from '../sentry';

/**
 * MON-001 verify helper — only in Vite DEV when VITE_SENTRY_DSN is set.
 * Uses captureException (click-handler throws are NOT auto-reported by React).
 */
export function SentryTestButton() {
  const dsn = import.meta.env.VITE_SENTRY_DSN;
  if (!import.meta.env.DEV || !dsn) {
    return null;
  }

  return (
    <button
      type="button"
      onClick={() => {
        const error = new Error('This is your first error!');
        Sentry.captureException(error);
        // Ensure the event leaves the browser before you navigate away
        void Sentry.flush(2000).then((ok) => {
          console.log(
            ok
              ? '[Sentry] Test error sent — check Issues in db-liquid-web'
              : '[Sentry] Flush timed out — check VITE_SENTRY_DSN and network',
          );
        });
      }}
      className="mt-4 w-full py-2 rounded-xl border border-red-300 text-red-700 text-sm font-medium hover:bg-red-50"
    >
      Break the world (Sentry test)
    </button>
  );
}
