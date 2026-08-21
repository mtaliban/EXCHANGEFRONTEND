import {
  BadgeCheck, Ban, Bell, ClipboardList, Handshake, Megaphone,
  MessageCircle, Phone, UserCog, UserPlus, Wallet,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

/** Shared notification helpers (bell, page, live toasts). */

export const NOTIFICATION_TYPE_META: Record<string, { icon: LucideIcon; color: string; emoji?: string }> = {
  'match.found': { icon: Handshake, color: 'blue' },
  'message.sent': { icon: MessageCircle, color: 'blue' },
  'call.initiated': { icon: Phone, color: 'blue' },
  'payment.submitted': { icon: Wallet, color: 'blue' },
  'payment.approved': { icon: BadgeCheck, color: 'blue' },
  'payment.rejected': { icon: Ban, color: 'red' },
  'user.registered': { icon: UserPlus, color: 'blue' },
  'user.profile_updated': { icon: UserCog, color: 'blue' },
  'announcement': { icon: Megaphone, color: 'blue' },
  'feedback.new': { icon: ClipboardList, color: 'blue' },
  'feedback.replied': { icon: ClipboardList, color: 'blue' },
  'payment.message': { icon: MessageCircle, color: 'blue' },
  'payment.reply': { icon: MessageCircle, color: 'blue' },
  'password_reset.new': { icon: Bell, color: 'blue' },
};

export const DEFAULT_NOTIFICATION_ICON: LucideIcon = Bell;

export function notificationRoute(type: string, data: any, isAdmin?: boolean): string {
  switch (type) {
    // Mgeni mpya / match → dashboard juu (mgeni anaonekana kwenye grid ya LIVE)
    case 'match.found': return '/dashboard';
    case 'user.registered': return isAdmin ? '/admin/users' : '/dashboard';
    // Simu → MPIGIE MOJA KWA MOJA (tel:) ikiwa namba iko kwenye notification;
    // vinginevyo dashboard (namba zinaonekana kwenye cards).
    case 'call.initiated':
      if (data?.from_phone) return `tel:${data.from_phone}`;
      return '/dashboard';
    case 'payment.submitted': return isAdmin ? '/admin/payments' : '/donate';
    case 'payment.approved':
    case 'payment.rejected': return '/donate';
    case 'user.profile_updated': return '/profile';
    case 'announcement': return '/announcements';
    case 'feedback.new': return isAdmin ? '/admin/feedback' : '/feedback';
    case 'feedback.replied': return '/feedback';
    case 'payment.message': return isAdmin ? '/admin/payments' : '/donate';
    case 'payment.reply': return '/donate';
    case 'password_reset.new': return isAdmin ? '/admin/password-resets' : '/dashboard';
    default: return '/dashboard';
  }
}
