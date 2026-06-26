'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useAuthStore } from '@/store/authStore';
import api from '@/services/api';
import PageHeader from '@/components/PageHeader';
import { Plus } from 'lucide-react';

interface Printer {
  id: string;
  name: string;
  ipAddress: string;
  port: number;
  department?: string;
  isActive: boolean;
}

export default function PrintersPage() {
  const { user } = useAuthStore();
  const [printers, setPrinters] = useState<Printer[]>([]);
  const [form, setForm] = useState<{ name: string; ipAddress: string; department: string } | null>(null);

  const load = useCallback(async () => {
    if (!user?.branchId) return;
    const res = await api.get(`/printer?branchId=${user.branchId}`);
    setPrinters(res.data);
  }, [user]);

  useEffect(() => {
    void load();
  }, [load]);

  const addPrinter = async () => {
    if (!form || !user?.branchId) return;
    await api.post('/printer', {
      branchId: user.branchId,
      name: form.name,
      ipAddress: form.ipAddress,
      department: form.department,
      port: 9100,
    });
    setForm(null);
    void load();
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Yazıcı Yönetimi"
        description="Mutfak, bar ve kasa yazıcılarını yapılandırın"
        action={
          <button onClick={() => setForm({ name: '', ipAddress: '', department: 'KITCHEN' })} className="px-4 py-2 rounded-lg bg-indigo-600 text-sm font-bold flex items-center gap-1">
            <Plus className="h-4 w-4" /> Yazıcı Ekle
          </button>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {printers.map((p) => (
          <div key={p.id} className="rounded-xl border border-gray-900 bg-gray-900/40 p-5">
            <div className="flex justify-between items-start">
              <h3 className="font-bold text-white">{p.name}</h3>
              <span className={`text-xs px-2 py-0.5 rounded ${p.isActive ? 'bg-emerald-950 text-emerald-400' : 'bg-gray-800 text-gray-500'}`}>
                {p.isActive ? 'Aktif' : 'Pasif'}
              </span>
            </div>
            <p className="text-sm text-gray-400 mt-2">{p.ipAddress}:{p.port}</p>
            <p className="text-xs text-gray-600 mt-1">{p.department || 'Genel'}</p>
          </div>
        ))}
      </div>

      {form && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50">
          <div className="w-full max-w-md rounded-xl border border-gray-800 bg-gray-900 p-6 space-y-3">
            <h3 className="font-bold">Yeni Yazıcı</h3>
            <input placeholder="Yazıcı adı" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full rounded-lg border border-gray-800 bg-gray-950 px-4 py-2 text-white text-sm" />
            <input placeholder="IP Adresi" value={form.ipAddress} onChange={(e) => setForm({ ...form, ipAddress: e.target.value })} className="w-full rounded-lg border border-gray-800 bg-gray-950 px-4 py-2 text-white text-sm" />
            <select value={form.department} onChange={(e) => setForm({ ...form, department: e.target.value })} className="w-full rounded-lg border border-gray-800 bg-gray-950 px-4 py-2 text-white text-sm">
              <option value="KITCHEN">Mutfak</option>
              <option value="BAR">Bar</option>
              <option value="CASHIER">Kasa</option>
            </select>
            <div className="flex gap-2">
              <button onClick={() => void addPrinter()} className="flex-1 py-2 rounded-lg bg-indigo-600 font-bold text-sm">Kaydet</button>
              <button onClick={() => setForm(null)} className="flex-1 py-2 rounded-lg bg-gray-800 text-sm">İptal</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
