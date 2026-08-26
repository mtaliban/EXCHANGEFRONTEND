import type { Metadata } from 'next';
import ServicesContent from './ServicesContent';

export const metadata: Metadata = {
  title: 'Huduma Zetu',
  description:
    'Angalia huduma zinazotolewa na Kubadilishana Vituo: ufanisi wa watumishi wa Afya, Elimu, na Kilimo Tanzania. Tafuta mwenza wa kubadilishana vituo.',
  openGraph: {
    title: 'Huduma Zetu — Kubadilishana Vituo',
    description:
      'Huduma za kubadilishana vituo vya kazi kwa watumishi wa serikali Tanzania.',
    url: 'https://esstranfer.com/services',
    images: [{ url: 'https://esstranfer.com/og-image.png', width: 1200, height: 630 }],
  },
  alternates: { canonical: 'https://esstranfer.com/services' },
};

export default function ServicesPage() {
  return <ServicesContent />;
}
