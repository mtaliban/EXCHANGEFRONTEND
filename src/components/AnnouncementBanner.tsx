'use client';

import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '@/lib/auth';
import { useLiveEvents } from '@/lib/useLiveEvents';
import { getActiveAnnouncements, dismissAnnouncement, bustGetCache, type Announcement } from '@/lib/api';
import { Megaphone } from 'lucide-react';

/**
 * Matangazo — yanaonekana kama guide toast (blue card slide-in).
 * Hubadilika live kupitia MQTT/WS.
 */
export default function AnnouncementBanner() {
  const { user } = useAuth();
  const [items, setItems] = useState<Announcement[]>([]);
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
    bustGetCache();
    reload();
  }, [messages.length]);

  // Deduplicate: admin akiresend tangazo, document mpya inaundwa.
  // Onyesha tangazo moja tu kwa title+message (la karibuni zaidi).
  const uniqueItems = useMemo(() => {
    const seen = new Map<string, Announcement>();
    for (const a of items) {
      const key = `${a.title}|${a.message}`;
      const existing = seen.get(key);
      if (!existing || new Date(a.created_at) > new Date(existing.created_at)) {
        seen.set(key, a);
      }
    }
    return Array.from(seen.values());
  }, [items]);

  const [currentIdx, setCurrentIdx] = useState(0);

  if (!uniqueItems.length) return null;

  // Onyesha tangazo MOJA tu kwa wakati
  const current = uniqueItems[currentIdx] || uniqueItems[0];

  function dismiss(id: string) {
    setItems((prev) => prev.filter((a) => a.announcement_id !== id));
    dismissAnnouncement(id).catch(() => {});
    // If dismissed the current one, show next or previous
    setCurrentIdx((prev) => Math.min(prev, uniqueItems.length - 2));
  }

  return (
    <div className="space-y-2">
      <div key={current.announcement_id}
        className="rounded-lg border border-brand-grey-200 dark:border-brand-grey-700 bg-white dark:bg-brand-grey-900 px-4 py-3 animate-slide-in flex items-start gap-3 shadow-sm">
        <Megaphone size={16} className="text-brand-grey-400 flex-shrink-0 mt-0.5" />
        <div className="flex-1 min-w-0">
          <div className="font-bold text-brand-blue text-[13px] leading-snug">{current.title}</div>
          <p className="text-brand-grey-900 dark:text-brand-grey-100 text-[12px] mt-1 leading-relaxed whitespace-pre-wrap line-clamp-3">{current.message}</p>
        </div>
        <button
          onClick={() => dismiss(current.announcement_id)}
          className="text-brand-grey-400 hover:text-brand-grey-700 text-sm font-bold leading-none flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-lg hover:bg-brand-grey-100 dark:hover:bg-brand-grey-800 transition border border-brand-grey-200 dark:border-brand-grey-700"
          title="Funga"
        >×</button>
      </div>
      {uniqueItems.length > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button onClick={() => setCurrentIdx((prev) => (prev > 0 ? prev - 1 : uniqueItems.length - 1))}
            className="text-[11px] px-2 py-0.5 rounded-full bg-brand-grey-100 dark:bg-brand-grey-800 text-brand-grey-600 dark:text-brand-grey-300 font-semibold hover:bg-brand-grey-200 dark:hover:bg-brand-grey-700 transition">
            ← Zilizopita
          </button>
          <span className="text-[11px] text-brand-grey-400 font-medium">
            {currentIdx + 1} / {uniqueItems.length}
          </span>
          <button onClick={() => setCurrentIdx((prev) => (prev < uniqueItems.length - 1 ? prev + 1 : 0))}
            className="text-[11px] px-2 py-0.5 rounded-full bg-brand-grey-100 dark:bg-brand-grey-800 text-brand-grey-600 dark:text-brand-grey-300 font-semibold hover:bg-brand-grey-200 dark:hover:bg-brand-grey-700 transition">
            Zijazo →
          </button>
        </div>
      )}
    </div>
  );
}
