'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import api from '@/services/api';
import { useAuthStore } from '@/store/authStore';

export default function RegisterPage() {
  const router = useRouter();
  const login = useAuthStore((s) => s.login);
  const [form, setForm] = useState({
    restaurantName: '',
    subdomain: '',
    branchName: 'Merkez Şube',
    ownerEmail: '',
    ownerPassword: '',
    ownerFirstName: '',
    ownerLastName: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await api.post('/auth/register', {
        restaurantName: form.restaurantName,
        subdomain: form.subdomain.toLowerCase().replace(/\s+/g, '-'),
        branchName: form.branchName,
        email: form.ownerEmail,
        password: form.ownerPassword,
        firstName: form.ownerFirstName,
        lastName: form.ownerLastName,
      });
      login(res.data.accessToken, res.data.user);
      router.push('/dashboard');
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setError(msg || 'Kayıt başarısız.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
      <div className="w-full max-w-lg rounded-2xl border border-gray-800 bg-gray-900 p-8">
        <h1 className="text-2xl font-extrabold text-white text-center">RestoraX&apos;a Kayıt Ol</h1>
        <p className="text-sm text-gray-400 text-center mt-2">Restoranınızı dakikalar içinde dijitalleştirin</p>

        <form onSubmit={handleSubmit} className="mt-8 space-y-4">
          {error && <p className="text-red-400 text-sm text-center bg-red-950/30 p-2 rounded">{error}</p>}
          {(['restaurantName', 'subdomain', 'branchName', 'ownerFirstName', 'ownerLastName', 'ownerEmail'] as const).map((f) => (
            <input
              key={f}
              required={f !== 'branchName'}
              type={f === 'ownerEmail' ? 'email' : 'text'}
              placeholder={f}
              value={form[f]}
              onChange={(e) => setForm({ ...form, [f]: e.target.value })}
              className="w-full rounded-lg border border-gray-800 bg-gray-950 px-4 py-2.5 text-white text-sm"
            />
          ))}
          <input
            required
            type="password"
            placeholder="Şifre"
            value={form.ownerPassword}
            onChange={(e) => setForm({ ...form, ownerPassword: e.target.value })}
            className="w-full rounded-lg border border-gray-800 bg-gray-950 px-4 py-2.5 text-white text-sm"
          />
          <button type="submit" disabled={loading} className="w-full py-3 rounded-lg bg-indigo-600 font-bold disabled:opacity-50">
            {loading ? 'Kaydediliyor...' : 'Hesap Oluştur'}
          </button>
        </form>
        <p className="text-center text-sm text-gray-500 mt-6">
          Zaten hesabınız var mı? <Link href="/login" className="text-indigo-400 hover:underline">Giriş yapın</Link>
        </p>
      </div>
    </div>
  );
}
