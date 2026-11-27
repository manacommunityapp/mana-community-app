import { apiClient } from "./common/apiClient";

export type SmartDeviceType = "DOOR_LOCK" | "BARRIER" | "CAMERA" | "INTERCOM" | "LIGHT" | "PUMP" | "GENERATOR";
export type SmartDeviceAction = "UNLOCK" | "LOCK" | "OPEN" | "CLOSE" | "ON" | "OFF";

export interface SmartDevice {
  id: number;
  deviceName: string;
  deviceType: SmartDeviceType;
  location: string;
  isOnline: boolean;
  accessibleBy: string;
  lastHeartbeat?: string;
  serialNumber?: string;
  communityId?: number;
}

export interface DeviceControlResult {
  result: string;
  durationMs: number;
  actorName?: string;
  timestamp: string;
}

export interface VisitorOtp {
  otp: string;
  validUntil: string;
  deviceId: number;
  visitorName: string;
}

export interface OfflineTimeBoundPin {
  otpId: number;
  deviceId: number;
  pinCode: string;
  visitorName: string;
  slotEpochStart: number;
  slotDurationBuckets: number;
  singleUse: boolean;
  validFrom: string;
  validUntil: string;
  derivationMode: string;
}

export const smartDeviceService = {
  getDevices(communityId: number, type?: SmartDeviceType): Promise<SmartDevice[]> {
    const params = type ? `?communityId=${communityId}&type=${type}` : `?communityId=${communityId}`;
    return apiClient.get<SmartDevice[]>(`/smart-devices${params}`);
  },

  control(deviceId: number, action: SmartDeviceAction): Promise<DeviceControlResult> {
    return apiClient.post<DeviceControlResult>(`/smart-devices/${deviceId}/control`, { action });
  },

  issueVisitorOtp(deviceId: number, visitorName: string, validMinutes: number): Promise<VisitorOtp> {
    return apiClient.post<VisitorOtp>(`/smart-devices/${deviceId}/visitor-otp`, {
      visitorName,
      validMinutes,
    });
  },

  async issueOfflineTimeBoundPin(
    deviceId: number,
    visitorName: string,
    validFromIso: string,
    validUntilIso: string,
    singleUse = true
  ): Promise<OfflineTimeBoundPin> {
    const res = await apiClient.post<any>(`/devices/${deviceId}/offline-pin`, {
      visitorName,
      validFrom: validFromIso,
      validUntil: validUntilIso,
      singleUse,
    });
    return res?.data ?? res;
  },

  registerDevice(data: Partial<SmartDevice> & { communityId: number }): Promise<SmartDevice> {
    return apiClient.post<SmartDevice>("/smart-devices", data);
  },
};
