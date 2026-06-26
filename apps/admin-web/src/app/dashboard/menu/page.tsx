'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useAuthStore } from '@/store/authStore';
import api from '@/services/api';
import PageHeader from '@/components/PageHeader';
import { Plus, Pencil, Trash2 } from 'lucide-react';

interface Product {
  id: string;
  name: string;
  price: string | number;
  description?: string;
  isActive: boolean;
}

interface Category {
  id: string;
  name: string;
  isActive: boolean;
  products: Product[];
}

export default function MenuManagementPage() {
  const { user } = useAuthStore();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [newCategory, setNewCategory] = useState('');
  const [productForm, setProductForm] = useState<{ categoryId: string; name: string; price: string } | null>(null);

  const load = useCallback(async () => {
    if (!user?.branchId) return;
    try {
      const res = await api.get(`/menu?branchId=${user.branchId}&admin=true`);
      setCategories(res.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    void load();
  }, [load]);

  const addCategory = async () => {
    if (!newCategory.trim() || !user?.branchId) return;
    await api.post('/menu/categories', { branchId: user.branchId, name: newCategory.trim() });
    setNewCategory('');
    void load();
  };

  const addProduct = async () => {
    if (!productForm?.name || !productForm.categoryId) return;
    await api.post('/menu/products', {
      categoryId: productForm.categoryId,
      name: productForm.name,
      price: Number(productForm.price) || 0,
    });
    setProductForm(null);
    void load();
  };

  const toggleProduct = async (id: string, isActive: boolean) => {
    await api.patch(`/menu/products/${id}`, { isActive: !isActive });
    void load();
  };

  const deleteProduct = async (id: string) => {
    if (!confirm('Ürün silinsin mi?')) return;
    await api.delete(`/menu/products/${id}`);
    void load();
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Menü Yönetimi" description="Kategori ve ürünlerinizi düzenleyin" />

      <div className="rounded-xl border border-gray-900 bg-gray-900/40 p-4 flex gap-2">
        <input
          value={newCategory}
          onChange={(e) => setNewCategory(e.target.value)}
          placeholder="Yeni kategori adı"
          className="flex-1 rounded-lg border border-gray-800 bg-gray-950 px-4 py-2 text-sm text-white"
        />
        <button onClick={() => void addCategory()} className="px-4 py-2 rounded-lg bg-indigo-600 text-sm font-bold flex items-center gap-1">
          <Plus className="h-4 w-4" /> Kategori Ekle
        </button>
      </div>

      {loading ? (
        <p className="text-gray-500">Yükleniyor...</p>
      ) : (
        <div className="space-y-6">
          {categories.map((cat) => (
            <div key={cat.id} className="rounded-xl border border-gray-900 bg-gray-900/30 p-5">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-bold text-white">{cat.name}</h2>
                <button
                  onClick={() => setProductForm({ categoryId: cat.id, name: '', price: '' })}
                  className="text-xs px-3 py-1.5 rounded-lg bg-gray-800 hover:bg-gray-700 flex items-center gap-1"
                >
                  <Plus className="h-3 w-3" /> Ürün Ekle
                </button>
              </div>
              <div className="grid gap-2">
                {cat.products?.map((p) => (
                  <div key={p.id} className="flex items-center justify-between rounded-lg bg-gray-950/50 px-4 py-3">
                    <div>
                      <p className="font-semibold text-white">{p.name}</p>
                      <p className="text-sm text-indigo-400">{Number(p.price).toFixed(2)} ₺</p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => void toggleProduct(p.id, p.isActive)}
                        className={`text-xs px-2 py-1 rounded ${p.isActive ? 'bg-emerald-950 text-emerald-400' : 'bg-gray-800 text-gray-500'}`}
                      >
                        {p.isActive ? 'Aktif' : 'Pasif'}
                      </button>
                      <button onClick={() => void deleteProduct(p.id)} className="p-1.5 text-red-400 hover:bg-red-950 rounded">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}
                {!cat.products?.length && <p className="text-sm text-gray-600">Bu kategoride ürün yok.</p>}
              </div>
            </div>
          ))}
        </div>
      )}

      {productForm && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50">
          <div className="w-full max-w-md rounded-xl border border-gray-800 bg-gray-900 p-6 space-y-4">
            <h3 className="font-bold text-white">Yeni Ürün</h3>
            <input
              value={productForm.name}
              onChange={(e) => setProductForm({ ...productForm, name: e.target.value })}
              placeholder="Ürün adı"
              className="w-full rounded-lg border border-gray-800 bg-gray-950 px-4 py-2 text-white text-sm"
            />
            <input
              type="number"
              value={productForm.price}
              onChange={(e) => setProductForm({ ...productForm, price: e.target.value })}
              placeholder="Fiyat (₺)"
              className="w-full rounded-lg border border-gray-800 bg-gray-950 px-4 py-2 text-white text-sm"
            />
            <div className="flex gap-2">
              <button onClick={() => void addProduct()} className="flex-1 py-2 rounded-lg bg-indigo-600 font-bold text-sm">Kaydet</button>
              <button onClick={() => setProductForm(null)} className="flex-1 py-2 rounded-lg bg-gray-800 text-sm">İptal</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
