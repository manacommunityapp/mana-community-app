import { apiClient } from "../common/apiClient";

export interface FederationTransitToken {
  transitId: string;
  federationId: number;
  targetSocietyId: number;
  opaqueFlatLabel: string;
  identifierHash: string;
  validUntil: string;
  consumedAt?: string | null;
}

export interface CityRiskAssessment {
  cityCode: string;
  riskTier: "NONE" | "HIGH_RISK";
  topCategory?: string | null;
  corroboratedSocietiesCount: number;
  actionGuidance: string;
}

export function isRiskWarningActionable(assessment: CityRiskAssessment, minSocieties = 2): boolean {
  return assessment.riskTier === "HIGH_RISK" && assessment.corroboratedSocietiesCount >= minSocieties;
}

export const federationRiskService = {
  admitOuterGate(payload: {
    federationId: number;
    targetSocietyId: number;
    opaqueFlatLabel: string;
    identifier: string;
    ttlMinutes?: number;
  }): Promise<FederationTransitToken> {
    return apiClient.post<FederationTransitToken>("/v1/federation/outer-gate/admit", payload);
  },

  listPrewarmedInnerGate(societyId: number): Promise<FederationTransitToken[]> {
    return apiClient.get<FederationTransitToken[]>(`/v1/federation/inner-gate/${societyId}/prewarmed`);
  },

  assessCityRisk(cityCode: string, identifier: string, corroborationThreshold = 2): Promise<CityRiskAssessment> {
    return apiClient.post<CityRiskAssessment>("/v1/risk-network/assess", {
      cityCode,
      identifier,
      corroborationThreshold,
    });
  },
};
