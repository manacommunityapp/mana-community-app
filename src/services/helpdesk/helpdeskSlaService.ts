import axios from 'axios';

const API_BASE = '/api/helpdesk-sla';

export interface HelpdeskTicket {
  id?: number;
  communityId: number;
  title: string;
  description: string;
  category: string;
  priority: string;
  tower: string;
  flatNumber: string;
  reportedByUserId: number;
  status?: string;
  escalationLevel?: number;
  slaMinutes?: number;
  slaDeadline?: string;
  slaPaused?: boolean;
  slaElapsedMinutes?: number;
  isParentIncident?: boolean;
  parentIncidentId?: number | null;
  childCount?: number;
  assignedTechnicianId?: number | null;
  resolvedAt?: string | null;
  resolutionNotes?: string;
  attachmentUrls?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface EscalationRule {
  id?: number;
  communityId: number;
  category: string;
  escalationLevel: number;
  escalateAfterMinutes: number;
  escalateToRole: string;
  pauseDuringOffHours: boolean;
  offHoursStart: number;
  offHoursEnd: number;
  active?: boolean;
}

export interface Technician {
  id?: number;
  communityId: number;
  name: string;
  primarySkill: string;
  secondarySkills: string;
  currentTower: string;
  shiftStart: string;
  shiftEnd: string;
  maxConcurrentTickets: number;
  activeTicketCount?: number;
  isAvailable?: boolean;
  active?: boolean;
}

export interface TowerDistance {
  id?: number;
  communityId: number;
  towerA: string;
  towerB: string;
  walkMinutes: number;
}

export interface EscalationEvent {
  ticketId: number;
  newLevel: number;
  escalatedTo: string;
  elapsedMinutes: number;
  title: string;
}

export interface EscalationSweepResult {
  ticketsChecked: number;
  escalations: EscalationEvent[];
}

export interface ClusterResult {
  clustered: boolean;
  parentIncidentId: number | null;
  clusterSize: number;
  message: string;
}

export interface CandidateInfo {
  id: number;
  name: string;
  score: number;
  walkMinutes: number;
  workloadPct: number;
}

export interface DispatchResult {
  assigned: boolean;
  technicianId: number | null;
  technicianName: string | null;
  message: string;
  candidates: CandidateInfo[];
}

// Tickets
export const createTicket = (ticket: HelpdeskTicket) =>
  axios.post<HelpdeskTicket>(`${API_BASE}/tickets`, ticket).then(r => r.data);

export const getTickets = (communityId: number) =>
  axios.get<HelpdeskTicket[]>(`${API_BASE}/tickets`, { params: { communityId } }).then(r => r.data);

export const getTicket = (id: number) =>
  axios.get<HelpdeskTicket>(`${API_BASE}/tickets/${id}`).then(r => r.data);

export const resolveTicket = (id: number, resolutionNotes: string) =>
  axios.post<HelpdeskTicket>(`${API_BASE}/tickets/${id}/resolve`, { resolutionNotes }).then(r => r.data);

export const getChildTickets = (parentId: number) =>
  axios.get<HelpdeskTicket[]>(`${API_BASE}/tickets/${parentId}/children`).then(r => r.data);

// SLA Escalation
export const runEscalationSweep = () =>
  axios.post<EscalationSweepResult>(`${API_BASE}/escalation/sweep`).then(r => r.data);

export const runPauseCheck = () =>
  axios.post<{ status: string }>(`${API_BASE}/escalation/pause-check`).then(r => r.data);

// Duplicate Clustering
export const detectDuplicates = (ticket: HelpdeskTicket) =>
  axios.post<ClusterResult>(`${API_BASE}/clustering/detect`, ticket).then(r => r.data);

// Technician Dispatch
export const assignTechnician = (ticketId: number) =>
  axios.post<DispatchResult>(`${API_BASE}/tickets/${ticketId}/assign`).then(r => r.data);

export const emergencyOverride = (ticketId: number, technicianId: number) =>
  axios.post<DispatchResult>(`${API_BASE}/tickets/${ticketId}/emergency-override/${technicianId}`).then(r => r.data);

export const getTechnicians = (communityId: number) =>
  axios.get<Technician[]>(`${API_BASE}/technicians`, { params: { communityId } }).then(r => r.data);

// Configuration
export const createEscalationRule = (rule: EscalationRule) =>
  axios.post<EscalationRule>(`${API_BASE}/escalation-rules`, rule).then(r => r.data);

export const getEscalationRules = (communityId: number, category: string) =>
  axios.get<EscalationRule[]>(`${API_BASE}/escalation-rules`, { params: { communityId, category } }).then(r => r.data);

export const createTechnician = (technician: Technician) =>
  axios.post<Technician>(`${API_BASE}/technicians`, technician).then(r => r.data);

export const createTowerDistance = (distance: TowerDistance) =>
  axios.post<TowerDistance>(`${API_BASE}/tower-distances`, distance).then(r => r.data);
