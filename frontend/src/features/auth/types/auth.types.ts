import { UserRole } from '@/constants/roles.constants';

/**
 * User entity
 */
export interface User {
    id: number;
    username: string;
    email: string;
    role: UserRole;
}

/**
 * Login request DTO
 */
export interface LoginDto {
    username: string;
    password: string;
}

/**
 * Login response
 */
export interface LoginResponse {
    message: string;
    accessToken: string;
}

/**
 * Auth context type
 */
export interface AuthContextType {
    user: User | null;
    loading: boolean;
    error: string | null;
    signIn: (credentials: LoginDto) => Promise<void>;
    signOut: () => Promise<void>;
    silentRefresh: () => Promise<void>;
}
