import { apiClient } from "./apiClient";

export interface OtpResponse {
  success: boolean;
  verified: boolean;
  message: string;
}

/**
 * Public email-OTP endpoints used by the secure registration flow.
 * Both calls are unauthenticated (permitted in the backend SecurityConfig).
 */
export const otpService = {
  /** POST /api/otp/send — email a one-time verification code. */
  async send(email: string, name?: string): Promise<OtpResponse> {
    return apiClient.post<OtpResponse>("/otp/send", { email, name });
  },

  /** POST /api/otp/verify — validate a submitted code. */
  async verify(email: string, code: string): Promise<OtpResponse> {
    return apiClient.post<OtpResponse>("/otp/verify", { email, code });
  },
};
