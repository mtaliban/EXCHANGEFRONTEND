'use client';

import { useEffect, useState } from 'react';
import { getEmailSettings, saveEmailSettings, testEmailSettings, type EmailSettings } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { useT } from '@/lib/i18n';
import Spinner from '@/components/Spinner';

const EMPTY: EmailSettings = {
  configured: false,
  smtp_host: '', smtp_port: 587, smtp_username: '', smtp_password: '',
  smtp_from: '', smtp_use_tls: true,
  mailersend_api_key: '', mailersend_from: '', enabled: true,
};

export default function AdminSettingsPage() {
  const t = useT();
  const { user } = useAuth();
  const [cfg, setCfg] = useState<EmailSettings | null>(null);
  const [smtpHost, setSmtpHost] = useState('');
  const [smtpPort, setSmtpPort] = useState(587);
  const [smtpUser, setSmtpUser] = useState('');
  const [smtpPass, setSmtpPass] = useState('');
  const [smtpFrom, setSmtpFrom] = useState('');
  const [useTls, setUseTls] = useState(true);
  const [msKey, setMsKey] = useState('');
  const [msFrom, setMsFrom] = useState('');
  const [enabled, setEnabled] = useState(true);
  const [msg, setMsg] = useState<{ text: string; ok: boolean } | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    getEmailSettings().then((s) => {
      setCfg(s);
      setSmtpHost(s.smtp_host || ''); setSmtpPort(s.smtp_port || 587);
      setSmtpUser(s.smtp_username || ''); setSmtpPass(s.smtp_password || '');
      setSmtpFrom(s.smtp_from || ''); setUseTls(s.smtp_use_tls);
      setMsKey(s.mailersend_api_key || ''); setMsFrom(s.mailersend_from || '');
      setEnabled(s.enabled);
    }).catch(() => setMsg({ text: 'Imeshindikana kupakia mipangilio', ok: false }));
  }, []);

  function flash(text: string, ok = true) {
    setMsg({ text, ok });
    setTimeout(() => setMsg(null), 5000);
  }

  function formBody() {
    return {
      smtp_host: smtpHost.trim(), smtp_port: Number(smtpPort) || 587,
      smtp_username: smtpUser.trim(), smtp_password: smtpPass,
      smtp_from: smtpFrom.trim() || 'Kubadilishana Vituo <no-reply@kubadilishana.go.tz>',
      smtp_use_tls: useTls,
      mailersend_api_key: msKey.trim(), mailersend_from: msFrom.trim(),
      enabled,
    };
  }

  async function save() {
    setBusy(true);
    try {
      const r = await saveEmailSettings(formBody());
      flash(r.message || 'Imehifadhiwa ✓');
      setCfg(await getEmailSettings());
    } catch (e: any) {
      flash(e?.response?.data?.detail || 'Imeshindikana kuhifadhi', false);
    }
    setBusy(false);
  }

  async function sendTest() {
    setBusy(true);
    try {
      // Hifadhi KWANZA — test ijadili config mpya uliyoandika, siyo ya zamani.
      await saveEmailSettings(formBody());
      setCfg(await getEmailSettings());
      const r = await testEmailSettings();
      flash(r.message || 'Imetumwa ✓');
    } catch (e: any) {
      flash(e?.response?.data?.detail || 'Email haikutumwa', false);
    }
    setBusy(false);
  }

  if (!cfg) return <div className="p-10"><Spinner label={t('msg.loading')} /></div>;

  return (
    <div className="p-4 md:p-6 max-w-3xl mx-auto space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-brand-grey-900">⚙️ {t('settings.title')}</h1>
        <p className="text-brand-grey-500 text-sm mt-1">{t('settings.subtitle')}</p>
      </div>

      {msg && (
        <div className={`text-sm rounded-lg p-3 ${msg.ok ? 'bg-brand-blue-50 text-brand-blue' : 'bg-brand-red-50 text-brand-red'}`}>
          {msg.text}
        </div>
      )}

      {/* Hali ya sasa */}
      <div className={`card flex items-center gap-3 ${cfg.configured ? 'border-emerald-200' : 'border-brand-gold'}`}>
        <span className={`w-3 h-3 rounded-full flex-shrink-0 ${cfg.configured ? 'bg-emerald-500' : 'bg-brand-gold-500 animate-pulse'}`} />
        <div className="text-sm">
          {cfg.configured
            ? <b className="text-emerald-700">Email imesanidiwa ✓ — codes zinaenda kwenye email.</b>
            : <b className="text-brand-gold-600">Email HAIJASANIDIWA — codes zinaenda kwenye backend logs tu.</b>}
          <div className="text-brand-grey-500 text-xs mt-0.5">{t('settings.status_hint')}</div>
        </div>
      </div>

      {/* SMTP */}
      <div className="card space-y-3">
        <h2 className="font-bold text-brand-grey-900">📧 SMTP (Gmail / MailerSend / Resend / Zoho...)</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="label">{t('settings.host')}</label>
            <input className="input" placeholder="smtp.gmail.com" value={smtpHost} onChange={(e) => setSmtpHost(e.target.value)} />
          </div>
          <div>
            <label className="label">{t('settings.port')}</label>
            <input type="number" className="input" value={smtpPort} onChange={(e) => setSmtpPort(Number(e.target.value))} />
          </div>
          <div>
            <label className="label">{t('settings.username')}</label>
            <input className="input" placeholder="jina@gmail.com" value={smtpUser} onChange={(e) => setSmtpUser(e.target.value)} />
          </div>
          <div>
            <label className="label">{t('settings.password')} (App Password)</label>
            <input type="password" className="input" placeholder="•••• •••• •••• ••••" value={smtpPass} onChange={(e) => setSmtpPass(e.target.value)} />
          </div>
          <div className="sm:col-span-2">
            <label className="label">{t('settings.from')}</label>
            <input className="input" placeholder="Kubadilishana Vituo <no-reply@kubadilishana.go.tz>" value={smtpFrom} onChange={(e) => setSmtpFrom(e.target.value)} />
          </div>
        </div>
        <label className="flex items-center gap-2 text-sm text-brand-grey-700">
          <input type="checkbox" checked={useTls} onChange={(e) => setUseTls(e.target.checked)} /> {t('settings.tls')}
        </label>
      </div>

      {/* MailerSend (badala) */}
      <div className="card space-y-3">
        <h2 className="font-bold text-brand-grey-900">🪄 {t('settings.mailersend')}</h2>
        <p className="text-xs text-brand-grey-500">{t('settings.mailersend_hint')}</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="label">{t('settings.api_key')}</label>
            <input type="password" className="input" placeholder="mlsn.xxxxxxxx" value={msKey} onChange={(e) => setMsKey(e.target.value)} />
          </div>
          <div>
            <label className="label">{t('settings.from')}</label>
            <input className="input" value={msFrom} onChange={(e) => setMsFrom(e.target.value)} />
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <label className="flex items-center gap-2 text-sm text-brand-grey-700 mr-2">
          <input type="checkbox" checked={enabled} onChange={(e) => setEnabled(e.target.checked)} /> {t('settings.enabled')}
        </label>
        <button onClick={save} disabled={busy} className="btn-primary text-sm">{busy ? t('msg.loading') : t('settings.save')}</button>
        <button onClick={sendTest} disabled={busy} className="btn-outline text-sm">✉️ {t('settings.test_btn')}</button>
        {user?.email && <span className="text-xs text-brand-grey-500 ml-auto">→ {user.email}</span>}
      </div>

      {/* Gmail guide */}
      <div className="bg-brand-gold-50 dark:bg-brand-gold-100/10 border border-brand-gold-100 dark:border-brand-gold-100/30 rounded-xl p-4 text-sm space-y-1.5">
        <div className="font-bold text-brand-gold-600">🔐 {t('settings.guide_title')}</div>
        <div>1️⃣ {t('settings.guide1')}</div>
        <div>2️⃣ {t('settings.guide2')}</div>
        <div>3️⃣ {t('settings.guide3')}</div>
        <div className="text-xs text-brand-grey-500 mt-1">💡 {t('settings.guide4')}</div>
      </div>
    </div>
  );
}
