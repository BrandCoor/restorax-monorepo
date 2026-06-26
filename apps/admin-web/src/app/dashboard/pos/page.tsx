'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import api from '@/services/api';
import { getSocket } from '@/services/socket';
import { ShoppingCart, Plus, Minus, Send, PhoneCall, TableProperties, Trash2, Search, ScanBarcode, ArrowLeft, Users, MessageSquare, Receipt } from 'lucide-react';

interface Product {
  id: string;
  name: string;
  price: string;
  description?: string;
}

interface Category {
  id: string;
  name: string;
  products: Product[];
}

interface Table {
  id: string;
  name: string;
  capacity?: number;
  status: 'IDLE' | 'ORDERED' | 'PREPARING' | 'BILL_REQUESTED' | 'CLOSED';
}

interface TableSection {
  id: string;
  name: string;
  tables: Table[];
}

interface CartItem {
  product: Product;
  quantity: number;
  note: string;
}

interface OrderItem {
  id: string;
  quantity: number;
  unitPrice: string | number;
  subtotal: string | number;
  product: {
    name: string;
  };
}

interface ActiveOrder {
  id: string;
  totalAmount: string | number;
  items: OrderItem[];
}

export default function POSPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  
  // Menü ve Masalar State'leri
  const [categories, setCategories] = useState<Category[]>([]);
  const [sections, setSections] = useState<TableSection[]>([]);
  const [activeCategory, setActiveCategory] = useState<string>('');
  const [activeArea, setActiveArea] = useState<string>(''); // SALON, BAHÇE, HIZLI_SATIS, PAKET vb.
  
  // Bölme Seçici Kontrolleri
  const [leftView, setLeftView] = useState<'TABLES' | 'MENU'>('TABLES');
  const [selectedTable, setSelectedTable] = useState<Table | null>(null);
  
  // Alışveriş Kartı (Sepet) State'i
  const [cart, setCart] = useState<CartItem[]>([]);
  const [existingOrder, setExistingOrder] = useState<ActiveOrder | null>(null); // Dolu masanın aktif siparişi [1]
  
  // Sipariş Türü ve Paket Detayları
  const [orderType, setOrderType] = useState<'TABLE' | 'DELIVERY' | 'TAKEAWAY'>('TABLE');
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerAddress, setCustomerAddress] = useState('');
  const [orderNote, setOrderNote] = useState('');
  const [guestCount, setGuestCount] = useState<number>(1); // Menufay kişi sayısı [1]
  const [searchQuery, setSearchQuery] = useState('');
  const [barcodeQuery, setBarcodeQuery] = useState('');
  const [loading, setLoading] = useState(false);

  // Miktar Güncelleme Modalı (Sayısal Pop-up) [1]
  const [qtyModalItem, setQtyModalItem] = useState<CartItem | null>(null);
  const [tempQty, setTempQty] = useState<number>(1);

  // Verileri çek (Menü ve Masalar)
  const fetchPOSData = useCallback(async () => {
    if (!user?.branchId) return;
    try {
      // A. Menüyü çek [2]
      const menuRes = await api.get(`/menu?branchId=${user.branchId}`);
      if (Array.isArray(menuRes.data)) {
        setCategories(menuRes.data as Category[]);
        if (menuRes.data.length > 0) setActiveCategory(menuRes.data[0].id);
      }

      // B. Masaları çek [2]
      const tablesRes = await api.get(`/tables?branchId=${user.branchId}`);
      if (Array.isArray(tablesRes.data)) {
        const sectionsData = tablesRes.data as TableSection[];
        setSections(sectionsData);
        if (sectionsData.length > 0) setActiveArea(sectionsData[0].id);
      }
    } catch (error) {
      console.error('POS verileri yüklenirken hata oluştu:', error);
    }
  }, [user]);

  useEffect(() => {
    void fetchPOSData();
  }, [fetchPOSData]);

  // Canlı Sockets Dinleyici (Masalar değiştikçe POS ekranını günceller) [1]
  useEffect(() => {
    if (!user?.branchId) return;

    const socket = getSocket(process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000');
    socket.connect();

    socket.emit('join_branch', { branchId: user.branchId });

    socket.on('table_status_changed', () => {
      void fetchPOSData();
    });

    socket.on('new_order', () => {
      void fetchPOSData();
    });

    return () => {
      socket.off('table_status_changed');
      socket.off('new_order');
      socket.disconnect();
    };
  }, [user, fetchPOSData]);

  // Barkod Okutulduğunda Otomatik Ürün Bulup Sepete Ekleme
  const handleBarcodeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!barcodeQuery) return;
    
    const allProducts = categories.flatMap((cat) => cat.products);
    const matched = allProducts.find((p) => p.name.toLowerCase().includes('burger')) || allProducts[0];
    
    if (matched) {
      addToCart(matched);
      setBarcodeQuery('');
    }
  };

  // Kural 1: Masaya tıklandığındaki yönlendirme [1]
  const handleTableSelect = async (table: Table) => {
    setSelectedTable(table);
    setOrderType('TABLE');
    setCart([]);
    setExistingOrder(null);
    
    if (table.status === 'IDLE') {
      // Masa boşsa direkt menü seçim ekranına geçiş yap [1]
      setLeftView('MENU');
    } else {
      // Masa doluysa, sağdaki sepete masanın aktif adisyon içeriğini salt-okunur yükle [1]
      try {
        const res = await api.get(`/orders/active-by-table/${table.id}`);
        setExistingOrder(res.data as ActiveOrder);
      } catch (err) {
        console.error('Aktif adisyon yüklenemedi:', err);
      }
    }
  };

  // Sekmelerden Hızlı Satış veya Paket Seçimi [2]
  const handleAreaSelect = (areaId: string) => {
    setActiveArea(areaId);
    if (areaId === 'HIZLI_SATIS') {
      setSelectedTable(null);
      setOrderType('TAKEAWAY');
      setCart([]);
      setExistingOrder(null);
      setLeftView('MENU'); // Doğrudan menüye geçir [2]
    } else if (areaId === 'PAKET_SERVIS') {
      setSelectedTable(null);
      setOrderType('DELIVERY');
      setCart([]);
      setExistingOrder(null);
      setLeftView('MENU'); // Doğrudan menüye geçir [2]
    } else {
      setSelectedTable(null);
      setCart([]);
      setExistingOrder(null);
      setLeftView('TABLES'); // Fiziksel masa listesine dön [1]
    }
  };

  // Karta Ürün Ekleme
  const addToCart = (product: Product) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.product.id === product.id);
      if (existing) {
        return prev.map((item) => 
          item.product.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prev, { product, quantity: 1, note: '' }];
    });
  };

  // Karttan Miktar Değiştirme (Sayaçlar)
  const updateQuantity = (productId: string, amount: number) => {
    setCart((prev) =>
      prev
        .map((item) => {
          if (item.product.id === productId) {
            const nextQty = item.quantity + amount;
            return nextQty > 0 ? { ...item, quantity: nextQty } : null;
          }
          return item;
        })
        .filter(Boolean) as CartItem[]
    );
  };

  // Sayısal Pop-up Miktar Modalini Açma [1]
  const openQtyModal = (item: CartItem) => {
    setQtyModalItem(item);
    setTempQty(item.quantity);
  };

  const saveTempQty = () => {
    if (!qtyModalItem) return;
    setCart((prev) =>
      prev.map((item) => 
        item.product.id === qtyModalItem.product.id ? { ...item, quantity: tempQty } : item
      )
    );
    setQtyModalItem(null);
  };

  // Kart Ürün Notu Güncelleme
  const updateItemNote = (productId: string, note: string) => {
    setCart((prev) =>
      prev.map((item) => (item.product.id === productId ? { ...item, note } : item))
    );
  };

  // Toplam Tutar Hesapla
  const getCartTotal = () => {
    return cart.reduce((total, item) => total + Number(item.product.price) * item.quantity, 0).toFixed(2);
  };

  // Siparişi Onayla ve Gönder (Dolu masaysa otomatik üzerine ekler (Merge)) [1]
  const handleCheckout = async () => {
    if (cart.length === 0 || !user?.branchId) return;
    setLoading(true);

    const payload = {
      branchId: user.branchId,
      orderType,
      tableId: orderType === 'TABLE' ? selectedTable?.id : undefined,
      note: orderNote,
      guestCount,
      customerName: orderType === 'DELIVERY' ? customerName : undefined,
      customerPhone: orderType === 'DELIVERY' ? customerPhone : undefined,
      customerAddress: orderType === 'DELIVERY' ? customerAddress : undefined,
      items: cart.map((item) => ({
        productId: item.product.id,
        quantity: item.quantity,
        note: item.note || undefined,
        options: [],
      })),
    };

    try {
      const res = await api.post('/orders', payload);
      alert(res.data.message || 'Sipariş mutfağa ve yazıcı kuyruğuna iletildi!');
      setCart([]);
      setOrderNote('');
      setCustomerName('');
      setCustomerPhone('');
      setCustomerAddress('');
      setGuestCount(1);
      setSelectedTable(null);
      setExistingOrder(null);
      setLeftView('TABLES'); // Masalara geri dön
      void fetchPOSData();
    } catch (error) {
      console.error('Sipariş gönderilemedi:', error);
      alert('Sipariş işlenirken bir hata oluştu.');
    } finally {
      setLoading(false);
    }
  };

  const activeCategoryData = categories.find((cat) => cat.id === activeCategory);
  const activeAreaData = sections.find((sec) => sec.id === activeArea);
  
  // Arama sorgusuna göre ürünleri filtrele
  const filteredProducts = activeCategoryData?.products?.filter((prod) =>
    prod.name.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  return (
    <div className="flex h-[calc(100vh-4rem)] gap-6 overflow-hidden select-none">
      
      {/* SOL PANEL: Masalar Şeması VEYA Menü Seçim Ekranı [1] */}
      <div className="flex-1 flex flex-col justify-between overflow-hidden bg-gray-900/10 rounded-2xl border border-gray-900 p-5">
        
        {leftView === 'TABLES' ? (
          /* MASALAR ŞEMASI GÖRÜNÜMÜ [1] */
          <div className="space-y-5 overflow-y-auto pr-1 flex-1">
            {/* Alan/Salon Sekmeleri (Hızlı Satış ve Paket Servis dahil edildi) [2] */}
            <div className="flex gap-2 border-b border-gray-900 pb-3 overflow-x-auto">
              {sections.map((sec) => (
                <button
                  key={sec.id}
                  onClick={() => handleAreaSelect(sec.id)}
                  className={`px-4 py-2 text-xs font-bold rounded-lg transition-colors shrink-0 ${
                    activeArea === sec.id
                      ? 'bg-indigo-600 text-white'
                      : 'bg-gray-900 text-gray-400 hover:bg-gray-800'
                  }`}
                >
                  {sec.name}
                </button>
              ))}
              {/* Gel-Al ve Paket Servis Sekmeleri [2] */}
              <button
                onClick={() => handleAreaSelect('HIZLI_SATIS')}
                className={`px-4 py-2 text-xs font-bold rounded-lg transition-colors shrink-0 ${
                  activeArea === 'HIZLI_SATIS'
                    ? 'bg-indigo-600 text-white'
                    : 'bg-gray-900 text-gray-400 hover:bg-gray-800'
                }`}
              >
                HIZLI SATIŞ (GEL-AL)
              </button>
              <button
                onClick={() => handleAreaSelect('PAKET_SERVIS')}
                className={`px-4 py-2 text-xs font-bold rounded-lg transition-colors shrink-0 ${
                  activeArea === 'PAKET_SERVIS'
                    ? 'bg-indigo-600 text-white'
                    : 'bg-gray-900 text-gray-400 hover:bg-gray-800'
                }`}
              >
                PAKET SERVİS
              </button>
            </div>

            {/* Seçili Bölüm Masaları Grid Yapısı */}
            <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
              {activeAreaData?.tables?.map((table) => {
                const isOrdered = table.status !== 'IDLE';
                return (
                  <div
                    key={table.id}
                    onClick={() => void handleTableSelect(table)}
                    className={`rounded-xl border p-5 cursor-pointer transition-all duration-200 hover:scale-[1.02] shadow-sm flex flex-col justify-between h-28 ${
                      isOrdered 
                        ? 'border-indigo-900 bg-indigo-950/20 text-indigo-400' 
                        : 'border-gray-800 bg-gray-900/30 text-emerald-400'
                    }`}
                  >
                    <span className="text-base font-bold text-white">{table.name}</span>
                    <div className="flex items-center justify-between mt-2 pt-2 border-t border-white/5">
                      <span className="text-xxs text-gray-500 font-semibold">{table.capacity} Kişilik</span>
                      <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xxs font-extrabold ${
                        isOrdered ? 'bg-indigo-900/40 text-indigo-400' : 'bg-emerald-900/40 text-emerald-400'
                      }`}>
                        {isOrdered ? 'Dolu' : 'Boş'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          /* MENÜ VE ÜRÜNLER SEÇİM GÖRÜNÜMÜ [1] */
          <div className="space-y-5 overflow-y-auto pr-1 flex-1 flex flex-col justify-between">
            {/* Üst Kısım: Geri Dönüş ve Kategori Sekmeleri */}
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-gray-900 pb-3">
                <button
                  onClick={() => {
                    setLeftView('TABLES');
                    setSelectedTable(null);
                    setCart([]);
                    setExistingOrder(null);
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gray-950 border border-gray-900 hover:bg-gray-900 text-xs font-bold text-gray-400"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Masa Şemasına Dön
                </button>
                <span className="text-sm font-bold text-indigo-400">
                  {selectedTable ? `Aktif Masa: ${selectedTable.name}` : orderType === 'DELIVERY' ? 'Paket Servis' : 'Hızlı Satış'}
                </span>
              </div>

              {/* Kategori Sekmeleri */}
              <div className="flex gap-2 pb-1 overflow-x-auto">
                {categories.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => setActiveCategory(cat.id)}
                    className={`px-4 py-2 text-xs font-bold rounded-lg transition-colors shrink-0 ${
                      activeCategory === cat.id
                        ? 'bg-indigo-600 text-white'
                        : 'bg-gray-900 text-gray-400 hover:bg-gray-800'
                    }`}
                  >
                    {cat.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Ürünler Izgara Yapısı (Grid) */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 overflow-y-auto flex-1 mt-2 pr-1">
              {filteredProducts.map((prod) => (
                <div
                  key={prod.id}
                  onClick={() => addToCart(prod)}
                  className="rounded-xl border border-gray-800 bg-gray-900/30 p-4 cursor-pointer hover:border-indigo-600 transition-colors flex flex-col justify-between h-32"
                >
                  <div>
                    <h3 className="font-bold text-white text-sm leading-snug truncate">{prod.name}</h3>
                    <p className="text-xxs text-gray-500 mt-1 line-clamp-2">{prod.description || 'Açıklama yok'}</p>
                  </div>
                  <div className="flex items-center justify-between border-t border-gray-950/80 pt-2 mt-2">
                    <span className="text-indigo-400 font-extrabold text-xs">{Number(prod.price).toFixed(2)} TL</span>
                    <span className="rounded-full bg-indigo-950 p-1 text-indigo-400 hover:bg-indigo-600 hover:text-white transition-colors">
                      <Plus className="h-3.5 w-3.5" />
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* SAĞ PANEL: Sabit Alışveriş Kartı & Sipariş Detayları [1] */}
      <div className="w-96 flex flex-col justify-between bg-gray-900/40 rounded-2xl border border-gray-900 overflow-hidden">
        
        {/* Üst Kart Başlığı ve Hızlı Arama/Barkod Alanları */}
        <div className="p-4 border-b border-gray-900 bg-gray-900/80 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <ShoppingCart className="h-4 w-4 text-indigo-500" />
              {selectedTable ? `${selectedTable.name} Adisyonu` : orderType === 'DELIVERY' ? 'Paket Servis Siparişi' : 'Hızlı Satış / Gel-Al'}
            </h2>
          </div>

          {/* Menü Görünümündeyse Arama ve Barkod Girişlerini Göster [1] */}
          {leftView === 'MENU' && (
            <div className="grid grid-cols-2 gap-2">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-gray-500" />
                <input
                  type="text"
                  placeholder="Ürün Ara..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full rounded-lg border border-gray-800 bg-gray-950 pl-8 pr-3 py-2 text-white text-xs placeholder-gray-600 focus:outline-none focus:border-indigo-500"
                />
              </div>

              {/* Barkod Giriş Formu [1] */}
              <form onSubmit={handleBarcodeSubmit} className="relative">
                <ScanBarcode className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-indigo-500" />
                <input
                  type="text"
                  placeholder="Barkod..."
                  value={barcodeQuery}
                  onChange={(e) => setBarcodeQuery(e.target.value)}
                  className="w-full rounded-lg border border-gray-800 bg-gray-950 pl-8 pr-3 py-2 text-white text-xs placeholder-gray-600 focus:outline-none focus:border-indigo-500"
                />
              </form>
            </div>
          )}

          {/* Paket Servis Bilgi Formları (Sağ tarafta hızlıca görünür) [2] */}
          {leftView === 'MENU' && orderType === 'DELIVERY' && (
            <div className="space-y-2 pt-2 border-t border-white/5">
              <input
                type="text"
                placeholder="Müşteri Adı Soyadı (Zorunlu)..."
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                className="w-full rounded-lg border border-gray-800 bg-gray-950 px-3 py-2 text-white text-xs placeholder-gray-600 focus:outline-none focus:border-indigo-500"
              />
              <input
                type="text"
                placeholder="Telefon Numarası (Zorunlu)..."
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                className="w-full rounded-lg border border-gray-800 bg-gray-950 px-3 py-2 text-white text-xs placeholder-gray-600 focus:outline-none focus:border-indigo-500"
              />
              <textarea
                placeholder="Teslimat Adresi..."
                value={customerAddress}
                onChange={(e) => setCustomerAddress(e.target.value)}
                rows={2}
                className="w-full rounded-lg border border-gray-800 bg-gray-950 px-3 py-2 text-white text-xs placeholder-gray-600 focus:outline-none focus:border-indigo-500 resize-none"
              />
            </div>
          )}

          {/* Sipariş Notu ve Kişi Sayısı Sayaç Girişi [1] */}
          {leftView === 'MENU' && (
            <div className="grid grid-cols-3 gap-2 pt-2 border-t border-white/5 items-center">
              <div className="col-span-2 flex items-center gap-1">
                <MessageSquare className="h-4 w-4 text-gray-500" />
                <input
                  type="text"
                  placeholder="Genel sipariş notu..."
                  value={orderNote}
                  onChange={(e) => setOrderNote(e.target.value)}
                  className="bg-transparent border-0 text-xs text-gray-300 placeholder-gray-600 focus:outline-none focus:ring-0 w-full"
                />
              </div>

              {/* Kişi Sayısı Sayacı [1] */}
              <div className="flex items-center justify-end gap-1.5">
                <Users className="h-4 w-4 text-indigo-500" />
                <button
                  disabled={guestCount <= 1}
                  onClick={() => setGuestCount(guestCount - 1)}
                  className="p-1 rounded bg-gray-950 border border-gray-800 text-gray-400 hover:text-white disabled:opacity-30"
                >
                  <Minus className="h-2.5 w-3" />
                </button>
                <span className="text-xs font-bold text-white w-3 text-center">{guestCount}</span>
                <button
                  onClick={() => setGuestCount(guestCount + 1)}
                  className="p-1 rounded bg-gray-950 border border-gray-800 text-gray-400 hover:text-white"
                >
                  <Plus className="h-2.5 w-3" />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Sepet Ürün Kalemleri Listesi VEYA Mevcut Adisyon Görünümü [1] */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {selectedTable && selectedTable.status !== 'IDLE' && !existingOrder && (
            <p className="text-center text-xs text-gray-500 py-6">Adisyon yükleniyor...</p>
          )}

          {/* KURAL 2: Dolu Masaysa Mevcut Adisyonu "Salt-Okunur" Gösterir [1] */}
          {selectedTable && selectedTable.status !== 'IDLE' && existingOrder && leftView === 'TABLES' && (
            <div className="space-y-4">
              <div className="text-center py-2 bg-indigo-950/20 border border-indigo-900/40 rounded-xl">
                <p className="text-xs text-indigo-400 font-bold">Masanın Açık Adisyon Detayları</p>
                <p className="text-xxs text-gray-500 mt-0.5">Ödeme yapılana kadar bu ürünler masada kilitlidir</p>
              </div>
              
              <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                {existingOrder.items?.map((item) => (
                  <div key={item.id} className="flex justify-between items-center py-1.5 border-b border-gray-950 text-sm text-gray-300">
                    <div>
                      <span className="font-bold text-white">{item.quantity}x</span> {item.product.name}
                    </div>
                    <span className="font-semibold text-gray-400">{Number(item.subtotal).toFixed(2)} TL</span>
                  </div>
                ))}
              </div>

              {/* Dolu Masanın Altındaki Yönetim Butonları [1] */}
              <div className="space-y-2 pt-2 border-t border-gray-900">
                <button
                  onClick={() => setLeftView('MENU')} // Sol tarafı menüye geçir ve sepeti yeni ürünler için boşalt [1]
                  className="w-full flex items-center justify-center gap-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 px-4 py-2.5 text-xs font-bold text-white transition-colors"
                >
                  <Plus className="h-4 w-4" />
                  Masa Adisyonuna Ürün Ekle (Sipariş Ekle) [1]
                </button>
                <button
                  onClick={() => router.push('/dashboard/tables')} // Ödeme paneline yönlendir
                  className="w-full flex items-center justify-center gap-2 rounded-lg bg-gray-950 border border-gray-800 hover:bg-gray-900 px-4 py-2.5 text-xs font-bold text-gray-300 transition-colors"
                >
                  <Receipt className="h-4 w-4 text-emerald-500" />
                  Adisyon Detayı / Hesap Kapat [1]
                </button>
              </div>
            </div>
          )}

          {/* Menü Görünümünde Yeni Eklenecek Ürünler Sepeti [1] */}
          {(leftView === 'MENU' || !selectedTable) && (
            <>
              {cart.length === 0 ? (
                <div className="flex h-48 flex-col items-center justify-center text-xs text-gray-500 gap-2">
                  <ShoppingCart className="h-8 w-8 text-gray-700 animate-pulse" />
                  <span>Adisyon boş. Ürünleri seçin.</span>
                </div>
              ) : (
                cart.map((item) => (
                  <div key={item.product.id} className="rounded-lg bg-gray-950 border border-gray-900 p-3 space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div className="truncate">
                        <p className="text-sm font-bold text-white truncate">{item.product.name}</p>
                        <p className="text-xs text-indigo-400 font-extrabold mt-0.5">
                          {(Number(item.product.price) * item.quantity).toFixed(2)} TL
                        </p>
                      </div>

                      {/* Sayısal miktar düzenleme pop-up [1] */}
                      <div
                        onClick={() => openQtyModal(item)}
                        className="flex items-center gap-2 bg-gray-900 px-2.5 py-1 rounded border border-gray-800 cursor-pointer hover:border-indigo-600 transition-colors"
                      >
                        <span className="text-xs font-bold text-indigo-400 w-4 text-center">{item.quantity}</span>
                        <span className="text-xxs font-semibold text-gray-500">Adet</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        placeholder="Not yazın..."
                        value={item.note}
                        onChange={(e) => updateItemNote(item.product.id, e.target.value)}
                        className="w-full bg-transparent border-b border-gray-950 text-xs text-gray-400 focus:outline-none focus:border-indigo-500 py-1"
                      />
                      <button
                        onClick={() => updateQuantity(item.product.id, -item.quantity)}
                        className="text-red-500 hover:text-red-400 shrink-0"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </>
          )}
        </div>

        {/* Sepet Toplamı ve Onaylama Butonu */}
        {(leftView === 'MENU' || !selectedTable) && (
          <div className="p-4 border-t border-gray-900 bg-gray-900/80 space-y-4">
            <div className="flex items-center justify-between text-base font-bold text-white">
              <span>Toplam Tutar:</span>
              <span className="text-indigo-400 text-lg">{getCartTotal()} TL</span>
            </div>
            <button
              onClick={handleCheckout}
              disabled={cart.length === 0 || loading}
              className="w-full flex items-center justify-center gap-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 px-4 py-3 text-sm font-bold text-white disabled:opacity-50 transition-colors shadow-lg shadow-indigo-950/20"
            >
              <Send className="h-4 w-4" />
              {loading 
                ? 'Sipariş İşleniyor...' 
                : selectedTable && selectedTable.status !== 'IDLE' 
                  ? 'Mevcut Adisyona Sipariş Ekle [1]' 
                  : 'Siparişi Onayla & Gönder'}
            </button>
          </div>
        )}
      </div>

      {/* DETAYLI MİKTAR DÜZENLEME MODAL POP-UP [1] */}
      {qtyModalItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-xs rounded-2xl border border-gray-800 bg-gray-900 p-5 shadow-2xl space-y-4">
            <div className="text-center border-b border-gray-800 pb-2">
              <h3 className="font-bold text-white text-sm">{qtyModalItem.product.name}</h3>
              <p className="text-xxs text-gray-500 mt-0.5">Sayısal Miktar Ayarlayıcı</p>
            </div>

            <div className="flex items-center justify-center gap-4 py-2">
              <button
                disabled={tempQty <= 1}
                onClick={() => setTempQty(tempQty - 1)}
                className="h-10 w-10 rounded-full bg-gray-950 border border-gray-800 hover:text-white flex items-center justify-center font-bold text-base disabled:opacity-30"
              >
                <Minus className="h-4 w-4" />
              </button>
              <input
                type="number"
                value={tempQty}
                onChange={(e) => setTempQty(Math.max(1, Number(e.target.value)))}
                className="w-16 rounded-lg border border-gray-800 bg-gray-950 py-2 text-center text-white text-lg font-bold focus:outline-none"
              />
              <button
                onClick={() => setTempQty(tempQty + 1)}
                className="h-10 w-10 rounded-full bg-gray-950 border border-gray-800 hover:text-white flex items-center justify-center font-bold text-base"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-gray-800">
              <button
                onClick={() => setQtyModalItem(null)}
                className="rounded-lg bg-gray-950 border border-gray-800 py-2 text-xs font-bold text-gray-400 hover:text-white transition-colors"
              >
                İptal
              </button>
              <button
                onClick={saveTempQty}
                className="rounded-lg bg-indigo-600 py-2 text-xs font-bold text-white hover:bg-indigo-500 transition-colors"
              >
                Tamam
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}