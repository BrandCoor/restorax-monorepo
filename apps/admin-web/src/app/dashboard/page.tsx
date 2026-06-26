'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useAuthStore } from '@/store/authStore';
import api from '@/services/api';
import { getSocket } from '@/services/socket';
import { PhoneCall, RefreshCw, Radio, Check, X, Power, PowerOff, ChevronRight, CheckCircle2 } from 'lucide-react';

interface OrderItem {
  id: string;
  quantity: number;
  product: {
    name: string;
  };
}

interface Order {
  id: string;
  status: string; // 'RECEIVED', 'PREPARING', 'READY', 'DELIVERED', 'COMPLETED', 'CANCELLED'
  totalAmount: string | number;
  createdAt: string;
  source: string; // 'YEMEKSEPETI', 'TRENDYOL', 'GETIR', 'MIGROS'
  note?: string;
  rejectReason?: string;
  items: OrderItem[];
}

export default function DashboardPage() {
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [testLoading, setTestLoading] = useState(false);
  const [platformOrders, setPlatformOrders] = useState<Order[]>([]);

  // Platform bazlı sipariş adetleri
  const [ysCount, setYsCount] = useState(0);
  const [tyCount, setTyCount] = useState(0);
  const [gtCount, setGetirCount] = useState(0);
  const [mgCount, setMigrosCount] = useState(0);

  // Platform Mağaza Bağlantı/Açık-Kapalı Durumları [1]
  const [platforms, setPlatforms] = useState([
    { key: 'YEMEKSEPETI', name: 'Yemeksepeti', isActive: true, color: 'text-pink-500 bg-pink-950/20 border-pink-900/40' },
    { key: 'TRENDYOL', name: 'Trendyol Yemek', isActive: true, color: 'text-orange-500 bg-orange-950/20 border-orange-900/40' },
    { key: 'GETIR', name: 'Getir Yemek', isActive: true, color: 'text-purple-500 bg-purple-950/20 border-purple-900/40' },
    { key: 'MIGROS', name: 'Migros Yemek', isActive: true, color: 'text-amber-500 bg-amber-950/20 border-amber-900/40' },
  ]);

  // Online Entegrasyon Verilerini Çekme [2]
  const fetchPlatformData = useCallback(async () => {
    if (!user?.branchId) return;
    try {
      const response = await api.get(`/orders?branchId=${user.branchId}`);
      if (Array.isArray(response.data)) {
        const allOrders = response.data as Order[];
        
        // Sadece arşivlenmemiş (COMPLETED ve CANCELLED olmayan) platform siparişlerini listele [2]
        const onlineOrders = allOrders.filter(
          (o) => ['YEMEKSEPETI', 'TRENDYOL', 'GETIR', 'MIGROS'].includes(o.source) && 
                 o.status !== 'COMPLETED' && 
                 o.status !== 'CANCELLED'
        );

        setPlatformOrders(onlineOrders.reverse());

        // Platform bazlı aktif sipariş adetlerini eşle [2]
        setYsCount(onlineOrders.filter((o) => o.source === 'YEMEKSEPETI').length);
        setTyCount(onlineOrders.filter((o) => o.source === 'TRENDYOL').length);
        setGetirCount(onlineOrders.filter((o) => o.source === 'GETIR').length);
        setMigrosCount(onlineOrders.filter((o) => o.source === 'MIGROS').length);
      } else {
        setPlatformOrders([]);
      }
    } catch (error) {
      console.error('Platform verileri çekilemedi:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    void fetchPlatformData();
  }, [fetchPlatformData]);

  // Real-time Sockets senkronizasyonu [1]
  useEffect(() => {
    if (!user?.branchId) return;

    const socket = getSocket('http://localhost:3000');
    socket.connect();

    socket.emit('join_branch', { branchId: user.branchId });

    socket.on('new_order', () => {
      console.log('🔄 [SOCKET] New online order received, updating dashboard...');
      void fetchPlatformData();
    });

    socket.on('order_status_changed', () => {
      void fetchPlatformData();
    });

    return () => {
      socket.off('new_order');
      socket.off('order_status_changed');
      socket.disconnect();
    };
  }, [user, fetchPlatformData]);

  // Mağazayı Geçici Olarak Kapatma / Açma [1]
  const togglePlatformStatus = (key: string) => {
    setPlatforms((prev) =>
      prev.map((plat) =>
        plat.key === key ? { ...plat, isActive: !plat.isActive } : plat
      )
    );
  };

  // Kural A: Sipariş Kabul Etme (Durum PREPARING olur) [1]
  const handleAcceptOrder = async (orderId: string) => {
    try {
      await api.patch(`/orders/${orderId}`, { status: 'PREPARING' });
      alert('⚡ Sipariş kabul edildi! Hazırlık aşamasına alındı.');
      void fetchPlatformData();
    } catch (error) {
      console.error('Sipariş kabul edilemedi:', error);
    }
  };

  // Kural B: Sipariş Reddetme ve İptal Sebebi Girme Zorunluluğu [1]
  const handleRejectOrder = async (orderId: string) => {
    const reason = prompt('Lütfen sipariş reddetme sebebini yazın (Zorunlu):');
    if (reason === null) return;
    if (!reason.trim()) {
      alert('HATA: Reddetme sebebi girmek zorunludur!');
      return;
    }

    try {
      await api.patch(`/orders/${orderId}`, { status: 'CANCELLED', rejectReason: reason });
      alert(`❌ Sipariş "${reason}" gerekçesiyle reddedildi ve platforma bildirildi.`);
      void fetchPlatformData();
    } catch (error) {
      console.error('Sipariş reddedilemedi:', error);
    }
  };

  // Kural C: Sipariş Hazırlandı (Durum READY olur) [1]
  const handlePrepareOrder = async (orderId: string) => {
    try {
      await api.patch(`/orders/${orderId}`, { status: 'READY' });
      alert('⚡ Sipariş hazırlandı! Kuryeye verilebilir.');
      void fetchPlatformData();
    } catch (error) {
      console.error('Sipariş durumu güncellenemedi:', error);
    }
  };

  // Kural C: Sipariş Teslim Edildi / Yolda (Durum DELIVERED olur) [1]
  const handleDeliverOrder = async (orderId: string) => {
    try {
      await api.patch(`/orders/${orderId}`, { status: 'DELIVERED' });
      alert('⚡ Sipariş yola çıkarıldı / teslim aşamasında.');
      void fetchPlatformData();
    } catch (error) {
      console.error('Sipariş teslim edilemedi:', error);
    }
  };

  // Kural D: Siparişi Kapat / Ödemeyi Al (Durum COMPLETED olur, arşivlenir) [1]
  const handleCompleteOrder = async (orderId: string) => {
    try {
      // Platform siparişleri paket servis olduğu için doğrudan CASH (Nakit/Online) kapatılır [1]
      await api.post(`/orders/${orderId}/settle`, {
        paymentMethod: 'CASH',
        amount: Number(platformOrders.find((o) => o.id === orderId)?.totalAmount || 0),
      });
      alert('⚡ Sipariş başarıyla teslim edildi ve kapatıldı. Ciroya eklendi!');
      void fetchPlatformData();
    } catch (error) {
      console.error('Sipariş kapatılamadı:', error);
    }
  };

  // Canlı Dış Platform Sipariş Simülasyonu [2]
  const handleSimulatePlatformOrder = async (platformName: string) => {
    const targetPlat = platforms.find((p) => p.key === platformName);
    if (targetPlat && !targetPlat.isActive) {
      alert(`⚠️ [HATA] ${platformName} mağazası kapalı olduğu için sipariş kabul edilemez! Lütfen önce mağazayı açın.`);
      return;
    }

    setTestLoading(true);
    try {
      await api.post('/orders/test-platform', {
        branchId: user!.branchId,
        platformName,
      });
      alert(`⚡ [SİMÜLASYON] ${platformName} üzerinden canlı yeni bir sipariş başarıyla simüle edildi!`);
      void fetchPlatformData();
    } catch (error) {
      console.error('Simülasyon başarısız:', error);
    } finally {
      setTestLoading(false);
    }
  };

  const getPlatformCount = (key: string) => {
    if (key === 'YEMEKSEPETI') return ysCount;
    if (key === 'TRENDYOL') return tyCount;
    if (key === 'GETIR') return gtCount;
    return mgCount;
  };

  return (
    <div className="space-y-6">
      {/* Sayfa Başlığı ve Canlı Entegrasyon Sipariş Simülatörleri */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-gray-900 pb-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white flex items-center gap-3">
            <Radio className="h-8 w-8 text-indigo-500 animate-pulse" />
            Online Entegrasyon Yönetim Merkezi
          </h1>
          <p className="text-gray-400 mt-1">Trendyol, Yemeksepeti, Getir ve Migros Yemek canlı sipariş kontrol istasyonu.</p>
        </div>

        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => void handleSimulatePlatformOrder('YEMEKSEPETI')}
            disabled={testLoading}
            className="rounded-lg bg-pink-700 hover:bg-pink-600 px-3 py-1.5 text-xs font-bold text-white transition-colors disabled:opacity-50"
          >
            Yemeksepeti Simüle Et
          </button>
          <button
            onClick={() => void handleSimulatePlatformOrder('TRENDYOL')}
            disabled={testLoading}
            className="rounded-lg bg-orange-600 hover:bg-orange-500 px-3 py-1.5 text-xs font-bold text-white transition-colors disabled:opacity-50"
          >
            Trendyol Simüle Et
          </button>
          <button
            onClick={() => void handleSimulatePlatformOrder('GETIR')}
            disabled={testLoading}
            className="rounded-lg bg-purple-700 hover:bg-purple-600 px-3 py-1.5 text-xs font-bold text-white transition-colors disabled:opacity-50"
          >
            Getir Simüle Et
          </button>
        </div>
      </div>

      {/* 4 Ana Platformun Durumu, Sipariş Adetleri ve AÇ/KAPAT Kontrolleri */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {platforms.map((plat) => (
          <div
            key={plat.key}
            className={`rounded-xl border p-5 shadow-sm flex flex-col justify-between h-36 transition-colors ${
              plat.isActive 
                ? plat.color 
                : 'border-red-950/60 bg-red-950/5 text-red-500/60'
            }`}
          >
            <div className="flex items-start justify-between">
              <span className="text-xs font-extrabold tracking-wide uppercase">{plat.name}</span>
              <span className={`rounded-full px-2 py-0.5 text-xxs font-extrabold border ${
                plat.isActive 
                  ? 'bg-emerald-950/40 text-emerald-400 border-emerald-900/50' 
                  : 'bg-red-950/40 text-red-400 border-red-900/50'
              }`}>
                {plat.isActive ? 'AÇIK' : 'KAPALI'}
              </span>
            </div>
            
            <div className="flex items-center justify-between mt-2 pt-2 border-t border-white/5">
              <div>
                <p className={`text-2xl font-extrabold ${plat.isActive ? 'text-white' : 'text-red-500/40'}`}>
                  {loading ? '...' : `${getPlatformCount(plat.key)} Adet`}
                </p>
              </div>
              <button
                onClick={() => togglePlatformStatus(plat.key)}
                className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xxs font-extrabold border transition-all ${
                  plat.isActive
                    ? 'bg-red-950/50 text-red-400 border-red-900/50 hover:bg-red-900 hover:text-white'
                    : 'bg-emerald-950/50 text-emerald-400 border-emerald-900/50 hover:bg-emerald-600 hover:text-white'
                }`}
              >
                {plat.isActive ? (
                  <>
                    <PowerOff className="h-3.5 w-3.5" />
                    KAPAT
                  </>
                ) : (
                  <>
                    <Power className="h-3.5 w-3.5" />
                    AÇ
                  </>
                )}
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Alt Bölüm: Canlı Paket Sipariş Havuzu ve Kabul/Red/Durum Aksiyonları */}
      <div className="rounded-xl border border-gray-900 bg-gray-900/40 p-6">
        <div className="flex items-center justify-between border-b border-gray-900 pb-3 mb-4">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <PhoneCall className="h-5 w-5 text-indigo-500" />
            Canlı Paket Sipariş Havuzu
          </h2>
          <button
            onClick={() => void fetchPlatformData()}
            className="text-gray-500 hover:text-white transition-colors flex items-center gap-1.5 text-xs font-bold"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Yenile
          </button>
        </div>

        {loading ? (
          <p className="text-sm text-gray-400 py-6 text-center">Yükleniyor...</p>
        ) : platformOrders.length === 0 ? (
          <p className="text-sm text-gray-500 py-12 text-center border border-dashed border-gray-900 rounded-lg">
            Şu anda platformlardan gelen aktif online paket siparişi bulunmuyor.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-gray-400">
              <thead className="text-xs uppercase text-gray-500 border-b border-gray-900 bg-gray-950/30">
                <tr>
                  <th className="py-3 px-3">Platform</th>
                  <th className="py-3 px-3">Müşteri / Teslimat Detayları</th>
                  <th className="py-3 px-3">Sipariş İçeriği</th>
                  <th className="py-3 px-3">Tutar</th>
                  <th className="py-3 px-3">İşlem / Aksiyon</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-950">
                {platformOrders.map((ord) => {
                  const isReceived = ord.status === 'RECEIVED';
                  const isPreparing = ord.status === 'PREPARING';
                  const isReady = ord.status === 'READY';
                  const isDelivered = ord.status === 'DELIVERED';

                  return (
                    <tr key={ord.id} className="hover:bg-gray-900/10">
                      <td className="py-4 px-3">
                        <span className={`inline-flex items-center rounded-lg px-2.5 py-1 text-xs font-extrabold ${
                          ord.source === 'YEMEKSEPETI'
                            ? 'bg-pink-950/40 text-pink-400 border border-pink-900/50'
                            : ord.source === 'TRENDYOL'
                              ? 'bg-orange-950/40 text-orange-400 border border-orange-900/50'
                              : 'bg-purple-950/40 text-purple-400 border border-purple-900/50'
                        }`}>
                          {ord.source}
                        </span>
                      </td>

                      <td className="py-4 px-3 max-w-xs">
                        <p className="font-bold text-white text-sm">Ahmet Yılmaz</p>
                        <p className="text-xxs text-gray-500 font-semibold mt-0.5">0555 444 33 22</p>
                        <p className="text-xxs text-indigo-300 mt-1 line-clamp-1 italic">
                          Adres: Atatürk Mah. 120. Sokak No:4 Daire:12
                        </p>
                      </td>

                      <td className="py-4 px-3 text-xs">
                        <p className="font-bold text-white">2x Klasik Burger</p>
                        {ord.note && (
                          <p className="text-xxs text-amber-500 mt-0.5 italic font-semibold">Not: {ord.note}</p>
                        )}
                      </td>

                      <td className="py-4 px-3 font-extrabold text-indigo-400 text-sm">
                        {Number(ord.totalAmount).toFixed(2)} TL
                      </td>

                      {/* Çok Aşamalı Sipariş Yönetim Butonları [1, 2] */}
                      <td className="py-4 px-3">
                        {isReceived ? (
                          <div className="flex gap-2">
                            <button
                              onClick={() => void handleAcceptOrder(ord.id)}
                              className="flex items-center justify-center p-1.5 rounded-lg bg-emerald-950 border border-emerald-900/50 text-emerald-400 hover:bg-emerald-600 hover:text-white transition-colors"
                              title="Kabul Et"
                            >
                              <Check className="h-4 w-4 shrink-0" />
                              <span className="text-xxs font-extrabold px-1">KABUL</span>
                            </button>
                            <button
                              onClick={() => void handleRejectOrder(ord.id)}
                              className="flex items-center justify-center p-1.5 rounded-lg bg-red-950 border border-red-900/50 text-red-400 hover:bg-red-600 hover:text-white transition-colors"
                              title="Gerekçe Girerek Reddet"
                            >
                              <X className="h-4 w-4 shrink-0" />
                              <span className="text-xxs font-extrabold px-1">REDDET</span>
                            </button>
                          </div>
                        ) : isPreparing ? (
                          <button
                            onClick={() => void handlePrepareOrder(ord.id)}
                            className="flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold transition-all shadow-md shadow-amber-950/25"
                          >
                            <ChevronRight className="h-4 w-4 shrink-0" />
                            Hazırlandı Yap
                          </button>
                        ) : isReady ? (
                          <button
                            onClick={() => void handleDeliverOrder(ord.id)}
                            className="flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-all shadow-md shadow-indigo-950/25"
                          >
                            <CheckCircle2 className="h-4 w-4 shrink-0" />
                            Yola Çıkar / Teslim Et
                          </button>
                        ) : isDelivered ? (
                          <button
                            onClick={() => void handleCompleteOrder(ord.id)}
                            className="flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all shadow-md shadow-emerald-950/25"
                          >
                            <Check className="h-4 w-4 shrink-0" />
                            Kapat / Ödendi [1]
                          </button>
                        ) : (
                          <span className="inline-flex items-center rounded-full bg-emerald-950/40 text-emerald-400 border border-emerald-900/50 px-2.5 py-1 text-xs font-bold">
                            Kapatıldı / Ödendi
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}