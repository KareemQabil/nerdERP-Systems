import { Suspense, useEffect } from 'react';
import { RouterProvider, createBrowserRouter, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useSettingsStore } from '@/stores/settings.store';
import { MainLayout } from '@/components/layout';
import { LoadingSpinner } from '@/components/feedback';
import '@/config/i18n.config';
import './index.css';

// Lazy load pages for code splitting
import { lazy } from 'react';

const POSPage = lazy(() => import('@/modules/pos/pages/POSPage'));
// const OrdersPage = lazy(() => import('@/modules/orders/pages/OrdersPage'));
// const SettingsPage = lazy(() => import('@/modules/settings/pages/SettingsPage'));
// const LoginPage = lazy(() => import('@/modules/auth/pages/LoginPage'));

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

// Loading fallback component
function PageLoader() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <LoadingSpinner size="lg" label="جاري التحميل..." />
    </div>
  );
}

// Router configuration
const router = createBrowserRouter([
  {
    path: '/',
    element: <MainLayout />,
    children: [
      { index: true, element: <Navigate to="/pos" replace /> },
      {
        path: 'pos',
        element: (
          <Suspense fallback={<PageLoader />}>
            <POSPage />
          </Suspense>
        ),
      },
      // Add more routes as components are built
      // { path: 'orders', element: <OrdersPage /> },
      // { path: 'settings', element: <SettingsPage /> },
    ],
  },
  // { path: '/login', element: <LoginPage /> },
]);

// App wrapper with providers
function App() {
  const initializeFromDOM = useSettingsStore((state) => state.initializeFromDOM);

  useEffect(() => {
    // Initialize theme/language/direction on mount
    initializeFromDOM();
  }, [initializeFromDOM]);

  return (
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>
  );
}

export default App;
