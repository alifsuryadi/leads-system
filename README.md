# Leads Management System

Full-stack engineering assessment untuk **Usaha Kreatif Indonesia** — mencakup REST API, antrian pesan asinkron, dan microservice AI analisis sentimen.

---

## Daftar Isi

- [Gambaran Proyek](#gambaran-proyek)
- [Tech Stack](#tech-stack)
- [Arsitektur](#arsitektur)
- [Instalasi](#instalasi)
- [API Reference](#api-reference)
- [Task Coverage](#task-coverage)
- [Struktur Proyek](#struktur-proyek)

---

## Gambaran Proyek

Sistem manajemen leads yang terdiri dari 5 service yang berjalan bersamaan via Docker Compose:

| Service | Fungsi |
|---------|--------|
| **Frontend** | Form input lead, tabel paginasi, dan UI analisis sentimen |
| **Backend** | REST API untuk CRUD lead; mempublish job ke queue saat lead dibuat |
| **Worker** | Konsumsi job dari Redis queue secara asinkron (simulasi kirim email / sync CRM) |
| **AI Service** | Analisis sentimen berbasis rule/keyword, diakses via proxy NestJS |
| **Database** | PostgreSQL menyimpan data lead secara persisten |

**Alur utama:**
1. User mengisi form di frontend → `POST /leads` → lead tersimpan di PostgreSQL
2. Backend langsung mempublish job ke Redis queue (`leads`) — proses asinkron
3. Worker mengkonsumsi job dan mencatat log (simulasi welcome email / CRM sync)
4. User mengetik teks bebas di Sentiment Analyzer → `POST /sentiment/analyze` → AI service mengembalikan sentimen, confidence, dan keyword yang cocok

---

## Tech Stack

| Layer | Teknologi |
|-------|-----------|
| Frontend | Next.js 14 (App Router), Tailwind CSS, react-hook-form |
| Backend | NestJS 10, Prisma ORM, BullMQ, class-validator |
| Worker | Node.js standalone, BullMQ |
| AI Service | Python 3.11, FastAPI, Pydantic |
| Database | PostgreSQL 15 |
| Queue | Redis 7 |
| Container | Docker, Docker Compose |

---

## Arsitektur

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

---

## Instalasi

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

## API Reference

### `POST /leads` — Buat lead baru

**Request:**
```http
POST http://localhost:3001/leads
Content-Type: application/json

{
  "name": "Budi Santoso",
  "email": "budi@example.com",
  "campaignId": "CAMP-2024-Q3"
}
```

**Response `201 Created`:**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "name": "Budi Santoso",
  "email": "budi@example.com",
  "campaignId": "CAMP-2024-Q3",
  "createdAt": "2024-10-01T08:00:00.000Z"
}
```

**Aturan validasi (berlaku di server dan client):**

| Field | Aturan |
|-------|--------|
| `name` | Wajib, maks 100 karakter |
| `email` | Wajib, format email valid |
| `campaignId` | Wajib, maks 50 karakter, hanya huruf/angka/hyphen/underscore |

---

### `GET /leads` — Daftar lead dengan paginasi

**Request:**
```http
GET http://localhost:3001/leads?page=1&limit=10
```

**Response `200 OK`:**
```json
{
  "data": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "name": "Budi Santoso",
      "email": "budi@example.com",
      "campaignId": "CAMP-2024-Q3",
      "createdAt": "2024-10-01T08:00:00.000Z"
    }
  ],
  "meta": {
    "total": 42,
    "page": 1,
    "limit": 10,
    "totalPages": 5
  }
}
```

---

### `POST /sentiment/analyze` — Analisis sentimen (via NestJS proxy)

```http
POST http://localhost:3001/sentiment/analyze
Content-Type: application/json

{ "text": "This product is amazing and I love using it!" }
```

Atau langsung ke AI service:

```http
POST http://localhost:8000/analyze
Content-Type: application/json

{ "text": "This product is amazing and I love using it!" }
```

**Response `200 OK`:**
```json
{
  "text": "This product is amazing and I love using it!",
  "sentiment": "positive",
  "confidence": 1.0,
  "matched_keywords": ["amazing", "love"]
}
```

**Logika rule-based:**
1. Tokenisasi teks menjadi kata-kata lowercase (hapus tanda baca)
2. Cocokkan dengan kamus keyword positif dan negatif
3. `positive` menang jika `pos_count >= neg_count`
4. `confidence` = `winning_count / total_matches` (dibulatkan 2 desimal)
5. Tidak ada keyword cocok → `negative` dengan `confidence: 0.5`

---

## Task Coverage

| Task | Komponen | Detail |
|------|----------|--------|
| **A** | `POST /leads` | Validasi server-side dengan `class-validator` |
| **A** | `GET /leads` | Paginasi dengan `page`, `limit`, dan `meta` |
| **A** | Database | Prisma schema: Lead (UUID, VarChar, index campaignId & createdAt) |
| **A** | Frontend form | Validasi client-side dengan `react-hook-form` (aturan sama dengan server) |
| **A** | Frontend table | Tabel leads dengan tombol Previous/Next |
| **B** | Queue publish | Job dipublish ke BullMQ setelah `POST /leads` berhasil |
| **B** | Worker | Container terpisah, mengkonsumsi queue `leads` secara asinkron |
| **B** | Retry | 3 percobaan, exponential backoff (1s → 2s → permanent fail) |
| **B** | Graceful shutdown | Worker menutup koneksi saat menerima `SIGTERM` |
| **C** | FastAPI | `POST /analyze` dengan Pydantic validation |
| **C** | Sentiment logic | Rule-based keyword matching, confidence score |
| **C** | NestJS proxy | `POST /sentiment/analyze` → forward ke AI service |
| **C** | Frontend UI | Sentiment Analyzer: hasil sentiment, confidence %, matched keywords |

---

## Struktur Proyek

```
.
├── .gitignore
├── docker-compose.yml
├── README.md
├── backend/                   # NestJS REST API
│   ├── .env.example
│   ├── Dockerfile
│   ├── prisma/
│   │   └── schema.prisma      # Model Lead
│   └── src/
│       ├── main.ts
│       ├── app.module.ts
│       ├── leads/             # Task A — CRUD + queue publish
│       │   ├── dto/
│       │   │   ├── create-lead.dto.ts
│       │   │   └── query-leads.dto.ts
│       │   ├── leads.controller.ts
│       │   ├── leads.service.ts
│       │   └── leads.module.ts
│       ├── sentiment/         # Task C — Proxy ke AI service
│       │   ├── sentiment.controller.ts
│       │   ├── sentiment.service.ts
│       │   └── sentiment.module.ts
│       └── prisma/            # PrismaService (global module)
│           ├── prisma.service.ts
│           └── prisma.module.ts
├── worker/                    # Task B — BullMQ consumer
│   ├── Dockerfile
│   ├── package.json
│   ├── tsconfig.json
│   └── src/
│       └── main.ts
├── ai-service/                # Task C — Python FastAPI
│   ├── Dockerfile
│   ├── main.py
│   └── requirements.txt
└── frontend/                  # Next.js 14 App Router
    ├── Dockerfile
    ├── next.config.ts
    └── src/
        ├── app/
        │   ├── layout.tsx
        │   ├── page.tsx
        │   └── globals.css
        ├── components/
        │   ├── LeadForm.tsx        # Task A — form + validasi
        │   ├── LeadsTable.tsx      # Task A — tabel + paginasi
        │   └── SentimentAnalyzer.tsx  # Task C — UI sentimen
        ├── lib/
        │   └── api.ts              # Fetch helpers ke backend
        └── types/
            └── lead.ts             # TypeScript interfaces
```
