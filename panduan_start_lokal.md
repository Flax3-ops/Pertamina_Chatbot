# Panduan Menjalankan Proyek Secara Lokal

Panduan ini menjalankan **backend FastAPI** dan **frontend React** di komputer sendiri,
dengan database **Supabase (online)**. Docker dan Vercel tidak diperlukan untuk lokal.

```
Browser ──▶ http://localhost:5173 (Vite dev server, React)
                 │  request /api/* diteruskan oleh proxy Vite
                 ▼
            http://127.0.0.1:8000 (FastAPI)  ──▶  Supabase PostgreSQL + pgvector
                                             ──▶  OpenRouter (LLM), Tavily (web search)
```

---

## 1. Prasyarat

| Software | Versi | Cek dengan |
|---|---|---|
| Python | 3.12 | `python --version` |
| [uv](https://github.com/astral-sh/uv) | terbaru | `uv --version` |
| Node.js | ≥ 20.19 (disarankan 22/24) | `node --version` |
| Git | apa saja | `git --version` |

Akses internet diperlukan untuk Supabase, OpenRouter, dan Tavily.

---

## 2. Ambil Kode

```powershell
git clone https://github.com/Menoob000/Pertamina_Chatbot.git
cd Pertamina_Chatbot
git checkout React_frontend
```

---

## 3. Konfigurasi `.env` (root proyek)

Buat file `.env` di root proyek. Minta nilai rahasianya ke anggota tim. **Jangan di-commit.**

```env
# LLM & tools
OPENROUTER_API_KEY="sk-or-v1-..."
TAVILY_API_KEY="tvly-..."

# Database Supabase: WAJIB pakai Session Pooler (lihat catatan di bawah)
DATABASE_URL="postgresql://postgres.<project-ref>:<PASSWORD>@aws-1-ap-south-1.pooler.supabase.com:5432/postgres"

# Model embedding (harus sama dengan yang dipakai saat ingest knowledge base)
EMBEDDING_MODEL=sentence-transformers/all-minilm-l6-v2

# Opsional: tracing LangSmith
LANGSMITH_TRACING=true
LANGSMITH_ENDPOINT=https://api.smith.langchain.com
LANGSMITH_API_KEY="lsv2_pt_..."
LANGSMITH_PROJECT="Pertamina_Chatbot"
```

### Catatan penting `DATABASE_URL`

- Ambil dari dashboard Supabase: **Connect → Direct (Connection string) → Method: Session pooler**.
- Ciri URL yang benar: user `postgres.<project-ref>` dan host berakhiran **`pooler.supabase.com`**, port **5432**.
- **Jangan** pakai host `db.<project-ref>.supabase.co` (Direct connection). Host itu hanya punya
  IPv6, sehingga gagal di jaringan IPv4 dengan error `failed to resolve host`.
- **Jangan** pakai Transaction pooler (port 6543), karena tidak cocok dengan psycopg/PGVector.
- **Jangan** pakai awalan `postgresql+asyncpg://`; gunakan `postgresql://`.
- Jika password mengandung karakter khusus (`@ # / : ?`), lakukan percent-encode (mis. `@` → `%40`).

---

## 4. Instal Dependensi (sekali saja)

### Backend (Python)

Dari root proyek:

```powershell
uv sync
```

Perintah ini membuat `.venv` dan memasang semua paket dari `pyproject.toml` / `uv.lock`.

Model embedding dimuat dengan `local_files_only=True`, jadi model harus sudah ada di cache
Hugging Face. Jika belum pernah diunduh, jalankan sekali:

```powershell
.venv\Scripts\python.exe -c "from huggingface_hub import snapshot_download; snapshot_download('sentence-transformers/all-minilm-l6-v2')"
```

### Frontend (Node)

```powershell
cd Frontend\frontend
npm install
cd ..\..
```

> Pastikan `npm install` dijalankan di **`Frontend\frontend`**, bukan di `Frontend`.

### Cek koneksi database (opsional, disarankan)

```powershell
.venv\Scripts\python.exe -c "from dotenv import load_dotenv; load_dotenv(); from rag.conversation_store import ConversationStore as S; s=S('api-user',True); s.initialize(); print('DB OK,', len(s.list_threads()), 'thread')"
```

Output yang diharapkan: `DB OK, N thread`.

---

## 5. Menjalankan Aplikasi

Buka **dua terminal** di root proyek.

### Terminal 1: Backend FastAPI

```powershell
.venv\Scripts\python.exe -m api.main
```

Tunggu sampai muncul:

```
INFO:     Uvicorn running on http://127.0.0.1:8000
INFO:     Application startup complete.
```

Backend memakai auto-reload: perubahan di `api/`, `tools/`, `rag/` otomatis dimuat ulang.
Dokumentasi API interaktif: http://127.0.0.1:8000/docs

### Terminal 2: Frontend React

```powershell
cd Frontend\frontend
npm run dev
```

Tunggu sampai muncul `Local: http://localhost:5173/`, lalu buka **http://localhost:5173** di browser.

> Untuk lokal, **jangan** isi `VITE_API_URL`. Proxy Vite otomatis meneruskan `/api` ke
> `127.0.0.1:8000`. Variabel itu hanya untuk deploy di Vercel (lihat `deploy/README.md`).

### (Opsional) Antarmuka Streamlit

Antarmuka lama berbasis Streamlit masih tersedia:

```powershell
.venv\Scripts\streamlit.exe run streamlit_app.py
```

Buka http://localhost:8501.

---

## 6. Verifikasi

| Cek | Cara | Hasil yang diharapkan |
|---|---|---|
| Backend hidup | buka http://127.0.0.1:8000/api/health | `{"status":"healthy", ...}` |
| Proxy frontend | buka http://localhost:5173/api/health | sama seperti di atas |
| Riwayat chat | sidebar frontend | daftar percakapan tampil tanpa pesan error |
| Chat | kirim "Halo" di halaman chat | jawaban AI muncul (± 10–30 detik) |
| RAG | tanya isi dokumen RKS di knowledge base | kartu tool `fetch_relevant_documents` muncul (bisa 1–2 menit) |

---

## 7. Troubleshooting

| Gejala | Penyebab | Solusi |
|---|---|---|
| `failed to resolve host 'db.xxxx.supabase.co'` | Memakai Direct connection (IPv6-only) di jaringan IPv4 | Ganti `DATABASE_URL` ke **Session pooler** |
| `missing "=" after "postgresql+asyncpg://..."` | Format URL SQLAlchemy | Ganti awalan menjadi `postgresql://` |
| Sidebar: "Gagal memuat riwayat percakapan" | Backend mati atau DB tidak terhubung | Cek Terminal 1 dan jalankan cek koneksi DB (langkah 4) |
| `Rollup failed to resolve import "react-router-dom"` | `npm install` belum dijalankan di `Frontend\frontend` | `cd Frontend\frontend` lalu `npm install` |
| Frontend: `Network Error` / 502 di `/api/...` | Backend belum jalan di port 8000 | Jalankan Terminal 1 lebih dulu |
| `UnicodeEncodeError: 'charmap' codec can't encode character` | Konsol Windows cp1252 tidak bisa mencetak emoji | Jalankan `$env:PYTHONIOENCODING="utf-8"` sebelum start backend |
| Chat: pesan timeout | Agent/LLM memproses > 180 detik | Ulangi atau persingkat pertanyaan |
| Error memuat model embedding (`local_files_only`) | Model belum ada di cache Hugging Face | Jalankan perintah unduh model di langkah 4 |
| Streamlit: "Pustaka Google Drive belum selesai diinstal" | `google-api-python-client` belum terpasang | Jalankan `uv sync` |
| Port 8000 / 5173 sudah dipakai | Server lama masih berjalan | Tutup terminal lama, atau cek dengan `netstat -ano \| findstr :8000` lalu `taskkill /PID <pid> /F` |

---

## 8. Menghentikan Aplikasi

Tekan `Ctrl + C` di masing-masing terminal (backend dan frontend).
