import {
  BadgeCheck, Ban, Bell, ClipboardList, Handshake, Megaphone,
  MessageCircle, Phone, UserCog, UserPlus, Wallet,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

/** Shared notification helpers (bell, page, live toasts). */

export const NOTIFICATION_TYPE_META: Record<string, { icon: LucideIcon; color: string; emoji?: string }> = {
  'match.found': { icon: Handshake, color: 'blue', emoji: '🤝' },
  'message.sent': { icon: MessageCircle, color: 'blue', emoji: '💬' },
  'call.initiated': { icon: Phone, color: 'blue', emoji: '📞' },
  'payment.submitted': { icon: Wallet, color: 'blue', emoji: '💰' },
  'payment.approved': { icon: BadgeCheck, color: 'blue', emoji: '✅' },
  'payment.rejected': { icon: Ban, color: 'red', emoji: '❌' },
  'user.registered': { icon: UserPlus, color: 'blue', emoji: '👤' },
  'user.profile_updated': { icon: UserCog, color: 'blue', emoji: '✏️' },
  'announcement': { icon: Megaphone, color: 'blue', emoji: '📢' },
  'feedback.new': { icon: ClipboardList, color: 'blue', emoji: '📝' },
  'feedback.replied': { icon: ClipboardList, color: 'blue', emoji: '💬' },
  'payment.message': { icon: MessageCircle, color: 'blue', emoji: '💬' },
  'payment.reply': { icon: MessageCircle, color: 'blue', emoji: '💬' },
  'password_reset.new': { icon: Bell, color: 'blue', emoji: '🔑' },
};

export const DEFAULT_NOTIFICATION_ICON: LucideIcon = Bell;

export function notificationRoute(type: string, data: any, isAdmin?: boolean): string {
  if (isAdmin) {
    switch (type) {
      case 'user.registered':
      case 'user.profile_updated':
      case 'user.station_changed':
      case 'user.destination_changed':
      case 'user.updated_by_admin':
      case 'user.deleted':
      case 'match.found':
      case 'call.initiated': return '/admin/users';
      case 'payment.submitted':
      case 'payment.approved':
      case 'payment.rejected':
      case 'payment.message':
      case 'payment.reply': return '/admin/payments';
      case 'feedback.new':
      case 'feedback.replied': return '/admin/feedback';
      case 'password_reset.new': return '/admin/password-resets';
      case 'event.new':
      case 'event.created':
      case 'event.updated': return '/admin/events';
      case 'data.changed':
      case 'data.subject_added':
      case 'data.cadre_added':
      case 'data.region_added':
      case 'data.district_added': return '/admin/data';
      case 'announcement': return '/admin/announcements';
      default: return '/admin';
    }
  }
  // USER routes
  switch (type) {
    case 'match.found': return '/dashboard';
    case 'user.registered': return '/dashboard';
    case 'call.initiated':
      if (data?.from_phone) return `tel:${data.from_phone}`;
      return '/dashboard';
    case 'payment.submitted':
    case 'payment.approved':
    case 'payment.rejected':
    case 'payment.message':
    case 'payment.reply': return '/donate';
    case 'user.profile_updated': return '/profile';
    case 'announcement': return '/announcements';
    case 'feedback.new':
    case 'feedback.replied': return '/feedback';
    default: return '/dashboard';
  }
}
