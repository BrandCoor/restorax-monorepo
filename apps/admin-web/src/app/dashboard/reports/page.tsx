'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useAuthStore } from '@/store/authStore';
import api from '@/services/api';
import PageHeader from '@/components/PageHeader';

export default function ReportsPage() {
  const { user } = useAuthStore();
  const [summary, setSummary] = useState<Record<string, unknown> | null>(null);
  const [topProducts, setTopProducts] = useState<{ productName: string; totalQty: number; totalRevenue: number }[]>([]);
  const [waiters, setWaiters] = useState<{ waiterName: string; orderCount: number; totalRevenue: number }[]>([]);

  const load = useCallback(async () => {
    if (!user?.branchId) return;
    const [s, t, w] = await Promise.all([
      api.get(`/reports/summary?branchId=${user.branchId}`),
      api.get(`/reports/top-products?branchId=${user.branchId}`),
      api.get(`/reports/waiter-performance?branchId=${user.branchId}`),
    ]);
    setSummary(s.data);
    setTopProducts(t.data);
    setWaiters(w.data);
  }, [user]);

  useEffect(() => {
    void load();
  }, [load]);

  const s = summary as { orderCount?: number; totalRevenue?: number; averageTicket?: number; paymentsByMethod?: Record<string, number> } | null;

  return (
    <div className="space-y-6">
      <PageHeader title="Raporlar" description="Günlük ciro, ürün satışları ve garson performansı" />

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-gray-900 bg-gray-900/40 p-5">
          <p className="text-xs text-gray-500 uppercase">Günlük Ciro</p>
          <p className="text-2xl font-bold text-emerald-400 mt-1">{Number(s?.totalRevenue || 0).toFixed(2)} ₺</p>
        </div>
        <div className="rounded-xl border border-gray-900 bg-gray-900/40 p-5">
          <p className="text-xs text-gray-500 uppercase">Sipariş Sayısı</p>
          <p className="text-2xl font-bold text-white mt-1">{s?.orderCount ?? 0}</p>
        </div>
        <div className="rounded-xl border border-gray-900 bg-gray-900/40 p-5">
          <p className="text-xs text-gray-500 uppercase">Ortalama Sepet</p>
          <p className="text-2xl font-bold text-indigo-400 mt-1">{Number(s?.averageTicket || 0).toFixed(2)} ₺</p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-gray-900 bg-gray-900/40 p-6">
          <h2 className="font-bold text-white mb-4">En Çok Satan Ürünler</h2>
          <table className="w-full text-sm">
            <thead className="text-xs text-gray-500 uppercase">
              <tr><th className="text-left py-2">Ürün</th><th className="text-right">Adet</th><th className="text-right">Ciro</th></tr>
            </thead>
            <tbody className="divide-y divide-gray-900">
              {topProducts.map((p) => (
                <tr key={p.productName}>
                  <td className="py-2 text-white">{p.productName}</td>
                  <td className="py-2 text-right text-gray-400">{p.totalQty}</td>
                  <td className="py-2 text-right text-indigo-400">{p.totalRevenue.toFixed(2)} ₺</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="rounded-xl border border-gray-900 bg-gray-900/40 p-6">
          <h2 className="font-bold text-white mb-4">Garson Performansı</h2>
          {waiters.length === 0 ? (
            <p className="text-sm text-gray-500">Henüz garson bazlı satış verisi yok.</p>
          ) : (
            <table className="w-full text-sm">
              <thead className="text-xs text-gray-500 uppercase">
                <tr><th className="text-left py-2">Garson</th><th className="text-right">Sipariş</th><th className="text-right">Ciro</th></tr>
              </thead>
              <tbody className="divide-y divide-gray-900">
                {waiters.map((w) => (
                  <tr key={w.waiterName}>
                    <td className="py-2 text-white">{w.waiterName}</td>
                    <td className="py-2 text-right text-gray-400">{w.orderCount}</td>
                    <td className="py-2 text-right text-indigo-400">{w.totalRevenue.toFixed(2)} ₺</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
