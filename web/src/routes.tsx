import { Navigate, createBrowserRouter } from 'react-router-dom';

import { Layout } from './components/Layout';
import { BillFormPage } from './features/bills/BillFormPage';
import { BillsPage } from './features/bills/BillsPage';
import { AuthPage } from './features/auth/AuthPage';
import { CategoriesPage } from './features/categories/CategoriesPage';
import { DashboardPage } from './features/dashboard/DashboardPage';
import { NotificationsPage } from './features/notifications/NotificationsPage';
import { PermissionsPage } from './features/permissions/PermissionsPage';
import { PreferencesPage } from './features/users/PreferencesPage';
import { useAuth } from './lib/auth-context';
import { getToken } from './lib/storage';

function ProtectedRoute({
  children,
  permission,
}: {
  children: JSX.Element;
  permission?: string;
}) {
  const { user, loading } = useAuth();

  if (loading) {
    return null;
  }

  if (!getToken() || !user) {
    return <Navigate to="/login" replace />;
  }

  if (permission && !user.permissions.includes(permission as never)) {
    return <Navigate to="/" replace />;
  }

  return children;
}

export const router = createBrowserRouter([
  {
    path: '/login',
    element: <AuthPage />,
  },
  {
    path: '/',
    element: <Layout />,
    children: [
      {
        index: true,
        element: (
          <ProtectedRoute permission="dashboard.view">
            <DashboardPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'bills',
        element: (
          <ProtectedRoute permission="bills.view">
            <BillsPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'bills/new',
        element: (
          <ProtectedRoute permission="bills.create">
            <BillFormPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'bills/:id/edit',
        element: (
          <ProtectedRoute permission="bills.update">
            <BillFormPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'categories',
        element: (
          <ProtectedRoute permission="categories.view">
            <CategoriesPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'notifications',
        element: (
          <ProtectedRoute permission="history.view">
            <NotificationsPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'permissions',
        element: (
          <ProtectedRoute permission="permissions.view">
            <PermissionsPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'preferences',
        element: (
          <ProtectedRoute permission="users.update">
            <PreferencesPage />
          </ProtectedRoute>
        ),
      },
    ],
  },
]);
