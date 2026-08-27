import type { Metadata } from 'next';
import AboutContent from './AboutContent';

export const metadata: Metadata = {
  title: 'Kuhusu Sisi',
  description:
    'Jifunze kuhusu Kubadilishana Vituo — mfumo rasmi wa kusaidia watumishi wa Afya, Elimu, Umma na Kilimo Tanzania kubadilishana vituo vya kazi.',
  openGraph: {
    title: 'Kuhusu Sisi — Kubadilishana Vituo',
    description:
      'Mfumo rasmi wa kubadilishana vituo vya kazi kwa watumishi wa serikali Tanzania.',
    url: 'https://esstranfer.com/about',
    images: [{ url: 'https://esstranfer.com/images/LOGOL.jpeg', width: 1200, height: 630 }],
  },
  alternates: { canonical: 'https://esstranfer.com/about' },
};

export default function AboutPage() {
  return <AboutContent />;
}
