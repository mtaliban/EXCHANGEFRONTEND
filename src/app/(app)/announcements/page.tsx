'use client';

import { useEffect, useState } from 'react';
import { getActiveAnnouncements, getNotifications, dismissAnnouncement, bustGetCache, type Announcement } from '@/lib/api';
import { conversationTime } from '@/lib/dates';
import { useT } from '@/lib/i18n';
import { useLive } from '@/lib/liveSocket';
import Spinner from '@/components/Spinner';
import { Megaphone, X, Clock, Users, Inbox, ChevronDown, ChevronUp, ChevronLeft, ChevronRight } from 'lucide-react';

const PAGE_SIZE = 2;

export default function AnnouncementsPage() {
  const t = useT();
  const [items, setItems] = useState<Announcement[]>([]);
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedHistory, setExpandedHistory] = useState<Set<string>>(new Set());
  const [activePage, setActivePage] = useState(1);
  const [historyPage, setHistoryPage] = useState(1);
  const [dismissing, setDismissing] = useState<string | null>(null);

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

  const { subscribe } = useLive();
  useEffect(() => {
    const un = subscribe('announcement', () => {
      bustGetCache();
      reload();
    });
    return () => un();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [subscribe]);

  // Dismiss — ondoa papo hapo (haraka kabisa)
  async function dismiss(id: string) {
    setDismissing(id);
    // Ondoa papo hapo (optimistic update) — usisubiri API
    setItems((prev) => prev.filter((x) => x.announcement_id !== id));
    try { await dismissAnnouncement(id); } catch {}
    setDismissing(null);
  }

  function toggleHistory(id: string) {
    setExpandedHistory((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }

  return (
    <div className="p-4 md:p-6 max-w-3xl">
      {/* Header — official */}
      <div className="mb-5">
        <h1 className="text-2xl font-bold text-brand-grey-900 flex items-center gap-2">
          <Megaphone size={22} className="text-brand-blue" />
          {t('annuser.title')}
        </h1>
        <p className="text-brand-grey-500 text-sm mt-1">
          {t('annuser.subtitle')}
        </p>
      </div>

      {loading && <div className="py-8"><Spinner label={t('msg.loading')} /></div>}

      {/* Active announcements — official cards */}
      <h2 className="text-[11px] font-bold uppercase tracking-wider text-brand-grey-500 mb-3 mt-4 flex items-center gap-1.5">
        <Megaphone size={13} /> {t('annuser.active')} ({items.length})
      </h2>
      {!loading && items.length === 0 && (
        <div className="bg-white rounded-xl border border-brand-grey-200 text-center py-10">
          <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-brand-grey-100 flex items-center justify-center">
            <Inbox size={24} className="text-brand-grey-400" />
          </div>
          <p className="text-brand-grey-500 text-sm font-medium">{t('annuser.empty')}</p>
        </div>
      )}
      <div className="space-y-3">
        {items.slice((activePage - 1) * PAGE_SIZE, activePage * PAGE_SIZE).map((a) => (
          <div key={a.announcement_id}
            className="bg-white rounded-xl border border-brand-grey-200 p-4 transition hover:shadow-sm">
            {/* Title + dismiss */}
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <h3 className="font-bold text-brand-grey-900 text-[15px] leading-snug">{a.title}</h3>
                <div className="flex items-center gap-3 flex-wrap mt-1.5 text-[11px] text-brand-grey-500">
                  <span className="inline-flex items-center gap-1">
                    <Users size={11} className="text-brand-blue" />
                    {a.created_by_name || t('annuser.by')}
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <Clock size={11} />
                    {conversationTime(a.created_at)}
                  </span>
                  {a.recipient_count ? (
                    <span className="inline-flex items-center gap-1 text-brand-blue font-semibold">
                      <Users size={11} />
                      {a.recipient_count} walengwa
                    </span>
                  ) : null}
                </div>
              </div>
              {/* X button — dismiss papo hapo */}
              <button
                onClick={() => dismiss(a.announcement_id)}
                disabled={dismissing === a.announcement_id}
                className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-brand-grey-100 text-brand-grey-500 hover:bg-brand-red-50 hover:text-brand-red transition flex-shrink-0 disabled:opacity-40"
                title="Ondoa">
                <X size={14} />
              </button>
            </div>
            {/* Message — clear, official */}
            <p className="text-sm text-brand-grey-800 mt-3 whitespace-pre-wrap leading-relaxed">{a.message}</p>
          </div>
        ))}
      </div>

      {/* Active pagination */}
      {items.length > PAGE_SIZE && (
        <div className="flex items-center justify-center gap-2 pt-3">
          <button disabled={activePage <= 1} onClick={() => setActivePage(activePage - 1)}
            className="inline-flex items-center justify-center w-8 h-8 rounded-full border border-brand-grey-200 text-brand-grey-600 disabled:opacity-40 hover:border-brand-blue hover:text-brand-blue transition">
            <ChevronLeft size={16} />
          </button>
          <span className="text-xs font-bold text-brand-grey-500 px-2">{activePage} / {Math.ceil(items.length / PAGE_SIZE)}</span>
          <button disabled={activePage >= Math.ceil(items.length / PAGE_SIZE)} onClick={() => setActivePage(activePage + 1)}
            className="inline-flex items-center justify-center w-8 h-8 rounded-full border border-brand-grey-200 text-brand-grey-600 disabled:opacity-40 hover:border-brand-blue hover:text-brand-blue transition">
            <ChevronRight size={16} />
          </button>
        </div>
      )}

      {/* History — paginated, official */}
      {history.length > 0 && (
        <>
          <h2 className="text-[11px] font-bold uppercase tracking-wider text-brand-grey-500 mb-3 mt-8 flex items-center gap-1.5">
            <Clock size={13} /> {t('annuser.past')} ({history.length})
          </h2>
          <div className="space-y-2">
            {history.slice((historyPage - 1) * PAGE_SIZE, historyPage * PAGE_SIZE).map((n) => (
              <div key={n.notification_id} className="bg-white border border-brand-grey-200 rounded-xl overflow-hidden">
                <button
                  onClick={() => toggleHistory(n.notification_id)}
                  className="w-full flex items-center justify-between gap-2 px-4 py-3 text-left hover:bg-brand-grey-50 transition">
                  <div className="min-w-0 flex-1">
                    <div className="font-semibold text-sm text-brand-grey-900 flex items-center gap-1.5">
                      <Megaphone size={12} className="text-brand-blue flex-shrink-0" />
                      {n.title}
                    </div>
                    {!expandedHistory.has(n.notification_id) && (
                      <div className="text-xs text-brand-grey-500 mt-0.5 line-clamp-1">{n.body}</div>
                    )}
                  </div>
                  <span className="text-brand-grey-400 flex-shrink-0">
                    {expandedHistory.has(n.notification_id) ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                  </span>
                </button>
                {expandedHistory.has(n.notification_id) && (
                  <div className="px-4 pb-3 border-t border-brand-grey-200 pt-2">
                    <p className="text-sm text-brand-grey-800 whitespace-pre-wrap leading-relaxed">{n.body}</p>
                    <div className="text-[11px] text-brand-grey-400 mt-2 flex items-center gap-1">
                      <Clock size={10} /> {conversationTime(n.created_at)}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
          {history.length > PAGE_SIZE && (
            <div className="flex items-center justify-center gap-2 pt-3">
              <button disabled={historyPage <= 1} onClick={() => setHistoryPage(historyPage - 1)}
                className="inline-flex items-center justify-center w-8 h-8 rounded-full border border-brand-grey-200 text-brand-grey-600 disabled:opacity-40 hover:border-brand-blue hover:text-brand-blue transition">
                <ChevronLeft size={16} />
              </button>
              <span className="text-xs font-bold text-brand-grey-500 px-2">{historyPage} / {Math.ceil(history.length / PAGE_SIZE)}</span>
              <button disabled={historyPage >= Math.ceil(history.length / PAGE_SIZE)} onClick={() => setHistoryPage(historyPage + 1)}
                className="inline-flex items-center justify-center w-8 h-8 rounded-full border border-brand-grey-200 text-brand-grey-600 disabled:opacity-40 hover:border-brand-blue hover:text-brand-blue transition">
                <ChevronRight size={16} />
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
