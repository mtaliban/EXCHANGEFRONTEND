'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import { listConversations, type Conversation } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { useMqttTopics } from '@/lib/useLiveEvents';

export default function ChatsPage() {
  const { user } = useAuth();
  const [convs, setConvs] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const { messages } = useMqttTopics(user ? [`kv/message/sent/${user.user_id}`] : []);

  async function reload() {
    try {
      const data = await listConversations();
      setConvs(data);
    } finally { setLoading(false); }
  }

  useEffect(() => { reload(); }, []);
  useEffect(() => { if (messages.length) reload(); /* eslint-disable-next-line */ }, [messages.length]);

  return (
    <div className="p-4 md:p-6">
      <div className="mb-4">
        <h1 className="text-2xl font-bold text-brand-grey-900">Niliochart Nao</h1>
        <p className="text-brand-grey-500 text-sm mt-1">
          Mazungumzo yako yote hapa — bofya moja kuendelea.
        </p>
      </div>

      {loading && <div className="text-brand-grey-500 text-sm">Inapakia...</div>}
      {!loading && convs.length === 0 && (
        <div className="card text-center py-16">
          <div className="text-5xl mb-3">💬</div>
          <p className="text-brand-grey-500 mb-4">Bado hujaanza mazungumzo yoyote.</p>
          <Link href="/dashboard" className="btn-primary">Tafuta Mtu wa Kubadilishana</Link>
        </div>
      )}

      {!loading && convs.length > 0 && (
        <>
          <div className="text-xs text-brand-grey-500 mb-2">{convs.length} mazungumzo</div>
          <div className="bg-white rounded-2xl shadow-soft border border-brand-grey-100 overflow-hidden divide-y divide-brand-grey-100">
            {convs.map((c) => (
              <Link key={c.conversation_id} href={`/chats/${c.with_user_id}`}
                className="flex items-center gap-3 p-4 hover:bg-brand-grey-50 transition">
                <div className="relative flex-shrink-0">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-brand-blue to-brand-orange flex items-center justify-center text-white font-bold">
                    {c.with_full_name?.charAt(0).toUpperCase()}
                  </div>
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
                      {c.last_message_at ? formatDistanceToNow(new Date(c.last_message_at), { addSuffix: true }) : ''}
                    </span>
                  </div>
                  {c.with_phone && (
                    <div className="text-xs text-brand-blue mt-0.5">📞 {c.with_phone}</div>
                  )}
                  <div className={`text-sm truncate mt-1 ${c.unread > 0 ? 'text-brand-grey-900 font-medium' : 'text-brand-grey-500'}`}>
                    {c.last_message_from === user?.user_id ? 'Wewe: ' : ''}{c.last_message_text || '—'}
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
