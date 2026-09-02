'use client';

import { useEffect, useState, useCallback } from 'react';
import { X } from 'lucide-react';

/**
 * PWAInit — inaregister service worker, inashikilia install prompt,
 * na inaonyesha banner ya ku-install app kwenye Android/iOS.
 */
export default function PWAInit() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showInstall, setShowInstall] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [swReady, setSwReady] = useState(false);

  // Register service worker
  useEffect(() => {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return;

    navigator.serviceWorker
      .register('/sw.js')
      .then((reg) => {
        console.log('[PWA] Service Worker registered:', reg.scope);
        setSwReady(true);

        // Check for updates every hour
        setInterval(() => reg.update(), 3600000);
      })
      .catch((err) => console.warn('[PWA] SW registration failed:', err));

    // Listen for controlling worker changes
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      console.log('[PWA] New service worker activated');
    });
  }, []);

  // Detect if already installed
  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Android: check if in standalone mode
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true;

    if (isStandalone) {
      setIsInstalled(true);
      return;
    }

    // iOS: show install instructions
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    if (isIOS && !isStandalone) {
      setShowInstall(true);
    }
  }, []);

  // Capture install prompt
  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      // Show install banner after 30 seconds
      setTimeout(() => setShowInstall(true), 30000);
    };

    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  // Listen for push notifications from service worker
  useEffect(() => {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return;

    const handler = (event: MessageEvent) => {
      if (event.data?.type === 'SYNC_NOTIFICATIONS') {
        console.log('[PWA] Sync notifications triggered');
      }
    };

    navigator.serviceWorker.addEventListener('message', handler);
    return () => navigator.serviceWorker.removeEventListener('message', handler);
  }, []);

  const handleInstall = useCallback(async () => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    console.log('[PWA] Install outcome:', outcome);

    if (outcome === 'accepted') {
      setIsInstalled(true);
      setShowInstall(false);
    }
    setDeferredPrompt(null);
  }, [deferredPrompt]);

  const dismiss = useCallback(() => {
    setShowInstall(false);
    // Don't show again for 7 days
    localStorage.setItem('pwa_install_dismissed', Date.now().toString());
  }, []);

  // Don't show if dismissed recently
  useEffect(() => {
    const dismissed = localStorage.getItem('pwa_install_dismissed');
    if (dismissed) {
      const daysSince = (Date.now() - parseInt(dismissed)) / (1000 * 60 * 60 * 24);
      if (daysSince < 7) setShowInstall(false);
    }
  }, []);

  if (isInstalled || !showInstall) return null;

  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 sm:left-auto sm:right-4 sm:w-80">
      <div className="bg-white border border-brand-grey-100 rounded-xl shadow-lg p-4">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0">
            <span className="text-lg">📱</span>
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-semibold text-brand-grey-900">
              Weka Kubadilishana kwenye skrini yako
            </h3>
            <p className="text-xs text-brand-grey-500 mt-1">
              {isIOS
                ? 'Gusa "Share" kisha "Add to Home Screen"'
                : 'Bonyeza "Weka" kuongeza kwenye skrini yako'}
            </p>
          </div>
          <button
            onClick={dismiss}
            className="text-brand-grey-400 hover:text-brand-grey-600 p-1"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex gap-2 mt-3">
          {!isIOS && deferredPrompt && (
            <button
              onClick={handleInstall}
              className="flex-1 bg-blue-600 text-white text-xs font-medium py-2 px-3 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Weka
            </button>
          )}
          <button
            onClick={dismiss}
            className="flex-1 bg-brand-grey-100 text-brand-grey-600 text-xs font-medium py-2 px-3 rounded-lg hover:bg-brand-grey-200 transition-colors"
          >
            Baadaye
          </button>
        </div>
      </div>
    </div>
  );
}
