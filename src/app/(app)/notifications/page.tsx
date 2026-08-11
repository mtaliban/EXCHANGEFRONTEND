'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { formatDistanceToNowStrict } from 'date-fns';
import { getNotifications, getUnreadCount, markAllNotificationsRead, markNotificationRead, bustGetCache, type AppNotification } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { useUnreadStore } from '@/lib/unreadStore';
import { parseServerDate } from '@/lib/dates';
import { useLiveEvents } from '@/lib/useLiveEvents';
import { NOTIFICATION_TYPE_META, DEFAULT_NOTIFICATION_ICON, notificationRoute } from '@/lib/notifications';
import { useT } from '@/lib/i18n';
import { Bell, BellOff } from 'lucide-react';

const COLOR_BG: Record<string, string> = {
  blue: 'bg-brand-blue-50 text-brand-blue border-brand-blue',
  orange: 'bg-brand-orange-50 text-brand-orange border-brand-orange',
  red: 'bg-brand-red-50 text-brand-red border-brand-red',
  gold: 'bg-brand-gold-50 text-brand-gold-600 border-brand-gold',
};

export default function NotificationsPage() {
  const t = useT();
  const router = useRouter();
  const { user } = useAuth();
  const isAdmin = (user as any)?.is_admin;
  const [notifs, setNotifs] = useState<AppNotification[]>([]);
  const [total, setTotal] = useState(0);
  const [unread, setUnread] = useState(0);
  const unreadStoreSet = useUnreadStore((s) => s.set);
  const unreadStoreRefresh = useUnreadStore((s) => s.refresh);
  const { messages } = useLiveEvents(user ? ['notification'] : []);

  async function load() {
    try {
      const [data, count] = await Promise.all([getNotifications(100), getUnreadCount(true)]);
      setNotifs(data.notifications);
      setTotal(data.total);
      setUnread(count.unread);
      unreadStoreSet(count.unread); // kengele juu iwe sahihi PAPO HAPO
    } catch {}
  }

  useEffect(() => { load(); }, []);
  useEffect(() => {
    if (!messages.length) return;
    bustGetCache(); // data FRESH — usirudishe arifa za kale
    load();
    /* eslint-disable-next-line */
  }, [messages.length]);

  async function open(n: AppNotification) {
    if (!n.read) {
      // Soma PAPO HAPO (hakuna haja ya kubofya "Nimesoma zote") + UI inabadilika
      await markNotificationRead(n.notification_id).catch(() => {});
      setNotifs((prev) => prev.map((x) => (x.notification_id === n.notification_id ? { ...x, read: true } : x)));
      setUnread((u) => Math.max(0, u - 1));
      unreadStoreRefresh(); // kengele juu ipungue mara moja
    }
    const dest = notificationRoute(n.type, n.data, isAdmin);
    if (dest.startsWith('tel:')) {
      // Call notification → mpigie moja kwa moja (simu ya mfumo inafunguka)
      window.location.href = dest;
      return;
    }
    router.push(dest);
  }

  async function readAll() {
    await markAllNotificationsRead().catch(() => {});
    setUnread(0);
    unreadStoreSet(0); // kengele juu isifanye "9+" tena
    setNotifs((prev) => prev.map((n) => ({ ...n, read: true })));
  }

  return (
    <div className="p-4 md:p-6 max-w-3xl mx-auto space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h1 className="text-2xl font-bold text-brand-grey-900 flex items-center gap-2">
            <Bell size={24} strokeWidth={2.2} className="text-brand-blue" />
            {t('notif.title')}
          </h1>
          <p className="text-brand-grey-500 text-sm mt-1">
            {t('notif.subtitle')}
          </p>
        </div>
        {unread > 0 && (
          <button onClick={readAll} className="btn-primary text-sm">{t('notif.mark_all')} ({unread})</button>
        )}
      </div>

      {notifs.length === 0 && (
        <div className="card text-center py-16">
          <div className="w-14 h-14 mx-auto mb-3 rounded-full bg-brand-grey-100 flex items-center justify-center">
            <BellOff size={28} className="text-brand-grey-400" />
          </div>
          <p className="text-brand-grey-500">{t('notif.empty')}</p>
        </div>
      )}

      <div className="bg-white rounded-2xl shadow-soft border border-brand-grey-100 overflow-hidden divide-y divide-brand-grey-100">
        {notifs.map((n) => {
          const meta = NOTIFICATION_TYPE_META[n.type];
          const Icon = meta?.icon || DEFAULT_NOTIFICATION_ICON;
          const bg = (meta && COLOR_BG[meta.color]) || 'bg-brand-grey-100 text-brand-grey-500 border-brand-grey-300';
          return (
            <button
              key={n.notification_id}
              onClick={() => open(n)}
              className={`w-full text-left p-4 flex items-start gap-3 transition hover:bg-brand-grey-50 ${n.read ? 'opacity-60' : ''}`}
            >
              <div className={`w-10 h-10 rounded-full border-2 ${bg} flex items-center justify-center flex-shrink-0`}>
                <Icon size={20} strokeWidth={2.2} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start gap-2">
                  <span className="font-semibold text-brand-grey-900 text-sm break-words min-w-0 flex-1">{n.title}</span>
                  {!n.read && <span className="w-2 h-2 rounded-full bg-brand-blue flex-shrink-0 mt-1.5" />}
                </div>
                <div className="text-xs text-brand-grey-500 mt-0.5 line-clamp-2">{n.body}</div>
                <div className="text-[10px] text-brand-grey-400 mt-1">
                  {formatDistanceToNowStrict(parseServerDate(n.created_at) || new Date(), { addSuffix: true })}
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {total > notifs.length && (
        <div className="text-center text-xs text-brand-grey-400">{t('notif.more')} {total - notifs.length} {t('notif.returned')}</div>
      )}
    </div>
  );
}
