'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth';
import { useLiveEvents } from '@/lib/useLiveEvents';
import { getActiveAnnouncements, dismissAnnouncement, bustGetCache, type Announcement } from '@/lib/api';

/**
 * Matangazo yaonekana pale juu kabisa (banner) — sio lazima mtu afungue
 * dropdown. Huweza kufutwa (✕) kwa kila tangazo na kubadilika live kupitia MQTT.
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
    bustGetCache(); // tangazo jipya lijitokeze FRESH
    reload();
  }, [messages.length]);

  if (!items.length) return null;

  async function dismiss(id: string) {
    try { await dismissAnnouncement(id); } catch {}
    setItems((prev) => prev.filter((a) => a.announcement_id !== id));
  }

  return (
    <div className="space-y-1.5 px-3 pt-3">
      {items.map((a) => (
        <div key={a.announcement_id}
          className="flex items-start gap-2 rounded-xl border border-brand-orange bg-brand-orange-50 dark:bg-brand-orange-100/20 px-3 py-2.5 shadow-sm">
          <span className="text-lg leading-none mt-0.5 flex-shrink-0">📢</span>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-bold text-brand-orange-600 dark:text-brand-orange-500">{a.title}</div>
            <div className="text-xs text-brand-grey-700 dark:text-brand-grey-300 mt-0.5 line-clamp-2">{a.message}</div>
          </div>
          <div className="flex flex-col items-end gap-1 flex-shrink-0">
            <button
              onClick={() => dismiss(a.announcement_id)}
              className="text-xs px-2 py-0.5 rounded-full border border-brand-orange text-brand-orange hover:bg-brand-orange hover:text-white transition"
              title="Futa tangazo"
            >
              ✕
            </button>
            <Link href="/announcements" className="text-[10px] text-brand-orange hover:underline">
              Soma zaidi
            </Link>
          </div>
        </div>
      ))}
    </div>
  );
}
