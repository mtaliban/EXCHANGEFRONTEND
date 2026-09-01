'use client';

import { useEffect, useRef } from 'react';
import { emitDataChanged } from '@/lib/api';
import { API_URL } from '@/lib/config';

/**
 * Lightweight data-version poller kwa pages zisizo na LiveProvider
 * (mfano: registration page — mtumiaji haja-login, hivyo WS haifunguki).
 * Inapoll `/locations/data-version` kila 10s na ku-trigger emitDataChanged
 * pale version inapobadilika. Vivyo hivyo inapoll kila dakika 30 ili
 * kuhakikisha data haikwami kwenye cache.
 */
export default function DataVersionPoller() {
  const lastVer = useRef('');

  useEffect(() => {
    let cancelled = false;
    let timer: ReturnType<typeof setInterval>;

    async function check() {
      try {
        const res = await fetch(`${API_URL}/locations/data-version`);
        if (!res.ok) return;
        const data = await res.json();
        if (cancelled) return;
        if (lastVer.current && data.version !== lastVer.current) {
          // Version changed → bust all data caches
          emitDataChanged();
        }
        lastVer.current = data.version;
      } catch {
        // swallow — next tick itarudia
      }
    }

    // Initial fetch
    check();
    // Poll every 10 seconds
    timer = setInterval(check, 10_000);

    return () => { cancelled = true; clearInterval(timer); };
  }, []);

  return null;
}
