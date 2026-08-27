import type { Metadata } from 'next';
import './globals.css';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import ThemeInit from '@/components/ThemeInit';

export const metadata: Metadata = {
  title: {
    default: 'Kubadilishana Vituo — Kubadilishana Portal ya Tanzania | Walimu, Afya, Kilimo',
    template: '%s | Kubadilishana Vituo',
  },
  description:
    'Kubadilishana Portal — Tafuta mtu wa kubadilishana naye vituo vya kazi Tanzania. Bure kwa Walimu, Madaktari, Wauguzi, Wauguzi wa Maabara, Wauguzi wa Meno, Afisa wa Afya, Msaidizi wa Afya, Afisa wa Kilimo, na watumishi wote wa serikali. Jisajili sasa, chagua mkoa wako, na upate mwenzie.',
  keywords: [
    'kubadilishana vituo',
    'kubadilishana portal',
    'kuhamisha vituo',
    'kubadilishana vituo tanzania',
    'walimu kubadilishana vituo',
    'walimu wa msingi kubadilishana',
    'walimu wa sekondari kubadilishana',
    'watumishi wa afya kubadilishana',
    'madaktari kubadilishana vituo',
    'wauguzi kubadilishana vituo',
    'wauguzi wa maabara kubadilishana',
    'wauguzi wa meno kubadilishana',
    'afisa wa afya kubadilishana',
    'msaidizi wa afya kubadilishana',
    'afisa wa kilimo kubadilishana',
    'watumishi wa umma kubadilishana',
    'kubadilishana wilaya',
    'kubadilishana mkoa',
    'kuhamisha kazi tanzania',
    'kutafuta mtu wa kubadilishana',
    'kubadilishana dar es salaam',
    'kubadilishana dodoma',
    'kubadilishana arusha',
    'kubadilishana mwanza',
    'kubadilishana mbeya',
    'kubadilishana zanzibar',
    'exchange station tanzania',
    'tanzania teachers exchange',
    'health workers exchange tanzania',
    'teacher transfer tanzania',
    'health worker transfer',
    'bure kubadilishana vituo',
    'mfumo wa kubadilishana vituo',
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
        url: 'https://esstranfer.com/images/LOGOL.jpeg',
        width: 1200,
        height: 630,
        alt: 'Kubadilishana Vituo — Kubadilishana Portal ya Tanzania',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Kubadilishana Vituo — Tanzania',
    description:
      'Mfumo rasmi wa kubadilishana vituo vya kazi kwa watumishi wa Afya, Elimu, Umma na Kilimo Tanzania.',
    images: ['https://esstranfer.com/images/LOGOL.jpeg'],
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
    icon: '/images/LOGOL.jpeg',
    shortcut: '/images/LOGOL.jpeg',
    apple: '/images/LOGOL.jpeg',
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
