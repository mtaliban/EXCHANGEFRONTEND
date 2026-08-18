'use client';

import { create } from 'zustand';
import { useT } from '@/lib/i18n';

/** Confirm dialog ya KISOMI — inachukua nafasi ya confirm() ya kizamani ya
 *  browser. Inatumika popote kwa `await askConfirm({...})` — modal nzuri
 *  (rounded, rangi, buttons ndogo) badala ya popup ya zamani. */

export interface ConfirmOptions {
  title: string;
  message?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  danger?: boolean;
}

interface ConfirmState {
  opts: ConfirmOptions | null;
  resolve: ((v: boolean) => void) | null;
  ask: (opts: ConfirmOptions) => Promise<boolean>;
  settle: (v: boolean) => void;
}

export const useConfirmStore = create<ConfirmState>((set, get) => ({
  opts: null,
  resolve: null,
  ask: (opts) =>
    new Promise<boolean>((resolve) => {
      set({ opts, resolve });
    }),
  settle: (v) => {
    const r = get().resolve;
    set({ opts: null, resolve: null });
    if (r) r(v);
  },
}));

/** Call hii na `await` — inarudisha true/false kwa uamuzi wa mtumiaji. */
export const askConfirm = (opts: ConfirmOptions) => useConfirmStore.getState().ask(opts);

/** Host component — weka MOJA kwenye AppShell (juu ya kila page ya app). */
export function ConfirmHost() {
  const t = useT();
  const opts = useConfirmStore((s) => s.opts);
  const settle = useConfirmStore((s) => s.settle);
  if (!opts) return null;
  return (
    <div
      className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/50 backdrop-blur-[2px]"
      onClick={() => settle(false)}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="bg-white dark:bg-brand-grey-900 rounded-2xl w-full max-w-sm p-5 shadow-2xl border border-brand-grey-100 dark:border-brand-grey-700"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start gap-3">
          <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
            opts.danger ? 'bg-brand-red-100 text-brand-red' : 'bg-brand-blue-100 text-brand-blue'
          }`}>
            {opts.danger ? '⚠' : 'ℹ'}
          </div>
          <div className="min-w-0">
            <h3 className="font-bold text-brand-grey-900 dark:text-white text-base leading-snug">{opts.title}</h3>
            {opts.message && (
              <p className="text-sm text-brand-grey-600 dark:text-brand-grey-300 mt-1.5 whitespace-pre-wrap break-words">{opts.message}</p>
            )}
          </div>
        </div>
        <div className="flex justify-end gap-2 mt-5">
          <button
            onClick={() => settle(false)}
            className="text-xs px-3 py-1.5 rounded-lg border border-brand-grey-300 dark:border-brand-grey-600 text-brand-grey-700 dark:text-brand-grey-300 hover:bg-brand-grey-50 dark:hover:bg-brand-grey-800 transition"
          >
            {opts.cancelLabel || t('admin.cancel')}
          </button>
          <button
            onClick={() => settle(true)}
            className={`text-xs px-3 py-1.5 rounded-lg font-semibold transition ${
              opts.danger
                ? 'bg-brand-red text-white hover:bg-brand-red-700'
                : 'bg-brand-blue text-white hover:bg-brand-blue-700'
            }`}
          >
            {opts.confirmLabel || t('admin.confirm')}
          </button>
        </div>
      </div>
    </div>
  );
}
