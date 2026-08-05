import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="bg-brand-grey-900 text-brand-grey-100 mt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand-blue to-brand-orange flex items-center justify-center text-white font-bold text-sm">
                KV
              </div>
              <span className="font-bold text-white">Kubadilishana Vituo</span>
            </div>
            <p className="text-sm text-brand-grey-300">
              Jukwaa la kubadilishana vituo vya kazi kwa watumishi wa Idara ya Afya na Elimu Tanzania.
            </p>
          </div>

          <div>
            <h4 className="font-semibold text-white mb-3">Kurasa</h4>
            <ul className="space-y-2 text-sm">
              <li><Link href="/" className="hover:text-brand-orange">Nyumbani</Link></li>
              <li><Link href="/about" className="hover:text-brand-orange">Kuhusu Sisi</Link></li>
              <li><Link href="/services" className="hover:text-brand-orange">Huduma Zetu</Link></li>
              <li><Link href="/projects" className="hover:text-brand-orange">Miradi Yetu</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-white mb-3">Akaunti</h4>
            <ul className="space-y-2 text-sm">
              <li><Link href="/register" className="hover:text-brand-orange">Jisajili</Link></li>
              <li><Link href="/login" className="hover:text-brand-orange">Ingia</Link></li>
              <li><Link href="/contact" className="hover:text-brand-orange">Wasiliana Nasi</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-white mb-3">Wasiliana</h4>
            <p className="text-sm text-brand-grey-300 mb-2">WhatsApp: 0778 764 578</p>
            <p className="text-sm text-brand-grey-300">Simu: 0710 703 705</p>
          </div>
        </div>

        <div className="border-t border-brand-grey-700 mt-8 pt-6 text-center text-sm text-brand-grey-400">
          © {new Date().getFullYear()} Kubadilishana Vituo. Haki zote zimehifadhiwa.
        </div>
      </div>
    </footer>
  );
}
