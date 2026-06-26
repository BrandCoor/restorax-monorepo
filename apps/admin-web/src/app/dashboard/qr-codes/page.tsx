'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useAuthStore } from '@/store/authStore';
import api from '@/services/api';
import PageHeader from '@/components/PageHeader';
import { QrCode, Copy } from 'lucide-react';

interface TableRow {
  id: string;
  name: string;
  qrCodePayload?: string;
}

interface Section {
  id: string;
  name: string;
  tables: TableRow[];
}

export default function QrCodesPage() {
  const { user } = useAuthStore();
  const [sections, setSections] = useState<Section[]>([]);
  const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3001';

  const load = useCallback(async () => {
    if (!user?.branchId) return;
    const res = await api.get(`/tables?branchId=${user.branchId}`);
    setSections(res.data);
  }, [user]);

  useEffect(() => { void load(); }, [load]);

  const generateQr = async (tableId: string) => {
    const res = await api.post(`/qr-menu/generate/${tableId}?baseUrl=${encodeURIComponent(baseUrl)}`);
    void load();
    return res.data.qrUrl as string;
  };

  const copyLink = (url: string) => {
    void navigator.clipboard.writeText(url);
    alert('Link kopyalandı!');
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="QR Menü"
        description="Masalarınız için dijital menü QR kodları oluşturun"
      />

      <p className="text-sm text-gray-400 rounded-lg border border-indigo-900/40 bg-indigo-950/20 p-4">
        Müşteriler QR kodu okutarak <strong>/qr/[masa-id]</strong> adresinden menüyü görüp sipariş verebilir.
      </p>

      {sections.map((section) => (
        <div key={section.id} className="rounded-xl border border-gray-900 bg-gray-900/30 p-5">
          <h2 className="font-bold text-white mb-4">{section.name}</h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {section.tables?.map((table) => {
              const url = table.qrCodePayload || `${baseUrl}/qr/${table.id}`;
              return (
                <div key={table.id} className="rounded-lg border border-gray-800 bg-gray-950 p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <QrCode className="h-5 w-5 text-indigo-400" />
                    <span className="font-semibold text-white">{table.name}</span>
                  </div>
                  <p className="text-xs text-gray-500 break-all mb-3">{url}</p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => void generateQr(table.id).then(copyLink)}
                      className="flex-1 text-xs py-1.5 rounded bg-indigo-700 hover:bg-indigo-600 font-bold"
                    >
                      QR Oluştur
                    </button>
                    <button onClick={() => copyLink(url)} className="p-1.5 rounded bg-gray-800 hover:bg-gray-700">
                      <Copy className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
