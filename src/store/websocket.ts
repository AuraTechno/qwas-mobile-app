/**
 * WebSocket store — real-time events от сервера.
 * Auto-reconnect с exponential backoff, ping каждые 30 сек.
 */

import { create } from 'zustand';
import { loadToken } from '@/api/client';
import { API_URL } from '@/api/client';

const WS_URL = API_URL.replace(/^http/, 'ws') + '/ws';

type Status = 'disconnected' | 'connecting' | 'connected';

export interface WSEvent {
  event: string;
  payload: any;
  ts: number;
}

interface WSState {
  status: Status;
  socket: WebSocket | null;
  reconnectTimer: ReturnType<typeof setTimeout> | null;
  pingTimer: ReturnType<typeof setInterval> | null;
  reconnectAttempts: number;
  listeners: Map<string, Set<(payload: any) => void>>;

  connect: () => Promise<void>;
  disconnect: () => void;
  send: (type: string, payload?: any) => void;
  on: (event: string, callback: (payload: any) => void) => () => void;
  off: (event: string, callback: (payload: any) => void) => void;
}

export const useWebSocket = create<WSState>((set, get) => ({
  status: 'disconnected',
  socket: null,
  reconnectTimer: null,
  pingTimer: null,
  reconnectAttempts: 0,
  listeners: new Map(),

  async connect() {
    const { status, socket } = get();
    if (status === 'connecting' || status === 'connected') return;
    if (socket && socket.readyState === WebSocket.OPEN) return;

    const token = await loadToken();
    if (!token) return;

    set({ status: 'connecting' });
    const ws = new WebSocket(`${WS_URL}?token=${encodeURIComponent(token)}`);

    ws.onopen = () => {
      set({ status: 'connected', reconnectAttempts: 0 });
      const pingTimer = setInterval(() => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify({ type: 'ping' }));
        }
      }, 30000);
      set({ pingTimer });
    };

    ws.onmessage = (e) => {
      try {
        const data = JSON.parse(e.data);
        const event = data.event || data.type;
        if (event) {
          const listeners = get().listeners;
          const set = listeners.get(event);
          if (set) {
            set.forEach((cb) => {
              try { cb(data.payload ?? data); } catch (err) { console.warn('WS listener error', err); }
            });
          }
        }
      } catch (err) {
        console.warn('WS parse error', err);
      }
    };

    ws.onerror = (e) => {
      console.warn('WS error', e);
    };

    ws.onclose = () => {
      const { pingTimer, reconnectAttempts } = get();
      if (pingTimer) clearInterval(pingTimer);
      set({ status: 'disconnected', socket: null, pingTimer: null });

      const delay = Math.min(30000, 1000 * Math.pow(1.5, reconnectAttempts));
      const timer = setTimeout(() => {
        set({ reconnectAttempts: reconnectAttempts + 1, reconnectTimer: null });
        get().connect();
      }, delay);
      set({ reconnectTimer: timer, reconnectAttempts: reconnectAttempts + 1 });
    };

    set({ socket: ws });
  },

  disconnect() {
    const { socket, pingTimer, reconnectTimer } = get();
    if (reconnectTimer) clearTimeout(reconnectTimer);
    if (pingTimer) clearInterval(pingTimer);
    if (socket) {
      socket.onclose = null;
      socket.close();
    }
    set({ status: 'disconnected', socket: null, pingTimer: null, reconnectTimer: null, reconnectAttempts: 0 });
  },

  send(type, payload) {
    const { socket } = get();
    if (socket && socket.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify({ type, payload: payload || {} }));
    }
  },

  on(event, callback) {
    const listeners = get().listeners;
    if (!listeners.has(event)) listeners.set(event, new Set());
    listeners.get(event)!.add(callback);
    return () => {
      listeners.get(event)?.delete(callback);
    };
  },

  off(event, callback) {
    get().listeners.get(event)?.delete(callback);
  },
}));
