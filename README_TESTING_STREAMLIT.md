# Panduan Pengujian Fitur Antarmuka Streamlit (Pertamina AI Assistant)

Panduan ini ditujukan untuk pengujian fitur (*User Acceptance Testing* / UAT) pada aplikasi web antarmuka **Streamlit** yang telah aktif dan ter-deploy di cloud. **Seluruh pengujian dilakukan langsung melalui peramban web (*browser*) tanpa perlu menjalankan perintah terminal apa pun.**

---

## 🌐 Tautan Akses Pengujian

Buka peramban (*Google Chrome, Microsoft Edge, Firefox, atau Safari*) dan akses tautan berikut:

🔗 **[https://pertaminachatbot-enawev7dvaq8t6sj79yrba.streamlit.app/?chat_thread=thread_745384a2dfb04f0598b3ac96e3be716c](https://pertaminachatbot-enawev7dvaq8t6sj79yrba.streamlit.app/?chat_thread=thread_745384a2dfb04f0598b3ac96e3be716c)**

---

## 📋 Daftar Skenario Pengujian Fitur

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                             NAVIGASI UTAMA                                 │
│  ├─ 💬 Chatbot & RKS Viewer                                                │
│  ├─ 📑 Dokumen Tender Generator                                            │
│  └─ 📝 Dokumen Amendemen Generator                                         │
│                                                                             │
│  SIDEBAR:                                                                   │
│  ├─ ➕ New Chat & Recent Conversations                                      │
│  └─ ⚙️ Pengaturan Tambahan (Session Settings, Google Drive, Repo PDFs)      │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

### 1. Manajemen Sesi Percakapan (*Thread Management*)

Fitur ini berada pada **sidebar sebelah kiri**.

| No | Skenario Pengujian | Langkah Pengujian di Web | Ekspektasi Hasil | Status |
| :---: | :--- | :--- | :--- | :---: |
| **1.1** | **Membuat Percakapan Baru** | Klik tombol merah **`➕ New Chat`** di bagian atas sidebar. | Area chat dikosongkan untuk percakapan baru, URL otomatis mendapat `chat_thread` baru, dan sesi baru muncul di daftar *Recent Conversations*. | `[ ]` |
| **1.2** | **Berpindah Sesi Percakapan** | Klik salah satu judul percakapan pada daftar **`Recent Conversations`**. | Riwayat obrolan dari percakapan yang dipilih langsung termuat kembali dengan pesan dan dokumen sebelumnya tetap utuh. | `[ ]` |
| **1.3** | **Mengubah Nama Sesi (*Rename*)** | 1. Buka expander **`Pengaturan Tambahan`** di bawah sidebar.<br>2. Buka **`⚙️ Current Session Settings`**.<br>3. Ubah teks pada kolom *Rename Session* (misal: `Uji Coba Tender Tangki`).<br>4. Klik tombol **`Save Name`**. | Judul percakapan pada sidebar langsung berubah sesuai teks baru dan tersimpan secara permanen. | `[ ]` |
| **1.4** | **Menghapus Sesi Percakapan** | Klik tombol silang **`✕`** di samping nama percakapan pada sidebar, lalu konfirmasi penghapusan pada kotak dialog. | Sesi percakapan terhapus dari daftar. Halaman otomatis mengarahkan ke sesi aktif lainnya atau sesi baru. | `[ ]` |
| **1.5** | **Uji Persistensi Riwayat** | Kirim pesan dalam obrolan, lalu tekan tombol **Refresh browser (F5)**. | Seluruh pesan obrolan, draf dokumen, dan status tidak hilang setelah halaman dimuat ulang. | `[ ]` |

---

### 2. 💬 Chatbot AI & RAG Knowledge Retrieval

Pastikan menu navigasi radio di sidebar kiri memilih **`💬 Chatbot & RKS Viewer`**.

| No | Skenario Pengujian | Input / Prompt yang Dimasukkan | Ekspektasi Hasil | Status |
| :---: | :--- | :--- | :--- | :---: |
| **2.1** | **Tanya Regulasi Tertentu (RAG Retrieval)** | *"Berapa lama masa sanggah untuk tender pekerjaan konstruksi sesuai pedoman pengadaan Pertamina?"* | 1. Status agen menampilkan proses pemanggilan `fetch_relevant_documents`.<br>2. Jawaban menyertakan rujukan resmi dengan format `📄 Dokumen: Pedoman Pengadaan...`.<br>3. Jawaban terstruktur memuat batas waktu sanggahan yang akurat. | `[ ]` |
| **2.2** | **Penarikan Draf Dokumen RKS Utuh** | *"Tolong buatkan draf RKS untuk pekerjaan overhaul tangki 041T304"* | 1. Agen memanggil `fetch_full_documents` atau `create_rks_document`.<br>2. Draf struktur RKS ditampilkan lengkap (Lingkup Pekerjaan, Spesifikasi Teknis, Waktu Pelaksanaan). | `[ ]` |
| **2.3** | **Pencarian Informasi Eksternal / Umum** | *"Berapa estimasi harga acuan pelat baja ASTM A36 terkini di pasar?"* | 1. Agen memanggil tool pencarian `search_tool` (Tavily).<br>2. Menjawab informasi tren/harga pasar dengan menyertakan ringkasan data eksternal. | `[ ]` |
| **2.4** | **Inspeksi Detail Pemanggilan Tool** | Pada pesan jawaban chatbot yang menggunakan tool, klik expander detail tool (*misal: "⚡ Executed: fetch_relevant_documents"*). | Payload argumen masukan dan keluaran JSON dari tool dapat diinspeksi secara transparan tanpa error. | `[ ]` |

---

### 3. Pratinjau & Ekspor Dokumen RKS (.docx)

| No | Skenario Pengujian | Langkah Pengujian di Web | Ekspektasi Hasil | Status |
| :---: | :--- | :--- | :--- | :---: |
| **3.1** | **Konversi RKS ke Word via Chat** | Setelah draf RKS tampil di chat, kirim prompt:<br>*"Tolong ubah dokumen RKS tadi ke format Microsoft Word (.docx) agar bisa saya edit"* | 1. Agen menjalankan tool `convert_pdf_to_docx`.<br>2. Muncul **Kartu Unduh Berkas resmi Pertamina** di atas/di dalam pesan obrolan.<br>3. Terdapat tombol **`📥 Unduh File Word (.docx)`** yang langsung mengunduh file `.docx` ke komputer/perangkat Anda. | `[ ]` |
| **3.2** | **Pratinjau Halaman Visual RKS** | Saat dokumen RKS dibuat atau ditarik oleh chatbot, periksa tab pratinjau halaman di bawah respon atau di panel pratinjau. | Gambar pratinjau halaman visual tertampil jelas dengan nomor halaman yang dapat dinavigasikan (Halaman 1, 2, dst.). | `[ ]` |
| **3.3** | **Validasi Isi File Word Hasil Unduhan** | Buka berkas `.docx` yang telah diunduh menggunakan Microsoft Word, WPS Office, atau Google Docs. | Dokumen memiliki: Cover resmi berlogo Pertamina, Lembar Pengesahan Pejabat, Daftar Isi otomatis, dan struktur penomoran pasal/tabel yang rapi. | `[ ]` |
| **3.4** | **Shortcut Konversi PDF Gudang di Sidebar** | 1. Buka expander **`🔄 Convert Any Repository PDF`** di sidebar.<br>2. Pilih salah satu PDF dari dropdown (misal: `RKS-041T304...`).<br>3. Klik **`Open Conversion Popup`** lalu klik tombol proses. | Muncul modal konversi dan menyediakan tombol unduh berkas Word (.docx) secara instan. | `[ ]` |

---

### 4. 📑 Dokumen Tender Generator

Ubah pilihan radio navigasi di sidebar menjadi **`📑 Dokumen Tender Generator`**.

| No | Skenario Pengujian | Langkah Pengujian di Web | Ekspektasi Hasil | Status |
| :---: | :--- | :--- | :--- | :---: |
| **4.1** | **Ekstraksi Konteks Dokumen RKS & BoQ** | 1. Pada bagian *Unggah Dokumen Acuan*, unggah file contoh RKS (`.pdf`) atau pilih contoh yang tersedia.<br>2. Unggah file BoQ (`.xlsx` atau `.pdf`).<br>3. Klik tombol **`🔍 Ekstrak Data Tender`**. | Sistem otomatis mengisi kolom formulir: *Nama Pengadaan*, *Estimasi Nilai / Prime Cost*, *Total Biaya*, dan *Kategori Risiko CSMS*. | `[ ]` |
| **4.2** | **Kelengkapan Isian Formulir Tender** | Lengkapi/sesuaikan parameter proyek pada formulir:<br>- Nomor Tender: `TND-2026-TNK-001`<br>- TKDN Minimal: `30%`<br>- Pejabat Procurement & Pejabat Berwenang<br>- Jadwal Rapat Penjelasan (Pre-bid / Aanwijzing) | Seluruh input formulir tervalidasi dan siap untuk proses pembuatan dokumen lengkap. | `[ ]` |
| **4.3** | **Eksekusi Pembuatan Dokumen Tender** | Klik tombol utama berwarna merah: **`⚡ Generate Dokumen Tender`**. | 1. Sistem menjalankan AI generation untuk menyusun seluruh bagian tender sesuai pedoman pengadaan:<br>   - Instruksi Kepada Peserta Pengadaan (IKPP 40 butir)<br>   - Syarat Umum Pengadaan (30 artikel)<br>   - Lampiran 2A Matriks Evaluasi Teknis & CSMS<br>   - Rancangan Kontrak 18 pasal & format SP3MK.<br>2. Muncul kotak sukses dan tombol **`📥 Unduh Dokumen Tender (.docx)`**. | `[ ]` |
| **4.4** | **Penyimpanan Draf Tender** | Buka kembali menu ini setelah berpindah percakapan. | Isian formulir tender yang telah dibuat tetap tersimpan per percakapan dan tidak hilang. | `[ ]` |

---

### 5. 📝 Dokumen Amendemen Generator

Ubah pilihan radio navigasi di sidebar menjadi **`📝 Dokumen Amendemen Generator`**.

| No | Skenario Pengujian | Langkah Pengujian di Web | Ekspektasi Hasil | Status |
| :---: | :--- | :--- | :--- | :---: |
| **5.1** | **Pemilihan Kontrak Awal** | Pilih kontrak acuan dari dropdown kontrak atau masukkan nomor kontrak dasar (misal: `SP3MK-2026-001`). | Informasi dasar kontrak (pekerjaan, nilai awal, dan waktu pelaksanaan awal) termuat. | `[ ]` |
| **5.2** | **Penyusunan Klausul Perubahan** | Masukkan detail perubahan pada formulir:<br>- Justifikasi: Penambahan volume pekerjaan atau perpanjangan waktu kerja akibat kendala operasional lapangan.<br>- Penyesuaian Nilai/Jangka Waktu. | Pokok-pokok perubahan amandemen terangkum dalam format evaluasi formal. | `[ ]` |
| **5.3** | **Generate & Unduh Dokumen Amandemen** | Klik tombol **`Generate Dokumen Amendemen`**. | Menghasilkan dokumen Pokok-Pokok Amandemen Kontrak format `.docx` yang siap diunduh dan ditandatangani. | `[ ]` |

---

### 6. 📚 Gudang Dokumen (*Document Library*)

Akses menu gudang melalui tautan/tombol di sidebar atau navigasi aplikasi.

| No | Skenario Pengujian | Langkah Pengujian di Web | Ekspektasi Hasil | Status |
| :---: | :--- | :--- | :--- | :---: |
| **6.1** | **Gudang RKS (*RKS Library*)** | Buka tampilan **Gudang RKS**. | Menampilkan daftar seluruh dokumen RKS acuan, jumlah halaman, status kelengkapan, dan tombol unduh/pratinjau untuk setiap file. | `[ ]` |
| **6.2** | **Gudang Kontrak & Amendemen** | Buka tampilan **Gudang Kontrak** atau **Gudang Amendemen**. | Menampilkan riwayat berkas kontrak dan amandemen yang pernah dibuat di aplikasi, lengkap dengan tombol unduh ulang. | `[ ]` |

---

### 7. ☁️ Integrasi Google Drive Knowledge Base

Buka expander **`Pengaturan Tambahan`** > **`☁️ Integrasi Google Drive (RKS Knowledge Base)`** di sidebar sebelah kiri.

| No | Skenario Pengujian | Langkah Pengujian di Web | Ekspektasi Hasil | Status |
| :---: | :--- | :--- | :--- | :---: |
| **7.1** | **Pemeriksaan Status Koneksi Akun** | Perhatikan indikator akun Google. | Tertampil status aktif: **`🟢 Terhubung: nathanaelerens@student.ub.ac.id`**. | `[ ]` |
| **7.2** | **Konfigurasi Folder ID Google Drive** | Periksa kolom Folder ID Google Drive. | Terisi Folder ID default (`1pnz9oBwHcE_mdU0PQnl7j4NoO0LFt8bd`) dengan keterangan waktu sinkronisasi terakhir dan total file terdeteksi. | `[ ]` |
| **7.3** | **Eksekusi Sinkronisasi Delta Dokumen** | Klik tombol merah **`🔄 Sinkronkan Sekarang`**. | 1. Muncul spinner proses sinkronisasi dokumen dari Google Drive ke database.<br>2. Setelah selesai, tampil 4 kartu metrik hasil: *File Baru*, *Diperbarui*, *Dihapus*, *Tidak Berubah*.<br>3. Dokumen terbaru langsung tersedia untuk pencarian chatbot. | `[ ]` |

---

## 💡 Tips & Catatan Penting Saat Pengujian di Browser

1. **Waktu Respons AI (*Latency*)**:
   - Untuk pertanyaan regulasi singkat, respons biasanya selesai dalam 3–8 detik.
   - Untuk pembuatan Dokumen Tender lengkap (*40 butir IKPP + 30 artikel + 18 pasal kontrak*), LLM memerlukan waktu sekitar 20–45 detik karena menyusun naskah dokumen hukum puluhan halaman. Harap menunggu hingga indikator proses selesai.
2. **Pengunduhan File (.docx)**:
   - File yang diunduh langsung tersimpan ke folder *Downloads* di perangkat Anda melalui browser tanpa memerlukan aplikasi lokal tambahan.
3. **Penyimpanan Sesi Percakapan**:
   - Jika Anda ingin membagikan sesi obrolan yang sedang Anda uji kepada rekan tim, Anda cukup menyalin URL lengkap di bilah alamat browser (yang memuat parameter `?chat_thread=...`).
