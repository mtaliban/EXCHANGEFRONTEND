'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth';
import { useLiveEvents } from '@/lib/useLiveEvents';
import { getActiveAnnouncements, dismissAnnouncement, bustGetCache, type Announcement } from '@/lib/api';

/**
 * Matangazo yaonekana pale juu kabisa (banner) — structure nzuri, maandishi
 * BOLD + NYEUSI (professional). Ujumbe mrefu hufunguka PALE PALE (Soma zaidi /
 * Funga) — hakuna kwenda page nyingine. Hubadilika live kupitia MQTT/WS.
 */
export default function AnnouncementBanner() {
  const { user } = useAuth();
  const [items, setItems] = useState<Announcement[]>([]);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const { messages } = useLiveEvents(user ? ['announcement'] : []);

  async function reload() {
    try {
      const d = await getActiveAnnouncements();
      setItems(d.announcements);
    } catch {}
  }

  useEffect(() => { reload(); }, []);
  useEffect(() => {
    if (!messages.length) return;
    bustGetCache(); // tangazo jipya lijitokeze FRESH
    reload();
  }, [messages.length]);

  if (!items.length) return null;

  async function dismiss(id: string) {
    try { await dismissAnnouncement(id); } catch {}
    setItems((prev) => prev.filter((a) => a.announcement_id !== id));
  }

  function toggle(id: string) {
    setExpanded((prev) => ({ ...prev, [id]: !prev[id] }));
  }

  return (
    <div className="space-y-1.5 px-3 pt-3">
      {items.map((a) => {
        const isOpen = !!expanded[a.announcement_id];
        const long = (a.message || '').length > 160;
        return (
          <div key={a.announcement_id}
            className="flex items-start gap-2.5 rounded-xl border-2 border-brand-grey-300 dark:border-brand-grey-600 bg-white dark:bg-brand-grey-900 px-3.5 py-3 shadow-sm">
            <span className="text-lg leading-none mt-0.5 flex-shrink-0">📢</span>
            <div className="flex-1 min-w-0">
              {/* Kichwa — BOLD + NYEUSI */}
              <div className="text-sm font-extrabold text-brand-grey-900 dark:text-white">
                {a.title}
              </div>
              {/* Ujumbe — bold kidogo, nyeusi, inakatwa nusu ikiwa mrefu (Soma zaidi inafungua) */}
              <div className={`text-[13px] font-medium text-brand-grey-800 dark:text-brand-grey-200 mt-1 whitespace-pre-wrap break-words ${isOpen ? '' : 'line-clamp-1'}`}>
                {a.message}
              </div>
              <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                {long && (
                  <button
                    onClick={() => toggle(a.announcement_id)}
                    className="text-[11px] font-bold text-brand-blue hover:underline"
                  >
                    {isOpen ? '▲ Funga' : '▼ Soma zaidi'}
                  </button>
                )}
                <span className="text-[10px] text-brand-grey-400">
                  {a.created_by_name ? `✍️ ${a.created_by_name} · ` : ''}
                  {a.created_at ? new Date(a.created_at).toLocaleDateString('sw-TZ') : ''}
                </span>
              </div>
            </div>
            <button
              onClick={() => dismiss(a.announcement_id)}
              className="text-brand-grey-400 hover:text-brand-red transition flex-shrink-0 leading-none px-1"
              title="Funga tangazo"
              aria-label="Funga tangazo"
            >
              ✕
            </button>
          </div>
        );
      })}
    </div>
  );
}
