import { Suspense, useEffect, lazy } from 'react';
import { RouterProvider, createBrowserRouter, Navigate } from 'react-router-dom';
import { AppProviders } from '@/app/providers';
import { useAppDispatch, useAppSelector } from '@/app/hooks';
import { initializeFromPersisted, selectSettings } from '@/features/settings/slices/settingsSlice';
// Keep Zustand store during migration (for components not yet migrated)
import { useSettingsStore } from '@/stores/settings.store';
import { MainLayout } from '@/components/layout';
import { LoadingSpinner } from '@/components/feedback';
import { PlaceholderPage } from '@/components/shared';
import {
  ClipboardList,
  Users,
  Package,
  ChefHat,
  Truck,
  Wallet,
  LayoutGrid,
  BarChart3,
} from 'lucide-react';
import '@/config/i18n.config';
import './index.css';

const POSPage = lazy(() => import('@/features/pos/pages/POSPage'));
const SettingsPage = lazy(() => import('@/features/settings/pages/SettingsPage'));
// const LoginPage = lazy(() => import('@/features/auth/pages/LoginPage'));

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
        element: <PlaceholderPage titleKey="nav.inventory" descriptionKey="placeholder.inventoryDesc" icon={Package} />,
      },
      {
        path: 'kitchen',
        element: <PlaceholderPage titleKey="nav.kitchen" descriptionKey="placeholder.kitchenDesc" icon={ChefHat} />,
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
        element: <PlaceholderPage titleKey="nav.seating" descriptionKey="placeholder.seatingDesc" icon={LayoutGrid} />,
      },
      {
        path: 'reports',
        element: <PlaceholderPage titleKey="nav.reports" descriptionKey="placeholder.reportsDesc" icon={BarChart3} />,
      },
    ],
  },
  // { path: '/login', element: <LoginPage /> },
]);

// Inner app component that uses Redux hooks
function AppContent() {
  const dispatch = useAppDispatch();
  const settings = useAppSelector(selectSettings);

  // Also initialize Zustand store during migration period
  const initializeZustandSettings = useSettingsStore((state) => state.initializeFromDOM);

  useEffect(() => {
    // Initialize Redux settings from persisted state
    dispatch(initializeFromPersisted());
    // Also initialize Zustand store for components not yet migrated
    initializeZustandSettings();
  }, [dispatch, initializeZustandSettings]);

  // Sync Redux settings to Zustand during migration
  const setZustandLanguage = useSettingsStore((state) => state.setLanguage);
  const setZustandTheme = useSettingsStore((state) => state.setTheme);

  useEffect(() => {
    // Keep Zustand in sync with Redux settings
    setZustandLanguage(settings.language);
    setZustandTheme(settings.theme);
  }, [settings.language, settings.theme, setZustandLanguage, setZustandTheme]);

  return <RouterProvider router={router} />;
}

// App wrapper with providers
function App() {
  return (
    <AppProviders>
      <AppContent />
    </AppProviders>
  );
}

export default App;
