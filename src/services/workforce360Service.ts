import { apiClient } from "./common/apiClient";
import type {
  MwSkillPassport,
  MwPassportSkill,
  MwPassportCertification,
  MwPassportWorkHistory,
  MwPoolListing,
  MwPoolApplication,
  MwJobListing,
  MwJobApplication,
  MwDutyHandover,
  MwOperationalAssignment,
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

  // ── Mana Jobs — Employer ──
  async getOrgJobListings(orgId: number): Promise<MwJobListing[]> {
    return apiClient.get(`${BASE}/jobs/${orgId}/listings`);
  },
  async createJobListing(orgId: number, data: Partial<MwJobListing>): Promise<MwJobListing> {
    return apiClient.post(`${BASE}/jobs/${orgId}/listings`, data);
  },
  async pauseJobListing(orgId: number, jobId: number): Promise<void> {
    return apiClient.put(`${BASE}/jobs/${orgId}/listings/${jobId}/pause`);
  },
  async closeJobListing(orgId: number, jobId: number): Promise<void> {
    return apiClient.put(`${BASE}/jobs/${orgId}/listings/${jobId}/close`);
  },
  async getJobApplications(orgId: number, jobId: number): Promise<MwJobApplication[]> {
    return apiClient.get(`${BASE}/jobs/${orgId}/listings/${jobId}/applications`);
  },
  async respondToJobApplication(orgId: number, jobId: number, appId: number, status: string, employerNote?: string): Promise<MwJobApplication> {
    return apiClient.put(`${BASE}/jobs/${orgId}/listings/${jobId}/applications/${appId}`, { status, employerNote });
  },

  // ── Mana Jobs — Worker ──
  async getCommunityJobs(search?: string): Promise<MwJobListing[]> {
    return apiClient.get(`${BASE}/jobs${search ? `?search=${encodeURIComponent(search)}` : ''}`);
  },
  async applyToJob(jobId: number, coverNote?: string, passportId?: number): Promise<MwJobApplication> {
    return apiClient.post(`${BASE}/jobs/listings/${jobId}/apply`, { coverNote, passportId });
  },
  async getMyJobApplications(): Promise<MwJobApplication[]> {
    return apiClient.get(`${BASE}/jobs/my-applications`);
  },

  // ── Duty Handover ──
  async createHandover(orgId: number, data: Partial<MwDutyHandover> & { handoverFromEmployeeId?: number; handoverToEmployeeId?: number }): Promise<MwDutyHandover> {
    return apiClient.post(`${BASE}/handover/${orgId}/handovers`, data);
  },
  async acknowledgeHandover(orgId: number, handoverId: number): Promise<MwDutyHandover> {
    return apiClient.put(`${BASE}/handover/${orgId}/handovers/${handoverId}/acknowledge`);
  },
  async getHandovers(orgId: number, date?: string): Promise<MwDutyHandover[]> {
    return apiClient.get(`${BASE}/handover/${orgId}/handovers${date ? `?date=${date}` : ''}`);
  },
  async getPendingHandovers(orgId: number, employeeId: number): Promise<MwDutyHandover[]> {
    return apiClient.get(`${BASE}/handover/${orgId}/handovers/pending?employeeId=${employeeId}`);
  },

  // ── Operational Assignments ──
  async getOrgAssignments(orgId: number, module?: string, status?: string): Promise<MwOperationalAssignment[]> {
    const params = new URLSearchParams();
    if (module) params.set('module', module);
    if (status) params.set('status', status);
    const qs = params.toString();
    return apiClient.get(`${BASE}/operational/${orgId}/assignments${qs ? `?${qs}` : ''}`);
  },
  async startAssignment(orgId: number, assignmentId: number): Promise<MwOperationalAssignment> {
    return apiClient.put(`${BASE}/operational/${orgId}/assignments/${assignmentId}/start`);
  },
  async completeAssignment(orgId: number, assignmentId: number, performanceScore?: number, notes?: string): Promise<MwOperationalAssignment> {
    return apiClient.put(`${BASE}/operational/${orgId}/assignments/${assignmentId}/complete`, { performanceScore, notes });
  },
};
