import type { Metadata, Viewport } from 'next';
import './globals.css';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import ThemeInit from '@/components/ThemeInit';
import Script from 'next/script';

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  interactiveWidget: 'resizes-content',
};

export const metadata: Metadata = {
  title: {
    default: 'Kubadilishana Portal — Tafuta Mwenye Kubadilishana Nawe Tanzania',
    template: '%s | Kubadilishana Portal',
  },
  description:
    'Kubadilishana Portal — Tafuta mtu wa kubadilishana naye vituo vya kazi Tanzania. Bure kwa Walimu, Madaktari, Wauguzi, Wauguzi wa Maabara, Wauguzi wa Meno, Afisa wa Afya, Msaidizi wa Afya, Afisa wa Kilimo, na watumishi wote wa serikali. Jisajili sasa, chagua mkoa wako, na upate mwenzie.',
  keywords: [
    'kubadilishana',
    'kubadilishana portal',
    'kubadilishana vituo',
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
    'kubadilishana vituo vyote',
    'kubadilishana kazi',
    'exchange tanzania',
    'exchange station tanzania',
    'tanzania teachers exchange',
    'health workers exchange tanzania',
    'teacher transfer tanzania',
    'health worker transfer',
    'bure kubadilishana vituo',
    'mfumo wa kubadilishana vituo',
  ],
  authors: [{ name: 'Kubadilishana Portal' }],
  creator: 'Kubadilishana Portal',
  publisher: 'Kubadilishana Portal',
  metadataBase: new URL('https://esstranfer.com'),
  openGraph: {
    type: 'website',
    locale: 'sw_TZ',
    url: 'https://esstranfer.com',
    siteName: 'Kubadilishana Portal',
    title: 'Kubadilishana Portal — Tafuta Mwenye Kubadilishana Nawe Tanzania',
    description:
      'Kubadilishana Portal — Tafuta mtu wa kubadilishana naye vituo vya kazi Tanzania. Bure kwa Walimu, Madaktari, Wauguzi na watumishi wote wa serikali.',
    images: [
      {
        url: 'https://esstranfer.com/images/LOGOL.png',
        width: 1200,
        height: 630,
        alt: 'Kubadilishana Portal — Tafuta Mwenye Kubadilishana Nawe Tanzania',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Kubadilishana Portal — Tanzania',
    description:
      'Kubadilishana Portal — Tafuta mtu wa kubadilishana naye vituo vya kazi Tanzania. Bure kwa Walimu, Madaktari, Wauguzi na watumishi wote.',
    images: ['https://esstranfer.com/images/LOGOL.png'],
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
    icon: [
      { url: '/favicon.ico', sizes: '48x48' },
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
      { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
    ],
    apple: '/apple-touch-icon.png',
  },
  other: {
    'msapplication-TileColor': '#2563eb',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="sw" suppressHydrationWarning>
      <body className="min-h-screen flex flex-col">
        {/* Theme init — inatumika kabla ya first paint */}
        <Script id="theme-init" strategy="beforeInteractive" dangerouslySetInnerHTML={{ __html: `(function(){try{var t=JSON.parse(localStorage.getItem('kv_theme'));var th=(t&&t.state&&t.state.theme)||'light';var r=document.documentElement;r.classList.toggle('dark',th==='dark');r.style.colorScheme=th;}catch(e){}})();` }} />
        {/* Schema.org JSON-LD — helps Google understand the site structure */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'WebSite',
              name: 'Kubadilishana Portal',
              url: 'https://esstranfer.com',
              description: 'Tafuta mtu wa kubadilishana naye vituo vya kazi Tanzania. Bure kwa Walimu, Madaktari, Wauguzi na watumishi wote wa serikali.',
              potentialAction: {
                '@type': 'SearchAction',
                target: 'https://esstranfer.com/search?q={search_term_string}',
                'query-input': 'required name=search_term_string',
              },
            }),
          }}
        />
        <ThemeInit />
        <Navbar />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
