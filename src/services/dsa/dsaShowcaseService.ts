import axios from 'axios';

const API_BASE = '/api/dsa';

export interface SlotResult {
  availableSlots: number[][];
  mergedBlocked: number[][];
  totalAvailableMinutes: number;
}

export interface PathResult {
  path: string[];
  totalWeight: number;
  found: boolean;
  message: string;
}

export interface GraphInfo {
  nodes: string[];
  edges: { from: string; to: string; weight: number; heavyAllowed: boolean }[];
}

export interface TopSociety {
  societyId: number;
  name: string;
  count: number;
}

export interface StreamStats {
  totalEvents: number;
  activeSocieties: number;
  windowSeconds: number;
}

export interface CacheStats {
  size: number;
  tagCount: number;
  expired: number;
  maxSize: number;
}

// Interval Merging
export const findAvailableSlots = (bookings: number[][], blackouts: number[][], dayStartMinute: number, dayEndMinute: number, minDurationMinutes: number) =>
  axios.post<SlotResult>(`${API_BASE}/intervals/available-slots`, { bookings, blackouts, dayStartMinute, dayEndMinute, minDurationMinutes }).then(r => r.data);

// Graph Routing
export const findShortestPath = (source: string, destination: string, isHeavyVehicle: boolean) =>
  axios.post<PathResult>(`${API_BASE}/graph/shortest-path`, { source, destination, isHeavyVehicle }).then(r => r.data);

export const getGraphNodes = () =>
  axios.get<GraphInfo>(`${API_BASE}/graph/nodes`).then(r => r.data);

// Stream Top-K
export const ingestEvents = (events: { societyId: number; societyName: string; visitorType: string }[]) =>
  axios.post<{ ingested: number; stats: StreamStats }>(`${API_BASE}/stream/ingest`, { events }).then(r => r.data);

export const getTopK = (k: number) =>
  axios.get<{ topK: TopSociety[]; stats: StreamStats }>(`${API_BASE}/stream/top-k`, { params: { k } }).then(r => r.data);

export const clearStream = () =>
  axios.post(`${API_BASE}/stream/clear`).then(r => r.data);

// Tagged TTL Cache
export const cachePut = (key: string, value: string, ttlMs: number, tags: string[]) =>
  axios.post(`${API_BASE}/cache/put`, { key, value, ttlMs, tags }).then(r => r.data);

export const cacheGet = (key: string) =>
  axios.get<{ key: string; found: boolean; value: string }>(`${API_BASE}/cache/get`, { params: { key } }).then(r => r.data);

export const invalidateTag = (tag: string) =>
  axios.delete<{ tag: string; keysInvalidated: number }>(`${API_BASE}/cache/invalidate-tag`, { params: { tag } }).then(r => r.data);

export const getCacheStats = () =>
  axios.get<CacheStats>(`${API_BASE}/cache/stats`).then(r => r.data);

export const clearCache = () =>
  axios.post(`${API_BASE}/cache/clear`).then(r => r.data);
