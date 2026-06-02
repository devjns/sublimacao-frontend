'use client';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';

// Tamanhos fixos disponíveis por produto
const SIZES: Record<string, { label: string; w: number; h: number; price: number }[]> = {
  tela_quadrada_media: [
    { label: '30×30cm', w: 30, h: 30, price: 89.90 },
    { label: '40×40cm', w: 40, h: 40, price: 119.90 },
    { label: '50×50cm', w: 50, h: 50, price: 149.90 },
  ],
  tela_horizontal_media: [
    { label: '40×30cm', w: 40, h: 30, price: 99.90 },
    { label: '60×40cm', w: 60, h: 40, price: 139.90 },
    { label: '80×60cm', w: 80, h: 60, price: 189.90 },
  ],
  tela_vertical_media: [
    { label: '30×40cm', w: 30, h: 40, price: 99.90 },
    { label: '40×60cm', w: 40, h: 60, price: 139.90 },
    { label: '60×80cm', w: 60, h: 80, price: 189.90 },
  ],
};

// Preço por cm² para tamanho personalizado (base: 89,90 / 900cm²)
const PRICE_PER_CM2 = 89.90 / 900;
const MIN_CUSTOM_DIM = 20;
const MAX_CUSTOM_DIM = 120;

// Dimensões reais do sofá e das telas em cm, para cálculo de proporção
const SOFA_WIDTH_CM = 200;
const SOFA_HEIGHT_CM = 90;
const SOFA_IMG_PX = 500; // largura do sofá na imagem de preview

type CartItem = {
  product_id: string;
  product_name: string;
  size: string;
  price: number;
  image_url: string;
  quantity: number;
};

type CustomSize = { w: string; h: string };

export default function GalleryPage() {
  const { token } = useParams() as { token: string };
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [ordering, setOrdering] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);
  const [lightbox, setLightbox] = useState<string | null>(null);

  // Por produto: tamanho selecionado e custom
  const [selectedSize, setSelectedSize] = useState<Record<string, string>>({});
  const [customSize, setCustomSize] = useState<Record<string, CustomSize>>({});
  const [customError, setCustomError] = useState<Record<string, string>>({});
  const [showSofa, setShowSofa] = useState<Record<string, boolean>>({});

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

  function getSizesFor(productId: string) {
    return SIZES[productId] ?? [{ label: '30×30cm', w: 30, h: 30, price: 89.90 }];
  }

  function getSelectedSizeLabel(productId: string) {
    return selectedSize[productId] ?? getSizesFor(productId)[0].label;
  }

  function getSelectedSizeData(productId: string) {
    const label = getSelectedSizeLabel(productId);
    if (label === 'personalizado') return null;
    return getSizesFor(productId).find(s => s.label === label) ?? getSizesFor(productId)[0];
  }

  function getCustomPrice(productId: string): number {
    const c = customSize[productId];
    if (!c) return 0;
    const w = parseFloat(c.w);
    const h = parseFloat(c.h);
    if (!w || !h) return 0;
    return Math.max(59.90, Math.round(w * h * PRICE_PER_CM2 * 100) / 100);
  }

  function getEffectivePrice(productId: string): number {
    if (getSelectedSizeLabel(productId) === 'personalizado') {
      return getCustomPrice(productId);
    }
    return getSelectedSizeData(productId)?.price ?? 0;
  }

  function validateCustom(productId: string): boolean {
    const c = customSize[productId];
    const w = parseFloat(c?.w ?? '');
    const h = parseFloat(c?.h ?? '');
    if (!w || !h) {
      setCustomError(prev => ({ ...prev, [productId]: 'Informe largura e altura.' }));
      return false;
    }
    if (w < MIN_CUSTOM_DIM || h < MIN_CUSTOM_DIM) {
      setCustomError(prev => ({ ...prev, [productId]: `Mínimo ${MIN_CUSTOM_DIM}cm em cada dimensão.` }));
      return false;
    }
    if (w > MAX_CUSTOM_DIM || h > MAX_CUSTOM_DIM) {
      setCustomError(prev => ({ ...prev, [productId]: `Máximo ${MAX_CUSTOM_DIM}cm em cada dimensão.` }));
      return false;
    }
    setCustomError(prev => ({ ...prev, [productId]: '' }));
    return true;
  }

  function addToCart(product: any) {
    const isCustom = getSelectedSizeLabel(product.product_id) === 'personalizado';
    if (isCustom && !validateCustom(product.product_id)) return;

    const sizeLabel = isCustom
      ? `${customSize[product.product_id]?.w}×${customSize[product.product_id]?.h}cm (personalizado)`
      : getSelectedSizeLabel(product.product_id);
    const price = getEffectivePrice(product.product_id);

    setCart(prev => {
      const key = product.product_id + '|' + sizeLabel;
      const exists = prev.find(i => i.product_id + '|' + i.size === key);
      if (exists) return prev.map(i => i.product_id + '|' + i.size === key ? { ...i, quantity: i.quantity + 1 } : i);
      return [...prev, {
        product_id: product.product_id,
        product_name: product.product_name,
        size: sizeLabel,
        price,
        image_url: product.image_url,
        quantity: 1,
      }];
    });
    setCartOpen(true);
  }

  function removeFromCart(index: number) {
    setCart(prev => prev.filter((_, i) => i !== index));
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
        body: JSON.stringify({ user_id: data.user.id, items: cart }),
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

  // Calcula dimensão do preview de sofá
  function getSofaPreviewStyle(productId: string) {
    const isCustom = getSelectedSizeLabel(productId) === 'personalizado';
    let w = 30, h = 30;
    if (isCustom) {
      w = parseFloat(customSize[productId]?.w ?? '30') || 30;
      h = parseFloat(customSize[productId]?.h ?? '30') || 30;
    } else {
      const sz = getSelectedSizeData(productId);
      w = sz?.w ?? 30;
      h = sz?.h ?? 30;
    }
    const scale = SOFA_IMG_PX / SOFA_WIDTH_CM;
    return {
      width: Math.round(w * scale),
      height: Math.round(h * scale),
    };
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
          <button className="absolute top-4 right-4 text-white text-3xl font-light" onClick={() => setLightbox(null)}>✕</button>
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
          <p className="mt-2 text-sm" style={{ color: 'var(--warm-gray)' }}>
            Escolha o tamanho de cada tela, visualize ao lado do sofá e adicione ao carrinho.
          </p>
        </div>

        {/* Produtos */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          {data?.products?.map((product: any) => {
            const sizes = getSizesFor(product.product_id);
            const selLabel = getSelectedSizeLabel(product.product_id);
            const isCustom = selLabel === 'personalizado';
            const price = getEffectivePrice(product.product_id);
            const sofaDims = getSofaPreviewStyle(product.product_id);

            return (
              <div key={product.id} className="rounded-2xl overflow-hidden flex flex-col" style={{ background: 'var(--warm-white)', border: '1px solid var(--gold-light)' }}>
                {/* Imagem */}
                <div className="relative group cursor-pointer" onClick={() => setLightbox(product.image_url)}>
                  <img src={product.image_url} alt={product.product_name} className="w-full h-56 object-cover transition group-hover:opacity-90" />
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition" style={{ background: 'rgba(0,0,0,0.3)' }}>
                    <span className="text-white text-sm font-medium px-4 py-2 rounded-full" style={{ background: 'rgba(0,0,0,0.5)' }}>🔍 Ampliar</span>
                  </div>
                </div>

                <div className="p-4 flex flex-col gap-3 flex-1">
                  <p className="font-medium text-sm" style={{ color: 'var(--charcoal)' }}>{product.product_name}</p>

                  {/* Swatches de tamanho */}
                  <div>
                    <p className="text-xs uppercase tracking-widest mb-2" style={{ color: 'var(--warm-gray)' }}>Tamanho</p>
                    <div className="flex flex-wrap gap-2">
                      {sizes.map(sz => (
                        <button
                          key={sz.label}
                          onClick={() => setSelectedSize(prev => ({ ...prev, [product.product_id]: sz.label }))}
                          className="text-xs px-3 py-1.5 rounded-lg border transition font-medium"
                          style={selLabel === sz.label
                            ? { background: 'var(--charcoal)', color: 'var(--gold-light)', borderColor: 'var(--charcoal)' }
                            : { background: 'transparent', color: 'var(--warm-gray)', borderColor: 'var(--gold-light)' }
                          }
                        >
                          {sz.label}
                        </button>
                      ))}
                      {/* Botão personalizado */}
                      <button
                        onClick={() => setSelectedSize(prev => ({ ...prev, [product.product_id]: 'personalizado' }))}
                        className="text-xs px-3 py-1.5 rounded-lg border transition font-medium"
                        style={isCustom
                          ? { background: 'var(--gold-dark)', color: '#fff', borderColor: 'var(--gold-dark)' }
                          : { background: 'transparent', color: 'var(--warm-gray)', borderColor: 'var(--gold-light)' }
                        }
                      >
                        ✏️ Personalizado
                      </button>
                    </div>
                  </div>

                  {/* Campos de tamanho personalizado */}
                  {isCustom && (
                    <div className="rounded-xl p-3 space-y-2" style={{ background: 'var(--cream)', border: '1px solid var(--gold-light)' }}>
                      <p className="text-xs" style={{ color: 'var(--warm-gray)' }}>Digite as dimensões (cm) — mín. 20, máx. 120</p>
                      <div className="flex gap-2 items-center">
                        <input
                          type="number"
                          placeholder="Larg."
                          min={MIN_CUSTOM_DIM}
                          max={MAX_CUSTOM_DIM}
                          value={customSize[product.product_id]?.w ?? ''}
                          onChange={e => {
                            setCustomSize(prev => ({ ...prev, [product.product_id]: { ...prev[product.product_id], w: e.target.value } }));
                            setCustomError(prev => ({ ...prev, [product.product_id]: '' }));
                          }}
                          className="w-full px-3 py-2 rounded-lg text-sm outline-none"
                          style={{ border: '1.5px solid var(--gold-light)', background: 'var(--warm-white)', color: 'var(--charcoal)' }}
                        />
                        <span style={{ color: 'var(--warm-gray)' }}>×</span>
                        <input
                          type="number"
                          placeholder="Alt."
                          min={MIN_CUSTOM_DIM}
                          max={MAX_CUSTOM_DIM}
                          value={customSize[product.product_id]?.h ?? ''}
                          onChange={e => {
                            setCustomSize(prev => ({ ...prev, [product.product_id]: { ...prev[product.product_id], h: e.target.value } }));
                            setCustomError(prev => ({ ...prev, [product.product_id]: '' }));
                          }}
                          className="w-full px-3 py-2 rounded-lg text-sm outline-none"
                          style={{ border: '1.5px solid var(--gold-light)', background: 'var(--warm-white)', color: 'var(--charcoal)' }}
                        />
                      </div>
                      {customError[product.product_id] && (
                        <p className="text-xs text-red-500">{customError[product.product_id]}</p>
                      )}
                      {getCustomPrice(product.product_id) > 0 && (
                        <p className="text-xs font-medium" style={{ color: 'var(--gold-dark)' }}>
                          Preço calculado: R$ {getCustomPrice(product.product_id).toFixed(2).replace('.', ',')}
                        </p>
                      )}
                    </div>
                  )}

                  {/* Preview com sofá */}
                  <div>
                    <button
                      onClick={() => setShowSofa(prev => ({ ...prev, [product.product_id]: !prev[product.product_id] }))}
                      className="text-xs underline transition"
                      style={{ color: 'var(--gold-dark)' }}
                    >
                      {showSofa[product.product_id] ? '▲ Ocultar preview' : '🛋️ Ver no ambiente'}
                    </button>

                    {showSofa[product.product_id] && (
                      <div className="mt-3 rounded-xl overflow-hidden relative" style={{ background: '#e8ddd0', height: '140px' }}>
                        {/* Sofá (SVG simples) */}
                        <svg viewBox="0 0 500 140" width="100%" height="140" xmlns="http://www.w3.org/2000/svg">
                          {/* Parede */}
                          <rect width="500" height="140" fill="#e8ddd0"/>
                          {/* Rodapé */}
                          <rect y="125" width="500" height="15" fill="#c4b49a"/>
                          {/* Sofá - corpo */}
                          <rect x="60" y="80" width="380" height="45" rx="8" fill="#8B7355"/>
                          {/* Sofá - encosto */}
                          <rect x="60" y="55" width="380" height="32" rx="6" fill="#6B5A45"/>
                          {/* Sofá - braços */}
                          <rect x="50" y="60" width="25" height="65" rx="6" fill="#7A6448"/>
                          <rect x="425" y="60" width="25" height="65" rx="6" fill="#7A6448"/>
                          {/* Sofá - pés */}
                          <rect x="75" y="120" width="15" height="10" rx="2" fill="#4a3728"/>
                          <rect x="180" y="120" width="15" height="10" rx="2" fill="#4a3728"/>
                          <rect x="305" y="120" width="15" height="10" rx="2" fill="#4a3728"/>
                          <rect x="410" y="120" width="15" height="10" rx="2" fill="#4a3728"/>
                          {/* Tela na parede — centralizada acima do sofá */}
                          <rect
                            x={250 - sofaDims.width / 2}
                            y={Math.max(4, 50 - sofaDims.height)}
                            width={sofaDims.width}
                            height={sofaDims.height}
                            fill="white"
                            stroke="#C9A96E"
                            strokeWidth="2"
                            rx="2"
                          />
                          {/* Imagem dentro da tela */}
                          <image
                            href={product.image_url}
                            x={250 - sofaDims.width / 2 + 3}
                            y={Math.max(7, 53 - sofaDims.height)}
                            width={sofaDims.width - 6}
                            height={sofaDims.height - 6}
                            preserveAspectRatio="xMidYMid slice"
                          />
                        </svg>
                        <p className="absolute bottom-1 right-2 text-xs" style={{ color: '#8B7355' }}>
                          {isCustom
                            ? `${customSize[product.product_id]?.w ?? '?'}×${customSize[product.product_id]?.h ?? '?'}cm`
                            : selLabel}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Preço e botão */}
                  <div className="mt-auto pt-2">
                    <p className="font-display text-xl mb-3" style={{ color: 'var(--gold-dark)' }}>
                      {price > 0 ? `R$ ${price.toFixed(2).replace('.', ',')}` : '—'}
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
              </div>
            );
          })}
        </div>

        {/* Carrinho */}
        {cartOpen && cart.length > 0 && (
          <div className="rounded-2xl p-6" style={{ background: 'var(--warm-white)', border: '1px solid var(--gold-light)' }}>
            <h2 className="font-display text-2xl mb-5" style={{ color: 'var(--charcoal)' }}>Seu carrinho</h2>
            <div className="space-y-4 mb-6">
              {cart.map((item, idx) => (
                <div key={idx} className="flex justify-between items-center pb-4" style={{ borderBottom: '1px solid var(--gold-light)' }}>
                  <div className="flex items-center gap-3">
                    <img src={item.image_url} alt={item.product_name} className="w-12 h-12 rounded-lg object-cover" />
                    <div>
                      <p className="font-medium text-sm" style={{ color: 'var(--charcoal)' }}>{item.product_name}</p>
                      <p className="text-xs" style={{ color: 'var(--warm-gray)' }}>{item.size} · Qtd: {item.quantity}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="font-display" style={{ color: 'var(--gold-dark)' }}>
                      R$ {(item.price * item.quantity).toFixed(2).replace('.', ',')}
                    </span>
                    <button onClick={() => removeFromCart(idx)} className="text-xs" style={{ color: 'var(--warm-gray)' }}>✕</button>
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
