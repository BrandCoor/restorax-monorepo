# RestoraX - Profesyonel Restoran Otomasyon Sistemi (SaaS)

RestoraX; restoran, kafe ve zincir işletmelerin tüm operasyonlarını tek merkezden yönetebileceği, Menufay tarzı çoklu kiracılı (Multi-Tenant) bulut tabanlı restoran işletim sistemidir.

## Modüller

| Modül | Açıklama |
|-------|----------|
| **POS / Adisyon** | Masa, paket ve gel-al siparişleri |
| **Masa Yönetimi** | Taşıma, birleştirme, bölme, parçalı ödeme |
| **Mutfak Ekranı (KDS)** | Canlı sipariş takibi |
| **QR Menü** | Müşteri self-servis dijital menü |
| **Menü Yönetimi** | Kategori ve ürün CRUD |
| **Stok & Envanter** | Reçeteli otomatik stok düşümü |
| **CRM** | Müşteri takibi ve sadakat |
| **Personel** | Garson, mutfak, kasa rolleri |
| **Platform Entegrasyon** | Yemeksepeti, Trendyol, Getir, Migros |
| **Yazıcılar** | Mutfak/bar yazıcı yönetimi |
| **Raporlar** | Ciro, ürün satışı, garson performansı |
| **WebSocket** | Anlık masa ve sipariş güncellemeleri |

## Teknoloji Yığını

- **Backend:** NestJS 11, PostgreSQL, TypeORM, JWT, Socket.IO
- **Frontend:** Next.js 16, React 19, Tailwind CSS 4, Zustand
- **Altyapı:** Docker Compose (PostgreSQL + Redis)

## Kurulum

### Gereksinimler
- Node.js 20+
- Docker Desktop

### 1. Bağımlılıkları yükleyin
```bash
npm install
```

### 2. Veritabanını başlatın
```bash
npm run db:up
```

### 3. Backend ortam değişkenleri
```bash
cp apps/backend/.env.example apps/backend/.env
```

### 4. Frontend ortam değişkenleri
```bash
cp apps/admin-web/.env.example apps/admin-web/.env.local
```

### 5. Uygulamaları çalıştırın
```bash
# Terminal 1 - API (port 3000)
npm run start:backend

# Terminal 2 - Admin Panel (port 3001)
npm run start:web
```

### Demo Giriş
- URL: http://localhost:3001/login
- E-posta: `owner@burgerx.com`
- Şifre: `burgerx123`

### Yeni Restoran Kaydı
http://localhost:3001/register

### QR Menü
Masalar için: http://localhost:3001/qr/[masa-id]

## Monorepo Yapısı

```
apps/
├── backend/     → NestJS REST API + WebSocket (port 3000)
└── admin-web/   → Next.js yönetim paneli (port 3001)
```

## API Güvenliği

Tüm endpoint'ler JWT ile korunur. Public endpoint'ler:
- `POST /auth/login`, `POST /auth/register`
- `GET /qr-menu/table/:id`, `POST /qr-menu/order/:id`
- `GET /menu?branchId=` (müşteri menüsü)

## Lisans

Private — BrandCoor / RestoraX
