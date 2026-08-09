'use client';

import { formatDistanceToNow } from 'date-fns';

/** Shared expandable contact-stat card — watu + namba + mara ngapi. */
export default function ContactStatCard({ icon, title, count, people, open, onToggle }: {
  icon: string; title: string; count: number;
  people: any[]; open: boolean; onToggle: () => void;
}) {
  return (
    <div className="card p-4">
      <button onClick={onToggle} className="w-full text-left">
        <div className="flex items-center justify-between">
          <span className="text-xl">{icon}</span>
          <span className="text-2xl font-bold text-brand-blue">{count}</span>
        </div>
        <div className="text-xs text-brand-grey-500 dark:text-brand-grey-400 mt-1">{title}</div>
        {people.length > 0 && (
          <div className="text-[10px] text-brand-grey-400 mt-1">
            {open ? '▼ funga' : `▲ ona watu (${people.length})`}
          </div>
        )}
      </button>
      {open && people.length > 0 && (
        <div className="mt-3 space-y-1.5 border-t border-brand-grey-100 dark:border-brand-grey-200 pt-2">
          {people.map((p) => (
            <div key={p.user_id} className="flex items-center justify-between gap-2 text-xs">
              <div className="min-w-0">
                <div className="font-semibold text-brand-grey-900 dark:text-white truncate">{p.full_name}</div>
                <div className="text-brand-blue truncate">📞 {p.phone_primary}</div>
              </div>
              <div className="flex flex-col items-end flex-shrink-0">
                <span className="badge-gold">{p.count}×</span>
                {p.last_at && <span className="text-[9px] text-brand-grey-400 mt-0.5">{formatDistanceToNow(new Date(p.last_at), { addSuffix: true })}</span>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
