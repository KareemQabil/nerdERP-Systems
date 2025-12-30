/**
 * Auth Service
 * Handles authentication, PIN verification, and authorization operations
 */
import { apiClient } from '@/lib/api-client';
import type { ApiResponse, ApiError } from '@/types/api.types';

// =============================================================================
// TYPES
// =============================================================================

export interface LoginRequest {
  email: string;
  password: string;
  deviceId?: string;
}

export interface PinLoginRequest {
  pin: string;
  deviceId: string;
}

export interface VerifyPinRequest {
  pin: string;
  action: string;
  reason?: string;
}

export interface VerifyPinResponse {
  authorized: boolean;
  managerId?: string;
  managerName?: string;
  timestamp: string;
}

export interface ChangePinRequest {
  oldPin: string;
  newPin: string;
  deviceId?: string;
}

export interface UnlockSessionRequest {
  pin: string;
}

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  roleId: string;
  isActive: boolean;
  lastLoginAt?: string;
  storeId?: string;
  role?: Role;
}

export interface Role {
  id: string;
  roleName: string;
  roleCode: 'ADMIN' | 'MANAGER' | 'CASHIER' | 'WAITER';
  permissions: string[];
}

export interface AuthResponse {
  user: User;
  token: string;
  permissions: string[];
}

// =============================================================================
// AUTH SERVICE
// =============================================================================

class AuthService {
  private readonly basePath = '/api/v1/auth';

  /**
   * Login with email and password
   */
  async login(credentials: LoginRequest): Promise<AuthResponse> {
    const response = await apiClient.post<ApiResponse<AuthResponse>>(
      `${this.basePath}/login`,
      credentials
    );
    return response.data.data;
  }

  /**
   * Login with PIN code (for POS quick login)
   */
  async pinLogin(credentials: PinLoginRequest): Promise<AuthResponse> {
    const response = await apiClient.post<ApiResponse<AuthResponse>>(
      `${this.basePath}/pin-login`,
      credentials
    );
    return response.data.data;
  }

  /**
   * Verify PIN code for sensitive operations
   * Used for manager authorization (void, discount, refund, etc.)
   */
  async verifyPin(request: VerifyPinRequest): Promise<VerifyPinResponse> {
    try {
      const response = await apiClient.post<ApiResponse<VerifyPinResponse>>(
        `${this.basePath}/verify-pin`,
        request
      );
      return response.data.data;
    } catch (error) {
      // Check if it's a PIN locked error
      const apiError = error as ApiError;
      if (apiError.error?.code === 'SESSION_001') {
        throw new Error('PIN_LOCKED');
      }
      if (apiError.error?.code === 'AUTH_006') {
        throw new Error('INVALID_PIN');
      }
      throw error;
    }
  }

  /**
   * Change user PIN code
   */
  async changePin(request: ChangePinRequest): Promise<{ success: boolean }> {
    const response = await apiClient.post<ApiResponse<{ success: boolean }>>(
      `${this.basePath}/change-pin`,
      request
    );
    return response.data.data;
  }

  /**
   * Unlock session after PIN lock
   */
  async unlockSession(request: UnlockSessionRequest): Promise<{ success: boolean; attemptsRemaining?: number }> {
    try {
      const response = await apiClient.post<ApiResponse<{ success: boolean; attemptsRemaining?: number }>>(
        `${this.basePath}/unlock-session`,
        request
      );
      return response.data.data;
    } catch (error) {
      const apiError = error as ApiError;
      return {
        success: false,
        attemptsRemaining: apiError.error?.details?.attemptsRemaining || 0,
      };
    }
  }

  /**
   * Get PIN attempt status
   */
  async getPinAttempts(): Promise<{ attempts: number; maxAttempts: number; lockedUntil?: string }> {
    const response = await apiClient.get<ApiResponse<{ attempts: number; maxAttempts: number; lockedUntil?: string }>>(
      `${this.basePath}/pin-attempts`
    );
    return response.data.data;
  }

  /**
   * Logout current user
   */
  async logout(): Promise<void> {
    await apiClient.post(`${this.basePath}/logout`);
    // Clear token from localStorage
    localStorage.removeItem('auth_token');
  }

  /**
   * Refresh authentication token
   */
  async refreshToken(): Promise<{ token: string }> {
    const response = await apiClient.post<ApiResponse<{ token: string }>>(
      `${this.basePath}/refresh`
    );
    return response.data.data;
  }

  /**
   * Store auth token in localStorage
   */
  setToken(token: string): void {
    localStorage.setItem('auth_token', token);
  }

  /**
   * Get auth token from localStorage
   */
  getToken(): string | null {
    return localStorage.getItem('auth_token');
  }

  /**
   * Clear auth token from localStorage
   */
  clearToken(): void {
    localStorage.removeItem('auth_token');
  }

  /**
   * Check if user is authenticated
   */
  isAuthenticated(): boolean {
    return !!this.getToken();
  }
}

// =============================================================================
// SINGLETON INSTANCE
// =============================================================================

export const authService = new AuthService();

// =============================================================================
// RE-EXPORT TYPES
// =============================================================================

export type {
  LoginRequest,
  PinLoginRequest,
  VerifyPinRequest,
  VerifyPinResponse,
  ChangePinRequest,
  UnlockSessionRequest,
  User,
  Role,
  AuthResponse,
};
