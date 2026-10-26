import { apiClient } from "../common/apiClient";

export type TrustBadge = "BRONZE" | "SILVER" | "GOLD" | "PLATINUM";
export type KycStatus = "PENDING" | "VERIFIED" | "REJECTED" | "FLAGGED";
export type IncidentSeverity = "CRITICAL_P1" | "HIGH_P2" | "MEDIUM_P3" | "LOW_P4";
export type IncidentStatus = "REPORTED" | "INVESTIGATING" | "CONTAINED" | "RESOLVED" | "DISMISSED";
export type LocationConsentPurpose = "EMERGENCY_SOS" | "SECURITY_PATROL" | "GEOFENCE_GATE" | "AMENITY_PROXIMITY";

export interface VerifiedMembership {
  userId: number;
  fullName: string;
  email: string;
  phone: string;
  flatNumber: string;
  tower: string;
  residentType: "OWNER" | "TENANT" | "FAMILY";
  kycStatus: KycStatus;
  govtIdType: string;
  trustScore: number;
  trustBadge: TrustBadge;
  tenureMonths: number;
  violationCount: number;
  verifiedAt?: string;
}

export interface VisitorApproval {
  passId: number;
  passCode: string;
  visitorName: string;
  visitorPhone: string;
  vehicleNumber?: string;
  flatNumber: string;
  residentName: string;
  purpose: string;
  status: "PENDING" | "APPROVED" | "CHECKED_IN" | "CHECKED_OUT" | "REJECTED";
  residentDualConfirmed: boolean;
  expectedAt: string;
  checkedInAt?: string;
  checkedOutAt?: string;
}

export interface IncidentLifecycle {
  incidentId: number;
  incidentCode: string;
  title: string;
  category: string;
  severity: IncidentSeverity;
  status: IncidentStatus;
  location: string;
  reportedById: number;
  reportedByName: string;
  assignedToId?: number;
  assignedToName?: string;
  description: string;
  evidenceUrls: string[];
  resolutionNotes?: string;
  reportedAt: string;
  slaDeadline: string;
  slaBreached: boolean;
  resolvedAt?: string;
}

export interface LocationConsent {
  id: number;
  userId: number;
  communityId: number;
  purpose: LocationConsentPurpose;
  isGranted: boolean;
  consentVersion: string;
  grantedAt?: string;
  expiresAt?: string;
  revokedAt?: string;
}

export interface LocationAccessVerificationResponse {
  allowed: boolean;
  reason: string;
  consentGrantedAt?: string;
  auditReference: string;
}

export interface AuditableAdminAction {
  id: number;
  action: string;
  operatorId: number;
  operatorName: string;
  targetResource: string;
  justification: string;
  clientIp: string;
  correlationId: string;
  sha256Hash: string;
  timestamp: string;
}

export interface TrustSafetyOverview {
  totalVerifiedMembers: number;
  pendingKycCount: number;
  averageTrustScore: number;
  activeVisitorsInside: number;
  openIncidentsCount: number;
  criticalSlaPendingCount: number;
  locationConsentAdherencePercent: number;
  totalAuditedActions: number;
  recentMemberships: VerifiedMembership[];
  activeVisitorApprovals: VisitorApproval[];
  activeIncidents: IncidentLifecycle[];
  recentAuditTrail: AuditableAdminAction[];
}

export const trustAndSafetyService = {
  async getOverview(communityId = 1): Promise<TrustSafetyOverview> {
    try {
      const resp = await apiClient.get<TrustSafetyOverview>(`/api/safety/trust/overview?communityId=${communityId}`);
      return resp;
    } catch {
      return this.getMockOverview();
    }
  },

  async verifyMembership(userId: number, status: KycStatus, justification: string): Promise<VerifiedMembership> {
    try {
      const resp = await apiClient.post<VerifiedMembership>(`/api/safety/trust/memberships/${userId}/verify`, {
        status,
        justification,
      });
      return resp;
    } catch {
      const mock = this.getMockOverview().recentMemberships.find((m) => m.userId === userId);
      if (mock) {
        mock.kycStatus = status;
        mock.trustScore = status === "VERIFIED" ? 95 : 30;
        mock.trustBadge = status === "VERIFIED" ? "PLATINUM" : "BRONZE";
        return mock;
      }
      throw new Error("Membership not found");
    }
  },

  async setLocationConsent(purpose: LocationConsentPurpose, granted: boolean, userId = 101, communityId = 1): Promise<LocationConsent> {
    try {
      const resp = await apiClient.post<LocationConsent>("/api/safety/trust/location-consent", {
        purpose,
        granted,
        userId,
        communityId,
      });
      return resp;
    } catch {
      return {
        id: Math.floor(Math.random() * 1000),
        userId,
        communityId,
        purpose,
        isGranted: granted,
        consentVersion: "DPDP_2023_V1",
        grantedAt: granted ? new Date().toISOString() : undefined,
        revokedAt: !granted ? new Date().toISOString() : undefined,
      };
    }
  },

  async verifyLocationAccess(userId: number, purpose: LocationConsentPurpose, requesterRole = "GUARD"): Promise<LocationAccessVerificationResponse> {
    try {
      const resp = await apiClient.post<LocationAccessVerificationResponse>("/api/safety/trust/location-consent/verify-access", {
        userId,
        purpose,
        requesterRole,
      });
      return resp;
    } catch {
      return {
        allowed: purpose === "EMERGENCY_SOS",
        reason: purpose === "EMERGENCY_SOS" ? "Emergency exemption under DPDP Sec 7" : "Simulated fallback consent check",
        auditReference: "sim-audit-" + Date.now(),
      };
    }
  },

  getMockOverview(): TrustSafetyOverview {
    return {
      totalVerifiedMembers: 428,
      pendingKycCount: 12,
      averageTrustScore: 88.4,
      activeVisitorsInside: 7,
      openIncidentsCount: 2,
      criticalSlaPendingCount: 1,
      locationConsentAdherencePercent: 100.0,
      totalAuditedActions: 1480,
      recentMemberships: [
        {
          userId: 101,
          fullName: "Rajesh Sharma",
          email: "rajesh.sharma@example.com",
          phone: "+91 98765 43210",
          flatNumber: "A-402",
          tower: "Tower A",
          residentType: "OWNER",
          kycStatus: "VERIFIED",
          govtIdType: "AADHAAR",
          trustScore: 96,
          trustBadge: "PLATINUM",
          tenureMonths: 36,
          violationCount: 0,
          verifiedAt: new Date(Date.now() - 3600000 * 24 * 90).toISOString(),
        },
        {
          userId: 102,
          fullName: "Priya Sundaram",
          email: "priya.sundaram@example.com",
          phone: "+91 98111 22334",
          flatNumber: "B-1004",
          tower: "Tower B",
          residentType: "OWNER",
          kycStatus: "VERIFIED",
          govtIdType: "PASSPORT",
          trustScore: 88,
          trustBadge: "GOLD",
          tenureMonths: 18,
          violationCount: 0,
          verifiedAt: new Date(Date.now() - 3600000 * 24 * 45).toISOString(),
        },
        {
          userId: 103,
          fullName: "Karan Mehta",
          email: "karan.mehta@example.com",
          phone: "+91 97654 32109",
          flatNumber: "C-201",
          tower: "Tower C",
          residentType: "TENANT",
          kycStatus: "PENDING",
          govtIdType: "DRIVING_LICENCE",
          trustScore: 62,
          trustBadge: "SILVER",
          tenureMonths: 4,
          violationCount: 0,
        },
        {
          userId: 104,
          fullName: "Sunil Gavaskar",
          email: "sunil.g@example.com",
          phone: "+91 99000 11223",
          flatNumber: "D-505",
          tower: "Tower D",
          residentType: "TENANT",
          kycStatus: "FLAGGED",
          govtIdType: "VOTER_ID",
          trustScore: 35,
          trustBadge: "BRONZE",
          tenureMonths: 8,
          violationCount: 2,
        },
      ],
      activeVisitorApprovals: [
        {
          passId: 101,
          passCode: "VP-849201",
          visitorName: "Amit Verma",
          visitorPhone: "+91 98765 43210",
          vehicleNumber: "KA-01-MJ-4521",
          flatNumber: "A-402",
          residentName: "Rajesh Sharma",
          purpose: "Dinner & Family Visit",
          status: "CHECKED_IN",
          residentDualConfirmed: true,
          expectedAt: new Date(Date.now() - 3600000).toISOString(),
          checkedInAt: new Date(Date.now() - 1800000).toISOString(),
        },
        {
          passId: 102,
          passCode: "VP-712804",
          visitorName: "Suresh Nair (Delivery)",
          visitorPhone: "+91 98111 22334",
          vehicleNumber: "KA-05-AB-9988",
          flatNumber: "B-1004",
          residentName: "Priya Sundaram",
          purpose: "Amazon Parcel Delivery",
          status: "APPROVED",
          residentDualConfirmed: true,
          expectedAt: new Date(Date.now() + 900000).toISOString(),
        },
      ],
      activeIncidents: [
        {
          incidentId: 501,
          incidentCode: "INC-2026-0042",
          title: "Basement 2 Water Leak Near Electrical Panel",
          category: "SAFETY_HAZARD",
          severity: "CRITICAL_P1",
          status: "INVESTIGATING",
          location: "Basement 2, Pillar D-14",
          reportedById: 12,
          reportedByName: "Security Guard Raman",
          assignedToId: 4,
          assignedToName: "Facilities Eng. Vikram",
          description: "Sump pipe valve dripping rapidly 2 meters from 415V distribution board.",
          evidenceUrls: ["/static/evidence/leak_p1.jpg"],
          resolutionNotes: "Plumbing technician dispatched with isolation pump.",
          reportedAt: new Date(Date.now() - 600000).toISOString(),
          slaDeadline: new Date(Date.now() + 300000).toISOString(),
          slaBreached: false,
        },
        {
          incidentId: 502,
          incidentCode: "INC-2026-0041",
          title: "Unauthorized Overnight Parking in Visitor Bay 4",
          category: "PARKING_VIOLATION",
          severity: "LOW_P4",
          status: "REPORTED",
          location: "Visitor Bay #4, Clubhouse Front",
          reportedById: 8,
          reportedByName: "Gate Guard Anil",
          assignedToId: 15,
          assignedToName: "Parking Marshal",
          description: "Silver Hyundai KA-03-XY-1234 parked without active pass.",
          evidenceUrls: ["/static/evidence/car_park.jpg"],
          resolutionNotes: "SMS warning issued to registered owner.",
          reportedAt: new Date(Date.now() - 7200000).toISOString(),
          slaDeadline: new Date(Date.now() + 79200000).toISOString(),
          slaBreached: false,
        },
      ],
      recentAuditTrail: [
        {
          id: 1,
          action: "KYC_APPROVED",
          operatorId: 1,
          operatorName: "Super Administrator",
          targetResource: "AppUser:101 (Rajesh Sharma)",
          justification: "Aadhaar OTP & electricity bill verification successful",
          clientIp: "192.168.1.42",
          correlationId: "cid-sec-9812-a",
          sha256Hash: "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
          timestamp: new Date(Date.now() - 1200000).toISOString(),
        },
        {
          id: 2,
          action: "GATE_MANUAL_OVERRIDE",
          operatorId: 2,
          operatorName: "Gate Lead Supervisor",
          targetResource: "Gate Barrier:North-02",
          justification: "Ambulance emergency ingress (108 medical vehicle)",
          clientIp: "10.0.1.20",
          correlationId: "cid-gate-4421-b",
          sha256Hash: "b5a2c94411fb1c149afbf4c8996fb92427ae41e4649b934ca495991b7852c912",
          timestamp: new Date(Date.now() - 3600000).toISOString(),
        },
        {
          id: 3,
          action: "LOCATION_ACCESS_CONSENT_AUDIT",
          operatorId: 1,
          operatorName: "Compliance Officer",
          targetResource: "LocationConsentRegistry",
          justification: "Monthly DPDP Act 2023 compliance reconciliation",
          clientIp: "192.168.1.10",
          correlationId: "cid-dpdp-8821-c",
          sha256Hash: "4a13d28898fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852bb04",
          timestamp: new Date(Date.now() - 7200000).toISOString(),
        },
      ],
    };
  },
};