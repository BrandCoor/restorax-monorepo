'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

interface Product {
  id: string;
  name: string;
  price: number;
  description?: string;
}

interface Category {
  id: string;
  name: string;
  products: Product[];
}

export default function QrMenuPage() {
  const params = useParams();
  const tableId = params.tableId as string;
  const [data, setData] = useState<{
    restaurant: { name: string };
    branch: { name: string };
    table: { name: string };
    menu: Category[];
  } | null>(null);
  const [cart, setCart] = useState<Record<string, number>>({});
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void axios.get(`${API_URL}/qr-menu/table/${tableId}`).then((res) => {
      setData(res.data);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [tableId]);

  const addToCart = (productId: string) => {
    setCart((prev) => ({ ...prev, [productId]: (prev[productId] || 0) + 1 }));
  };

  const submitOrder = async () => {
    const items = Object.entries(cart).map(([productId, quantity]) => ({ productId, quantity, options: [] }));
    if (!items.length) return;
    await axios.post(`${API_URL}/qr-menu/order/${tableId}`, { items });
    setCart({});
    setSent(true);
    setTimeout(() => setSent(false), 4000);
  };

  const total = data?.menu.flatMap((c) => c.products).reduce((sum, p) => sum + (cart[p.id] || 0) * Number(p.price), 0) ?? 0;

  if (loading) return <div className="min-h-screen bg-gray-950 flex items-center justify-center text-white">Yükleniyor...</div>;
  if (!data) return <div className="min-h-screen bg-gray-950 flex items-center justify-center text-red-400">Masa bulunamadı.</div>;

  return (
    <div className="min-h-screen bg-gray-950 text-white pb-28">
      <header className="sticky top-0 z-10 bg-gray-900/95 border-b border-gray-800 px-4 py-4">
        <h1 className="text-xl font-extrabold">{data.restaurant.name}</h1>
        <p className="text-sm text-gray-400">{data.table.name} · {data.branch.name}</p>
      </header>

      <main className="p-4 space-y-8">
        {data.menu.map((cat) => (
          <section key={cat.id}>
            <h2 className="text-lg font-bold mb-3 text-indigo-300">{cat.name}</h2>
            <div className="space-y-3">
              {cat.products?.filter((p) => p).map((p) => (
                <div key={p.id} className="flex justify-between items-center rounded-xl border border-gray-800 bg-gray-900/50 p-4">
                  <div>
                    <p className="font-semibold">{p.name}</p>
                    {p.description && <p className="text-xs text-gray-500 mt-0.5">{p.description}</p>}
                    <p className="text-indigo-400 font-bold mt-1">{Number(p.price).toFixed(2)} ₺</p>
                  </div>
                  <button
                    onClick={() => addToCart(p.id)}
                    className="px-4 py-2 rounded-lg bg-indigo-600 font-bold text-sm"
                  >
                    + {cart[p.id] || 0}
                  </button>
                </div>
              ))}
            </div>
          </section>
        ))}
      </main>

      {Object.keys(cart).length > 0 && (
        <footer className="fixed bottom-0 left-0 right-0 bg-gray-900 border-t border-gray-800 p-4">
          {sent && <p className="text-emerald-400 text-sm text-center mb-2">Siparişiniz mutfağa iletildi!</p>}
          <div className="flex justify-between items-center max-w-lg mx-auto gap-4">
            <span className="font-bold text-lg">{total.toFixed(2)} ₺</span>
            <button onClick={() => void submitOrder()} className="flex-1 py-3 rounded-xl bg-emerald-600 font-extrabold">
              Sipariş Ver
            </button>
          </div>
        </footer>
      )}
    </div>
  );
}
