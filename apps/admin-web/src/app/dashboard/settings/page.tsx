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

  useEffect(() => {
    if (!user?.restaurantId || !user?.branchId) return;
    void (async () => {
      try {
        const [r, b] = await Promise.all([
          api.get(`/restaurants/${user.restaurantId}`),
          api.get(`/restaurants/branches/${user.branchId}`),
        ]);
        setRestaurant(r.data);
        setBranch(b.data);
      } catch (e) {
        console.error(e);
      }
    })();
  }, [user]);

  const save = async () => {
    if (!user?.restaurantId || !user?.branchId || !restaurant || !branch) return;
    setSaving(true);
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
      alert('Ayarlar kaydedildi.');
    } finally {
      setSaving(false);
    }
  };

  if (!restaurant || !branch) {
    return <p className="text-gray-500">Yükleniyor...</p>;
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <PageHeader title="Ayarlar" description="Restoran ve şube bilgilerinizi yönetin" />

      <section className="rounded-xl border border-gray-900 bg-gray-900/40 p-6 space-y-4">
        <h2 className="font-bold text-white">Restoran Bilgileri</h2>
        <label className="block text-sm text-gray-400">Restoran Adı</label>
        <input
          value={restaurant.name}
          onChange={(e) => setRestaurant({ ...restaurant, name: e.target.value })}
          className="w-full rounded-lg border border-gray-800 bg-gray-950 px-4 py-2 text-white text-sm"
        />
        <label className="block text-sm text-gray-400">Alt Alan Adı (subdomain)</label>
        <input
          value={restaurant.subdomain}
          onChange={(e) => setRestaurant({ ...restaurant, subdomain: e.target.value })}
          className="w-full rounded-lg border border-gray-800 bg-gray-950 px-4 py-2 text-white text-sm"
        />
        <label className="block text-sm text-gray-400">Logo URL</label>
        <input
          value={restaurant.logoUrl || ''}
          onChange={(e) => setRestaurant({ ...restaurant, logoUrl: e.target.value })}
          className="w-full rounded-lg border border-gray-800 bg-gray-950 px-4 py-2 text-white text-sm"
        />
      </section>

      <section className="rounded-xl border border-gray-900 bg-gray-900/40 p-6 space-y-4">
        <h2 className="font-bold text-white">Şube Bilgileri</h2>
        <label className="block text-sm text-gray-400">Şube Adı</label>
        <input
          value={branch.name}
          onChange={(e) => setBranch({ ...branch, name: e.target.value })}
          className="w-full rounded-lg border border-gray-800 bg-gray-950 px-4 py-2 text-white text-sm"
        />
        <label className="block text-sm text-gray-400">Adres</label>
        <textarea
          value={branch.address || ''}
          onChange={(e) => setBranch({ ...branch, address: e.target.value })}
          rows={3}
          className="w-full rounded-lg border border-gray-800 bg-gray-950 px-4 py-2 text-white text-sm"
        />
        <label className="block text-sm text-gray-400">Telefon</label>
        <input
          value={branch.phone || ''}
          onChange={(e) => setBranch({ ...branch, phone: e.target.value })}
          className="w-full rounded-lg border border-gray-800 bg-gray-950 px-4 py-2 text-white text-sm"
        />
      </section>

      <button
        onClick={() => void save()}
        disabled={saving}
        className="px-6 py-2.5 rounded-lg bg-indigo-600 font-bold text-sm disabled:opacity-50"
      >
        {saving ? 'Kaydediliyor...' : 'Kaydet'}
      </button>
    </div>
  );
}
