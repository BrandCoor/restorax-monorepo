'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useAuthStore } from '@/store/authStore';
import api from '@/services/api';
import PageHeader from '@/components/PageHeader';
import { Plus } from 'lucide-react';

interface Customer {
  id: string;
  firstName?: string;
  lastName?: string;
  phone: string;
  visitCount: number;
  totalSpent: number;
  loyaltyPoints: number;
}

export default function CustomersPage() {
  const { user } = useAuthStore();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [form, setForm] = useState<{ firstName: string; lastName: string; phone: string } | null>(null);

  const load = useCallback(async () => {
    if (!user?.restaurantId) return;
    const res = await api.get(`/customers?restaurantId=${user.restaurantId}`);
    setCustomers(res.data);
  }, [user]);

  useEffect(() => { void load(); }, [load]);

  const addCustomer = async () => {
    if (!form || !user?.restaurantId) return;
    await api.post('/customers', { ...form, restaurantId: user.restaurantId });
    setForm(null);
    void load();
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Müşteriler (CRM)"
        description="Telefon bazlı müşteri takibi ve sadakat puanları"
        action={
          <button onClick={() => setForm({ firstName: '', lastName: '', phone: '' })} className="px-4 py-2 rounded-lg bg-indigo-600 text-sm font-bold flex items-center gap-1">
            <Plus className="h-4 w-4" /> Müşteri Ekle
          </button>
        }
      />

      <div className="rounded-xl border border-gray-900 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-900/60 text-xs uppercase text-gray-500">
            <tr>
              <th className="text-left py-3 px-4">Ad Soyad</th>
              <th className="text-left py-3 px-4">Telefon</th>
              <th className="text-right py-3 px-4">Ziyaret</th>
              <th className="text-right py-3 px-4">Toplam Harcama</th>
              <th className="text-right py-3 px-4">Puan</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-900">
            {customers.map((c) => (
              <tr key={c.id}>
                <td className="py-3 px-4 text-white font-semibold">{c.firstName} {c.lastName}</td>
                <td className="py-3 px-4 text-gray-400">{c.phone}</td>
                <td className="py-3 px-4 text-right">{c.visitCount}</td>
                <td className="py-3 px-4 text-right text-indigo-400">{Number(c.totalSpent).toFixed(2)} ₺</td>
                <td className="py-3 px-4 text-right text-amber-400">{c.loyaltyPoints}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {form && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50">
          <div className="w-full max-w-md rounded-xl border border-gray-800 bg-gray-900 p-6 space-y-3">
            <h3 className="font-bold">Yeni Müşteri</h3>
            <input placeholder="Ad" value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} className="w-full rounded-lg border border-gray-800 bg-gray-950 px-4 py-2 text-white text-sm" />
            <input placeholder="Soyad" value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} className="w-full rounded-lg border border-gray-800 bg-gray-950 px-4 py-2 text-white text-sm" />
            <input placeholder="Telefon" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="w-full rounded-lg border border-gray-800 bg-gray-950 px-4 py-2 text-white text-sm" />
            <div className="flex gap-2">
              <button onClick={() => void addCustomer()} className="flex-1 py-2 rounded-lg bg-indigo-600 font-bold text-sm">Kaydet</button>
              <button onClick={() => setForm(null)} className="flex-1 py-2 rounded-lg bg-gray-800 text-sm">İptal</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
