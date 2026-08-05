export default function AboutPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="text-center mb-10">
        <span className="badge-gold mb-3">Kuhusu Sisi</span>
        <h1 className="text-4xl font-bold text-brand-grey-900">Nia Yetu na Historia Yetu</h1>
      </div>

      <div className="prose max-w-none space-y-6 text-brand-grey-700">
        <div className="card">
          <h2 className="text-2xl font-bold text-brand-blue mb-3">Nia Yetu</h2>
          <p>
            Kuwasaidia watumishi wa Serikali (Idara ya Afya na Elimu) kubadilishana vituo vya kazi kwa uwazi, haraka, na bila kupitia matapeli. Tunatatua tatizo la posts za WhatsApp zisizo na muundo, ambazo hazitoi majibu ya haraka.
          </p>
        </div>

        <div className="card">
          <h2 className="text-2xl font-bold text-brand-orange mb-3">Tatizo Tunalotatua</h2>
          <ul className="space-y-2 list-disc pl-6">
            <li>Posts za WhatsApp ni ngumu kutafuta — unascroll mamia ya posts.</li>
            <li>Hakuna verification — matapeli wanajivunia.</li>
            <li>Format tofauti tofauti — matching ni ngumu.</li>
            <li>Post ikishaposti, huwezi kubadilisha unakotaka kuhamia.</li>
          </ul>
        </div>

        <div className="card">
          <h2 className="text-2xl font-bold text-brand-red mb-3">Suluhisho Letu</h2>
          <p>
            Jukwaa la kidijitali linaloshughulikia matching auto — unaingia data zako mara moja, mfumo unakuletea wanaotaka kuja kwako na wenye kada sawa nawe. Hakuna kuscroll, hakuna matapeli.
          </p>
        </div>
      </div>
    </div>
  );
}
