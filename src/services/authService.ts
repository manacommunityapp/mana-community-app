import { apiClient } from "./apiClient";
import type { AuthResponse, LoginRequest, RegisterRequest, KycRequest } from "../types/api";

export const authService = {
  /** POST /api/auth/login */
  async login(data: LoginRequest): Promise<AuthResponse> {
    return apiClient.post<AuthResponse>("/auth/login", data);
  },

  /** POST /api/auth/register */
  async register(data: RegisterRequest): Promise<AuthResponse> {
    return apiClient.post<AuthResponse>("/auth/register", data);
  },

  /**
   * POST /api/auth/verify-kyc
   * Requires a valid JWT (user must be logged in).
   * The KycRequest includes govtIdType, govtIdNumber, docType, s3Key,
   * and consentGiven. Since no file-upload endpoint exists yet we store
   * a placeholder s3Key derived from the filename.
   */
  async verifyKyc(data: KycRequest): Promise<string> {
    return apiClient.post<string>("/auth/verify-kyc", data);
  },

  /** POST /api/auth/refresh — exchange a refresh token for a fresh token pair. */
  async refresh(refreshToken: string): Promise<AuthResponse> {
    return apiClient.post<AuthResponse>("/auth/refresh", { refreshToken });
  },

  /**
   * POST /api/auth/logout — best-effort server-side audit log. Tokens are
   * stateless, so the actual session end is the client clearing its tokens.
   */
  async logout(): Promise<void> {
    try {
      await apiClient.post<string>("/auth/logout");
    } catch {
      // Ignore — logout must always succeed locally even if the call fails.
    }
  },
};
