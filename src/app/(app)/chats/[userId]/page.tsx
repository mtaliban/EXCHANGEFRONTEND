'use client';

import { useEffect, useRef, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import axios from 'axios';
import { formatDistanceToNowStrict } from 'date-fns';
import { chatHistory, sendMessage, logCall, type ChatMessage } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { useLive } from '@/lib/liveSocket';

const API = process.env.NEXT_PUBLIC_API_URL!;

export default function ChatViewPage() {
  const params = useParams<{ userId: string }>();
  const router = useRouter();
  const { user, token } = useAuth();
  const { subscribe, send, isOnline } = useLive();
  const otherUserId = params.userId;

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [other, setOther] = useState<any>(null);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const [theyAreTyping, setTheyAreTyping] = useState(false);
  const typingTimerRef = useRef<any>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Load history + other user info
  useEffect(() => {
    (async () => {
      try {
        const [hist, presence] = await Promise.all([
          chatHistory(otherUserId),
          axios.get(`${API}/messages/presence/${otherUserId}`, {
            headers: { Authorization: `Bearer ${token}` },
          }).then((r) => r.data).catch(() => null),
        ]);
        setMessages(hist.messages);
        if (presence) setOther((prev: any) => ({ ...prev, ...presence }));
      } catch {}
    })();
    // eslint-disable-next-line
  }, [otherUserId, token]);

  // Subscribe to WS events for this specific conversation
  useEffect(() => {
    const unsub1 = subscribe('message.sent', (p) => {
      if (p.from_user_id === otherUserId || p.to_user_id === otherUserId) {
        setMessages((prev) => {
          if (prev.some((m) => m.message_id === p.message_id)) return prev;
          return [...prev, {
            message_id: p.message_id, from_user_id: p.from_user_id,
            to_user_id: p.to_user_id, text: p.text,
            created_at: p.created_at, is_read: false,
          }];
        });
      }
    });
    const unsub2 = subscribe('typing', (p) => {
      if (p.from_user_id === otherUserId) {
        setTheyAreTyping(!!p.on);
        // auto-clear after 4s of no update
        if (p.on) {
          clearTimeout(typingTimerRef.current);
          typingTimerRef.current = setTimeout(() => setTheyAreTyping(false), 4000);
        }
      }
    });
    return () => { unsub1(); unsub2(); };
  }, [subscribe, otherUserId]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages.length, theyAreTyping]);

  // Emit typing events (debounced)
  useEffect(() => {
    if (!text) return;
    send({ type: 'typing', to: otherUserId, on: true });
    const t = setTimeout(() => send({ type: 'typing', to: otherUserId, on: false }), 3000);
    return () => clearTimeout(t);
  }, [text, otherUserId, send]);

  async function submitSend() {
    if (!text.trim() || sending) return;
    setSending(true);
    try {
      const msg = await sendMessage(otherUserId, text);
      setMessages((prev) => [...prev, msg]);
      setText('');
      send({ type: 'typing', to: otherUserId, on: false });
    } finally { setSending(false); }
  }

  async function call() {
    try { await logCall(otherUserId, 'initiated'); } catch {}
    const phone = other?.phone_primary || prompt('Namba ya simu:');
    if (phone) window.location.href = `tel:${phone}`;
  }

  const online = isOnline(otherUserId) || other?.online;
  const lastSeen = other?.last_seen_at ? formatDistanceToNowStrict(new Date(other.last_seen_at), { addSuffix: true }) : null;
  const initial = (other?.full_name || messages[0]?.from_user_id === user?.user_id ? other?.full_name : messages[0]?.from_user_id)?.charAt?.(0)?.toUpperCase?.() || 'U';

  return (
    <div className="flex flex-col h-[calc(100vh-3.5rem)] md:h-screen bg-brand-grey-50">
      {/* WhatsApp-style header */}
      <div className="bg-brand-blue text-white p-3 flex items-center gap-3 sticky top-0 z-10 shadow-md">
        <button onClick={() => router.back()} className="p-2 hover:bg-white/10 rounded-full">←</button>
        <div className="relative flex-shrink-0">
          <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center font-bold">
            {initial}
          </div>
          {online && (
            <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-green-400 border-2 border-brand-blue"></span>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-semibold truncate">{other?.full_name || 'Mtumiaji'}</div>
          <div className="text-xs text-white/80 truncate">
            {theyAreTyping ? (
              <span className="text-green-300 font-medium">anaandika...</span>
            ) : online ? (
              <span className="text-green-300">🟢 online</span>
            ) : lastSeen ? (
              `alionekana ${lastSeen}`
            ) : ''}
          </div>
        </div>
        <a href={other?.phone_primary ? `tel:${other.phone_primary}` : '#'}
           onClick={call}
           className="p-2 hover:bg-white/10 rounded-full text-xl" title="Piga simu">📞</a>
      </div>

      {/* Messages — WhatsApp look */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-3 space-y-1"
           style={{ background: 'linear-gradient(180deg, #f3f4f6 0%, #e5e7eb 100%)' }}>
        {messages.length === 0 && (
          <div className="text-center text-brand-grey-500 text-sm py-16">
            Anza mazungumzo hapa chini 👇
          </div>
        )}
        {messages.map((m, idx) => {
          const mine = m.from_user_id === user?.user_id;
          const prev = messages[idx - 1];
          const showAvatar = !prev || prev.from_user_id !== m.from_user_id;
          return (
            <div key={m.message_id} className={`flex ${mine ? 'justify-end' : 'justify-start'} ${showAvatar ? 'mt-2' : ''}`}>
              <div className={`max-w-[75%] px-3 py-1.5 rounded-2xl text-sm shadow-sm ${
                mine
                  ? 'bg-brand-blue text-white rounded-br-sm'
                  : 'bg-white text-brand-grey-900 rounded-bl-sm'
              }`}>
                <div className="whitespace-pre-wrap break-words">{m.text}</div>
                <div className={`text-[10px] mt-0.5 text-right ${mine ? 'text-brand-blue-100' : 'text-brand-grey-500'}`}>
                  {new Date(m.created_at).toLocaleTimeString('sw-TZ', { hour: '2-digit', minute: '2-digit' })}
                  {mine && (m.is_read ? ' ✓✓' : ' ✓')}
                </div>
              </div>
            </div>
          );
        })}
        {theyAreTyping && (
          <div className="flex justify-start mt-2">
            <div className="bg-white rounded-2xl rounded-bl-sm px-3 py-2 shadow-sm">
              <div className="flex gap-1">
                <span className="w-2 h-2 rounded-full bg-brand-grey-400 animate-bounce" style={{animationDelay: '0ms'}}></span>
                <span className="w-2 h-2 rounded-full bg-brand-grey-400 animate-bounce" style={{animationDelay: '100ms'}}></span>
                <span className="w-2 h-2 rounded-full bg-brand-grey-400 animate-bounce" style={{animationDelay: '200ms'}}></span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Composer */}
      <div className="bg-white border-t border-brand-grey-100 p-2 flex gap-2 sticky bottom-0">
        <input
          className="flex-1 rounded-full border border-brand-grey-200 px-4 py-2.5 focus:outline-none focus:border-brand-blue"
          placeholder="Andika ujumbe..."
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), submitSend())}
        />
        <button onClick={submitSend} disabled={!text.trim() || sending}
          className="w-11 h-11 rounded-full bg-brand-blue text-white flex items-center justify-center disabled:opacity-50 hover:bg-brand-blue-700 transition">
          {sending ? '…' : '➤'}
        </button>
      </div>
    </div>
  );
}
