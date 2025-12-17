import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/shared/lib/api';

export interface Product {
    id: string;
    name: string;
    salePrice: string;
    imageUrl?: string;
    hasStock?: boolean;
    nameAr?: string;
    modifiers?: any[];
}

export const useProducts = () => {
    return useQuery({
        queryKey: ['products'],
        queryFn: async () => {
            const data = await apiClient.get<any, Product[]>('/products');
            return data;
        }
    });
};
