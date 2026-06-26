'use client';

import React from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import {
  LayoutDashboard,
  Grid,
  PlusCircle,
  UtensilsCrossed,
  Tablet,
  Settings,
  LogOut,
  BarChart3,
  Users,
  Package,
  UserCircle,
  Plug,
  Printer,
  Globe,
} from 'lucide-react';

const menuItems = [
  { name: 'Genel Durum', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Masa Takibi', href: '/dashboard/tables', icon: Grid },
  { name: 'Hızlı Sipariş (POS)', href: '/dashboard/pos', icon: PlusCircle },
  { name: 'Mutfak Ekranı', href: '/dashboard/kitchen', icon: UtensilsCrossed },
  { name: 'Menü Yönetimi', href: '/dashboard/menu', icon: Tablet },
  { name: 'Stok & Envanter', href: '/dashboard/inventory', icon: Package },
  { name: 'Müşteriler (CRM)', href: '/dashboard/customers', icon: UserCircle },
  { name: 'Personel', href: '/dashboard/staff', icon: Users },
  { name: 'Platform Entegrasyon', href: '/dashboard/integrations', icon: Plug },
  { name: 'Yazıcılar', href: '/dashboard/printers', icon: Printer },
  { name: 'Raporlar', href: '/dashboard/reports', icon: BarChart3 },
  { name: 'QR Menü', href: '/dashboard/qr-codes', icon: Globe },
  { name: 'Ayarlar', href: '/dashboard/settings', icon: Settings },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, token, logout } = useAuthStore();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  React.useEffect(() => {
    if (!mounted) return;
    if (!token || !user) {
      router.push('/login');
    }
  }, [mounted, token, user, router]);

  if (!mounted || !user) return null;

  return (
    <div className="flex h-screen overflow-hidden bg-gray-950 text-white">
      <aside className="flex w-64 shrink-0 flex-col overflow-y-auto border-r border-white/10 bg-slate-950/70 backdrop-blur">
        <div className="flex h-16 shrink-0 items-center border-b border-white/10 px-6">
          <span className="text-xl font-extrabold tracking-wide text-white">RestoraX</span>
        </div>

        <nav className="p-3 space-y-0.5 flex-1">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center px-3 py-2.5 text-sm font-medium rounded-lg transition-colors gap-3 ${
                  isActive
                    ? 'bg-indigo-600 text-white'
                    : 'text-gray-400 hover:bg-gray-800 hover:text-white'
                }`}
              >
                <Icon className="h-4 w-4 shrink-0" />
                {item.name}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-gray-900 shrink-0">
          <div className="px-2 mb-3">
            <p className="text-sm font-semibold text-white truncate">
              {user.firstName} {user.lastName}
            </p>
            <p className="text-xs text-gray-500 truncate">{user.role}</p>
          </div>
          <button
            onClick={() => {
              logout();
              router.push('/login');
            }}
            className="flex w-full items-center gap-2 px-3 py-2 text-sm text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
          >
            <LogOut className="h-4 w-4" />
            Çıkış Yap
          </button>
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto p-6 lg:p-8">{children}</main>
    </div>
  );
}
