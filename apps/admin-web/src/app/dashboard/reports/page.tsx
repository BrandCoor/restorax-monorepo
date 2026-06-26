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

  const s = summary as {
    orderCount?: number;
    totalRevenue?: number;
    averageTicket?: number;
    activeOrders?: number;
    paymentsByMethod?: Record<string, number>;
  } | null;

  return (
    <div className="space-y-6">
      <PageHeader title="Raporlar" description="Günlük ciro, ürün satışları ve garson performansı" />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-2xl border border-emerald-900/40 bg-emerald-950/20 p-5">
          <p className="text-xs uppercase tracking-[0.25em] text-emerald-300">Günlük Ciro</p>
          <p className="mt-2 text-2xl font-bold text-emerald-300">{Number(s?.totalRevenue || 0).toFixed(2)} ₺</p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-slate-900/70 p-5">
          <p className="text-xs uppercase tracking-[0.25em] text-gray-500">Sipariş Sayısı</p>
          <p className="mt-2 text-2xl font-bold text-white">{s?.orderCount ?? 0}</p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-slate-900/70 p-5">
          <p className="text-xs uppercase tracking-[0.25em] text-gray-500">Aktif Sipariş</p>
          <p className="mt-2 text-2xl font-bold text-amber-300">{s?.activeOrders ?? 0}</p>
        </div>
        <div className="rounded-2xl border border-indigo-900/40 bg-indigo-950/20 p-5">
          <p className="text-xs uppercase tracking-[0.25em] text-indigo-300">Ortalama Sepet</p>
          <p className="mt-2 text-2xl font-bold text-indigo-300">{Number(s?.averageTicket || 0).toFixed(2)} ₺</p>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <div className="rounded-2xl border border-white/10 bg-slate-900/70 p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-bold text-white">En Çok Satan Ürünler</h2>
            <span className="rounded-full border border-white/10 bg-slate-950/70 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-gray-400">
              Son 24 saat
            </span>
          </div>
          {topProducts.length === 0 ? (
            <p className="text-sm text-gray-500">Henüz satış verisi yok.</p>
          ) : (
            <div className="space-y-3">
              {topProducts.map((p) => (
                <div key={p.productName} className="flex items-center justify-between rounded-xl border border-white/10 bg-slate-950/60 px-3 py-3">
                  <div>
                    <p className="font-semibold text-white">{p.productName}</p>
                    <p className="text-sm text-gray-500">{p.totalQty} adet satıldı</p>
                  </div>
                  <p className="text-sm font-semibold text-indigo-300">{p.totalRevenue.toFixed(2)} ₺</p>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="space-y-6">
          <div className="rounded-2xl border border-white/10 bg-slate-900/70 p-6">
            <h2 className="mb-4 text-lg font-bold text-white">Ödeme Yöntemleri</h2>
            {s?.paymentsByMethod && Object.keys(s.paymentsByMethod).length > 0 ? (
              <div className="space-y-2">
                {Object.entries(s.paymentsByMethod).map(([method, amount]) => (
                  <div key={method} className="flex items-center justify-between rounded-xl border border-white/10 bg-slate-950/60 px-3 py-2.5 text-sm">
                    <span className="text-gray-400">{method}</span>
                    <span className="font-semibold text-white">{Number(amount).toFixed(2)} ₺</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500">Henüz ödeme kaydı yok.</p>
            )}
          </div>

          <div className="rounded-2xl border border-white/10 bg-slate-900/70 p-6">
            <h2 className="mb-4 text-lg font-bold text-white">Garson Performansı</h2>
            {waiters.length === 0 ? (
              <p className="text-sm text-gray-500">Henüz garson bazlı satış verisi yok.</p>
            ) : (
              <div className="space-y-2">
                {waiters.map((w) => (
                  <div key={w.waiterName} className="flex items-center justify-between rounded-xl border border-white/10 bg-slate-950/60 px-3 py-2.5 text-sm">
                    <div>
                      <p className="font-semibold text-white">{w.waiterName}</p>
                      <p className="text-gray-500">{w.orderCount} sipariş</p>
                    </div>
                    <p className="font-semibold text-indigo-300">{w.totalRevenue.toFixed(2)} ₺</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
