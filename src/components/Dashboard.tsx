/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  TrendingUp, 
  AlertTriangle, 
  DollarSign, 
  CheckCircle, 
  Calendar, 
  ArrowRight, 
  ShieldAlert, 
  Activity, 
  Clock, 
  Filter,
  Users,
  Wallet
} from 'lucide-react';
import { Payment, Invoice, InvoiceLog, AppNotification, CompanySettings } from '../types';

import { DailyCashBalance } from '../types';

interface DashboardProps {
  payments: Payment[];
  invoices: Invoice[];
  logs: InvoiceLog[];
  notifications: AppNotification[];
  onNavigateToModule: (module: 'payments' | 'invoices', filterId?: string) => void;
  onApprovePayment: (id: string) => void;
  userRole: string;
  settings: CompanySettings;
  cashBalances?: DailyCashBalance[];
}

export const Dashboard: React.FC<DashboardProps> = ({
  payments,
  invoices,
  logs,
  notifications,
  onNavigateToModule,
  onApprovePayment,
  userRole,
  settings,
  cashBalances = [],
}) => {
  const currentDateStr = '2026-05-28';
  const currentDate = new Date(currentDateStr);

  const [activeTooltipIndex, setActiveTooltipIndex] = useState<number | null>(null);
  const [activeCashTooltipIndex, setActiveCashTooltipIndex] = useState<number | null>(null);

  const defaultAccounts = [
    { id: 'acc-kas-utama', nama: 'Kas Utama (Fisik Cash)', tipe: 'Kas' },
    { id: 'acc-bank-bca', nama: 'Bank BCA', tipe: 'Bank', nomorRekening: '8223910291' },
    { id: 'acc-bank-mandiri', nama: 'Bank Mandiri', tipe: 'Bank', nomorRekening: '132009871123' },
    { id: 'acc-bank-bni', nama: 'Bank BNI', tipe: 'Bank', nomorRekening: '0983127455' }
  ];

  const activeAccounts = settings && settings.cashAccountsList && settings.cashAccountsList.length > 0
    ? settings.cashAccountsList
    : defaultAccounts;

  const getRecordTotal = (rec: DailyCashBalance) => {
    let tot = 0;
    activeAccounts.forEach(acc => {
      if (rec.balances && rec.balances[acc.id] !== undefined) {
        tot += rec.balances[acc.id];
      } else {
        // legacy old schema fields fallback
        if (acc.id === 'acc-kas-utama' && rec.kasUtama !== undefined) tot += rec.kasUtama;
        else if (acc.id === 'acc-bank-bca' && rec.bankBCA !== undefined) tot += rec.bankBCA;
        else if (acc.id === 'acc-bank-mandiri' && rec.bankMandiri !== undefined) tot += rec.bankMandiri;
        else if (acc.id === 'acc-bank-bni' && rec.bankBNI !== undefined) tot += rec.bankBNI;
      }
    });
    return tot;
  };

  // Stats Calculations
  const invoicesBelumLunas = invoices.filter(inv => inv.status === 'Belum Lunas');
  const invoicesLunas = invoices.filter(inv => inv.status === 'Lunas');

  // 1. Total Piutang Berjalan (Belum Lunas total tagihan)
  const totalPiutangBerjalan = invoicesBelumLunas.reduce((acc, inv) => acc + inv.totalTagihan, 0);

  // 2. Total Tagihan Jatuh Tempo (Status Belum Lunas AND jatuh tempo <= May 28, 2026)
  const totalJatuhTempo = invoicesBelumLunas
    .filter(inv => new Date(inv.tanggalJatuhTempo) <= currentDate)
    .reduce((acc, inv) => acc + inv.totalTagihan, 0);

  const countJatuhTempo = invoicesBelumLunas
    .filter(inv => new Date(inv.tanggalJatuhTempo) <= currentDate).length;

  // 3. Total Pembayaran Masuk (Lunas total tagihan)
  const totalPembayaranMasuk = invoicesLunas.reduce((acc, inv) => acc + inv.totalTagihan, 0);

  // 4. Potensi Laba Kotor (dari semua invoice: totalTagihan - jumlahBayar)
  const potensiLabaKotor = invoices.reduce((acc, inv) => {
    // Laba Kotor = Jumlah Tagih Kotor - Jumlah Bayar
    const laba = inv.jumlahTagihKotor - inv.jumlahBayar;
    return acc + laba;
  }, 0);

  // Persentase Pelunasan (Nilai Lunas / Total Semua Invoiced)
  const totalInvoiced = invoices.reduce((acc, inv) => acc + inv.totalTagihan, 0);
  const persentasePelunasan = totalInvoiced > 0 ? (totalPembayaranMasuk / totalInvoiced) * 100 : 0;

  // 5 Tagihan Teratas dengan nilai terbesar
  const topInvoices = [...invoices].sort((a, b) => b.totalTagihan - a.totalTagihan).slice(0, 5);

  // Warning List (Tagihan Jatuh Tempo yang belum dibayar)
  const lateInvoices = invoicesBelumLunas.filter(inv => new Date(inv.tanggalJatuhTempo) <= currentDate);

  // Uninvoiced Payments approaching or past deadline
  const uninvoicedPayments = payments.filter(p => !p.hasInvoice && p.status === 'Aktif');
  const unsubmittedApprovals = payments.filter(p => p.status === 'Draft');

  // Days to Settle Paid Invoices (DSO / Average Collection Days)
  const paidInvoicesWithDates = invoicesLunas.filter(inv => inv.tanggalTagihan && inv.tanggalLunas);
  let averageCollectionDays = 0;
  if (paidInvoicesWithDates.length > 0) {
    const totalDays = paidInvoicesWithDates.reduce((sum, inv) => {
      const start = new Date(inv.tanggalTagihan);
      const end = new Date(inv.tanggalLunas!);
      const diffTime = end.getTime() - start.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return sum + (diffDays > 0 ? diffDays : 0);
    }, 0);
    averageCollectionDays = Math.round(totalDays / paidInvoicesWithDates.length);
  } else {
    averageCollectionDays = 0; // default / empty state
  }

  // Piutang per debitur outstanding
  const debiturPiutangMap = invoicesBelumLunas.reduce((acc, inv) => {
    const name = inv.customerDebitur || 'Lain-lain';
    acc[name] = (acc[name] || 0) + inv.totalTagihan;
    return acc;
  }, {} as Record<string, number>);

  const sortedDebiturPiutang = Object.entries(debiturPiutangMap)
    .map(([name, val]) => ({ name, value: Number(val) }))
    .sort((a, b) => b.value - a.value);

  // Status PPN & PPh Tertunda
  const totalPpnOutstanding = invoicesBelumLunas.reduce((acc, inv) => acc + inv.ppnNominal, 0);
  const totalPphOutstanding = invoicesBelumLunas.reduce((acc, inv) => acc + inv.pphNominal, 0);

  // Aging Piutang Calculator
  // Groups: <0 days past due (belum jatuh tempo), 1-30 days, 31-60 days, 61-90 days, 90+ days
  const agingData = {
    belumJatuhTempo: 0,
    past1_30: 0,
    past31_60: 0,
    past61_90: 0,
    past91Plus: 0,
  };

  invoicesBelumLunas.forEach(inv => {
    const diffTime = currentDate.getTime() - new Date(inv.tanggalJatuhTempo).getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays <= 0) {
      agingData.belumJatuhTempo += inv.totalTagihan;
    } else if (diffDays <= 30) {
      agingData.past1_30 += inv.totalTagihan;
    } else if (diffDays <= 60) {
      agingData.past31_60 += inv.totalTagihan;
    } else if (diffDays <= 90) {
      agingData.past61_90 += inv.totalTagihan;
    } else {
      agingData.past91Plus += inv.totalTagihan;
    }
  });

  // Dynamic Monthly Stats aggregator
  const monthlyStats = [
    { label: 'Jan', monthKey: '2026-01', labaKotor: 0, tagihKotor: 0, margin: 0, count: 0 },
    { label: 'Feb', monthKey: '2026-02', labaKotor: 0, tagihKotor: 0, margin: 0, count: 0 },
    { label: 'Mar', monthKey: '2026-03', labaKotor: 0, tagihKotor: 0, margin: 0, count: 0 },
    { label: 'Apr', monthKey: '2026-04', labaKotor: 0, tagihKotor: 0, margin: 0, count: 0 },
    { label: 'Mei', monthKey: '2026-05', labaKotor: 0, tagihKotor: 0, margin: 0, count: 0 },
    { label: 'Jun', monthKey: '2026-06', labaKotor: 0, tagihKotor: 0, margin: 0, count: 0 },
  ];

  invoices.forEach(inv => {
    if (!inv.tanggalTagihan) return;
    const parts = inv.tanggalTagihan.split('-');
    if (parts.length >= 2) {
      const yearMonth = `${parts[0]}-${parts[1]}`;
      const laba = inv.jumlahTagihKotor - inv.jumlahBayar;
      const billing = inv.jumlahTagihKotor;
      const bucket = monthlyStats.find(item => item.monthKey === yearMonth);
      if (bucket) {
        bucket.labaKotor += laba;
        bucket.tagihKotor += billing;
        bucket.count += 1;
      }
    }
  });

  monthlyStats.forEach(item => {
    if (item.tagihKotor > 0) {
      item.margin = (item.labaKotor / item.tagihKotor) * 100;
    } else {
      item.margin = 0;
    }
  });

  const maxLabaVal = Math.max(...monthlyStats.map(m => m.labaKotor), 1000000);
  const maxMarginVal = Math.max(...monthlyStats.map(m => m.margin), 30);

  // 1. Debitur Terbesar dengan Piutang Tertinggi (Top Debtors Grouping)
  const debtorBalances: { [key: string]: { totalUnpaid: number; countUnpaid: number; totalPaid: number; lunasCount: number } } = {};
  invoices.forEach(inv => {
    const name = inv.customerDebitur || 'Lain-lain';
    if (!debtorBalances[name]) {
      debtorBalances[name] = { totalUnpaid: 0, countUnpaid: 0, totalPaid: 0, lunasCount: 0 };
    }
    if (inv.status === 'Belum Lunas') {
      debtorBalances[name].totalUnpaid += inv.totalTagihan;
      debtorBalances[name].countUnpaid += 1;
    } else {
      debtorBalances[name].totalPaid += inv.totalTagihan;
      debtorBalances[name].lunasCount += 1;
    }
  });
  const topDebtors = Object.entries(debtorBalances)
    .map(([name, data]) => ({ name, ...data }))
    .sort((a, b) => b.totalUnpaid - a.totalUnpaid)
    .slice(0, 5);

  // 3. Pipeline Arus Kas Jatuh Tempo (Cash flow maturity pipeline)
  // Upcoming periods since May 28, 2026:
  // H+7 days, H+14 days, H+30 days
  const pipelineUpcoming = {
    h7: 0,
    h14: 0,
    h30: 0,
  };
  invoicesBelumLunas.forEach(inv => {
    const diffTime = new Date(inv.tanggalJatuhTempo).getTime() - currentDate.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    if (diffDays > 0) {
      if (diffDays <= 7) {
        pipelineUpcoming.h7 += inv.totalTagihan;
      }
      if (diffDays <= 14) {
        pipelineUpcoming.h14 += inv.totalTagihan;
      }
      if (diffDays <= 30) {
        pipelineUpcoming.h30 += inv.totalTagihan;
      }
    }
  });

  const totalInvoicesCount = invoices.length;
  const progressRatioInvoices = totalInvoicesCount > 0 ? (invoicesLunas.length / totalInvoicesCount) * 100 : 0;

  // Formatting Rupiah Helper
  const formatRupiah = (num: number) => {
    return 'Rp ' + num.toLocaleString('id-ID');
  };

  return (
    <div className="space-y-6" id="dashboard-root">
      
      {/* 4 Cards Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4" id="stats-grid">
        
        {/* KPI 1: Piutang Berjalan */}
        <div className="bg-white rounded-xl p-4 border border-slate-100 shadow-sm flex items-center gap-4 transition-all hover:shadow-md" id="stat-piutang-berjalan">
          <div className="p-3 bg-indigo-50 rounded-xl text-indigo-600">
            <TrendingUp className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Piutang Berjalan</p>
            <h3 className="text-lg font-bold text-slate-800 mt-1">{formatRupiah(totalPiutangBerjalan)}</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              <span className="font-semibold text-amber-500">{invoicesBelumLunas.length} tagihan</span> belum lunas
            </p>
          </div>
        </div>

        {/* KPI 2: Tagihan Jatuh Tempo */}
        <div className={`rounded-xl p-4 border shadow-sm flex items-center gap-4 transition-all hover:shadow-md ${countJatuhTempo > 0 ? 'bg-rose-50/50 border-rose-100' : 'bg-white border-slate-100'}`} id="stat-jatuh-tempo">
          <div className={`p-3 rounded-xl ${countJatuhTempo > 0 ? 'bg-rose-100 text-rose-600' : 'bg-slate-50 text-slate-400'}`}>
            <AlertTriangle className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Jatuh Tempo</p>
            <h3 className={`text-lg font-bold mt-1 ${countJatuhTempo > 0 ? 'text-rose-700' : 'text-slate-800'}`}>
              {formatRupiah(totalJatuhTempo)}
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              <span className={`font-semibold ${countJatuhTempo > 0 ? 'text-rose-600' : 'text-slate-500'}`}>{countJatuhTempo} tagihan</span> sudah lewat jatuh tempo
            </p>
          </div>
        </div>

        {/* KPI 3: Pembayaran Masuk */}
        <div className="bg-white rounded-xl p-4 border border-slate-100 shadow-sm flex items-center gap-4 transition-all hover:shadow-md" id="stat-pembayaran-masuk">
          <div className="p-3 bg-emerald-50 rounded-xl text-emerald-600">
            <CheckCircle className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Pembayaran Masuk</p>
            <h3 className="text-lg font-bold text-slate-800 mt-1">{formatRupiah(totalPembayaranMasuk)}</h3>
            <p className="text-xs text-emerald-600 font-semibold mt-0.5">
              Tingkat pelunasan {persentasePelunasan.toFixed(1)}%
            </p>
          </div>
        </div>

        {/* KPI 4: Estimasi Potensi Laba Kotor */}
        <div className="bg-gradient-to-br from-slate-900 to-indigo-950 text-white rounded-xl p-4 shadow-sm flex items-center gap-4 transition-all hover:shadow-md" id="stat-laba-kotor">
          <div className="p-3 bg-white/10 rounded-xl text-indigo-300">
            <DollarSign className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-indigo-200/80 uppercase tracking-wider">Potensi Laba Kotor</p>
            <h3 className="text-lg font-bold mt-1 text-white">{formatRupiah(potensiLabaKotor)}</h3>
            <p className="text-xs text-indigo-200/70 mt-0.5">
              Potensi laba perusahaan
            </p>
          </div>
        </div>
      </div>

      {/* Enriched Information Section: Collection Cycle, Cash maturity, and Customer Portfolios */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6" id="dashboard-enriched-analytics">
        
        {/* Left Card: Collection Cycle & Cash In Maturity pipeline (col-span-5) */}
        <div className="lg:col-span-5 bg-white border border-slate-100 rounded-xl p-5 shadow-sm space-y-4">
          <div>
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
              <Clock className="h-4 w-4 text-slate-500" />
              SKOR KOLEKSI & SIKLUS ARUS KAS
            </h3>
            <p className="text-[10px] text-slate-400 mt-0.5">Analisis kecepatan penagihan dan estimasi tagihan jatuh tempo ke depan.</p>
          </div>

          {/* Average Days to Collect */}
          <div className="bg-slate-50/70 p-4 rounded-xl flex items-center justify-between border border-slate-100">
            <div className="space-y-1">
              <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block">Rerata Lama Pelunasan</span>
              <span className="text-[10px] text-slate-500 block leading-tight">Kecepatan customer menyelesaikan tagihan.</span>
            </div>
            <div className="text-right flex flex-col items-end">
              <div className="flex items-baseline gap-1">
                <span className="text-2xl font-black text-indigo-700">
                  {averageCollectionDays > 0 ? averageCollectionDays : '-'}
                </span>
                <span className="text-xs font-bold text-slate-600">Hari</span>
              </div>
              <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-bold mt-1 ${
                averageCollectionDays === 0
                  ? 'bg-slate-100 text-slate-500 border border-slate-200'
                  : averageCollectionDays <= 30
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                    : averageCollectionDays <= 60
                      ? 'bg-amber-50 text-amber-700 border border-amber-100'
                      : 'bg-rose-50 text-rose-700 border border-rose-100'
              }`}>
                {averageCollectionDays === 0 
                  ? 'Belum Ada Pelunasan' 
                  : averageCollectionDays <= 30 
                    ? 'Sangat Sehat' 
                    : averageCollectionDays <= 60 
                      ? 'Perlu Kehati-hatian' 
                      : 'Sangat Terlambat'}
              </span>
            </div>
          </div>

          {/* Cash-In Pipeline Periods */}
          <div className="space-y-2">
            <span className="text-[10px] uppercase font-bold tracking-wider text-slate-500 block">Proyeksi Likuiditas (Cash-In)</span>
            <div className="grid grid-cols-3 gap-2">
              <div className="bg-slate-50 p-2 rounded-lg border border-slate-100/60 text-center">
                <span className="text-[9px] text-slate-400 font-bold block">H+7 Hari</span>
                <span className="text-[11px] font-extrabold text-slate-700 block mt-0.5">{formatRupiah(pipelineUpcoming.h7)}</span>
              </div>
              <div className="bg-slate-50 p-2 rounded-lg border border-slate-100/60 text-center">
                <span className="text-[9px] text-slate-400 font-bold block">H+14 Hari</span>
                <span className="text-[11px] font-extrabold text-slate-700 block mt-0.5">{formatRupiah(pipelineUpcoming.h14)}</span>
              </div>
              <div className="bg-slate-50 p-2 rounded-lg border border-slate-100/60 text-center">
                <span className="text-[9px] text-slate-400 font-bold block">H+30 Hari</span>
                <span className="text-[11px] font-extrabold text-slate-700 block mt-0.5">{formatRupiah(pipelineUpcoming.h30)}</span>
              </div>
            </div>
          </div>

          {/* Status Pajak Pertambahan Nilai & PPh 23 Tertunda */}
          <div className="border-t border-slate-100 pt-3.5 space-y-2">
            <span className="text-[10px] uppercase font-bold tracking-wider text-slate-500 block">Akumulasi Pajak Tertunda (Belum Lunas)</span>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="bg-indigo-50/40 p-2 rounded-lg border border-indigo-100/50 flex flex-col justify-between">
                <span className="text-[9px] text-slate-400 font-bold">Estimasi PPN Keluaran</span>
                <span className="text-[12px] font-black text-indigo-700 mt-1">{formatRupiah(totalPpnOutstanding)}</span>
              </div>
              <div className="bg-amber-50/40 p-2 rounded-lg border border-amber-100/50 flex flex-col justify-between">
                <span className="text-[9px] text-slate-400 font-bold font-semibold text-slate-500">Potongan PPh 23 (Dipotong Mitra)</span>
                <span className="text-[12px] font-black text-amber-700 mt-1">{formatRupiah(totalPphOutstanding)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Card: Customers (Debtors) Portfolio and Top Balances (col-span-7) */}
        <div className="lg:col-span-7 bg-white border border-slate-100 rounded-xl p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                <Users className="h-4 w-4 text-slate-500" />
                KOLEKTIBILITAS MITRA CUSTOMER (DEBITUR)
              </h3>
              <p className="text-[10px] text-slate-400 mt-0.5">Daftar mitra dengan saldo piutang berjalan terbesar & rasio pembayaran.</p>
            </div>
            <span className="text-[10px] bg-slate-50 text-slate-500 border border-slate-100 px-2 py-0.5 rounded-full font-medium">Batas Top 5</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="border-b border-slate-100 text-slate-400 font-bold text-[10px] uppercase">
                  <th className="pb-2">Nama Debitur</th>
                  <th className="pb-2 text-center">Invoices</th>
                  <th className="pb-2 text-right">Rasio Lunas</th>
                  <th className="pb-2 text-right text-indigo-700 font-extrabold">Total Piutang</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {topDebtors.filter(d => d.totalUnpaid > 0 || d.totalPaid > 0).map((debtor, idx) => {
                  const totalInvoices = debtor.countUnpaid + debtor.lunasCount;
                  const payoffRatio = totalInvoices > 0 ? (debtor.lunasCount / totalInvoices) * 100 : 0;
                  return (
                    <tr key={idx} className="hover:bg-slate-50/50 transition-all">
                      <td className="py-2.5 font-bold text-slate-700 max-w-[140px] truncate">{debtor.name}</td>
                      <td className="py-2.5 text-center text-slate-500 font-medium">
                        {debtor.countUnpaid} <span className="text-slate-300">/</span> {totalInvoices}
                      </td>
                      <td className="py-2.5 text-right font-semibold">
                        <div className="flex items-center justify-end gap-1.5">
                          <span className={payoffRatio >= 75 ? 'text-emerald-600' : payoffRatio >= 50 ? 'text-amber-600' : 'text-rose-600'}>
                            {payoffRatio.toFixed(0)}%
                          </span>
                          <div className="w-10 bg-slate-100 h-1.5 rounded-full overflow-hidden shrink-0 hidden sm:block">
                            <div 
                              className={`h-full rounded-full ${payoffRatio >= 75 ? 'bg-emerald-500' : payoffRatio >= 50 ? 'bg-amber-500' : 'bg-rose-500'}`} 
                              style={{ width: `${payoffRatio}%` }}
                            />
                          </div>
                        </div>
                      </td>
                      <td className="py-2.5 text-right font-black text-indigo-950">{formatRupiah(debtor.totalUnpaid)}</td>
                    </tr>
                  );
                })}
                {topDebtors.filter(d => d.totalUnpaid > 0 || d.totalPaid > 0).length === 0 && (
                  <tr>
                    <td colSpan={4} className="py-6 text-center text-slate-400 italic">
                      Tidak ada data piutang mitra customer berjalan.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>

      {/* Main Grid: Visualisasi & Draft Approval */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6" id="dashboard-main-grid">
        
        {/* Left column - Visual Charts + Warning list */}
        <div className="lg:col-span-8 space-y-6">
          
          {/* Collection Rate & Aging Piutang Box */}
          <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-5" id="visual-charts-card">
            <h3 className="text-sm font-bold text-slate-800 mb-5 flex items-center gap-2">
              <Activity className="h-4 w-4 text-indigo-600" />
              Kesehatan Piutang & Visualisasi Aging
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
              {/* Ring Chart of Collection Code (Native Elegant SVG) */}
              <div className="md:col-span-4 flex flex-col items-center justify-center p-3 border-r border-slate-100" id="collection-ring">
                <div className="relative h-28 w-28 flex items-center justify-center">
                  <svg className="absolute inset-0 w-full h-full transform -rotate-90">
                    <circle
                      cx="56"
                      cy="56"
                      r="46"
                      stroke="#f1f5f9"
                      strokeWidth="10"
                      fill="transparent"
                    />
                    <circle
                      cx="56"
                      cy="56"
                      r="46"
                      stroke="#10b981"
                      strokeWidth="10"
                      fill="transparent"
                      strokeDasharray="289"
                      strokeDashoffset={289 - (289 * persentasePelunasan) / 100}
                      strokeLinecap="round"
                    />
                  </svg>
                  <div className="text-center z-10">
                    <span className="text-xl font-black text-slate-800">{persentasePelunasan.toFixed(0)}%</span>
                    <p className="text-[9px] text-slate-400 font-semibold uppercase tracking-wider mt-0.5">Tercairkan</p>
                  </div>
                </div>
                <div className="text-center mt-3">
                  <span className="text-xs font-semibold text-slate-500">Rasio Pelunasan</span>
                  <p className="text-[10px] text-slate-400 mt-0.5">
                    {formatRupiah(totalPembayaranMasuk)} / {formatRupiah(totalInvoiced)}
                  </p>
                </div>
              </div>

              {/* Aging Bar Chart (Custom Styled HTML Component) */}
              <div className="md:col-span-8 space-y-3.5 flex flex-col justify-center" id="aging-graph">
                <span className="text-xs font-bold text-slate-600 block mb-1">Struktur Piutang Berdasarkan Hari Jatuh Tempo & Rekomendasi Tindakan</span>
                
                {/* Progress 1: Belum Jatuh Tempo */}
                <div className="space-y-1 bg-slate-50/50 p-2 rounded-lg border border-slate-100/50">
                  <div className="flex justify-between text-[11px]">
                    <span className="font-bold text-indigo-700">{settings.agingBelumJatuhTempoLabel || 'Belum Jatuh Tempo'}</span>
                    <span className="text-slate-800 font-extrabold">{formatRupiah(agingData.belumJatuhTempo)}</span>
                  </div>
                  <div className="h-2 w-full bg-slate-200/50 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-indigo-500 rounded-full transition-all duration-500" 
                      style={{ width: `${totalPiutangBerjalan > 0 ? (agingData.belumJatuhTempo / totalPiutangBerjalan) * 100 : 0}%` }}
                    />
                  </div>
                  <p className="text-[10px] text-slate-500 flex items-start gap-1">
                    <span className="font-semibold text-indigo-600 shrink-0">💡 Tindakan:</span>
                    <span>{settings.agingBelumJatuhTempoDesc || 'Tagihan lancar, belum jatuh tempo pembayaran.'}</span>
                  </p>
                </div>

                {/* Progress 2: Menunggak 1-30 Hari */}
                <div className="space-y-1 bg-slate-50/50 p-2 rounded-lg border border-slate-100/50">
                  <div className="flex justify-between text-[11px]">
                    <span className="font-bold text-emerald-700">{settings.agingLancarLabel || 'Lancar (1 - 30 hari)'}</span>
                    <span className="text-emerald-700 font-extrabold">{formatRupiah(agingData.past1_30)}</span>
                  </div>
                  <div className="h-2 w-full bg-slate-200/50 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-emerald-500 rounded-full transition-all duration-500" 
                      style={{ width: `${totalPiutangBerjalan > 0 ? (agingData.past1_30 / totalPiutangBerjalan) * 100 : 0}%` }}
                    />
                  </div>
                  <p className="text-[10px] text-slate-500 flex items-start gap-1">
                    <span className="font-semibold text-emerald-600 shrink-0">💡 Tindakan:</span>
                    <span>{settings.agingLancarDesc || 'Keterlambatan ringan, mohon ingatkan mitra secara persuasif via telepon/WA.'}</span>
                  </p>
                </div>

                {/* Progress 3: Menunggak 31-60 Hari */}
                <div className="space-y-1 bg-slate-50/50 p-2 rounded-lg border border-slate-100/50">
                  <div className="flex justify-between text-[11px]">
                    <span className="font-bold text-amber-700">{settings.agingKurangLancarLabel || 'Kurang Lancar (31 - 60 hari)'}</span>
                    <span className="text-amber-700 font-extrabold">{formatRupiah(agingData.past31_60)}</span>
                  </div>
                  <div className="h-2 w-full bg-slate-200/50 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-amber-500 rounded-full transition-all duration-500" 
                      style={{ width: `${totalPiutangBerjalan > 0 ? (agingData.past31_60 / totalPiutangBerjalan) * 100 : 0}%` }}
                    />
                  </div>
                  <p className="text-[10px] text-slate-500 flex items-start gap-1">
                    <span className="font-semibold text-amber-500 shrink-0">💡 Tindakan:</span>
                    <span>{settings.agingKurangLancarDesc || 'Keterlambatan sedang, layangkan Surat Peringatan ke-1 (SP1).'}</span>
                  </p>
                </div>

                {/* Progress 4: Menunggak 61-90 Hari */}
                <div className="space-y-1 bg-slate-50/50 p-2 rounded-lg border border-slate-100/50">
                  <div className="flex justify-between text-[11px]">
                    <span className="font-bold text-orange-700">{settings.agingDiragukanLabel || 'Diragukan (61 - 90 hari)'}</span>
                    <span className="text-orange-700 font-extrabold">{formatRupiah(agingData.past61_90)}</span>
                  </div>
                  <div className="h-2 w-full bg-slate-200/50 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-orange-500 rounded-full transition-all duration-500" 
                      style={{ width: `${totalPiutangBerjalan > 0 ? (agingData.past61_90 / totalPiutangBerjalan) * 100 : 0}%` }}
                    />
                  </div>
                  <p className="text-[10px] text-slate-500 flex items-start gap-1">
                    <span className="font-semibold text-orange-600 shrink-0">💡 Tindakan:</span>
                    <span>{settings.agingDiragukanDesc || 'Keterlambatan tinggi, kirim Surat Peringatan ke-2 (SP2) & kunjungan langsung.'}</span>
                  </p>
                </div>

                {/* Progress 5: Menunggak 90+ Hari */}
                <div className="space-y-1 bg-slate-50/50 p-2 rounded-lg border border-slate-100/50">
                  <div className="flex justify-between text-[11px]">
                    <span className="font-bold text-rose-800">{settings.agingMacetLabel || 'Macet (> 90 hari)'}</span>
                    <span className="text-rose-800 font-extrabold">{formatRupiah(agingData.past91Plus)}</span>
                  </div>
                  <div className="h-2 w-full bg-slate-200/50 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-rose-600 rounded-full transition-all duration-500" 
                      style={{ width: `${totalPiutangBerjalan > 0 ? (agingData.past91Plus / totalPiutangBerjalan) * 100 : 0}%` }}
                    />
                  </div>
                  <p className="text-[10px] text-slate-500 flex items-start gap-1">
                    <span className="font-semibold text-rose-600 shrink-0">💡 Tindakan:</span>
                    <span>{settings.agingMacetDesc || 'Kategori macet parah, pertimbangkan pembekuan transaksi / jalur somasi hukum.'}</span>
                  </p>
                </div>

              </div>
            </div>
          </div>

          {/* Tren Pergerakan Kas Korporat (Daily Cash Trend) */}
          {cashBalances && cashBalances.length > 0 && (
            <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-5 space-y-4" id="cash-trend-card-left">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                <div>
                  <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                    <Activity className="h-4 w-4 text-emerald-600" />
                    Tren Pergerakan Kas Korporat Terkonsolidasi
                  </h3>
                  <p className="text-[11px] text-slate-400 mt-0.5">Grafik harian akumulasi seluruh saldo kas fisik dan rekening bank perusahaan.</p>
                </div>
                <div className="flex items-center gap-1 text-[10px] bg-emerald-50 text-emerald-800 font-extrabold px-2 py-1 rounded">
                  <span className="h-2 w-2 rounded-full bg-emerald-500 inline-block animate-pulse" />
                  REAL-TIME SYNCHRONIZED
                </div>
              </div>

              {(() => {
                const sortedCash = [...cashBalances].sort((a, b) => a.tanggal.localeCompare(b.tanggal));
                const dayTotals = sortedCash.map(c => getRecordTotal(c));
                const maxVal = Math.max(...dayTotals, 10000000);
                const minVal = Math.min(...dayTotals, 0);
                const deltaVal = maxVal - minVal || 1;

                const svgWidth = 580;
                const svgHeight = 160;
                const marginX = 40;
                const marginY = 20;

                const plotW = svgWidth - marginX * 2;
                const plotH = svgHeight - marginY * 2;
                const stepX = plotW / Math.max(sortedCash.length - 1, 1);

                const points = sortedCash.map((c, i) => {
                  const x = marginX + i * stepX;
                  const total = getRecordTotal(c);
                  const y = svgHeight - marginY - ((total - minVal) / deltaVal) * plotH;
                  return { x, y, total, date: c.tanggal, user: c.updatedBy };
                });

                const pathString = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
                const fillPathString = points.length > 0
                  ? `${pathString} L ${points[points.length - 1].x} ${svgHeight - marginY} L ${points[0].x} ${svgHeight - marginY} Z`
                  : '';

                const compactRupiahFormat = (val: number) => {
                  if (val >= 1000000) return 'Rp ' + (val / 1000000).toFixed(0) + 'jt';
                  if (val >= 1000) return 'Rp ' + (val / 1000).toFixed(0) + 'rb';
                  return 'Rp ' + val;
                };

                return (
                  <div className="relative bg-slate-50/50 p-4 rounded-xl border border-slate-100">
                    <svg className="w-full h-auto" viewBox={`0 0 ${svgWidth} ${svgHeight}`} fill="none" xmlns="http://www.w3.org/2000/svg">
                      <defs>
                        <linearGradient id="cashFillGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#10b981" stopOpacity="0.25" />
                          <stop offset="100%" stopColor="#10b981" stopOpacity="0.0" />
                        </linearGradient>
                      </defs>

                      {/* Horizontal Gridlines */}
                      {[0, 0.33, 0.66, 1].map((ratio, index) => {
                        const y = svgHeight - marginY - ratio * plotH;
                        return (
                          <g key={index}>
                            <line x1={marginX} y1={y} x2={svgWidth - marginX} y2={y} stroke="#f1f5f9" strokeDasharray="3 3" strokeWidth="1" />
                            <text x={marginX - 8} y={y + 3} className="fill-slate-400 font-mono text-[8px] font-bold" textAnchor="end">
                              {compactRupiahFormat(minVal + ratio * deltaVal)}
                            </text>
                          </g>
                        );
                      })}

                      {/* X-axis indicators */}
                      {points.map((p, i) => {
                        const showLabel = sortedCash.length <= 6 || i === 0 || i === sortedCash.length - 1 || (sortedCash.length > 6 && i === Math.floor(sortedCash.length / 2));
                        return (
                          <g key={i}>
                            {showLabel && (
                              <text x={p.x} y={svgHeight - 4} className="fill-slate-400 font-sans text-[8px] font-bold" textAnchor="middle">
                                {p.date}
                              </text>
                            )}
                          </g>
                        );
                      })}

                      {/* Area Fill */}
                      {fillPathString && <path d={fillPathString} fill="url(#cashFillGrad)" />}

                      {/* Area Path */}
                      {pathString && <path d={pathString} stroke="#10b981" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />}

                      {/* Interactive circles and tooltip trigger hotspots */}
                      {points.map((p, idx) => (
                        <g key={idx}>
                          {activeCashTooltipIndex === idx && (
                            <circle cx={p.x} cy={p.y} r="8" fill="#10b981" fillOpacity="0.3" className="pointer-events-none animate-ping" />
                          )}
                          <circle
                            cx={p.x}
                            cy={p.y}
                            r="4.5"
                            fill="#10b981"
                            stroke="#ffffff"
                            strokeWidth="2"
                            className="pointer-events-none"
                          />
                          {/* Large transparent interactive bar hotspot */}
                          <rect
                            x={p.x - 15}
                            y="15"
                            width="30"
                            height="130"
                            fill="transparent"
                            className="cursor-pointer"
                            onMouseEnter={() => setActiveCashTooltipIndex(idx)}
                            onMouseLeave={() => setActiveCashTooltipIndex(null)}
                          />
                        </g>
                      ))}
                    </svg>

                    {/* Cash Tooltip Overlay */}
                    {activeCashTooltipIndex !== null && (
                      <div
                        className="absolute z-10 bg-slate-900 border border-slate-800 text-white p-3 rounded-lg shadow-lg text-[10px] font-sans"
                        style={{
                          top: '10px',
                          left: `${Math.min(Math.max(20 + activeCashTooltipIndex * (plotW / Math.max(sortedCash.length - 1, 1)), 10), 450)}px`,
                          pointerEvents: 'none',
                          minWidth: '160px'
                        }}
                      >
                        <p className="font-extrabold text-emerald-400 mb-1 border-b border-white/10 pb-1 uppercase tracking-wider">{points[activeCashTooltipIndex].date}</p>
                        <div className="space-y-0.5">
                          <p className="flex justify-between gap-1.5 text-slate-200">
                            <span>Total Kas:</span>
                            <span className="font-black text-white">{formatRupiah(points[activeCashTooltipIndex].total)}</span>
                          </p>
                          <p className="flex justify-between gap-1.5 text-slate-400">
                            <span>Petugas:</span>
                            <span className="font-semibold text-slate-250">{points[activeCashTooltipIndex].user || 'Sistem'}</span>
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })()}
            </div>
          )}

          {/* Tren Potensi Laba Kotor & Rasio Margin Laba Kotor */}
          <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-5 space-y-4" id="monthly-trend-card">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-indigo-600" />
                  Tren Potensi Laba Kotor & Margin Rasio bulanan
                </h3>
                <p className="text-[11px] text-slate-400 mt-0.5">Analisis bulanan margin keuntungan (markup tagihan dibandingkan dengan harga dasar vendor).</p>
              </div>
              
              {/* Legends */}
              <div className="flex items-center gap-4 text-[10px] font-bold">
                <div className="flex items-center gap-1.5 text-indigo-600">
                  <span className="h-2.5 w-2.5 bg-indigo-500 rounded-xs inline-block" />
                  <span>Potensi Laba Kotor</span>
                </div>
                <div className="flex items-center gap-1.5 text-emerald-600">
                  <span className="h-1.5 w-1.5 bg-emerald-500 rounded-full inline-block ring-2 ring-emerald-100" />
                  <span>Rasio Margin (%)</span>
                </div>
              </div>
            </div>

            {(() => {
              const linePoints = monthlyStats.map((item, idx) => {
                const cx = 75 + idx * 83;
                const cy = 180 - (maxMarginVal > 0 ? (item.margin / maxMarginVal) * 130 : 0);
                return { cx, cy, margin: item.margin, laba: item.labaKotor, month: item.label };
              });

              const compactRupiah = (val: number) => {
                if (val >= 1000000) return 'Rp ' + (val / 1000000).toFixed(0) + 'jt';
                if (val >= 1000) return 'Rp ' + (val / 1000).toFixed(0) + 'rb';
                return 'Rp ' + val;
              };

              return (
                <div className="space-y-4">
                  {/* Chart Block */}
                  <div className="relative bg-slate-50/50 rounded-xl p-4 border border-slate-100/85">
                    <svg className="w-full h-auto" viewBox="0 0 580 230" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <defs>
                        <linearGradient id="labaGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#4f46e5" stopOpacity="0.85" />
                          <stop offset="100%" stopColor="#6366f1" stopOpacity="0.3" />
                        </linearGradient>
                      </defs>

                      {/* Grid Lines and Axis Labels */}
                      {[0, 0.33, 0.67, 1].map((ratio, index) => {
                        const y = 180 - ratio * 130;
                        return (
                          <g key={index}>
                            <line x1="50" y1={y} x2="530" y2={y} stroke="#f1f5f9" strokeDasharray="3 3" strokeWidth="1" />
                            {/* Left Label: Laba */}
                            <text x="10" y={y + 3.5} className="fill-slate-400 font-mono text-[9px] font-bold" textAnchor="start">
                              {compactRupiah(maxLabaVal * ratio)}
                            </text>
                            {/* Right Label: Margin ratio */}
                            <text x="540" y={y + 3.5} className="fill-emerald-600 font-mono text-[9px] font-bold" textAnchor="start">
                              {(maxMarginVal * ratio).toFixed(1)}%
                            </text>
                          </g>
                        );
                      })}

                      {/* Base horizontal X-axis line */}
                      <line x1="50" y1="180" x2="530" y2="180" stroke="#e2e8f0" strokeWidth="1.5" />

                      {/* Render Bars (Potensi Laba Kotor) */}
                      {monthlyStats.map((item, idx) => {
                        const cx = 75 + idx * 83;
                        const hLaba = (item.labaKotor / maxLabaVal) * 130;
                        const barWidth = 24;
                        return (
                          <g key={idx}>
                            <rect
                              x={cx - barWidth / 2}
                              y={180 - hLaba}
                              width={barWidth}
                              height={Math.max(hLaba, 1.5)}
                              rx="3"
                              fill="url(#labaGrad)"
                              className={`transition-all duration-300 cursor-pointer ${
                                activeTooltipIndex === idx ? 'opacity-100 stroke-indigo-600 stroke-1' : 'opacity-85'
                              }`}
                              onMouseEnter={() => setActiveTooltipIndex(idx)}
                              onMouseLeave={() => setActiveTooltipIndex(null)}
                            />
                            {/* X-axis labels */}
                            <text x={cx} y="200" className={`text-center font-sans text-[10px] font-bold ${activeTooltipIndex === idx ? 'fill-indigo-600' : 'fill-slate-500'}`} textAnchor="middle">
                              {item.label}
                            </text>
                          </g>
                        );
                      })}

                      {/* Render Line (Margin Ratio) */}
                      <path
                        d={linePoints.map((p, idx) => `${idx === 0 ? 'M' : 'L'} ${p.cx} ${p.cy}`).join(' ')}
                        fill="none"
                        stroke="#10b981"
                        strokeWidth="3"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="pointer-events-none"
                      />

                      {/* Line points & transparent interactive hotspot hover zones */}
                      {linePoints.map((p, idx) => (
                        <g key={idx}>
                          {activeTooltipIndex === idx && (
                            <circle cx={p.cx} cy={p.cy} r="8" fill="#10b981" fillOpacity="0.25" className="pointer-events-none" />
                          )}
                          <circle
                            cx={p.cx}
                            cy={p.cy}
                            r="4.5"
                            fill="#10b981"
                            stroke="#ffffff"
                            strokeWidth="2.2"
                            className="pointer-events-none"
                          />
                          {/* Large Hover Zone (transparent bar) */}
                          <rect
                            x={p.cx - 28}
                            y="15"
                            width="56"
                            height="180"
                            fill="transparent"
                            className="cursor-pointer"
                            onMouseEnter={() => setActiveTooltipIndex(idx)}
                            onMouseLeave={() => setActiveTooltipIndex(null)}
                          />
                        </g>
                      ))}
                    </svg>

                    {/* Stateful Hover Tooltip Overlay */}
                    {activeTooltipIndex !== null && (
                      <div 
                        className="absolute z-10 bg-slate-900 border border-slate-800 text-white p-3 rounded-xl shadow-xl text-[11px] font-sans transition-all duration-200"
                        style={{
                          top: '15px',
                          left: `${Math.min(Math.max(20 + activeTooltipIndex * 83, 10), 380)}px`,
                          pointerEvents: 'none',
                          minWidth: '170px'
                        }}
                      >
                        <p className="font-bold text-indigo-400 text-xs border-b border-white/10 pb-1 mb-1.5">{monthlyStats[activeTooltipIndex].label} 2026</p>
                        <div className="space-y-1 font-sans">
                          <p className="flex justify-between gap-3 text-slate-300">
                            <span>Laba Kotor:</span>
                            <span className="font-bold text-white">{formatRupiah(monthlyStats[activeTooltipIndex].labaKotor)}</span>
                          </p>
                          <p className="flex justify-between gap-3 text-slate-300">
                            <span>Tagih Kotor:</span>
                            <span className="font-semibold text-slate-200">{formatRupiah(monthlyStats[activeTooltipIndex].tagihKotor)}</span>
                          </p>
                          <p className="flex justify-between gap-3 text-slate-300">
                            <span>Porsi Bayar:</span>
                            <span className="font-semibold text-slate-200">{formatRupiah(monthlyStats[activeTooltipIndex].tagihKotor - monthlyStats[activeTooltipIndex].labaKotor)}</span>
                          </p>
                          <p className="flex justify-between gap-3 border-t border-white/10 pt-1 mt-1 text-xs">
                            <span className="text-emerald-400 font-bold">Margin Rasio:</span>
                            <span className="font-black text-emerald-400">{monthlyStats[activeTooltipIndex].margin.toFixed(2)}%</span>
                          </p>
                          <p className="text-[10px] text-slate-500 italic mt-1.5 text-right font-medium">{monthlyStats[activeTooltipIndex].count} tagihan diterbitkan</p>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Accessible Data Summary Grid underneath */}
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2 text-left">
                    {monthlyStats.map((item, idx) => (
                      <div 
                        key={idx} 
                        className={`p-2.5 rounded-xl border transition-all ${
                          activeTooltipIndex === idx 
                            ? 'border-indigo-600 bg-indigo-50/20 shadow-2xs font-bold' 
                            : 'border-slate-100 bg-slate-50/50 hover:bg-slate-50'
                        }`}
                        onMouseEnter={() => setActiveTooltipIndex(idx)}
                        onMouseLeave={() => setActiveTooltipIndex(null)}
                      >
                        <div className="flex justify-between items-center text-[10px] font-bold text-slate-400 uppercase tracking-widest pb-1 border-b border-slate-100/60 mb-1">
                          <span>{item.label}</span>
                          <span className={`${item.count > 0 ? 'bg-indigo-50 text-indigo-700 px-1 rounded-sm' : 'text-slate-300'}`}>{item.count}</span>
                        </div>
                        <p className="text-[11px] font-extrabold text-slate-800 leading-tight truncate">{formatRupiah(item.labaKotor)}</p>
                        <div className="flex items-center gap-1 mt-1 justify-between text-[10px]">
                          <span className="text-slate-400 font-medium">Margin:</span>
                          <span className={`font-bold ${item.margin > 0 ? 'text-emerald-600' : 'text-slate-400'}`}>{item.margin.toFixed(1)}%</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })()}
          </div>

          {/* Actionable Warnings / Attention Needed */}
          <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-5" id="warnings-card">
            <h3 className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-2">
              <ShieldAlert className="h-4 w-4 text-rose-500" />
              Perlu Perhatian & Tindakan Segera
            </h3>

            <div className="space-y-3">
              {/* Approvals (Only show link for Direktur, or warn admin) */}
              {unsubmittedApprovals.length > 0 && (
                <div className="p-3 bg-amber-50 rounded-lg border border-amber-100 flex flex-col md:flex-row md:items-center justify-between gap-2 text-xs">
                  <div className="flex items-start gap-2">
                    <Clock className="mt-0.5 h-4 w-4 text-amber-600 shrink-0" />
                    <div>
                      <span className="font-bold text-amber-800">Menunggu Persetujuan Direktur ({unsubmittedApprovals.length})</span>
                      <p className="text-amber-700 font-medium mt-0.5">
                        Ada pembayaran baru yang diinput Spv. Keuangan dan memerlukan persetujuan direktur agar status aktif.
                      </p>
                    </div>
                  </div>
                  {userRole === 'DIREKTUR' || userRole === 'ADMINISTRATOR' ? (
                    <button
                      onClick={() => onNavigateToModule('payments')}
                      className="bg-amber-600 hover:bg-amber-700 text-white font-bold px-3 py-1.5 rounded transition-all flex items-center gap-1 self-start md:self-auto cursor-pointer"
                    >
                      Buka Approval
                      <ArrowRight className="h-3.5 w-3.5" />
                    </button>
                  ) : (
                    <span className="text-[11px] text-amber-700 font-semibold">Tindak lanjut oleh Direktur</span>
                  )}
                </div>
              )}

              {/* Deadline warnings (Active payments without invoice, sorted by date) */}
              {uninvoicedPayments.map(pay => {
                const isOverdue = new Date(pay.tanggalDeadlineTagihan) < currentDate;
                return (
                  <div 
                    key={pay.id}
                    className={`p-3 rounded-lg border flex flex-col md:flex-row md:items-center justify-between gap-2 text-xs ${
                      isOverdue ? 'bg-rose-50/70 border-rose-100 text-rose-900' : 'bg-slate-50 border-slate-100 text-slate-900'
                    }`}
                  >
                    <div className="flex items-start gap-2">
                      <AlertTriangle className={`mt-0.5 h-4 w-4 shrink-0 ${isOverdue ? 'text-rose-600' : 'text-slate-500'}`} />
                      <div>
                        <span className="font-bold">
                          {isOverdue ? 'DEADLINE LEWAT:' : 'Deadline Tagihan:'} Buat Tagihan {pay.rekanan}
                        </span>
                        <p className={`mt-0.5 ${isOverdue ? 'text-rose-700' : 'text-slate-500'}`}>
                          Pembayaran Rp {pay.jumlahBayar.toLocaleString('id-ID')} ({pay.catatan.slice(0, 50)}...) tenggat pembuatan tagihan: <span className="font-bold underline">{pay.tanggalDeadlineTagihan}</span>
                        </p>
                      </div>
                    </div>
                    {userRole === 'STAF_ADMINISTRASI_UMUM' || userRole === 'SUPERVISOR_KEUANGAN_UMUM' || userRole === 'ADMINISTRATOR' ? (
                      <button
                        onClick={() => onNavigateToModule('invoices', pay.id)}
                        className={`font-bold px-3 py-1.5 rounded transition-all flex items-center gap-1 self-start md:self-auto cursor-pointer ${
                          isOverdue 
                            ? 'bg-rose-600 hover:bg-rose-700 text-white' 
                            : 'bg-indigo-600 hover:bg-indigo-700 text-white'
                        }`}
                      >
                        Buat Invoice
                        <ArrowRight className="h-3.5 w-3.5" />
                      </button>
                    ) : (
                      <span className="text-[11px] font-semibold text-slate-500">Oleh Staf Administrasi</span>
                    )}
                  </div>
                );
              })}

              {/* Late Invoices Table */}
              {lateInvoices.length > 0 && (
                <div className="border border-rose-100 rounded-lg overflow-hidden bg-rose-50/20">
                  <div className="bg-rose-50 px-3 py-2 border-b border-rose-100 text-rose-800 font-bold text-xs flex justify-between items-center">
                    <span>CUSTOMER TERLAMBAT MEMBAYAR ({lateInvoices.length})</span>
                    <span className="text-[10px] bg-rose-200 text-rose-900 px-1.5 rounded-full">Lewat Jatuh Tempo</span>
                  </div>
                  <div className="divide-y divide-rose-100 max-h-[190px] overflow-y-auto">
                    {lateInvoices.map(inv => {
                      const overdueDays = Math.ceil((currentDate.getTime() - new Date(inv.tanggalJatuhTempo).getTime()) / (1000 * 3000 * 24));
                      return (
                        <div key={inv.id} className="p-2.5 flex justify-between items-center text-xs text-slate-700 hover:bg-rose-50/40">
                          <div>
                            <span className="font-bold text-slate-800">{inv.customerDebitur}</span>
                            <div className="flex items-center gap-2 text-[10px] text-slate-500 mt-1">
                              <span>No: {inv.nomorTagihan}</span>
                              <span>•</span>
                              <span className="text-rose-600 font-medium">Jatuh Tempo: {inv.tanggalJatuhTempo}</span>
                            </div>
                          </div>
                          <div className="text-right">
                            <span className="font-extrabold text-rose-700">{formatRupiah(inv.totalTagihan)}</span>
                            <p className="text-[9px] text-rose-500 font-bold mt-0.5">Terlambat</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {uninvoicedPayments.length === 0 && unsubmittedApprovals.length === 0 && lateInvoices.length === 0 && (
                <div className="p-8 text-center text-slate-400 text-xs flex flex-col items-center justify-center gap-1.5">
                  <CheckCircle className="h-6 w-6 text-emerald-500" />
                  <p className="font-semibold text-slate-600">Semua aman & terkendali!</p>
                  <p>Tidak ada tagihan tertinggal atau draf menunggu approval saat ini.</p>
                </div>
              )}
            </div>
          </div>

        </div>

        {/* Right column - Top Largest Invoice List & Quick Actions */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* Analysis Runway Kas & Saldo Konsolidasi */}
          {(() => {
            const sortedCash = [...cashBalances].sort((a, b) => a.tanggal.localeCompare(b.tanggal));
            const lastCashBalance = sortedCash.length > 0 
              ? sortedCash[sortedCash.length - 1] 
              : null;
            const totalCombinedCash = lastCashBalance ? getRecordTotal(lastCashBalance) : 0;

            // Calculate runway metrics based on approved payments
            const totalOutflowActive = payments
              .filter(p => p.status === 'Aktif' || p.status === 'Lunas')
              .reduce((sum, p) => sum + p.jumlahBayar, 0);

            // Estimated average daily spending flow
            const estDailySpendingVal = Math.round(totalOutflowActive / 30) || 3500000;
            const safeDaysRunway = estDailySpendingVal > 0 ? Math.round(totalCombinedCash / estDailySpendingVal) : 99;

            return (
              <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-4 space-y-4 font-sans animate-fadeIn" id="safe-cash-runway-card">
                <div>
                  <span className="text-[9px] font-black text-indigo-600 uppercase tracking-wider bg-indigo-50 px-2 py-0.5 rounded-md">
                    Analisis Keuangan Korporat
                  </span>
                  <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5 mt-2">
                    <Wallet className="h-4 w-4 text-emerald-500" />
                    Likuiditas &amp; Runway Kas
                  </h3>
                  <p className="text-[10px] text-slate-400 mt-0.5">Kekuatan dana aman kas terhadap estimasi pembayaran operasional harian.</p>
                </div>

                <div className="bg-slate-50 border border-slate-100/70 rounded-xl p-3 flex flex-col justify-between">
                  <div className="flex items-center justify-between text-[10px] text-slate-400 pb-1.5 border-b border-slate-200/50">
                    <span>Kas Terkonsolidasi</span>
                    <span className="text-[9px] text-emerald-600 font-bold">Real-time</span>
                  </div>
                  <span className="text-lg font-black text-slate-800 tracking-tight mt-1.5">
                    {formatRupiah(totalCombinedCash)}
                  </span>
                </div>

                {/* Hari Aman runway card */}
                <div className="bg-emerald-50/50 border border-emerald-100/50 rounded-xl p-3 flex items-center justify-between gap-3">
                  <div className="space-y-0.5 min-w-0">
                    <span className="text-[10px] font-extrabold text-emerald-800 uppercase block">Runway Kas Aman</span>
                    <span className="text-[9px] text-slate-505 block leading-tight">Estimasi hari aman kas terhadap tagihan pasif operasional.</span>
                  </div>
                  <div className="shrink-0 text-right">
                    <span className="text-xl font-black text-emerald-700 block leading-none">{safeDaysRunway}</span>
                    <span className="text-[9px] text-emerald-600 font-bold">Hari</span>
                  </div>
                </div>

                {/* Individual dynamic account lists */}
                <div className="pt-2 border-t border-slate-100">
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block pb-1.5 mb-1.5">Akun Aktif (Setelan)</span>
                  <div className="space-y-1.5 max-h-[160px] overflow-y-auto pr-1">
                    {activeAccounts.map(acc => {
                      let bal = 0;
                      if (lastCashBalance) {
                        if (lastCashBalance.balances && lastCashBalance.balances[acc.id] !== undefined) {
                          bal = lastCashBalance.balances[acc.id];
                        } else {
                          // fallback
                          if (acc.id === 'acc-kas-utama' && lastCashBalance.kasUtama !== undefined) bal = lastCashBalance.kasUtama;
                          else if (acc.id === 'acc-bank-bca' && lastCashBalance.bankBCA !== undefined) bal = lastCashBalance.bankBCA;
                          else if (acc.id === 'acc-bank-mandiri' && lastCashBalance.bankMandiri !== undefined) bal = lastCashBalance.bankMandiri;
                          else if (acc.id === 'acc-bank-bni' && lastCashBalance.bankBNI !== undefined) bal = lastCashBalance.bankBNI;
                        }
                      }
                      
                      return (
                        <div key={acc.id} className="flex justify-between items-center text-[10px] text-slate-500 p-1 px-1.5 hover:bg-slate-50 rounded transition-colors border border-transparent hover:border-slate-100">
                          <div className="min-w-0">
                            <span className="font-bold text-slate-700 truncate block text-[11px] leading-tight">{acc.nama}</span>
                            {acc.nomorRekening && (
                              <span className="text-[8px] font-mono text-slate-400 block tracking-wider leading-none mt-0.5">REK: {acc.nomorRekening}</span>
                            )}
                          </div>
                          <span className="font-extrabold text-slate-600 shrink-0">{formatRupiah(bal)}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            );
          })()}
          
          {/* Top 5 Invoices */}
          <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-4" id="top-invoices-card">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-4 flex items-center justify-between">
              <span>5 Tagihan Terbesar</span>
              <span className="text-[10px] bg-slate-100 text-slate-600 normal-case px-2 py-0.5 rounded-full font-medium">Nilai Terbanyak</span>
            </h3>

            <div className="space-y-3">
              {topInvoices.map((inv) => (
                <div 
                  key={inv.id} 
                  className={`p-3 rounded-lg border flex items-center justify-between gap-2 transition-all hover:border-slate-300 cursor-pointer ${
                    inv.status === 'Lunas' ? 'border-emerald-100 bg-emerald-50/5' : 'border-slate-100 bg-slate-50/30'
                  }`}
                  onClick={() => onNavigateToModule('invoices', inv.id)}
                  id={`top-inv-item-${inv.id}`}
                >
                  <div className="min-w-0">
                    <h4 className="text-xs font-bold text-slate-700 truncate">{inv.customerDebitur}</h4>
                    <p className="text-[10px] text-slate-400 mt-1 truncate">
                      {inv.rekanan}
                    </p>
                    <div className="flex items-center gap-1.5 mt-1.5">
                      <span className={`text-[9px] px-1.5 py-0.5 rounded font-extrabold ${
                        inv.status === 'Lunas' 
                          ? 'bg-emerald-100 text-emerald-800' 
                          : 'bg-amber-100 text-amber-800'
                      }`}>
                        {inv.status}
                      </span>
                      <span className="text-[9px] text-slate-400">
                        {inv.nomorTagihan}
                      </span>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="text-xs font-extrabold text-slate-800">{formatRupiah(inv.totalTagihan)}</span>
                    <p className="text-[9px] text-emerald-600 font-bold mt-1">
                      Laba: {formatRupiah(inv.jumlahTagihKotor - inv.jumlahBayar)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Info & Role Reminder */}
          <div className="bg-gradient-to-br from-indigo-50 to-slate-100 rounded-xl p-4 border border-indigo-100/50" id="quick-guide-card">
            <h4 className="text-xs font-bold text-indigo-950 flex items-center gap-1.5">
              💡 Panduan Fitur Monitoring
            </h4>
            <div className="mt-3 space-y-2 text-[11px] text-indigo-900/90 leading-relaxed">
              <p>
                <strong>Supervisor Keuangan</strong> membuat daftar bayar ke supplier vendor. Status default adalah <span className="text-amber-700 font-bold">Draft</span>.
              </p>
              <p>
                <strong>Direktur</strong> memverifikasi & menyetujui draft tersebut menjadi <span className="text-emerald-700 font-bold">Aktif</span>.
              </p>
              <p>
                <strong>Staf Administrasi</strong> menerbitkan Invoice berdasarkan daftar pembayaran aktif, dan memperbarui manual timeline pelacakan posisi berkas fisik.
              </p>
              <div className="p-2 bg-indigo-100/50 rounded text-[10px] font-medium text-indigo-950 border border-indigo-200">
                Hubungi administrator untuk penjelasan lebih lanjut.
              </div>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
};
