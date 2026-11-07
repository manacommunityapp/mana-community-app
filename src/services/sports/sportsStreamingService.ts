import { apiClient } from "../common/apiClient";

export type StreamPlatform = "YOUTUBE" | "TWITCH" | "CUSTOM";
export type StreamStatus = "OFFLINE" | "LIVE" | "ENDED";

export interface StreamCamera {
  id: string;
  label: string;
  url: string;
  platform: StreamPlatform;
  embedUrl: string;
}

export interface StreamChatMessage {
  id: string;
  authorName: string;
  text: string;
  ts: number;
  isCommentary?: boolean;
}

export interface MatchStream {
  matchId: number;
  status: StreamStatus;
  cameras: StreamCamera[];
  activeCameraId: string | null;
  chatMessages: StreamChatMessage[];
  viewerCount: number;
  startedAt: number | null;
  endedAt: number | null;
  title: string;
}

// Backend DTO shapes (mirrors the Spring controller responses)
interface BackendCamera {
  id: number;
  label: string;
  url: string;
  embedUrl: string;
  platform: StreamPlatform;
  active: boolean;
}

interface BackendMessage {
  id: number;
  authorName: string;
  text: string;
  commentary: boolean;
  postedAt: string;
}

interface BackendStreamResponse {
  matchId: number;
  status: StreamStatus;
  title?: string;
  startedAt?: string;
  endedAt?: string;
  cameras: BackendCamera[];
  messages: BackendMessage[];
}

function mapToMatchStream(r: BackendStreamResponse): MatchStream {
  const activeCam = r.cameras.find((c) => c.active);
  const startedMs = r.startedAt ? new Date(r.startedAt).getTime() : null;
  const viewerCount = r.status === "LIVE"
    ? Math.max(1, Math.round((startedMs ? Math.min((Date.now() - startedMs) / 2000, 40) : 1) + Math.random() * 5))
    : 0;
  return {
    matchId: r.matchId,
    status: r.status,
    title: r.title ?? `Match #${r.matchId} Live Stream`,
    cameras: r.cameras.map((c) => ({
      id: String(c.id),
      label: c.label,
      url: c.url,
      platform: c.platform,
      embedUrl: c.embedUrl,
    })),
    activeCameraId: activeCam ? String(activeCam.id) : (r.cameras[0] ? String(r.cameras[0].id) : null),
    chatMessages: r.messages.map((m) => ({
      id: String(m.id),
      authorName: m.authorName,
      text: m.text,
      ts: new Date(m.postedAt).getTime(),
      isCommentary: m.commentary,
    })),
    viewerCount,
    startedAt: startedMs,
    endedAt: r.endedAt ? new Date(r.endedAt).getTime() : null,
  };
}

export function makeDefaultStream(matchId: number): MatchStream {
  return {
    matchId,
    status: "OFFLINE",
    cameras: [],
    activeCameraId: null,
    chatMessages: [],
    viewerCount: 0,
    startedAt: null,
    endedAt: null,
    title: `Match #${matchId} Live Stream`,
  };
}

class SportsStreamingService {
  async getStream(matchId: number): Promise<MatchStream> {
    try {
      const r = await apiClient.get<BackendStreamResponse>(`/sports/matches/${matchId}/stream`);
      return mapToMatchStream(r);
    } catch {
      return makeDefaultStream(matchId);
    }
  }

  async startStream(matchId: number, title?: string): Promise<MatchStream> {
    const r = await apiClient.post<BackendStreamResponse>(
      `/sports/matches/${matchId}/stream/start`,
      title ? { title } : undefined,
    );
    return mapToMatchStream(r);
  }

  async endStream(matchId: number): Promise<MatchStream> {
    const r = await apiClient.put<BackendStreamResponse>(`/sports/matches/${matchId}/stream/end`);
    return mapToMatchStream(r);
  }

  async addCamera(matchId: number, label: string, url: string): Promise<MatchStream> {
    const r = await apiClient.post<BackendStreamResponse>(`/sports/matches/${matchId}/stream/cameras`, { label, url });
    return mapToMatchStream(r);
  }

  async removeCamera(matchId: number, cameraId: string): Promise<MatchStream> {
    const r = await apiClient.delete<BackendStreamResponse>(`/sports/matches/${matchId}/stream/cameras/${cameraId}`);
    return mapToMatchStream(r);
  }

  async switchCamera(matchId: number, cameraId: string): Promise<MatchStream> {
    const r = await apiClient.put<BackendStreamResponse>(
      `/sports/matches/${matchId}/stream/cameras/${cameraId}/active`,
    );
    return mapToMatchStream(r);
  }

  async postMessage(matchId: number, text: string, _authorName: string, isCommentary = false): Promise<MatchStream> {
    const r = await apiClient.post<BackendStreamResponse>(`/sports/matches/${matchId}/stream/chat`, {
      text,
      commentary: isCommentary,
    });
    return mapToMatchStream(r);
  }

  async refreshViewerCount(matchId: number): Promise<MatchStream> {
    return this.getStream(matchId);
  }
}

export const sportsStreamingService = new SportsStreamingService();
