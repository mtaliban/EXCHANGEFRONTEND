'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import clsx from 'clsx';
import { useAuth } from '@/lib/auth';
import { useLiveEvents } from '@/lib/useLiveEvents';
import { getAnnouncementUnread, getActiveAnnouncements, dismissAnnouncement, bustGetCache, type Announcement } from '@/lib/api';
import { Megaphone as MegaphoneIcon } from 'lucide-react';
import { useT } from '@/lib/i18n';

/** 📢 icon juu — matangazo ya admin. User anaweza kukubali au kuyafuta (dismiss). */
export default function Megaphone({ dark }: { dark?: boolean }) {
  const t = useT();
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [unread, setUnread] = useState(0);
  const [items, setItems] = useState<Announcement[]>([]);
  const { messages } = useLiveEvents(user ? ['announcement'] : []);

  async function reload() {
    try {
      const [u, list] = await Promise.all([getAnnouncementUnread(), getActiveAnnouncements()]);
      setUnread(u.unread);
      setItems(list.announcements);
    } catch {}
  }

  useEffect(() => { reload(); }, []);
  // Live: tangazo jipya linapofika bump badge + list papo hapo (FRESH data)
  useEffect(() => {
    if (!messages.length) return;
    bustGetCache();
    reload();
  }, [messages.length]);

  async function dismiss(id: string) {
    try { await dismissAnnouncement(id); } catch {}
    setItems((prev) => prev.filter((a) => a.announcement_id !== id));
    setUnread((u) => Math.max(0, u - 1));
  }

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className={clsx('relative p-1.5 rounded-md text-base leading-none transition',
          dark ? 'hover:bg-brand-grey-800' : 'hover:bg-brand-grey-100')}
        title={t('mega.announcements')}
      >
        <MegaphoneIcon size={18} strokeWidth={2.2} className={dark ? 'text-white' : 'text-brand-grey-700'} />
        {unread > 0 && (
          <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-brand-orange text-white text-[10px] font-bold flex items-center justify-center">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-30" onClick={() => setOpen(false)} />
          <div className="absolute right-0 mt-2 w-80 rounded-xl shadow-xl border z-40 overflow-hidden bg-white dark:bg-brand-grey-950 border-brand-grey-100 dark:border-brand-grey-700">
            <div className="flex items-center justify-between px-3 py-2 border-b border-brand-grey-100 dark:border-brand-grey-700">
              <span className="font-semibold text-sm text-brand-grey-900 dark:text-white">{t('mega.title')}</span>
              <Link href="/announcements" onClick={() => setOpen(false)}
                className="text-xs text-brand-blue hover:underline">{t('mega.view_all')}</Link>
            </div>
            <div className="max-h-80 overflow-y-auto divide-y divide-brand-grey-100">
              {items.length === 0 && (
                <div className="p-4 text-sm text-brand-grey-500 text-center">{t('mega.empty')}</div>
              )}
              {items.map((a) => (
                <div key={a.announcement_id} className="p-3 hover:bg-brand-grey-50 dark:hover:bg-brand-grey-800">
                  <div className="flex items-start justify-between gap-2">
                    <div className="font-semibold text-sm text-brand-grey-900">{a.title}</div>
                    <button
                      onClick={() => dismiss(a.announcement_id)}
                      className="text-xs px-2 py-0.5 rounded-full border border-brand-grey-300 text-brand-grey-500 hover:border-brand-red hover:text-brand-red transition flex-shrink-0"
                      title={t('mega.dismiss')}
                    >
                      ✕
                    </button>
                  </div>
                  <div className="text-xs text-brand-grey-500 dark:text-brand-grey-400 mt-1 line-clamp-2">{a.message}</div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
