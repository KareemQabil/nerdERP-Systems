import type { ReactNode } from 'react';
import { QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import { queryClient } from '@/core/lib/query-client';

export interface AppProvidersProps {
    children: ReactNode;
}

/**
 * AppProviders
 * Global providers wrapper for the entire application
 * 
 * Includes:
 * - QueryClientProvider (TanStack Query)
 * - Toaster (react-hot-toast for notifications)
 * 
 * @example
 * <AppProviders>
 *   <App />
 * </AppProviders>
 */
export function AppProviders({ children }: AppProvidersProps) {
    return (
        <QueryClientProvider client={queryClient}>
            {children}

            {/* Toast Notifications - RTL configured */}
            <Toaster
                position="top-center"
                reverseOrder={false}
                gutter={8}
                toastOptions={{
                    // Default options
                    duration: 4000,
                    style: {
                        background: 'rgba(42, 47, 53, 0.95)',
                        color: '#e2e2e6',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        borderRadius: '12px',
                        backdropFilter: 'blur(8px)',
                        fontSize: '14px',
                        fontFamily: 'Almarai, sans-serif',
                    },
                    // Success
                    success: {
                        duration: 3000,
                        iconTheme: {
                            primary: '#22c55e',
                            secondary: '#fff',
                        },
                    },
                    // Error
                    error: {
                        duration: 5000,
                        iconTheme: {
                            primary: '#ef4444',
                            secondary: '#fff',
                        },
                    },
                    // Loading
                    loading: {
                        iconTheme: {
                            primary: '#06b6d4',
                            secondary: '#fff',
                        },
                    },
                }}
            />
        </QueryClientProvider>
    );
}
