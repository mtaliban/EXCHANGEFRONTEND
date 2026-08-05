const services = [
  { icon: '🏥', title: 'Watumishi wa Afya', desc: 'CO, ANO, EN, RN, MD, Lab Tech, Pharmacist na kada zote za Afya.', color: 'blue' },
  { icon: '👩‍🏫', title: 'Walimu', desc: 'Elimu Msingi na Sekondari — masomo yote (Math, Physics, Kiswahili, n.k.).', color: 'orange' },
  { icon: '🔎', title: 'Matching Auto', desc: 'Mfumo unatafuta wenzi kwa haraka kutokana na mkoa, wilaya na kada.', color: 'red' },
  { icon: '💬', title: 'Chat & Simu', desc: 'Wasiliana moja kwa moja kwenye mfumo au piga simu.', color: 'gold' },
  { icon: '🔔', title: 'Notifications', desc: 'Utapata taarifa mara moja mtu mpya wa kubadilishana atakapotokea.', color: 'blue' },
  { icon: '🛡️', title: 'Verification', desc: 'Namba za simu zinathibitishwa — hakuna matapeli.', color: 'red' },
];

export default function ServicesPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="text-center mb-12">
        <span className="badge-gold mb-3">Huduma Zetu</span>
        <h1 className="text-4xl font-bold text-brand-grey-900 mb-3">Kile Tunachotoa</h1>
        <p className="text-brand-grey-500 max-w-2xl mx-auto">
          Jukwaa kamili la kubadilishana vituo — kutoka usajili hadi kuwasiliana na aliyekusiliana.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {services.map((s) => (
          <div key={s.title} className="card hover:shadow-lg transition group">
            <div className={`w-14 h-14 rounded-xl bg-brand-${s.color}-100 flex items-center justify-center text-3xl mb-4 group-hover:scale-110 transition`}>
              {s.icon}
            </div>
            <h3 className="text-xl font-bold text-brand-grey-900 mb-2">{s.title}</h3>
            <p className="text-brand-grey-500">{s.desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
