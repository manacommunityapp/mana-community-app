import { apiClient } from "../common/apiClient";

export type CameraStatus = "ONLINE" | "OFFLINE" | "MAINTENANCE";

export interface Camera {
  id: number;
  name: string;
  location: string;
  streamUrl?: string;
  snapshotUrl?: string;
  status: CameraStatus;
  isNightMode?: boolean;
  communityId?: number;
  createdAt?: string;
}

export interface SnapshotResult {
  cameraId: number;
  cameraName: string;
  snapshotUrl?: string;
  capturedAt: string;
}

export const cctvService = {
  async getCameras(): Promise<Camera[]> {
    return apiClient.get<Camera[]>("/security/cameras");
  },

  async captureSnapshot(cameraId: number): Promise<SnapshotResult> {
    return apiClient.post<SnapshotResult>(`/security/cameras/${cameraId}/snapshot`, {});
  },
};
