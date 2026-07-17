import { Client, type IMessage, type StompSubscription } from "@stomp/stompjs";
import { getToken } from "./apiClient";
import { createLogger } from "../utils/logger";

/**
 * Thin singleton wrapper around a STOMP-over-WebSocket connection to the
 * backend's {@code /ws} endpoint. One shared socket multiplexes every
 * subscription (chat today, live auction later).
 *
 * Subscriptions are tracked so they survive reconnects: on each (re)connect
 * the wrapper re-applies all active destinations. Callers get an unsubscribe
 * function and never touch the raw client.
 */

const log = createLogger("STOMP");

type Handler = (body: unknown) => void;

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
  private nextId = 1;

  /** True while the underlying socket is connected (used to gate fallback polling). */
  get connected(): boolean {
    return this.client?.connected ?? false;
  }

  /** Register a callback fired on every (re)connect — e.g. to refetch missed state. */
  onConnect(cb: () => void): () => void {
    this.connectHandlers.add(cb);
    return () => this.connectHandlers.delete(cb);
  }

  /** Register a callback fired on disconnect. */
  onDisconnect(cb: () => void): () => void {
    this.disconnectHandlers.add(cb);
    return () => this.disconnectHandlers.delete(cb);
  }

  private ensureClient(): Client {
    if (this.client) return this.client;

    const token = getToken();
    this.client = new Client({
      brokerURL: brokerUrl(),
      connectHeaders: token ? { Authorization: `Bearer ${token}` } : {},
      reconnectDelay: 5000,
      heartbeatIncoming: 10000,
      heartbeatOutgoing: 10000,
      onConnect: () => {
        log.info("Connected");
        this.tracked.forEach((t) => this.applySubscription(t));
        this.connectHandlers.forEach((h) => h());
      },
      onStompError: (frame) => {
        log.error("STOMP protocol error", frame.headers?.message ?? frame.body);
      },
      onWebSocketError: (event) => {
        log.error("WebSocket error", event);
      },
      onDisconnect: () => {
        log.info("Disconnected");
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
        // non-JSON payload — pass the raw string through
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

  /** Publish a message to an application destination (routed through /app prefix). */
  publish(destination: string, body: unknown) {
    const client = this.ensureClient();
    if (!client.connected) {
      log.error("Cannot publish — not connected", destination);
      return;
    }
    client.publish({ destination, body: JSON.stringify(body) });
  }

  /** Tear the socket down (e.g. on logout). */
  disconnect() {
    this.tracked.forEach((t) => t.sub?.unsubscribe());
    this.tracked.clear();
    this.connectHandlers.clear();
    this.disconnectHandlers.clear();
    this.client?.deactivate();
    this.client = null;
  }
}

export const stompClient = new StompClientWrapper();
