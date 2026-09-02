'use client';

/**
 * Firebase Cloud Messaging utility (optional).
 * Falls back to Web Push API if Firebase is not configured.
 */

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || '',
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || '',
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || '',
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || '',
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '',
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || '',
};

/**
 * Send token to backend
 */
export async function sendTokenToBackend(token: string, provider = 'fcm'): Promise<void> {
  try {
    const API = process.env.NEXT_PUBLIC_API_URL || 'https://api.16-171-23-21.sslip.io';
    const authToken = localStorage.getItem('kv_token');

    await fetch(`${API}/notifications/push-token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
      },
      body: JSON.stringify({ token, provider, platform: 'web' }),
    });
  } catch (err) {
    console.warn('[Push] Failed to send token:', err);
  }
}
