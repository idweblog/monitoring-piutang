# 📜 Riwayat Versi & Log Perubahan Sistem (CHANGELOG)

Semua rilis penting untuk platform **Sistem Pelacakan & Monitoring Piutang Rekanan** akan didokumentasikan di bawah ini.

---

## [v1.11.0] - 9 Juni 2026 (Rilis Terbaru)

### ✨ Auto-suggest Pencarian & Urutan Kronologis Rencana Pembayaran (UX Improvements)
*   **Penyortiran Kronologis (Oldest First):**
    *   Daftar rencana pembayaran yang tersedia dalam Form Pembuatan Tagihan Baru kini secara otomatis diurutkan dengan rencana yang **paling lama** berada di paling atas, memperjelas skala prioritas jatuh tempo pencairan berikutnya.
*   **Mekanisme Pencarian Auto-suggest Pembayaran:**
    *   Menambahkan bilah pencarian dinamis (autocomplete/auto-suggest) di atas daftar rencana pembayaran. Pengguna dapat mengetik nama rekanan/supplier, kategori anggaran, tanggal, atau isi catatan untuk memunculkan saran yang sesuai secara real-time.
    *   Mengintegrasikan fungsionalitas di mana memilih item dari daftar auto-suggest akan secara otomatis menautkannya, disandingkan dengan pilihan manual via checkbox konvensional.

---

## [v1.10.0] - 9 Juni 2026

### ✨ Seleksi Multi-item: Hapus Seleksi & Ubah Kategori Massal
*   **Seleksi Multi-item untuk Peran Khusus:**
    *   Pengguna dengan peran **Supervisor Keuangan** & **Administrator** kini memiliki kemampuan untuk melakukan seleksi multi-item (multi-select check) pada rencana pembayaran aktif maupun draf yang terdaftar.
*   **Tindakan Massal Operasional (Bulk Action panel):**
    *   **Ubah Kategori Secara Serentak:** Memungkinkan penetapan Kategori Anggaran baru secara massal bagi seluruh rencana pembayaran yang tercentang sekaligus.
    *   **Hapus Sekaligus (Bulk Delete):** Mempermudah pembersihan data atau draf yang salah pendaftaran secara serentak dengan sekali konfirmasi aman.

---

## [v1.9.0] - 9 Juni 2026

### ✨ Persetujuan Massal (Bulk Approval) & Optimalisasi Dialog Simpan
*   **Persetujuan Massal (Bulk Approval):**
    *   Pengguna dengan peran berwenang (Direktur Utama & Admin) kini dapat memilih beberapa rencana pembayaran berstatus **Draft** sekaligus lewat kotak centang (checkbox).
    *   Menambahkan tombol **"SETUJUI SEKALIGUS"** untuk melakukan persetujuan massal pada seluruh draf yang terpilih, menyelesaikan proses persetujuan dengan sekali klik.
*   **Penghilangan Dialog Popup Simpan:**
    *   Sesuai umpan balik optimasi, dialog popup `alert` pemberitahuan sukses menyimpan draf telah dihilangkan untuk memperlancar transisi pengisian draf secara beruntun tanpa interupsi.

---

## [v1.8.0] - 9 Juni 2026

### ✨ Penyuntingan Draf Pembayaran & Opsi Batal Setuju (Unapprove) Rencana
*   **Penyuntingan Draf Pembayaran sebelum Disetujui:**
    *   Pengguna dengan peran hak akses yang berwenang (Supervisor Keuangan Umum & Admin) kini dapat menyunting seluruh rincian Rencana Pembayaran (rekanan, metode, kategori, jumlah, tgl bayar, & catatan) selama statusnya masih berupa **Draft** (sebelum disetujui Direktur).
    *   Formulir input pembayaran akan terisi secara otomatis dan mengganti tajuk formulir secara dinamis menjadi mode pengeditan saat tombol "EDIT DRAF" ditekan.
*   **Pembatalan Persetujuan Direktur (Unapprove Action):**
    *   Menambahkan opsi tombol **"BATALKAN PERSETUJUAN (UNAPPROVE)"** bagi peran Direktur Utama / Administrator pada rencana pembayaran yang berstatus **Aktif (Telah Disetujui)** namun belum ditarik menjadi kaitan Daftar Tagihan (Invoice / `hasInvoice === false`).
    *   Menekan tombol pembatalan akan menurunkan status pembayaran kembali secara aman menjadi **Draft**, menghapus riwayat metadata persetujuan sebelumnya, mengirimkan notifikasi sistem, dan mengizinkan pengeditan ulang jika terjadi kesalahan draf pengajuan awal.

---

## [v1.7.0] - 8 Juni 2026

### ✨ Kategori Kustom, Filter Lanjutan, & Ekspor Excel/CSV Ter-filter
*   **Manajemen Kategori Anggaran Kustom:**
    *   Pihak Admin kini dapat menambah, mengedit, dan menghapus kategori pembayaran (seperti Pemasaran, SDM, Humas, Operasional, dll.) secara dinamis melalui menu Pengaturan baru yang bernama "Manajemen Kategori".
    *   Kategori terpilih dapat langsung ditentukan saat menyusun Rencana Pembayaran rekanan baru.
*   **Saringan Multi-Kriteria Tingkat Lanjut (Advanced Filters):**
    *   Mengintegrasikan filter yang andal pada baris Daftar Rencana Pembayaran maupun Daftar Tagihan (Invoice / Piutang).
    *   Pengguna dapat menyaring, mencari, dan mengelompokkan data berdasarkan rentang awal s.d. akhir tanggal, filter kategori spesifik, serta pencarian kata kunci yang fleksibel.
*   **Ekspor Laporan CSV Cerdas (Dukungan Excel):**
    *   Menambahkan tombol "Ekspor ke Excel / CSV" di kedua modul pembayaran dan invoice.
    *   Ekstraksi data yang diunduh secara cerdas menyesuaikan dengan saringan (filter) yang aktif di layar saat itu juga.
    *   Format data yang aman dengan UTF-8 BOM agar langsung kompatibel dibuka di Microsoft Excel tanpa masalah karakter spesial.

---

## [v1.6.1] - 8 Juni 2026

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
