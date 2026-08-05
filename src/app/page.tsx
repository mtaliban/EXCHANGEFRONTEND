import Link from 'next/link';

export default function HomePage() {
  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-brand-blue via-brand-blue-700 to-brand-blue-900 text-white">
        <div className="absolute top-0 right-0 -mt-20 -mr-20 w-96 h-96 rounded-full bg-brand-orange opacity-20 blur-3xl" />
        <div className="absolute bottom-0 left-0 -mb-20 -ml-20 w-96 h-96 rounded-full bg-brand-gold opacity-20 blur-3xl" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-28">
          <div className="max-w-3xl">
            <span className="badge-gold mb-4">Tanzania • Idara ya Afya na Elimu</span>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight mb-6">
              Badilisha Kituo Chako cha Kazi <span className="text-brand-orange">kwa Urahisi</span>
            </h1>
            <p className="text-lg sm:text-xl text-brand-blue-100 mb-8">
              Jukwaa la kwanza Tanzania kwa watumishi wa Afya na Elimu kutafuta wa kubadilishana naye kituo cha kazi kwa haraka na uwazi.
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <Link href="/register" className="btn-accent text-lg px-8 py-3">
                Anza Sasa — Jisajili Bure
              </Link>
              <Link href="/services" className="inline-flex items-center justify-center rounded-lg border-2 border-white/40 px-8 py-3 text-white font-medium hover:bg-white/10 transition">
                Angalia Huduma
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-8 relative z-10">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { num: '26', label: 'Mikoa Yote' },
            { num: '188', label: 'Wilaya' },
            { num: '25,000+', label: 'Shule' },
            { num: '14,000+', label: 'Vituo vya Afya' },
          ].map((s) => (
            <div key={s.label} className="card text-center">
              <div className="text-3xl font-bold text-brand-blue">{s.num}</div>
              <div className="text-sm text-brand-grey-500 mt-1">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-brand-grey-900 mb-3">Jinsi Inavyofanya Kazi</h2>
          <p className="text-brand-grey-500">Hatua 4 rahisi kupata mtu wa kubadilishana naye kituo.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[
            { n: 1, color: 'blue', title: 'Jisajili', desc: 'Chagua idara na kada yako, weka kituo cha sasa.' },
            { n: 2, color: 'orange', title: 'Chagua Unakotaka', desc: 'Onyesha mikoa/wilaya au vituo unavyotaka kwenda.' },
            { n: 3, color: 'red', title: 'Ona Mechi', desc: 'Angalia watu wenye kada kama yako wanaotaka kuja kwako.' },
            { n: 4, color: 'gold', title: 'Wasiliana', desc: 'Tuma ujumbe au piga simu — thibitisha na mmoja.' },
          ].map((step) => (
            <div key={step.n} className="card">
              <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-white mb-4 bg-brand-${step.color}`}>
                {step.n}
              </div>
              <h3 className="font-bold text-brand-grey-900 mb-2">{step.title}</h3>
              <p className="text-sm text-brand-grey-500">{step.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="bg-gradient-to-r from-brand-orange to-brand-red text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 text-center">
          <h2 className="text-3xl font-bold mb-3">Uko Tayari Kubadilisha Kituo?</h2>
          <p className="text-white/90 mb-6 max-w-2xl mx-auto">
            Jisajili sasa bure. Tumeshakuwa na watumishi wengi wanaotafuta wenzi wa kubadilishana kila mkoa Tanzania.
          </p>
          <Link href="/register" className="inline-flex items-center justify-center rounded-lg bg-white px-8 py-3 text-brand-red font-bold shadow-lg hover:bg-brand-gold-100 transition">
            Jisajili Sasa
          </Link>
        </div>
      </section>
    </>
  );
}
