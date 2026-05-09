'use client';
import { useEffect, useState } from 'react';
import { getProductionQueue, updateOrderStatus } from '@/lib/api';

const STATUS_LABELS: Record<string, string> = {
  pending: '⏳ Pendente',
  in_production: '🔧 Em produção',
  done: '✅ Concluído',
  cancelled: '❌ Cancelado',
};

const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  in_production: 'bg-blue-100 text-blue-800',
  done: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-100 text-red-800',
};

export default function AdminPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    try {
      const data = await getProductionQueue();
      setOrders(data);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  async function handleStatus(orderId: string, status: string) {
    await updateOrderStatus(orderId, status);
    load();
  }

  if (loading) return <main className="flex items-center justify-center min-h-screen"><p>Carregando...</p></main>;

  return (
    <main className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-bold text-indigo-600 mb-6">📋 Fila de Produção</h1>

      {orders.length === 0 && <p className="text-gray-500">Nenhum pedido ainda.</p>}

      <div className="space-y-4">
        {orders.map(order => (
          <div key={order.id} className="bg-white rounded-xl shadow p-5">
            <div className="flex justify-between items-start mb-3">
              <div>
                <p className="font-bold">{order.customer_name}</p>
                <p className="text-sm text-gray-500">{order.email} • {order.whatsapp}</p>
                <p className="text-xs text-gray-400 mt-1">{new Date(order.created_at).toLocaleString('pt-BR')}</p>
              </div>
              <span className={`text-xs font-semibold px-3 py-1 rounded-full ${STATUS_COLORS[order.status]}`}>
                {STATUS_LABELS[order.status]}
              </span>
            </div>

            <div className="border-t pt-3 mb-3">
              {order.items?.map((item: any) => (
                <div key={item.id} className="flex justify-between text-sm py-1">
                  <span>{item.product_name} ({item.size}) x{item.quantity}</span>
                  <span>R$ {(item.price * item.quantity).toFixed(2).replace('.', ',')}</span>
                </div>
              ))}
              <div className="flex justify-between font-bold mt-2 pt-2 border-t">
                <span>Total</span>
                <span>R$ {order.total.toFixed(2).replace('.', ',')}</span>
              </div>
            </div>

            <div className="flex gap-2 flex-wrap">
              {['pending', 'in_production', 'done', 'cancelled'].map(s => (
                <button
                  key={s}
                  onClick={() => handleStatus(order.id, s)}
                  disabled={order.status === s}
                  className={`text-xs px-3 py-1.5 rounded-lg border transition ${order.status === s ? 'opacity-40 cursor-default' : 'hover:bg-gray-100'}`}
                >
                  {STATUS_LABELS[s]}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}
