import { apiClient } from "./common/apiClient";

export type KycStatus = "PENDING" | "OTP_SENT" | "VERIFIED" | "REJECTED" | "EXPIRED";

export interface KycRequest {
  id: number;
  verificationMethod: "AADHAAR_OTP" | "DOCUMENT_UPLOAD";
  idType?: string;
  status: KycStatus;
  verifiedAt?: string;
  expiresAt?: string;
  rejectionReason?: string;
  submittedAt?: string;
}

export const kycService = {
  getMyStatus(): Promise<KycRequest | null> {
    return apiClient.get<KycRequest | null>("/kyc/my-status");
  },

  initiateAadhaarOtp(aadhaarHash: string): Promise<KycRequest> {
    return apiClient.post<KycRequest>("/kyc/aadhaar/initiate", { aadhaarHash });
  },

  verifyOtp(requestId: number, otp: string): Promise<KycRequest> {
    return apiClient.post<KycRequest>(`/kyc/${requestId}/verify-otp`, { otp });
  },

  uploadDocument(formData: FormData): Promise<KycRequest> {
    return apiClient.post<KycRequest>("/kyc/document/upload", formData);
  },

  getPendingReviews(communityId: number): Promise<KycRequest[]> {
    return apiClient.get<KycRequest[]>(`/kyc/pending?communityId=${communityId}`);
  },

  approve(requestId: number): Promise<void> {
    return apiClient.post<void>(`/kyc/${requestId}/approve`, {});
  },

  reject(requestId: number, reason: string): Promise<void> {
    return apiClient.post<void>(`/kyc/${requestId}/reject`, { reason });
  },
};
