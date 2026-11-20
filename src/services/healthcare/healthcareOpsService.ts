import { apiClient } from '@/services/common/apiClient';

export type NoShowStatus = 'PENDING' | 'CONFIRMED_NO_SHOW' | 'EXCUSED' | 'DISPUTED';
export type CredentialType = 'MEDICAL_LICENSE' | 'DEGREE' | 'SPECIALIZATION' | 'DEA' | 'BOARD_CERTIFICATION' | 'INSURANCE' | 'OTHER';
export type CredentialStatus = 'VALID' | 'EXPIRING_SOON' | 'EXPIRED' | 'REVOKED';
export type DiagnosticsStatus = 'ORDERED' | 'SAMPLE_COLLECTED' | 'IN_PROGRESS' | 'RESULTS_READY' | 'DELIVERED' | 'DELAYED';
export type ReferralStatus = 'ISSUED' | 'ACCEPTED' | 'COMPLETED' | 'EXPIRED';
export type FollowupStatus = 'SCHEDULED' | 'COMPLETED' | 'MISSED' | 'CANCELLED';

export interface AppointmentNoShow {
  id: number;
  appointmentId: number;
  doctorId: number;
  patientUserId: number;
  status: NoShowStatus;
  noShowFee: number;
  feeWaived: boolean;
  patientReason?: string;
  createdAt: string;
}

export interface DoctorSlotUtilization {
  id: number;
  doctorId: number;
  slotDate: string;
  totalSlots: number;
  bookedSlots: number;
  attendedSlots: number;
  noShowSlots: number;
  cancelledSlots: number;
  avgWaitMinutes?: number;
}

export interface UtilizationSummary {
  totalSlots: number;
  bookedSlots: number;
  attendedSlots: number;
  noShowSlots: number;
  cancelledSlots: number;
  utilizationPct: number;
  byWeek: DoctorSlotUtilization[];
}

export interface ProviderCredential {
  id: number;
  doctorId: number;
  credentialType: CredentialType;
  credentialNumber?: string;
  issuingBody?: string;
  issuedDate?: string;
  expiryDate: string;
  status: CredentialStatus;
}

export interface PrescriptionFollowup {
  id: number;
  prescriptionId: number;
  patientUserId: number;
  doctorId: number;
  followupDate: string;
  followupNotes?: string;
  status: FollowupStatus;
}

export interface DiagnosticsOrder {
  id: number;
  patientUserId: number;
  doctorId?: number;
  partnerName: string;
  testNames: string;
  orderedAt: string;
  slaHours: number;
  expectedAt: string;
  status: DiagnosticsStatus;
  resultsUrl?: string;
  slaBreached: boolean;
  completedAt?: string;
}

export interface DoctorReferral {
  id: number;
  referringDoctorId: number;
  referredDoctorId?: number;
  patientUserId: number;
  specialty: string;
  reason: string;
  status: ReferralStatus;
  referredAt: string;
  acceptedAt?: string;
  completedAt?: string;
  expiresAt: string;
}

export interface CaregiverConsent {
  id: number;
  patientUserId: number;
  caregiverUserId: number;
  relationship: string;
  canViewRecords: boolean;
  canBookAppointments: boolean;
  canReceiveReports: boolean;
  grantedAt: string;
  expiresAt?: string;
  isActive: boolean;
}

export const healthcareOpsService = {
  // No-shows
  getNoShows: (params: { doctorId?: number; from?: string; to?: string }) => {
    const p = new URLSearchParams();
    if (params.doctorId) p.set('doctorId', String(params.doctorId));
    if (params.from) p.set('from', params.from);
    if (params.to) p.set('to', params.to);
    return apiClient.get<AppointmentNoShow[]>(`/healthcare/no-shows?${p}`);
  },
  confirmNoShow: (id: number, fee: number) =>
    apiClient.put<AppointmentNoShow>(`/healthcare/no-shows/${id}/confirm`, { fee }),
  excuseNoShow: (id: number, reason: string) =>
    apiClient.put<AppointmentNoShow>(`/healthcare/no-shows/${id}/excuse`, { reason }),

  // Utilization
  getUtilization: (doctorId: number, from: string, to: string) => {
    const p = new URLSearchParams({ doctorId: String(doctorId), from, to });
    return apiClient.get<DoctorSlotUtilization[]>(`/healthcare/utilization?${p}`);
  },
  getUtilizationSummary: (communityId: number, from: string, to: string) => {
    const p = new URLSearchParams({ communityId: String(communityId), from, to });
    return apiClient.get<UtilizationSummary>(`/healthcare/utilization/summary?${p}`);
  },

  // Credentials
  getCredentials: (doctorId: number) =>
    apiClient.get<ProviderCredential[]>(`/healthcare/credentials?doctorId=${doctorId}`),
  getExpiringCredentials: (communityId: number, days = 30) =>
    apiClient.get<ProviderCredential[]>(`/healthcare/credentials/expiring?communityId=${communityId}&days=${days}`),
  addCredential: (data: Partial<ProviderCredential>) =>
    apiClient.post<ProviderCredential>('/healthcare/credentials', data),
  updateCredential: (id: number, data: Partial<ProviderCredential>) =>
    apiClient.put<ProviderCredential>(`/healthcare/credentials/${id}`, data),

  // Follow-ups
  getFollowups: (communityId: number, date: string) => {
    const p = new URLSearchParams({ communityId: String(communityId), date });
    return apiClient.get<PrescriptionFollowup[]>(`/healthcare/followups?${p}`);
  },
  scheduleFollowup: (data: Partial<PrescriptionFollowup>) =>
    apiClient.post<PrescriptionFollowup>('/healthcare/followups', data),
  completeFollowup: (id: number, notes: string) =>
    apiClient.put<PrescriptionFollowup>(`/healthcare/followups/${id}/complete`, { notes }),

  // Diagnostics
  getDiagnosticsForPatient: (patientId: number) =>
    apiClient.get<DiagnosticsOrder[]>(`/healthcare/diagnostics/patient/${patientId}`),
  getBreachedDiagnostics: (communityId: number) =>
    apiClient.get<DiagnosticsOrder[]>(`/healthcare/diagnostics/breached?communityId=${communityId}`),
  createDiagnosticsOrder: (data: Partial<DiagnosticsOrder>) =>
    apiClient.post<DiagnosticsOrder>('/healthcare/diagnostics', data),
  updateDiagnosticsStatus: (id: number, status: DiagnosticsStatus, resultsUrl?: string) =>
    apiClient.put<DiagnosticsOrder>(`/healthcare/diagnostics/${id}/status`, { status, resultsUrl }),

  // Referrals
  getReferralsForPatient: (patientId: number) =>
    apiClient.get<DoctorReferral[]>(`/healthcare/referrals/patient/${patientId}`),
  issueReferral: (data: Partial<DoctorReferral>) =>
    apiClient.post<DoctorReferral>('/healthcare/referrals', data),
  acceptReferral: (id: number) =>
    apiClient.put<DoctorReferral>(`/healthcare/referrals/${id}/accept`, {}),
  completeReferral: (id: number) =>
    apiClient.put<DoctorReferral>(`/healthcare/referrals/${id}/complete`, {}),

  // Caregiver consent
  getCaregiverConsents: (patientId: number) =>
    apiClient.get<CaregiverConsent[]>(`/healthcare/caregiver-consent?patientId=${patientId}`),
  grantConsent: (data: Partial<CaregiverConsent>) =>
    apiClient.post<CaregiverConsent>('/healthcare/caregiver-consent', data),
  revokeConsent: (id: number) =>
    apiClient.delete<void>(`/healthcare/caregiver-consent/${id}`),
};
