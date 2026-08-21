'use client';

import { useEffect, useState } from 'react';
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

  if (!items.length) return null;

  function dismiss(id: string) {
    setItems((prev) => prev.filter((a) => a.announcement_id !== id));
    dismissAnnouncement(id).catch(() => {});
  }

  return (
    <div className="space-y-2">
      {items.map((a) => (
        <div key={a.announcement_id}
          className="rounded-lg border border-brand-grey-200 dark:border-brand-grey-700 bg-white dark:bg-brand-grey-900 px-4 py-3 text-[12px] animate-slide-in flex items-start gap-3 shadow-sm">
          <Megaphone size={16} className="text-brand-grey-400 flex-shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <div className="font-bold text-brand-grey-900 dark:text-white text-[13px] leading-snug">{a.title}</div>
            <p className="text-brand-grey-600 dark:text-brand-grey-300 mt-0.5 leading-relaxed whitespace-pre-wrap">{a.message}</p>
          </div>
          <button
            onClick={() => dismiss(a.announcement_id)}
            className="text-brand-grey-400 hover:text-brand-grey-700 text-xs leading-none flex-shrink-0 mt-0.5 w-5 h-5 flex items-center justify-center rounded-full hover:bg-brand-grey-100 transition"
            title="Funga"
          >×</button>
        </div>
      ))}
    </div>
  );
}
