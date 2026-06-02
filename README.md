# 📈 Sistem Pelacakan & Monitoring Piutang Rekanan (PWA-Enabled)

**Versi Terkini:** `v1.5.0` (Rilis 2 Juni 2026 - Klik [CHANGELOG.md](./CHANGELOG.md) untuk melihat riwayat log perubahan lengkap).

Sistem Pelacakan Piutang Rekanan adalah platform aplikasi web modern (Single Page Application) yang dibangun menggunakan **React**, **TypeScript**, **Vite**, dan **Tailwind CSS**. Aplikasi ini secara khusus didesain untuk membantu pelaku usaha/perusahaan memantau, mencatat, dan mengelola posisi saldo piutang berjalan dari para customer/rekanan secara cepat, aman, dan fleksibel.

Dengan integrasi **PWA (Progressive Web App)** penuh, aplikasi ini dapat diinstal langsung ke layar utama (*Home Screen*) smartphone maupun komputer Anda tanpa melalui App Store atau Play Store—serta mendukung penggunaan secara **Offline** melalui optimalisasi *Service Worker caching*.

---

## ✨ Fitur-Fitur Utama

### 📊 1. Dashboard Eksklusif & Analisis Umur Piutang (Aging AR)
*   **KPI Finansial Real-time:** Menampilkan total piutang berjalan (*outstanding*), rasio penagihan (*collection rate*), dan total penerimaan kas terkonsolidasi harian/bulanan.
*   **Struktur Aging of Accounts Receivable:** Pengelompokan umur piutang dinamis yang diperbarui secara otomatis berdasarkan hari jatuh tempo:
    *   *Belum Jatuh Tempo*
    *   *Sangat Lancar (1 - 30 Hari)*
    *   *Kurang Lancar (31 - 60 Hari)*
    *   *Diragukan (61 - 90 Hari)*
    *   *Macet (90+ Hari)*
*   **Visualisasi Grafik:** Bar charts interaktif untuk mempermudah pimpinan dalam menilai kesehatan likuiditas keuangan korporat.

### 📝 2. Manajemen Invoice & Faktur
*   Pencatatan invoice lengkap beserta nomor tagihan, nama debitur/customer, tanggal terbit, dan tanggal jatuh tempo.
*   Klasifikasi status penagihan (*Belum Lunas*, *Lunas sebagian*, *Lunas*, atau *Terlambat*).
*   Fitur pelacakan riwayat aktivitas pembayaran (*activity log*) untuk masing-masing berkas invoice fisik yang disimpan.

### 💳 3. Modul Pembayaran & Manajemen Kas
*   Pencatatan kas masuk terperinci yang langsung terintegrasi dengan invoice terkait.
*   Dukungan mutasi multidompet (Kas Utama, Bank Mandiri, Bank BCA, dll.) untuk mempermudah rekonsiliasi dana piutang yang telah tertagih.

### 🎨 4. Custom Branding & PWA Center
*   **Pilihan Logo Alternatif:** Tersedia 3 opsi logo SVG premium yang tajam dan responsif (e.g., *Emerald Growth Flow*, *Treasury Vault Lock*, *Neon Interlocking MP*).
*   **Kustomisasi Nama Aplikasi:** Ubah Full Name & Short Name PWA Anda langsung melalui menu pengaturan untuk disesuaikan dengan identitas perusahaan Anda.
*   **Simulasi Multiperangkat:** Pratinjau (*mockup visual*) sebelum memasang aplikasi di HP (Simulator iOS/Android) atau Web Browser.

### 💾 5. Backup & Restore Mandiri
*   Ekspor seluruh berkas riwayat invoice, pembayaran, kas, dan identitas perusahaan secara instan dalam format `.json`.
*   Pulihkan atau pindahkan seluruh data piutang antarperangkat secara aman dengan mengunggah kembali file cadangan Anda.

---

## 🛠️ Stack Teknologi (Tech Stack)

Sistem ini didukung oleh ekosistem developer modern berkinerja tinggi:

1.  **Frontend Core:** [React 18](https://react.dev/) & [TypeScript](https://www.typescriptlang.org/) untuk kode yang terstruktur rapi dan aman (*type-safe*).
2.  **Styles & UI:** [Tailwind CSS Custom Theme](https://tailwindcss.com/) & [Lucide React](https://lucide.dev/) untuk ikon-ikon vektor vektor monokromatik modern.
3.  **Build Tool:** [Vite](https://vite.dev/) untuk proses *compilation* secepat kilat.
4.  **PWA Core:** *Custom manifest mapping* dinamis melalui `Blob URL Engine` untuk mendukung kustomisasi logo/nama on-the-fly, dipasangkan dengan `Service Worker` (`sw.js`) untuk kemudahan akses offline.

---

## 🚀 Panduan Memasang/Menjalankan Secara Lokal

Pastikan Anda telah memasang **Node.js (versi 18+)** di sistem Anda sebelum memulai.

### 1. Klon Repositori
```bash
git clone https://github.com/USERNAME/NAMA-REPOSITORI.git
cd NAMA-REPOSITORI
```

### 2. Instal Dependensi
```bash
npm install
```

### 3. Masukkan Environment Variables
Salin file konfigurasi awal `.env.example` menjadi `.env`:
```bash
cp .env.example .env
```

### 4. Jalankan Server Pengembangan (Dev Modes)
```bash
npm run dev
```
Aplikasi akan otomatis berjalan pada server lokal Anda di http://localhost:3000.

### 5. Bangun untuk Produksi (Build Production Bundle)
Untuk menghasilkan kumpulan file produksi statis yang super dioptimasi di folder `dist/`:
```bash
npm run build
```

---

## 📱 Panduan Instalasi PWA (Di Layar Utama HP)

###  iOS (iPhone Safari)
1. Buka browser **Safari** pada iPhone Anda dan kunjungi halaman aplikasi ini.
2. Ketuk ikon **Bagikan (Share)** di bagian bawah bar menu Safari.
3. Gulir ke bawah lalu pilih menu **"Tambahkan ke Layar Utama" (Add to Home Screen)**.
4. Sesuaikan nama aplikasi di bawah ikon, lalu ketuk **Tambah (Add)** di sudut kanan atas.

### 🤖 Android (Google Chrome)
1. Buka browser **Google Chrome** di HP Android Anda, masuk ke link sistem penagihan.
2. Klik tombol menu **Tiga Titik** di kanan atas layar browser Chrome.
3. Pilih opsi **"Instal Aplikasi"** atau **"Tambahkan ke Layar Utama"**.
4. Konfirmasi penginstalan. Ikon aplikasi akan langsung muncul di jajaran menu utama ponsel Anda.

---

## 📜 Lisensi & Kontribusi
Projek ini dibuat untuk mempermudah proses administrasi kepatuhan pembukuan korporasi. Kontribusi pengembangan sangat terbuka lebar melalui mekanisme standard *Pull Request* (PR) di Github! 
