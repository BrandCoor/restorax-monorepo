'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useAuthStore } from '@/store/authStore';
import api from '@/services/api';
import PageHeader from '@/components/PageHeader';
import { Plus, AlertTriangle } from 'lucide-react';

interface StockItem {
  id: string;
  ingredientName: string;
  quantity: number;
  unit: string;
  minStockLevel?: number;
}

export default function InventoryPage() {
  const { user } = useAuthStore();
  const [items, setItems] = useState<StockItem[]>([]);
  const [form, setForm] = useState<{ ingredientName: string; quantity: string; unit: string; minStockLevel: string } | null>(null);

  const load = useCallback(async () => {
    if (!user?.branchId) return;
    const res = await api.get(`/stock?branchId=${user.branchId}`);
    setItems(res.data);
  }, [user]);

  useEffect(() => { void load(); }, [load]);

  const addItem = async () => {
    if (!form || !user?.branchId) return;
    await api.post('/stock', {
      branchId: user.branchId,
      ingredientName: form.ingredientName,
      quantity: Number(form.quantity),
      unit: form.unit,
      minStockLevel: form.minStockLevel ? Number(form.minStockLevel) : undefined,
    });
    setForm(null);
    void load();
  };

  const updateQty = async (id: string, quantity: number) => {
    await api.patch(`/stock/${id}`, { quantity });
    void load();
  };

  const isLow = (item: StockItem) =>
    item.minStockLevel != null && Number(item.quantity) <= Number(item.minStockLevel);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Stok & Envanter"
        description="Malzeme takibi — siparişlerde reçeteye göre otomatik düşüm yapılır"
        action={
          <button onClick={() => setForm({ ingredientName: '', quantity: '0', unit: 'KG', minStockLevel: '' })} className="px-4 py-2 rounded-lg bg-indigo-600 text-sm font-bold flex items-center gap-1">
            <Plus className="h-4 w-4" /> Stok Ekle
          </button>
        }
      />

      <div className="rounded-xl border border-gray-900 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-900/60 text-xs uppercase text-gray-500">
            <tr>
              <th className="text-left py-3 px-4">Malzeme</th>
              <th className="text-right py-3 px-4">Miktar</th>
              <th className="text-right py-3 px-4">Min. Seviye</th>
              <th className="text-right py-3 px-4">Güncelle</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-900">
            {items.map((item) => (
              <tr key={item.id} className={isLow(item) ? 'bg-amber-950/10' : ''}>
                <td className="py-3 px-4 font-semibold text-white flex items-center gap-2">
                  {isLow(item) && <AlertTriangle className="h-4 w-4 text-amber-500" />}
                  {item.ingredientName}
                </td>
                <td className="py-3 px-4 text-right text-indigo-400">{Number(item.quantity).toFixed(2)} {item.unit}</td>
                <td className="py-3 px-4 text-right text-gray-500">{item.minStockLevel ?? '—'}</td>
                <td className="py-3 px-4 text-right">
                  <button
                    onClick={() => {
                      const q = prompt('Yeni miktar:', String(item.quantity));
                      if (q != null) void updateQty(item.id, Number(q));
                    }}
                    className="text-xs px-2 py-1 rounded bg-gray-800 hover:bg-gray-700"
                  >
                    Düzenle
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {form && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50">
          <div className="w-full max-w-md rounded-xl border border-gray-800 bg-gray-900 p-6 space-y-3">
            <h3 className="font-bold">Yeni Stok Kalemi</h3>
            <input placeholder="Malzeme adı" value={form.ingredientName} onChange={(e) => setForm({ ...form, ingredientName: e.target.value })} className="w-full rounded-lg border border-gray-800 bg-gray-950 px-4 py-2 text-white text-sm" />
            <input type="number" placeholder="Miktar" value={form.quantity} onChange={(e) => setForm({ ...form, quantity: e.target.value })} className="w-full rounded-lg border border-gray-800 bg-gray-950 px-4 py-2 text-white text-sm" />
            <select value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })} className="w-full rounded-lg border border-gray-800 bg-gray-950 px-4 py-2 text-white text-sm">
              <option value="KG">KG</option>
              <option value="PIECE">Adet</option>
              <option value="LITER">Litre</option>
            </select>
            <input type="number" placeholder="Min. stok seviyesi" value={form.minStockLevel} onChange={(e) => setForm({ ...form, minStockLevel: e.target.value })} className="w-full rounded-lg border border-gray-800 bg-gray-950 px-4 py-2 text-white text-sm" />
            <div className="flex gap-2">
              <button onClick={() => void addItem()} className="flex-1 py-2 rounded-lg bg-indigo-600 font-bold text-sm">Kaydet</button>
              <button onClick={() => setForm(null)} className="flex-1 py-2 rounded-lg bg-gray-800 text-sm">İptal</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
