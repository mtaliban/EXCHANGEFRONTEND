'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth';
import { useLiveEvents } from '@/lib/useLiveEvents';
import { getActiveAnnouncements, dismissAnnouncement, bustGetCache, type Announcement } from '@/lib/api';
import { Megaphone, X, Clock, Users } from 'lucide-react';
import { conversationTime } from '@/lib/dates';

/**
 * Matangazo yaonekana pale juu kabisa (banner) — FULL WIDTH, professional.
 * Ujumbe mrefu hufunguka PALE PALE (Soma zaidi / Funga).
 * Hubadilika live kupitia MQTT/WS.
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
    bustGetCache();
    reload();
  }, [messages.length]);

  if (!items.length) return null;

  async function dismiss(id: string) {
    setItems((prev) => prev.filter((a) => a.announcement_id !== id));
    try { await dismissAnnouncement(id); } catch {}
  }

  function toggle(id: string) {
    setExpanded((prev) => ({ ...prev, [id]: !prev[id] }));
  }

  return (
    <div className="space-y-3">
      {items.map((a) => {
        const isOpen = !!expanded[a.announcement_id];
        const long = (a.message || '').length > 160;
        return (
          <div key={a.announcement_id}
            className="w-full rounded-xl border border-brand-blue-200 dark:border-brand-blue-800 bg-gradient-to-r from-brand-blue-50 to-white dark:from-brand-blue-950 dark:to-brand-grey-900 shadow-soft overflow-hidden">
            {/* Header bar */}
            <div className="flex items-center justify-between gap-3 px-4 py-2.5 bg-brand-blue/5 border-b border-brand-blue-100 dark:border-brand-blue-900">
              <div className="flex items-center gap-2 min-w-0">
                <div className="w-8 h-8 rounded-full bg-brand-blue flex items-center justify-center flex-shrink-0">
                  <Megaphone size={16} className="text-white" />
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="text-sm font-extrabold text-brand-grey-900 dark:text-white truncate">{a.title}</h3>
                  <div className="flex items-center gap-2 text-[10px] text-brand-grey-500 flex-wrap">
                    {a.created_by_name && (
                      <span className="flex items-center gap-1">
                        <Users size={9} /> {a.created_by_name}
                      </span>
                    )}
                    {a.created_at && (
                      <span className="flex items-center gap-1">
                        <Clock size={9} /> {conversationTime(a.created_at)}
                      </span>
                    )}
                    {a.recipient_count ? (
                      <span className="font-semibold text-brand-blue">{a.recipient_count} walengwa</span>
                    ) : null}
                  </div>
                </div>
              </div>
              <button
                onClick={() => dismiss(a.announcement_id)}
                className="w-7 h-7 rounded-full bg-brand-grey-100 dark:bg-brand-grey-800 text-brand-grey-500 hover:bg-brand-red-50 hover:text-brand-red transition flex items-center justify-center flex-shrink-0"
                title="Ondoa">
                <X size={14} />
              </button>
            </div>

            {/* Message body */}
            <div className="px-4 py-3">
              <p className={`text-sm text-brand-grey-800 dark:text-brand-grey-200 whitespace-pre-wrap break-words leading-relaxed ${isOpen ? '' : 'line-clamp-2'}`}>
                {a.message}
              </p>
              {long && (
                <button
                  onClick={() => toggle(a.announcement_id)}
                  className="text-xs font-bold text-brand-blue hover:underline mt-2"
                >
                  {isOpen ? '▲ Funga' : '▼ Soma zaidi'}
                </button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
