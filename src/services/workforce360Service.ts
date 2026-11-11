import { apiClient } from "./common/apiClient";
import type {
  MwSkillPassport,
  MwPassportSkill,
  MwPassportCertification,
  MwPassportWorkHistory,
  MwPoolListing,
  MwPoolApplication,
} from "../types/hrm";

const BASE = "/api/v1/mw";

export const workforce360Service = {
  // ── Passport ──
  async getMyPassport(): Promise<MwSkillPassport> {
    return apiClient.get(`${BASE}/passport/me`);
  },
  async updatePassport(data: Partial<Pick<MwSkillPassport, 'bio' | 'location' | 'preferredRoles' | 'availability' | 'isPublic'>>): Promise<MwSkillPassport> {
    return apiClient.put(`${BASE}/passport/me`, data);
  },
  async getPublicPassport(userId: number): Promise<MwSkillPassport> {
    return apiClient.get(`${BASE}/passport/${userId}`);
  },

  // ── Skills ──
  async addSkill(data: { skillName: string; category?: string; proficiency?: string; yearsExp?: number }): Promise<MwPassportSkill> {
    return apiClient.post(`${BASE}/passport/skills`, data);
  },
  async removeSkill(skillId: number): Promise<void> {
    return apiClient.delete(`${BASE}/passport/skills/${skillId}`);
  },

  // ── Certifications ──
  async addCertification(data: { name: string; issuingBody?: string; issueDate?: string; expiryDate?: string; credentialUrl?: string }): Promise<MwPassportCertification> {
    return apiClient.post(`${BASE}/passport/certifications`, data);
  },
  async removeCertification(certId: number): Promise<void> {
    return apiClient.delete(`${BASE}/passport/certifications/${certId}`);
  },

  // ── Work History ──
  async addWorkHistory(data: { employerName: string; role?: string; startDate?: string; endDate?: string; isCurrent?: boolean }): Promise<MwPassportWorkHistory> {
    return apiClient.post(`${BASE}/passport/work-history`, data);
  },
  async removeWorkHistory(whId: number): Promise<void> {
    return apiClient.delete(`${BASE}/passport/work-history/${whId}`);
  },

  // ── Workforce Pool — Employer ──
  async getPoolListings(orgId: number): Promise<MwPoolListing[]> {
    return apiClient.get(`${BASE}/pool/${orgId}/listings`);
  },
  async createPoolListing(orgId: number, data: Partial<MwPoolListing>): Promise<MwPoolListing> {
    return apiClient.post(`${BASE}/pool/${orgId}/listings`, data);
  },
  async closePoolListing(orgId: number, listingId: number): Promise<void> {
    return apiClient.put(`${BASE}/pool/${orgId}/listings/${listingId}/close`);
  },
  async getListingApplications(orgId: number, listingId: number): Promise<MwPoolApplication[]> {
    return apiClient.get(`${BASE}/pool/${orgId}/listings/${listingId}/applications`);
  },
  async respondToPoolApplication(orgId: number, listingId: number, appId: number, action: 'accept' | 'reject', employerNote?: string): Promise<MwPoolApplication> {
    return apiClient.put(`${BASE}/pool/${orgId}/listings/${listingId}/applications/${appId}`, { action, employerNote });
  },

  // ── Workforce Pool — Worker ──
  async getOpenPoolListings(): Promise<MwPoolListing[]> {
    return apiClient.get(`${BASE}/pool/open`);
  },
  async applyToPoolListing(listingId: number, workerNote?: string): Promise<MwPoolApplication> {
    return apiClient.post(`${BASE}/pool/listings/${listingId}/apply`, { workerNote });
  },
  async withdrawPoolApplication(listingId: number): Promise<void> {
    return apiClient.delete(`${BASE}/pool/listings/${listingId}/apply`);
  },
  async getMyPoolApplications(): Promise<MwPoolApplication[]> {
    return apiClient.get(`${BASE}/pool/my-applications`);
  },
  async consentToContract(appId: number): Promise<void> {
    return apiClient.put(`${BASE}/pool/my-applications/${appId}/consent`);
  },
};
