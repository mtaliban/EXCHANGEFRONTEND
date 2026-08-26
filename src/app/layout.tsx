import type { Metadata } from 'next';
import './globals.css';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import ThemeInit from '@/components/ThemeInit';

export const metadata: Metadata = {
  title: {
    default: 'Kubadilishana Vituo — Tanzania | Kumtafuta Mwenye Kubadilishana Nawe',
    template: '%s | Kubadilishana Vituo',
  },
  description:
    'Mfumo rasmi wa kubadilishana vituo vya kazi kwa watumishi wa Afya, Elimu, Umma na Kilimo Tanzania. Jisajili bure, tafuta mtu anayetaka kubadilishana nawe mkoani.',
  keywords: [
    'kubadilishana vituo',
    'kuhamisha vituo',
    'watumishi wa afya',
    'walimu tanzania',
    'kubadilishana wilaya',
    'kubadilishana mkoa',
    'afisa kilimo',
    'watumishi wa umma',
    'kuhamisha kazi',
    'exchange station',
    'tanzania teachers',
    'health workers exchange',
  ],
  authors: [{ name: 'Kubadilishana Vituo' }],
  creator: 'Kubadilishana Vituo',
  publisher: 'Kubadilishana Vituo',
  metadataBase: new URL('https://esstranfer.com'),
  openGraph: {
    type: 'website',
    locale: 'sw_TZ',
    url: 'https://esstranfer.com',
    siteName: 'Kubadilishana Vituo',
    title: 'Kubadilishana Vituo — Kumtafuta Mwenye Kubadilishana Nawe',
    description:
      'Mfumo rasmi wa kubadilishana vituo vya kazi kwa watumishi wa Afya, Elimu, Umma na Kilimo Tanzania.',
    images: [
      {
        url: 'https://esstranfer.com/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Kubadilishana Vituo — Tanzania',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Kubadilishana Vituo — Tanzania',
    description:
      'Mfumo rasmi wa kubadilishana vituo vya kazi kwa watumishi wa Afya, Elimu, Umma na Kilimo Tanzania.',
    images: ['https://esstranfer.com/og-image.png'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  icons: {
    icon: '/favicon.svg',
    shortcut: '/favicon.svg',
    apple: '/favicon.svg',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="sw">
      <head>
        {/* Apply persisted theme BEFORE first paint to avoid a light flash */}
        <script dangerouslySetInnerHTML={{ __html: `(function(){try{var t=JSON.parse(localStorage.getItem('kv_theme'));var th=(t&&t.state&&t.state.theme)||'light';var r=document.documentElement;r.classList.toggle('dark',th==='dark');r.style.colorScheme=th;}catch(e){}})();` }} />
        {/* interactive-widget=resizes-content: keyboard ya simu inakandamiza
            layout viewport → composer wa chat anakaa mahali pake (hajiruki juu) */}
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover, interactive-widget=resizes-content" />
      </head>
      <body className="min-h-screen flex flex-col">
        <ThemeInit />
        <Navbar />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
