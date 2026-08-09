'use client';

import { useEffect, useState } from 'react';
import { getActiveAnnouncements, getNotifications, dismissAnnouncement, type Announcement } from '@/lib/api';
import { conversationTime } from '@/lib/dates';
import { useT } from '@/lib/i18n';

export default function AnnouncementsPage() {
  const t = useT();
  const [items, setItems] = useState<Announcement[]>([]);
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  async function reload() {
    try {
      const [a, n] = await Promise.all([
        getActiveAnnouncements(),
        getNotifications(50).catch(() => ({ notifications: [] })),
      ]);
      setItems(a.announcements);
      setHistory(n.notifications.filter((x: any) => x.type === 'announcement'));
    } finally { setLoading(false); }
  }

  useEffect(() => { reload(); }, []);

  async function dismiss(id: string) {
    try { await dismissAnnouncement(id); } catch {}
    setItems((prev) => prev.filter((x) => x.announcement_id !== id));
  }

  return (
    <div className="p-4 md:p-6 max-w-3xl">
      <div className="mb-4">
        <h1 className="text-2xl font-bold text-brand-grey-900">{t('annuser.title')}</h1>
        <p className="text-brand-grey-500 text-sm mt-1">
          {t('annuser.subtitle')}
        </p>
      </div>

      {loading && <div className="text-brand-grey-500 text-sm">{t('msg.loading')}</div>}

      {/* Active announcements */}
      <h2 className="font-semibold text-brand-grey-700 text-sm mb-2 mt-4">
        {t('annuser.active')} ({items.length})
      </h2>
      {!loading && items.length === 0 && (
        <div className="card text-center py-10">
          <div className="text-4xl mb-2">📭</div>
          <p className="text-brand-grey-500 text-sm">{t('annuser.empty')}</p>
        </div>
      )}
      <div className="space-y-3">
        {items.map((a) => (
          <div key={a.announcement_id} className="card">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="font-semibold text-brand-grey-900">{a.title}</div>
                <div className="text-xs text-brand-grey-500 mt-0.5">
                  {a.created_by_name || t('annuser.by')} · {conversationTime(a.created_at)}
                  {a.recipient_count ? ` · ${t('ann.for_people')} ${a.recipient_count}` : ''}
                </div>
              </div>
              <button
                onClick={() => dismiss(a.announcement_id)}
                className="text-xs px-3 py-1 rounded-full border border-brand-grey-300 text-brand-grey-500 hover:border-brand-red hover:text-brand-red transition flex-shrink-0"
              >
                {t('annuser.dismiss')}
              </button>
            </div>
            <p className="text-sm text-brand-grey-700 mt-2 whitespace-pre-wrap">{a.message}</p>
          </div>
        ))}
      </div>

      {/* History */}
      {history.length > 0 && (
        <>
          <h2 className="font-semibold text-brand-grey-700 text-sm mb-2 mt-8">{t('annuser.past')} ({history.length})</h2>
          <div className="space-y-2">
            {history.map((n) => (
              <div key={n.notification_id} className="bg-brand-grey-50 border border-brand-grey-100 rounded-xl p-3">
                <div className="font-medium text-sm text-brand-grey-900">{n.title}</div>
                <div className="text-xs text-brand-grey-500 mt-0.5">{n.body}</div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
