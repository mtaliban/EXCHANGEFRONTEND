import type { Metadata } from 'next';
import RegisterContent from './RegisterContent';

export const metadata: Metadata = {
  title: 'Jisajili Bure — Kubadilishana Portal',
  description:
    'Jisajili kwenye Kubadilishana Portal — mfumo wa bure wa kutafuta mtu wa kubadilishana vituo vya kazi Tanzania. Walimu, Madaktari, Wauguzi, Wafanyakazi wa Kilimo na watumishi wote wa serikali.',
  openGraph: {
    title: 'Jisajili Bure — Kubadilishana Portal',
    description:
      'Jisajili kwenye Kubadilishana Portal sasa upate mtu wa kubadilishana naye vituoni.',
    url: 'https://esstranfer.com/register',
    images: [{ url: 'https://esstranfer.com/images/LOGOL.jpeg', width: 1200, height: 630 }],
  },
  alternates: { canonical: 'https://esstranfer.com/register' },
};

export default function RegisterPage() {
  return <RegisterContent />;
}
