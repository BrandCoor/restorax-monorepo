'use client';

import React, { useEffect, useState } from 'react';
import { useAuthStore } from '@/store/authStore';
import api from '@/services/api';
import PageHeader from '@/components/PageHeader';

export default function SettingsPage() {
  const { user } = useAuthStore();
  const [restaurant, setRestaurant] = useState<{ name: string; subdomain: string; logoUrl?: string } | null>(null);
  const [branch, setBranch] = useState<{ name: string; address?: string; phone?: string } | null>(null);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    if (!user?.restaurantId || !user?.branchId) {
      setLoading(false);
      return;
    }

    void (async () => {
      setLoading(true);
      try {
        const [r, b] = await Promise.all([
          api.get(`/restaurants/${user.restaurantId}`),
          api.get(`/restaurants/branches/${user.branchId}`),
        ]);
        setRestaurant(r.data);
        setBranch(b.data);
        setMessage(null);
      } catch (e) {
        console.error(e);
        setMessage({ text: 'Ayarlar yüklenirken bir sorun oluştu.', type: 'error' });
      } finally {
        setLoading(false);
      }
    })();
  }, [user]);

  const save = async () => {
    if (!user?.restaurantId || !user?.branchId || !restaurant || !branch) return;
    setSaving(true);
    setMessage(null);
    try {
      await Promise.all([
        api.patch(`/restaurants/${user.restaurantId}`, {
          name: restaurant.name,
          subdomain: restaurant.subdomain,
          logoUrl: restaurant.logoUrl,
        }),
        api.patch(`/restaurants/branches/${user.branchId}`, {
          name: branch.name,
          address: branch.address,
          phone: branch.phone,
        }),
      ]);
      setMessage({ text: 'Ayarlar başarıyla kaydedildi.', type: 'success' });
    } catch (e) {
      console.error(e);
      setMessage({ text: 'Ayarlar kaydedilirken bir hata oluştu.', type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  if (loading || !restaurant || !branch) {
    return (
      <div className="rounded-2xl border border-white/10 bg-slate-900/70 p-8 text-sm text-gray-400">
        Yükleniyor...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Ayarlar" description="Restoran ve şube bilgilerinizi yönetin" />

      {message && (
        <div className={`rounded-xl border px-4 py-3 text-sm ${message.type === 'success' ? 'border-emerald-900/60 bg-emerald-950/20 text-emerald-200' : 'border-red-900/60 bg-red-950/20 text-red-200'}`}>
          {message.text}
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-2xl border border-white/10 bg-slate-900/70 p-6 space-y-4">
          <div>
            <h2 className="text-lg font-bold text-white">Restoran Bilgileri</h2>
            <p className="mt-1 text-sm text-gray-500">Marka ve kurumsal görünüm bilgilerini güncelleyin.</p>
          </div>
          <label className="block text-sm text-gray-400">
            <span className="mb-1 block">Restoran Adı</span>
            <input
              value={restaurant.name}
              onChange={(e) => setRestaurant({ ...restaurant, name: e.target.value })}
              className="w-full rounded-lg border border-gray-800 bg-gray-950 px-4 py-2.5 text-sm text-white"
            />
          </label>
          <label className="block text-sm text-gray-400">
            <span className="mb-1 block">Alt Alan Adı (subdomain)</span>
            <input
              value={restaurant.subdomain}
              onChange={(e) => setRestaurant({ ...restaurant, subdomain: e.target.value })}
              className="w-full rounded-lg border border-gray-800 bg-gray-950 px-4 py-2.5 text-sm text-white"
            />
          </label>
          <label className="block text-sm text-gray-400">
            <span className="mb-1 block">Logo URL</span>
            <input
              value={restaurant.logoUrl || ''}
              onChange={(e) => setRestaurant({ ...restaurant, logoUrl: e.target.value })}
              className="w-full rounded-lg border border-gray-800 bg-gray-950 px-4 py-2.5 text-sm text-white"
            />
          </label>
        </section>

        <section className="rounded-2xl border border-white/10 bg-slate-900/70 p-6 space-y-4">
          <div>
            <h2 className="text-lg font-bold text-white">Şube Bilgileri</h2>
            <p className="mt-1 text-sm text-gray-500">Şube iletişim ve konum bilgilerini güncelleyin.</p>
          </div>
          <label className="block text-sm text-gray-400">
            <span className="mb-1 block">Şube Adı</span>
            <input
              value={branch.name}
              onChange={(e) => setBranch({ ...branch, name: e.target.value })}
              className="w-full rounded-lg border border-gray-800 bg-gray-950 px-4 py-2.5 text-sm text-white"
            />
          </label>
          <label className="block text-sm text-gray-400">
            <span className="mb-1 block">Adres</span>
            <textarea
              value={branch.address || ''}
              onChange={(e) => setBranch({ ...branch, address: e.target.value })}
              rows={3}
              className="w-full rounded-lg border border-gray-800 bg-gray-950 px-4 py-2.5 text-sm text-white"
            />
          </label>
          <label className="block text-sm text-gray-400">
            <span className="mb-1 block">Telefon</span>
            <input
              value={branch.phone || ''}
              onChange={(e) => setBranch({ ...branch, phone: e.target.value })}
              className="w-full rounded-lg border border-gray-800 bg-gray-950 px-4 py-2.5 text-sm text-white"
            />
          </label>
        </section>
      </div>

      <button
        onClick={() => void save()}
        disabled={saving}
        className="rounded-xl bg-indigo-600 px-6 py-2.5 text-sm font-bold text-white transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {saving ? 'Kaydediliyor...' : 'Kaydet'}
      </button>
    </div>
  );
}
