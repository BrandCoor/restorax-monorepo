'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useAuthStore } from '@/store/authStore';
import api from '@/services/api';
import { getSocket } from '@/services/socket';
import { UtensilsCrossed, Clock } from 'lucide-react';

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

    const socket = getSocket('http://localhost:3000');
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

  const getMinutesAgo = (dateString: string) => {
    const diffMs = Math.abs(new Date().getTime() - new Date(dateString).getTime());
    const diffMins = Math.floor(diffMs / (1000 * 60));
    return diffMins === 0 ? 'Şimdi' : `${diffMins} dk. önce`;
  };

  return (
    <div className="space-y-6">
      {/* Sayfa Başlığı */}
      <div className="flex items-center justify-between border-b border-gray-900 pb-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white flex items-center gap-3">
            <UtensilsCrossed className="h-8 w-8 text-indigo-500" />
            Mutfak Ekranı (Canlı Sipariş Listesi)
          </h1>
          <p className="text-gray-400 mt-1">Ödemesi bekleyen tüm aktif siparişlerin şefler için yüksek yoğunluklu listesi [1].</p>
        </div>
        <span className="rounded-full bg-indigo-900/50 border border-indigo-900 px-4 py-1.5 text-sm font-semibold text-indigo-400">
          {orders.length} Hazırlanan Sipariş
        </span>
      </div>

      {loading ? (
        <div className="flex h-64 items-center justify-center text-gray-400">
          Siparişler yükleniyor...
        </div>
      ) : orders.length === 0 ? (
        <div className="flex h-64 items-center justify-center rounded-xl border border-dashed border-gray-800 text-gray-500">
          Şu anda mutfakta hazırlanacak sipariş bulunmuyor.
        </div>
      ) : (
        /* Yüksek Yoğunluklu Profesyonel Sipariş Liste Yapısı (Table/Row View) [1] */
        <div className="overflow-hidden rounded-xl border border-gray-900 bg-gray-900/20">
          <table className="w-full text-left text-sm text-gray-400">
            <thead className="text-xs uppercase text-gray-500 bg-gray-950 border-b border-gray-900">
              <tr>
                <th className="py-3.5 px-4 w-32">Sipariş Saati</th>
                <th className="py-3.5 px-4 w-40">Masa / Sipariş</th>
                <th className="py-3.5 px-4">Sipariş Kalemleri ve Mutfak Detayları</th>
                <th className="py-3.5 px-4 w-64">Sipariş Notu</th>
                <th className="py-3.5 px-4 w-40">Hizmet Alan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-950">
              {orders.map((order) => (
                <tr key={order.id} className="hover:bg-gray-900/10">
                  {/* Sipariş Saati */}
                  <td className="py-4 px-4 font-semibold text-gray-300">
                    <div className="flex items-center gap-1.5">
                      <Clock className="h-4 w-4 text-indigo-500" />
                      {getMinutesAgo(order.createdAt)}
                    </div>
                  </td>

                  {/* Masa / Sipariş */}
                  <td className="py-4 px-4 font-bold text-white text-base">
                    {order.table ? order.table.name : 'Paket Servis'}
                  </td>

                  {/* Sipariş İçeriği (Ürün Adetleri ve Seçenekleri) */}
                  <td className="py-4 px-4 space-y-2">
                    {order.items?.map((item) => (
                      <div key={item.id} className="flex flex-col">
                        <p className="text-sm font-bold text-white">
                          <span className="text-indigo-400 mr-2">{item.quantity}x</span>
                          {item.product.name}
                          {item.note && (
                            <span className="text-xs text-amber-500 italic ml-3 font-semibold">
                              (* Not: {item.note})
                            </span>
                          )}
                        </p>
                        {item.options && item.options.length > 0 && (
                          <div className="pl-6 flex gap-1.5 flex-wrap mt-0.5">
                            {item.options.map((opt) => (
                              <span key={opt.id} className="text-xs text-gray-500 font-semibold bg-gray-950 px-2 py-0.5 rounded border border-gray-900">
                                + {opt.optionValue.name}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </td>

                  {/* Genel Sipariş Notu */}
                  <td className="py-4 px-4">
                    {order.note ? (
                      <span className="text-xs font-semibold text-indigo-300 bg-indigo-950/20 border border-indigo-900/30 px-2.5 py-1 rounded-lg">
                        {order.note}
                      </span>
                    ) : (
                      <span className="text-gray-600 text-xs italic">Not yok</span>
                    )}
                  </td>

                  {/* Hizmet Alan (Garson) */}
                  <td className="py-4 px-4 text-xs font-semibold text-gray-500">
                    {order.waiter ? `${order.waiter.firstName} ${order.waiter.lastName[0]}.` : 'Sistem'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}