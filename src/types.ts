/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type UserRole = 'SUPERVISOR_KEUANGAN_UMUM' | 'STAF_ADMINISTRASI_UMUM' | 'DIREKTUR' | 'ADMINISTRATOR';

export interface Payment {
  id: string;
  rekanan: string;
  tanggalBayar: string;
  jumlahBayar: number;
  metodeBayar: string;
  catatan: string;
  tanggalDeadlineTagihan: string;
  status: 'Draft' | 'Aktif';
  approvedBy?: string;
  tanggalApprove?: string;
  hasInvoice: boolean;
}

export interface Invoice {
  id: string;
  paymentId: string;
  rekanan: string;
  jumlahBayar: number;
  customerDebitur: string;
  nomorTagihan: string;
  tanggalTagihan: string;
  tanggalJatuhTempo: string;
  jumlahTagihKotor: number;
  ppnTarif: number; // e.g. 11
  pphTarif: number; // e.g. 2
  ppnNominal: number;
  pphNominal: number;
  totalTagihan: number; // jumlahTagihKotor + ppnNominal - pphNominal
  status: 'Belum Lunas' | 'Lunas';
  tanggalLunas?: string;
}

export interface InvoiceLog {
  id: string;
  invoiceId: string;
  tanggal: string;
  posisi: string;
  catatan: string;
  updatedBy: string;
}

export interface AppNotification {
  id: string;
  judul: string;
  deskripsi: string;
  tanggal: string;
  tipe: 'deadline' | 'approval' | 'log' | 'system';
  read: boolean;
  linkTo?: {
    module: 'payments' | 'invoices';
    id: string;
  };
}

export interface CompanySettings {
  namaPerusahaan: string;
  alamat: string;
  npwp: string;
  ppnDefault: number;
  pphDefault: number;
  formatNomorTagihan: string;
  notifDeadlineH3: boolean;
  notifDeadlineH1: boolean;
  isCustomLogo?: boolean;
  metodePembayaranList?: string[];
  jatuhTempoHariDefault?: number;
  rekananList?: string[];
  standardPositionsList?: string[];
  agingLancarLabel?: string;
  agingKurangLancarLabel?: string;
  agingDiragukanLabel?: string;
  agingMacetLabel?: string;
  agingBelumJatuhTempoLabel?: string;
  agingBelumJatuhTempoDesc?: string;
  agingLancarDesc?: string;
  agingKurangLancarDesc?: string;
  agingDiragukanDesc?: string;
  agingMacetDesc?: string;
  cashAccountsList?: CashAccount[];
  activeLogoId?: string;
  pwaName?: string;
  pwaShortName?: string;
  disableDemoLogin?: boolean;
}

export interface AppUser {
  id: string;
  nama: string;
  username: string;
  role: UserRole;
  password?: string;
}

export interface CashAccount {
  id: string; // unique ID cth: 'acc-1'
  nama: string; // nama kustom cth: 'Bank BCA Operasional'
  tipe: 'Kas' | 'Bank'; // Kas (Fisik) atau Bank
  nomorRekening?: string; // nomor rekening jika bank
}

export interface DailyCashBalance {
  id: string; // YYYY-MM-DD
  tanggal: string; // YYYY-MM-DD
  balances: { [accountId: string]: number }; // peta dari accountId ke jumlah saldo rupiah
  catatan?: string;
  updatedBy?: string;
  updatedAt?: string;
  kasUtama?: number;
  bankBCA?: number;
  bankMandiri?: number;
  bankBNI?: number;
}

