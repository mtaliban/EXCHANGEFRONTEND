'use client';

import { useEffect, useState } from 'react';
import { adminEvents } from '@/lib/api';
import { useT } from '@/lib/i18n';

export default function AdminEventsPage() {
  const t = useT();
  const [data, setData] = useState<any>(null);
  const [type, setType] = useState('');
  useEffect(() => { adminEvents(type || undefined, 200).then(setData); }, [type]);
  if (!data) return <div className="p-6">{t('adminevents.loading')}</div>;
  return (
    <div className="p-4 md:p-6 space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h1 className="text-2xl font-bold text-brand-grey-900">Event Log ({data.total})</h1>
        <select className="input w-auto" value={type} onChange={(e) => setType(e.target.value)}>
          <option value="">All</option><option>user.registered</option><option>user.profile_updated</option><option>user.destination_changed</option><option>match.found</option><option>message.sent</option><option>call.initiated</option><option>payment.paid</option>
        </select>
      </div>
      <div className="bg-white rounded-2xl border border-brand-grey-100">
        {data.events.map((e: any) => (
          <div key={e._id} className="p-2 border-b border-brand-grey-100 text-xs">
            <div className="flex gap-2 items-center">
              <span className="badge-gold">{e.event_type}</span>
              <span className="text-brand-grey-500 flex-1 truncate">{e.topic}</span>
              <span className="text-brand-grey-400">{new Date(e.occurred_at).toLocaleString('sw-TZ')}</span>
            </div>
            <div className="text-brand-grey-500 font-mono truncate mt-1">{JSON.stringify(e.payload)}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
