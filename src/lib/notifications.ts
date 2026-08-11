import {
  BadgeCheck, Ban, Bell, Handshake, Megaphone,
  MessageCircle, Phone, UserCog, UserPlus, Wallet,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

/** Shared notification helpers (bell, page, live toasts). */

export const NOTIFICATION_TYPE_META: Record<string, { icon: LucideIcon; color: string }> = {
  'match.found': { icon: Handshake, color: 'blue' },
  'message.sent': { icon: MessageCircle, color: 'orange' },
  'call.initiated': { icon: Phone, color: 'red' },
  'payment.submitted': { icon: Wallet, color: 'gold' },
  'payment.approved': { icon: BadgeCheck, color: 'blue' },
  'payment.rejected': { icon: Ban, color: 'red' },
  'user.registered': { icon: UserPlus, color: 'blue' },
  'user.profile_updated': { icon: UserCog, color: 'orange' },
  'announcement': { icon: Megaphone, color: 'gold' },
};

export const DEFAULT_NOTIFICATION_ICON: LucideIcon = Bell;

export function notificationRoute(type: string, data: any, isAdmin?: boolean): string {
  switch (type) {
    // Mgeni mpya / match → dashboard juu (mgENI anaonekana kwenye grid ya LIVE)
    case 'match.found':
    case 'user.registered': return '/dashboard';
    // SMS / ujumbe → chat na mtu huyo (kuendelea kuandika)
    case 'message.sent': return data?.from_user_id ? `/chats/${data.from_user_id}` : '/chats';
    // Simu → MPPIGIE MOJA KWA MOJA (tel:) ikiwa namba iko kwenye notification;
    // vinginevyo nenda kwenye chat ya mtu huyo (kitufe cha kupigia kipo pale juu).
    case 'call.initiated':
      if (data?.from_phone) return `tel:${data.from_phone}`;
      return data?.from_user_id ? `/chats/${data.from_user_id}` : '/contacts';
    case 'payment.submitted': return isAdmin ? '/admin/payments' : '/donate';
    case 'payment.approved':
    case 'payment.rejected': return '/donate';
    case 'user.profile_updated': return '/profile';
    case 'announcement': return '/announcements';
    default: return '/dashboard';
  }
}
