'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useAuthStore } from '@/store/authStore';
import api from '@/services/api';
import { getSocket } from '@/services/socket';
import { Grid, CircleDot, Clock, Receipt, Lock, X, Printer, Landmark, DollarSign, Wallet, Minus, Plus, RefreshCcw, Merge } from 'lucide-react';

interface Table {
  id: string;
  name: string;
  capacity: number;
  status: 'IDLE' | 'ORDERED' | 'PREPARING' | 'BILL_REQUESTED' | 'CLOSED';
}

interface TableSection {
  id: string;
  name: string;
  tables: Table[];
}

interface OrderItem {
  id: string;
  quantity: number;
  paidQuantity: number;
  unitPrice: string | number;
  subtotal: string | number;
  product: {
    id: string;
    name: string;
  };
}

interface ActiveOrder {
  id: string;
  totalAmount: string | number;
  discount: string | number;
  items: OrderItem[];
}

export default function TablesPage() {
  const { user } = useAuthStore();
  const [sections, setSections] = useState<TableSection[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal ve Seçili Masa State'leri [1]
  const [selectedTable, setSelectedTable] = useState<Table | null>(null);
  const [activeOrder, setActiveOrder] = useState<ActiveOrder | null>(null);
  const [modalLoading, setModalLoading] = useState(false);
  
  // Ödeme ve İndirim Kontrolleri
  const [paymentMethod, setPaymentMethod] = useState<'CASH' | 'CREDIT_CARD' | 'OPEN_ACCOUNT'>('CASH');
  const [customAmount, setCustomAmount] = useState<string>('');
  const [discountType, setDiscountType] = useState<'AMOUNT' | 'PERCENT'>('AMOUNT');
  const [discountValue, setDiscountValue] = useState<string>('');
  const [selectedItemQuantities, setSelectedItemQuantities] = useState<Record<string, number>>({});

  // Taşıma / Birleştirme ve Bölme Modal State'leri [1]
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [transferType, setTransferType] = useState<'MOVE' | 'SPLIT'>('MOVE');

  const fetchTables = useCallback(async () => {
    if (!user?.branchId) return;
    try {
      const response = await api.get(`/tables?branchId=${user.branchId}`);
      setSections(response.data as TableSection[]);
    } catch (error: unknown) {
      console.error('Masalar getirilirken hata oluştu:', error instanceof Error ? error.message : error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    void fetchTables();
  }, [fetchTables]);

  // Real-time Eşzamanlama
  useEffect(() => {
    if (!user?.branchId) return;

    const socket = getSocket(process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000');
    socket.connect();

    socket.emit('join_branch', { branchId: user.branchId });

    socket.on('table_status_changed', () => {
      console.log('🔄 [SOCKET] Table status changed, refetching...');
      void fetchTables();
    });

    socket.on('new_order', () => {
      console.log('🔄 [SOCKET] New order received, refetching...');
      void fetchTables();
    });

    return () => {
      socket.off('table_status_changed');
      socket.off('new_order');
      socket.disconnect();
    };
  }, [user, fetchTables]);

  const handleTableClick = async (table: Table) => {
    if (table.status === 'IDLE') return;
    setSelectedTable(table);
    setModalLoading(true);
    setCustomAmount('');
    setDiscountValue('');
    setSelectedItemQuantities({});
    try {
      const response = await api.get(`/orders/active-by-table/${table.id}`);
      setActiveOrder(response.data as ActiveOrder);
    } catch (error: unknown) {
      console.error('Aktif adisyon çekilemedi:', error instanceof Error ? error.message : error);
      setSelectedTable(null);
      alert('Masaya ait aktif adisyon bulunamadı veya bir hata oluştu.');
    } finally {
      setModalLoading(false);
    }
  };

  // Hesap Adisyonu Çıkarma [1]
  const handlePrintBill = async () => {
    if (!activeOrder) return;
    try {
      await api.post(`/orders/${activeOrder.id}/print-bill`);
      alert('Hesap adisyonu kasa yazıcısına gönderildi, masa "Hesap İstendi" yapıldı.');
      setSelectedTable(null);
      void fetchTables();
    } catch (error) {
      console.error('Adisyon çıkarılamadı:', error);
    }
  };

  // Kural A: Esnek İndirim Uygulama [1]
  const handleApplyDiscount = async () => {
    if (!activeOrder || !discountValue) return;
    try {
      await api.post(`/orders/${activeOrder.id}/discount`, {
        discountType,
        value: Number(discountValue),
      });
      alert('İndirim adisyona uygulandı!');
      setDiscountValue('');
      const response = await api.get(`/orders/active-by-table/${selectedTable!.id}`);
      setActiveOrder(response.data as ActiveOrder);
    } catch (error) {
      console.error('İndirim uygulanamadı:', error);
    }
  };

  // Kural B: Parçalı ve Kısmi Ödeme Alma [1]
  const handlePayCustomAmount = async () => {
    if (!activeOrder || !customAmount) return;
    try {
      await api.post(`/orders/${activeOrder.id}/pay-amount`, {
        paymentMethod,
        amount: Number(customAmount),
      });
      alert(`[KISMİ ÖDEME] ${Number(customAmount).toFixed(2)} TL ödeme alındı.`);
      setCustomAmount('');
      
      try {
        const response = await api.get(`/orders/active-by-table/${selectedTable!.id}`);
        setActiveOrder(response.data as ActiveOrder);
      } catch {
        setSelectedTable(null);
        void fetchTables();
      }
    } catch (error) {
      console.error('Ödeme alınamadı:', error);
    }
  };

  // Kural C: Ürün/Yediklerini Seçerek Ödeme Yapma [1]
  const handlePaySelectedItems = async () => {
    if (!activeOrder) return;

    const itemsPayload = Object.keys(selectedItemQuantities)
      .map((key) => ({
        orderItemId: key,
        quantity: selectedItemQuantities[key],
      }))
      .filter((item) => item.quantity > 0);

    if (itemsPayload.length === 0) {
      alert('Önce ödemesi yapılacak ürünleri seçin.');
      return;
    }

    try {
      await api.post(`/orders/${activeOrder.id}/pay-items`, {
        paymentMethod,
        items: itemsPayload,
      });
      alert('Seçilen ürünlerin ödemesi alındı.');
      setSelectedItemQuantities({});
      
      try {
        const response = await api.get(`/orders/active-by-table/${selectedTable!.id}`);
        setActiveOrder(response.data as ActiveOrder);
      } catch {
        setSelectedTable(null);
        void fetchTables();
      }
    } catch (error) {
      console.error('Ödeme alınamadı:', error);
    }
  };

  // KURAL D: Masa Taşıma & Birleştirme Tetikleyicisi [1]
  const handleMoveOrMergeTable = async (targetTableId: string) => {
    if (!selectedTable) return;
    try {
      const response = await api.post('/orders/move-table', {
        sourceTableId: selectedTable.id,
        targetTableId,
      });

      if (response.data?.type === 'MERGED') {
        alert('⚡ İki dolu masa başarıyla tek hesap altında birleştirildi! [1]');
      } else {
        alert('⚡ Masa başarıyla yeni konumuna taşındı! [1]');
      }

      setIsTransferModalOpen(false);
      setSelectedTable(null);
      void fetchTables();
    } catch (error) {
      console.error('Masa transfer işlemi başarısız:', error);
    }
  };

  // KURAL E: Adisyon Bölme & Belirli Ürünleri Başka Masaya Aktarma [1]
  const handleSplitAndTransfer = async (targetTableId: string) => {
    if (!activeOrder) return;

    const itemsPayload = Object.keys(selectedItemQuantities)
      .map((key) => ({
        orderItemId: key,
        quantity: selectedItemQuantities[key],
      }))
      .filter((item) => item.quantity > 0);

    if (itemsPayload.length === 0) {
      alert('Lütfen önce bölünecek ürünleri seçin [1].');
      return;
    }

    try {
      await api.post('/orders/split-table', {
        sourceOrderId: activeOrder.id,
        targetTableId,
        items: itemsPayload,
      });

      alert('⚡ Seçilen ürünler başarıyla hedeflenen masaya bölünerek aktarıldı! [1]');
      setIsTransferModalOpen(false);
      setSelectedTable(null);
      void fetchTables();
    } catch (error) {
      console.error('Adisyon bölme işlemi başarısız:', error);
    }
  };

  const handleIncrementItem = (item: OrderItem) => {
    const maxQty = item.quantity - item.paidQuantity;
    const current = selectedItemQuantities[item.id] || 0;
    if (current < maxQty) {
      setSelectedItemQuantities((prev) => ({ ...prev, [item.id]: current + 1 }));
    }
  };

  const handleDecrementItem = (item: OrderItem) => {
    const current = selectedItemQuantities[item.id] || 0;
    if (current > 0) {
      setSelectedItemQuantities((prev) => ({ ...prev, [item.id]: current - 1 }));
    }
  };

  const getSelectedItemsTotal = () => {
    if (!activeOrder) return 0;
    return activeOrder.items.reduce((total, item) => {
      const selectedQty = selectedItemQuantities[item.id] || 0;
      return total + Number(item.unitPrice) * selectedQty;
    }, 0);
  };

  const getRemainingAmount = (order: ActiveOrder) => {
    const netTotal = Number(order.totalAmount) - Number(order.discount);
    const alreadyPaid = order.items.reduce((sum, item) => sum + Number(item.unitPrice) * item.paidQuantity, 0);
    return Math.max(0, netTotal - alreadyPaid);
  };

  const getStatusStyle = (status: Table['status']) => {
    switch (status) {
      case 'IDLE':
        return {
          bg: 'bg-emerald-950/20 border-emerald-900',
          badgeBg: 'bg-emerald-900/40 text-emerald-400',
          text: 'Boş',
          icon: CircleDot,
        };
      case 'ORDERED':
        return {
          bg: 'bg-indigo-950/20 border-indigo-900',
          badgeBg: 'bg-indigo-900/40 text-indigo-400',
          text: 'Sipariş Var',
          icon: Clock,
        };
      case 'PREPARING':
        return {
          bg: 'bg-amber-950/20 border-amber-900',
          badgeBg: 'bg-amber-900/40 text-amber-400',
          text: 'Hazırlanıyor',
          icon: Clock,
        };
      case 'BILL_REQUESTED':
        return {
          bg: 'bg-red-950/20 border-red-900',
          badgeBg: 'bg-red-900/40 text-red-400',
          text: 'Hesap İstendi',
          icon: Receipt,
        };
      default:
        return {
          bg: 'bg-gray-900 border-gray-800',
          badgeBg: 'bg-gray-800 text-gray-400',
          text: 'Kapalı',
          icon: Lock,
        };
    }
  };

  return (
    <div className="space-y-6">
      {/* Sayfa Başlığı */}
      <div className="rounded-2xl border border-white/10 bg-slate-900/70 p-5 shadow-[0_0_0_1px_rgba(255,255,255,0.03)]">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-white">Masa Takibi</h1>
            <p className="mt-1 text-gray-400">Adisyon parçalama, masa taşıma, birleştirme ve ödeme yönetimi (Anlık Eşzamanlanır).</p>
          </div>
          <div className="rounded-full border border-indigo-900/40 bg-indigo-950/30 px-3 py-1 text-xs font-semibold text-indigo-300">
            Canlı operasyon
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex h-64 items-center justify-center text-gray-400">
          Masalar yükleniyor...
        </div>
      ) : sections.length === 0 ? (
        <div className="flex h-64 items-center justify-center rounded-xl border border-dashed border-gray-800 text-gray-500">
          Bu şubeye ait tanımlanmış masa bulunmuyor.
        </div>
      ) : (
        <div className="space-y-8">
          {sections.map((section) => (
            <div key={section.id} className="space-y-4">
              <div className="flex items-center gap-3 border-b border-white/10 pb-2">
                <Grid className="h-5 w-5 text-indigo-500" />
                <h2 className="text-lg font-bold text-white">{section.name}</h2>
                <span className="rounded-full bg-gray-900 px-2 py-0.5 text-xs text-gray-400 font-semibold">
                  {section.tables?.length || 0} Masa
                </span>
              </div>

              <div className="grid gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                {section.tables?.map((table) => {
                  const style = getStatusStyle(table.status);
                  const StatusIcon = style.icon;

                  return (
                    <div
                      key={table.id}
                      onClick={() => void handleTableClick(table)}
                      className={`group relative rounded-2xl border p-5 shadow-sm transition-all duration-200 hover:scale-[1.02] cursor-pointer ${style.bg}`}
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="text-lg font-bold text-white group-hover:text-indigo-400 transition-colors">
                            {table.name}
                          </p>
                          <p className="text-xs text-gray-500 mt-0.5">{table.capacity} Kişilik</p>
                        </div>

                        <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${style.badgeBg}`}>
                          <StatusIcon className="h-3 w-3" />
                          {style.text}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* DETAYLI ADİSYON / ÖDEME BÖLME MODALI */}
      {selectedTable && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm overflow-y-auto">
          <div className="w-full max-w-2xl rounded-2xl border border-gray-800 bg-gray-900 p-6 shadow-2xl flex flex-col justify-between my-8">
            
            <div className="flex items-center justify-between border-b border-gray-800 pb-4">
              <div>
                <h2 className="text-xl font-bold text-white">{selectedTable.name} - Adisyon İşlemleri</h2>
                <p className="text-xs text-gray-500 mt-0.5">{selectedTable.capacity} Kişilik Masa</p>
              </div>
              <button onClick={() => setSelectedTable(null)} className="text-gray-500 hover:text-white transition-colors">
                <X className="h-6 w-6" />
              </button>
            </div>

            {modalLoading ? (
              <div className="py-12 text-center text-gray-400 text-sm">
                Adisyon yükleniyor...
              </div>
            ) : activeOrder ? (
              <div className="py-4 space-y-5">
                {/* 1. KISIM: Ürün Seçmeli Adisyon Görünümü */}
                <div className="space-y-2">
                  <div className="text-xs font-bold text-gray-400 border-b border-gray-800 pb-2 flex items-center justify-between">
                    <span>ÜRÜN ADI</span>
                    <span className="w-24 text-center">KALAN / ADET</span>
                    <span className="w-24 text-center">ÖDENECEK</span>
                    <span className="w-24 text-right">TUTAR</span>
                  </div>

                  <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                    {activeOrder.items?.map((item) => {
                      const maxToPay = item.quantity - item.paidQuantity;
                      const selected = selectedItemQuantities[item.id] || 0;

                      return (
                        <div key={item.id} className="flex items-center justify-between text-sm py-2 border-b border-gray-950/40 text-gray-300">
                          <div className="flex-1 min-w-0 pr-2">
                            <p className="font-bold text-white truncate">{item.product.name}</p>
                            <p className="text-xs text-gray-500 mt-0.5">{Number(item.unitPrice).toFixed(2)} TL / Adet</p>
                          </div>

                          <div className="w-24 text-center text-xs text-gray-400 font-semibold">
                            <span className="text-emerald-500">{item.paidQuantity}</span> / {item.quantity} Ödendi
                          </div>

                          <div className="w-24 flex items-center justify-center gap-1.5">
                            <button
                              disabled={selected === 0}
                              onClick={() => handleDecrementItem(item)}
                              className="p-1 rounded bg-gray-950 border border-gray-800 hover:text-white disabled:opacity-30"
                            >
                              <Minus className="h-3 w-3" />
                            </button>
                            <span className="text-xs font-bold text-white w-4 text-center">{selected}</span>
                            <button
                              disabled={selected >= maxToPay}
                              onClick={() => handleIncrementItem(item)}
                              className="p-1 rounded bg-gray-950 border border-gray-800 hover:text-white disabled:opacity-30"
                            >
                              <Plus className="h-3 w-3" />
                            </button>
                          </div>

                          <div className="w-24 text-right font-semibold">
                            {((Number(item.unitPrice)) * (item.quantity - item.paidQuantity)).toFixed(2)} TL
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* 2. KISIM: Hesap Özeti ve Esnek İndirim Paneli */}
                <div className="grid gap-4 md:grid-cols-2 bg-gray-950/50 rounded-xl border border-gray-950 p-4">
                  <div className="text-sm space-y-1.5 text-gray-400 border-r border-gray-900 pr-4">
                    <p className="flex justify-between">Ara Toplam: <span className="text-white font-semibold">{Number(activeOrder.totalAmount).toFixed(2)} TL</span></p>
                    <p className="flex justify-between">Uygulanan İndirim: <span className="text-red-400 font-semibold">- {Number(activeOrder.discount).toFixed(2)} TL</span></p>
                    <div className="flex justify-between text-base font-bold text-white border-t border-gray-900 pt-1.5 mt-1.5">
                      <span>Kalan Tutar:</span>
                      <span className="text-indigo-400">{getRemainingAmount(activeOrder).toFixed(2)} TL</span>
                    </div>
                  </div>

                  <div className="space-y-3 pl-2">
                    <label className="text-xs font-bold text-gray-400 block">İndirim Uygula</label>
                    <div className="flex gap-2">
                      <select
                        value={discountType}
                        onChange={(e) => setDiscountType(e.target.value as 'AMOUNT' | 'PERCENT')}
                        className="rounded-lg border border-gray-800 bg-gray-950 px-2 py-1.5 text-xs text-white focus:outline-none"
                      >
                        <option value="AMOUNT">TL</option>
                        <option value="PERCENT">%</option>
                      </select>
                      <input
                        type="number"
                        placeholder={discountType === 'AMOUNT' ? 'Tutar' : 'Oran'}
                        value={discountValue}
                        onChange={(e) => setDiscountValue(e.target.value)}
                        className="flex-1 rounded-lg border border-gray-800 bg-gray-950 px-3 py-1.5 text-white text-xs focus:outline-none"
                      />
                      <button
                        onClick={handleApplyDiscount}
                        className="rounded-lg bg-indigo-600 hover:bg-indigo-500 px-3 py-1.5 text-xs font-bold text-white transition-colors"
                      >
                        Uygula
                      </button>
                    </div>
                  </div>
                </div>

                {/* 3. KISIM: Ödeme Yöntemi */}
                <div className="space-y-3">
                  <label className="text-xs font-bold text-gray-400 block">Ödeme Yöntemi Seçin</label>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      onClick={() => setPaymentMethod('CASH')}
                      className={`flex flex-col items-center justify-center gap-1.5 p-3 rounded-lg border text-xs font-bold transition-all ${
                        paymentMethod === 'CASH'
                          ? 'border-emerald-600 bg-emerald-950/20 text-emerald-400'
                          : 'border-gray-800 bg-gray-900/20 text-gray-500 hover:text-white'
                      }`}
                    >
                      <DollarSign className="h-4 w-4" />
                      Nakit
                    </button>
                    <button
                      onClick={() => setPaymentMethod('CREDIT_CARD')}
                      className={`flex flex-col items-center justify-center gap-1.5 p-3 rounded-lg border text-xs font-bold transition-all ${
                        paymentMethod === 'CREDIT_CARD'
                          ? 'border-emerald-600 bg-emerald-950/20 text-emerald-400'
                          : 'border-gray-800 bg-gray-900/20 text-gray-500 hover:text-white'
                      }`}
                    >
                      <Landmark className="h-4 w-4" />
                      Kart
                    </button>
                    <button
                      onClick={() => setPaymentMethod('OPEN_ACCOUNT')}
                      className={`flex flex-col items-center justify-center gap-1.5 p-3 rounded-lg border text-xs font-bold transition-all ${
                        paymentMethod === 'OPEN_ACCOUNT'
                          ? 'border-emerald-600 bg-emerald-950/20 text-emerald-400'
                          : 'border-gray-800 bg-gray-900/20 text-gray-500 hover:text-white'
                      }`}
                    >
                      <Wallet className="h-4 w-4" />
                      Veresiye
                    </button>
                  </div>
                </div>

                {/* 4. KISIM: Tahsilat Seçenekleri, Masa Taşıma ve Masa Ayırma Aksiyonları */}
                <div className="grid gap-3 pt-2 border-t border-gray-800">
                  {getSelectedItemsTotal() > 0 && (
                    <button
                      onClick={handlePaySelectedItems}
                      className="w-full flex items-center justify-center gap-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 px-4 py-3 text-sm font-bold text-white transition-colors"
                    >
                      Seçilen Ürünlerin Ödemesini Al ({getSelectedItemsTotal().toFixed(2)} TL)
                    </button>
                  )}

                  <div className="flex gap-2">
                    <input
                      type="number"
                      placeholder="Elle Kısmi Ödeme Tutarı..."
                      value={customAmount}
                      onChange={(e) => setCustomAmount(e.target.value)}
                      className="flex-1 rounded-lg border border-gray-800 bg-gray-950 px-3 py-2 text-white text-sm focus:outline-none"
                    />
                    <button
                      disabled={!customAmount}
                      onClick={handlePayCustomAmount}
                      className="rounded-lg bg-gray-800 hover:bg-gray-700 border border-gray-700 px-4 py-2 text-sm font-bold text-white transition-colors disabled:opacity-50"
                    >
                      Kısmi Ödeme Al
                    </button>
                  </div>

                  <button
                    onClick={async () => {
                      if (!activeOrder) return;
                      const remaining = getRemainingAmount(activeOrder);
                      try {
                        await api.post(`/orders/${activeOrder.id}/pay-amount`, {
                          paymentMethod,
                          amount: remaining,
                        });
                        alert(`Kalan ${remaining.toFixed(2)} TL tahsil edildi. Masa kapatıldı.`);
                        setSelectedTable(null);
                        void fetchTables();
                      } catch (error) {
                        console.error('Masa kapatılamadı:', error);
                      }
                    }}
                    className="w-full flex items-center justify-center gap-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 px-4 py-3 text-sm font-bold text-white transition-colors"
                  >
                    Kalan Hesabın Tamamını Tahsil Et & Kapat ({getRemainingAmount(activeOrder).toFixed(2)} TL)
                  </button>

                  <div className="grid grid-cols-2 gap-2 mt-1">
                    <button
                      onClick={() => {
                        setTransferType('MOVE');
                        setIsTransferModalOpen(true);
                      }}
                      className="flex items-center justify-center gap-2 rounded-lg bg-gray-950 hover:bg-gray-900 border border-gray-800 py-2.5 text-xs font-bold text-gray-400 transition-all"
                    >
                      <Merge className="h-4 w-4 shrink-0" />
                      Masa Taşı / Birleştir
                    </button>
                    <button
                      onClick={() => {
                        const itemsPayload = Object.keys(selectedItemQuantities).filter((key) => selectedItemQuantities[key] > 0);
                        if (itemsPayload.length === 0) {
                          alert('Lütfen önce yukarıdaki sayaçlardan ayrılacak ürünleri seçin.');
                          return;
                        }
                        setTransferType('SPLIT');
                        setIsTransferModalOpen(true);
                      }}
                      className="flex items-center justify-center gap-2 rounded-lg bg-gray-950 hover:bg-gray-900 border border-gray-800 py-2.5 text-xs font-bold text-gray-400 transition-all"
                    >
                      <RefreshCcw className="h-4 w-4 shrink-0" />
                      Adisyon Ayır / Aktar
                    </button>
                  </div>

                  {selectedTable.status !== 'BILL_REQUESTED' && (
                    <button
                      onClick={handlePrintBill}
                      className="w-full flex items-center justify-center gap-2 rounded-lg bg-gray-950 hover:bg-gray-900 border border-gray-800 px-4 py-2 text-xs font-semibold text-gray-400 transition-colors"
                    >
                      <Printer className="h-4 w-4" />
                      Hesap Adisyonu Çıkar (Masa Durumunu &quot;Hesap İstendi&quot; Yapar)
                    </button>
                  )}
                </div>
              </div>
            ) : (
              <div className="py-12 text-center text-gray-500 text-sm">
                Adisyon detayı bulunamadı.
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAŞIMA, BİRLEŞTİRME VE AYIRMA İÇİN HEDEF MASA SEÇİM MODALI */}
      {isTransferModalOpen && selectedTable && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm overflow-y-auto">
          <div className="w-full max-w-xl rounded-2xl border border-gray-800 bg-gray-950 p-6 shadow-2xl space-y-4 my-8">
            <div className="flex items-center justify-between border-b border-gray-900 pb-3">
              <div>
                <h3 className="text-lg font-bold text-white">
                  {transferType === 'MOVE' ? 'Masa Taşıma ve Birleştirme' : 'Adisyon Ayırma ve Aktarma'}
                </h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  {transferType === 'MOVE' 
                    ? `Masa ${selectedTable.name} adisyonunun tamamı hangi masaya taşınsın?` 
                    : `Seçilen ürünler hangi masaya aktarılsın?`}
                </p>
              </div>
              <button
                onClick={() => setIsTransferModalOpen(false)}
                className="text-gray-500 hover:text-white transition-colors"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            {/* Şubedeki Diğer Masaların Listesi (Hedef Seçmek İçin) */}
            <div className="space-y-6 max-h-96 overflow-y-auto pr-1">
              {sections.map((section) => (
                <div key={section.id} className="space-y-3">
                  <h4 className="text-xs font-bold text-gray-500 border-b border-gray-900 pb-1">{section.name}</h4>
                  <div className="grid grid-cols-3 gap-2">
                    {section.tables
                      .filter((t) => t.id !== selectedTable.id) // Kendisini hedef seçemez
                      .map((t) => {
                        const style = getStatusStyle(t.status);
                        return (
                          <div
                            key={t.id}
                            onClick={() => {
                              if (transferType === 'MOVE') {
                                void handleMoveOrMergeTable(t.id);
                              } else {
                                void handleSplitAndTransfer(t.id);
                              }
                            }}
                            className={`rounded-lg border p-3 cursor-pointer hover:border-indigo-500 transition-colors text-center ${style.bg}`}
                          >
                            <p className="font-bold text-sm text-white">{t.name}</p>
                            <p className="text-xxs text-gray-500 mt-0.5">
                              {t.status === 'IDLE' ? 'Boş' : 'Dolu (Birleştir)'}
                            </p>
                          </div>
                        );
                      })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}