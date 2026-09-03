'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useAuth } from '@/lib/auth';
import { getAdminContacts, bustGetCache } from '@/lib/api';
import { useI18n, useT } from '@/lib/i18n';
import { Phone, MessageSquare, Globe, ArrowLeftRight, Clock, Filter, Users } from 'lucide-react';
import Spinner from '@/components/Spinner';

const CONTACT_ICONS: Record<string, { icon: any; color: string; label: string }> = {
  call: { icon: Phone, color: 'text-green-600 bg-green-50 dark:bg-green-950', label: 'Simu' },
  sms: { icon: MessageSquare, color: 'text-blue-600 bg-blue-50 dark:bg-blue-950', label: 'SMS' },
  whatsapp: { icon: Globe, color: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950', label: 'WhatsApp' },
};

export default function AdminContactsPage() {
  const t = useT();
  const { user } = useAuth();
  const [contacts, setContacts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState<string>('');
  const [search, setSearch] = useState('');
  const [sseConnected, setSseConnected] = useState(false);
  const evtSourceRef = useRef<EventSource | null>(null);

  const loadContacts = useCallback(async (bust = false) => {
    try {
      const data = await getAdminContacts(200, bust);
      setContacts(data.contacts || []);
    } catch { /* */ } finally {
      setLoading(false);
    }
  }, []);

  // Initial load
  useEffect(() => { loadContacts(true); }, [loadContacts]);

  // Real-time SSE — admin live events
  useEffect(() => {
    const token = localStorage.getItem('kv_auth');
    if (!token) return;
    try {
      const parsed = JSON.parse(token);
      const accessToken = parsed?.state?.token;
      if (!accessToken) return;

      const sse = new EventSource(`/admin/live-events?token=${accessToken}`);
      evtSourceRef.current = sse;

      sse.onmessage = () => {
        // Any admin SSE event → reload contacts
        bustGetCache();
        loadContacts(true);
      };

      sse.onerror = () => {
        setSseConnected(false);
        sse.close();
        // Reconnect after 3s
        setTimeout(() => {
          if (evtSourceRef.current === sse) {
            evtSourceRef.current = null;
          }
        }, 3000);
      };

      sse.onopen = () => setSseConnected(true);

      return () => { sse.close(); evtSourceRef.current = null; };
    } catch { /* */ }
  }, [loadContacts]);

  // Filter + search
  const filtered = contacts.filter((c) => {
    if (filterType && c.contact_type !== filterType) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      return (
        (c.from_full_name || '').toLowerCase().includes(q) ||
        (c.to_full_name || '').toLowerCase().includes(q) ||
        (c.from_phone || '').includes(q) ||
        (c.to_phone || '').includes(q)
      );
    }
    return true;
  });

  // Stats
  const stats = {
    total: contacts.length,
    calls: contacts.filter((c) => c.contact_type === 'call').length,
    sms: contacts.filter((c) => c.contact_type === 'sms').length,
    whatsapp: contacts.filter((c) => c.contact_type === 'whatsapp').length,
  };

  function formatTime(ts: string) {
    if (!ts) return '—';
    const d = new Date(ts);
    return d.toLocaleString('sw-TZ', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Users size={20} className="text-brand-blue" />
          <h1 className="text-lg font-bold text-brand-grey-900 dark:text-white">Waliopigiana</h1>
          {sseConnected && (
            <span className="flex items-center gap-1 text-[10px] font-bold text-green-600 bg-green-50 dark:bg-green-950 px-2 py-0.5 rounded-full">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" /> LIVE
            </span>
          )}
        </div>
        <span className="text-xs font-semibold text-brand-grey-500">{filtered.length} / {contacts.length}</span>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-4 gap-2">
        {[
          { key: '', label: 'Zote', count: stats.total, color: 'bg-brand-blue-50 text-brand-blue-700 dark:bg-brand-blue-950 dark:text-brand-blue-300' },
          { key: 'call', label: 'Simu', count: stats.calls, color: 'bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-300' },
          { key: 'sms', label: 'SMS', count: stats.sms, color: 'bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300' },
          { key: 'whatsapp', label: 'WA', count: stats.whatsapp, color: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300' },
        ].map((s) => (
          <button key={s.key} type="button" onClick={() => setFilterType(s.key)}
            className={`rounded-lg px-2.5 py-2 text-center border transition ${filterType === s.key ? 'border-brand-blue ring-1 ring-brand-blue/30' : 'border-brand-grey-200 dark:border-brand-grey-600'} ${s.color}`}>
            <div className="text-lg font-bold">{s.count}</div>
            <div className="text-[10px] font-semibold">{s.label}</div>
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="relative">
        <input type="text" className="input text-xs py-1.5 w-full pl-8" placeholder="Tafuta kwa jina au namba..."
          value={search} onChange={(e) => setSearch(e.target.value)} />
        <Filter size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-brand-grey-400" />
      </div>

      {/* List */}
      {loading ? (
        <div className="py-8"><Spinner label="Inapakia..." /></div>
      ) : filtered.length === 0 ? (
        <div className="card text-center py-8">
          <Phone size={24} className="mx-auto text-brand-grey-300 mb-2" />
          <p className="text-sm font-semibold text-brand-grey-600">Hakuna mawasiliano bado</p>
          <p className="text-xs text-brand-grey-400 mt-1">Watumiaji wataonekana hapa wanapotuma SIMU, SMS, au WhatsApp</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((c) => {
            const ci = CONTACT_ICONS[c.contact_type] || CONTACT_ICONS.call;
            const Icon = ci.icon;
            return (
              <div key={c.call_id} className="bg-white dark:bg-brand-grey-900 border border-brand-grey-200 dark:border-brand-grey-600 rounded-xl p-3 flex items-center gap-3 hover:border-brand-blue/30 transition">
                {/* Contact type badge */}
                <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${ci.color}`}>
                  <Icon size={16} />
                </div>

                {/* Details */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 text-[12px]">
                    <span className="font-bold text-brand-grey-900 dark:text-white truncate">{c.from_full_name}</span>
                    <ArrowLeftRight size={10} className="text-brand-grey-400 flex-shrink-0" />
                    <span className="font-bold text-brand-grey-900 dark:text-white truncate">{c.to_full_name}</span>
                  </div>
                  <div className="flex items-center gap-2 text-[10px] text-brand-grey-500 mt-0.5">
                    <span>{ci.label}</span>
                    <span>•</span>
                    <span>{c.from_category === 'education' ? 'Elimu' : 'Afya'} → {c.to_category === 'education' ? 'Elimu' : 'Afya'}</span>
                    {c.from_region && <><span>•</span><span>{c.from_region}</span></>}
                  </div>
                </div>

                {/* Time */}
                <div className="text-right flex-shrink-0">
                  <div className="text-[10px] font-medium text-brand-grey-500 flex items-center gap-1">
                    <Clock size={10} /> {formatTime(c.initiated_at)}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
