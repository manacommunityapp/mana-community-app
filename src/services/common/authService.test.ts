import { describe, it, expect, vi, beforeEach } from "vitest";
import { authService } from "./authService";
import { apiClient } from "./apiClient";

vi.mock("./apiClient", () => ({
  apiClient: {
    post: vi.fn(),
  },
}));

describe("authService - forgot password & reset password", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("sendPasswordResetOtp calls /auth/forgot-password with the provided email", async () => {
    const mockResponse = { success: true, message: "Verification code sent" };
    (apiClient.post as any).mockResolvedValueOnce(mockResponse);

    const result = await authService.sendPasswordResetOtp("user@example.com");

    expect(apiClient.post).toHaveBeenCalledWith("/auth/forgot-password", {
      email: "user@example.com",
    });
    expect(result).toEqual(mockResponse);
  });

  it("resetPassword calls /auth/reset-password with email, otpCode, and newPassword", async () => {
    const mockResponse = { success: true, message: "Password updated successfully" };
    (apiClient.post as any).mockResolvedValueOnce(mockResponse);

    const reqData = {
      email: "user@example.com",
      otpCode: "123456",
      newPassword: "Pass123",
    };

    const result = await authService.resetPassword(reqData);

    expect(apiClient.post).toHaveBeenCalledWith("/auth/reset-password", reqData);
    expect(result).toEqual(mockResponse);
  });

  it("changePassword calls /auth/change-password with currentPassword and newPassword", async () => {
    const mockResponse = { success: true, message: "Password updated successfully" };
    (apiClient.post as any).mockResolvedValueOnce(mockResponse);

    const reqData = {
      currentPassword: "OldPass123",
      newPassword: "NewPass456",
      confirmPassword: "NewPass456",
    };

    const result = await authService.changePassword(reqData);

    expect(apiClient.post).toHaveBeenCalledWith("/auth/change-password", {
      currentPassword: "OldPass123",
      oldPassword: "OldPass123",
      newPassword: "NewPass456",
      confirmPassword: "NewPass456",
    });
    expect(result).toEqual(mockResponse);
  });
});
