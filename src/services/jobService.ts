import axios from 'axios';
import type { Job, JobApplication, CreateJobPayload, PageResponse } from '../types/jobs';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? 'http://localhost:8082/api',
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export const jobService = {
  async getJobs(params?: {
    category?: string;
    jobType?:  string;
    search?:   string;
    page?:     number;
  }): Promise<PageResponse<Job>> {
    const { data } = await api.get('/jobs', {
      params: { status: 'OPEN', size: 20, ...params },
    });
    return data;
  },

  async getJob(id: number): Promise<Job> {
    const { data } = await api.get(`/jobs/${id}`);
    return data;
  },

  async getMyPostedJobs(page = 0): Promise<PageResponse<Job>> {
    const { data } = await api.get('/jobs/mine', { params: { page, size: 20 } });
    return data;
  },

  async getMyApplications(page = 0): Promise<PageResponse<JobApplication>> {
    const { data } = await api.get('/jobs/applications/mine', { params: { page, size: 20 } });
    return data;
  },

  async createJob(payload: CreateJobPayload): Promise<Job> {
    const { data } = await api.post('/jobs', payload);
    return data;
  },

  async updateJob(id: number, payload: Partial<CreateJobPayload>): Promise<Job> {
    const { data } = await api.put(`/jobs/${id}`, payload);
    return data;
  },

  async deleteJob(id: number): Promise<void> {
    await api.delete(`/jobs/${id}`);
  },

  async closeJob(id: number): Promise<void> {
    await api.put(`/jobs/${id}/close`);
  },

  async markFilled(id: number): Promise<void> {
    await api.put(`/jobs/${id}/filled`);
  },

  async applyForJob(jobId: number, coverMessage: string): Promise<JobApplication> {
    const { data } = await api.post(`/jobs/${jobId}/apply`, { coverMessage });
    return data;
  },

  async withdrawApplication(jobId: number): Promise<void> {
    await api.delete(`/jobs/${jobId}/apply`);
  },

  async getApplications(jobId: number): Promise<JobApplication[]> {
    const { data } = await api.get(`/jobs/${jobId}/applications`);
    return data;
  },

  async acceptApplication(jobId: number, appId: number): Promise<void> {
    await api.put(`/jobs/${jobId}/applications/${appId}/accept`);
  },

  async rejectApplication(jobId: number, appId: number): Promise<void> {
    await api.put(`/jobs/${jobId}/applications/${appId}/reject`);
  },
};
