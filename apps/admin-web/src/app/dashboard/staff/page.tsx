'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useAuthStore } from '@/store/authStore';
import api from '@/services/api';
import PageHeader from '@/components/PageHeader';
import { Plus, Trash2 } from 'lucide-react';

interface Employee {
  id: string;
  salary?: number;
  workingHours?: string;
  user: { firstName: string; lastName: string; email: string; role: { name: string } };
}

export default function StaffPage() {
  const { user } = useAuthStore();
  const [staff, setStaff] = useState<Employee[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    email: '', password: '', firstName: '', lastName: '', roleName: 'WAITER', workingHours: '09:00-18:00',
  });

  const load = useCallback(async () => {
    if (!user?.branchId) return;
    const res = await api.get(`/employees?branchId=${user.branchId}`);
    setStaff(res.data);
  }, [user]);

  useEffect(() => { void load(); }, [load]);

  const addStaff = async () => {
    if (!user?.branchId) return;
    await api.post('/employees', { ...form, branchId: user.branchId });
    setShowForm(false);
    void load();
  };

  const removeStaff = async (id: string) => {
    if (!confirm('Personel silinsin mi?')) return;
    await api.delete(`/employees/${id}`);
    void load();
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Personel Yönetimi"
        description="Garson, mutfak ve kasa personelini yönetin"
        action={
          <button onClick={() => setShowForm(true)} className="px-4 py-2 rounded-lg bg-indigo-600 text-sm font-bold flex items-center gap-1">
            <Plus className="h-4 w-4" /> Personel Ekle
          </button>
        }
      />

      <div className="rounded-xl border border-gray-900 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-900/60 text-xs uppercase text-gray-500">
            <tr>
              <th className="text-left py-3 px-4">Ad Soyad</th>
              <th className="text-left py-3 px-4">E-posta</th>
              <th className="text-left py-3 px-4">Rol</th>
              <th className="text-left py-3 px-4">Vardiya</th>
              <th className="py-3 px-4"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-900">
            {staff.map((e) => (
              <tr key={e.id} className="hover:bg-gray-900/20">
                <td className="py-3 px-4 font-semibold text-white">{e.user.firstName} {e.user.lastName}</td>
                <td className="py-3 px-4 text-gray-400">{e.user.email}</td>
                <td className="py-3 px-4">{e.user.role?.name}</td>
                <td className="py-3 px-4 text-gray-500">{e.workingHours || '—'}</td>
                <td className="py-3 px-4 text-right">
                  <button onClick={() => void removeStaff(e.id)} className="text-red-400 hover:text-red-300"><Trash2 className="h-4 w-4" /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50">
          <div className="w-full max-w-md rounded-xl border border-gray-800 bg-gray-900 p-6 space-y-3">
            <h3 className="font-bold">Yeni Personel</h3>
            {(['firstName', 'lastName', 'email', 'password'] as const).map((f) => (
              <input
                key={f}
                type={f === 'password' ? 'password' : 'text'}
                placeholder={f}
                value={form[f]}
                onChange={(e) => setForm({ ...form, [f]: e.target.value })}
                className="w-full rounded-lg border border-gray-800 bg-gray-950 px-4 py-2 text-white text-sm"
              />
            ))}
            <select
              value={form.roleName}
              onChange={(e) => setForm({ ...form, roleName: e.target.value })}
              className="w-full rounded-lg border border-gray-800 bg-gray-950 px-4 py-2 text-white text-sm"
            >
              <option value="WAITER">Garson</option>
              <option value="KITCHEN">Mutfak</option>
              <option value="CASHIER">Kasa</option>
              <option value="MANAGER">Müdür</option>
            </select>
            <div className="flex gap-2 pt-2">
              <button onClick={() => void addStaff()} className="flex-1 py-2 rounded-lg bg-indigo-600 font-bold text-sm">Kaydet</button>
              <button onClick={() => setShowForm(false)} className="flex-1 py-2 rounded-lg bg-gray-800 text-sm">İptal</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
