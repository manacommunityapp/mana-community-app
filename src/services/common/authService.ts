import { apiClient } from "./apiClient";
import { encryptPasswordPayload } from "../../utils/cryptoUtils";
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

interface PublicKeyResponse {
  publicKey: string;
  keyId: string;
  algorithm: string;
}

let cachedPublicKey: string | null = null;
let keyFetchPromise: Promise<string> | null = null;

export const authService = {
  /** Fetches and caches active RSA public key for client-side password encryption */
  async getPublicKey(): Promise<string> {
    if (cachedPublicKey) return cachedPublicKey;
    try {
      const stored = sessionStorage.getItem("mana_auth_pubkey");
      if (stored) {
        cachedPublicKey = stored;
        return stored;
      }
    } catch {}

    if (!keyFetchPromise) {
      keyFetchPromise = apiClient
        .get<PublicKeyResponse>("/auth/public-key")
        .then((res) => {
          if (res && res.publicKey) {
            cachedPublicKey = res.publicKey;
            try {
              sessionStorage.setItem("mana_auth_pubkey", res.publicKey);
            } catch {}
            return res.publicKey;
          }
          throw new Error("Invalid public key response from server");
        })
        .finally(() => {
          keyFetchPromise = null;
        });
    }
    return keyFetchPromise;
  },

  /** Clears cached public key to allow key rotation recovery */
  clearCachedPublicKey(): void {
    cachedPublicKey = null;
    try {
      sessionStorage.removeItem("mana_auth_pubkey");
    } catch {}
  },

  /** POST /api/auth/login with client-side RSA-OAEP encryption to protect against cleartext payloads in DevTools / HAR / proxies */
  async login(data: LoginRequest): Promise<AuthResponse> {
    // If encryptedPassword is provided already, pass directly
    if (data.encryptedPassword) {
      return apiClient.post<AuthResponse>("/auth/login", data);
    }

    if (data.password) {
      try {
        const pubKey = await this.getPublicKey();
        const encrypted = await encryptPasswordPayload(data.password, pubKey);
        // Dispatch with encryptedPassword ONLY so plaintext password is never visible in network payload
        return await apiClient.post<AuthResponse>("/auth/login", {
          identifier: data.identifier,
          encryptedPassword: encrypted,
        });
      } catch (err: any) {
        this.clearCachedPublicKey();
        console.warn("Client-side encryption fell back to standard transport:", err?.message);
        return apiClient.post<AuthResponse>("/auth/login", data);
      }
    }

    return apiClient.post<AuthResponse>("/auth/login", data);
  },

  /** POST /api/auth/register */
  async register(data: RegisterRequest): Promise<AuthResponse> {
    return apiClient.post<AuthResponse>("/auth/register", data);
  },

  /** POST /api/auth/send-signup-otp — verify email + phone are not already registered, then send OTP */
  async sendSignupOtp(email: string, phone: string): Promise<{ success: boolean; message: string }> {
    return apiClient.post<{ success: boolean; message: string }>("/auth/send-signup-otp", { email, phone });
  },

  /** POST /api/auth/verify-signup-otp — verify email + phone are not registered and OTP code is valid */
  async verifySignupOtp(email: string, phone: string, code: string): Promise<{ success: boolean; verified: boolean; message: string }> {
    return apiClient.post<{ success: boolean; verified: boolean; message: string }>("/auth/verify-signup-otp", { email, phone, code });
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

