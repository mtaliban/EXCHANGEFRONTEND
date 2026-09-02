'use client';

import { useEffect, useState, useCallback } from 'react';
import { Bell, X } from 'lucide-react';

/**
 * PushNotificationManager — inashikilia push notifications.
 * Inaonyesha prompt ya kuthibitisha notifications pale mtu anaingia.
 * Inatumia Web Push API (VAPID) — hakuna Firebase dependency browser-side.
 */

// VAPID key — unaweza kuitengeneza kwa: npx web-push generate-vapid-keys
// Weka kwenye env variable VAPID_PUBLIC_KEY
const VAPID_KEY = process.env.NEXT_PUBLIC_VAPID_KEY || '';

// Helper: convert VAPID key
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

interface PushState {
  permission: NotificationPermission;
  subscription: PushSubscription | null;
  supported: boolean;
}

export default function PushNotificationManager() {
  const [state, setState] = useState<PushState>({
    permission: 'default',
    subscription: null,
    supported: false,
  });
  const [showPrompt, setShowPrompt] = useState(false);
  const [loading, setLoading] = useState(false);

  // Check support and current permission
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const supported = 'Notification' in window && 'serviceWorker' in navigator;
    if (!supported) {
      setState((s) => ({ ...s, supported: false }));
      return;
    }

    setState((s) => ({
      ...s,
      supported: true,
      permission: Notification.permission,
    }));

    // Show prompt after 60 seconds if permission is default
    if (Notification.permission === 'default') {
      const timer = setTimeout(() => setShowPrompt(true), 60000);
      return () => clearTimeout(timer);
    }
  }, []);

  // Request notification permission
  const requestPermission = useCallback(async () => {
    if (!('Notification' in window)) return;

    setLoading(true);
    try {
      const permission = await Notification.requestPermission();
      setState((s) => ({ ...s, permission }));

      if (permission === 'granted') {
        await subscribeToPush();
        setShowPrompt(false);
      } else {
        setShowPrompt(false);
      }
    } catch (err) {
      console.error('[Push] Permission request failed:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Subscribe to push notifications via Web Push API
  const subscribeToPush = useCallback(async () => {
    if (!VAPID_KEY || VAPID_KEY === '') {
      console.warn('[Push] VAPID key not configured');
      // Still grant permission — just can't subscribe to push
      return;
    }

    try {
      const reg = await navigator.serviceWorker.ready;
      const subscription = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_KEY),
      });

      console.log('[Push] Subscription:', subscription);
      setState((s) => ({ ...s, subscription }));

      // Send subscription to backend
      await sendSubscriptionToBackend(subscription);
    } catch (err) {
      console.error('[Push] Subscription failed:', err);
    }
  }, []);

  // Send Web Push subscription to backend
  const sendSubscriptionToBackend = async (subscription: PushSubscription) => {
    try {
      const API = process.env.NEXT_PUBLIC_API_URL || 'https://api.16-171-23-21.sslip.io';
      const authToken = localStorage.getItem('kv_token');

      await fetch(`${API}/notifications/push-subscription`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
        },
        body: JSON.stringify({
          endpoint: subscription.endpoint,
          keys: subscription.toJSON().keys,
          platform: 'web',
        }),
      });
      console.log('[Push] Subscription sent to backend');
    } catch (err) {
      console.warn('[Push] Failed to send subscription:', err);
    }
  };

  // Don't show if not supported or already decided
  if (!state.supported || state.permission === 'granted' || state.permission === 'denied') {
    return null;
  }

  // Permission prompt
  if (showPrompt && state.permission === 'default') {
    return (
      <div className="fixed bottom-4 left-4 right-4 z-50 sm:left-auto sm:right-4 sm:w-80">
        <div className="bg-white border border-brand-grey-100 rounded-xl shadow-lg p-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0">
              <Bell className="w-5 h-5 text-blue-600" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-semibold text-brand-grey-900">
                Pata Arifa
              </h3>
              <p className="text-xs text-brand-grey-500 mt-1">
                Pata taarifa za wapya wanaokuja mkoa wako, malipo, na matangazo moja kwa moja kwenye simu yako.
              </p>
            </div>
            <button
              onClick={() => setShowPrompt(false)}
              className="text-brand-grey-400 hover:text-brand-grey-600 p-1"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="flex gap-2 mt-3">
            <button
              onClick={requestPermission}
              disabled={loading}
              className="flex-1 bg-blue-600 text-white text-xs font-medium py-2 px-3 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              {loading ? 'Inaomba ridhaa...' : 'Washa Arifa'}
            </button>
            <button
              onClick={() => setShowPrompt(false)}
              className="flex-1 bg-brand-grey-100 text-brand-grey-600 text-xs font-medium py-2 px-3 rounded-lg hover:bg-brand-grey-200 transition-colors"
            >
              Baadaye
            </button>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
