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

  const filtered = contacts.filter((c) => c.full_name?.toLowerCase().includes(q.toLowerCase()) || c.phone_primary?.includes(q));

  return (
    <div className="p-4 md:p-6">
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <h1 className="text-2xl font-bold text-brand-grey-900">Watu Niliowasiliana Nao</h1>
        <span className="badge-gold">{contacts.length}</span>
      </div>

      <input
        className="input mb-4"
        placeholder="🔍 Tafuta kwa jina au simu..."
        value={q}
        onChange={(e) => setQ(e.target.value)}
      />

      {loading && <div className="text-brand-grey-500 text-sm">Inapakia...</div>}
      {!loading && contacts.length === 0 && (
        <div className="card text-center py-16">
          <div className="text-5xl mb-3">👥</div>
          <p className="text-brand-grey-500 mb-4">Bado hujaongea na mtu yeyote.</p>
          <Link href="/dashboard" className="btn-primary">Anza kwenye Dashibodi</Link>
        </div>
      )}

      <div className="bg-white rounded-2xl shadow-soft border border-brand-grey-100 overflow-hidden">
        {filtered.map((c) => (
          <div key={c.user_id} className="flex items-center gap-3 p-3 border-b border-brand-grey-100 last:border-0 hover:bg-brand-grey-50">
            <div className="w-11 h-11 rounded-full bg-gradient-to-br from-brand-blue to-brand-orange flex items-center justify-center text-white font-bold flex-shrink-0">
              {c.full_name?.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-semibold text-brand-grey-900 truncate">{c.full_name}</div>
              <div className="text-xs text-brand-grey-500 truncate">
                {c.cadre_display || 'Mtumishi'} • {c.current_station?.district_name || ''}
              </div>
              <div className="text-[11px] text-brand-grey-400 mt-0.5">
                {c.last_message_at && <>💬 {formatDistanceToNow(new Date(c.last_message_at), { addSuffix: true })} </>}
                {c.last_call_at && <>📞 {formatDistanceToNow(new Date(c.last_call_at), { addSuffix: true })}</>}
              </div>
            </div>
            <div className="flex gap-1 flex-shrink-0">
              <Link href={`/chats/${c.user_id}`} className="p-2 text-brand-blue hover:bg-brand-blue-50 rounded-lg" title="Chat">💬</Link>
              <button onClick={() => call(c)} className="p-2 text-brand-orange hover:bg-brand-orange-50 rounded-lg" title="Piga">📞</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
