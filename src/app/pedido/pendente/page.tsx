import Link from 'next/link';

export default function PedidoPendente() {
  return (
    <main className="min-h-screen flex items-center justify-center p-8" style={{ background: 'var(--cream)' }}>
      <div className="text-center max-w-md">
        <div className="w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6 text-5xl" style={{ background: 'var(--gold-light)' }}>⏳</div>
        <h1 className="font-display text-4xl mb-3" style={{ color: 'var(--charcoal)' }}>Pagamento pendente</h1>
        <p className="mb-8" style={{ color: 'var(--warm-gray)' }}>
          Seu pagamento está sendo processado. Você receberá uma confirmação pelo WhatsApp assim que for aprovado.
        </p>
        <Link
          href="/"
          className="inline-block px-8 py-3 rounded-full font-medium transition hover:opacity-90"
          style={{ background: 'var(--charcoal)', color: 'var(--gold-light)' }}
        >
          Voltar ao início
        </Link>
      </div>
    </main>
  );
}
