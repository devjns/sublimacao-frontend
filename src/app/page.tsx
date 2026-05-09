import Link from 'next/link';

export default function Home() {
  return (
    <main className="min-h-screen" style={{ background: 'var(--cream)' }}>
      {/* Header */}
      <header className="flex justify-between items-center px-8 py-6 border-b" style={{ borderColor: 'var(--gold-light)' }}>
        <span className="font-display text-2xl" style={{ color: 'var(--gold-dark)' }}>Artela</span>
        <Link href="/upload" className="text-sm font-medium px-5 py-2 rounded-full transition" style={{ background: 'var(--charcoal)', color: 'var(--cream)' }}>
          Criar agora
        </Link>
      </header>

      {/* Hero */}
      <section className="max-w-5xl mx-auto px-8 pt-24 pb-16 text-center">
        <p className="text-sm tracking-widest uppercase mb-4 font-medium" style={{ color: 'var(--gold)' }}>
          Arte personalizada com IA
        </p>
        <h1 className="font-display text-6xl leading-tight mb-6" style={{ color: 'var(--charcoal)' }}>
          Sua foto.<br />
          <em>Uma obra de arte.</em>
        </h1>
        <p className="text-lg max-w-lg mx-auto mb-10" style={{ color: 'var(--warm-gray)' }}>
          Envie uma foto e nossa IA transforma em telas decorativas personalizadas. Elegantes, únicas, suas.
        </p>
        <Link
          href="/upload"
          className="inline-block font-medium px-10 py-4 rounded-full text-lg transition hover:opacity-90"
          style={{ background: 'var(--gold)', color: 'var(--charcoal)' }}
        >
          Criar minhas telas →
        </Link>
      </section>

      {/* Como funciona */}
      <section className="max-w-4xl mx-auto px-8 py-16">
        <h2 className="font-display text-3xl text-center mb-12" style={{ color: 'var(--charcoal)' }}>Como funciona</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            { step: '01', title: 'Envie sua foto', desc: 'Faça upload de uma foto sua ou de quem você ama.' },
            { step: '02', title: 'A IA cria as artes', desc: 'Nossa IA transforma sua foto em telas decorativas únicas.' },
            { step: '03', title: 'Escolha e compre', desc: 'Receba o link pelo WhatsApp, escolha as telas e finalize.' },
          ].map(item => (
            <div key={item.step} className="text-center p-6 rounded-2xl canvas-texture" style={{ background: 'var(--warm-white)', border: '1px solid var(--gold-light)' }}>
              <span className="font-display text-5xl" style={{ color: 'var(--gold-light)' }}>{item.step}</span>
              <h3 className="font-display text-xl mt-2 mb-2" style={{ color: 'var(--charcoal)' }}>{item.title}</h3>
              <p style={{ color: 'var(--warm-gray)' }}>{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA final */}
      <section className="text-center py-16 px-8">
        <div className="inline-block px-12 py-10 rounded-3xl canvas-texture" style={{ background: 'var(--charcoal)' }}>
          <h2 className="font-display text-3xl mb-4" style={{ color: 'var(--gold-light)' }}>
            Pronto para transformar sua foto?
          </h2>
          <p className="mb-6" style={{ color: 'var(--canvas-tan)' }}>Em poucos minutos você terá artes únicas no seu WhatsApp.</p>
          <Link
            href="/upload"
            className="inline-block font-medium px-8 py-3 rounded-full transition hover:opacity-90"
            style={{ background: 'var(--gold)', color: 'var(--charcoal)' }}
          >
            Começar agora →
          </Link>
        </div>
      </section>

      <footer className="text-center py-6 text-sm" style={{ color: 'var(--warm-gray)', borderTop: '1px solid var(--gold-light)' }}>
        © 2025 Artela · Arte personalizada com IA
      </footer>
    </main>
  );
}
