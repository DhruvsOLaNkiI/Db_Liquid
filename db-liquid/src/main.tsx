import { StrictMode, useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import '@fontsource/inter/400.css';
import '@fontsource/inter/500.css';
import '@fontsource/inter/600.css';
import '@fontsource/space-grotesk/500.css';
import '@fontsource/space-grotesk/600.css';
import '@fontsource/space-grotesk/700.css';
import { initBrowserSentry, Sentry } from './sentry';
import App from './App.tsx';
import { HomePageSkeleton } from './components/HomePageSkeleton';
import './index.css';
import { bootstrapSharedStore } from './utils/sharedStore';

initBrowserSentry();

const AUTH_ONLY_PATHS = new Set(['/login', '/signup']);

function Bootstrap() {
  const [ready, setReady] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const path = window.location.pathname.replace(/\/$/, '') || '/';
    const authOnly = AUTH_ONLY_PATHS.has(path);

    bootstrapSharedStore({
      includeListings: !authOnly,
      includeUsers: !authOnly,
    })
      .then(() => setReady(true))
      .catch((err) => {
        Sentry.captureException(err);
        setError('Could not connect to the API / MongoDB Atlas. Run: npm run dev and check MONGODB_URI_ATLAS in .env');
      });
  }, []);

  if (error) {
    return (
      <div style={{ padding: 40, fontFamily: 'system-ui', textAlign: 'center' }}>
        <h1>DB Liquid</h1>
        <p style={{ color: '#666' }}>{error}</p>
      </div>
    );
  }

  if (!ready) {
    const path = window.location.pathname.replace(/\/$/, '') || '/';
    if (AUTH_ONLY_PATHS.has(path)) {
      return (
        <div className="min-h-screen flex items-center justify-center" aria-busy="true" aria-label="Loading">
          <div className="h-10 w-10 animate-pulse rounded-full bg-white/15" />
        </div>
      );
    }
    return <HomePageSkeleton />;
  }

  return <App />;
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Sentry.ErrorBoundary fallback={<p style={{ padding: 40 }}>Something went wrong. Please refresh.</p>}>
      <Bootstrap />
    </Sentry.ErrorBoundary>
  </StrictMode>,
);
