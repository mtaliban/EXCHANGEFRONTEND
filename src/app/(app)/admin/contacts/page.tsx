'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useAuth } from '@/lib/auth';
import { getAdminContacts, bustGetCache } from '@/lib/api';
import { useT } from '@/lib/i18n';
import { parseServerDate } from '@/lib/dates';
import {
  Phone, MessageSquare, Globe, ArrowLeftRight, Clock, Filter,
  Users, TrendingUp, ChevronRight,
} from 'lucide-react';
import Spinner from '@/components/Spinner';

const CONTACT_CONFIG: Record<string, { icon: any; color: string; label: string; bg: string }> = {
  call:    { icon: Phone,         color: 'text-green-700',   bg: 'bg-green-50 border-green-200',   label: 'Simu' },
  sms:     { icon: MessageSquare, color: 'text-blue-700',    bg: 'bg-blue-50 border-blue-200',     label: 'SMS' },
  whatsapp:{ icon: Globe,         color: 'text-emerald-700', bg: 'bg-emerald-50 border-emerald-200', label: 'WhatsApp' },
};

export default function AdminContactsPage() {
  const t = useT();
  const { user } = useAuth();
  const [contacts, setContacts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [sseConnected, setSseConnected] = useState(false);
  const lastEvent = useRef(0);
  const PAGE_SIZE = 20;

  const loadContacts = useCallback(async (bust = false) => {
    try {
      const data = await getAdminContacts(300, bust);
      setContacts(data.contacts || []);
    } catch { /* */ } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadContacts(true); }, [loadContacts]);

  // Real-time SSE — admin live events
  useEffect(() => {
    const raw = localStorage.getItem('kv_auth');
    if (!raw) return;
    let token: string | null = null;
    try { token = JSON.parse(raw)?.state?.token || null; } catch {}
    if (!token) return;
    let stopped = false;
    let retry: any = null;
    let aborter: AbortController | null = null;

    async function connect() {
      try {
        aborter = new AbortController();
        const res = await fetch(`/admin/live-events?token=${token}`, { signal: aborter.signal });
        if (!res.ok || !res.body) throw new Error('sse failed');
        setSseConnected(true);
        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';
        while (!stopped) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          let idx;
          while ((idx = buffer.indexOf('\n\n')) !== -1) {
            const chunk = buffer.slice(0, idx);
            buffer = buffer.slice(idx + 2);
            const line = chunk.split('\n').find((l) => l.startsWith('data: '));
            if (line) {
              const now = Date.now();
              if (now - lastEvent.current > 1500) {
                lastEvent.current = now;
                bustGetCache();
                loadContacts(true);
              }
            }
          }
        }
      } catch { /* */ }
      if (!stopped) {
        setSseConnected(false);
        retry = setTimeout(connect, 3000);
      }
    }
    connect();
    return () => { stopped = true; aborter?.abort(); if (retry) clearTimeout(retry); setSseConnected(false); };
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

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const pageItems = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  // Stats
  const stats = {
    total: contacts.length,
    calls: contacts.filter((c) => c.contact_type === 'call').length,
    sms: contacts.filter((c) => c.contact_type === 'sms').length,
    whatsapp: contacts.filter((c) => c.contact_type === 'whatsapp').length,
  };

  function formatTime(ts: string) {
    if (!ts) return '—';
    const d = parseServerDate(ts) || new Date(ts);
    return d.toLocaleString('sw-TZ', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  }

  if (loading) return <div className="p-10"><Spinner label={t('msg.loading')} /></div>;

  return (
    <div className="p-4 md:p-6 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h1 className="text-2xl font-bold text-brand-grey-900 flex items-center gap-2">
          <Phone size={22} className="text-brand-blue" />
          Waliopigiana
          <span className={`inline-flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1 rounded-full border ${sseConnected ? 'bg-green-50 text-green-600 border-green-300' : 'bg-brand-grey-50 text-brand-grey-400 border-brand-grey-200'}`}>
            <span className={`w-2 h-2 rounded-full ${sseConnected ? 'bg-green-500 animate-pulse' : 'bg-brand-grey-300'}`} />
            {sseConnected ? 'LIVE' : 'Offline'}
          </span>
        </h1>
        <span className="text-xs font-semibold text-brand-grey-500">{filtered.length} / {contacts.length}</span>
      </div>

      {/* Stats — compact chips kama payments page */}
      <div className="flex flex-wrap gap-2">
        <button type="button" onClick={() => setFilterType('')}
          className={`inline-flex items-center gap-2 border rounded-full px-3 py-1.5 transition ${filterType === '' ? 'bg-brand-blue-50 border-brand-blue text-brand-blue' : 'bg-white border-brand-grey-200 text-brand-grey-600 hover:border-brand-blue'}`}>
          <TrendingUp size={13} className={filterType === '' ? 'text-brand-blue' : 'text-brand-grey-400'} />
          <span className="text-xs font-bold">{stats.total}</span>
          <span className="text-[10px]">Zote</span>
        </button>
        <button type="button" onClick={() => setFilterType(filterType === 'call' ? '' : 'call')}
          className={`inline-flex items-center gap-2 border rounded-full px-3 py-1.5 transition ${filterType === 'call' ? CONTACT_CONFIG.call.bg + ' ' + CONTACT_CONFIG.call.color + ' border' : 'bg-white border-brand-grey-200 text-brand-grey-600 hover:border-green-300'}`}>
          <Phone size={13} />
          <span className="text-xs font-bold">{stats.calls}</span>
          <span className="text-[10px]">Simu</span>
        </button>
        <button type="button" onClick={() => setFilterType(filterType === 'sms' ? '' : 'sms')}
          className={`inline-flex items-center gap-2 border rounded-full px-3 py-1.5 transition ${filterType === 'sms' ? CONTACT_CONFIG.sms.bg + ' ' + CONTACT_CONFIG.sms.color + ' border' : 'bg-white border-brand-grey-200 text-brand-grey-600 hover:border-blue-300'}`}>
          <MessageSquare size={13} />
          <span className="text-xs font-bold">{stats.sms}</span>
          <span className="text-[10px]">SMS</span>
        </button>
        <button type="button" onClick={() => setFilterType(filterType === 'whatsapp' ? '' : 'whatsapp')}
          className={`inline-flex items-center gap-2 border rounded-full px-3 py-1.5 transition ${filterType === 'whatsapp' ? CONTACT_CONFIG.whatsapp.bg + ' ' + CONTACT_CONFIG.whatsapp.color + ' border' : 'bg-white border-brand-grey-200 text-brand-grey-600 hover:border-emerald-300'}`}>
          <Globe size={13} />
          <span className="text-xs font-bold">{stats.whatsapp}</span>
          <span className="text-[10px]">WhatsApp</span>
        </button>
      </div>

      {/* Search */}
      <div className="relative">
        <input type="text" className="input text-xs py-1.5 w-full pl-8"
          placeholder="Tafuta kwa jina au namba ya simu..."
          value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} />
        <Filter size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-brand-grey-400" />
      </div>

      {/* Table — kama payments/users page */}
      <div className="bg-white rounded-xl border border-brand-grey-200 overflow-hidden overflow-x-auto">
        {pageItems.length === 0 ? (
          <div className="p-8 text-center">
            <Phone size={28} className="mx-auto text-brand-grey-300 mb-2" />
            <p className="text-sm text-brand-grey-500 font-medium">Hakuna mawasiliano bado</p>
            <p className="text-[11px] text-brand-grey-400 mt-1">Watumiaji wataonekana hapa wanapotuma SIMU, SMS, au WhatsApp</p>
          </div>
        ) : (
          <table className="w-full text-sm min-w-[800px]">
            <thead className="bg-brand-grey-50 text-[10px] uppercase tracking-wider font-bold text-brand-grey-500">
              <tr>
                <th className="px-3 py-2 text-center w-8">#</th>
                <th className="px-3 py-2 text-left">Aina</th>
                <th className="px-3 py-2 text-left">Mtumaji</th>
                <th className="px-3 py-2 text-left">Mpokeaji</th>
                <th className="px-3 py-2 text-left">Mikoa</th>
                <th className="px-3 py-2 text-left">Wakati</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-brand-grey-100">
              {pageItems.map((c, i) => {
                const ci = CONTACT_CONFIG[c.contact_type] || CONTACT_CONFIG.call;
                const Icon = ci.icon;
                return (
                  <tr key={c.call_id} className="hover:bg-brand-grey-50 align-top">
                    <td className="px-3 py-2.5 text-center text-xs font-bold text-brand-grey-400">{(safePage - 1) * PAGE_SIZE + i + 1}</td>

                    {/* Aina */}
                    <td className="px-3 py-2.5">
                      <span className={`inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full font-semibold border ${ci.bg} ${ci.color}`}>
                        <Icon size={11} /> {ci.label}
                      </span>
                    </td>

                    {/* Mtumaji */}
                    <td className="px-3 py-2.5">
                      <div className="font-medium text-brand-grey-900 text-xs">{c.from_full_name}</div>
                      <div className="text-[10px] text-brand-grey-500 mt-0.5">
                        {c.from_category === 'education' ? 'Elimu' : 'Afya'} · {c.from_cadre || '—'}
                      </div>
                    </td>

                    {/* Mpokeaji */}
                    <td className="px-3 py-2.5">
                      <div className="font-medium text-brand-grey-900 text-xs">{c.to_full_name}</div>
                      <div className="text-[10px] text-brand-grey-500 mt-0.5">
                        {c.to_category === 'education' ? 'Elimu' : 'Afya'} · {c.to_cadre || '—'}
                      </div>
                    </td>

                    {/* Mikoa */}
                    <td className="px-3 py-2.5 text-[11px] text-brand-grey-600">
                      <div className="flex items-center gap-1">
                        <ArrowLeftRight size={10} className="text-brand-grey-400 flex-shrink-0" />
                        <span className="truncate max-w-[120px]">{c.from_region || '—'}</span>
                      </div>
                      <div className="text-[10px] text-brand-grey-400 mt-0.5 pl-4">→ {c.to_region || '—'}</div>
                    </td>

                    {/* Wakati */}
                    <td className="px-3 py-2.5 text-[11px] text-brand-grey-500 whitespace-nowrap">
                      <span className="inline-flex items-center gap-1">
                        <Clock size={10} className="text-brand-grey-400" />
                        {formatTime(c.initiated_at)}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination — numbers + Next */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-1 pt-2 flex-wrap">
          {Array.from({ length: totalPages }, (_, i) => i + 1).slice(0, 10).map((n) => (
            <button key={n} onClick={() => setPage(n)}
              className={`inline-flex items-center justify-center min-w-[32px] h-8 rounded-full text-xs font-bold transition ${
                n === safePage
                  ? 'bg-brand-blue text-white border border-brand-blue'
                  : 'border border-brand-grey-200 text-brand-grey-600 hover:border-brand-blue hover:text-brand-blue'
              }`}>
              {n}
            </button>
          ))}
          {totalPages > 10 && <span className="text-brand-grey-400 text-xs">...</span>}
          <button disabled={safePage >= totalPages} onClick={() => setPage(safePage + 1)}
            className="inline-flex items-center justify-center h-8 px-3 rounded-full border border-brand-grey-200 text-brand-grey-600 text-xs font-bold disabled:opacity-40 hover:border-brand-blue hover:text-brand-blue transition gap-1">
            {t('board.next')} <ChevronRight size={14} />
          </button>
        </div>
      )}

      <p className="text-[11px] text-brand-grey-400 text-center">
        Mawasiliano yote (SIMU, SMS, WhatsApp) yanaoneshwa hapa kwa real-time. Bofya aina ya kuichuja.
      </p>
    </div>
  );
}
