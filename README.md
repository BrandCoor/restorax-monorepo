# RestoraX - Profesyonel Restoran Otomasyon Sistemi (SaaS)

RestoraX; restoran, kafe ve zincir işletmelerin tüm operasyonlarını tek bir merkezden yönetebileceği, ölçeklenebilir ve çoklu işletme (Multi-Tenant) destekli bulut tabanlı bir restoran işletim sistemidir.

Bu proje basit bir QR menü uygulaması olmanın ötesinde, profesyonel restoran otomasyonu seviyesinde çalışacak şekilde tasarlanmıştır.

## 🚀 Teknolojiler ve Mimari

### Backend
- **Framework:** NestJS (Node.js)
- **Veritabanı:** PostgreSQL
- **ORM:** TypeORM
- **Önbellekleme / Socket:** Redis
- **Containerization:** Docker & Docker Compose

### Monorepo Yapısı
Proje, tüm istemci ve sunucu uygulamalarının tek bir merkezden yönetilebilmesi için Monorepo mimarisiyle kurulmuştur:
- `apps/backend`: NestJS tabanlı REST API ve WebSocket sunucusu.
- `apps/admin-web` *(Yol Haritasında)*: Restoran sahipleri için Next.js yönetim paneli.
- `apps/waiter-mobile` *(Yol Haritasında)*: Garsonlar için React Native mobil uygulaması.

---

## 🛠️ Yerel Kurulum ve Çalıştırma

Projenin yerel bilgisayarınızda çalışabilmesi için bilgisayarınızda **Node.js** ve **Docker Desktop** yazılımlarının kurulu olması gerekmektedir.

### 1. Veritabanı ve Redis'i Başlatma (Docker)
Projenin ana dizinindeyken Docker servislerini başlatın:
```bash
npm run db:up