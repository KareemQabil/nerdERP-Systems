/**
 * Application Providers
 * Centralized provider composition for Redux, Persistence, and other global providers
 */

import { type ReactNode } from 'react';
import { Provider } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';
import { store, persistor } from './store';
import { LoadingSpinner } from '@/components/feedback/LoadingSpinner';

interface AppProvidersProps {
    children: ReactNode;
}

/**
 * Loading component shown during store rehydration
 */
function PersistLoading() {
    return (
        <div className="flex h-screen w-screen items-center justify-center bg-background">
            <LoadingSpinner size="lg" />
        </div>
    );
}

/**
 * Root application providers
 * Wraps the app with Redux Provider and PersistGate
 *
 * @example
 * function App() {
 *   return (
 *     <AppProviders>
 *       <RouterProvider router={router} />
 *     </AppProviders>
 *   );
 * }
 */
export function AppProviders({ children }: AppProvidersProps) {
    return (
        <Provider store={store}>
            <PersistGate loading={<PersistLoading />} persistor={persistor}>
                {children}
            </PersistGate>
        </Provider>
    );
}

/**
 * Redux Provider only (without persistence)
 * Useful for testing or when persistence is not needed
 */
export function ReduxProvider({ children }: AppProvidersProps) {
    return <Provider store={store}>{children}</Provider>;
}
