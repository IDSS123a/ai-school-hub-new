import { create } from 'zustand';
import { persist, devtools } from 'zustand/middleware';
import type { UserProfile } from '../../types';

interface SessionData {
  access_token: string;
  expires_at: number;
}

interface AuthState {
  // State
  user: UserProfile | null;
  session: SessionData | null;
  isLoading: boolean;
  isInitialized: boolean;
  error: string | null;

  // Actions
  setUser: (user: UserProfile | null) => void;
  setSession: (session: SessionData | null) => void;
  setLoading: (loading: boolean) => void;
  setInitialized: (initialized: boolean) => void;
  setError: (error: string | null) => void;
  setAuth: (user: UserProfile | null, session: SessionData | null) => void;
  clearAuth: () => void;
  logout: () => void;

  // Computed helpers (called as functions)
  isAdmin: () => boolean;
  isTeacher: () => boolean;
  isStaff: () => boolean;
  hasAccess: (requiredRole: 'admin' | 'teacher' | 'staff') => boolean;
}

export const useAuthStore = create<AuthState>()(
  devtools(
    persist(
      (set, get) => ({
        // ─── Initial State ──────────────────────────────
        user: null,
        session: null,
        isLoading: true,
        isInitialized: false,
        error: null,

        // ─── Actions ────────────────────────────────────
        setUser: (user) =>
          set({ user }, false, 'auth/setUser'),

        setSession: (session) =>
          set({ session }, false, 'auth/setSession'),

        setLoading: (isLoading) =>
          set({ isLoading }, false, 'auth/setLoading'),

        setInitialized: (isInitialized) =>
          set({ isInitialized }, false, 'auth/setInitialized'),

        setError: (error) =>
          set({ error }, false, 'auth/setError'),

        setAuth: (user, session) =>
          set({ user, session, isLoading: false, isInitialized: true },
            false, 'auth/setAuth'),

        clearAuth: () =>
          set({ user: null, session: null, error: null },
            false, 'auth/clearAuth'),

        logout: () =>
          set({ user: null, session: null, isLoading: false },
            false, 'auth/logout'),

        // ─── Computed Helpers ───────────────────────────
        isAdmin: () => get().user?.role === 'admin',
        isTeacher: () => get().user?.role === 'teacher',
        isStaff: () => get().user?.role === 'staff',

        hasAccess: (requiredRole) => {
          const role = get().user?.role;
          if (!role) return false;
          if (role === 'admin') return true;
          return role === requiredRole;
        },
      }),
      {
        name: 'ash-auth-storage',
        partialize: (state) => ({
          user: state.user,
          session: state.session,
        }),
      }
    ),
    { name: 'AuthStore' }
  )
);
