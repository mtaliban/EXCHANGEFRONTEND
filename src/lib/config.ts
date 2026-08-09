'use client';

/**
 * Runtime resolution of backend API + MQTT endpoints.
 *
 * NEXT_PUBLIC_* vars are baked into the JS bundle at BUILD time. That breaks
 * local development when the image was last built pointing at a (dead or
 * changed) public tunnel URL. To fix this we resolve the endpoints at RUNTIME:
 *   - served from localhost / 127.0.0.1  → talk to the local backend
 *   - served from anywhere else (tunnel/domain) → use the baked env value
 *
 * This makes the same container work both locally and when exposed online.
 */

function inBrowser(): boolean {
  return typeof window !== 'undefined';
}

function isLocalHost(): boolean {
  if (!inBrowser()) return true; // SSR — assume local; client re-resolves
  const host = window.location.hostname;
  return host === 'localhost' || host === '127.0.0.1' || host === '0.0.0.0' || host === '::1';
}

function localApi(baked: string): string {
  // If the baked env is already a local URL, trust it (custom local port).
  if (/localhost|127\.0\.0\.1|0\.0\.0\.0/.test(baked)) return baked;
  return 'http://localhost:8080';
}

export const API_URL: string = (() => {
  const baked = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';
  if (isLocalHost()) return localApi(baked);
  if (/localhost|127\.0\.0\.1/.test(baked)) {
    console.warn('[config] Not on localhost but NEXT_PUBLIC_API_URL points to', baked, '— set it to the public backend URL at build time.');
  }
  return baked;
})();

export const WS_URL: string = (() => {
  const baked = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';
  const base = isLocalHost() ? localApi(baked) : baked;
  return `${base.replace(/^http/, 'ws')}/ws`;
})();
