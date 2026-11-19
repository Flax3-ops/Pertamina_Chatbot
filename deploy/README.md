# Deploy: Backend di VPS + Frontend di Vercel

```
Browser ──HTTPS──▶ Vercel (React, Frontend/frontend)
   │
   └──HTTPS──▶ VPS: Caddy :443 ──▶ backend FastAPI :8000 ──▶ Supabase (session pooler)
```

Frontend dan backend berbeda domain, jadi backend **wajib HTTPS** (browser memblokir
request `http://` dari halaman `https://` Vercel). Caddy mengurus sertifikat otomatis.

## 1. Backend di VPS

Prasyarat: VPS Linux (disarankan ≥ 4 GB RAM, ≥ 20 GB disk), Docker + Docker Compose,
port 80 dan 443 terbuka, dan sebuah domain/subdomain dengan **A record → IP VPS**
(mis. `api.domainanda.com`). Tanpa domain sendiri bisa memakai `<IP-VPS>.sslip.io`.

```bash
git clone https://github.com/Menoob000/Pertamina_Chatbot.git
cd Pertamina_Chatbot
git checkout React_frontend
# salin .env dari laptop (JANGAN di-commit), lalu tambahkan variabel di bawah
nano .env
mkdir -p output data          # data/: PDF sumber RKS (opsional, di-mount read-only)
docker compose -f compose.backend.yaml up -d --build
```

Variabel `.env` yang dibutuhkan di VPS:

| Variabel | Contoh | Keterangan |
|---|---|---|
| `DATABASE_URL` | `postgresql://postgres.<ref>:<pass>@aws-1-ap-south-1.pooler.supabase.com:5432/postgres` | Supabase **session pooler** (IPv4) |
| `OPENROUTER_API_KEY` | `sk-or-v1-...` | LLM |
| `TAVILY_API_KEY` | `tvly-...` | web search agent |
| `EMBEDDING_MODEL` | `sentence-transformers/all-minilm-l6-v2` | harus sama dengan yang dipakai saat ingest KB |
| `API_DOMAIN` | `api.domainanda.com` | domain backend untuk Caddy |
| `CORS_ORIGINS` | `https://nama-app.vercel.app` | origin frontend, pisahkan dengan koma |
| `CORS_ORIGIN_REGEX` | `https://nama-app-.*\.vercel\.app` | opsional, untuk preview deployment |

Cek:

```bash
docker compose -f compose.backend.yaml ps
curl https://api.domainanda.com/api/health
docker compose -f compose.backend.yaml logs -f backend
```

Update setelah `git pull`: `docker compose -f compose.backend.yaml up -d --build`.

Catatan:
- Build pertama lama (torch CPU, docling, LibreOffice) — image ± 3–5 GB.
- Backend berjalan 1 worker karena memori percakapan LangGraph disimpan in-process;
  riwayat tetap tersimpan permanen di Supabase.
- `output/` (DOCX hasil generate) tersimpan di disk VPS lewat volume.

## 2. Frontend di Vercel

1. Import repo di Vercel, **Root Directory = `Frontend/frontend`** (framework terdeteksi Vite).
2. Project Settings → Environment Variables:
   `VITE_API_URL = https://api.domainanda.com` (tanpa `/api`, tanpa `/` di akhir).
3. Redeploy (variabel `VITE_*` dibaca saat build, jadi perubahan butuh redeploy).

`vercel.json` sudah berisi rewrite SPA sehingga refresh di `/generate-tender`,
`/generate-rks`, `/generate-amandemen` tidak 404.

## 3. Dev lokal (tidak berubah)

Kosongkan `VITE_API_URL`; `npm run dev` meneruskan `/api` ke `127.0.0.1:8000`
lewat proxy Vite, dan backend dijalankan dengan `python -m api.main`.
