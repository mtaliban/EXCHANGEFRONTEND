'use client';

/**
 * Global toast — inaonekana hata page ikibadilika (page navigation).
 * Tumia kwa guide toasts (Call/SMS/WhatsApp) na notifications nyingine.
 */
export function showToast(opts: {
  emoji?: string;
  title: string;
  onClick?: () => void;
  duration?: number;
}) {
  const container = ensureToastContainer();
  const el = document.createElement('div');
  el.className = 'pointer-events-auto cursor-pointer w-fit min-w-[180px] max-w-[280px] rounded-lg border border-brand-blue/30 bg-brand-blue-50 dark:bg-brand-blue-950/40 px-3 py-2 text-[11px] text-brand-blue-700 dark:text-brand-blue-300 font-medium animate-slide-in transition hover:shadow-md';
  const emoji = opts.emoji || 'ℹ️';
  const titleEl = document.createElement('div');
  titleEl.className = 'font-bold text-brand-blue-800 dark:text-brand-blue-200 leading-snug';
  titleEl.textContent = `${emoji} ${opts.title}`;
  el.appendChild(titleEl);
  const close = () => {
    el.style.opacity = '0';
    setTimeout(() => el.remove(), 200);
  };
  el.addEventListener('click', () => { opts.onClick?.(); close(); });
  container.appendChild(el);
  setTimeout(close, opts.duration || 5000);
}

function ensureToastContainer(): HTMLElement {
  let c = document.getElementById('kv-toasts');
  if (!c) {
    c = document.createElement('div');
    c.id = 'kv-toasts';
    c.className = 'fixed bottom-24 left-3 sm:left-auto sm:right-4 sm:top-3 sm:bottom-auto z-[100] flex flex-col items-end gap-2 pointer-events-none';
    document.body.appendChild(c);
  }
  return c;
}
