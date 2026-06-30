# Leads Management System

Full-stack engineering assessment for **Usaha Kreatif Indonesia**.

---

## Installation

### Prasyarat

| Tool | Versi minimum |
|------|--------------|
| [Docker](https://docs.docker.com/get-docker/) | 24+ |
| [Docker Compose](https://docs.docker.com/compose/install/) | v2 (plugin bawaan Docker Desktop) |
| [Node.js](https://nodejs.org/) _(opsional, untuk dev lokal)_ | 20 LTS |
| [Python](https://www.python.org/) _(opsional, untuk dev lokal)_ | 3.11+ |

### 1. Clone & masuk ke folder

```bash
git clone https://github.com/alifsuryadi/leads-system.git
cd leads-system
```

### 2. Jalankan semua service dengan Docker

```bash
docker compose up --build
```

Tunggu hingga semua container `healthy`, lalu buka:

| URL | Keterangan |
|-----|-----------|
| http://localhost:3000 | Frontend (Next.js) |
| http://localhost:3001/leads | REST API Backend (NestJS) |
| http://localhost:8000/docs | Swagger AI Service (FastAPI) |

> Migrasi database Prisma dijalankan **otomatis** saat container `backend` start.

### 3. Hentikan semua service

```bash
docker compose down          # hentikan container
docker compose down -v       # + hapus volume PostgreSQL
```

---

### (Opsional) Jalankan tanpa Docker

<details>
<summary>Expand — dev lokal per service</summary>

**Pastikan PostgreSQL dan Redis sudah berjalan secara lokal terlebih dahulu.**

#### Backend
```bash
cd backend
cp .env.example .env        # sesuaikan DATABASE_URL & REDIS_HOST
npm install
npx prisma migrate dev --name init
npm run start:dev
```

#### Worker
```bash
cd worker
npm install
npm run build
REDIS_HOST=localhost REDIS_PORT=6379 node dist/main
```

#### AI Service
```bash
cd ai-service
python -m venv .venv
source .venv/bin/activate   # Windows: .venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

#### Frontend
```bash
cd frontend
npm install
NEXT_PUBLIC_API_URL=http://localhost:3001 npm run dev
```

</details>

---

## Architecture

```
┌─────────────┐    HTTP     ┌──────────────────────────────────────────┐
│  Next.js    │ ──────────► │  NestJS Backend  (port 3001)             │
│  Frontend   │             │  POST /leads                             │
│  (port 3000)│             │  GET  /leads?page=1&limit=10             │
└─────────────┘             │  POST /sentiment/analyze (proxy to AI)   │
                            └──────────────────┬─────────────────┬──────┘
                                               │ BullMQ          │ HTTP
                                               ▼                 ▼
                                        ┌──────────┐   ┌─────────────────┐
                                        │  Redis   │   │  Python FastAPI  │
                                        │ (Queue)  │   │  AI Service      │
                                        └────┬─────┘   │  (port 8000)    │
                                             │          └─────────────────┘
                                             ▼ consume
                                        ┌──────────┐
                                        │  Worker  │
                                        │ (BullMQ) │
                                        └──────────┘

                            ┌──────────────┐
                            │  PostgreSQL  │
                            │  (port 5432) │
                            └──────────────┘
```

## Services

| Service     | Tech               | Port | Description                               |
|-------------|-------------------|------|-------------------------------------------|
| `frontend`  | Next.js 14        | 3000 | Lead form, table dengan pagination, AI UI |
| `backend`   | NestJS + Prisma   | 3001 | REST API, queue publisher                 |
| `worker`    | Node.js + BullMQ  | —    | Konsumsi lead queue, log email            |
| `ai-service`| Python FastAPI    | 8000 | Analisis sentimen berbasis keyword        |
| `postgres`  | PostgreSQL 15     | 5432 | Penyimpanan lead persisten                |
| `redis`     | Redis 7           | 6379 | Backend queue BullMQ                      |

---

## Task A — Full-Stack Feature

### Create Lead
```
POST http://localhost:3001/leads
Content-Type: application/json

{
  "name": "Budi Santoso",
  "email": "budi@example.com",
  "campaignId": "CAMP-2024-Q3"
}
```

Validasi server-side (NestJS `class-validator`):
- `name`: wajib, maks 100 karakter
- `email`: wajib, format email valid
- `campaignId`: wajib, maks 50 karakter, hanya huruf/angka/hyphen/underscore

Validasi client-side (`react-hook-form`): aturan yang sama diterapkan sebelum request dikirim.

### Get Leads (paginated)
```
GET http://localhost:3001/leads?page=1&limit=10
```

Response:
```json
{
  "data": [...],
  "meta": { "total": 42, "page": 1, "limit": 10, "totalPages": 5 }
}
```

### Database Schema (Prisma)
```prisma
model Lead {
  id         String   @id @default(uuid())
  name       String   @db.VarChar(100)
  email      String   @db.VarChar(255)
  campaignId String   @db.VarChar(50)
  createdAt  DateTime @default(now())

  @@index([campaignId])
  @@index([createdAt])
}
```

---

## Task B — Messaging & Caching (Redis + BullMQ)

Saat lead dibuat, backend mempublish job ke queue `leads`:

```typescript
await this.leadsQueue.add('lead.created', payload, {
  attempts: 3,
  backoff: { type: 'exponential', delay: 1000 },
  removeOnComplete: true,
  removeOnFail: false,   // simpan job gagal untuk inspeksi
});
```

**Worker** (container terpisah) mengkonsumsi job dan mencetak log:
```
[Worker] Started — listening on "leads" queue...
[Worker] Lead received: budi@example.com
[Worker] → ID: uuid, Name: Budi Santoso, Campaign: CAMP-2024-Q3
[Worker] Job 1 completed successfully
```

Retry behaviour:
- Gagal ke-1 → tunggu 1 detik
- Gagal ke-2 → tunggu 2 detik (exponential backoff)
- Gagal ke-3 → permanent failure, job tetap tersimpan di Redis

---

## Task C — Python AI Microservice

### Analyze Sentiment
```
POST http://localhost:8000/analyze
Content-Type: application/json

{ "text": "This product is amazing and I love using it!" }
```

Response:
```json
{
  "text": "This product is amazing and I love using it!",
  "sentiment": "positive",
  "confidence": 1.0,
  "matched_keywords": ["amazing", "love"]
}
```

**Rule logic:**
1. Tokenisasi teks menjadi kata-kata lowercase
2. Hitung kecocokan terhadap kamus keyword positif/negatif
3. `positive` menang jika `pos_count >= neg_count`
4. Confidence = `winning_count / total_matches`
5. Tidak ada keyword yang cocok → `negative` dengan confidence 0.5

NestJS memproxy panggilan ke AI service via `POST /sentiment/analyze`.

---

## Project Structure

```
.
├── .gitignore
├── docker-compose.yml
├── README.md
├── backend/               # NestJS REST API
│   ├── .env.example
│   ├── Dockerfile
│   ├── prisma/
│   │   └── schema.prisma
│   └── src/
│       ├── leads/         # Lead CRUD + queue publish
│       │   ├── dto/
│       │   ├── leads.controller.ts
│       │   ├── leads.service.ts
│       │   └── leads.module.ts
│       ├── sentiment/     # Proxy ke AI service
│       └── prisma/        # PrismaService (global module)
├── worker/                # BullMQ consumer (Node.js standalone)
│   └── src/main.ts
├── ai-service/            # Python FastAPI sentiment analysis
│   ├── main.py
│   └── requirements.txt
└── frontend/              # Next.js 14 App Router
    └── src/
        ├── app/
        ├── components/
        │   ├── LeadForm.tsx
        │   ├── LeadsTable.tsx
        │   └── SentimentAnalyzer.tsx
        ├── lib/api.ts
        └── types/lead.ts
```
