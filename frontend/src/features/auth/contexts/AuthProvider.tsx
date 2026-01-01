import { createContext } from 'react';
import type { ReactNode } from 'react';
import { useProvideAuth } from '../hooks/useProvideAuth';
import type { AuthContextType } from '../types/auth.types';

/**
 * Auth context
 */
export const AuthContext = createContext<AuthContextType | undefined>(undefined);

/**
 * Auth provider props
 */
interface AuthProviderProps {
    children: ReactNode;
}

/**
 * Auth provider component
 * Wraps the app and provides authentication state and methods
 */
export const AuthProvider = ({ children }: AuthProviderProps) => {
    const auth = useProvideAuth();

    return <AuthContext.Provider value={auth}>{children}</AuthContext.Provider>;
};
