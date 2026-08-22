import { apiClient } from "./apiClient";
import type {
  AuthResponse,
  LoginRequest,
  RegisterRequest,
  KycRequest,
  ResetPasswordRequest,
  ResetPasswordResponse,
  ChangePasswordRequest,
  ChangePasswordResponse,
} from "../../types/api";

export const authService = {
  /** POST /api/auth/login */
  async login(data: LoginRequest): Promise<AuthResponse> {
    return apiClient.post<AuthResponse>("/auth/login", data);
  },

  /** POST /api/auth/register */
  async register(data: RegisterRequest): Promise<AuthResponse> {
    return apiClient.post<AuthResponse>("/auth/register", data);
  },

  /** POST /api/auth/forgot-password — send 6-digit OTP to user's registered email */
  async sendPasswordResetOtp(email: string): Promise<ResetPasswordResponse> {
    return apiClient.post<ResetPasswordResponse>("/auth/forgot-password", { email });
  },

  /** POST /api/auth/reset-password — verify OTP and update user password */
  async resetPassword(data: ResetPasswordRequest): Promise<ResetPasswordResponse> {
    return apiClient.post<ResetPasswordResponse>("/auth/reset-password", data);
  },

  /**
   * POST /api/auth/change-password — update user password for authenticated session.
   * Gracefully tries primary and fallback routes (POST/PUT /auth/change-password, /users/change-password, /users/{id}).
   */
  async changePassword(data: ChangePasswordRequest): Promise<ChangePasswordResponse> {
    const payload = {
      currentPassword: data.currentPassword,
      oldPassword: data.currentPassword,
      newPassword: data.newPassword,
      confirmPassword: data.confirmPassword || data.newPassword,
      password: data.newPassword,
    };

    const isEndpointMissing = (err: unknown) => {
      const msg = ((err instanceof Error ? err.message : "") || "").toLowerCase();
      return msg.includes("404") || msg.includes("not found") || msg.includes("405") || msg.includes("method not allowed");
    };

    const unwrapResponse = (res: any): ChangePasswordResponse => {
      if (typeof res === "string") return { success: true, message: res };
      if (res && res.message) return { success: res.success ?? true, message: res.message };
      return { success: true, message: "Password changed successfully" };
    };

    // 1. Try POST /auth/change-password
    try {
      return unwrapResponse(await apiClient.post<any>("/auth/change-password", payload));
    } catch (err: unknown) {
      if (!isEndpointMissing(err)) throw err;
    }

    // 2. Try PUT /auth/change-password
    try {
      return unwrapResponse(await apiClient.put<any>("/auth/change-password", payload));
    } catch (err: unknown) {
      if (!isEndpointMissing(err)) throw err;
    }

    // 3. Try POST /users/change-password
    try {
      return unwrapResponse(await apiClient.post<any>("/users/change-password", payload));
    } catch (err: unknown) {
      if (!isEndpointMissing(err)) throw err;
    }

    // 4. Try PUT /users/{me.id} fallback
    try {
      const me = await apiClient.get<any>("/users/me");
      if (me && me.id) {
        const res = await apiClient.put<any>(`/users/${me.id}`, {
          password: data.newPassword,
          currentPassword: data.currentPassword,
        });
        if (res) return { success: true, message: "Password changed successfully" };
      }
    } catch (err: unknown) {
      if (!isEndpointMissing(err)) throw err;
    }

    throw new Error("Password change is not available. Please contact your administrator.");
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

