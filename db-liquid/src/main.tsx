import { StrictMode, useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { bootstrapSharedStore } from './utils/sharedStore';

function Bootstrap() {
  const [ready, setReady] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    bootstrapSharedStore()
      .then(() => setReady(true))
      .catch(() => {
        setError('Could not connect to the API / MongoDB. Run: npm run dev and check MONGODB_URI in .env');
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
