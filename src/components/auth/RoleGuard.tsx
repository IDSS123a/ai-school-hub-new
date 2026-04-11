import { Navigate } from 'react-router-dom';
import { useAuthStore } from '../../features/auth/authStore';
import type { UserRole } from '../../types';

interface RoleGuardProps {
  children: React.ReactNode;
  allowedRoles: UserRole[];
  fallback?: React.ReactNode;
}

export function RoleGuard({ children, allowedRoles, fallback }: RoleGuardProps) {
  const { user } = useAuthStore();

  if (!user) return <Navigate to="/login" replace />;
  if (user.role === 'admin') return <>{children}</>;
  if (allowedRoles.includes(user.role)) return <>{children}</>;
  if (fallback) return <>{fallback}</>;

  return <Navigate to="/unauthorized" replace />;
}
