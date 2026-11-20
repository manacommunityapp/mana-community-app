import { apiClient } from '@/services/common/apiClient';

// Runtime constants for bundler/Babel compatibility when imported as values
export const AppointmentNoShow = {};
export const ProviderCredential = {};
export const PrescriptionFollowup = {};
export const Referral = {};
export const DiagnosticsSla = {};
export const CaregiverConsent = {};
export const DoctorSlotUtilization = {};

export interface AppointmentNoShow {
  id: number;
  communityId: number;
  appointmentId: number;
  doctorId: number;
  patientUserId: number;
  noShowAt: string;
  feeCharged?: number;
  feeWaived: boolean;
  waiverReason?: string;
  reviewedBy?: number;
  notes?: string;
  createdAt: string;
}

export interface ProviderCredential {
  id: number;
  communityId: number;
  providerId: number;
  credentialType: string;
  credentialNumber?: string;
  issuedBy?: string;
  issuedDate?: string;
  expiryDate: string;
  documentUrl?: string;
  verified: boolean;
  alertSent30: boolean;
  alertSent7: boolean;
}

export interface PrescriptionFollowup {
  id: number;
  communityId: number;
  appointmentId: number;
  patientUserId: number;
  doctorId: number;
  medicationName: string;
  dosage?: string;
  durationDays?: number;
  followupDueDate: string;
  followupNote?: string;
  reminderSent: boolean;
  completed: boolean;
  completedAt?: string;
}

export interface Referral {
  id: number;
  communityId: number;
  referringDoctorId: number;
  patientUserId: number;
  referredToName: string;
  referredToType: string;
  specialization?: string;
  reason: string;
  urgency: string;
  referralDate: string;
  appointmentBooked: boolean;
  appointmentDate?: string;
  outcomeNotes?: string;
  feedbackToReferrer?: string;
  status: string;
  createdAt: string;
}

export interface DiagnosticsSla {
  id: number;
  communityId: number;
  partnerId: number;
  partnerName: string;
  testCategory: string;
  slaHours: number;
  reportDueAt: string;
  reportDeliveredAt?: string;
  orderId: number;
  patientUserId: number;
  breach: boolean;
  breachNotified: boolean;
  escalated: boolean;
  notes?: string;
}

export interface CaregiverConsent {
  id: number;
  communityId: number;
  patientUserId: number;
  caregiverUserId: number;
  caregiverName: string;
  relationship: string;
  consentScope: string;
  validFrom: string;
  validUntil?: string;
  revoked: boolean;
  revokedAt?: string;
}

export interface DoctorSlotUtilization {
  id: number;
  communityId: number;
  doctorId: number;
  slotDate: string;
  totalSlots: number;
  bookedSlots: number;
  attendedSlots: number;
  noShowSlots: number;
  cancelledSlots: number;
  calculatedAt: string;
}

const healthcareService = {
  // No-shows
  getNoShows: (): Promise<AppointmentNoShow[]> =>
    apiClient.get('/api/healthcare/no-shows'),
  waiveNoShowFee: (id: number, reason: string): Promise<AppointmentNoShow> =>
    apiClient.put(`/api/healthcare/no-shows/${id}/waive`, { reason }),

  // Credentials
  getCredentials: (): Promise<ProviderCredential[]> =>
    apiClient.get('/api/healthcare/credentials'),
  addCredential: (cred: Partial<ProviderCredential>): Promise<ProviderCredential> =>
    apiClient.post('/api/healthcare/credentials', cred),
  verifyCredential: (id: number): Promise<ProviderCredential> =>
    apiClient.put(`/api/healthcare/credentials/${id}/verify`, {}),

  // Follow-ups
  getPendingFollowups: (): Promise<PrescriptionFollowup[]> =>
    apiClient.get('/api/healthcare/followups/pending'),
  completeFollowup: (id: number): Promise<PrescriptionFollowup> =>
    apiClient.put(`/api/healthcare/followups/${id}/complete`, {}),

  // Referrals
  getReferrals: (): Promise<Referral[]> =>
    apiClient.get('/api/healthcare/referrals'),
  getPendingReferrals: (): Promise<Referral[]> =>
    apiClient.get('/api/healthcare/referrals/pending'),
  updateReferralOutcome: (id: number, outcomeNotes: string, feedbackToReferrer: string, status: string): Promise<Referral> =>
    apiClient.put(`/api/healthcare/referrals/${id}/outcome`, { outcomeNotes, feedbackToReferrer, status }),

  // Diagnostics SLA
  getDiagnosticsSla: (): Promise<DiagnosticsSla[]> =>
    apiClient.get('/api/healthcare/diagnostics-sla'),
  getDiagnosticsBreaches: (): Promise<DiagnosticsSla[]> =>
    apiClient.get('/api/healthcare/diagnostics-sla/breaches'),
  markSlaDelivered: (id: number): Promise<DiagnosticsSla> =>
    apiClient.put(`/api/healthcare/diagnostics-sla/${id}/delivered`, {}),
  escalateSla: (id: number, notes: string): Promise<DiagnosticsSla> =>
    apiClient.put(`/api/healthcare/diagnostics-sla/${id}/escalate`, { notes }),

  // Caregiver consents
  getConsentsForPatient: (patientUserId: number): Promise<CaregiverConsent[]> =>
    apiClient.get(`/api/healthcare/caregiver-consents/patient/${patientUserId}`),
  revokeConsent: (id: number): Promise<CaregiverConsent> =>
    apiClient.put(`/api/healthcare/caregiver-consents/${id}/revoke`, {}),

  // Doctor utilization
  getDoctorUtilization: (doctorId: number, from: string, to: string): Promise<DoctorSlotUtilization[]> =>
    apiClient.get(`/api/healthcare/utilization/doctor/${doctorId}?from=${from}&to=${to}`),
};

export { healthcareService };
export default healthcareService;
