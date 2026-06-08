# 📜 Riwayat Versi & Log Perubahan Sistem (CHANGELOG)

Semua rilis penting untuk platform **Sistem Pelacakan & Monitoring Piutang Rekanan** akan didokumentasikan di bawah ini.

---

## [v1.6.1] - 8 Juni 2026 (Rilis Terbaru)

### 🔧 Perbaikan Integrasi & Diagnostik Firebase
*   **Akurasi Deteksi Koneksi Firebase:**
    *   Memperbaiki deteksi koneksi Firebase dengan memanfaatkan pembacaan standar `import.meta.env` untuk menghindari kendala pembacaan konfigurasi environment pada browser.
*   **Restorasi & Penyelarasan Logika Self-Healing:**
    *   Mengoptimalkan mekanisme penanganan mandiri (*self-healing*) agar secara cerdas mendeteksi dan mengunggah akun pengguna bawaan (default users) yang hilang atau terhapus secara parsial ke Firestore, alih-alih hanya berjalan saat database kosong sepenuhnya.

---

## [v1.6.0] - 8 Juni 2026

### ✨ Fitur Baru & Peningkatan Cerdas
*   **Dukungan Pembuatan Tagihan Multi-Reference (Multi List):**
    *   Sekarang admin/staf dapat menyeleksi beberapa (multi-select) rencana pembayaran rekanan sekaligus untuk digabungkan menjadi satu tagihan (invoice) tunggal kepada customer.
*   **Kalkulasi & Rangkuman Otomatis:**
    *   Sistem secara otomatis menjumlahkan pengeluaran riil rekanan yang digabung, memberikan visualisasi ringkas daftar plan terkait, serta menghitung estimasi keuntungan kotor (margin) berdasarkan gabungan modal tersebut secara real-time.
*   **Proporsionalitas Rincian Invoice:**
    *   Jika invoice terhubung ke beberapa rencana pembayaran rekanan, struk cetak / pratinjau invoice akan membagi rincian tagihan secara proporsional berdasarkan porsi modal masing-masing vendor pendukung secara otomatis.

---

## [v1.5.0] - 2 Juni 2026

### ✨ Fitur Baru & Peningkatan Cerdas
*   **Otomatisasi Pilihan Metode Pembayaran dari Rekening Kas:**
    *   Setiap kali Anda menambahkan, mengubah, atau menghapus Rekening Bank/Akun Kas Perusahaan di menu Pengaturan, daftar alternatif metode pembayaran pada entri transaksi akan otomatis tersinkronisasi secara real-time.
    *   Akun dengan tipe **"Kas"** otomatis terhubung ke metode pembayaran **"Tunai"**.
    *   Akun dengan tipe bank/rekening transfer nirkabel lainnya (e.g. BCA, Mandiri, BRI, BNI) langsung diubah formatnya menjadi metode pembayaran terstruktur seperti *"Transfer BCA"*, *"Transfer Mandiri"*, dll.
*   **Rekonsiliasi & Penambahan Saldo Otomatis dari Pelunasan:**
    *   Ketika sebuah berkas tagihan (Invoice) ditandai lunas oleh administrator/operator, sistem kini otomatis menghitung, mentransfer, dan menambahkan total nominal bersih pelunasan tersebut ke dalam saku saldo rekening tujuan yang tepat di dalam **Modul Kas Perusahaan**.
    *   Menghasilkan log pencatatan harian otomatis (*auto-generated daily cash logging*) dengan detail nomor tagihan yang lunas demi auditabilitas penuh keuangan internal.
*   **Perbaikan Fungsi Reset & Pembersihan Data Transaksi:**
    *   Memperbaiki bug pada tombol **"Reset & Muat Contoh Data Bawaan"** serta **"Kosongkan Seluruh Data Transaksi"**. Keduanya kini berfungsi 100% andal, aman, dan lancar dalam mereset seluruh koleksi dokumen di Firebase Firestore tanpa menyebabkan kebocoran sesi pengguna/role administrator aktif.
*   **Peningkatan Kenyamanan Visual (Font Sizing Optimization):**
    *   Meningkatkan ukuran font dasar global sistem dari `14.5px` menjadi `16px` yang rill untuk kenyamanan membaca angka, data tagihan piutang, dan analisis grafik berjam-jam tanpa ketegangan mata.

---

## [v1.4.0] - 31 Mei 2026

### 🛡️ Keamanan & Onboarding Mandiri
*   **Inisialisasi Onboarding Tanpa Reset Sesi:** Menghapus prosedur auto-reset menggunakan data simulasi dummy ketika sistem dideploy ulang atau disinkronkan ke repositori baru.
*   **Firebase Authentication Terintegrasi:** Dukungan penuh Google Sign-In menggunakan interaksi pop-up bawaan Firebase untuk kemudahan login admin, operator, maupun supervisor keuangan.
*   **Dapur Onboarding Mandiri:** Menyediakan alur inisiasi database bersih (*Clean onboarding floor*) bagi admin pertama ketika mendeteksi database Firestore masih kosong, tanpa wajib memuat dataset simulasi.

---

## [v1.3.0] - 15 Mei 2026

### 💼 Kelola Keuangan & PWA Kustom
*   **Multi-Akun Kas & Rekening Bank:** Pencatatan mutasi transaksi keuangan terpisah untuk Kas Utama Korporasi, Bank Mandiri, Bank BCA, Bank BNI, dan Bank BRI.
*   **Custom Branding & Logo Suite:** Pengaturan nama PWA (*Progressive Web App*) korporasi secara instan disertai modul pemilihan alternatif logo vektor SVG premium yang super tajam.

---

## [v1.2.0] - 28 April 2026

### 📈 Fleksibilitas Operasional
*   **Manajemen Rekanan (Vendoring):** Tambah, edit, dan hapus nama rekanan/vendor terdaftar langsung dari panel pengaturan administrasi.
*   **Kustomisasi Posisi Pelacakan berkas:** Pengaturan 5 tahapan pelacakan progres fisik tagihan piutang menyesuaikan Standard Operating Procedure (SOP) internal usaha.

---

## [v1.1.0] - 10 April 2026

### 📊 Analitik Tingkat Lanjut & Notifikasi
*   **Dashboard Aging AR (Analisis Umur Piutang):** Pengelompokan umur piutang interaktif (kategori lancar, kurang lancar, diragukan, macet) lengkap dengan analisis grafik lingkaran dan rekomendasi penagihan otomatis.
*   **Sistem Notifikasi Tenggat:** Notifikasi bar di pojok atas memperingatkan tagihan-tagihan penting yang memiliki jatuh tempo kurang dari 3 hari (H+3).

---

## [v1.0.0] - 20 Maret 2026

### 🚀 Sistem Inti (Core Engine)
*   **Modul Penagihan Utama:** Pencatatan draf pembayaran rekanan, invoice tagihan fisik, dan rekaman status logs progres berkas penagihan.
*   **Struktur Multi-otoritas (User Sign-In):** Simulasi 3 tingkatan hak akses yang berbeda: *Supervisor Keuangan*, *Staf Admin*, dan *Direktur* untuk verifikasi otorisasi persetujuan.
