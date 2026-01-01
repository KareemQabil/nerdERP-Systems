import { useContext } from 'react';
import { AuthContext } from '../contexts/AuthProvider';
import type { AuthContextType } from '../types/auth.types';

/**
 * Hook to access auth context
 * Must be used within AuthProvider
 */
export const useAuth = (): AuthContextType => {
    const context = useContext(AuthContext);

    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }

    return context;
};
