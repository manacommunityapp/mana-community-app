import { apiClient } from "./common/apiClient";

export interface IoTSensor {
  id: number;
  sensorName: string;
  sensorType: string;
  location: string;
  unit?: string;
  isActive: boolean;
  lastReading?: number;
  lastReadingAt?: string;
}

export interface SensorAnomaly {
  id: number;
  sensorId: number;
  sensorName?: string;
  eventType: string;
  severity: string;
  description?: string;
  detectedValue?: number;
  detectedAt: string;
}

export interface DailyAggregate {
  date: string;
  min: number;
  max: number;
  avg: number;
  sum: number;
}

export const iotService = {
  async getSensors(communityId: number, type?: string): Promise<IoTSensor[]> {
    const params = new URLSearchParams({ communityId: String(communityId) });
    if (type) params.set("type", type);
    return apiClient.get<IoTSensor[]>(`/api/iot/sensors?${params}`);
  },

  async pollSensor(sensorId: number): Promise<number> {
    const res = await apiClient.post<{ value: number }>(`/api/iot/sensors/${sensorId}/poll`, {});
    return res.value;
  },

  async getTrend(
    sensorId: number,
    hours: number
  ): Promise<{ readingValue: number; readingAt: string }[]> {
    return apiClient.get<{ readingValue: number; readingAt: string }[]>(
      `/api/iot/sensors/${sensorId}/trend?hours=${hours}`
    );
  },

  async getAggregates(sensorId: number, days: number): Promise<DailyAggregate[]> {
    return apiClient.get<DailyAggregate[]>(
      `/api/iot/sensors/${sensorId}/aggregates?days=${days}`
    );
  },

  async getActiveAnomalies(communityId: number): Promise<SensorAnomaly[]> {
    return apiClient.get<SensorAnomaly[]>(
      `/api/iot/anomalies?communityId=${communityId}&resolved=false`
    );
  },

  async resolveAnomaly(anomalyId: number): Promise<void> {
    await apiClient.post(`/api/iot/anomalies/${anomalyId}/resolve`, {});
  },
};
