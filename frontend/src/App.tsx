import { Suspense, useEffect } from 'react';
import { RouterProvider, createBrowserRouter, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useSettingsStore } from '@/stores/settings.store';
import { MainLayout } from '@/components/layout';
import { LoadingSpinner } from '@/components/feedback';
import { PlaceholderPage } from '@/components/shared';
import {
  ClipboardList,
  Users,
  Truck,
  Wallet,
} from 'lucide-react';
import '@/config/i18n.config';
import './index.css';

// Lazy load pages for code splitting
import { lazy } from 'react';

const POSPage = lazy(() => import('@/modules/pos/pages/POSPage'));
const SettingsPage = lazy(() => import('@/modules/settings/pages/SettingsPage'));
const InventoryPage = lazy(() => import('@/modules/inventory/pages/InventoryPage'));
const KDSPage = lazy(() => import('@/modules/kitchen/pages/KDSPage'));
const TablesPage = lazy(() => import('@/modules/tables/pages/TablesPage'));
const ReportsDashboard = lazy(() => import('@/modules/reports/pages/ReportsDashboard'));
// const DeliveryDashboardPage = lazy(() => import('@/modules/delivery/pages/DeliveryDashboardPage')); // Requires props
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
      {
        path: 'settings',
        element: (
          <Suspense fallback={<PageLoader />}>
            <SettingsPage />
          </Suspense>
        ),
      },
      // Placeholder pages for navigation items
      {
        path: 'orders',
        element: <PlaceholderPage titleKey="nav.orders" descriptionKey="placeholder.ordersDesc" icon={ClipboardList} />,
      },
      {
        path: 'customers',
        element: <PlaceholderPage titleKey="nav.customers" descriptionKey="placeholder.customersDesc" icon={Users} />,
      },
      {
        path: 'inventory',
        element: (
          <Suspense fallback={<PageLoader />}>
            <InventoryPage />
          </Suspense>
        ),
      },
      {
        path: 'kitchen',
        element: (
          <Suspense fallback={<PageLoader />}>
            <KDSPage />
          </Suspense>
        ),
      },
      {
        path: 'delivery',
        element: <PlaceholderPage titleKey="nav.delivery" descriptionKey="placeholder.deliveryDesc" icon={Truck} />,
      },
      {
        path: 'cash',
        element: <PlaceholderPage titleKey="nav.cash" descriptionKey="placeholder.cashDesc" icon={Wallet} />,
      },
      {
        path: 'tables',
        element: (
          <Suspense fallback={<PageLoader />}>
            <TablesPage />
          </Suspense>
        ),
      },
      {
        path: 'reports',
        element: (
          <Suspense fallback={<PageLoader />}>
            <ReportsDashboard />
          </Suspense>
        ),
      },
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
