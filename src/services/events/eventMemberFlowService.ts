import { apiClient } from "../common/apiClient";

export interface EventMemberFlowFeatureStatus {
  key: string;
  label: string;
  available: boolean;
  status: string;
}

export interface EventMemberFlowResponse {
  residentName: string | null;
  email: string | null;
  phone: string | null;
  flatNumber: string | null;
  block: string | null;
  tower: string | null;
  residentType: string | null;
  occupancyStatus: string | null;
  flatProfileComplete: boolean;
  familyMemberCount: number;
  eventRegistrationCount: number;
  activityRegistrationCount: number;
  mealRegistrationCount: number;
  features: EventMemberFlowFeatureStatus[];
}

export const eventMemberFlowService = {
  async getSummary(): Promise<EventMemberFlowResponse> {
    return apiClient.get<EventMemberFlowResponse>("/events/member-flow");
  },
};
