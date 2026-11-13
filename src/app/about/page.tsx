import type { Metadata } from 'next';
import AboutContent from "./AboutContent";

export const metadata: Metadata = {
  title: 'Kuhusu Sisi — Kubadilishana Portal',
  description: 'Dhamira, tatizo tunalotatua na timu ya Kubadilishana Portal — jukwaa la watumishi wa Serikali Tanzania kubadilishana vituo vya kazi.',
};

export default function KuhusuPage() {
  return <AboutContent />;
}
