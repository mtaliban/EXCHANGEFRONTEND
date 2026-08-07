'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { listOnlineUsers } from '@/lib/api';
import { useLive } from '@/lib/liveSocket';

/**
 * Widget showing users currently online (WebSocket-connected).
 * Refreshes every 20s + on any WS event.
 */
export default function OnlineNowWidget() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { connected, subscribe } = useLive();

  async function reload() {
    try {
      const d = await listOnlineUsers();
      setUsers(d.users || []);
    } finally { setLoading(false); }
  }

  useEffect(() => {
    reload();
    const t = setInterval(reload, 20000);
    const unsub = subscribe('*', () => reload());
    return () => { clearInterval(t); unsub(); };
    // eslint-disable-next-line
  }, []);

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-bold text-brand-grey-900 flex items-center gap-2">
          <span className={`w-2 h-2 rounded-full ${connected ? 'bg-green-500 animate-pulse' : 'bg-brand-grey-400'}`}></span>
          Walio Online Sasa
        </h3>
        <span className="badge-gold">{users.length}</span>
      </div>
      {loading && <div className="text-brand-grey-500 text-sm">...</div>}
      {!loading && users.length === 0 && (
        <div className="text-brand-grey-500 text-sm text-center py-4">
          Hakuna mtu mwingine online sasa
        </div>
      )}
      <div className="space-y-1.5 max-h-64 overflow-y-auto">
        {users.map((u) => (
          <Link key={u.user_id} href={`/chats/${u.user_id}`}
            className="flex items-center gap-2 p-2 rounded-lg hover:bg-brand-grey-50 transition">
            <div className="relative flex-shrink-0">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-brand-blue to-brand-orange flex items-center justify-center text-white text-xs font-bold">
                {u.full_name?.charAt(0).toUpperCase()}
              </div>
              <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-green-500 border-2 border-white"></span>
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium text-brand-grey-900 truncate">
                {u.full_name} {u.is_admin && '👑'}
              </div>
              <div className="text-[10px] text-brand-grey-500 truncate">
                {u.cadre_display} • {u.current_station?.region_name}
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
