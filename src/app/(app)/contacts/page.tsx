'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import { listContacts, logCall } from '@/lib/api';

export default function ContactsPage() {
  const [contacts, setContacts] = useState<any[]>([]);
  const [q, setQ] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    listContacts().then((c) => { setContacts(c); setLoading(false); }).catch(() => setLoading(false));
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
        <h1 className="text-2xl font-bold text-brand-grey-900">Niliowasiliana Nao</h1>
        <p className="text-brand-grey-500 text-sm mt-1">
          Watu wote uliochart nao au kupigiana simu — pamoja na namba zao zote.
        </p>
      </div>

      <input
        className="input mb-4"
        placeholder="🔍 Tafuta kwa jina au namba ya simu..."
        value={q}
        onChange={(e) => setQ(e.target.value)}
      />

      {loading && <div className="text-brand-grey-500 text-sm">Inapakia...</div>}
      {!loading && contacts.length === 0 && (
        <div className="card text-center py-16">
          <div className="text-5xl mb-3">📇</div>
          <p className="text-brand-grey-500 mb-4">Bado hujaongea na mtu yeyote.</p>
          <Link href="/dashboard" className="btn-primary">Anza kwenye Dashibodi</Link>
        </div>
      )}

      {!loading && contacts.length > 0 && (
        <>
          <div className="text-xs text-brand-grey-500 mb-2">
            {filtered.length} watu {q ? `(imefiltershwa kutoka ${contacts.length})` : ''}
          </div>

          <div className="bg-white rounded-2xl shadow-soft border border-brand-grey-100 overflow-hidden divide-y divide-brand-grey-100">
            {filtered.map((c) => (
              <div key={c.user_id} className="p-4 hover:bg-brand-grey-50 transition">
                <div className="flex items-start gap-3">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-brand-blue to-brand-orange flex items-center justify-center text-white font-bold flex-shrink-0">
                    {c.full_name?.charAt(0).toUpperCase()}
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
                        <span>💬 chat {formatDistanceToNow(new Date(c.last_message_at), { addSuffix: true })}</span>
                      )}
                      {c.last_call_at && (
                        <span>📞 simu {formatDistanceToNow(new Date(c.last_call_at), { addSuffix: true })}</span>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-col gap-2 flex-shrink-0">
                    <Link href={`/chats/${c.user_id}`}
                      className="px-3 py-2 rounded-lg bg-brand-blue text-white text-sm font-semibold hover:bg-brand-blue-700 transition"
                      title="Fungua chat">
                      💬 Chat
                    </Link>
                    <button onClick={() => call(c)}
                      className="px-3 py-2 rounded-lg bg-brand-orange text-white text-sm font-semibold hover:bg-brand-orange-600 transition"
                      title="Piga simu">
                      📞 Piga
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
