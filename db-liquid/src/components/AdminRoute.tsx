import { useEffect, useState } from 'react';
import { Link, Navigate, useLocation } from 'react-router-dom';
import { Loader2, ShieldAlert } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

type Props = {
  children: React.ReactNode;
};

export function AdminRoute({ children }: Props) {
  const { sessionReady, isAuthenticated, isAdmin, user, refreshUser } = useAuth();
  const location = useLocation();
  const [checking, setChecking] = useState(true);

  // Re-fetch /api/auth/me so Mongo admin role is applied even if client cache was stale
  useEffect(() => {
    let cancelled = false;
    async function sync() {
      if (!sessionReady) return;
      if (isAuthenticated) {
        await refreshUser();
      }
      if (!cancelled) setChecking(false);
    }
    void sync();
    return () => {
      cancelled = true;
    };
  }, [sessionReady, isAuthenticated, refreshUser]);

  if (!sessionReady || checking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0F172A] text-white gap-2">
        <Loader2 size={18} className="animate-spin text-white/70" />
        <p className="text-sm text-white/70">Checking admin access…</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <Navigate
        to="/login"
        replace
        state={{ from: location.pathname, adminRequired: true }}
      />
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0F172A] text-white px-4">
        <div className="max-w-md text-center space-y-4">
          <ShieldAlert size={40} className="mx-auto text-amber-400" />
          <h1 className="text-2xl font-bold">Admin access required</h1>
          <p className="text-sm text-white/70">
            You&apos;re logged in as <span className="text-white font-medium">{user?.name}</span>
            {user?.email ? ` (${user.email})` : ''}, but this session does not have the{' '}
            <code className="text-amber-300">admin</code> role yet.
          </p>
          <p className="text-xs text-white/50 break-all">
            Roles now: {(user?.roles ?? []).join(', ') || 'none'}
          </p>
          <p className="text-xs text-white/50">
            Log out and log back in with <code className="text-white/80">reald2535@gmail.com</code>,
            then open Admin again.
          </p>
          <div className="flex flex-wrap justify-center gap-3 pt-2">
            <Link
              to="/"
              className="px-4 py-2 rounded-full bg-white/10 hover:bg-white/15 text-sm font-medium"
            >
              Go home
            </Link>
            <Link
              to="/login"
              className="px-4 py-2 rounded-full bg-primary text-white text-sm font-medium"
            >
              Switch account
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
