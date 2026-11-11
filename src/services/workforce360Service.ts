import { apiClient } from "./common/apiClient";
import type {
  MwSkillPassport,
  MwPassportSkill,
  MwPassportCertification,
  MwPassportWorkHistory,
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
};
