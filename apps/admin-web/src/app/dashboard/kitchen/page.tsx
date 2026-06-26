'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useAuthStore } from '@/store/authStore';
import api from '@/services/api';
import { getSocket } from '@/services/socket';
import { UtensilsCrossed, Clock, CheckCircle2, AlertCircle } from 'lucide-react';

interface OrderOption {
  id: string;
  optionValue: {
    name: string;
  };
}

interface OrderItem {
  id: string;
  quantity: number;
  note?: string;
  product: {
    name: string;
  };
  options?: OrderOption[];
}

interface Order {
  id: string;
  status: string;
  note?: string;
  createdAt: string;
  table?: {
    name: string;
  };
  waiter?: {
    firstName: string;
    lastName: string;
  };
  items: OrderItem[];
}

export default function KitchenPage() {
  const { user } = useAuthStore();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  // Mutfakta ödemesi tamamlanmamış (aktif) olan tüm siparişleri listeliyoruz
  const fetchActiveOrders = useCallback(async () => {
    if (!user?.branchId) return;
    try {
      const response = await api.get(`/orders?branchId=${user.branchId}`);
      if (Array.isArray(response.data)) {
        setOrders(response.data as Order[]);
      } else {
        setOrders([]);
      }
    } catch (error) {
      console.error('Aktif siparişler çekilirken hata oluştu:', error);
      setOrders([]);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    void fetchActiveOrders();
  }, [fetchActiveOrders]);

  // Real-time Sockets senkronizasyonu [1]
  useEffect(() => {
    if (!user?.branchId) return;

    const socket = getSocket(process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000');
    socket.connect();

    socket.emit('join_branch', { branchId: user.branchId });

    socket.on('new_order', () => {
      console.log('🔔 [SOCKET] New order received in kitchen, updating...');
      void fetchActiveOrders();
    });

    socket.on('order_status_changed', () => {
      console.log('🔄 [SOCKET] Order status changed, updating...');
      void fetchActiveOrders();
    });

    return () => {
      socket.off('new_order');
      socket.off('order_status_changed');
      socket.disconnect();
    };
  }, [user, fetchActiveOrders]);

  const updateStatus = async (orderId: string, status: string) => {
    await api.patch(`/orders/${orderId}`, { status });
    void fetchActiveOrders();
  };

  const kitchenOrders = orders.filter((o) => !['COMPLETED', 'CANCELLED', 'DELIVERED'].includes(o.status));

  const getMinutesAgo = (dateString: string) => {
    const diffMs = Math.abs(new Date().getTime() - new Date(dateString).getTime());
    const diffMins = Math.floor(diffMs / (1000 * 60));
    return diffMins === 0 ? 'Şimdi' : `${diffMins} dk. önce`;
  };

  const statusConfig: Record<string, { label: string; badge: string; actionLabel: string; actionColor: string }> = {
    RECEIVED: { label: 'Yeni', badge: 'bg-amber-950/60 text-amber-300 border-amber-800/50', actionLabel: 'Hazırlamaya başla', actionColor: 'bg-amber-600 hover:bg-amber-500' },
    PREPARING: { label: 'Hazırlanıyor', badge: 'bg-indigo-950/60 text-indigo-300 border-indigo-800/50', actionLabel: 'Hazırla', actionColor: 'bg-emerald-600 hover:bg-emerald-500' },
    READY: { label: 'Hazır', badge: 'bg-emerald-950/60 text-emerald-300 border-emerald-800/50', actionLabel: 'Servise hazır', actionColor: '' },
  };

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-white/10 bg-slate-900/70 p-5 shadow-[0_0_0_1px_rgba(255,255,255,0.03)]">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="flex items-center gap-3">
              <div className="rounded-2xl bg-indigo-950/60 p-3">
                <UtensilsCrossed className="h-7 w-7 text-indigo-400" />
              </div>
              <div>
                <h1 className="text-3xl font-bold tracking-tight text-white">Mutfak Ekranı</h1>
                <p className="mt-1 text-sm text-gray-400">Aktif siparişleri hızlıca filtreleyip hazırlık aşamasına geçir.</p>
              </div>
            </div>
          </div>
          <div className="rounded-full border border-indigo-900/40 bg-indigo-950/30 px-3 py-1.5 text-sm font-semibold text-indigo-300">
            {kitchenOrders.length} aktif sipariş
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex h-64 items-center justify-center rounded-2xl border border-dashed border-white/10 bg-slate-900/40 text-gray-400">
          Siparişler yükleniyor...
        </div>
      ) : kitchenOrders.length === 0 ? (
        <div className="flex h-64 flex-col items-center justify-center rounded-2xl border border-dashed border-white/10 bg-slate-900/40 text-gray-500">
          <AlertCircle className="mb-2 h-8 w-8 text-gray-600" />
          Şu anda mutfakta hazırlanacak sipariş bulunmuyor.
        </div>
      ) : (
        <div className="grid gap-4 xl:grid-cols-2">
          {kitchenOrders.map((order) => {
            const config = statusConfig[order.status] ?? statusConfig.RECEIVED;
            return (
              <div key={order.id} className="rounded-2xl border border-white/10 bg-slate-900/70 p-4 shadow-[0_0_0_1px_rgba(255,255,255,0.03)]">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-gray-400">{getMinutesAgo(order.createdAt)}</p>
                    <h2 className="mt-1 text-lg font-bold text-white">
                      {order.table ? order.table.name : 'Paket Servis'}
                    </h2>
                  </div>
                  <span className={`rounded-full border px-2.5 py-1 text-xs font-semibold ${config.badge}`}>
                    {config.label}
                  </span>
                </div>

                <div className="mt-4 space-y-3">
                  {order.items.map((item) => (
                    <div key={item.id} className="rounded-xl border border-white/10 bg-slate-950/60 p-3">
                      <div className="flex items-start justify-between gap-3">
                        <p className="text-sm font-bold text-white">
                          <span className="mr-2 text-indigo-400">{item.quantity}x</span>
                          {item.product.name}
                        </p>
                        {item.note && (
                          <span className="text-[11px] font-semibold text-amber-400">Not</span>
                        )}
                      </div>
                      {item.note && <p className="mt-2 text-sm text-gray-400">{item.note}</p>}
                      {item.options && item.options.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-2">
                          {item.options.map((opt) => (
                            <span key={opt.id} className="rounded-full border border-white/10 bg-slate-900/70 px-2 py-0.5 text-[11px] text-gray-400">
                              + {opt.optionValue.name}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                {order.note && (
                  <div className="mt-4 rounded-xl border border-indigo-900/40 bg-indigo-950/20 p-3 text-sm text-indigo-200">
                    <p className="font-semibold">Sipariş notu</p>
                    <p className="mt-1 text-indigo-100/90">{order.note}</p>
                  </div>
                )}

                <div className="mt-4 flex items-center justify-between border-t border-white/10 pt-3">
                  <div className="flex items-center gap-2 text-sm text-gray-400">
                    <Clock className="h-4 w-4" />
                    {getMinutesAgo(order.createdAt)}
                  </div>
                  {order.status === 'READY' ? (
                    <div className="flex items-center gap-2 text-sm font-semibold text-emerald-400">
                      <CheckCircle2 className="h-4 w-4" />
                      Servise hazır
                    </div>
                  ) : (
                    <button
                      onClick={() => void updateStatus(order.id, order.status === 'RECEIVED' ? 'PREPARING' : 'READY')}
                      className={`rounded-lg px-3 py-2 text-sm font-semibold text-white ${config.actionColor}`}
                    >
                      {config.actionLabel}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}