import { apiClient } from "./apiClient";

export interface JobResponse {
  id: number;
  title: string;
  company: string;
  description: string;
  location: string;
  jobType: string;
  salary: string;
  referral: boolean;
  contactEmail: string;
  status: string;
  postedById: number;
  postedByName: string;
  communityId: number;
  applicationCount: number;
  hasApplied: boolean;
  createdAt: string;
}

export interface JobRequest {
  title: string;
  company?: string;
  description?: string;
  location?: string;
  jobType?: string;
  salary?: string;
  referral?: boolean;
  contactEmail?: string;
}

export interface ApplicationRequest {
  coverNote?: string;
  resumeUrl?: string;
}

export const jobService = {
  async getActiveJobs(query?: string): Promise<JobResponse[]> {
    const qs = query ? `?q=${encodeURIComponent(query)}` : "";
    return apiClient.get<JobResponse[]>(`/jobs${qs}`);
  },

  async getAllJobs(): Promise<JobResponse[]> {
    return apiClient.get<JobResponse[]>("/jobs/all");
  },

  async getMyJobs(): Promise<JobResponse[]> {
    return apiClient.get<JobResponse[]>("/jobs/mine");
  },

  async getById(id: number): Promise<JobResponse> {
    return apiClient.get<JobResponse>(`/jobs/${id}`);
  },

  async create(data: JobRequest): Promise<JobResponse> {
    return apiClient.post<JobResponse>("/jobs", data);
  },

  async update(id: number, data: JobRequest): Promise<JobResponse> {
    return apiClient.put<JobResponse>(`/jobs/${id}`, data);
  },

  async closeJob(id: number): Promise<JobResponse> {
    return apiClient.put<JobResponse>(`/jobs/${id}/close`, {});
  },

  async apply(id: number, data?: ApplicationRequest): Promise<JobResponse> {
    return apiClient.post<JobResponse>(`/jobs/${id}/apply`, data || {});
  },
};
