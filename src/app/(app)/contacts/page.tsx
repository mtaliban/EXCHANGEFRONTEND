'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import { listContacts, getContactStats, logCall } from '@/lib/api';
import ContactStatCard from '@/components/ContactStatCard';
import Spinner from '@/components/Spinner';
import { useT } from '@/lib/i18n';
import { getInitial } from '@/lib/initials';
import { parseServerDate } from '@/lib/dates';

export default function ContactsPage() {
  const t = useT();
  const [contacts, setContacts] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [q, setQ] = useState('');
  const [loading, setLoading] = useState(true);
  const [openStat, setOpenStat] = useState<string | null>(null);

  useEffect(() => {
    listContacts().then((c) => { setContacts(c); setLoading(false); }).catch(() => setLoading(false));
    getContactStats().then(setStats).catch(() => {});
  }, []);

  async function call(c: any) {
    try { await logCall(c.user_id, 'initiated'); } catch {}
    window.location.href = `tel:${c.phone_primary}`;
  }

  const filtered = contacts.filter((c) =>
    c.full_name?.toLowerCase().includes(q.toLowerCase()) ||
    c.phone_primary?.includes(q)
  );

  return (
    <div className="p-4 md:p-6">
      <div className="mb-4">
        <h1 className="text-2xl font-bold text-brand-grey-900">{t('contacts.title')}</h1>
        <p className="text-brand-grey-500 text-sm mt-1">
          {t('contacts.subtitle')}
        </p>
      </div>

      {stats && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
          <ContactStatCard
            icon="📥" title={t('contacts.incoming_calls')} count={stats.incoming_calls.count}
            people={stats.incoming_calls.people}
            open={openStat === 'incoming_calls'} onToggle={() => setOpenStat(openStat === 'incoming_calls' ? null : 'incoming_calls')}
          />
          <ContactStatCard
            icon="💬" title={t('contacts.incoming_messages')} count={stats.incoming_messages.count}
            people={stats.incoming_messages.people}
            open={openStat === 'incoming_messages'} onToggle={() => setOpenStat(openStat === 'incoming_messages' ? null : 'incoming_messages')}
          />
          <ContactStatCard
            icon="📤" title={t('contacts.outgoing_calls')} count={stats.outgoing_calls.count}
            people={stats.outgoing_calls.people}
            open={openStat === 'outgoing_calls'} onToggle={() => setOpenStat(openStat === 'outgoing_calls' ? null : 'outgoing_calls')}
          />
          <ContactStatCard
            icon="✉️" title={t('contacts.outgoing_messages')} count={stats.outgoing_messages.count}
            people={stats.outgoing_messages.people}
            open={openStat === 'outgoing_messages'} onToggle={() => setOpenStat(openStat === 'outgoing_messages' ? null : 'outgoing_messages')}
          />
        </div>
      )}

      <input
        className="input mb-4"
        placeholder={t('contacts.search')}
        value={q}
        onChange={(e) => setQ(e.target.value)}
      />

      {loading && <div className="py-8"><Spinner label={t('msg.loading')} /></div>}
      {!loading && contacts.length === 0 && (
        <div className="card text-center py-16">
          <div className="text-5xl mb-3">📇</div>
          <p className="text-brand-grey-500 mb-4">{t('contacts.empty')}</p>
          <Link href="/dashboard" className="btn-primary">{t('contacts.start')}</Link>
        </div>
      )}

      {!loading && contacts.length > 0 && (
        <>
          <div className="text-xs text-brand-grey-500 mb-2">
            {filtered.length} {t('contacts.people')} {q ? `(${t('contacts.filtered_from')} ${contacts.length})` : ''}
          </div>

          <div className="bg-white rounded-2xl shadow-soft border border-brand-grey-100 overflow-hidden divide-y divide-brand-grey-100">
            {filtered.map((c) => (
              <div key={c.user_id} className="p-4 hover:bg-brand-grey-50 transition">
                <div className="flex items-start gap-3">
                  <div className="relative w-12 h-12 rounded-full bg-gradient-to-br from-brand-blue to-brand-orange flex items-center justify-center text-white font-bold flex-shrink-0">
                    {getInitial(c.full_name)}
                    {c.online && (
                      <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-green-400 border-2 border-white"></span>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-brand-grey-900 truncate text-base">
                      {c.full_name}
                    </div>

                    {/* Namba ya simu — inaonekana wazi */}
                    <a href={`tel:${c.phone_primary}`}
                       className="inline-flex items-center gap-1 mt-1 text-brand-blue font-semibold hover:underline">
                      📞 {c.phone_primary}
                    </a>

                    {c.cadre_display && (
                      <div className="text-xs text-brand-grey-500 mt-1">
                        {c.cadre_display}
                        {c.current_station?.district_name && (
                          <> • {c.current_station.district_name}, {c.current_station?.region_name}</>
                        )}
                      </div>
                    )}

                    <div className="text-[11px] text-brand-grey-400 mt-1 flex flex-wrap gap-3">
                      {c.last_message_at && (
                        <span>💬 {t('contacts.chat_time')} {formatDistanceToNow(parseServerDate(c.last_message_at) || new Date(), { addSuffix: true })}</span>
                      )}
                      {c.last_call_at && (
                        <span>📞 {t('contacts.call_time')} {formatDistanceToNow(parseServerDate(c.last_call_at) || new Date(), { addSuffix: true })}</span>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-col gap-2 flex-shrink-0">
                    <Link href={`/chats/${c.user_id}`}
                      className="min-w-[44px] min-h-[44px] px-3 py-2 rounded-lg bg-brand-blue text-white text-sm font-semibold hover:bg-brand-blue-700 transition active:scale-95 flex items-center justify-center"
                      title={t('chats.title')}>
                      💬 {t('contacts.chat')}
                    </Link>
                    <button onClick={() => call(c)}
                      className="min-w-[44px] min-h-[44px] px-3 py-2 rounded-lg bg-brand-orange text-white text-sm font-semibold hover:bg-brand-orange-600 transition active:scale-95 flex items-center justify-center"
                      title={t('contacts.call')}>
                      📞 {t('contacts.call')}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}


