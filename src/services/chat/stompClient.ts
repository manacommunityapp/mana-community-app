import { Client, type IMessage, type StompSubscription } from "@stomp/stompjs";
import { getToken } from "../common/apiClient";
import { createLogger } from "../../utils/logger";

const log = createLogger("STOMP");

// Exponential backoff caps at 60s
const BACKOFF_MS = [1000, 2000, 4000, 8000, 16000, 30000, 60000];

export type WsState =
  | "IDLE"
  | "CONNECTING"
  | "CONNECTED"
  | "RECONNECTING"
  | "RATE_LIMITED"
  | "CONNECTION_LIMIT"
  | "UNAUTHORIZED"
  | "DISCONNECTED";

type Handler = (body: unknown) => void;
type StateListener = (state: WsState) => void;

interface Tracked {
  destination: string;
  handler: Handler;
  sub?: StompSubscription;
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
  private nextId = 1;
  private reconnectAttempt = 0;
  private _state: WsState = "IDLE";
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;

  get state(): WsState {
    return this._state;
  }

  /** True while the underlying socket is connected. */
  get connected(): boolean {
    return this._state === "CONNECTED";
  }

  private setState(s: WsState) {
    if (this._state === s) return;
    this._state = s;
    this.stateListeners.forEach((l) => l(s));
  }

  /** Subscribe to connection-state changes. Returns an unsubscribe function. */
  onStateChange(listener: StateListener): () => void {
    this.stateListeners.add(listener);
    return () => this.stateListeners.delete(listener);
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

  private scheduleReconnect() {
    if (this.reconnectTimer) return;
    const delay = BACKOFF_MS[Math.min(this.reconnectAttempt, BACKOFF_MS.length - 1)];
    this.reconnectAttempt++;
    log.info(`Reconnecting in ${delay}ms (attempt ${this.reconnectAttempt})`);
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
    this.client?.deactivate();
    this.client = null;
    this.reconnectAttempt = 0;
    this.setState("DISCONNECTED");
  }
}

export const stompClient = new StompClientWrapper();
