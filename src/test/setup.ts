import '@testing-library/jest-dom';

/**
 * jsdom inayotumika kwenye Vitest haitoi `localStorage`/`sessionStorage`
 * (hata `window.localStorage` haipo), kwa hiyo zustand persist (kv_auth,
 * kv_i18n) inashindwa kuandika na tests zote za store zinaanguka.
 * Hapa tunaweka Storage rahisi ya kumbukumbu ikiwa haipo.
 */
function memoryStorage(): Storage {
  const data = new Map<string, string>();
  return {
    get length() {
      return data.size;
    },
    key: (i: number) => Array.from(data.keys())[i] ?? null,
    getItem: (k: string) => (data.has(k) ? data.get(k)! : null),
    setItem: (k: string, v: string) => void data.set(String(k), String(v)),
    removeItem: (k: string) => void data.delete(k),
    clear: () => data.clear(),
  } as Storage;
}

if (typeof window !== 'undefined') {
  for (const key of ['localStorage', 'sessionStorage'] as const) {
    if (!(window as any)[key]) {
      const store = memoryStorage();
      Object.defineProperty(window, key, { value: store, writable: true, configurable: true });
      Object.defineProperty(globalThis, key, { value: store, writable: true, configurable: true });
    }
  }
}
