const STORAGE_KEY = "mana_sports_streams_v1";

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

function load(): Record<string, MatchStream> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function save(data: Record<string, MatchStream>) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch { /* storage full or blocked */ }
}

function detectPlatform(url: string): { platform: StreamPlatform; embedUrl: string } {
  const u = url.trim();

  // YouTube
  const ytWatch = u.match(/youtube\.com\/watch\?v=([A-Za-z0-9_-]{11})/);
  const ytShort = u.match(/youtu\.be\/([A-Za-z0-9_-]{11})/);
  const ytLive = u.match(/youtube\.com\/live\/([A-Za-z0-9_-]{11})/);
  const ytEmbed = u.match(/youtube\.com\/embed\/([A-Za-z0-9_-]{11})/);
  const videoId = (ytWatch?.[1] || ytShort?.[1] || ytLive?.[1] || ytEmbed?.[1]) ?? null;
  if (videoId) {
    return {
      platform: "YOUTUBE",
      embedUrl: `https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0&modestbranding=1`,
    };
  }

  // Twitch
  const twitch = u.match(/twitch\.tv\/([A-Za-z0-9_]{4,25})/);
  if (twitch) {
    const channel = twitch[1];
    return {
      platform: "TWITCH",
      embedUrl: `https://player.twitch.tv/?channel=${channel}&parent=${window.location.hostname}`,
    };
  }

  // Custom / direct embed URL
  return { platform: "CUSTOM", embedUrl: u };
}

function genId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
}

function simulateViewerCount(stream: MatchStream): number {
  if (stream.status !== "LIVE") return 0;
  const elapsed = stream.startedAt ? (Date.now() - stream.startedAt) / 1000 : 0;
  const base = Math.min(elapsed / 30, 1) * (40 + Math.sin(elapsed / 60) * 10);
  return Math.max(1, Math.round(base + Math.random() * 5));
}

class SportsStreamingService {
  getStream(matchId: number): MatchStream {
    const data = load();
    return (
      data[String(matchId)] ?? {
        matchId,
        status: "OFFLINE",
        cameras: [],
        activeCameraId: null,
        chatMessages: [],
        viewerCount: 0,
        startedAt: null,
        endedAt: null,
        title: `Match #${matchId} Live Stream`,
      }
    );
  }

  startStream(matchId: number, title?: string): MatchStream {
    const data = load();
    const existing = this.getStream(matchId);
    const updated: MatchStream = {
      ...existing,
      status: "LIVE",
      startedAt: Date.now(),
      endedAt: null,
      title: title || existing.title,
    };
    data[String(matchId)] = updated;
    save(data);
    return updated;
  }

  endStream(matchId: number): MatchStream {
    const data = load();
    const existing = this.getStream(matchId);
    const updated: MatchStream = { ...existing, status: "ENDED", endedAt: Date.now() };
    data[String(matchId)] = updated;
    save(data);
    return updated;
  }

  addCamera(matchId: number, label: string, url: string): MatchStream {
    const data = load();
    const existing = this.getStream(matchId);
    const { platform, embedUrl } = detectPlatform(url);
    const cam: StreamCamera = { id: genId(), label, url, platform, embedUrl };
    const cameras = [...existing.cameras, cam];
    const updated: MatchStream = {
      ...existing,
      cameras,
      activeCameraId: existing.activeCameraId ?? cam.id,
    };
    data[String(matchId)] = updated;
    save(data);
    return updated;
  }

  removeCamera(matchId: number, cameraId: string): MatchStream {
    const data = load();
    const existing = this.getStream(matchId);
    const cameras = existing.cameras.filter((c) => c.id !== cameraId);
    const activeCameraId =
      existing.activeCameraId === cameraId ? (cameras[0]?.id ?? null) : existing.activeCameraId;
    const updated: MatchStream = { ...existing, cameras, activeCameraId };
    data[String(matchId)] = updated;
    save(data);
    return updated;
  }

  switchCamera(matchId: number, cameraId: string): MatchStream {
    const data = load();
    const existing = this.getStream(matchId);
    const updated: MatchStream = { ...existing, activeCameraId: cameraId };
    data[String(matchId)] = updated;
    save(data);
    return updated;
  }

  postMessage(matchId: number, text: string, authorName: string, isCommentary = false): MatchStream {
    const data = load();
    const existing = this.getStream(matchId);
    const msg: StreamChatMessage = {
      id: genId(),
      authorName,
      text: text.trim(),
      ts: Date.now(),
      isCommentary,
    };
    const chatMessages = [...existing.chatMessages.slice(-199), msg];
    const updated: MatchStream = { ...existing, chatMessages };
    data[String(matchId)] = updated;
    save(data);
    return updated;
  }

  refreshViewerCount(matchId: number): MatchStream {
    const data = load();
    const existing = this.getStream(matchId);
    if (existing.status !== "LIVE") return existing;
    const updated: MatchStream = { ...existing, viewerCount: simulateViewerCount(existing) };
    data[String(matchId)] = updated;
    save(data);
    return updated;
  }

  updateTitle(matchId: number, title: string): MatchStream {
    const data = load();
    const existing = this.getStream(matchId);
    const updated: MatchStream = { ...existing, title };
    data[String(matchId)] = updated;
    save(data);
    return updated;
  }
}

export const sportsStreamingService = new SportsStreamingService();
