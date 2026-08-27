import type { Metadata } from 'next';
import ServicesContent from './ServicesContent';

export const metadata: Metadata = {
  title: 'Huduma Zetu — Kubadilishana Portal',
  description:
    'Kubadilishana Portal — Huduma za kubadilishana vituo vya kazi kwa Walimu, Madaktari, Wauguzi, Wauguzi wa Maabara, Wauguzi wa Meno, Wafanyakazi wa Kilimo na watumishi wote wa serikali Tanzania. Bure kabisa.',
  openGraph: {
    title: 'Huduma Zetu — Kubadilishana Portal',
    description:
      'Kubadilishana Portal — Huduma za kubadilishana vituo vya kazi kwa Walimu, Madaktari, Wauguzi na watumishi wote wa serikali Tanzania.',
    url: 'https://esstranfer.com/services',
    images: [{ url: 'https://esstranfer.com/images/LOGOL.jpeg', width: 1200, height: 630 }],
  },
  alternates: { canonical: 'https://esstranfer.com/services' },
};

export default function ServicesPage() {
  return <ServicesContent />;
}
