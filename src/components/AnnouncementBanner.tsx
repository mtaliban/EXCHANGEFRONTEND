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
          className="rounded-lg border border-brand-grey-200 dark:border-brand-grey-700 bg-white dark:bg-brand-grey-900 px-4 py-3 animate-slide-in flex items-start gap-3 shadow-sm">
          <Megaphone size={16} className="text-brand-grey-400 flex-shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <div className="font-bold text-brand-blue text-[13px] leading-snug">{a.title}</div>
            <p className="text-brand-grey-900 dark:text-brand-grey-100 text-[12px] mt-1 leading-relaxed whitespace-pre-wrap">{a.message}</p>
          </div>
          <button
            onClick={() => dismiss(a.announcement_id)}
            className="text-brand-grey-400 hover:text-brand-grey-700 text-sm font-bold leading-none flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-lg hover:bg-brand-grey-100 dark:hover:bg-brand-grey-800 transition border border-brand-grey-200 dark:border-brand-grey-700"
            title="Funga"
          >×</button>
        </div>
      ))}
    </div>
  );
}
