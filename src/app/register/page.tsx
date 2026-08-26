import type { Metadata } from 'next';
import RegisterContent from './RegisterContent';

export const metadata: Metadata = {
  title: 'Jisajili Bure',
  description:
    'Jisajili kwenye Kubadilishana Vituo — mfumo wa bure wa kutafuta mtu wa kubadilishana vituo vya kazi Tanzania. Walimu, watumishi wa afya, na wengine.',
  openGraph: {
    title: 'Jisajili Bure — Kubadilishana Vituo',
    description:
      'Jisajili sasa upate mtu wa kubadilishana naye vituoni.',
    url: 'https://esstranfer.com/register',
    images: [{ url: 'https://esstranfer.com/og-image.png', width: 1200, height: 630 }],
  },
  alternates: { canonical: 'https://esstranfer.com/register' },
};

export default function RegisterPage() {
  return <RegisterContent />;
}
