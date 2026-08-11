import type { Metadata } from 'next';
import './globals.css';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import ThemeInit from '@/components/ThemeInit';

export const metadata: Metadata = {
  title: 'Kubadilishana Vituo — Tanzania',
  description:
    'Mfumo wa kubadilishana vituo vya kazi kwa watumishi wa Idara ya Afya na Elimu Tanzania.',
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
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
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
