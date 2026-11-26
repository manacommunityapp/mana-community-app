import { Client, type IMessage, type StompSubscription } from "@stomp/stompjs";
import { getToken } from "../common/apiClient";
import { createLogger } from "../../utils/logger";

const log = createLogger("STOMP");

// Exponential backoff caps at 60s
export const BACKOFF_MS = [1000, 2000, 4000, 8000, 16000, 30000, 60000];

/**
 * Full-jitter exponential backoff (50%–100% of current tier) to prevent
 * thundering-herd reconnection storms when many guard tablets or IoT hubs
 * switch networks simultaneously.
 */
export function computeJitteredBackoff(attempt: number, rng: () => number = Math.random): number {
  const safeAttempt = Math.max(0, attempt);
  const ceiling = BACKOFF_MS[Math.min(safeAttempt, BACKOFF_MS.length - 1)];
  return Math.floor(ceiling * 0.5 + rng() * ceiling * 0.5);
}

export type NetworkType = "wifi" | "cellular" | "ethernet" | "offline" | "unknown";

export type WsState =
  | "IDLE"
  | "CONNECTING"
  | "CONNECTED"
  | "RECONNECTING"
  | "RATE_LIMITED"
  | "CONNECTION_LIMIT"
  | "UNAUTHORIZED"
  | "DISCONNECTED";

export interface WsMetadata {
  state: WsState;
  reconnectAttempt: number;
  networkType: NetworkType;
  lastConnectedAt: string | null;
}

type Handler = (body: unknown) => void;
type StateListener = (state: WsState) => void;
type MetaListener = (meta: WsMetadata) => void;

interface Tracked {
  destination: string;
  handler: Handler;
  sub?: StompSubscription;
}

function detectBrowserNetworkType(): NetworkType {
  if (typeof navigator === "undefined") return "unknown";
  if (navigator.onLine === false) return "offline";
  const conn = (navigator as unknown as { connection?: { type?: string } }).connection;
  const rawType = conn?.type?.toLowerCase();
  if (rawType === "wifi" || rawType === "cellular" || rawType === "ethernet") {
    return rawType;
  }
  return "unknown";
}

function brokerUrl(): string {
  const proto = window.location.protocol === "https:" ? "wss" : "ws";
  return `${proto}://${window.location.host}/ws`;
}

class StompClientWrapper {
  private client: Client | null = null;
  private tracked = new Map<number, Tracked>();
  private connectHandlers = new Set<() => void>();
  private disconnectHandlers = new Set<() => void>();
  private stateListeners = new Set<StateListener>();
  private metaListeners = new Set<MetaListener>();
  private nextId = 1;
  private reconnectAttempt = 0;
  private _state: WsState = "IDLE";
  private _networkType: NetworkType = "unknown";
  private _lastConnectedAt: string | null = null;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private networkListenersBound = false;

  constructor() {
    this._networkType = detectBrowserNetworkType();
    this.bindNetworkListeners();
  }

  private bindNetworkListeners() {
    if (this.networkListenersBound || typeof window === "undefined") return;
    this.networkListenersBound = true;

    window.addEventListener("online", () => {
      this._networkType = detectBrowserNetworkType();
      this.notifyMeta();
      if (this.tracked.size > 0 && !this.connected) {
        log.info("Browser online event detected — tearing down zombie socket and reconnecting");
        this.forceReconnect();
      }
    });

    window.addEventListener("offline", () => {
      this._networkType = "offline";
      log.warn("Browser offline event detected");
      this.cancelReconnect();
      this.setState("DISCONNECTED");
    });

    const conn = (navigator as unknown as { connection?: EventTarget }).connection;
    if (conn && typeof conn.addEventListener === "function") {
      conn.addEventListener("change", () => {
        const prev = this._networkType;
        const next = detectBrowserNetworkType();
        this._networkType = next;
        this.notifyMeta();

        // Active Wi-Fi <-> Cellular interface handoff: drop stale TCP pipe immediately
        if (prev !== next && next !== "offline" && this.tracked.size > 0) {
          log.info(`Network interface switched (${prev} -> ${next}) — forcing clean STOMP reconnect`);
          this.forceReconnect();
        }
      });
    }
  }

  get state(): WsState {
    return this._state;
  }

  get networkType(): NetworkType {
    return this._networkType;
  }

  get attemptCount(): number {
    return this.reconnectAttempt;
  }

  get lastConnectedAt(): string | null {
    return this._lastConnectedAt;
  }

  get metadata(): WsMetadata {
    return {
      state: this._state,
      reconnectAttempt: this.reconnectAttempt,
      networkType: this._networkType,
      lastConnectedAt: this._lastConnectedAt,
    };
  }

  /** True while the underlying socket is connected. */
  get connected(): boolean {
    return this._state === "CONNECTED";
  }

  private notifyMeta() {
    const snapshot = this.metadata;
    this.metaListeners.forEach((l) => l(snapshot));
  }

  private setState(s: WsState) {
    if (this._state === s) return;
    this._state = s;
    this.stateListeners.forEach((l) => l(s));
    this.notifyMeta();
  }

  /** Subscribe to connection-state changes. Returns an unsubscribe function. */
  onStateChange(listener: StateListener): () => void {
    this.stateListeners.add(listener);
    return () => this.stateListeners.delete(listener);
  }

  /** Subscribe to full metadata updates (attempt count, network type, timestamps). */
  onMetaChange(listener: MetaListener): () => void {
    this.metaListeners.add(listener);
    return () => this.metaListeners.delete(listener);
  }

  /** Register a callback fired on every (re)connect. */
  onConnect(cb: () => void): () => void {
    this.connectHandlers.add(cb);
    return () => this.connectHandlers.delete(cb);
  }

  /** Register a callback fired on disconnect. */
  onDisconnect(cb: () => void): () => void {
    this.disconnectHandlers.add(cb);
    return () => this.disconnectHandlers.delete(cb);
  }

  /**
   * Immediately tear down any potentially hung/zombie socket (e.g. after Wi-Fi
   * to cellular handover) and trigger an immediate reconnection with reset backoff.
   */
  forceReconnect() {
    this.cancelReconnect();
    this.reconnectAttempt = 0;
    this._networkType = detectBrowserNetworkType();
    if (this._networkType === "offline") {
      this.setState("DISCONNECTED");
      return;
    }

    const oldClient = this.client;
    this.client = null;
    if (oldClient) {
      Promise.resolve(oldClient.deactivate({ force: true }))
        .catch(() => {})
        .finally(() => {
          this.ensureClient();
        });
    } else {
      this.ensureClient();
    }
  }

  private scheduleReconnect() {
    if (this.reconnectTimer) return;
    if (typeof navigator !== "undefined" && navigator.onLine === false) {
      this._networkType = "offline";
      this.setState("DISCONNECTED");
      return;
    }

    const delay = computeJitteredBackoff(this.reconnectAttempt);
    this.reconnectAttempt++;
    log.info(`Reconnecting in ${delay}ms (attempt ${this.reconnectAttempt}, net=${this._networkType})`);
    this.setState("RECONNECTING");
    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      this.client?.deactivate().then(() => {
        this.client = null;
        this.ensureClient();
      });
    }, delay);
  }

  private cancelReconnect() {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
  }

  private ensureClient(): Client {
    if (this.client) return this.client;

    const token = getToken();
    this.setState("CONNECTING");

    this.client = new Client({
      brokerURL: brokerUrl(),
      connectHeaders: token ? { Authorization: `Bearer ${token}` } : {},
      // Disable built-in reconnect — we manage it ourselves with backoff
      reconnectDelay: 0,
      heartbeatIncoming: 10000,
      heartbeatOutgoing: 10000,
      onConnect: () => {
        log.info("Connected");
        this.reconnectAttempt = 0;
        this._lastConnectedAt = new Date().toISOString();
        this._networkType = detectBrowserNetworkType();
        this.setState("CONNECTED");
        this.tracked.forEach((t) => this.applySubscription(t));
        this.connectHandlers.forEach((h) => h());
      },
      onStompError: (frame) => {
        const errorType = frame.headers?.["x-error-type"];
        const message = frame.headers?.message ?? frame.body;
        log.error("STOMP error", errorType, message);

        switch (errorType) {
          case "RATE_LIMITED":
            this.setState("RATE_LIMITED");
            // Back off longer when rate-limited
            this.reconnectAttempt = Math.max(this.reconnectAttempt, 4);
            this.scheduleReconnect();
            break;
          case "CONNECTION_LIMIT":
            this.setState("CONNECTION_LIMIT");
            // Don't auto-reconnect — user must close other sessions
            this.cancelReconnect();
            break;
          case "UNAUTHORIZED":
            this.setState("UNAUTHORIZED");
            this.cancelReconnect();
            break;
          default:
            this.scheduleReconnect();
        }
      },
      onWebSocketError: () => {
        log.error("WebSocket transport error");
        this.scheduleReconnect();
      },
      onWebSocketClose: () => {
        if (this._state === "CONNECTED" || this._state === "CONNECTING") {
          log.info("WebSocket closed unexpectedly");
          this.scheduleReconnect();
        }
        this.disconnectHandlers.forEach((h) => h());
      },
      onDisconnect: () => {
        log.info("Disconnected");
        this.setState("DISCONNECTED");
        this.disconnectHandlers.forEach((h) => h());
      },
    });
    this.client.activate();
    return this.client;
  }

  private applySubscription(t: Tracked) {
    if (!this.client?.connected) return;
    t.sub = this.client.subscribe(t.destination, (msg: IMessage) => {
      let body: unknown = msg.body;
      try {
        body = JSON.parse(msg.body);
      } catch {
        // non-JSON payload — pass raw string through
      }
      t.handler(body);
    });
  }

  /** Subscribe to a STOMP destination; returns an unsubscribe function. */
  subscribe(destination: string, handler: Handler): () => void {
    const id = this.nextId++;
    const entry: Tracked = { destination, handler };
    this.tracked.set(id, entry);

    const client = this.ensureClient();
    if (client.connected) this.applySubscription(entry);

    return () => {
      const t = this.tracked.get(id);
      t?.sub?.unsubscribe();
      this.tracked.delete(id);
    };
  }

  /** Publish a message to an application destination. */
  publish(destination: string, body: unknown) {
    const client = this.ensureClient();
    if (!client.connected) {
      log.error("Cannot publish — not connected", destination);
      return;
    }
    client.publish({ destination, body: JSON.stringify(body) });
  }

  /** Unsubscribe all tracked subscriptions without tearing down the socket. */
  clearAllSubscriptions() {
    this.tracked.forEach((t) => t.sub?.unsubscribe());
    this.tracked.clear();
  }

  /** Tear the socket down (e.g. on logout). */
  disconnect() {
    this.cancelReconnect();
    this.clearAllSubscriptions();
    this.connectHandlers.clear();
    this.disconnectHandlers.clear();
    this.stateListeners.clear();
    this.metaListeners.clear();
    this.client?.deactivate();
    this.client = null;
    this.reconnectAttempt = 0;
    this.setState("DISCONNECTED");
  }
}

export const stompClient = new StompClientWrapper();
