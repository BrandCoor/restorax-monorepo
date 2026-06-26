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
    { href: '/dashboard/pos', label: 'Hızlı Sipariş (POS)', desc: 'Masa ve paket siparişi al' },
    { href: '/dashboard/tables', label: 'Masa Takibi', desc: 'Adisyon, ödeme, masa işlemleri' },
    { href: '/dashboard/kitchen', label: 'Mutfak Ekranı', desc: 'Aktif siparişleri görüntüle' },
    { href: '/dashboard/integrations', label: 'Platform Siparişleri', desc: 'Yemeksepeti, Trendyol, Getir' },
    { href: '/dashboard/reports', label: 'Raporlar', desc: 'Satış ve performans analizi' },
    { href: '/dashboard/menu', label: 'Menü Yönetimi', desc: 'Kategori ve ürün düzenle' },
  ];

  return (
    <div className="space-y-8">
      <PageHeader
        title="Genel Durum"
        description={`Hoş geldiniz, ${user?.firstName}. İşletmenizin anlık özeti.`}
      />

      {lowStockCount > 0 && (
        <div className="flex items-center gap-3 rounded-xl border border-amber-900/50 bg-amber-950/20 p-4 text-amber-300">
          <AlertTriangle className="h-5 w-5 shrink-0" />
          <p className="text-sm">
            <strong>{lowStockCount}</strong> stok kalemi kritik seviyede.{' '}
            <Link href="/dashboard/inventory" className="underline font-semibold">
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
              <p className="mt-3 text-2xl font-extrabold text-white">
                {loading ? '...' : s.value}
              </p>
            </div>
          );
        })}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-gray-900 bg-gray-900/40 p-6">
          <h2 className="text-lg font-bold text-white mb-4">Ödeme Dağılımı (Bugün)</h2>
          {summary && Object.keys(summary.paymentsByMethod).length > 0 ? (
            <ul className="space-y-2">
              {Object.entries(summary.paymentsByMethod).map(([method, amount]) => (
                <li key={method} className="flex justify-between text-sm">
                  <span className="text-gray-400">{method}</span>
                  <span className="font-bold text-white">{Number(amount).toFixed(2)} ₺</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-gray-500">Henüz ödeme kaydı yok.</p>
          )}
        </div>

        <div className="rounded-xl border border-gray-900 bg-gray-900/40 p-6">
          <h2 className="text-lg font-bold text-white mb-4">Hızlı Erişim</h2>
          <ul className="space-y-2">
            {quickLinks.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className="flex items-center justify-between rounded-lg px-3 py-2.5 hover:bg-gray-800/60 transition-colors group"
                >
                  <div>
                    <p className="text-sm font-semibold text-white">{link.label}</p>
                    <p className="text-xs text-gray-500">{link.desc}</p>
                  </div>
                  <ArrowRight className="h-4 w-4 text-gray-600 group-hover:text-indigo-400" />
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
