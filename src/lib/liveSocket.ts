'use client';

import { create } from 'zustand';
import { MSG_WS_URL } from './api';

type EventPayload = any;
type Handler = (payload: EventPayload) => void;

interface LiveState {
  socket: WebSocket | null;
  connected: boolean;
  handlers: Map<string, Set<Handler>>;
  onlineUserIds: Set<string>;
  _token: string;
  _reconnectTimer: ReturnType<typeof setTimeout> | null;
  _reconnectDelay: number;
  connect: (token: string) => void;
  disconnect: () => void;
  send: (data: any) => void;
  subscribe: (event: string, h: Handler) => () => void;
  isOnline: (userId: string) => boolean;
  setOnline: (userId: string, online: boolean) => void;
}

export const useLive = create<LiveState>((set, get) => ({
  socket: null,
  connected: false,
  handlers: new Map(),
  onlineUserIds: new Set(),
  _token: '' as string,
  _reconnectTimer: null as ReturnType<typeof setTimeout> | null,
  _reconnectDelay: 1000,

  connect: (token: string) => {
    const cur = get().socket;
    if (cur && (cur.readyState === WebSocket.OPEN || cur.readyState === WebSocket.CONNECTING)) return;
    // Store token for auto-reconnect
    get()._token = token;
    get()._reconnectDelay = 1000;
    const url = `${MSG_WS_URL()}?token=${encodeURIComponent(token)}`;
    const ws = new WebSocket(url);

    ws.onopen = () => {
      set({ connected: true, _reconnectDelay: 1000 });
      // presence heartbeat every 30s
      const beat = setInterval(() => {
        if (ws.readyState === WebSocket.OPEN) ws.send(JSON.stringify({ type: 'presence_ping' }));
        else clearInterval(beat);
      }, 30000);
    };
    ws.onclose = () => {
      set({ connected: false });
      // Auto-reconnect with exponential backoff (1s, 2s, 4s, max 30s)
      const delay = get()._reconnectDelay;
      const timer = setTimeout(() => {
        const t = get()._token;
        if (t) get().connect(t);
      }, delay);
      set({ _reconnectTimer: timer, _reconnectDelay: Math.min(delay * 2, 30000) });
    };
    ws.onerror = () => set({ connected: false });
    ws.onmessage = (ev) => {
      try {
        const data = JSON.parse(ev.data);
        const ev_name = data.event || data.type;
        if (!ev_name) return;
        if (ev_name === 'presence') {
          if (data.user_id) get().setOnline(data.user_id, !!data.online);
        }
        const hs = get().handlers.get(ev_name);
        if (hs) hs.forEach((h) => { try { h(data); } catch (e) { console.warn('handler error', e); } });
        // wildcard
        const any = get().handlers.get('*');
        if (any) any.forEach((h) => { try { h(data); } catch {} });
      } catch (e) {
        console.warn('bad WS payload', e);
      }
    };

    set({ socket: ws });
  },

  disconnect: () => {
    const ws = get().socket;
    if (ws) ws.close();
    // Clear reconnect timer and token
    if (get()._reconnectTimer) clearTimeout(get()._reconnectTimer as any);
    set({ socket: null, connected: false, _token: '', _reconnectTimer: null });
  },

  send: (data: any) => {
    const ws = get().socket;
    if (ws && ws.readyState === WebSocket.OPEN) ws.send(JSON.stringify(data));
  },

  subscribe: (event: string, h: Handler) => {
    const hs = get().handlers;
    if (!hs.has(event)) hs.set(event, new Set());
    hs.get(event)!.add(h);
    set({ handlers: hs });
    return () => {
      const set2 = get().handlers.get(event);
      if (set2) set2.delete(h);
    };
  },

  isOnline: (userId: string) => get().onlineUserIds.has(userId),

  setOnline: (userId: string, online: boolean) => {
    const s = new Set(get().onlineUserIds);
    if (online) s.add(userId); else s.delete(userId);
    set({ onlineUserIds: s });
  },
}));
