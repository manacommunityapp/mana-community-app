import { apiClient } from "./apiClient";

export interface SystemStatsResponse {
  cpuLoad: number;
  totalMemoryMb: number;
  freeMemoryMb: number;
  usedMemoryMb: number;
  memoryUsagePercent: number;
  totalDiskGb: number;
  freeDiskGb: number;
  usedDiskGb: number;
  diskUsagePercent: number;
  jvmFreeMemoryMb: number;
  jvmTotalMemoryMb: number;
  jvmMaxMemoryMb: number;
  jvmUsagePercent: number;
  uptimeSeconds: number;
  activeThreads: number;
}

export interface SystemLogResponse {
  lines: string[];
  logFilePath: string;
  fileSizeKb: number;
  totalLinesReturned: number;
}

export const systemLogService = {
  getLogs(lines = 200, level?: string, search?: string): Promise<SystemLogResponse> {
    const params = new URLSearchParams();
    params.set("lines", String(lines));
    if (level) params.set("level", level);
    if (search) params.set("search", search);
    return apiClient.get<SystemLogResponse>(`/admin/logs?${params.toString()}`);
  },
  getSystemStats(): Promise<SystemStatsResponse> {
    return apiClient.get<SystemStatsResponse>("/admin/system-stats");
  },
};
