import type { Metadata } from 'next';
import LoginContent from './LoginContent';

export const metadata: Metadata = {
  title: 'Ingia — Kubadilishana Portal',
  description:
    'Ingia kwenye akaunti yako ya Kubadilishana Portal. Tafuta mtu wa kubadilishana naye vituoni.',
  openGraph: {
    title: 'Ingia — Kubadilishana Portal',
    description: 'Ingia kwenye akaunti yako ya Kubadilishana Portal.',
    url: 'https://esstranfer.com/login',
    images: [{ url: 'https://esstranfer.com/images/LOGOL.jpeg', width: 1200, height: 630 }],
  },
  alternates: { canonical: 'https://esstranfer.com/login' },
};

export default function LoginPage() {
  return <LoginContent />;
}
