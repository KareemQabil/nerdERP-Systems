import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import type { ConfigInitResponse } from '../types/config.types';

export const configKeys = {
    init: (storeId: string, lang: string) => ['config', 'init', storeId, lang] as const,
};

/**
 * Hook to fetch config initialization data
 * Uses TanStack Query for caching and automatic refetching
 */
export const useConfigInit = (storeId: string, languageCode = 'ar') => {
    return useQuery({
        queryKey: configKeys.init(storeId, languageCode),
        queryFn: async () => {
            const { data } = await apiClient.get<{ success: true; data: ConfigInitResponse }>(
                `/config/init?storeId=${storeId}&languageCode=${languageCode}`
            );
            return data.data;
        },
        staleTime: 5 * 60 * 1000, // 5 minutes
        gcTime: 10 * 60 * 1000, // 10 minutes
        refetchOnWindowFocus: false,
        retry: 2,
    });
};

/**
 * Hook to refetch config
 * Useful for manual refresh after settings updates
 */
export const useConfigRefresh = () => {
    const queryClient = useQueryClient();

    return (storeId: string, languageCode = 'ar') => {
        queryClient.invalidateQueries({ queryKey: configKeys.init(storeId, languageCode) });
    };
};

// Import useQueryClient for the refresh hook
import { useQueryClient } from '@tanstack/react-query';
