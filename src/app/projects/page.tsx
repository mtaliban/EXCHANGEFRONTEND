export default function ProjectsPage() {
  const projects = [
    { title: 'Awamu ya Kwanza: Usajili', status: 'Inaendelea', desc: 'Register, Login, na Profile kwa watumishi wote wa Afya na Elimu.', color: 'orange' },
    { title: 'Awamu ya Pili: Matching & Chat', status: 'Kuja', desc: 'Kuona wanaotaka kuja kwako + kuchat na kupiga simu ndani ya mfumo.', color: 'blue' },
    { title: 'Awamu ya Tatu: Mobile App', status: 'Kuja', desc: 'App za Android na iOS zenye notifications za real-time.', color: 'red' },
    { title: 'Awamu ya Nne: Malipo & Verification', status: 'Kuja', desc: 'Integration ya Selcom na Mixx by Yas + OTP verification.', color: 'gold' },
  ];

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="text-center mb-12">
        <span className="badge-gold mb-3">Miradi Yetu</span>
        <h1 className="text-4xl font-bold text-brand-grey-900">Ramani ya Mfumo</h1>
      </div>

      <div className="space-y-4">
        {projects.map((p, i) => (
          <div key={i} className="card flex items-start gap-4">
            <div className={`w-12 h-12 flex-shrink-0 rounded-full bg-brand-${p.color} text-white flex items-center justify-center font-bold`}>
              {i + 1}
            </div>
            <div className="flex-1">
              <div className="flex items-start justify-between flex-wrap gap-2">
                <h3 className="text-xl font-bold text-brand-grey-900">{p.title}</h3>
                <span className={`text-xs font-semibold px-3 py-1 rounded-full bg-brand-${p.color}-100 text-brand-${p.color}-600`}>
                  {p.status}
                </span>
              </div>
              <p className="text-brand-grey-500 mt-2">{p.desc}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
