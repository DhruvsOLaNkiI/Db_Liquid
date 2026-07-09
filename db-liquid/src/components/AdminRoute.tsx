import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

type Props = {
  children: React.ReactNode;
};

export function AdminRoute({ children }: Props) {
  const { sessionReady, isAuthenticated, isAdmin } = useAuth();
  const location = useLocation();

  if (!sessionReady) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0F172A] text-white">
        <p className="text-sm text-white/70">Loading session…</p>
      </div>
    );
  }

  if (!isAuthenticated || !isAdmin) {
    return <Navigate to="/login" replace state={{ from: location.pathname, adminRequired: true }} />;
  }

  return <>{children}</>;
}
