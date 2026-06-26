'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useParams } from 'next/navigation';
import axios from 'axios';
import { Plus, Minus, ShoppingBag, Sparkles, CheckCircle2 } from 'lucide-react';

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

interface CartItem {
  product: Product;
  quantity: number;
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
  const [cart, setCart] = useState<Record<string, CartItem>>({});
  const [activeCategory, setActiveCategory] = useState('');
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void axios.get(`${API_URL}/qr-menu/table/${tableId}`).then((res) => {
      setData(res.data);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [tableId]);

  useEffect(() => {
    if (data?.menu?.length) {
      setActiveCategory(data.menu[0].id);
    }
  }, [data]);

  const addToCart = (product: Product) => {
    setCart((prev) => {
      const existing = prev[product.id];
      return {
        ...prev,
        [product.id]: {
          product,
          quantity: (existing?.quantity || 0) + 1,
        },
      };
    });
  };

  const updateQuantity = (productId: string, delta: number) => {
    setCart((prev) => {
      const existing = prev[productId];
      if (!existing) return prev;
      const nextQuantity = existing.quantity + delta;
      if (nextQuantity <= 0) {
        const updated = { ...prev };
        delete updated[productId];
        return updated;
      }
      return {
        ...prev,
        [productId]: {
          ...existing,
          quantity: nextQuantity,
        },
      };
    });
  };

  const submitOrder = async () => {
    const items = Object.values(cart).map(({ product, quantity }) => ({ productId: product.id, quantity, options: [] }));
    if (!items.length) return;
    await axios.post(`${API_URL}/qr-menu/order/${tableId}`, { items });
    setCart({});
    setSent(true);
    setTimeout(() => setSent(false), 4000);
  };

  const total = useMemo(() => Object.values(cart).reduce((sum, item) => sum + item.quantity * Number(item.product.price), 0), [cart]);
  const itemCount = useMemo(() => Object.values(cart).reduce((sum, item) => sum + item.quantity, 0), [cart]);

  if (loading) return <div className="flex min-h-screen items-center justify-center bg-gray-950 text-white">Yükleniyor...</div>;
  if (!data) return <div className="flex min-h-screen items-center justify-center bg-gray-950 text-red-400">Masa bulunamadı.</div>;

  const selectedCategory = data.menu.find((cat) => cat.id === activeCategory) ?? data.menu[0];

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(99,102,241,0.15),_transparent_45%),_#050816] pb-40 text-white">
      <header className="sticky top-0 z-10 border-b border-white/10 bg-slate-950/85 px-4 py-4 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 text-indigo-300">
              <Sparkles className="h-4 w-4" />
              <span className="text-xs font-semibold uppercase tracking-[0.25em]">QR Menü</span>
            </div>
            <h1 className="text-xl font-extrabold">{data.restaurant.name}</h1>
            <p className="text-sm text-gray-400">{data.table.name} · {data.branch.name}</p>
          </div>
          <div className="rounded-full border border-emerald-900/40 bg-emerald-950/30 px-3 py-1 text-sm font-semibold text-emerald-300">
            Sipariş hazır
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl space-y-6 p-4">
        <section className="rounded-3xl border border-white/10 bg-slate-900/70 p-5 shadow-[0_0_0_1px_rgba(255,255,255,0.03)]">
          <p className="text-sm font-semibold uppercase tracking-[0.25em] text-indigo-300">Bugünün önerileri</p>
          <h2 className="mt-2 text-2xl font-bold text-white">Hızlı ve rahat sipariş deneyimi</h2>
          <p className="mt-2 max-w-2xl text-sm text-gray-400">Ürünü seçin, sepetinizi güncelleyin ve masanızdan anında mutfağa iletin.</p>
        </section>

        <section className="flex flex-wrap gap-2">
          {data.menu.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`rounded-full border px-3 py-2 text-sm font-semibold transition ${activeCategory === cat.id ? 'border-indigo-500 bg-indigo-600 text-white' : 'border-white/10 bg-slate-900/70 text-gray-300'}`}
            >
              {cat.name}
            </button>
          ))}
        </section>

        {selectedCategory && (
          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-white">{selectedCategory.name}</h3>
              <span className="text-sm text-gray-400">{selectedCategory.products.length} ürün</span>
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              {selectedCategory.products.map((product) => {
                const quantity = cart[product.id]?.quantity || 0;
                return (
                  <div key={product.id} className="rounded-2xl border border-white/10 bg-slate-900/70 p-4 shadow-[0_0_0_1px_rgba(255,255,255,0.03)]">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-semibold text-white">{product.name}</p>
                        {product.description && <p className="mt-1 text-sm text-gray-400">{product.description}</p>}
                      </div>
                      <div className="rounded-full border border-indigo-900/40 bg-indigo-950/30 px-2.5 py-1 text-sm font-semibold text-indigo-300">
                        {Number(product.price).toFixed(2)} ₺
                      </div>
                    </div>

                    <div className="mt-4 flex items-center justify-between">
                      {quantity > 0 ? (
                        <div className="flex items-center gap-2 rounded-full border border-white/10 bg-slate-950/60 px-2 py-1">
                          <button onClick={() => updateQuantity(product.id, -1)} className="rounded-full p-1 text-gray-300 hover:bg-white/10">
                            <Minus className="h-4 w-4" />
                          </button>
                          <span className="min-w-6 text-center text-sm font-semibold text-white">{quantity}</span>
                          <button onClick={() => addToCart(product)} className="rounded-full p-1 text-gray-300 hover:bg-white/10">
                            <Plus className="h-4 w-4" />
                          </button>
                        </div>
                      ) : (
                        <button onClick={() => addToCart(product)} className="rounded-full bg-indigo-600 px-3 py-2 text-sm font-semibold text-white">
                          Sepete ekle
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}
      </main>

      <footer className="fixed bottom-0 left-0 right-0 border-t border-white/10 bg-slate-950/95 p-4 backdrop-blur">
        <div className="mx-auto flex max-w-5xl flex-col gap-3 rounded-2xl border border-white/10 bg-slate-900/70 p-3 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-3">
            <div className="rounded-2xl bg-indigo-950/60 p-2">
              <ShoppingBag className="h-5 w-5 text-indigo-300" />
            </div>
            <div>
              <p className="text-sm font-semibold text-white">{itemCount} ürün · {total.toFixed(2)} ₺</p>
              <p className="text-xs text-gray-400">Masa {data.table.name}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {sent && (
              <div className="flex items-center gap-2 rounded-full border border-emerald-900/40 bg-emerald-950/30 px-3 py-2 text-sm font-semibold text-emerald-300">
                <CheckCircle2 className="h-4 w-4" />
                Siparişiniz alındı
              </div>
            )}
            <button onClick={() => void submitOrder()} className="rounded-full bg-emerald-600 px-4 py-2 text-sm font-semibold text-white">
              Sipariş ver
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}
