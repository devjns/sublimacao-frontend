'use client';
import { useEffect, useState } from 'react';

const SENHA = 'admin123'; // troca aqui

const STATUS_LABELS: Record<string, string> = {
  pending: 'Aguardando pagamento',
  paid: 'Pago',
  in_production: 'Em produção',
  done: 'Concluído',
  cancelled: 'Cancelado',
};

const STATUS_COLORS: Record<string, string> = {
  pending: '#FEF3C7',
  paid: '#DBEAFE',
  in_production: '#EDE9FE',
  done: '#D1FAE5',
  cancelled: '#FEE2E2',
};

const STATUS_TEXT: Record<string, string> = {
  pending: '#92400E',
  paid: '#1E40AF',
  in_production: '#5B21B6',
  done: '#065F46',
  cancelled: '#991B1B',
};

export default function AdminPage() {
  const [authed, setAuthed] = useState(false);
  const [senha, setSenha] = useState('');
  const [senhaErro, setSenhaErro] = useState(false);
  const [orders, setOrders] = useState<any[]>([]);
  const [uploads, setUploads] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [tab, setTab] = useState<'pedidos' | 'uploads'>('pedidos');
  const [ondaGerada, setOndaGerada] = useState(false);
  const [ondaOrders, setOndaOrders] = useState<any[]>([]);

  function handleLogin() {
    if (senha === SENHA) {
      setAuthed(true);
      loadData();
    } else {
      setSenhaErro(true);
    }
  }

  async function loadData() {
    setLoading(true);
    try {
      const [ordersRes, uploadsRes] = await Promise.all([
        fetch(process.env.NEXT_PUBLIC_API_URL + '/admin/queue'),
        fetch(process.env.NEXT_PUBLIC_API_URL + '/admin/uploads'),
      ]);
      const ordersData = await ordersRes.json();
      const uploadsData = await uploadsRes.json();
      setOrders(Array.isArray(ordersData) ? ordersData : []);
      setUploads(Array.isArray(uploadsData) ? uploadsData : []);
    } finally {
      setLoading(false);
    }
  }

  async function updateStatus(orderId: string, status: string) {
    await fetch(process.env.NEXT_PUBLIC_API_URL + '/admin/orders/' + orderId + '/status', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    loadData();
  }

  // Gera "onda de produção": lista os pedidos pagos e marca como em produção
  async function gerarOnda() {
    const pagos = orders.filter(o => o.status === 'paid');
    if (pagos.length === 0) {
      alert('Nenhum pedido pago aguardando produção.');
      return;
    }
    setOndaOrders(pagos);
    setOndaGerada(true);
    // Marca todos como in_production
    await Promise.all(pagos.map(o => updateStatus(o.id, 'in_production')));
  }

  // Baixa todos os arquivos de um pedido como links
  function baixarArquivosPedido(order: any) {
    const urls = order.items?.map((i: any) => i.image_url).filter(Boolean) ?? [];
    if (urls.length === 0) {
      alert('Nenhum arquivo disponível neste pedido.');
      return;
    }
    urls.forEach((url: string, idx: number) => {
      const a = document.createElement('a');
      a.href = url;
      a.download = `arte_pedido_${order.id}_${idx + 1}.png`;
      a.target = '_blank';
      a.rel = 'noreferrer';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    });
  }

  // URL da galeria do upload
  function getGalleryUrl(upload: any) {
    const base = process.env.NEXT_PUBLIC_FRONTEND_URL || window.location.origin;
    return `${base}/gallery/${upload.id}`;
  }

  if (!authed) return (
    <main className="min-h-screen flex items-center justify-center" style={{ background: 'var(--cream)' }}>
      <div className="w-full max-w-sm p-8 rounded-2xl" style={{ background: 'var(--warm-white)', border: '1px solid var(--gold-light)' }}>
        <h1 className="font-display text-3xl mb-6 text-center" style={{ color: 'var(--charcoal)' }}>Admin</h1>
        <input
          type="password"
          placeholder="Senha"
          value={senha}
          onChange={e => { setSenha(e.target.value); setSenhaErro(false); }}
          onKeyDown={e => e.key === 'Enter' && handleLogin()}
          className="w-full px-4 py-3 rounded-xl outline-none mb-3"
          style={{ background: 'var(--cream)', border: '1.5px solid var(--gold-light)', color: 'var(--charcoal)' }}
        />
        {senhaErro && <p className="text-red-500 text-sm mb-3 text-center">Senha incorreta</p>}
        <button
          onClick={handleLogin}
          className="w-full py-3 rounded-xl font-medium transition hover:opacity-90"
          style={{ background: 'var(--charcoal)', color: 'var(--gold-light)' }}
        >
          Entrar
        </button>
      </div>
    </main>
  );

  const pedidosPagos = orders.filter(o => o.status === 'paid').length;

  return (
    <main className="min-h-screen" style={{ background: 'var(--cream)' }}>
      <header className="flex justify-between items-center px-8 py-5" style={{ borderBottom: '1px solid var(--gold-light)', background: 'var(--warm-white)' }}>
        <span className="font-display text-2xl" style={{ color: 'var(--gold-dark)' }}>Artela · Admin</span>
        <div className="flex gap-3 items-center">
          {/* Botão Gerar Onda */}
          <button
            onClick={gerarOnda}
            className="text-sm px-5 py-2 rounded-full font-medium transition hover:opacity-90"
            style={{ background: pedidosPagos > 0 ? 'var(--gold)' : 'var(--gold-light)', color: 'var(--charcoal)' }}
          >
            🌊 Gerar onda de produção {pedidosPagos > 0 ? `(${pedidosPagos})` : ''}
          </button>
          <button
            onClick={loadData}
            className="text-sm px-4 py-2 rounded-full"
            style={{ border: '1px solid var(--gold-light)', color: 'var(--warm-gray)' }}
          >
            ↻ Atualizar
          </button>
        </div>
      </header>

      {/* Modal da onda de produção */}
      {ondaGerada && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.7)' }}>
          <div className="w-full max-w-lg rounded-2xl p-8" style={{ background: 'var(--warm-white)' }}>
            <h2 className="font-display text-2xl mb-2" style={{ color: 'var(--charcoal)' }}>🌊 Onda de Produção Gerada!</h2>
            <p className="text-sm mb-5" style={{ color: 'var(--warm-gray)' }}>
              {ondaOrders.length} pedido(s) marcados como "Em produção":
            </p>
            <div className="space-y-3 mb-6 max-h-64 overflow-y-auto">
              {ondaOrders.map((o: any) => (
                <div key={o.id} className="flex justify-between items-start p-3 rounded-xl" style={{ background: 'var(--cream)' }}>
                  <div>
                    <p className="font-medium text-sm" style={{ color: 'var(--charcoal)' }}>{o.customer_name}</p>
                    <p className="text-xs" style={{ color: 'var(--warm-gray)' }}>
                      {o.items?.length ?? 0} item(s) · R$ {Number(o.total).toFixed(2).replace('.', ',')}
                    </p>
                  </div>
                  <button
                    onClick={() => baixarArquivosPedido(o)}
                    className="text-xs px-3 py-1 rounded-full transition hover:opacity-80"
                    style={{ background: 'var(--gold)', color: 'var(--charcoal)' }}
                  >
                    ↓ Baixar artes
                  </button>
                </div>
              ))}
            </div>
            <button
              onClick={() => setOndaGerada(false)}
              className="w-full py-3 rounded-xl font-medium"
              style={{ background: 'var(--charcoal)', color: 'var(--gold-light)' }}
            >
              Fechar
            </button>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-2 px-8 pt-6">
        {(['pedidos', 'uploads'] as const).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className="px-6 py-2 rounded-full text-sm font-medium capitalize transition"
            style={tab === t
              ? { background: 'var(--charcoal)', color: 'var(--gold-light)' }
              : { background: 'var(--warm-white)', color: 'var(--warm-gray)', border: '1px solid var(--gold-light)' }
            }
          >
            {t === 'pedidos' ? `Pedidos (${orders.length})` : `Uploads (${uploads.length})`}
          </button>
        ))}
      </div>

      <div className="max-w-6xl mx-auto px-8 py-6">
        {loading && <p style={{ color: 'var(--warm-gray)' }}>Carregando...</p>}

        {/* PEDIDOS */}
        {tab === 'pedidos' && !loading && (
          <div className="space-y-4">
            {orders.length === 0 && <p style={{ color: 'var(--warm-gray)' }}>Nenhum pedido ainda.</p>}
            {orders.map((order: any) => (
              <div key={order.id} className="rounded-2xl p-6" style={{ background: 'var(--warm-white)', border: '1px solid var(--gold-light)' }}>
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <p className="font-display text-xl" style={{ color: 'var(--charcoal)' }}>{order.customer_name}</p>
                    <p className="text-sm" style={{ color: 'var(--warm-gray)' }}>{order.email} · {order.whatsapp}</p>
                    <p className="text-xs mt-1" style={{ color: 'var(--canvas-tan)' }}>{new Date(order.created_at).toLocaleString('pt-BR')}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-medium px-3 py-1 rounded-full" style={{ background: STATUS_COLORS[order.status], color: STATUS_TEXT[order.status] }}>
                      {STATUS_LABELS[order.status]}
                    </span>
                    {/* Botão baixar todos os arquivos do pedido */}
                    <button
                      onClick={() => baixarArquivosPedido(order)}
                      className="text-xs px-3 py-1.5 rounded-full transition hover:opacity-80"
                      style={{ background: 'var(--gold-light)', color: 'var(--gold-dark)', border: '1px solid var(--gold)' }}
                    >
                      ↓ Baixar artes
                    </button>
                  </div>
                </div>

                {/* Itens */}
                <div className="mb-4 space-y-2">
                  {order.items?.map((item: any) => (
                    <div key={item.id} className="flex justify-between items-center text-sm p-3 rounded-xl" style={{ background: 'var(--cream)' }}>
                      <div className="flex items-center gap-3">
                        {item.image_url && (
                          <img src={item.image_url} alt={item.product_name} className="w-12 h-12 rounded-lg object-cover" />
                        )}
                        <div>
                          <p style={{ color: 'var(--charcoal)' }}>{item.product_name} · {item.size}</p>
                          <p className="text-xs" style={{ color: 'var(--warm-gray)' }}>Qtd: {item.quantity}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span style={{ color: 'var(--gold-dark)' }}>R$ {(item.price * item.quantity).toFixed(2).replace('.', ',')}</span>
                        {item.image_url && (
                          <a
                            href={item.image_url}
                            download
                            target="_blank"
                            rel="noreferrer"
                            className="text-xs px-3 py-1 rounded-full transition hover:opacity-80"
                            style={{ background: 'var(--gold)', color: 'var(--charcoal)' }}
                          >
                            ↓ Baixar
                          </a>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="flex justify-between items-center pt-3" style={{ borderTop: '1px solid var(--gold-light)' }}>
                  <p className="font-display text-lg" style={{ color: 'var(--charcoal)' }}>
                    Total: R$ {Number(order.total).toFixed(2).replace('.', ',')}
                  </p>
                  <div className="flex gap-2 flex-wrap justify-end">
                    {Object.entries(STATUS_LABELS).map(([s, label]) => (
                      <button
                        key={s}
                        onClick={() => updateStatus(order.id, s)}
                        disabled={order.status === s}
                        className="text-xs px-3 py-1.5 rounded-lg transition"
                        style={order.status === s
                          ? { background: STATUS_COLORS[s], color: STATUS_TEXT[s], fontWeight: 600 }
                          : { border: '1px solid var(--gold-light)', color: 'var(--warm-gray)' }
                        }
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* UPLOADS */}
        {tab === 'uploads' && !loading && (
          <div className="space-y-4">
            {uploads.length === 0 && <p style={{ color: 'var(--warm-gray)' }}>Nenhum upload ainda.</p>}
            {uploads.map((upload: any) => (
              <div key={upload.id} className="rounded-2xl p-5 flex justify-between items-center gap-4 flex-wrap" style={{ background: 'var(--warm-white)', border: '1px solid var(--gold-light)' }}>
                <div className="flex-1 min-w-0">
                  <p className="font-medium" style={{ color: 'var(--charcoal)' }}>{upload.name}</p>
                  <p className="text-sm" style={{ color: 'var(--warm-gray)' }}>{upload.email} · {upload.whatsapp}</p>
                  <p className="text-xs mt-1" style={{ color: 'var(--canvas-tan)' }}>{new Date(upload.created_at).toLocaleString('pt-BR')}</p>
                  {/* Link da galeria clicável */}
                  {upload.status === 'ready' && (
                    <a
                      href={getGalleryUrl(upload)}
                      target="_blank"
                      rel="noreferrer"
                      className="text-xs mt-1 inline-block underline truncate max-w-xs"
                      style={{ color: 'var(--gold-dark)' }}
                    >
                      🔗 {getGalleryUrl(upload)}
                    </a>
                  )}
                </div>
                <div className="flex items-center gap-3 flex-shrink-0">
                  <span
                    className="text-xs font-medium px-3 py-1 rounded-full"
                    style={{
                      background: upload.status === 'ready' ? '#D1FAE5' : upload.status === 'error' ? '#FEE2E2' : '#FEF3C7',
                      color: upload.status === 'ready' ? '#065F46' : upload.status === 'error' ? '#991B1B' : '#92400E',
                    }}
                  >
                    {upload.status === 'ready' ? 'Gerado' : upload.status === 'error' ? 'Erro' : 'Processando'}
                  </span>
                  {/* Botão copiar link */}
                  {upload.status === 'ready' && (
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(getGalleryUrl(upload));
                        alert('Link copiado!');
                      }}
                      className="text-xs px-3 py-1.5 rounded-full transition hover:opacity-80"
                      style={{ background: 'var(--gold-light)', color: 'var(--gold-dark)', border: '1px solid var(--gold)' }}
                    >
                      📋 Copiar link
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
