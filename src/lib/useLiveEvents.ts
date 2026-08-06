'use client';

import { useEffect, useRef, useState } from 'react';
import mqtt, { MqttClient } from 'mqtt';
import { MQTT_WS_URL } from './api';

/**
 * Subscribe to arbitrary MQTT topics via WebSocket. Payload assumed JSON.
 * Returns latest message per topic + connection state.
 */
export function useMqttTopics(topics: string[]) {
  const [connected, setConnected] = useState(false);
  const [messages, setMessages] = useState<{ topic: string; payload: any; at: number }[]>([]);
  const clientRef = useRef<MqttClient | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const client = mqtt.connect(MQTT_WS_URL, {
      clean: true,
      reconnectPeriod: 3000,
      keepalive: 30,
    });
    clientRef.current = client;

    client.on('connect', () => {
      setConnected(true);
      topics.forEach((t) => client.subscribe(t, { qos: 1 }));
    });
    client.on('reconnect', () => setConnected(false));
    client.on('close', () => setConnected(false));
    client.on('message', (topic, payload) => {
      let parsed: any = null;
      try { parsed = JSON.parse(payload.toString()); } catch { parsed = payload.toString(); }
      setMessages((prev) => [...prev.slice(-99), { topic, payload: parsed, at: Date.now() }]);
    });

    return () => {
      client.end(true);
      clientRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [topics.join('|')]);

  return { connected, messages };
}
