'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { listConversations, getPresence, bustGetCache, type Conversation } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { useLiveEvents } from '@/lib/useLiveEvents';
import { useLive } from '@/lib/liveSocket';
import { conversationTime } from '@/lib/dates';
import { useT } from '@/lib/i18n';
import { getInitial } from '@/lib/initials';
import Spinner from '@/components/Spinner';

export default function ChatsPage() {
  const t = useT();
  const { user } = useAuth();
  const [convs, setConvs] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const { messages } = useLiveEvents(user ? ['message.sent'] : []);
  // Live presence → green dots update instantly
  const onlineUserIds = useLive((s) => s.onlineUserIds);

  async function reload() {
    try {
      const data = await listConversations();
      setConvs(data);
    } finally { setLoading(false); }
  }

  // Seed the online set with current presence so dots show before any live event
  useEffect(() => {
    getPresence(true).then((p) => {
      p.online_user_ids.forEach((id) => useLive.getState().setOnline(id, true));
    }).catch(() => {});
  }, []);
  useEffect(() => { reload(); }, []);
  useEffect(() => {
    if (!messages.length) return;
    bustGetCache(); // FRESH — mazungumzo mapya yajitokeze papo hapo
    reload();
    /* eslint-disable-next-line */
  }, [messages.length]);

  return (
    <div className="p-4 md:p-6">
      <div className="mb-4">
        <h1 className="text-2xl font-bold text-brand-grey-900">{t('chats.title')}</h1>
        <p className="text-brand-grey-500 text-sm mt-1">
          {t('chats.subtitle')}
        </p>
      </div>

      {loading && <div className="py-8"><Spinner label={t('msg.loading')} /></div>}
      {!loading && convs.length === 0 && (
        <div className="card text-center py-16">
          <div className="text-5xl mb-3">💬</div>
          <p className="text-brand-grey-500 mb-4">{t('chats.empty')}</p>
          <Link href="/dashboard" className="btn-primary">{t('chats.find')}</Link>
        </div>
      )}

      {!loading && convs.length > 0 && (
        <>
          <div className="text-xs text-brand-grey-500 mb-2">{convs.length} {t('chats.count')}</div>
          <div className="bg-white rounded-2xl shadow-soft border border-brand-grey-100 overflow-hidden divide-y divide-brand-grey-100">
            {convs.map((c) => (
              <Link key={c.conversation_id} href={`/chats/${c.with_user_id}`}
                className="flex items-center gap-3 p-4 hover:bg-brand-grey-50 transition">
                <div className="relative flex-shrink-0">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-brand-blue to-brand-orange flex items-center justify-center text-white font-bold">
                    {getInitial(c.with_full_name)}
                  </div>
                  {onlineUserIds.has(c.with_user_id) && (
                    <span className="absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full bg-green-400 border-2 border-white"></span>
                  )}
                  {c.unread > 0 && (
                    <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-brand-red text-white text-xs font-bold flex items-center justify-center">
                      {c.unread > 9 ? '9+' : c.unread}
                    </span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-semibold text-brand-grey-900 truncate">{c.with_full_name}</span>
                    <span className="text-xs text-brand-grey-500 flex-shrink-0">
                      {c.last_message_at ? conversationTime(c.last_message_at) : ''}
                    </span>
                  </div>
                  {c.with_phone && (
                    <div className="text-xs text-brand-blue mt-0.5">📞 {c.with_phone}</div>
                  )}
                  <div className={`text-sm truncate mt-1 ${c.unread > 0 ? 'text-brand-grey-900 font-medium' : 'text-brand-grey-500'}`}>
                    {c.last_message_from === user?.user_id ? `${t('chats.you')} ` : ''}{c.last_message_text || '—'}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
