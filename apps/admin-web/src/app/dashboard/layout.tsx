'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore } from '@/store/authStore';
import { LayoutDashboard, Tablet, UtensilsCrossed, Settings, LogOut, Grid, PlusCircle } from 'lucide-react';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, token, logout } = useAuthStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (!token || !user) {
      router.push('/login');
    }
  }, [token, user, router]);

  if (!mounted || !user) return null;

  const menuItems = [
    { name: 'Genel Durum', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Masa Takibi', href: '/dashboard/tables', icon: Grid },
    { name: 'Hızlı Sipariş (POS)', href: '/dashboard/pos', icon: PlusCircle },
    { name: 'Mutfak Ekranı', href: '/dashboard/kitchen', icon: UtensilsCrossed },
    { name: 'Menü Yönetimi', href: '/dashboard/menu', icon: Tablet },
    { name: 'Ayarlar', href: '/dashboard/settings', icon: Settings },
  ];

  return (
    <div className="flex h-screen bg-gray-950 text-white overflow-hidden">
      <aside className="w-64 border-r border-gray-900 bg-gray-900/50 flex flex-col justify-between shrink-0">
        <div>
          <div className="h-16 flex items-center px-6 border-b border-gray-900">
            <span className="text-xl font-extrabold text-white tracking-wide">RestoraX</span>
          </div>

          <nav className="p-4 space-y-1">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center px-4 py-3 text-sm font-semibold rounded-lg transition-colors gap-3 ${
                    isActive
                      ? 'bg-indigo-600 text-white'
                      : 'text-gray-400 hover:bg-gray-800 hover:text-white'
                  }`}
                >
                  <Icon className="h-5 w-5 shrink-0" />
                  {item.name}
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="p-4 border-t border-gray-900 space-y-3">
          <div className="flex items-center gap-3 px-2">
            <div className="h-10 w-10 rounded-full bg-indigo-900 flex items-center justify-center font-extrabold text-indigo-300 text-sm shrink-0">
              {user.firstName[0].toUpperCase()}{user.lastName[0].toUpperCase()}
            </div>
            <div className="truncate">
              <p className="text-sm font-bold truncate">{user.firstName} {user.lastName}</p>
              <p className="text-xs text-indigo-400 font-semibold truncate capitalize">{user.role.toLowerCase()}</p>
            </div>
          </div>
          <button
            onClick={() => {
              logout();
              router.push('/login');
            }}
            className="flex items-center w-full px-4 py-3 text-sm font-semibold rounded-lg text-red-400 hover:bg-red-950/20 transition-colors gap-3"
          >
            <LogOut className="h-5 w-5 shrink-0" />
            Çıkış Yap
          </button>
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto bg-gray-950 p-8">
        {children}
      </main>
    </div>
  );
}