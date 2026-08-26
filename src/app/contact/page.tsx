import type { Metadata } from 'next';
import ContactContent from './ContactContent';

export const metadata: Metadata = {
  title: 'Wasiliana Nasi',
  description:
    'Wasiliana na timu ya Kubadilishana Vituo — maswali, maoni, au msaada. Tuko tayari kukusaidia.',
  openGraph: {
    title: 'Wasiliana Nasi — Kubadilishana Vituo',
    description: 'Wasiliana na timu ya Kubadilishana Vituo.',
    url: 'https://esstranfer.com/contact',
    images: [{ url: 'https://esstranfer.com/og-image.png', width: 1200, height: 630 }],
  },
  alternates: { canonical: 'https://esstranfer.com/contact' },
};

export default function ContactPage() {
  return <ContactContent />;
}
