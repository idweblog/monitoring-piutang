/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Payment, Invoice, InvoiceLog, AppNotification, CompanySettings, AppUser, DailyCashBalance } from './types';

export const DEFAULT_SETTINGS: CompanySettings = {
  namaPerusahaan: 'PT Sinergi Mandiri Utama',
  alamat: 'Jl. Jenderal Sudirman No. 45, Jakarta Selatan, 12190',
  npwp: '01.234.567.8-012.000',
  ppnDefault: 11,
  pphDefault: 2,
  formatNomorTagihan: 'INV/{YEAR}/{MONTH}/{COUNT}',
  notifDeadlineH3: true,
  notifDeadlineH1: true,
  metodePembayaranList: [
    'Transfer Mandiri',
    'Transfer BCA',
    'Transfer BNI',
    'Giro BNI',
    'Tunai'
  ],
  jatuhTempoHariDefault: 30,
  rekananList: [
    'CV Mega Event Organizer',
    'PT Prima Garda Outsourcing',
    'CV Berkat Mandiri Logistics',
    'PT Indo Media Advertising',
    'CV Sahabat Teknik'
  ],
  standardPositionsList: [
    'Berkas Dikirim ke Biro Keuangan Customer',
    'Verifikasi Berkas Lengkap (Tanda Terima Diterbitkan)',
    'Persetujuan Hubungan Pelanggan / Purchasing',
    'Menunggu Antrean Rilis Kas (Dana Approved)',
    'Pembayaran Cair / Lunas'
  ],
  agingBelumJatuhTempoLabel: 'Belum Jatuh Tempo',
  agingBelumJatuhTempoDesc: 'Tagihan lancar, belum jatuh tempo pembayaran.',
  agingLancarLabel: 'Lancar (1 - 30 hari)',
  agingLancarDesc: 'Keterlambatan ringan, mohon ingatkan mitra secara persuasif via telepon/WA.',
  agingKurangLancarLabel: 'Kurang Lancar (31 - 60 hari)',
  agingKurangLancarDesc: 'Keterlambatan sedang, layangkan Surat Peringatan ke-1 (SP1).',
  agingDiragukanLabel: 'Diragukan (61 - 90 hari)',
  agingDiragukanDesc: 'Keterlambatan tinggi, kirim Surat Peringatan ke-2 (SP2) & kunjungan langsung.',
  agingMacetLabel: 'Macet (> 90 hari)',
  agingMacetDesc: 'Kategori macet parah, pertimbangkan pembekuan transaksi / jalur somasi hukum.',
  cashAccountsList: [
    { id: 'acc-kas-utama', nama: 'Kas Utama (Fisik Cash)', tipe: 'Kas' },
    { id: 'acc-bank-bca', nama: 'Bank BCA', tipe: 'Bank', nomorRekening: '8223910291' },
    { id: 'acc-bank-mandiri', nama: 'Bank Mandiri', tipe: 'Bank', nomorRekening: '132009871123' },
    { id: 'acc-bank-bni', nama: 'Bank BNI', tipe: 'Bank', nomorRekening: '0983127455' }
  ],
  kategoriList: [
    'Pemasaran',
    'SDM',
    'Humas',
    'Operasional',
    'Logistik',
    'Umum'
  ],
};

export const INITIAL_USERS: AppUser[] = [
  { id: 'usr-1', nama: 'Andita Sely bestoro', username: 'anditasb', role: 'ADMINISTRATOR', password: 'Setra(2025)' },
  { id: 'usr-2', nama: 'Hasrianti', username: 'hasrianti', role: 'SUPERVISOR_KEUANGAN_UMUM', password: 'Setra(2025)' },
  { id: 'usr-3', nama: 'Muh. Arash Arisiah', username: 'muh.arash', role: 'STAF_ADMINISTRASI_UMUM', password: 'Setra(2025)' },
];

export const INITIAL_PAYMENTS: Payment[] = [
  {
    id: 'pay-1',
    rekanan: 'CV Mega Event Organizer',
    tanggalBayar: '2026-05-10',
    jumlahBayar: 45000000,
    metodeBayar: 'Transfer Mandiri',
    catatan: 'Pembayaran DP 50% kegiatan EO gathering PT Semen Tonasa',
    tanggalDeadlineTagihan: '2026-05-13',
    status: 'Aktif',
    approvedBy: 'Direktur Utama',
    tanggalApprove: '2026-05-10',
    hasInvoice: true,
    kategori: 'Humas',
  },
  {
    id: 'pay-2',
    rekanan: 'PT Prima Garda Outsourcing',
    tanggalBayar: '2026-05-15',
    jumlahBayar: 80000000,
    metodeBayar: 'Giro BNI',
    catatan: 'Pembayaran gaji tenaga kerja OS periode April untuk Semen Indonesia',
    tanggalDeadlineTagihan: '2026-05-18',
    status: 'Aktif',
    approvedBy: 'Direktur Utama',
    tanggalApprove: '2026-05-16',
    hasInvoice: true,
    kategori: 'SDM',
  },
  {
    id: 'pay-3',
    rekanan: 'CV Berkat Mandiri Logistics',
    tanggalBayar: '2026-05-20',
    jumlahBayar: 35000000,
    metodeBayar: 'Transfer Mandiri',
    catatan: 'Pembayaran jasa pengiriman logistik rute Surabaya-Makassar',
    tanggalDeadlineTagihan: '2026-05-23',
    status: 'Aktif',
    approvedBy: 'Direktur Utama',
    tanggalApprove: '2026-05-21',
    hasInvoice: true,
    kategori: 'Logistik',
  },
  {
    id: 'pay-4',
    rekanan: 'PT Indo Media Advertising',
    tanggalBayar: '2026-05-24',
    jumlahBayar: 25000000,
    metodeBayar: 'Transfer Mandiri',
    catatan: 'Pembayaran cetak billboard reklame sponsorship PT Semen Indonesia',
    tanggalDeadlineTagihan: '2026-05-27', // Deadline tagihan lewat, belum ada invoice
    status: 'Aktif',
    approvedBy: 'Direktur Utama',
    tanggalApprove: '2026-05-24',
    hasInvoice: false,
    kategori: 'Pemasaran',
  },
  {
    id: 'pay-5',
    rekanan: 'CV Sahabat Teknik',
    tanggalBayar: '2026-05-27',
    jumlahBayar: 15000000,
    metodeBayar: 'Tunai',
    catatan: 'Pembayaran perbaikan mesin kompresor lapangan area PT Semen Tonasa',
    tanggalDeadlineTagihan: '2026-05-30', // Deadline masih berjalan (H+3). Belum ditagih
    status: 'Aktif',
    approvedBy: 'Direktur Utama',
    tanggalApprove: '2026-05-27',
    hasInvoice: false,
    kategori: 'Operasional',
  },
  {
    id: 'pay-6',
    rekanan: 'PT Mitra Jasa Solusi',
    tanggalBayar: '2026-05-28',
    jumlahBayar: 62000000,
    metodeBayar: 'Transfer Mandiri',
    catatan: 'Pembayaran Jasa Konsultasi IT sistem manajemen data',
    tanggalDeadlineTagihan: '2026-05-31',
    status: 'Draft', // Perlu approval Direktur
    hasInvoice: false,
    kategori: 'Umum',
  },
];

export const INITIAL_INVOICES: Invoice[] = [
  {
    id: 'inv-hist-1',
    paymentId: 'pay-hist-1',
    rekanan: 'CV Mega Event Organizer',
    jumlahBayar: 20000000,
    customerDebitur: 'PT Semen Tonasa',
    nomorTagihan: 'INV/2026/01/001',
    tanggalTagihan: '2026-01-15',
    tanggalJatuhTempo: '2026-02-15',
    jumlahTagihKotor: 26000000,
    ppnTarif: 11,
    pphTarif: 2,
    ppnNominal: 2860000,
    pphNominal: 520000,
    totalTagihan: 28340000,
    status: 'Lunas',
    tanggalLunas: '2026-02-10'
  },
  {
    id: 'inv-hist-2',
    paymentId: 'pay-hist-2',
    rekanan: 'PT Prima Garda Outsourcing',
    jumlahBayar: 60000000,
    customerDebitur: 'PT Semen Indonesia (Persero) Tbk',
    nomorTagihan: 'INV/2026/02/001',
    tanggalTagihan: '2026-02-10',
    tanggalJatuhTempo: '2026-03-10',
    jumlahTagihKotor: 72000000,
    ppnTarif: 11,
    pphTarif: 2,
    ppnNominal: 7920000,
    pphNominal: 1440000,
    totalTagihan: 78480000,
    status: 'Lunas',
    tanggalLunas: '2026-03-05'
  },
  {
    id: 'inv-hist-3',
    paymentId: 'pay-hist-3',
    rekanan: 'CV Berkat Mandiri Logistics',
    jumlahBayar: 40000000,
    customerDebitur: 'PT Semen Indonesia (Persero) Tbk',
    nomorTagihan: 'INV/2026/03/001',
    tanggalTagihan: '2026-03-05',
    tanggalJatuhTempo: '2026-04-05',
    jumlahTagihKotor: 50000000,
    ppnTarif: 11,
    pphTarif: 2,
    ppnNominal: 5500000,
    pphNominal: 1000000,
    totalTagihan: 54500000,
    status: 'Lunas',
    tanggalLunas: '2026-04-01'
  },
  {
    id: 'inv-hist-4',
    paymentId: 'pay-hist-4',
    rekanan: 'PT Indo Media Advertising',
    jumlahBayar: 30000000,
    customerDebitur: 'PT Semen Tonasa',
    nomorTagihan: 'INV/2026/04/001',
    tanggalTagihan: '2026-04-20',
    tanggalJatuhTempo: '2026-05-20',
    jumlahTagihKotor: 38000000,
    ppnTarif: 11,
    pphTarif: 2,
    ppnNominal: 4180000,
    pphNominal: 760000,
    totalTagihan: 41420000,
    status: 'Lunas',
    tanggalLunas: '2026-05-18'
  },
  {
    id: 'inv-1',
    paymentId: 'pay-1',
    rekanan: 'CV Mega Event Organizer',
    jumlahBayar: 45000000,
    customerDebitur: 'PT Semen Tonasa',
    nomorTagihan: 'INV/2026/05/001',
    tanggalTagihan: '2026-05-12',
    tanggalJatuhTempo: '2026-06-12', // Belum jatuh tempo
    jumlahTagihKotor: 55000000, // markup 10jt
    ppnTarif: 11,
    pphTarif: 2,
    ppnNominal: 6050000,
    pphNominal: 1100000,
    totalTagihan: 59950000, // 55jt + 6.05jt - 1.1jt
    status: 'Belum Lunas',
  },
  {
    id: 'inv-2',
    paymentId: 'pay-2',
    rekanan: 'PT Prima Garda Outsourcing',
    jumlahBayar: 80000000,
    customerDebitur: 'PT Semen Indonesia (Persero) Tbk',
    nomorTagihan: 'INV/2026/05/002',
    tanggalTagihan: '2026-05-17',
    tanggalJatuhTempo: '2026-05-27', // Sudah Jatuh tempo (kemarin)
    jumlahTagihKotor: 95000000, // markup 15jt
    ppnTarif: 11,
    pphTarif: 2,
    ppnNominal: 10450000,
    pphNominal: 1900000,
    totalTagihan: 103550000,
    status: 'Belum Lunas',
  },
  {
    id: 'inv-3',
    paymentId: 'pay-3',
    rekanan: 'CV Berkat Mandiri Logistics',
    jumlahBayar: 35000000,
    customerDebitur: 'PT Semen Indonesia (Persero) Tbk',
    nomorTagihan: 'INV/2026/05/003',
    tanggalTagihan: '2026-05-22',
    tanggalJatuhTempo: '2026-06-22',
    jumlahTagihKotor: 42000000, // markup 7jt
    ppnTarif: 11,
    pphTarif: 2,
    ppnNominal: 4620000,
    pphNominal: 840000,
    totalTagihan: 45780000,
    status: 'Lunas',
  },
];

export const INITIAL_LOGS: InvoiceLog[] = [
  {
    id: 'log-1',
    invoiceId: 'inv-1',
    tanggal: '2026-05-12',
    posisi: 'Tagihan Diterbitkan',
    catatan: 'Invoice resmi ditandatangani dan siap dikirim.',
    updatedBy: 'Staf Admin & Umum (Rina)',
  },
  {
    id: 'log-2',
    invoiceId: 'inv-1',
    tanggal: '2026-05-14',
    posisi: 'Berkas Dikirim ke PT Semen Tonasa',
    catatan: 'Berkas fisik dikirim via kurir JNE (Resi: JNE1234556).',
    updatedBy: 'Staf Admin & Umum (Rina)',
  },
  {
    id: 'log-3',
    invoiceId: 'inv-1',
    tanggal: '2026-05-18',
    posisi: 'Berkas Diterima Verifikator',
    catatan: 'Diterima oleh Pak Taufik (Finance Semen Tonasa), berkas dinyatakan lengkap.',
    updatedBy: 'Staf Admin & Umum (Rina)',
  },

  {
    id: 'log-4',
    invoiceId: 'inv-2',
    tanggal: '2026-05-17',
    posisi: 'Tagihan Diterbitkan',
    catatan: 'Tagihan gaji OS draf final diterbitkan.',
    updatedBy: 'Staf Admin & Umum (Rina)',
  },
  {
    id: 'log-5',
    invoiceId: 'inv-2',
    tanggal: '2026-05-19',
    posisi: 'Verifikasi SDM Semen Indonesia',
    catatan: 'Log kehadiran OS sedang diverifikasi oleh SDM Semen Indonesia.',
    updatedBy: 'Staf Admin & Umum (Rina)',
  },

  {
    id: 'log-6',
    invoiceId: 'inv-3',
    tanggal: '2026-05-22',
    posisi: 'Tagihan Diterbitkan',
    catatan: 'Tagihan logistik dikirim via email.',
    updatedBy: 'Staf Admin & Umum (Rina)',
  },
  {
    id: 'log-7',
    invoiceId: 'inv-3',
    tanggal: '2026-05-25',
    posisi: 'Persetujuan Pembayaran',
    catatan: 'Persetujuan rilis dana disetujui direktur keuangan Semen Indonesia.',
    updatedBy: 'Staf Admin & Umum (Rina)',
  },
  {
    id: 'log-8',
    invoiceId: 'inv-3',
    tanggal: '2026-05-27',
    posisi: 'Pembayaran Diterima / Lunas',
    catatan: 'Dana Rp45.780.000 masuk ke rekening Mandiri perusahaan.',
    updatedBy: 'Staf Admin & Umum (Rina)',
  },
];

export const INITIAL_NOTIFICATIONS: AppNotification[] = [
  {
    id: 'notif-1',
    judul: 'Persetujuan Pembayaran Baru Terbuka',
    deskripsi: 'Spv. Keuangan telah membuat daftar pembayaran draf (Mitra Jasa Solusi - Rp62.000.000). Membutuhkan verifikasi Direktur.',
    tanggal: '2026-05-28',
    tipe: 'approval',
    read: false,
    linkTo: { module: 'payments', id: 'pay-6' },
  },
  {
    id: 'notif-2',
    judul: 'PERINGATAN: Melewati Batas Deadline Pembuatan Tagihan',
    deskripsi: 'Pembayaran iklan Indo Media (Rp25.000.000) pada 2026-05-24 telah melewati deadline pembuatan tagihan (2026-05-27)! Mohon Staf Admin segera buat invoice.',
    tanggal: '2026-05-28',
    tipe: 'deadline',
    read: false,
    linkTo: { module: 'payments', id: 'pay-4' },
  },
];

export const INITIAL_CASH_BALANCES: DailyCashBalance[] = [
  {
    id: 'cash-2026-05-22',
    tanggal: '2026-05-22',
    balances: {
      'acc-kas-utama': 25000000,
      'acc-bank-bca': 120000000,
      'acc-bank-mandiri': 85000000,
      'acc-bank-bni': 45000000
    },
    catatan: 'Saldo awal kas hasil rekonsiliasi mingguan',
    updatedBy: 'Budi Santoso',
    updatedAt: '2026-05-22 17:00'
  },
  {
    id: 'cash-2026-05-23',
    tanggal: '2026-05-23',
    balances: {
      'acc-kas-utama': 22500000,
      'acc-bank-bca': 120000000,
      'acc-bank-mandiri': 85000000,
      'acc-bank-bni': 43500000
    },
    catatan: 'Pembelian logistik kecil operasional kantor',
    updatedBy: 'Budi Santoso',
    updatedAt: '2026-05-23 16:30'
  },
  {
    id: 'cash-2026-05-24',
    tanggal: '2026-05-24',
    balances: {
      'acc-kas-utama': 22500000,
      'acc-bank-bca': 118000000,
      'acc-bank-mandiri': 95000000,
      'acc-bank-bni': 43500000
    },
    catatan: 'Mutasi antar rekening untuk cadangan operasional',
    updatedBy: 'Budi Santoso',
    updatedAt: '2026-05-24 15:45'
  },
  {
    id: 'cash-2026-05-25',
    tanggal: '2026-05-25',
    balances: {
      'acc-kas-utama': 21000000,
      'acc-bank-bca': 135000000,
      'acc-bank-mandiri': 95000000,
      'acc-bank-bni': 41000000
    },
    catatan: 'Penerimaan kliring tagihan',
    updatedBy: 'Budi Santoso',
    updatedAt: '2026-05-25 17:15'
  },
  {
    id: 'cash-2026-05-26',
    tanggal: '2026-05-26',
    balances: {
      'acc-kas-utama': 28000000,
      'acc-bank-bca': 135000000,
      'acc-bank-mandiri': 110000000,
      'acc-bank-bni': 48000000
    },
    catatan: 'Penarikan tunai & setoran hasil penjualan jasa harian',
    updatedBy: 'Budi Santoso',
    updatedAt: '2026-05-26 16:50'
  },
  {
    id: 'cash-2026-05-27',
    tanggal: '2026-05-27',
    balances: {
      'acc-kas-utama': 26500000,
      'acc-bank-bca': 130000000,
      'acc-bank-mandiri': 155780000,
      'acc-bank-bni': 48000000
    },
    catatan: 'Pencairan tagihan CV Berkat Mandiri Logistics (Masuk Mandiri)',
    updatedBy: 'Budi Santoso',
    updatedAt: '2026-05-27 17:00'
  },
  {
    id: 'cash-2026-05-28',
    tanggal: '2026-05-28',
    balances: {
      'acc-kas-utama': 24000000,
      'acc-bank-bca': 145000000,
      'acc-bank-mandiri': 151000000,
      'acc-bank-bni': 52000000
    },
    catatan: 'Rekonsiliasi harian penutupan kas',
    updatedBy: 'Budi Santoso',
    updatedAt: '2026-05-28 17:30'
  }
];
