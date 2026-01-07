import { useConfigInit } from '@/modules/config/hooks/useConfigInit';
import { ConfigProvider } from '@/components/core/ConfigProvider';
import { LoadingSpinner } from '@/components/feedback/LoadingSpinner';

interface ConfigLoaderProps {
    storeId: string;
    languageCode?: string;
    children: React.ReactNode;
}

/**
 * Config Loader Component
 * Fetches configuration on app mount and blocks rendering until loaded
 * Shows loading spinner while fetching config
 */
export function ConfigLoader({ storeId, languageCode = 'ar', children }: ConfigLoaderProps) {
    const { data: config, isLoading, error } = useConfigInit(storeId, languageCode);

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-900">
                <LoadingSpinner size="xl" label="جاري تحميل الإعدادات..." />
                <p className="mt-4 text-slate-400">Loading configuration</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-900">
                <div className="text-center">
                    <p className="text-red-400 mb-4">Failed to load configuration</p>
                    <p className="text-sm text-slate-400">{error.message}</p>
                    <button
                        onClick={() => window.location.reload()}
                        className="mt-4 px-4 py-2 bg-violet-600 text-white rounded-lg hover:bg-violet-700"
                    >
                        Retry
                    </button>
                </div>
            </div>
        );
    }

    if (!config) {
        return null;
    }

    return (
        <ConfigProvider storeId={storeId} config={config}>
            {children}
        </ConfigProvider>
    );
}
