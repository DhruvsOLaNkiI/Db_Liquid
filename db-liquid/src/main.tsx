import { StrictMode, useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { bootstrapSharedStore } from './utils/sharedStore';

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
      .catch(() => {
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
    return (
      <div style={{ padding: 40, fontFamily: 'system-ui', textAlign: 'center' }}>
        <p style={{ color: '#666' }}>Loading shared data…</p>
      </div>
    );
  }

  return <App />;
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Bootstrap />
  </StrictMode>,
);
