import { createBrowserRouter, Navigate } from 'react-router-dom';
import { lazy, Suspense } from 'react';
import { AuthGuard } from '../components/auth/AuthGuard';
import { LoginPage } from '../components/auth/LoginPage';
import { LoadingSpinner } from '../components/shared/LoadingSpinner';

const AppShell  = lazy(() =>
  import('../components/layout/AppShell').then(m => ({ default: m.AppShell })));
const Dashboard = lazy(() =>
  import('../components/dashboard/Dashboard').then(m => ({ default: m.Dashboard })));
const EditorPage = lazy(() =>
  import('../components/editor/EditorPage')
    .then(m => ({ default: m.EditorPage })));

function PageLoader() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <LoadingSpinner size="lg" label="Učitavanje..." />
    </div>
  );
}

function UnauthorizedPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6">
      <div className="text-center max-w-md">
        <div className="w-16 h-16 rounded-2xl bg-red-100 flex items-center
                        justify-center mx-auto mb-4 text-3xl">🔒</div>
        <h1 className="text-xl font-bold text-slate-900 mb-2">Pristup odbijen</h1>
        <p className="text-slate-500 text-sm">
          Nemate dozvolu za pristup ovoj stranici.
          Kontaktirajte administratora škole.
        </p>
      </div>
    </div>
  );
}

function InactivePage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6">
      <div className="text-center max-w-md">
        <div className="w-16 h-16 rounded-2xl bg-amber-100 flex items-center
                        justify-center mx-auto mb-4 text-3xl">⚠️</div>
        <h1 className="text-xl font-bold text-slate-900 mb-2">Račun deaktiviran</h1>
        <p className="text-slate-500 text-sm">
          Vaš korisnički račun je deaktiviran.
          Obratite se administratoru škole.
        </p>
      </div>
    </div>
  );
}

export const router = createBrowserRouter([
  { path: '/login',        element: <LoginPage /> },
  { path: '/unauthorized', element: <UnauthorizedPage /> },
  { path: '/inactive',     element: <InactivePage /> },
  {
    path: '/',
    element: (
      <AuthGuard>
        <Suspense fallback={<PageLoader />}>
          <AppShell />
        </Suspense>
      </AuthGuard>
    ),
    children: [
      { index: true, element: <Navigate to="/dashboard" replace /> },
      {
        path: 'dashboard',
        element: (
          <Suspense fallback={<PageLoader />}>
            <Dashboard />
          </Suspense>
        ),
      },
      {
        path: 'editor/:slug',
        element: (
          <Suspense fallback={<PageLoader />}>
            <EditorPage />
          </Suspense>
        ),
      },
    ],
  },
  { path: '*', element: <Navigate to="/dashboard" replace /> },
]);
