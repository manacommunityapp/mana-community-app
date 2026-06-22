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
  logType: string;
}

/** Supported log types for the System Logs & Monitoring dashboard */
export type LogType =
  | "APPLICATION"
  | "ERROR"
  | "SECURITY"
  | "AUDIT"
  | "FRONTEND"
  | "SCHEDULER"
  | "AUCTION"
  | "CHAT"
  | "NOTIFICATION";

export const systemLogService = {
  getLogs(lines = 200, level?: string, search?: string, logType: LogType = "APPLICATION"): Promise<SystemLogResponse> {
    const params = new URLSearchParams();
    params.set("lines", String(lines));
    params.set("logType", logType);
    if (level) params.set("level", level);
    if (search) params.set("search", search);
    return apiClient.get<SystemLogResponse>(`/admin/logs?${params.toString()}`);
  },
  getSystemStats(): Promise<SystemStatsResponse> {
    return apiClient.get<SystemStatsResponse>("/admin/system-stats");
  },
  getLogTypes(): Promise<string[]> {
    return apiClient.get<string[]>("/admin/log-types");
  },
};
