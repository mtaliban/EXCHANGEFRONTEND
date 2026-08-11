'use client';

import { useEffect, useRef, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import axios from 'axios';
import { formatDistanceToNowStrict } from 'date-fns';
import { chatHistory, sendMessage, logCall, markRead, getUserById, type ChatMessage } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { useLive } from '@/lib/liveSocket';
import { dayChipLabel, messageTime } from '@/lib/dates';
import { useT } from '@/lib/i18n';
import { getInitial } from '@/lib/initials';

export default function ChatViewPage() {
  const t = useT();
  const params = useParams<{ userId: string }>();
  const router = useRouter();
  const { user } = useAuth();
  const { subscribe, send } = useLive();
  // Live subscription to the online set → re-renders the instant presence changes
  const onlineUserIds = useLive((s) => s.onlineUserIds);
  const otherUserId = params.userId;

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [other, setOther] = useState<any>(null);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const [theyAreTyping, setTheyAreTyping] = useState(false);
  const typingTimerRef = useRef<any>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Load history + full other user profile (name, phone, cadre, online)
  useEffect(() => {
    (async () => {
      try {
        const [hist, profile] = await Promise.all([
          chatHistory(otherUserId),
          getUserById(otherUserId).catch(() => null),
        ]);
        setMessages(hist.messages);
        if (profile) setOther(profile);
      } catch {}
    })();
    // eslint-disable-next-line
  }, [otherUserId]);

  // Subscribe to WS events for this specific conversation
  useEffect(() => {
    const unsub1 = subscribe('message.sent', (p) => {
      if (p.from_user_id === otherUserId || p.to_user_id === otherUserId) {
        const incoming = p.to_user_id === user?.user_id;
        if (incoming) {
          // I'm looking at this chat → immediately mark as read + notify sender
          markRead(otherUserId).catch(() => {});
        }
        setMessages((prev) => {
          if (prev.some((m) => m.message_id === p.message_id)) return prev;
          return [...prev, {
            message_id: p.message_id, from_user_id: p.from_user_id,
            to_user_id: p.to_user_id, text: p.text,
            created_at: p.created_at, is_read: incoming,
            delivered_at: p.delivered_at || null, read_at: incoming ? new Date().toISOString() : null,
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
    // WhatsApp-style read receipt: my sent messages flip to blue ✓✓ live
    // only when the recipient has genuinely read them (read.receipt from backend)
    const unsub3 = subscribe('read.receipt', (p) => {
      if (p.read_by === otherUserId) {
        setMessages((prev) => prev.map((m) =>
          m.from_user_id === user?.user_id ? { ...m, is_read: true, read_at: p.read_at || m.read_at } : m
        ));
      }
    });
    return () => { unsub1(); unsub2(); unsub3(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
    if (!other?.phone_primary) return;
    try { await logCall(otherUserId, 'initiated'); } catch {}
    window.location.href = `tel:${other.phone_primary}`;
  }

  // Genuine online = present in the live WS set OR fresh profile flag
  const online = onlineUserIds.has(otherUserId) || other?.online;
  const lastSeen = other?.last_seen_at ? formatDistanceToNowStrict(new Date(other.last_seen_at), { addSuffix: true }) : null;
  const initial = getInitial(other?.full_name);

  return (
    <div className="flex flex-col h-[calc(100dvh-8.5rem)] md:h-screen bg-brand-grey-50">
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
              <span className="text-green-300 font-medium">{t('chats.typing')}</span>
            ) : online ? (
              <span className="text-green-300">🟢 {t('chats.online')}</span>
            ) : lastSeen ? (
              `${t('chats.last_seen')} ${lastSeen}`
            ) : ''}
          </div>
        </div>
        <button onClick={call}
           disabled={!other?.phone_primary}
           className="p-2 hover:bg-white/10 rounded-full text-xl disabled:opacity-50"
           title={other?.phone_primary ? `${t('chats.call')} ${other.phone_primary}` : t('chats.waiting_phone')}>
          📞
        </button>
      </div>

      {/* Messages — WhatsApp look with day separators */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-3 space-y-1 chat-bg">
        {messages.length === 0 && (
          <div className="text-center text-brand-grey-500 text-sm py-16">
            {t('chats.start')}
          </div>
        )}
        {messages.map((m, idx) => {
          const mine = m.from_user_id === user?.user_id;
          const prev = messages[idx - 1];
          const showAvatar = !prev || prev.from_user_id !== m.from_user_id;
          // WhatsApp-style day separator chip: Leo / Jana / tarehe
          const newDay = !prev || new Date(m.created_at).toDateString() !== new Date(prev.created_at).toDateString();
          const read = m.is_read || !!m.read_at;
          const delivered = !!m.delivered_at;
          return (
            <div key={m.message_id}>
              {newDay && (
                <div className="flex justify-center my-3">
                  <span className="bg-white/90 text-brand-grey-500 text-[11px] font-medium px-3 py-1 rounded-full shadow-sm">
                    {dayChipLabel(m.created_at)}
                  </span>
                </div>
              )}
              <div className={`flex ${mine ? 'justify-end' : 'justify-start'} ${showAvatar ? 'mt-2' : ''}`}>
                {!mine && showAvatar && (
                  <div className="w-8 h-8 rounded-full bg-brand-blue text-white flex items-center justify-center text-sm font-bold mr-2 mt-1 flex-shrink-0">
                    {initial}
                  </div>
                )}
                <div className={`max-w-[75%] px-3 py-1.5 rounded-2xl text-sm shadow-sm ${
                  mine
                    ? 'bg-brand-blue text-white rounded-br-sm'
                    : 'bg-white text-brand-grey-900 rounded-bl-sm'
                }`}>
                  <div className="whitespace-pre-wrap break-words">{m.text}</div>
                  <div className={`text-[10px] mt-0.5 text-right flex items-center justify-end gap-0.5 ${mine ? 'text-brand-blue-100' : 'text-brand-grey-500'}`}>
                    {messageTime(m.created_at)}
                    {mine && (
                      <>
                        {/* WhatsApp ticks: ✓ sent → ✓✓ delivered (grey) → ✓✓ read (blue) */}
                        <span className={`inline-flex ${read ? 'text-sky-300' : ''}`}>
                          {read ? '✓✓' : delivered ? '✓✓' : '✓'}
                        </span>
                      </>
                    )}
                  </div>
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
          placeholder={t('chats.placeholder')}
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
