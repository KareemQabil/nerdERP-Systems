import apiClient, { extractData } from "@/services/api/api-client";
import { cookieUtils } from "@/lib/cookie";
import type { LoginDto, LoginResponse, User } from "../types/auth.types";
import type { ApiResponse } from "@/services/api/api-types";

/**
 * Authentication Service
 * Handles all auth-related API calls
 */
export const authService = {
  /**
   * Login user
   */
  login: async (credentials: LoginDto): Promise<LoginResponse> => {
    const response = await apiClient.post<ApiResponse<LoginResponse>>(
      "/auth/login",
      credentials
    );
    return extractData(response);
  },

  /**
   * Logout user
   */
  logout: async (): Promise<void> => {
    await apiClient.post("/auth/logout");
    cookieUtils.clearAuthCookies();
  },

  /**
   * Refresh access token
   */
  refreshToken: async (): Promise<void> => {
    await apiClient.post("/auth/refresh");
  },

  /**
   * Get current user profile
   */
  getProfile: async (): Promise<User> => {
    const response = await apiClient.get<ApiResponse<User>>("/auth/profile");
    return extractData(response);
  },

  /**
   * Get user from cookie (fast, no API call)
   */
  getUserFromCookie: (): User | null => {
    return cookieUtils.getUserDetails<User>();
  },
};
