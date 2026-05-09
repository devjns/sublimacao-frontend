'use client';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';

const SIZES: Record<string, string> = {
  tela_quadrada_media: '30x30cm',
  tela_horizontal_media: '40x30cm',
  tela_vertical_media: '30x40cm',
};

type CartItem = {
  product_id: string;
  product_name: string;
  size: string;
  price: number;
  image_url: string;
  quantity: number;
};

export default function GalleryPage() {
  const { token } = useParams() as { token: string };
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [ordering, setOrdering] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);
  const [lightbox, setLightbox] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(process.env.NEXT_PUBLIC_API_URL + '/gallery/' + token);
        const json = await res.json();
        setData(json);
        if (json.status === 'processing') setTimeout(load, 5000);
      } catch {
        setData({ error: true });
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [token]);

  function addToCart(product: any) {
    const size = SIZES[product.product_id] ?? 'Único';
    setCart(prev => {
      const exists = prev.find(i => i.product_id === product.product_id);
      if (exists) return prev.map(i => i.product_id === product.product_id ? { ...i, quantity: i.quantity + 1 } : i);
      return [...prev, { product_id: product.product_id, product_name: product.product_name, size, price: product.base_price, image_url: product.image_url, quantity: 1 }];
    });
    setCartOpen(true);
  }

  function removeFromCart(product_id: string) {
    setCart(prev => prev.filter(i => i.product_id !== product_id));
  }

  const total = cart.reduce((s, i) => s + i.price * i.quantity, 0);
  const cartCount = cart.reduce((s, i) => s + i.quantity, 0);

  async function handleCheckout() {
    if (!data?.user) return;
    try {
      setOrdering(true);
      const res = await fetch(process.env.NEXT_PUBLIC_API_URL + '/orders/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: data.user.id, items: cart })
      });
      const json = await res.json();
      if (json.checkoutUrl) {
        window.location.href = json.checkoutUrl;
      } else {
        alert('Erro ao criar pagamento. Tente novamente.');
      }
    } catch {
      alert('Erro ao finalizar pedido. Tente novamente.');
    } finally {
      setOrdering(false);
    }
  }

  if (loading) return (
    <main className="min-h-screen flex items-center justify-center" style={{ background: 'var(--cream)' }}>
      <div className="font-display text-2xl" style={{ color: 'var(--gold)' }}>Carregando...</div>
    </main>
  );

  if (data?.error) return (
    <main className="min-h-screen flex items-center justify-center" style={{ background: 'var(--cream)' }}>
      <p style={{ color: 'var(--warm-gray)' }}>Link inválido ou expirado.</p>
    </main>
  );

  if (data?.status === 'processing') return (
    <main className="min-h-screen flex flex-col items-center justify-center text-center p-8" style={{ background: 'var(--cream)' }}>
      <div className="font-display text-5xl mb-4" style={{ color: 'var(--gold)' }}>✦</div>
      <h2 className="font-display text-2xl mb-2" style={{ color: 'var(--charcoal)' }}>Criando suas telas...</h2>
      <p style={{ color: 'var(--warm-gray)' }}>Nossa IA está trabalhando. A página atualiza automaticamente!</p>
    </main>
  );

  return (
    <main className="min-h-screen" style={{ background: 'var(--cream)' }}>
      {/* Lightbox */}
      {lightbox && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.9)' }}
          onClick={() => setLightbox(null)}
        >
          <button
            className="absolute top-4 right-4 text-white text-3xl font-light"
            onClick={() => setLightbox(null)}
          >✕</button>
          <img
            src={lightbox}
            alt="Tela ampliada"
            className="max-w-full max-h-full rounded-xl"
            style={{ maxHeight: '90vh', objectFit: 'contain' }}
            onClick={e => e.stopPropagation()}
          />
        </div>
      )}

      {/* Header */}
      <header className="sticky top-0 z-10 flex justify-between items-center px-8 py-5" style={{ background: 'var(--cream)', borderBottom: '1px solid var(--gold-light)' }}>
        <Link href="/" className="font-display text-2xl" style={{ color: 'var(--gold-dark)' }}>Artela</Link>
        {cartCount > 0 && (
          <button
            onClick={() => setCartOpen(!cartOpen)}
            className="flex items-center gap-2 px-5 py-2 rounded-full font-medium text-sm transition hover:opacity-90"
            style={{ background: 'var(--charcoal)', color: 'var(--gold-light)' }}
          >
            🛒 Carrinho · {cartCount}
          </button>
        )}
      </header>

      <div className="max-w-5xl mx-auto px-8 py-10">
        <div className="mb-10">
          <p className="text-xs uppercase tracking-widest mb-1" style={{ color: 'var(--gold)' }}>Suas artes personalizadas</p>
          <h1 className="font-display text-4xl" style={{ color: 'var(--charcoal)' }}>Olá, {data?.user?.name}! ✨</h1>
          <p className="mt-2 text-sm" style={{ color: 'var(--warm-gray)' }}>Clique nas imagens para ampliar. Adicione as que desejar ao carrinho.</p>
        </div>

        {/* Produtos */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          {data?.products?.map((product: any) => (
            <div key={product.id} className="rounded-2xl overflow-hidden" style={{ background: 'var(--warm-white)', border: '1px solid var(--gold-light)' }}>
              <div className="relative group cursor-pointer" onClick={() => setLightbox(product.image_url)}>
                <img src={product.image_url} alt={product.product_name} className="w-full h-64 object-cover transition group-hover:opacity-90" />
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition" style={{ background: 'rgba(0,0,0,0.3)' }}>
                  <span className="text-white text-sm font-medium px-4 py-2 rounded-full" style={{ background: 'rgba(0,0,0,0.5)' }}>🔍 Ampliar</span>
                </div>
                <div className="absolute top-3 right-3 px-2 py-1 rounded-full text-xs font-medium" style={{ background: 'var(--charcoal)', color: 'var(--gold-light)' }}>
                  {SIZES[product.product_id]}
                </div>
              </div>
              <div className="p-4">
                <p className="font-medium text-sm mb-1" style={{ color: 'var(--charcoal)' }}>{product.product_name}</p>
                <p className="font-display text-xl mb-3" style={{ color: 'var(--gold-dark)' }}>
                  R$ {Number(product.base_price).toFixed(2).replace('.', ',')}
                </p>
                <button
                  onClick={() => addToCart(product)}
                  className="w-full py-2.5 rounded-xl text-sm font-medium transition hover:opacity-90"
                  style={{ background: 'var(--gold)', color: 'var(--charcoal)' }}
                >
                  + Adicionar ao carrinho
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Carrinho */}
        {cartOpen && cart.length > 0 && (
          <div className="rounded-2xl p-6" style={{ background: 'var(--warm-white)', border: '1px solid var(--gold-light)' }}>
            <h2 className="font-display text-2xl mb-5" style={{ color: 'var(--charcoal)' }}>Seu carrinho</h2>
            <div className="space-y-4 mb-6">
              {cart.map(item => (
                <div key={item.product_id} className="flex justify-between items-center pb-4" style={{ borderBottom: '1px solid var(--gold-light)' }}>
                  <div>
                    <p className="font-medium text-sm" style={{ color: 'var(--charcoal)' }}>{item.product_name}</p>
                    <p className="text-xs" style={{ color: 'var(--warm-gray)' }}>{item.size} · Qtd: {item.quantity}</p>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="font-display" style={{ color: 'var(--gold-dark)' }}>
                      R$ {(item.price * item.quantity).toFixed(2).replace('.', ',')}
                    </span>
                    <button onClick={() => removeFromCart(item.product_id)} className="text-xs" style={{ color: 'var(--warm-gray)' }}>✕</button>
                  </div>
                </div>
              ))}
            </div>
            <div className="flex justify-between items-center">
              <div>
                <p className="text-xs uppercase tracking-widest mb-1" style={{ color: 'var(--warm-gray)' }}>Total</p>
                <p className="font-display text-3xl" style={{ color: 'var(--charcoal)' }}>
                  R$ {total.toFixed(2).replace('.', ',')}
                </p>
              </div>
              <button
                onClick={handleCheckout}
                disabled={ordering}
                className="px-8 py-4 rounded-xl font-medium transition hover:opacity-90 disabled:opacity-50"
                style={{ background: 'var(--charcoal)', color: 'var(--gold-light)' }}
              >
                {ordering ? 'Aguarde...' : 'Finalizar e pagar →'}
              </button>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
