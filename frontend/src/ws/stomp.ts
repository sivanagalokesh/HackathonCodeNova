import { Client, IMessage } from '@stomp/stompjs';
import SockJS from 'sockjs-client';

/**
 * A single shared STOMP client for the whole app. Components subscribe to
 * topics through `subscribe()`; the connection is opened lazily on first use
 * and reused everywhere (customer pages + operations center).
 *
 * Backend endpoint: /ws (SockJS). Topics:
 *   /topic/events /topic/inventory /topic/orders
 *   /topic/metrics /topic/workers /topic/sales /topic/notifications
 */

type Handler = (body: any) => void;

const configuredBase = import.meta.env.VITE_API_BASE ?? '';
const socketBase = configuredBase && !configuredBase.startsWith('http')
  ? `https://${configuredBase}`
  : configuredBase;
const SOCK_URL = socketBase + '/ws';

class StompHub {
  private client: Client;
  private connected = false;
  private handlers = new Map<string, Set<Handler>>();
  private statusListeners = new Set<(up: boolean) => void>();

  constructor() {
    this.client = new Client({
      webSocketFactory: () => new SockJS(SOCK_URL),
      reconnectDelay: 2500,
      heartbeatIncoming: 10000,
      heartbeatOutgoing: 10000,
      onConnect: () => {
        this.connected = true;
        this.statusListeners.forEach(l => l(true));
        // (re)establish broker subscriptions for every topic with handlers
        this.handlers.forEach((_set, topic) => this.brokerSubscribe(topic));
      },
      onWebSocketClose: () => {
        this.connected = false;
        this.statusListeners.forEach(l => l(false));
      },
    });
  }

  private brokerSubs = new Map<string, { unsubscribe: () => void }>();

  private ensureActive() {
    if (!this.client.active) this.client.activate();
  }

  private brokerSubscribe(topic: string) {
    if (!this.connected) return;
    if (this.brokerSubs.has(topic)) return;
    const sub = this.client.subscribe(topic, (msg: IMessage) => {
      let body: any = msg.body;
      try { body = JSON.parse(msg.body); } catch { /* keep string */ }
      this.handlers.get(topic)?.forEach(h => h(body));
    });
    this.brokerSubs.set(topic, sub);
  }

  subscribe(topic: string, handler: Handler): () => void {
    this.ensureActive();
    if (!this.handlers.has(topic)) this.handlers.set(topic, new Set());
    this.handlers.get(topic)!.add(handler);
    this.brokerSubscribe(topic);

    return () => {
      const set = this.handlers.get(topic);
      set?.delete(handler);
      if (set && set.size === 0) {
        this.brokerSubs.get(topic)?.unsubscribe();
        this.brokerSubs.delete(topic);
        this.handlers.delete(topic);
      }
    };
  }

  onStatus(listener: (up: boolean) => void): () => void {
    this.statusListeners.add(listener);
    listener(this.connected);
    return () => this.statusListeners.delete(listener);
  }
}

export const hub = new StompHub();
