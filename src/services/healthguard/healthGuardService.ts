import { apiClient } from '../apiClient';
import type {
  HealthProfileDto,
  EmergencyContactDto,
  EmergencyIncidentDto,
  TriggerSosRequest,
} from '../../types/healthguard';

const BASE = '/api/healthguard';

export const healthGuardService = {
  getProfile: () => apiClient.get<HealthProfileDto>(`${BASE}/profile`),
  saveProfile: (dto: HealthProfileDto) => apiClient.put<HealthProfileDto>(`${BASE}/profile`, dto),

  getContacts: () => apiClient.get<EmergencyContactDto[]>(`${BASE}/contacts`),
  addContact: (dto: EmergencyContactDto) => apiClient.post<EmergencyContactDto>(`${BASE}/contacts`, dto),
  updateContact: (id: number, dto: EmergencyContactDto) => apiClient.put<EmergencyContactDto>(`${BASE}/contacts/${id}`, dto),
  deleteContact: (id: number) => apiClient.delete<void>(`${BASE}/contacts/${id}`),

  triggerSos: (req: TriggerSosRequest) => apiClient.post<EmergencyIncidentDto>(`${BASE}/sos`, req),
  getActiveIncident: () => apiClient.get<EmergencyIncidentDto | null>(`${BASE}/incidents/active`),
  getIncidentHistory: () => apiClient.get<EmergencyIncidentDto[]>(`${BASE}/incidents`),
  resolveIncident: (id: number, notes?: string) => apiClient.put<EmergencyIncidentDto>(`${BASE}/incidents/${id}/resolve`, { notes }),
  cancelIncident: (id: number) => apiClient.put<EmergencyIncidentDto>(`${BASE}/incidents/${id}/cancel`, {}),
  escalateIncident: (id: number) => apiClient.put<EmergencyIncidentDto>(`${BASE}/incidents/${id}/escalate`, {}),
  acknowledgeIncident: (id: number) => apiClient.put<EmergencyIncidentDto>(`${BASE}/incidents/${id}/acknowledge`, {}),
};
