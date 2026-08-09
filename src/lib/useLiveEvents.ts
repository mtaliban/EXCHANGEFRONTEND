'use client';

import { useEffect, useState } from 'react';
import { useLive } from './liveSocket';

/**
 * Subscribe to live events via the AUTHENTICATED backend WebSocket (secure —
 * token-based, no MQTT credentials in the browser bundle).
 *
 * The MQTT broker stays backend-internal (backend ↔ HiveMQ/Mosquitto). The
 * browser receives the same events through the /ws endpoint which is already
 * protected by the user's JWT, so nobody can subscribe to someone else's
 * notifications without being that user.
 *
 * Returns latest message per event + connection state.
 * `messages` shape matches the old MQTT hook: { topic, payload, at }.
 */
export function useLiveEvents(events: string[]) {
  const connected = useLive((s) => s.connected);
  const subscribe = useLive((s) => s.subscribe);
  const [messages, setMessages] = useState<{ topic: string; payload: any; at: number }[]>([]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const unsubs = events.map((ev) =>
      subscribe(ev, (payload: any) => {
        setMessages((prev) => [...prev.slice(-99), { topic: ev, payload, at: Date.now() }]);
      })
    );
    return () => unsubs.forEach((u) => u());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [events.join('|'), subscribe]);

  return { connected, messages };
}
