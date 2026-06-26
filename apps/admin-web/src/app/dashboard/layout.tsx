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
  ChevronRight,
} from 'lucide-react';

const menuSections = [
  {
    title: 'Operasyon',
    items: [
      { name: 'Genel Durum', href: '/dashboard', icon: LayoutDashboard },
      { name: 'Masa Takibi', href: '/dashboard/tables', icon: Grid },
      { name: 'Hızlı Sipariş (POS)', href: '/dashboard/pos', icon: PlusCircle },
      { name: 'Mutfak Ekranı', href: '/dashboard/kitchen', icon: UtensilsCrossed },
    ],
  },
  {
    title: 'Yönetim',
    items: [
      { name: 'Menü Yönetimi', href: '/dashboard/menu', icon: Tablet },
      { name: 'Stok & Envanter', href: '/dashboard/inventory', icon: Package },
      { name: 'Müşteriler (CRM)', href: '/dashboard/customers', icon: UserCircle },
      { name: 'Personel', href: '/dashboard/staff', icon: Users },
      { name: 'Platform Entegrasyon', href: '/dashboard/integrations', icon: Plug },
      { name: 'Yazıcılar', href: '/dashboard/printers', icon: Printer },
      { name: 'Raporlar', href: '/dashboard/reports', icon: BarChart3 },
      { name: 'QR Menü', href: '/dashboard/qr-codes', icon: Globe },
    ],
  },
  {
    title: 'Kurulum',
    items: [{ name: 'Ayarlar', href: '/dashboard/settings', icon: Settings }],
  },
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
    <div className="flex h-screen overflow-hidden bg-[#050816] text-white">
      <aside className="flex w-72 shrink-0 flex-col overflow-y-auto border-r border-white/10 bg-slate-950/80 backdrop-blur-xl">
        <div className="flex h-16 shrink-0 items-center justify-between border-b border-white/10 px-6">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.35em] text-indigo-400">RestoraX</p>
            <p className="text-sm font-semibold text-white">Yönetim Paneli</p>
          </div>
          <span className="rounded-full border border-emerald-800/50 bg-emerald-950/50 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-emerald-300">
            Live
          </span>
        </div>

        <div className="p-4">
          <Link
            href="/dashboard/pos"
            className="flex items-center justify-between rounded-2xl border border-indigo-900/50 bg-indigo-600/90 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-950/40"
          >
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-indigo-100/80">Hızlı iş</p>
              <p>Yeni Sipariş</p>
            </div>
            <ChevronRight className="h-4 w-4" />
          </Link>
        </div>

        <nav className="flex-1 space-y-4 overflow-y-auto px-3 pb-3">
          {menuSections.map((section) => (
            <div key={section.title}>
              <p className="mb-2 px-2 text-[10px] font-semibold uppercase tracking-[0.35em] text-gray-500">
                {section.title}
              </p>
              <div className="space-y-1">
                {section.items.map((item) => {
                  const Icon = item.icon;
                  const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all ${
                        isActive
                          ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-950/40'
                          : 'text-gray-400 hover:bg-gray-800 hover:text-white'
                      }`}
                    >
                      <Icon className="h-4 w-4 shrink-0" />
                      <span>{item.name}</span>
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        <div className="shrink-0 border-t border-gray-900/80 p-4">
          <div className="mb-3 rounded-2xl border border-white/10 bg-slate-900/70 px-3 py-3">
            <p className="truncate text-sm font-semibold text-white">
              {user.firstName} {user.lastName}
            </p>
            <p className="truncate text-xs text-gray-500">{user.role}</p>
          </div>
          <button
            onClick={() => {
              logout();
              router.push('/login');
            }}
            className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm text-gray-400 transition-colors hover:bg-gray-800 hover:text-white"
          >
            <LogOut className="h-4 w-4" />
            Çıkış Yap
          </button>
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">{children}</main>
    </div>
  );
}
