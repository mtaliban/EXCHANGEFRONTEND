'use client';

import { useEffect, useRef, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { chatHistory, sendMessage, logCall, type ChatMessage, MSG_WS_URL } from '@/lib/api';
import { useAuth } from '@/lib/auth';

export default function ChatViewPage() {
  const params = useParams<{ userId: string }>();
  const router = useRouter();
  const { user, token } = useAuth();
  const otherUserId = params.userId;
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [other, setOther] = useState<any>(null);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  async function loadHistory() {
    const data = await chatHistory(otherUserId);
    setMessages(data.messages);
  }

  useEffect(() => {
    loadHistory().catch(() => {});
    // eslint-disable-next-line
  }, [otherUserId]);

  // WebSocket for real-time incoming messages
  useEffect(() => {
    if (!token || !user) return;
    const url = `${MSG_WS_URL()}?token=${encodeURIComponent(token)}`;
    const ws = new WebSocket(url);
    wsRef.current = ws;
    ws.onmessage = (ev) => {
      try {
        const data = JSON.parse(ev.data);
        if (data.event === 'message.sent' &&
            (data.from_user_id === otherUserId || data.to_user_id === otherUserId)) {
          setMessages((prev) => [...prev, {
            message_id: data.message_id,
            from_user_id: data.from_user_id,
            to_user_id: data.to_user_id,
            text: data.text,
            created_at: data.created_at,
            is_read: false,
          }]);
        }
      } catch {}
    };
    return () => { ws.close(); };
    // eslint-disable-next-line
  }, [token, otherUserId, user?.user_id]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages.length]);

  useEffect(() => {
    // fetch other user info from first msg
    if (messages.length && !other) {
      // best-effort; a proper /users/{id} endpoint would be better
      setOther({ user_id: otherUserId });
    }
  }, [messages, other, otherUserId]);

  async function send() {
    if (!text.trim() || sending) return;
    setSending(true);
    try {
      const msg = await sendMessage(otherUserId, text);
      setMessages((prev) => [...prev, msg]);
      setText('');
    } finally { setSending(false); }
  }

  async function call() {
    try { await logCall(otherUserId, 'initiated'); } catch {}
    // grab phone from any message metadata isn't available — fallback to other object if we have it
    const phone = (other?.phone_primary) || prompt('Namba ya simu ya kupiga:');
    if (phone) window.location.href = `tel:${phone}`;
  }

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] md:h-screen">
      {/* Chat header */}
      <div className="bg-white border-b border-brand-grey-100 p-3 flex items-center gap-3 sticky top-0 z-10">
        <button onClick={() => router.back()} className="p-2 text-brand-grey-700 hover:bg-brand-grey-100 rounded-lg">←</button>
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-brand-blue to-brand-orange flex items-center justify-center text-white font-bold">
          {(other?.full_name || 'U').charAt(0).toUpperCase()}
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-semibold text-brand-grey-900 truncate">{other?.full_name || 'Mtumiaji'}</div>
          <div className="text-xs text-brand-grey-500 truncate">{other?.cadre_display || ''}</div>
        </div>
        <button onClick={call} className="p-2 text-brand-blue hover:bg-brand-blue-50 rounded-lg" title="Piga simu">📞</button>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-2 bg-brand-grey-50">
        {messages.length === 0 && (
          <div className="text-center text-brand-grey-500 text-sm py-16">
            Anza mazungumzo hapa chini 👇
          </div>
        )}
        {messages.map((m) => {
          const mine = m.from_user_id === user?.user_id;
          return (
            <div key={m.message_id} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[75%] px-3 py-2 rounded-2xl text-sm ${mine ? 'bg-brand-blue text-white rounded-br-sm' : 'bg-white text-brand-grey-900 rounded-bl-sm border border-brand-grey-100'}`}>
                <div className="whitespace-pre-wrap break-words">{m.text}</div>
                <div className={`text-[10px] mt-1 ${mine ? 'text-brand-blue-100' : 'text-brand-grey-500'}`}>
                  {new Date(m.created_at).toLocaleTimeString('sw-TZ', { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Composer */}
      <div className="bg-white border-t border-brand-grey-100 p-3 flex gap-2 sticky bottom-0">
        <input
          className="input flex-1"
          placeholder="Andika ujumbe..."
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), send())}
        />
        <button onClick={send} disabled={!text.trim() || sending} className="btn-primary px-4">
          {sending ? '...' : '➤'}
        </button>
      </div>
    </div>
  );
}
