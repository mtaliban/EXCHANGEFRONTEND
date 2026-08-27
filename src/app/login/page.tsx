import type { Metadata } from 'next';
import LoginContent from './LoginContent';

export const metadata: Metadata = {
  title: 'Ingia',
  description:
    'Ingia kwenye akaunti yako ya Kubadilishana Vituo. Tafuta mtu wa kubadilishana naye vituoni.',
  openGraph: {
    title: 'Ingia — Kubadilishana Vituo',
    description: 'Ingia kwenye akaunti yako ya Kubadilishana Vituo.',
    url: 'https://esstranfer.com/login',
    images: [{ url: 'https://esstranfer.com/images/LOGOL.jpeg', width: 1200, height: 630 }],
  },
  alternates: { canonical: 'https://esstranfer.com/login' },
};

export default function LoginPage() {
  return <LoginContent />;
}
