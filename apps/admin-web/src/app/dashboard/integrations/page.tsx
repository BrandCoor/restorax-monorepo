'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useAuthStore } from '@/store/authStore';
import api from '@/services/api';
import { getSocket } from '@/services/socket';
import PageHeader from '@/components/PageHeader';
import {
  PhoneCall,
  RefreshCw,
  Radio,
  Check,
  X,
  Power,
  PowerOff,
  ChevronRight,
  CheckCircle2,
} from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

interface OrderItem {
  id: string;
  quantity: number;
  product: { name: string };
}

interface Order {
  id: string;
  status: string;
  totalAmount: string | number;
  createdAt: string;
  source: string;
  note?: string;
  items: OrderItem[];
}

const PLATFORM_KEYS = ['YEMEKSEPETI', 'TRENDYOL', 'GETIR', 'MIGROS'] as const;

const platformMeta: Record<string, { name: string; color: string }> = {
  YEMEKSEPETI: { name: 'Yemeksepeti', color: 'text-pink-500 bg-pink-950/20 border-pink-900/40' },
  TRENDYOL: { name: 'Trendyol Yemek', color: 'text-orange-500 bg-orange-950/20 border-orange-900/40' },
  GETIR: { name: 'Getir Yemek', color: 'text-purple-500 bg-purple-950/20 border-purple-900/40' },
  MIGROS: { name: 'Migros Yemek', color: 'text-amber-500 bg-amber-950/20 border-amber-900/40' },
};

export default function IntegrationsPage() {
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [testLoading, setTestLoading] = useState(false);
  const [platformOrders, setPlatformOrders] = useState<Order[]>([]);
  const [platformStatus, setPlatformStatus] = useState<Record<string, boolean>>({
    YEMEKSEPETI: true,
    TRENDYOL: true,
    GETIR: true,
    MIGROS: true,
  });

  const fetchPlatformData = useCallback(async () => {
    if (!user?.branchId) return;
    try {
      const [ordersRes, intRes] = await Promise.all([
        api.get(`/orders?branchId=${user.branchId}`),
        api.get(`/integrations?branchId=${user.branchId}`),
      ]);
      if (Array.isArray(ordersRes.data)) {
        const onlineOrders = (ordersRes.data as Order[]).filter(
          (o) =>
            PLATFORM_KEYS.includes(o.source as (typeof PLATFORM_KEYS)[number]) &&
            o.status !== 'COMPLETED' &&
            o.status !== 'CANCELLED',
        );
        setPlatformOrders(onlineOrders.reverse());
      }
      if (Array.isArray(intRes.data)) {
        const status: Record<string, boolean> = { ...platformStatus };
        for (const key of PLATFORM_KEYS) {
          const found = intRes.data.find((i: { platformName: string; isActive: boolean }) => i.platformName === key);
          status[key] = found ? found.isActive : true;
        }
        setPlatformStatus(status);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    void fetchPlatformData();
  }, [fetchPlatformData]);

  useEffect(() => {
    if (!user?.branchId) return;
    const socket = getSocket(API_URL);
    socket.connect();
    socket.emit('join_branch', { branchId: user.branchId });
    socket.on('new_order', () => void fetchPlatformData());
    socket.on('order_status_changed', () => void fetchPlatformData());
    return () => {
      socket.off('new_order');
      socket.off('order_status_changed');
      socket.disconnect();
    };
  }, [user, fetchPlatformData]);

  const togglePlatformStatus = async (key: string) => {
    if (!user?.branchId) return;
    const newActive = !platformStatus[key];
    try {
      await api.post('/integrations/upsert', {
        branchId: user.branchId,
        platformName: key,
        apiKey: 'configured',
        isActive: newActive,
      });
      setPlatformStatus((prev) => ({ ...prev, [key]: newActive }));
    } catch (e) {
      console.error(e);
    }
  };

  const handleAcceptOrder = async (orderId: string) => {
    await api.patch(`/orders/${orderId}`, { status: 'PREPARING' });
    void fetchPlatformData();
  };

  const handleRejectOrder = async (orderId: string) => {
    const reason = prompt('Reddetme sebebi (zorunlu):');
    if (!reason?.trim()) return;
    await api.patch(`/orders/${orderId}`, { status: 'CANCELLED', rejectReason: reason });
    void fetchPlatformData();
  };

  const handlePrepareOrder = async (orderId: string) => {
    await api.patch(`/orders/${orderId}`, { status: 'READY' });
    void fetchPlatformData();
  };

  const handleDeliverOrder = async (orderId: string) => {
    await api.patch(`/orders/${orderId}`, { status: 'DELIVERED' });
    void fetchPlatformData();
  };

  const handleCompleteOrder = async (orderId: string) => {
    const order = platformOrders.find((o) => o.id === orderId);
    await api.post(`/orders/${orderId}/settle`, {
      paymentMethod: 'CASH',
      amount: Number(order?.totalAmount || 0),
    });
    void fetchPlatformData();
  };

  const handleSimulate = async (platformName: string) => {
    if (!platformStatus[platformName]) {
      alert('Mağaza kapalı — önce açın.');
      return;
    }
    setTestLoading(true);
    try {
      await api.post('/orders/test-platform', { branchId: user!.branchId, platformName });
      void fetchPlatformData();
    } finally {
      setTestLoading(false);
    }
  };

  const countFor = (key: string) =>
    platformOrders.filter((o) => o.source === key).length;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Platform Entegrasyon Merkezi"
        description="Yemeksepeti, Trendyol, Getir ve Migros sipariş yönetimi"
        action={
          <div className="flex gap-2 flex-wrap">
            {PLATFORM_KEYS.map((key) => (
              <button
                key={key}
                onClick={() => void handleSimulate(key)}
                disabled={testLoading}
                className="rounded-lg bg-gray-800 hover:bg-gray-700 px-3 py-1.5 text-xs font-bold text-white disabled:opacity-50"
              >
                {platformMeta[key].name} Simüle
              </button>
            ))}
          </div>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {PLATFORM_KEYS.map((key) => {
          const active = platformStatus[key];
          const meta = platformMeta[key];
          return (
            <div
              key={key}
              className={`rounded-xl border p-5 h-36 flex flex-col justify-between ${
                active ? meta.color : 'border-red-950/60 bg-red-950/5 text-red-500/60'
              }`}
            >
              <div className="flex justify-between items-start">
                <span className="text-xs font-extrabold uppercase">{meta.name}</span>
                <span className={`text-xs font-bold px-2 py-0.5 rounded-full border ${active ? 'text-emerald-400 border-emerald-900/50' : 'text-red-400 border-red-900/50'}`}>
                  {active ? 'AÇIK' : 'KAPALI'}
                </span>
              </div>
              <div className="flex justify-between items-center border-t border-white/5 pt-2">
                <p className="text-2xl font-extrabold text-white">{loading ? '...' : `${countFor(key)} Adet`}</p>
                <button
                  onClick={() => void togglePlatformStatus(key)}
                  className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-bold border border-gray-700 hover:bg-gray-800"
                >
                  {active ? <PowerOff className="h-3 w-3" /> : <Power className="h-3 w-3" />}
                  {active ? 'Kapat' : 'Aç'}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      <div className="rounded-xl border border-gray-900 bg-gray-900/40 p-6">
        <div className="flex justify-between items-center mb-4 pb-3 border-b border-gray-900">
          <h2 className="text-lg font-bold flex items-center gap-2">
            <PhoneCall className="h-5 w-5 text-indigo-500" />
            Canlı Paket Sipariş Havuzu
          </h2>
          <button onClick={() => void fetchPlatformData()} className="text-xs text-gray-500 hover:text-white flex items-center gap-1">
            <RefreshCw className="h-3.5 w-3.5" /> Yenile
          </button>
        </div>

        {loading ? (
          <p className="text-center py-8 text-gray-500">Yükleniyor...</p>
        ) : platformOrders.length === 0 ? (
          <p className="text-center py-12 text-gray-500 border border-dashed border-gray-800 rounded-lg">
            Aktif platform siparişi yok.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs uppercase text-gray-500 border-b border-gray-900">
                <tr>
                  <th className="py-3 px-3">Platform</th>
                  <th className="py-3 px-3">Ürünler</th>
                  <th className="py-3 px-3">Tutar</th>
                  <th className="py-3 px-3">Durum</th>
                  <th className="py-3 px-3">İşlem</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-900">
                {platformOrders.map((ord) => (
                  <tr key={ord.id} className="hover:bg-gray-900/30">
                    <td className="py-3 px-3 font-bold">{ord.source}</td>
                    <td className="py-3 px-3 text-gray-400">
                      {ord.items?.map((i) => `${i.quantity}x ${i.product?.name}`).join(', ') || '—'}
                      {ord.note && <p className="text-xs text-amber-500 mt-1">Not: {ord.note}</p>}
                    </td>
                    <td className="py-3 px-3 font-bold text-indigo-400">{Number(ord.totalAmount).toFixed(2)} ₺</td>
                    <td className="py-3 px-3">{ord.status}</td>
                    <td className="py-3 px-3">
                      {ord.status === 'RECEIVED' && (
                        <div className="flex gap-1">
                          <button onClick={() => void handleAcceptOrder(ord.id)} className="p-1.5 rounded bg-emerald-950 text-emerald-400"><Check className="h-4 w-4" /></button>
                          <button onClick={() => void handleRejectOrder(ord.id)} className="p-1.5 rounded bg-red-950 text-red-400"><X className="h-4 w-4" /></button>
                        </div>
                      )}
                      {ord.status === 'PREPARING' && (
                        <button onClick={() => void handlePrepareOrder(ord.id)} className="text-xs px-2 py-1 rounded bg-amber-700">Hazır</button>
                      )}
                      {ord.status === 'READY' && (
                        <button onClick={() => void handleDeliverOrder(ord.id)} className="text-xs px-2 py-1 rounded bg-indigo-700 flex items-center gap-1"><ChevronRight className="h-3 w-3" /> Teslim</button>
                      )}
                      {ord.status === 'DELIVERED' && (
                        <button onClick={() => void handleCompleteOrder(ord.id)} className="text-xs px-2 py-1 rounded bg-emerald-700 flex items-center gap-1"><CheckCircle2 className="h-3 w-3" /> Kapat</button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
