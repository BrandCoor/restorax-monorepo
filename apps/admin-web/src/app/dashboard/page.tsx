'use client';

import React, { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { useAuthStore } from '@/store/authStore';
import api from '@/services/api';
import PageHeader from '@/components/PageHeader';
import {
  TrendingUp,
  ShoppingBag,
  Grid,
  UtensilsCrossed,
  AlertTriangle,
  ArrowRight,
  Zap,
  ReceiptText,
} from 'lucide-react';

interface Summary {
  orderCount: number;
  totalRevenue: number;
  averageTicket: number;
  activeOrders: number;
  paymentsByMethod: Record<string, number>;
}

export default function DashboardOverviewPage() {
  const { user } = useAuthStore();
  const [summary, setSummary] = useState<Summary | null>(null);
  const [lowStockCount, setLowStockCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    if (!user?.branchId) return;
    try {
      const [summaryRes, lowStockRes] = await Promise.all([
        api.get(`/reports/summary?branchId=${user.branchId}`),
        api.get(`/stock/low?branchId=${user.branchId}`),
      ]);
      setSummary(summaryRes.data);
      setLowStockCount(Array.isArray(lowStockRes.data) ? lowStockRes.data.length : 0);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    void fetchData();
  }, [fetchData]);

  const stats = [
    {
      label: 'Günlük Ciro',
      value: summary ? `${summary.totalRevenue.toFixed(2)} ₺` : '—',
      icon: TrendingUp,
      color: 'text-emerald-400 bg-emerald-950/30 border-emerald-900/40',
    },
    {
      label: 'Tamamlanan Sipariş',
      value: summary?.orderCount ?? '—',
      icon: ShoppingBag,
      color: 'text-indigo-400 bg-indigo-950/30 border-indigo-900/40',
    },
    {
      label: 'Aktif Sipariş',
      value: summary?.activeOrders ?? '—',
      icon: UtensilsCrossed,
      color: 'text-amber-400 bg-amber-950/30 border-amber-900/40',
    },
    {
      label: 'Ortalama Sepet',
      value: summary ? `${summary.averageTicket.toFixed(2)} ₺` : '—',
      icon: Grid,
      color: 'text-purple-400 bg-purple-950/30 border-purple-900/40',
    },
  ];

  const quickLinks = [
    { href: '/dashboard/pos', label: 'Hızlı Sipariş (POS)', desc: 'Masa ve paket siparişi al', icon: Zap },
    { href: '/dashboard/tables', label: 'Masa Takibi', desc: 'Adisyon, ödeme, masa işlemleri', icon: Grid },
    { href: '/dashboard/kitchen', label: 'Mutfak Ekranı', desc: 'Aktif siparişleri görüntüle', icon: UtensilsCrossed },
    { href: '/dashboard/reports', label: 'Raporlar', desc: 'Satış ve performans analizi', icon: ReceiptText },
  ];

  return (
    <div className="space-y-8">
      <PageHeader
        title="Genel Durum"
        description={`Hoş geldiniz, ${user?.firstName}. İşletmenizin anlık özeti.`}
      />

      <div className="rounded-3xl border border-white/10 bg-slate-900/70 p-6 shadow-[0_0_0_1px_rgba(255,255,255,0.03)]">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-indigo-400">Bugünkü operasyon</p>
            <h2 className="mt-2 text-2xl font-bold text-white">Sipariş akışını hızlıca takip et</h2>
            <p className="mt-2 max-w-2xl text-sm text-gray-400">
              POS, masa takibi ve mutfak ekranı arasında geçiş yaparak günlük operasyonları daha akıcı yönetebilirsin.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link href="/dashboard/pos" className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-500">
              Yeni sipariş aç
            </Link>
            <Link href="/dashboard/kitchen" className="rounded-xl border border-white/10 bg-slate-950/70 px-4 py-2 text-sm font-semibold text-gray-300 transition hover:text-white">
              Mutfak görünümü
            </Link>
          </div>
        </div>
      </div>

      {lowStockCount > 0 && (
        <div className="flex items-center gap-3 rounded-xl border border-amber-900/50 bg-amber-950/20 p-4 text-amber-300">
          <AlertTriangle className="h-5 w-5 shrink-0" />
          <p className="text-sm">
            <strong>{lowStockCount}</strong> stok kalemi kritik seviyede.{' '}
            <Link href="/dashboard/inventory" className="font-semibold underline">
              Stok sayfasına git
            </Link>
          </p>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((s) => {
          const Icon = s.icon;
          return (
            <div key={s.label} className={`rounded-2xl border p-5 shadow-[0_0_0_1px_rgba(255,255,255,0.03)] ${s.color}`}>
              <div className="flex items-center justify-between">
                <p className="text-[11px] font-semibold uppercase tracking-[0.25em] opacity-80">{s.label}</p>
                <Icon className="h-5 w-5 opacity-70" />
              </div>
              <p className="mt-3 text-2xl font-extrabold text-white">{loading ? '...' : s.value}</p>
            </div>
          );
        })}
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <div className="rounded-2xl border border-white/10 bg-slate-900/70 p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-bold text-white">Ödeme Dağılımı</h2>
            <span className="rounded-full border border-white/10 bg-slate-950/70 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-gray-400">
              Bugün
            </span>
          </div>
          {summary && Object.keys(summary.paymentsByMethod).length > 0 ? (
            <ul className="space-y-2">
              {Object.entries(summary.paymentsByMethod).map(([method, amount]) => (
                <li key={method} className="flex items-center justify-between rounded-xl border border-white/10 bg-slate-950/60 px-3 py-2.5 text-sm">
                  <span className="text-gray-400">{method}</span>
                  <span className="font-bold text-white">{Number(amount).toFixed(2)} ₺</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-gray-500">Henüz ödeme kaydı yok.</p>
          )}
        </div>

        <div className="rounded-2xl border border-white/10 bg-slate-900/70 p-6">
          <h2 className="mb-4 text-lg font-bold text-white">Hızlı Erişim</h2>
          <div className="space-y-2">
            {quickLinks.map((link) => {
              const Icon = link.icon;
              return (
                <Link key={link.href} href={link.href} className="flex items-center justify-between rounded-xl border border-white/10 bg-slate-950/60 px-3 py-3 transition hover:bg-slate-800/80">
                  <div className="flex items-center gap-3">
                    <div className="rounded-lg bg-indigo-950/70 p-2 text-indigo-300">
                      <Icon className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-white">{link.label}</p>
                      <p className="text-xs text-gray-500">{link.desc}</p>
                    </div>
                  </div>
                  <ArrowRight className="h-4 w-4 text-gray-600" />
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
