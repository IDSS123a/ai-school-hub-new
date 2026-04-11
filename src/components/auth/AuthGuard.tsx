import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../features/auth/authStore';

interface AuthGuardProps {
  children: React.ReactNode;
}

export function AuthGuard({ children }: AuthGuardProps) {
  const { user, isInitialized, isLoading } = useAuthStore();
  const location = useLocation();

  if (!isInitialized || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-4 border-primary-600
                          border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-slate-500 font-medium">Učitavanje...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (!user.is_active) {
    return <Navigate to="/inactive" replace />;
  }

  return <>{children}</>;
}
