# Panduan Pengujian Fitur Antarmuka Streamlit (Pertamina AI Assistant)

Dokumen ini merupakan panduan pengujian fitur (*feature testing guide*) menyeluruh untuk aplikasi antarmuka **Streamlit** ([streamlit_app.py](streamlit_app.py)). Panduan ini mencakup checklist pengujian manual (*manual test matrix*), skenario uji langkah demi langkah, pengujian otomatis (*automated unit testing*), dan penanganan masalah umum (*troubleshooting*).

---

## 📋 Daftar Isi
1. [Prasyarat & Persiapan Lingkungan](#1-prasyarat--persiapan-lingkungan)
2. [Cara Menjalankan Streamlit App](#2-cara-menjalankan-streamlit-app)
3. [Matriks Pengujian Fitur (Manual Testing)](#3-matriks-pengujian-fitur-manual-testing)
   - [A. Manajemen Sesi Percakapan (Thread Management)](#a-manajemen-sesi-percakapan-thread-management)
   - [B. 💬 Chatbot AI & RAG Knowledge Retrieval](#b--chatbot-ai--rag-knowledge-retrieval)
   - [C. Pratinjau & Ekspor Dokumen RKS (.docx)](#c-pratinjau--ekspor-dokumen-rks-docx)
   - [D. 📑 Dokumen Tender Generator](#d--dokumen-tender-generator)
   - [E. 📝 Dokumen Amendemen Generator](#e--dokumen-amendemen-generator)
   - [F. 📚 Gudang Dokumen (Library Catalog)](#f--gudang-dokumen-library-catalog)
   - [G. ☁️ Integrasi Google Drive Knowledge Base](#g-️-integrasi-google-drive-knowledge-base)
4. [Pengujian Otomatis (Automated Unit & Regression Tests)](#4-pengujian-otomatis-automated-unit--regression-tests)
5. [Troubleshooting & Solusi Kendala Pengujian](#5-troubleshooting--solusi-kendala-pengujian)

---

## 1. Prasyarat & Persiapan Lingkungan

Sebelum memulai pengujian, pastikan:
1. **Python 3.12+** dan tool manager `uv` telah terpasang.
2. File konfigurasi `.env` di root direktori telah terisi dengan kunci yang valid:
   ```env
   OPENROUTER_API_KEY="sk-or-v1-..."
   TAVILY_API_KEY="tvly-..."
   DATABASE_URL="postgresql://user:password@localhost:5432/langchain"
   # atau parameter PGVector host:
   PGVECTOR_HOST="127.0.0.1"
   PGVECTOR_PORT=5432
   PGVECTOR_DB="langchain"
   PGVECTOR_USER="langchain"
   PGVECTOR_PASSWORD="langchain"
   ```
3. Database PostgreSQL lokal atau Supabase aktif dan tabel `documents`, `chat_threads`, `chat_messages` dapat diakses.

---

## 2. Cara Menjalankan Streamlit App

Jalankan perintah berikut di terminal:

```powershell
uv run streamlit run streamlit_app.py
```
> Atau tentukan port spesifik jika diperlukan:
> ```powershell
> uv run streamlit run streamlit_app.py --server.port 8501
> ```

Buka peramban (*browser*) Anda pada tautan: **`http://localhost:8501`**.

---

## 3. Matriks Pengujian Fitur (Manual Testing)

### A. Manajemen Sesi Percakapan (Thread Management)

| ID Uji | Fitur / Skenario | Langkah Pengujian | Ekspektasi Hasil |
| :--- | :--- | :--- | :--- |
| **TC-TH-01** | Membuat Sesi Percakapan Baru | Klik tombol **`➕ New Chat`** pada sidebar kiri. | Sesi percakapan baru dibuat dengan judul otomatis default, area chat bersih dari pesan lama, dan parameter URL `?chat_thread=<id>` diperbarui. |
| **TC-TH-02** | Memilih Percakapan Sebelumnya | Klik salah satu judul percakapan di daftar **`Recent Conversations`**. | Riwayat pesan obrolan sebelumnya termuat kembali dengan urutan waktu yang tepat. |
| **TC-TH-03** | Mengubah Nama Percakapan (*Rename Session*) | Buka expander **`Pengaturan Tambahan`** > **`⚙️ Current Session Settings`**, ubah input teks pada *Rename Session*, lalu klik **`Save Name`**. | Judul percakapan pada sidebar langsung diperbarui dan tersimpan permanen di database. |
| **TC-TH-04** | Menghapus Sesi Percakapan | Klik tombol silang **`✕`** di samping judul thread pada sidebar atau tombol **`🗑️ Delete Session`**. Konfirmasi di dialog modal. | Sesi percakapan terhapus dari daftar dan database. Jika sesi yang aktif dihapus, aplikasi otomatis mengarahkan ke sesi baru. |
| **TC-TH-05** | Persistensi Riwayat Obrolan | Kirim beberapa pesan, lalu lakukan *refresh* halaman browser (F5). | Pesan, status tool, dan dokumen yang dihasilkan tetap utuh tidak hilang. |

---

### B. 💬 Chatbot AI & RAG Knowledge Retrieval

Pastikan menu radio navigasi berada pada pilihan **`💬 Chatbot & RKS Viewer`**.

| ID Uji | Fitur / Skenario | Input / Prompt Uji | Ekspektasi Hasil |
| :--- | :--- | :--- | :--- |
| **TC-CB-01** | Tanya Jawab Regulasi Spesifik (RAG Clause Retrieval) | *"Berapa lama masa sanggah untuk tender pekerjaan konstruksi sesuai pedoman pengadaan?"* | 1. Agen memanggil tool `fetch_relevant_documents`.<br>2. Jawaban menyertakan rujukan dokumen resmi (`📄 Dokumen: ...`).<br>3. Jawaban menyertakan batas waktu sanggahan yang terstruktur dan objektif. |
| **TC-CB-02** | Pengambilan Dokumen Utuh | *"Tolong tampilkan draf RKS untuk pekerjaan overhaul tangki 041T304"* | 1. Agen memanggil tool `fetch_full_documents` atau `create_rks_document`.<br>2. Struktur bab RKS (Umum, Lingkup, Spesifikasi, Waktu) ditampilkan lengkap. |
| **TC-CB-03** | Pencarian Informasi Eksternal (Web Search) | *"Berapa harga acuan baja ASTM A36 terkini di pasar?"* | 1. Agen memanggil tool `search_tool` (Tavily).<br>2. Menampilkan informasi relevan bersumber dari pencarian internet terkini. |
| **TC-CB-04** | Inspeksi Eksekusi Tool (*Tool Call Trace*) | Kirim prompt yang memicu tool, lalu klik expander status tool di bawah pesan. | Rincian argumen pemanggilan tool dan respons mentah (*payload*) dapat diinspeksi dengan rapi tanpa error. |

---

### C. Pratinjau & Ekspor Dokumen RKS (.docx)

| ID Uji | Fitur / Skenario | Langkah / Prompt Uji | Ekspektasi Hasil |
| :--- | :--- | :--- | :--- |
| **TC-EX-01** | Konversi Dokumen via Perintah Chat | Masukkan prompt: *"Tolong konversikan dokumen RKS tadi ke format Microsoft Word (.docx)"* | 1. Agen memanggil tool `convert_pdf_to_docx`.<br>2. Muncul **Kartu Unduh Berkas** resmi dengan nama file `.docx` dan tombol **`📥 Unduh File Word (.docx)`** yang berfungsi mengunduh dokumen. |
| **TC-EX-02** | Tab Pratinjau Halaman Dokumen RKS | Saat dokumen RKS dibuat atau ditarik, periksa tab pratinjau halaman visual di bawah pesan atau di panel samping. | Gambar pratinjau halaman (*preview rendering*) tertampil jelas dengan nomor halaman yang dapat dinavigasikan. |
| **TC-EX-03** | Verifikasi Format Dokumen Word (.docx) | Buka berkas `.docx` yang telah diunduh menggunakan Microsoft Word atau LibreOffice. | Dokumen memiliki: Cover resmi Pertamina, Lembar Pengesahan, Daftar Isi otomatis, dan penomoran bab/pasal yang rapi. |

---

### D. 📑 Dokumen Tender Generator

Ubah menu navigasi radio pada sidebar menjadi **`📑 Dokumen Tender Generator`**.

| ID Uji | Fitur / Skenario | Langkah Pengujian | Ekspektasi Hasil |
| :--- | :--- | :--- | :--- |
| **TC-TG-01** | Ekstraksi Konteks Dokumen RKS & BoQ | 1. Unggah file contoh RKS (`.pdf`) pada bagian *Unggah Dokumen Acuan*.<br>2. Unggah file BoQ (`.xlsx` / `.pdf`).<br>3. Klik **`🔍 Ekstrak Data Tender`**. | Kolom formulir seperti *Nama Pengadaan*, *Prime Cost*, *Total Biaya*, dan *Kategori CSMS* terisi secara otomatis dari hasil ekstraksi file. |
| **TC-TG-02** | Pengisian Manual Data Tender | Isi/sesuaikan data: Nomor Tender, Pejabat Berwenang, TKDN Minimal (misal `30%`), Tanggal Pre-bid, dan Tempat Aanwijzing. | Input tersimpan pada state formulir tanpa ter-reset saat berpindah tab. |
| **TC-TG-03** | Generate Dokumen Tender Lengkap | Klik tombol **`⚡ Generate Dokumen Tender`**. | 1. Sistem memproses penyusunan dokumen tender (IKPP 40 butir, 30 artikel ketentuan umum, Lampiran 2A evaluasi teknis, evaluasi CSMS, dan 18 pasal rancangan kontrak).<br>2. Tampil ringkasan berhasil serta tombol **Unduh Dokumen Tender (.docx)**. |
| **TC-TG-04** | Validasi Unduhan Dokumen Tender | Klik tombol unduh berkas tender yang dihasilkan. | File Word berukuran normal terunduh, dapat dibuka, dan memuat format kontrak SP3MK resmi. |

---

### E. 📝 Dokumen Amendemen Generator

Ubah menu navigasi radio pada sidebar menjadi **`📝 Dokumen Amendemen Generator`**.

| ID Uji | Fitur / Skenario | Langkah Pengujian | Ekspektasi Hasil |
| :--- | :--- | :--- | :--- |
| **TC-AG-01** | Pemilihan Kontrak Acuan | Pilih salah satu kontrak dari daftar kontrak yang tersimpan atau masukkan data kontrak dasar. | Rincian nomor kontrak awal, nilai kontrak awal, dan jangka waktu awal termuat. |
| **TC-AG-02** | Penentuan Klausul Perubahan | Masukkan justifikasi perubahan (misal: perpanjangan waktu 30 hari kalender karena *force majeure* atau penyesuaian volume pekerjaan). | Kolom pokok-pokok amandemen terdefinisi dengan jelas. |
| **TC-AG-03** | Ekspor Berkas Amandemen | Klik tombol **`Generate Dokumen Amendemen`**. | Menghasilkan berkas amandemen formal format `.docx` dengan lembar evaluasi dan justifikasi teknis. |

---

### F. 📚 Gudang Dokumen (Library Catalog)

Akses melalui expander atau menu Gudang Dokumen di sidebar.

| ID Uji | Fitur / Skenario | Langkah Pengujian | Ekspektasi Hasil |
| :--- | :--- | :--- | :--- |
| **TC-LB-01** | Gudang RKS (*RKS Library*) | Buka tampilan **Gudang RKS**. | Menampilkan daftar seluruh dokumen RKS acuan, status ekstraksi, jumlah halaman, dan tombol unduh/pratinjau. |
| **TC-LB-02** | Gudang Kontrak & Amendemen | Buka tampilan **Gudang Kontrak** / **Gudang Amendemen**. | Riwayat kontrak dan draf amandemen yang pernah dibuat tersimpan rapi dan dapat diunduh ulang kapan saja. |

---

### G. ☁️ Integrasi Google Drive Knowledge Base

Buka expander **`Pengaturan Tambahan`** > **`☁️ Integrasi Google Drive (RKS Knowledge Base)`** pada sidebar kiri.

| ID Uji | Fitur / Skenario | Langkah Pengujian | Ekspektasi Hasil |
| :--- | :--- | :--- | :--- |
| **TC-GD-01** | Cek Status Autentikasi Akun | Perhatikan indikator koneksi akun Google. | Tertampil badge status hijau **`🟢 Terhubung: <email_google>`** jika kredensial `credentials.json` dan `token.json` valid. |
| **TC-GD-02** | Input Folder ID / URL Google Drive | Masukkan URL atau ID folder Google Drive yang berisi berkas acuan RKS (misal: `1pnz9oBwHcE_mdU0PQnl7j4NoO0LFt8bd`). | Input tersimpan dan menampilkan total berkas yang terdeteksi di folder tersebut. |
| **TC-GD-03** | Eksekusi Smart Delta Sync | Klik tombol **`🔄 Sinkronkan Sekarang`**. | 1. Menampilkan spinner progres sinkronisasi.<br>2. Menampilkan 4 metrik hasil: *File Baru*, *Diperbarui*, *Dihapus*, *Tidak Berubah*.<br>3. File PDF/DOCX baru otomatis terindeks ke PostgreSQL PGVector. |

---

## 4. Pengujian Otomatis (Automated Unit & Regression Tests)

Proyek ini telah dilengkapi dengan unit test berbasis `unittest` dan `streamlit.testing.v1.AppTest` untuk menguji fungsionalitas rendering dan regresi tanpa perlu membuka browser secara manual.

### Menjalankan Seluruh Automated Test Suite:
```powershell
uv run python -m unittest discover tests -v
```

### Menjalankan Uji Regresi Panel Chat & Pratinjau:
```powershell
uv run python -m unittest tests/test_rks_chat.py -v
```

### Menjalankan Uji Modul Generator RKS & Pencarian Vektor:
```powershell
uv run python -m unittest tests/test_rks.py tests/test_rks_search.py -v
```

> **Cakupan Pengujian Otomatis:**
> * `test_rks_chat.py`: Memastikan bahwa artefak tool pembuatan RKS tidak tertutup oleh teks ringkasan model, penanganan kapasitas penyimpanan disk, dan validasi sumber dokumen lama tidak tertukar.
> * `test_rks.py`: Validasi pipeline ekstraksi teks terstruktur, penomoran pasal, dan formatting blok tabel.
> * `test_rks_search.py`: Validasi pencarian semantik dan threshold skor relevansi dokumen.

---

## 5. Troubleshooting & Solusi Kendala Pengujian

| Masalah yang Sering Ditemui | Kemungkinan Penyebab | Langkah Solusi |
| :--- | :--- | :--- |
| **Chatbot berputar lama / timeout** | Kunci API OpenRouter habis kuota atau model LLM mengalami latensi tinggi. | Periksa saldo OpenRouter di `openrouter.ai` atau ganti `LLM_MODEL_NAME` pada [config.py](config.py) ke model alternatif. |
| **Error database: `FATAL: password authentication failed`** | Konfigurasi `DATABASE_URL` atau user/password PGVector di `.env` tidak sesuai. | Sesuaikan kredensial di file `.env` dengan PostgreSQL lokal atau gunakan URL Supabase Pooler. |
| **Google Drive: `Pustaka Google API belum terpasang`** | Paket `google-api-python-client` atau `google-auth-oauthlib` belum ada. | Jalankan `uv pip install google-api-python-client google-auth-oauthlib google-auth-httplib2`. |
| **Tombol unduh Word (.docx) tidak menghasilkan file** | Folder `./output` belum memiliki izin tulis atau direktori belum dibuat. | Sistem otomatis membuat folder `output/`. Pastikan tidak ada file Word dengan nama yang sama sedang terbuka di aplikasi desktop. |
| **Gagal ekstraksi file BoQ Excel (.xlsx)** | Format tabel BoQ memiliki format merge cell yang sangat kompleks. | Pastikan file BoQ mencantumkan baris header standar (*Uraian Pekerjaan*, *Volume*, *Satuan*, *Harga Satuan*, *Total*). |

---

*Panduan pengujian ini dirancang khusus untuk memastikan keandalan, akurasi regulasi, dan kestabilan aplikasi Streamlit Pertamina AI.*
