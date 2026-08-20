'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth';
import { useLiveEvents } from '@/lib/useLiveEvents';
import { getActiveAnnouncements, dismissAnnouncement, bustGetCache, type Announcement } from '@/lib/api';

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

  if (!items.length) return null;

  function dismiss(id: string) {
    setItems((prev) => prev.filter((a) => a.announcement_id !== id));
    dismissAnnouncement(id).catch(() => {});
  }

  return (
    <div className="space-y-2">
      {items.map((a) => (
        <div key={a.announcement_id}
          className="rounded-lg border border-brand-blue/30 bg-brand-blue-50 dark:bg-brand-blue-950/40 px-3 py-2 text-[11px] text-brand-blue-700 dark:text-brand-blue-300 font-medium animate-slide-in flex items-start gap-2">
          <span className="flex-shrink-0 mt-0.5">📢</span>
          <div className="flex-1 min-w-0">
            <span className="font-bold">{a.title}</span>
            <span className="text-brand-blue-500 dark:text-brand-blue-400 font-normal"> — {a.message}</span>
          </div>
          <button
            onClick={() => dismiss(a.announcement_id)}
            className="text-brand-blue-400 hover:text-brand-blue-700 text-xs leading-none flex-shrink-0 mt-0.5"
            title="Funga"
          >×</button>
        </div>
      ))}
    </div>
  );
}
