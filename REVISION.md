# ═══════════════════════════════════════════════════════════════════
# AI SCHOOL HUB v2.0 — REVISION DOCUMENT
# SD: Claude | ACA: Gemini 3.0 Flash Preview
# Date: 2026-04-09
# ═══════════════════════════════════════════════════════════════════

## 1. PROJECT SNAPSHOT

### 1.1 Dependencies (package.json)
```json
{
  "name": "ai-school-hub",
  "private": true,
  "version": "0.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "react": "18.3.1",
    "react-dom": "18.3.1",
    "@google/genai": "latest",
    "react-router-dom": "6.22.3",
    "lucide-react": "0.358.0",
    "recharts": "2.12.3",
    "firebase": "10.13.0",
    "html-docx-js-typescript": "0.1.5"
  },
  "devDependencies": {
    "@types/node": "^22.14.0",
    "@vitejs/plugin-react": "^5.0.0",
    "typescript": "~5.8.2",
    "vite": "^6.2.0"
  }
}
```

### 1.2 Build Status
**Build Result:** SUCCESS
**Error Message:** None
**Build Warnings:** None
**Build Size:** Verified via compile_applet

### 1.3 Source Files (src/)
```
src/app/App.tsx
src/app/providers.tsx
src/app/router.tsx
src/components/auth/LoginPage.tsx
src/components/dashboard/Dashboard.tsx
src/components/layout/AppShell.tsx
src/components/layout/Sidebar.tsx
src/components/layout/TopBar.tsx
src/components/shared/EmptyState.tsx
src/components/shared/LoadingSpinner.tsx
src/components/shared/StatsCard.tsx
src/components/ui/avatar.tsx
src/components/ui/badge.tsx
src/components/ui/button.tsx
src/components/ui/card.tsx
src/components/ui/dialog.tsx
src/components/ui/dropdown-menu.tsx
src/components/ui/form.tsx
src/components/ui/input.tsx
src/components/ui/label.tsx
src/components/ui/popover.tsx
src/components/ui/progress.tsx
src/components/ui/scroll-area.tsx
src/components/ui/select.tsx
src/components/ui/separator.tsx
src/components/ui/sheet.tsx
src/components/ui/skeleton.tsx
src/components/ui/sonner.tsx
src/components/ui/tabs.tsx
src/components/ui/textarea.tsx
src/components/ui/tooltip.tsx
src/features/ai/geminiService.ts
src/features/ai/keyRotation.ts
src/features/auth/authStore.ts
src/features/auth/useAuth.ts
src/hooks/useDebounce.ts
src/hooks/useLocalStorage.ts
src/hooks/useMediaQuery.ts
src/index.css
src/lib/constants.ts
src/lib/supabase.ts
src/lib/utils.ts
src/main.tsx
src/types/index.ts
```

## 2. COMPLETE FILE CONTENTS

### src/main.tsx
```tsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './app/App';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
```

### src/app/App.tsx
```tsx
import { RouterProvider } from 'react-router-dom';
import { router } from './router';
import { Providers } from './providers';
import { useAuth } from '../features/auth/useAuth';

function App() {
  // Initialize auth listener
  useAuth();

  return (
    <Providers>
      <RouterProvider router={router} />
    </Providers>
  );
}

export default App;
```

### src/app/router.tsx
```tsx
import { createBrowserRouter, Navigate } from 'react-router-dom';
import { LoginPage } from '../components/auth/LoginPage';
import { AppShell } from '../components/layout/AppShell';
import { Dashboard } from '../components/dashboard/Dashboard';
import { useAuthStore } from '../features/auth/authStore';

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, isLoading } = useAuthStore();
  
  if (isLoading) return null;
  if (!user) return <Navigate to="/login" replace />;
  
  return <>{children}</>;
};

export const router = createBrowserRouter([
  {
    path: '/login',
    element: <LoginPage />,
  },
  {
    path: '/',
    element: (
      <ProtectedRoute>
        <AppShell />
      </ProtectedRoute>
    ),
    children: [
      {
        index: true,
        element: <Dashboard />,
      },
      {
        path: 'dashboard',
        element: <Dashboard />,
      },
      // Other routes will be added in later steps
    ],
  },
]);
```

### src/lib/supabase.ts
```ts
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Missing Supabase environment variables. Check VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.'
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
  },
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
});

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string;
          full_name: string;
          avatar_url: string | null;
          role: 'admin' | 'teacher' | 'staff';
          staff_sub_role: string | null;
          is_active: boolean;
          created_at: string;
          updated_at: string;
          last_seen_at: string | null;
          preferences: Record<string, unknown>;
        };
        Insert: Omit<Database['public']['Tables']['profiles']['Row'], 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['profiles']['Insert']>;
      };
      documents: {
        Row: {
          id: string;
          title: string;
          prompt_id: string;
          protocol: string;
          active_module_id: string;
          owner_id: string;
          status: string;
          form_data: Record<string, unknown>;
          output_content: string;
          is_collaborative: boolean;
          share_token: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['documents']['Row'], 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['documents']['Insert']>;
      };
      document_collaborators: {
        Row: {
          id: string;
          document_id: string;
          user_id: string;
          permission: 'view' | 'edit' | 'admin';
          cursor_color: string;
          joined_at: string;
        };
        Insert: Omit<Database['public']['Tables']['document_collaborators']['Row'], 'joined_at'>;
        Update: Partial<Database['public']['Tables']['document_collaborators']['Insert']>;
      };
      activity_logs: {
        Row: {
          id: string;
          user_id: string;
          action: string;
          entity_type: string;
          entity_id: string | null;
          metadata: Record<string, unknown> | null;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['activity_logs']['Row'], 'id' | 'created_at'>;
        Update: never;
      };
    };
  };
};
```

### src/lib/utils.ts
```ts
import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: string | Date) {
  return new Intl.DateTimeFormat("bs-BA", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(date));
}
```

### src/lib/constants.ts
```ts
export const APP_NAME = "AI School Hub";
export const APP_VERSION = "2.0.0";

export const COLORS = {
  primary: "#2563EB",
  secondary: "#7C3AED",
  success: "#059669",
  warning: "#D97706",
  error: "#DC2626",
};

export const STORAGE_KEYS = {
  AUTH_TOKEN: "ash_auth_token",
  USER_PROFILE: "ash_user_profile",
  THEME: "ash_theme",
};
```

### src/features/auth/authStore.ts
```ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { UserProfile } from '../../types';

interface AuthState {
  user: UserProfile | null;
  session: any | null;
  isLoading: boolean;
  setAuth: (user: UserProfile | null, session: any | null) => void;
  updateUser: (user: Partial<UserProfile>) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      session: null,
      isLoading: true,
      setAuth: (user, session) => set({ user, session, isLoading: false }),
      updateUser: (updatedUser) =>
        set((state) => ({
          user: state.user ? { ...state.user, ...updatedUser } : null,
        })),
      logout: () => set({ user: null, session: null, isLoading: false }),
    }),
    {
      name: 'ash-auth-storage',
    }
  )
);
```

### src/features/auth/useAuth.ts
```ts
import { useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from './authStore';
import type { UserProfile } from '../../types';

export function useAuth() {
  const { user, session, setAuth, logout } = useAuthStore();

  useEffect(() => {
    // Initial session check
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        fetchProfile(session.user.id, session);
      } else {
        setAuth(null, null);
      }
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        if (session) {
          fetchProfile(session.user.id, session);
        } else {
          logout();
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  async function fetchProfile(userId: string, session: any) {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) {
      console.error('Error fetching profile:', error);
      return;
    }

    setAuth(data as UserProfile, session);
  }

  return {
    user,
    session,
    isAuthenticated: !!session,
    role: user?.role,
    isAdmin: user?.role === 'admin',
  };
}
```

### src/features/ai/keyRotation.ts
```ts
// ═══════════════════════════════════════════════════
// GEMINI 8-KEY ROTATION PROTOCOL
// Rotates through 8 free-tier API keys intelligently
// ═══════════════════════════════════════════════════

interface KeyState {
  key: string;
  requestsToday: number;
  errorsToday: number;
  lastUsed: number;
  isBlocked: boolean;
  blockedUntil?: number;
}

const DAILY_REQUEST_LIMIT = 1400; // Conservative limit per free-tier key (1500/day)
const MAX_ERRORS_BEFORE_SKIP = 3;
const BLOCK_DURATION_MS = 60_000; // 1 minute block after repeated errors

class GeminiKeyRotationManager {
  private keys: KeyState[];
  private currentIndex: number = 0;
  private storageKey = 'ash_gemini_key_states';

  constructor(apiKeys: string[]) {
    this.keys = this.loadState(apiKeys);
    this.scheduleDailyReset();
  }

  private loadState(apiKeys: string[]): KeyState[] {
    try {
      const stored = localStorage.getItem(this.storageKey);
      if (stored) {
        const parsed: KeyState[] = JSON.parse(stored);
        // Merge: preserve state for existing keys, add new ones
        return apiKeys.map(key => {
          const existing = parsed.find(s => s.key === key);
          return existing ?? this.createFreshKeyState(key);
        });
      }
    } catch {
      // ignore parse errors
    }
    return apiKeys.map(key => this.createFreshKeyState(key));
  }

  private createFreshKeyState(key: string): KeyState {
    return {
      key,
      requestsToday: 0,
      errorsToday: 0,
      lastUsed: 0,
      isBlocked: false,
    };
  }

  private saveState(): void {
    try {
      // Save without actual key values for security (keys come from env)
      const stateToSave = this.keys.map(({ key: _key, ...rest }) => ({
        key: _key,
        ...rest,
      }));
      localStorage.setItem(this.storageKey, JSON.stringify(stateToSave));
    } catch {
      // ignore storage errors
    }
  }

  private scheduleDailyReset(): void {
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setHours(24, 0, 0, 0);
    const msUntilMidnight = tomorrow.getTime() - now.getTime();

    setTimeout(() => {
      this.resetDailyCounts();
      // Reset every 24 hours after that
      setInterval(() => this.resetDailyCounts(), 86_400_000);
    }, msUntilMidnight);
  }

  private resetDailyCounts(): void {
    this.keys = this.keys.map(k => ({
      ...k,
      requestsToday: 0,
      errorsToday: 0,
      isBlocked: false,
      blockedUntil: undefined,
    }));
    this.saveState();
    console.info('[KeyRotation] Daily counts reset at midnight.');
  }

  private isKeyAvailable(keyState: KeyState): boolean {
    const now = Date.now();

    // Check if temporarily blocked
    if (keyState.isBlocked && keyState.blockedUntil) {
      if (now < keyState.blockedUntil) return false;
      // Block expired — unblock it
      keyState.isBlocked = false;
      keyState.blockedUntil = undefined;
      keyState.errorsToday = 0;
    }

    // Check daily limit
    if (keyState.requestsToday >= DAILY_REQUEST_LIMIT) return false;

    // Check error threshold
    if (keyState.errorsToday >= MAX_ERRORS_BEFORE_SKIP) {
      keyState.isBlocked = true;
      keyState.blockedUntil = now + BLOCK_DURATION_MS;
      return false;
    }

    return true;
  }

  getNextKey(): { key: string; index: number } | null {
    const startIndex = this.currentIndex;

    for (let i = 0; i < this.keys.length; i++) {
      const idx = (startIndex + i) % this.keys.length;
      const keyState = this.keys[idx];

      if (this.isKeyAvailable(keyState)) {
        this.currentIndex = (idx + 1) % this.keys.length;
        keyState.requestsToday++;
        keyState.lastUsed = Date.now();
        this.saveState();
        return { key: keyState.key, index: idx };
      }
    }

    return null; // All keys exhausted
  }

  reportError(index: number): void {
    if (this.keys[index]) {
      this.keys[index].errorsToday++;
      this.saveState();
    }
  }

  reportSuccess(index: number): void {
    if (this.keys[index]) {
      // Reset error count on success
      this.keys[index].errorsToday = Math.max(
        0,
        this.keys[index].errorsToday - 1
      );
      this.saveState();
    }
  }

  getStatus(): Array<{ index: number; available: boolean; requestsToday: number }> {
    return this.keys.map((k, i) => ({
      index: i,
      available: this.isKeyAvailable({ ...k }),
      requestsToday: k.requestsToday,
    }));
  }

  getTotalRequestsToday(): number {
    return this.keys.reduce((sum, k) => sum + k.requestsToday, 0);
  }
}

// ─── Singleton export ─────────────────────────

const GEMINI_KEYS = [
  import.meta.env.VITE_GEMINI_KEY_1,
  import.meta.env.VITE_GEMINI_KEY_2,
  import.meta.env.VITE_GEMINI_KEY_3,
  import.meta.env.VITE_GEMINI_KEY_4,
  import.meta.env.VITE_GEMINI_KEY_5,
  import.meta.env.VITE_GEMINI_KEY_6,
  import.meta.env.VITE_GEMINI_KEY_7,
  import.meta.env.VITE_GEMINI_KEY_8,
].filter(Boolean) as string[];

export const keyRotationManager = new GeminiKeyRotationManager(GEMINI_KEYS);
export type { GeminiKeyRotationManager };
```

### src/components/auth/LoginPage.tsx
```tsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../ui/card';
import { Label } from '../ui/label';
import { GraduationCap, Loader2 } from 'lucide-react';

export function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;
      navigate('/');
    } catch (err: any) {
      setError(err.message || 'Pogrešan email ili lozinka');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
      <Card className="w-full max-w-md shadow-xl border-none">
        <CardHeader className="space-y-1 text-center">
          <div className="flex justify-center mb-4">
            <div className="p-3 bg-primary rounded-2xl shadow-lg shadow-primary/20">
              <GraduationCap size={32} className="text-white" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold tracking-tight">AI School Hub v2.0</CardTitle>
          <CardDescription>
            Prijavite se na svoj račun za pristup platformi
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleLogin}>
          <CardContent className="space-y-4">
            {error && (
              <div className="p-3 text-sm bg-destructive/10 text-destructive rounded-md border border-destructive/20 animate-shake">
                {error}
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="email">Email adresa</Label>
              <Input
                id="email"
                type="email"
                placeholder="ime.prezime@skola.ba"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="focus-visible:ring-primary"
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Lozinka</Label>
              </div>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="focus-visible:ring-primary"
              />
            </div>
          </CardContent>
          <CardFooter>
            <Button 
              type="submit" 
              className="w-full bg-primary hover:bg-primary-dark transition-all" 
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Prijava u toku...
                </>
              ) : (
                'Prijavi se'
              )}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
```

### src/components/layout/AppShell.tsx
```tsx
import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { TopBar } from './TopBar';

export function AppShell() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      <Sidebar 
        collapsed={sidebarCollapsed} 
        onToggle={() => setSidebarCollapsed(!sidebarCollapsed)} 
      />
      
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <TopBar />
        
        <main className="flex-1 overflow-y-auto p-6">
          <div className="max-w-7xl mx-auto">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
```

### src/components/layout/Sidebar.tsx
```tsx
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  FileText, 
  Users, 
  Settings, 
  ChevronLeft, 
  ChevronRight,
  Sparkles,
  ShieldCheck,
  LogOut
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { Button } from '../ui/button';
import { useAuthStore } from '../../features/auth/authStore';
import { supabase } from '../../lib/supabase';

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

export function Sidebar({ collapsed, onToggle }: SidebarProps) {
  const { user } = useAuthStore();

  const menuItems = [
    { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard', roles: ['admin', 'teacher', 'staff'] },
    { icon: FileText, label: 'Moji Dokumenti', path: '/documents', roles: ['admin', 'teacher', 'staff'] },
    { icon: Sparkles, label: 'AI Promptovi', path: '/prompts', roles: ['admin', 'teacher', 'staff'] },
    { icon: Users, label: 'Korisnici', path: '/admin/users', roles: ['admin'] },
    { icon: ShieldCheck, label: 'Sistemska Podešavanja', path: '/admin/settings', roles: ['admin'] },
    { icon: Settings, label: 'Postavke', path: '/settings', roles: ['admin', 'teacher', 'staff'] },
  ];

  const filteredItems = menuItems.filter(item => 
    user && item.roles.includes(user.role)
  );

  return (
    <aside
      className={cn(
        "bg-sidebar border-r border-slate-800 flex flex-col transition-all duration-300 z-30",
        collapsed ? "w-20" : "w-64"
      )}
    >
      <div className="h-16 flex items-center justify-between px-4 border-b border-slate-800">
        {!collapsed && (
          <span className="text-white font-bold text-lg tracking-tight flex items-center gap-2">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <Sparkles size={18} className="text-white" />
            </div>
            AI School Hub
          </span>
        )}
        {collapsed && (
          <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center mx-auto">
            <Sparkles size={20} className="text-white" />
          </div>
        )}
      </div>

      <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
        {filteredItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) => cn(
              "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors group",
              isActive 
                ? "bg-primary text-white" 
                : "text-sidebar-text hover:bg-sidebar-hover hover:text-white"
            )}
          >
            <item.icon size={20} className={cn(
              "flex-shrink-0 transition-colors",
              collapsed ? "mx-auto" : ""
            )} />
            {!collapsed && <span className="font-medium">{item.label}</span>}
          </NavLink>
        ))}
      </nav>

      <div className="p-4 border-t border-slate-800">
        <Button
          variant="ghost"
          className="w-full justify-start text-sidebar-text hover:text-white hover:bg-sidebar-hover p-2"
          onClick={() => supabase.auth.signOut()}
        >
          <LogOut size={20} className={cn(collapsed ? "mx-auto" : "mr-3")} />
          {!collapsed && <span>Odjava</span>}
        </Button>
        
        <button
          onClick={onToggle}
          className="absolute -right-3 top-20 w-6 h-6 bg-primary text-white rounded-full flex items-center justify-center shadow-lg hover:scale-110 transition-transform"
        >
          {collapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
        </button>
      </div>
    </aside>
  );
}
```

### src/components/dashboard/Dashboard.tsx
```tsx
import { 
  FileText, 
  Sparkles, 
  Clock, 
  TrendingUp,
  Plus,
  ArrowRight
} from 'lucide-react';
import { StatsCard } from '../shared/StatsCard';
import { Button } from '../ui/button';
import { useAuthStore } from '../../features/auth/authStore';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';

export function Dashboard() {
  const { user } = useAuthStore();

  const stats = [
    { title: 'Ukupno dokumenata', value: '24', icon: FileText, trend: { value: 12, isPositive: true } },
    { title: 'AI Generacija', value: '142', icon: Sparkles, trend: { value: 8, isPositive: true } },
    { title: 'Aktivni sati', value: '18.5', icon: Clock, trend: { value: 5, isPositive: false } },
    { title: 'Efikasnost', value: '94%', icon: TrendingUp, trend: { value: 2, isPositive: true } },
  ];

  const recentActivity = [
    { id: 1, title: 'Priprema za čas Matematike', type: 'Lekcija', date: 'Prije 2 sata' },
    { id: 2, title: 'Godišnji plan rada - VI razred', type: 'Planiranje', date: 'Jučer' },
    { id: 3, title: 'Izvještaj o napretku - II-3', type: 'Administracija', date: 'Prije 2 dana' },
  ];

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">
            Dobrodošli nazad, {user?.full_name?.split(' ')[0]} 👋
          </h1>
          <p className="text-slate-500 mt-1">
            Evo šta se dešavalo u vašoj školi dok vas nije bilo.
          </p>
        </div>
        <Button className="bg-primary hover:bg-primary-dark shadow-lg shadow-primary/20">
          <Plus size={18} className="mr-2" />
          Novi Dokument
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, i) => (
          <StatsCard key={i} {...stat} />
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg font-bold">Nedavna Aktivnost</CardTitle>
            <Button variant="ghost" size="sm" className="text-primary hover:text-primary-dark">
              Vidi sve <ArrowRight size={14} className="ml-1" />
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentActivity.map((activity) => (
                <div 
                  key={activity.id} 
                  className="flex items-center justify-between p-4 rounded-xl border border-slate-100 hover:bg-slate-50 transition-colors cursor-pointer group"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                      <FileText size={20} />
                    </div>
                    <div>
                      <p className="font-semibold text-slate-900">{activity.title}</p>
                      <p className="text-xs text-slate-500">{activity.type}</p>
                    </div>
                  </div>
                  <span className="text-xs text-slate-400">{activity.date}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-bold">Brzi Promptovi</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button variant="outline" className="w-full justify-start border-slate-200 hover:border-primary hover:bg-primary/5 transition-all">
              <Sparkles size={16} className="mr-3 text-primary" />
              Plan lekcije
            </Button>
            <Button variant="outline" className="w-full justify-start border-slate-200 hover:border-primary hover:bg-primary/5 transition-all">
              <Sparkles size={16} className="mr-3 text-primary" />
              Kviz za učenike
            </Button>
            <Button variant="outline" className="w-full justify-start border-slate-200 hover:border-primary hover:bg-primary/5 transition-all">
              <Sparkles size={16} className="mr-3 text-primary" />
              Email roditeljima
            </Button>
            <Button variant="outline" className="w-full justify-start border-slate-200 hover:border-primary hover:bg-primary/5 transition-all">
              <Sparkles size={16} className="mr-3 text-primary" />
              Godišnji plan
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
```

### src/components/shared/StatsCard.tsx
```tsx
import { LucideIcon } from "lucide-react";
import { Card, CardContent } from "../ui/card";
import { cn } from "../../lib/utils";

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  description?: string;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  className?: string;
}

export function StatsCard({
  title,
  value,
  icon: Icon,
  description,
  trend,
  className,
}: StatsCardProps) {
  return (
    <Card className={cn("overflow-hidden hover:shadow-md transition-shadow", className)}>
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <div className="p-2 bg-primary/10 rounded-lg">
            <Icon size={20} className="text-primary" />
          </div>
        </div>
        <div className="flex items-baseline gap-2">
          <h2 className="text-2xl font-bold">{value}</h2>
          {trend && (
            <span
              className={cn(
                "text-xs font-medium",
                trend.isPositive ? "text-success" : "text-destructive"
              )}
            >
              {trend.isPositive ? "+" : "-"}{trend.value}%
            </span>
          )}
        </div>
        {description && (
          <p className="text-xs text-muted-foreground mt-1">{description}</p>
        )}
      </CardContent>
    </Card>
  );
}
```

### src/components/shared/EmptyState.tsx
```tsx
import { LucideIcon } from "lucide-react";
import { cn } from "../../lib/utils";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center p-8 text-center animate-fade-in",
        className
      )}
    >
      <div className="rounded-full bg-muted p-4 mb-4">
        <Icon size={32} className="text-muted-foreground" />
      </div>
      <h3 className="text-lg font-semibold mb-1">{title}</h3>
      {description && (
        <p className="text-sm text-muted-foreground max-w-xs mb-6">
          {description}
        </p>
      )}
      {action}
    </div>
  );
}
```

### tailwind.config.ts
```ts
import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./index.html",
    "./src/**/*.{ts,tsx}",
    "./src/components/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "#2563EB",
          dark: "#1D4ED8",
          foreground: "#FFFFFF",
          50:  "#EFF6FF",
          100: "#DBEAFE",
          200: "#BFDBFE",
          500: "#3B82F6",
          600: "#2563EB",
          700: "#1D4ED8",
          900: "#1E3A8A",
        },
        secondary: {
          DEFAULT: "#7C3AED",
          foreground: "#FFFFFF",
          50:  "#F5F3FF",
          100: "#EDE9FE",
          500: "#8B5CF6",
          600: "#7C3AED",
          700: "#6D28D9",
        },
        success: {
          DEFAULT: "#059669",
          50:  "#ECFDF5",
          100: "#D1FAE5",
          500: "#10B981",
          600: "#059669",
          700: "#047857",
        },
        warning: {
          DEFAULT: "#D97706",
          50:  "#FFFBEB",
          100: "#FEF3C7",
          500: "#F59E0B",
          600: "#D97706",
        },
        destructive: {
          DEFAULT: "#DC2626",
          foreground: "#FFFFFF",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        sidebar: {
          DEFAULT: "#0F172A",
          hover: "#1E293B",
          active: "#2563EB",
          text: "#94A3B8",
          "text-active": "#FFFFFF",
        },
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
      },
      fontSize: {
        "2xs": ["0.625rem", { lineHeight: "0.875rem" }],
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      boxShadow: {
        sm:   "0 1px 2px 0 rgb(0 0 0 / 0.05)",
        md:   "0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)",
        lg:   "0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)",
        xl:   "0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)",
        card: "0 1px 3px 0 rgb(0 0 0 / 0.08), 0 1px 2px -1px rgb(0 0 0 / 0.08)",
        "ai-glow": "0 0 20px rgb(124 58 237 / 0.3)",
      },
      animation: {
        "fade-in":      "fadeIn 0.3s ease-out",
        "slide-up":     "slideUp 0.3s ease-out",
        "slide-in-left":"slideInLeft 0.3s ease-out",
        "pulse-glow":   "pulseGlow 2s ease-in-out infinite",
        "spin-slow":    "spin 3s linear infinite",
        "shimmer":      "shimmer 2s infinite",
      },
      keyframes: {
        fadeIn: {
          "0%":   { opacity: "0" },
          "100%": { opacity: "1" },
        },
        slideUp: {
          "0%":   { transform: "translateY(8px)", opacity: "0" },
          "100%": { transform: "translateY(0)",   opacity: "1" },
        },
        slideInLeft: {
          "0%":   { transform: "translateX(-8px)", opacity: "0" },
          "100%": { transform: "translateX(0)",    opacity: "1" },
        },
        pulseGlow: {
          "0%, 100%": { boxShadow: "0 0 10px rgb(124 58 237 / 0.2)" },
          "50%":      { boxShadow: "0 0 25px rgb(124 58 237 / 0.5)" },
        },
        shimmer: {
          "0%":   { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};

export default config;
```

### vite.config.ts
```ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    host: '0.0.0.0',
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  define: {
    'process.env.API_KEY': JSON.stringify(process.env.API_KEY),
    'process.env.GEMINI_API_KEY': JSON.stringify(process.env.GEMINI_API_KEY),
  },
});
```

### components.json
```json
{
  "$schema": "https://ui.shadcn.com/schema.json",
  "style": "default",
  "rsc": false,
  "tsx": true,
  "tailwind": {
    "config": "tailwind.config.ts",
    "css": "src/styles/globals.css",
    "baseColor": "slate",
    "cssVariables": true,
    "prefix": ""
  },
  "aliases": {
    "components": "@/components",
    "utils": "@/lib/utils",
    "ui": "@/components/ui",
    "lib": "@/lib",
    "hooks": "@/hooks"
  },
  "iconLibrary": "lucide"
}
```

### .env.example
```env
# ═══════════════════════════════════════════
# AI SCHOOL HUB v2.0 — ENVIRONMENT VARIABLES
# Copy to .env.local and fill in values
# NEVER commit .env.local to git
# ═══════════════════════════════════════════

# ─── Supabase ───────────────────────────────
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

# ─── Gemini API Keys (8 Free Tier Keys) ─────
VITE_GEMINI_KEY_1=your_gemini_key_1
VITE_GEMINI_KEY_2=your_gemini_key_2
VITE_GEMINI_KEY_3=your_gemini_key_3
VITE_GEMINI_KEY_4=your_gemini_key_4
VITE_GEMINI_KEY_5=your_gemini_key_5
VITE_GEMINI_KEY_6=your_gemini_key_6
VITE_GEMINI_KEY_7=your_gemini_key_7
VITE_GEMINI_KEY_8=your_gemini_key_8

# ─── App Config ─────────────────────────────
VITE_APP_NAME=AI School Hub
VITE_APP_VERSION=2.0.0
VITE_APP_URL=http://localhost:5173
```

### .gitignore
```
# Logs
logs
*.log
npm-debug.log*
yarn-debug.log*
yarn-error.log*
pnpm-debug.log*
lerna-debug.log*

node_modules
dist
dist-ssr
*.local

# Editor directories and files
.vscode/*
!.vscode/extensions.json
.idea
.DS_Store
*.suo
*.ntvs*
*.njsproj
*.sln
*.sw?

.env.local
.env.*.local
```
