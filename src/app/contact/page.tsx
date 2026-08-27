import type { Metadata } from 'next';
import ContactContent from './ContactContent';

export const metadata: Metadata = {
  title: 'Wasiliana Nasi — Kubadilishana Portal',
  description:
    'Wasiliana na timu ya Kubadilishana Portal — maswali, maoni, au msaada. Tuko tayari kukusaidia.',
  openGraph: {
    title: 'Wasiliana Nasi — Kubadilishana Portal',
    description: 'Wasiliana na timu ya Kubadilishana Portal.',
    url: 'https://esstranfer.com/contact',
    images: [{ url: 'https://esstranfer.com/images/LOGOL.jpeg', width: 1200, height: 630 }],
  },
  alternates: { canonical: 'https://esstranfer.com/contact' },
};

export default function ContactPage() {
  return <ContactContent />;
}
