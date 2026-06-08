/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  FileText, 
  Plus, 
  Search, 
  Eye, 
  Calendar, 
  CreditCard, 
  Percent, 
  ChevronDown, 
  CheckCircle2, 
  AlertTriangle, 
  ArrowUpRight, 
  TrendingUp, 
  History, 
  User, 
  FileCheck2, 
  Printer, 
  Send,
  X,
  FileMinus,
  FileDown,
  Tag
} from 'lucide-react';
import { Payment, Invoice, InvoiceLog, UserRole, CompanySettings } from '../types';

interface InvoicesModuleProps {
  invoices: Invoice[];
  payments: Payment[];
  logs: InvoiceLog[];
  settings: CompanySettings;
  userRole: UserRole;
  onCreateInvoice: (invoice: Omit<Invoice, 'id'>, initialLogPosisi: string) => void;
  onAddInvoiceLog: (invoiceId: string, log: Omit<InvoiceLog, 'id' | 'updatedBy'>) => void;
  onMarkInvoiceLunas: (invoiceId: string, tanggalLunas: string) => void;
  selectedInvoiceId?: string;
}

export const InvoicesModule: React.FC<InvoicesModuleProps> = ({
  invoices,
  payments,
  logs,
  settings,
  userRole,
  onCreateInvoice,
  onAddInvoiceLog,
  onMarkInvoiceLunas,
  selectedInvoiceId,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'All' | 'Belum Lunas' | 'Lunas'>('All');
  const [isAddingNew, setIsAddingNew] = useState(false);

  // New filters
  const [filterStartDate, setFilterStartDate] = useState('');
  const [filterEndDate, setFilterEndDate] = useState('');
  const [filterKategori, setFilterKategori] = useState('All');
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);
  const [selectedPayments, setSelectedPayments] = useState<Payment[]>([]);

  // Helper date function
  const addDaysStr = (dateStr: string, days: number): string => {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return '';
    d.setDate(d.getDate() + days);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const date = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${date}`;
  };

  // Invoice creation form states
  const [customerDebitur, setCustomerDebitur] = useState('');
  const [nomorTagihan, setNomorTagihan] = useState('');
  const [tanggalTagihan, setTanggalTagihan] = useState('2026-05-28');
  const [tanggalJatuhTempo, setTanggalJatuhTempo] = useState('2026-06-28');
  const [jumlahTagihKotor, setJumlahTagihKotor] = useState<number | ''>('');
  const [jumlahTagihKotorDisplay, setJumlahTagihKotorDisplay] = useState('');
  const [ppnTarif, setPpnTarif] = useState(settings.ppnDefault);
  const [pphTarif, setPphTarif] = useState(settings.pphDefault);
  const [formError, setFormError] = useState('');

  // Log tracking form states
  const [expandedInvoiceId, setExpandedInvoiceId] = useState<string | null>(null);
  const [logTanggal, setLogTanggal] = useState('2026-05-28');
  const [logPosisi, setLogPosisi] = useState('Berkas Dikirim ke Biro Keuangan Customer');
  const [customPosisi, setCustomPosisi] = useState('');
  const [logCatatan, setLogCatatan] = useState('');

  // Preview pop-up state
  const [previewInvoice, setPreviewInvoice] = useState<Invoice | null>(null);

  // Suggested log position points
  const standardPositions = [
    ...(settings.standardPositionsList || [
      'Berkas Dikirim ke Biro Keuangan Customer',
      'Verifikasi Berkas Lengkap (Tanda Terima Diterbitkan)',
      'Persetujuan Hubungan Pelanggan / Purchasing',
      'Menunggu Antrean Rilis Kas (Dana Approved)',
      'Pembayaran Cair / Lunas'
    ]),
    'Kustom (Tulis Posisi Manual)'
  ];

  // Auto handle selected invoice parameter from parent
  useEffect(() => {
    if (selectedInvoiceId) {
      setExpandedInvoiceId(selectedInvoiceId);
    }
  }, [selectedInvoiceId]);

  // Sync default selection positions when setting standardPositions changes
  useEffect(() => {
    if (standardPositions.length > 0) {
      setLogPosisi(standardPositions[0]);
    }
  }, [settings.standardPositionsList]);

  // Handle default configurable due date calculation
  useEffect(() => {
    if (tanggalTagihan) {
      const days = settings.jatuhTempoHariDefault ?? 30;
      setTanggalJatuhTempo(addDaysStr(tanggalTagihan, days));
    }
  }, [tanggalTagihan, settings.jatuhTempoHariDefault, isAddingNew]);

  // Generate automatic invoice number based on counter
  useEffect(() => {
    if (isAddingNew) {
      const year = new Date(tanggalTagihan).getFullYear();
      const month = String(new Date(tanggalTagihan).getMonth() + 1).padStart(2, '0');
      const counter = String(invoices.length + 1).padStart(3, '0');
      
      // Auto prefill Invoice Format
      let generatedNum = settings.formatNomorTagihan
        .replace('{YEAR}', String(year))
        .replace('{MONTH}', month)
        .replace('{COUNT}', counter);
      
      setNomorTagihan(generatedNum);
    }
  }, [isAddingNew, tanggalTagihan, invoices.length, settings.formatNomorTagihan]);

  const handleTogglePaymentSelection = (payment: Payment) => {
    let nextPayments = [...selectedPayments];
    const index = nextPayments.findIndex(p => p.id === payment.id);
    if (index >= 0) {
      nextPayments.splice(index, 1);
    } else {
      nextPayments.push(payment);
    }
    setSelectedPayments(nextPayments);
    
    // Sync single selectedPayment state with first item for backward-compatibility & info blocks
    const firstPay = nextPayments[0] || null;
    setSelectedPayment(firstPay);

    if (nextPayments.length > 0) {
      // Sum the total cost of all selected payments (nilai modal total)
      const totalCost = nextPayments.reduce((sum, p) => sum + p.jumlahBayar, 0);
      const suggested = Math.round(totalCost * 1.2);
      setJumlahTagihKotor(suggested);
      setJumlahTagihKotorDisplay(suggested.toLocaleString('id-ID'));
    } else {
      setJumlahTagihKotor('');
      setJumlahTagihKotorDisplay('');
    }
  };

  const handleJumlahTagihKotorChange = (valStr: string) => {
    const clean = valStr.replace(/\D/g, '');
    if (clean === '') {
      setJumlahTagihKotorDisplay('');
      setJumlahTagihKotor('');
    } else {
      const num = Number(clean);
      setJumlahTagihKotor(num);
      setJumlahTagihKotorDisplay(num.toLocaleString('id-ID'));
    }
  };

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (selectedPayments.length === 0) {
      setFormError('Silakan pilih minimal satu daftar pembayaran rekanan asal terlebih dahulu');
      return;
    }
    if (!customerDebitur.trim()) {
      setFormError('Nama Customer / Debitur wajib diisi');
      return;
    }
    if (!nomorTagihan.trim()) {
      setFormError('Nomor tagihan wajib diisi');
      return;
    }
    if (!jumlahTagihKotor || Number(jumlahTagihKotor) <= 0) {
      setFormError('Jumlah tagihan kotor (sebelum pajak) wajib diisi angka positif');
      return;
    }

    const kotor = Number(jumlahTagihKotor);
    const ppnNominal = Math.round((kotor * ppnTarif) / 100);
    const pphNominal = Math.round((kotor * pphTarif) / 100);
    const totalTagihan = kotor + ppnNominal - pphNominal;

    // Aggregate unique rekanan list
    const uniqueRekanan = Array.from(new Set(selectedPayments.map(p => p.rekanan))).join(', ');
    const totalModal = selectedPayments.reduce((sum, p) => sum + p.jumlahBayar, 0);

    const newInvoiceObj: Omit<Invoice, 'id'> = {
      paymentId: selectedPayments[0].id, // first ID for fallback compatibility
      paymentIds: selectedPayments.map(p => p.id), // full group of linked payments
      rekanan: uniqueRekanan,
      jumlahBayar: totalModal, // combined cost
      customerDebitur,
      nomorTagihan,
      tanggalTagihan,
      tanggalJatuhTempo,
      jumlahTagihKotor: kotor,
      ppnTarif,
      pphTarif,
      ppnNominal,
      pphNominal,
      totalTagihan,
      status: 'Belum Lunas',
    };

    onCreateInvoice(newInvoiceObj, 'Tagihan Diterbitkan');
    
    // Reset Form
    setIsAddingNew(false);
    setSelectedPayment(null);
    setSelectedPayments([]);
    setCustomerDebitur('');
    setJumlahTagihKotor('');
    setJumlahTagihKotorDisplay('');
    setPpnTarif(settings.ppnDefault);
    setPphTarif(settings.pphDefault);
  };

  // Handle manual additions to logs
  const handleAddLogSubmit = (e: React.FormEvent, invoiceId: string) => {
    e.preventDefault();
    const finalPosName = logPosisi === 'Kustom (Tulis Posisi Manual)' ? customPosisi : logPosisi;
    
    // Past date guard check
    const now = new Date();
    const todayLocal = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    if (logTanggal < todayLocal && logTanggal < '2026-05-28') {
      alert('Peringatan: Anda tidak dapat menginput tanggal log mundur (hari kemarin)! Silakan masukkan tanggal hari ini atau setelahnya.');
      return;
    }

    if (!finalPosName.trim()) {
      alert('Nama posisi pelacakan tidak boleh kosong');
      return;
    }

    onAddInvoiceLog(invoiceId, {
      invoiceId,
      tanggal: logTanggal,
      posisi: finalPosName,
      catatan: logCatatan || 'Pembaruan posisi fisik berkas tagihan.',
    });

    // Check if user set position to "Pembayaran Cair / Lunas" -> auto match mark lunas
    if (finalPosName === 'Pembayaran Cair / Lunas') {
      onMarkInvoiceLunas(invoiceId, logTanggal);
    }

    // Reset log inputs
    setLogCatatan('');
    setCustomPosisi('');
  };

  const formatRupiah = (num: number) => {
    return 'Rp ' + num.toLocaleString('id-ID');
  };

  const categoryOptions = settings?.kategoriList || [
    'Pemasaran',
    'SDM',
    'Humas',
    'Operasional',
    'Logistik',
    'Umum'
  ];

  // Filters
  const eligiblePayments = payments.filter(p => p.status === 'Aktif' && !p.hasInvoice);
  const filteredInvoices = invoices.filter(inv => {
    const normalizedKeyword = searchTerm.toLowerCase();

    // Associated payments for Category checking and catatans
    const linkedIds = inv.paymentIds || [inv.paymentId].filter(Boolean);
    const linkedPayments = payments.filter(p => linkedIds.includes(p.id));
    const linkedCategories = linkedPayments.map(p => p.kategori || '').filter(Boolean);
    const linkedCatatans = linkedPayments.map(p => p.catatan).join(' ').toLowerCase();

    const matchesSearch = 
      inv.customerDebitur.toLowerCase().includes(normalizedKeyword) || 
      inv.nomorTagihan.toLowerCase().includes(normalizedKeyword) ||
      inv.rekanan.toLowerCase().includes(normalizedKeyword) ||
      linkedCatatans.includes(normalizedKeyword) ||
      linkedCategories.some(cat => cat.toLowerCase().includes(normalizedKeyword));

    const matchesStatus = statusFilter === 'All' || inv.status === statusFilter;
    const matchesKategori = filterKategori === 'All' || linkedPayments.some(p => p.kategori === filterKategori);

    let matchesDate = true;
    if (filterStartDate) {
      matchesDate = matchesDate && inv.tanggalTagihan >= filterStartDate;
    }
    if (filterEndDate) {
      matchesDate = matchesDate && inv.tanggalTagihan <= filterEndDate;
    }

    return matchesSearch && matchesStatus && matchesKategori && matchesDate;
  });

  const handleDownloadInvoicesCSV = () => {
    const headers = ['ID Tagihan', 'Customer / Debitur', 'No. Tagihan', 'Pemasok / Vendor', 'Pajak PPN (%)', 'Pajak PPh (%)', 'Total Tagihan (Rp)', 'Tgl Tagihan', 'Jatuh Tempo', 'Status Pembayaran', 'Kategori Terkait'];
    
    const rows = filteredInvoices.map(inv => {
      // Find linked categories
      const linkedIds = inv.paymentIds || [inv.paymentId].filter(Boolean);
      const linkedPayments = payments.filter(p => linkedIds.includes(p.id));
      const catsOption = linkedPayments.map(p => p.kategori || 'Tanpa Kategori');
      const catsString = Array.from(new Set(catsOption)).join(', ') || 'Tanpa Kategori';

      return [
        inv.id,
        inv.customerDebitur,
        inv.nomorTagihan,
        inv.rekanan,
        inv.ppnTarif,
        inv.pphTarif,
        inv.totalTagihan,
        inv.tanggalTagihan,
        inv.tanggalJatuhTempo,
        inv.status,
        catsString
      ];
    });

    const csvRows = [headers.join(','), ...rows.map(r => r.map(x => {
      const strVal = String(x);
      if (strVal.includes(',') || strVal.includes('\n') || strVal.includes('"')) {
        return `"${strVal.replace(/"/g, '""')}"`;
      }
      return strVal;
    }).join(','))];
    
    const csvString = csvRows.join('\r\n');
    const blob = new Blob([new Uint8Array([0xEF, 0xBB, 0xBF]), csvString], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    
    const dateStr = new Date().toISOString().split('T')[0];
    link.setAttribute('download', `Daftar_Tagihan_PT_Semen_${dateStr}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const canEditInvoice = userRole === 'STAF_ADMINISTRASI_UMUM' || userRole === 'SUPERVISOR_KEUANGAN_UMUM' || userRole === 'ADMINISTRATOR';

  return (
    <div className="space-y-6" id="invoices-module-root">
      
      {/* Alert Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
        <div>
          <h2 className="text-base font-bold text-slate-800">Manajemen Tagihan (Invoice Customer PT Semen)</h2>
          <p className="text-xs text-slate-400 mt-1">
            Staf Administrasi dapat menerbitkan invoice berdasarkan rencana pembayaran yang sudah diapprove Direktur, serta menambahkan log posisi tagihan.
          </p>
        </div>
        {canEditInvoice && !isAddingNew && (
          <button
            onClick={() => {
              setIsAddingNew(true);
              setFormError('');
            }}
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs px-4 py-2.5 rounded-lg shadow-sm hover:shadow flex items-center gap-1.5 transition-all self-start md:self-auto cursor-pointer"
            id="btn-add-invoice-trigger"
          >
            <Plus className="h-4 w-4" />
            Terbitkan Tagihan Baru
          </button>
        )}
      </div>

      {/* Insert Tagihan Form */}
      {isAddingNew && (
        <div className="bg-white rounded-xl border border-indigo-100 shadow-sm p-5 animate-fadeIn" id="invoice-add-form">
          <div className="flex items-center justify-between border-b border-indigo-50 pb-3 mb-4">
            <h3 className="text-sm font-bold text-indigo-950 flex items-center gap-1.5">
              <FileText className="h-4 w-4 text-indigo-600" />
              Form Pembuatan Tagihan Baru
            </h3>
            <button 
              onClick={() => {
                setIsAddingNew(false);
                setSelectedPayment(null);
                setSelectedPayments([]);
                setFormError('');
              }}
              className="text-slate-400 hover:text-slate-600 p-1 hover:bg-slate-50 rounded"
              id="btn-close-invoice"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <form onSubmit={handleCreateSubmit} className="space-y-4">
            {formError && (
              <div className="p-3 bg-rose-50 border border-rose-100 rounded-lg text-rose-700 text-xs font-semibold flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 shrink-0" />
                {formError}
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              
              {/* Step 1: Tarik Rencana Pembayaran */}
              <div className="space-y-1 md:col-span-2">
                <label className="text-xs font-bold text-indigo-900 block">
                  1. Pilih Satu atau Beberapa Referensi Pembayaran (Yang Telah Diapprove Direktur) <span className="text-rose-500">*</span>
                </label>
                
                {eligiblePayments.length === 0 ? (
                  <div className="p-4 bg-amber-50 border border-amber-200 text-amber-800 rounded-lg text-xs font-semibold">
                    Tidak ada referensi pembayaran aktif yang siap ditagih (hasInvoice = false).
                  </div>
                ) : (
                  <div className="border border-slate-200 rounded-lg overflow-hidden bg-slate-50/40">
                    <div className="p-2 border-b border-slate-200 bg-white text-[10px] text-slate-500 font-bold uppercase tracking-wider flex justify-between items-center">
                      <span>Daftar Rencana Pembayaran Tersedia</span>
                      <span className="text-indigo-600 bg-indigo-50 px-2.5 py-0.5 rounded-full font-extrabold">{selectedPayments.length} Terpilih</span>
                    </div>
                    <div className="max-h-56 overflow-y-auto divide-y divide-slate-100 bg-white">
                      {eligiblePayments.map((p) => {
                        const isChecked = selectedPayments.some(sp => sp.id === p.id);
                        return (
                          <div 
                            key={p.id} 
                            onClick={() => handleTogglePaymentSelection(p)}
                            className={`p-2.5 flex items-start gap-3 text-xs cursor-pointer hover:bg-indigo-50/30 transition-colors ${
                              isChecked ? 'bg-indigo-50/20 font-semibold' : ''
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => {}} // handled by click parent
                              className="mt-0.5 h-3.5 w-3.5 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500 cursor-pointer"
                            />
                            <div className="min-w-0 flex-1">
                              <div className="flex justify-between font-bold text-slate-800">
                                <span className="truncate">{p.rekanan}</span>
                                <span className="text-indigo-950 ml-2 shrink-0">{formatRupiah(p.jumlahBayar)}</span>
                              </div>
                              <p className="text-[10px] text-slate-500 truncate mt-0.5" title={p.catatan}>
                                {p.catatan}
                              </p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
                <p className="text-[10px] text-slate-400 font-medium">
                  Sistem otomatis mengikat nomor invoice dengan seluruh daftar rencana pembayaran yang dicentang di atas.
                </p>
              </div>

              {selectedPayments.length > 0 && selectedPayment && (
                <React.Fragment>
                  {/* Step 1.1 Autofilled box info */}
                  <div className="md:col-span-2 bg-slate-50 p-3.5 rounded-lg border border-slate-200 space-y-3.5 text-xs animate-fadeIn">
                    <div className="flex justify-between items-center border-b border-slate-200 pb-2">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide block">Rangkuman Pembayaran Terpilih ({selectedPayments.length})</span>
                      <span className="text-[11px] font-extrabold text-indigo-700 bg-indigo-50 px-2.5 py-0.5 rounded-full">
                        Total Modal: {formatRupiah(selectedPayments.reduce((acc, p) => acc + p.jumlahBayar, 0))}
                      </span>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-36 overflow-y-auto">
                      {selectedPayments.map((p, idx) => (
                        <div key={p.id} className="bg-white p-2.5 rounded-lg border border-slate-200 flex flex-col justify-between select-none">
                          <div className="flex justify-between items-start gap-2">
                            <span className="font-bold text-slate-800 leading-tight block">{idx + 1}. {p.rekanan}</span>
                            <strong className="text-[11px] text-slate-900 shrink-0">{formatRupiah(p.jumlahBayar)}</strong>
                          </div>
                          <p className="text-[10px] text-slate-500 mt-1 line-clamp-2 italic" title={p.catatan}>
                            "{p.catatan}"
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Step 2: Customer Debitur */}
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-600 block">
                      Nama Customer / Debitur <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      placeholder="Contoh: PT Semen Tonasa (Pusat)"
                      value={customerDebitur}
                      onChange={(e) => setCustomerDebitur(e.target.value)}
                      className="w-full text-xs p-2.5 border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-500 bg-white"
                      id="input-invoice-customer"
                    />
                  </div>

                  {/* Step 3: Nomor Tagihan */}
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-600 block">
                      Nomor Invoice / Tagihan <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      placeholder="INV/2026/05/102"
                      value={nomorTagihan}
                      onChange={(e) => setNomorTagihan(e.target.value)}
                      className="w-full text-xs p-2.5 border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-500 bg-white font-mono"
                      id="input-invoice-nomor"
                    />
                  </div>

                  {/* Step 4: Tanggal Tagihan */}
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-600 block">Tanggal Terbit Tagihan</label>
                    <input
                      type="date"
                      value={tanggalTagihan}
                      onChange={(e) => setTanggalTagihan(e.target.value)}
                      className="w-full text-xs p-2.5 border border-slate-200 rounded-lg focus:outline-none"
                    />
                  </div>

                  {/* Step 5: Tanggal Jatuh Tempo */}
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-600 block">Tanggal Jatuh Tempo (Term of Payment)</label>
                    <input
                      type="date"
                      value={tanggalJatuhTempo}
                      onChange={(e) => setTanggalJatuhTempo(e.target.value)}
                      className="w-full text-xs p-2.5 border border-slate-200 rounded-lg focus:outline-none"
                    />
                  </div>

                  {/* Step 6: Jumlah Tagih Kotor (Markup Base) */}
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-600 block">
                      Jumlah Tagih Kotor ke Semen (Sebelum Pajak) <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-2.5 text-xs text-slate-400 font-bold">Rp</span>
                      <input
                        type="text"
                        placeholder="Contoh: 55.000.000"
                        value={jumlahTagihKotorDisplay}
                        onChange={(e) => handleJumlahTagihKotorChange(e.target.value)}
                        className="w-full text-xs pl-8 pr-3 p-2.5 border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-500 font-extrabold text-indigo-900 bg-white"
                        id="input-invoice-kotor"
                      />
                    </div>
                    {(() => {
                      const totalModalCost = selectedPayments.reduce((acc, p) => acc + p.jumlahBayar, 0);
                      if (jumlahTagihKotor && Number(jumlahTagihKotor) <= totalModalCost) {
                        return (
                          <span className="text-[10px] text-amber-600 font-bold block bg-amber-50 p-2 rounded-lg mt-1 border border-amber-100">
                            ⚠️ Peringatan: Nilai tagihan kotor ({formatRupiah(Number(jumlahTagihKotor))}) lebih kecil/sama dengan nilai total pengeluaran kas supplier ({formatRupiah(totalModalCost)}). Potensi margin laba akan negatif atau nihil.
                          </span>
                        );
                      }
                      return null;
                    })()}
                  </div>

                  {/* Step 7: Pajak configuration */}
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-500 block">PPN (%)</label>
                      <input
                        type="number"
                        value={ppnTarif}
                        onChange={(e) => setPpnTarif(Number(e.target.value))}
                        className="w-full text-xs p-2 border border-slate-200 rounded-lg"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-500 block">PPh Pasal 23 (%)</label>
                      <input
                        type="number"
                        value={pphTarif}
                        onChange={(e) => setPphTarif(Number(e.target.value))}
                        className="w-full text-xs p-2 border border-slate-200 rounded-lg"
                      />
                    </div>
                  </div>

                  {/* Step 8: Real-time calculation Summary */}
                  {jumlahTagihKotor && (
                    <div className="md:col-span-2 bg-indigo-50/50 p-4 rounded-xl border border-indigo-100 flex flex-col md:flex-row md:items-center justify-between gap-4 text-xs font-semibold">
                      <div className="space-y-1">
                        <span className="text-[10px] text-indigo-400 uppercase font-bold block">Rincian Perhitungan Transaksi</span>
                        <p className="text-slate-600">Subtotal Kotor: <strong className="text-slate-800">{formatRupiah(Number(jumlahTagihKotor))}</strong></p>
                        <p className="text-emerald-700">PPN (+{ppnTarif}%): <span>{formatRupiah(Math.round((Number(jumlahTagihKotor) * ppnTarif) / 100))}</span></p>
                        <p className="text-rose-700">PPh (-{pphTarif}%): <span>{formatRupiah(Math.round((Number(jumlahTagihKotor) * pphTarif) / 100))}</span></p>
                      </div>

                      <div className="md:border-l md:border-dashed border-indigo-200 md:pl-4 space-y-1.5 text-right">
                        <div>
                          <span className="text-[9px] text-slate-400 uppercase font-black block">Total Piutang Tagihan (Nett)</span>
                          <strong className="text-base font-black text-indigo-900">
                            {formatRupiah(
                              Number(jumlahTagihKotor) + 
                              Math.round((Number(jumlahTagihKotor) * ppnTarif) / 100) - 
                              Math.round((Number(jumlahTagihKotor) * pphTarif) / 100)
                            )}
                          </strong>
                        </div>
                        <div>
                          <span className="text-[9px] text-emerald-600 uppercase font-bold block text-left md:text-right">Potensi Margin Laba Kotor</span>
                          <span className="text-xs font-extrabold text-emerald-700 block text-left md:text-right">
                            {formatRupiah(Number(jumlahTagihKotor) - selectedPayments.reduce((acc, p) => acc + p.jumlahBayar, 0))}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="md:col-span-2 flex justify-end gap-3 border-t border-slate-100 pt-4">
                    <button
                      type="button"
                      onClick={() => {
                        setIsAddingNew(false);
                        setSelectedPayment(null);
                        setSelectedPayments([]);
                      }}
                      className="bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold text-xs px-4 py-2 rounded-lg cursor-pointer transition-colors"
                    >
                      Batal
                    </button>
                    <button
                      type="submit"
                      className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs px-5 py-2 rounded-lg shadow hover:shadow-md transition-all cursor-pointer"
                      id="btn-create-invoice-submit"
                    >
                      Terbitkan Invoice
                    </button>
                  </div>

                </React.Fragment>
              )}

            </div>
          </form>
        </div>
      )}

      {/* Invoice Filter Options */}
      <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden" id="invoices-list-card">
        <div className="p-4 border-b border-slate-100 bg-slate-50/40 space-y-3">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
            {/* Search */}
            <div className="relative max-w-sm w-full lg:w-72">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="Cari customer, no invoice, rekanan..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="text-xs w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-500 font-medium"
                id="search-invoices"
              />
            </div>

            {/* Status filters */}
            <div className="flex flex-wrap items-center gap-1.5 animate-fadeIn">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Status:</span>
              {(['All', 'Belum Lunas', 'Lunas'] as const).map((status) => (
                <button
                  key={status}
                  onClick={() => setStatusFilter(status)}
                  className={`text-xs px-3 py-1.5 font-bold rounded-lg transition-all cursor-pointer ${
                    statusFilter === status 
                      ? 'bg-slate-800 text-white' 
                      : 'bg-white text-slate-600 border border-slate-100 hover:bg-slate-50'
                  }`}
                  id={`btn-filter-invoice-${status}`}
                >
                  {status === 'All' ? 'Semua' : status}
                </button>
              ))}
            </div>

            {/* Download Button */}
            <button
              onClick={handleDownloadInvoicesCSV}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-3.5 py-2 rounded-lg flex items-center justify-center gap-1.5 transition-all self-stretch lg:self-auto cursor-pointer shadow-2xs"
              id="btn-download-invoices-csv"
              type="button"
            >
              <FileDown className="h-4 w-4 shrink-0" />
              Ekspor ke Excel / CSV
            </button>
          </div>

          {/* Sub-Filters: Category & Date range */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2.5 border-t border-slate-100/50">
            {/* Category selection */}
            <div className="flex flex-col gap-1 text-left">
              <label className="text-[10px] font-bold text-slate-500 uppercase flex items-center gap-1">
                <Tag className="h-3 w-3 text-indigo-500" />
                Saring Kategori Pembayaran Terkait
              </label>
              <select
                value={filterKategori}
                onChange={(e) => setFilterKategori(e.target.value)}
                className="text-xs p-2 bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-500 font-semibold text-slate-700"
              >
                <option value="All">Semua Kategori</option>
                {categoryOptions.map((kat) => (
                  <option key={kat} value={kat}>{kat}</option>
                ))}
              </select>
            </div>

            {/* Start Date */}
            <div className="flex flex-col gap-1 text-left">
              <label className="text-[10px] font-bold text-slate-500 uppercase flex items-center gap-1">
                <Calendar className="h-3 w-3 text-slate-400" />
                Awal Tanggal Invoice
              </label>
              <input
                type="date"
                value={filterStartDate}
                onChange={(e) => setFilterStartDate(e.target.value)}
                className="text-xs p-1.5 bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-500 font-medium text-slate-700"
              />
            </div>

            {/* End Date */}
            <div className="flex flex-col gap-1 text-left">
              <label className="text-[10px] font-bold text-slate-500 uppercase flex items-center gap-1">
                <Calendar className="h-3 w-3 text-slate-400" />
                Akhir Tanggal Invoice
              </label>
              <input
                type="date"
                value={filterEndDate}
                onChange={(e) => setFilterEndDate(e.target.value)}
                className="text-xs p-1.5 bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-500 font-medium text-slate-700"
              />
            </div>
          </div>
        </div>

        {/* Invoice Grid Listing */}
        {filteredInvoices.length === 0 ? (
          <div className="p-12 text-center text-slate-400 text-xs flex flex-col items-center justify-center gap-2">
            <FileMinus className="h-10 w-10 text-slate-300 stroke-[1.2]" />
            <p>Tidak ada tagihan yang terdaftar.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {filteredInvoices.map((inv) => {
              const isExpanded = expandedInvoiceId === inv.id;
              const overdue = inv.status === 'Belum Lunas' && new Date(inv.tanggalJatuhTempo) < new Date('2026-05-28');

              // filter logs for this invoice, sort by date descending
              const invoiceLogs = logs
                .filter(l => l.invoiceId === inv.id)
                .sort((a, b) => new Date(b.tanggal).getTime() - new Date(a.tanggal).getTime());

              const currentPosition = invoiceLogs[0]?.posisi || 'Belum Dilacak';

              return (
                <div 
                  key={inv.id} 
                  className={`p-4 transition-all ${
                    isExpanded ? 'bg-slate-50/40' : 'hover:bg-slate-50/10'
                  }`}
                  id={`invoice-item-${inv.id}`}
                >
                  <div 
                    className="flex flex-col md:flex-row md:items-center justify-between gap-4 cursor-pointer"
                    onClick={() => setExpandedInvoiceId(isExpanded ? null : inv.id)}
                  >
                    <div className="space-y-1.5 flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-extrabold text-sm text-slate-800">{inv.customerDebitur}</span>
                        <span className="text-[10px] font-mono text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">
                          {inv.nomorTagihan}
                        </span>
                        <span className={`px-2 py-0.5 rounded text-[9px] font-extrabold ${
                          inv.status === 'Lunas' 
                            ? 'bg-emerald-100 text-emerald-800' 
                            : 'bg-amber-100 text-amber-800'
                        }`}>
                          {inv.status}
                        </span>
                        {overdue && (
                          <span className="bg-rose-100 text-rose-800 font-extrabold text-[9px] px-2 py-0.5 rounded animate-pulse">
                            Jatuh Tempo Lewat
                          </span>
                        )}
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] text-slate-500 font-medium">
                        <p><span className="text-slate-400">Vendor:</span> {inv.rekanan}</p>
                        <p><span className="text-slate-400">Jatuh Tempo:</span> {inv.tanggalJatuhTempo}</p>
                        <p className="col-span-2">
                          <span className="text-slate-400">Posisi Terakhir:</span> <span className="font-bold text-indigo-700">{currentPosition}</span>
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 justify-between md:justify-end shrink-0">
                      <div className="text-right">
                        <span className="text-xs text-slate-400 block font-semibold uppercase tracking-wider">Total Ditagihkan</span>
                        <strong className="text-sm font-extrabold text-slate-800">{formatRupiah(inv.totalTagihan)}</strong>
                        <span className="text-[10px] text-emerald-600 font-extrabold block">
                          Margin: +{formatRupiah(inv.jumlahTagihKotor - inv.jumlahBayar)}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setPreviewInvoice(inv);
                          }}
                          className="p-2 border border-slate-200 rounded-lg hover:bg-slate-50 text-slate-600 transition-colors cursor-pointer"
                          title="Preview Faktur Invoice"
                          id={`btn-preview-inv-${inv.id}`}
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setExpandedInvoiceId(isExpanded ? null : inv.id);
                          }}
                          className="p-2 border border-slate-200 rounded-lg hover:bg-slate-50 text-slate-600 transition-colors"
                        >
                          <ChevronDown className={`h-4 w-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Expanded detailed module & logs timeline tracking */}
                  {isExpanded && (
                    <div className="mt-4 pt-4 border-t border-slate-100 grid grid-cols-1 lg:grid-cols-2 gap-6 animate-fadeIn">
                      
                      {/* Financial Detail Breakdown */}
                      <div className="space-y-4">
                        {/* Linked Payments Breakdown */}
                        {(() => {
                          const linkedIds = inv.paymentIds || [inv.paymentId].filter(Boolean);
                          if (linkedIds.length === 0) return null;
                          return (
                            <div className="bg-slate-50/70 rounded-xl p-4 border border-slate-200 space-y-2 text-xs">
                              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                                <CreditCard className="h-4 w-4 text-indigo-600" />
                                Daftar Rencana Pembayaran Terkait ({linkedIds.length})
                              </h4>
                              <div className="overflow-x-auto">
                                <table className="w-full text-left text-xs">
                                  <thead>
                                    <tr className="border-b border-slate-200 text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                                      <th className="py-1">Vendor / Rekanan</th>
                                      <th className="py-1 text-right">Pembayaran (Modal)</th>
                                    </tr>
                                  </thead>
                                  <tbody className="divide-y divide-slate-100">
                                    {payments.filter(p => linkedIds.includes(p.id)).map(p => (
                                      <tr key={p.id} className="text-slate-700">
                                        <td className="py-1.5 font-semibold">
                                          <span>{p.rekanan}</span>
                                          <span className="block text-[9px] text-slate-400 font-medium truncate max-w-[200px]" title={p.catatan}>
                                            {p.catatan}
                                          </span>
                                        </td>
                                        <td className="py-1.5 text-right font-bold text-slate-800">{formatRupiah(p.jumlahBayar)}</td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            </div>
                          );
                        })()}

                        <div className="bg-slate-50/70 rounded-xl p-4 border border-slate-200 space-y-3">
                          <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1">
                            <TrendingUp className="h-4 w-4 text-emerald-600" />
                            Detail & Analisis Laba Transaksi
                          </h4>
                          
                          <div className="space-y-2 text-xs">
                            <div className="flex justify-between border-b border-slate-100 pb-1.5 text-slate-600">
                              <span>Biaya Beban Vendor ({inv.rekanan})</span>
                              <strong className="text-slate-800">{formatRupiah(inv.jumlahBayar)}</strong>
                            </div>
                            <div className="flex justify-between border-b border-slate-100 pb-1.5 text-slate-600">
                              <span>Subtotal Tagih Kotor (Harga Markup)</span>
                              <strong className="text-slate-800">{formatRupiah(inv.jumlahTagihKotor)}</strong>
                            </div>
                            <div className="flex justify-between border-b border-slate-100 pb-1.5 text-emerald-700">
                              <span>PPN Tambahan (+{inv.ppnTarif}%)</span>
                              <span>{formatRupiah(inv.ppnNominal)}</span>
                            </div>
                            <div className="flex justify-between border-b border-slate-100 pb-1.5 text-rose-700">
                              <span>PPh Pasal 23 Potongan (-{inv.pphTarif}%)</span>
                              <span>({formatRupiah(inv.pphNominal)})</span>
                            </div>
                            <div className="flex justify-between border-b border-slate-100 pb-1.5 text-slate-800 font-extrabold">
                              <span>Total Piutang Tagihan (Nett)</span>
                              <span className="text-indigo-800 text-sm">{formatRupiah(inv.totalTagihan)}</span>
                            </div>
                            <div className="flex justify-between items-center bg-emerald-50 p-2.5 rounded border border-emerald-100">
                              <span className="font-extrabold text-emerald-800">Margin Laba Perusahaan (Kotor):</span>
                              <strong className="text-sm font-black text-emerald-800">
                                {formatRupiah(inv.jumlahTagihKotor - inv.jumlahBayar)}
                              </strong>
                            </div>
                          </div>
                        </div>

                        {/* Force Lunas button */}
                        {inv.status === 'Belum Lunas' && (
                          <div className="p-3 bg-indigo-50 border border-indigo-100 rounded-xl flex items-center justify-between text-xs">
                            <div className="text-slate-700">
                              <span className="font-bold block">Urusan Pembayaran Sudah Selesai?</span>
                              <span>Tandai selesai jika customer PT Semen telah melunasi tagihannya.</span>
                            </div>
                            {canEditInvoice ? (
                              <button
                                onClick={() => onMarkInvoiceLunas(inv.id, '2026-05-28')}
                                className="bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-[11px] px-3.5 py-2 rounded-lg cursor-pointer"
                                id={`btn-done-lunas-${inv.id}`}
                              >
                                Set Lunas
                              </button>
                            ) : (
                              <span className="text-[10px] bg-slate-200 text-slate-500 font-bold p-1 px-2 rounded">Khusus Admin</span>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Manual tracker log & Timeline */}
                      <div className="space-y-4">
                        <div className="bg-white rounded-xl border border-slate-100 p-4 space-y-4">
                          <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center justify-between">
                            <span className="flex items-center gap-1">
                              <History className="h-4 w-4 text-slate-500" />
                              Log Posisi Dokumen ({invoiceLogs.length})
                            </span>
                            <span className="text-[9px] text-slate-400 bg-slate-50 px-2 rounded-full lowercase font-medium">Bisa diedit staf</span>
                          </h4>

                          {/* Quick adding log (only for administration & Administrator) */}
                          {canEditInvoice && inv.status === 'Belum Lunas' && (
                            <form onSubmit={(e) => handleAddLogSubmit(e, inv.id)} className="space-y-2.5 border-b border-dashed border-slate-100 pb-4">
                              <div className="input-group grid grid-cols-2 gap-2 text-xs">
                                <div className="space-y-1">
                                  <label className="font-bold text-slate-600 text-[10px]">Tanggal Log Posisi</label>
                                  <input
                                    type="date"
                                    value={logTanggal}
                                    onChange={(e) => setLogTanggal(e.target.value)}
                                    min={new Date().toISOString().split('T')[0] < '2026-05-28' ? new Date().toISOString().split('T')[0] : '2026-05-28'}
                                    className="w-full p-2 border border-slate-200 rounded bg-slate-50"
                                  />
                                </div>
                                <div className="space-y-1">
                                  <label className="font-bold text-slate-600 text-[10px]">Posisi Saat Ini</label>
                                  <select
                                    value={logPosisi}
                                    onChange={(e) => setLogPosisi(e.target.value)}
                                    className="w-full p-2 border border-slate-200 rounded bg-slate-50"
                                  >
                                    {standardPositions.map((p, idx) => (
                                      <option key={idx} value={p}>{p}</option>
                                    ))}
                                  </select>
                                </div>
                              </div>

                              {logPosisi === 'Kustom (Tulis Posisi Manual)' && (
                                <div className="space-y-1">
                                  <label className="font-bold text-slate-600 text-[10px] block">Tulis Posisi Kustom</label>
                                  <input
                                    type="text"
                                    placeholder="Contoh: Mengirim fotokopi PO revisi"
                                    value={customPosisi}
                                    onChange={(e) => setCustomPosisi(e.target.value)}
                                    className="w-full text-xs p-2 border border-slate-300 rounded focus:outline-none"
                                  />
                                </div>
                              )}

                              <div className="space-y-1 text-xs">
                                <label className="font-bold text-slate-600 text-[10px] block">Catatan Pendukung (Opsional)</label>
                                <input
                                  type="text"
                                  placeholder="Contoh: Diterima oleh staf kasir PT Semen"
                                  value={logCatatan}
                                  onChange={(e) => setLogCatatan(e.target.value)}
                                  className="w-full p-2 border border-slate-200 rounded"
                                />
                              </div>

                              <button
                                type="submit"
                                className="w-full bg-slate-800 hover:bg-slate-900 text-white font-extrabold text-[10px] py-1.5 rounded transition-transform cursor-pointer"
                                id={`btn-add-log-submit-${inv.id}`}
                              >
                                Tambahkan Pembaruan Log Posisi
                              </button>
                            </form>
                          )}

                          {/* Render the Timeline logs */}
                          <div className="relative border-l-2 border-indigo-100 pl-5 ml-3 py-2 space-y-4 max-h-[300px] overflow-y-auto">
                            {invoiceLogs.map((log, idx) => {
                              const isLatest = idx === 0;
                              const isLunas = log.posisi === 'Pembayaran Cair / Lunas';
                              const isTerbit = log.posisi === 'Tagihan Diterbitkan' || log.posisi.includes('diterbitkan');
                              
                              let statusColor = "bg-indigo-500 text-white";
                              let ringColor = "ring-indigo-100";
                              if (isLunas) {
                                statusColor = "bg-emerald-500 text-white";
                                ringColor = "ring-emerald-100";
                              } else if (isTerbit) {
                                statusColor = "bg-violet-500 text-white";
                                ringColor = "ring-violet-100";
                              }

                              return (
                                <div key={log.id} className="relative text-xs">
                                  {/* Timeline node circle */}
                                  <span className={`absolute -left-[29px] top-1.5 h-4 w-4 rounded-full ring-4 ${ringColor} flex items-center justify-center ${statusColor} shadow-inner`}>
                                    {isLatest ? (
                                      <span className="absolute inline-flex h-full w-full rounded-full bg-current opacity-75 animate-ping" />
                                    ) : null}
                                    <span className="h-1.5 w-1.5 rounded-full bg-white block relative z-10" />
                                  </span>
                                  
                                  {/* Card container */}
                                  <div className={`p-3 rounded-xl border transition-all ${
                                    isLatest 
                                      ? 'bg-gradient-to-r from-indigo-50/40 to-white border-indigo-200 shadow-xs' 
                                      : 'bg-white border-slate-100'
                                  }`}>
                                    <div className="flex justify-between items-center text-[10px] font-bold text-slate-400 gap-2 mb-1">
                                      <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md font-mono">{log.tanggal}</span>
                                      <span className="flex items-center gap-1 text-slate-500">
                                        <User className="h-3 w-3 text-slate-400" />
                                        {log.updatedBy}
                                      </span>
                                    </div>
                                    <h5 className={`font-bold text-xs ${isLatest ? 'text-indigo-950 font-extrabold' : 'text-slate-800'}`}>{log.posisi}</h5>
                                    {log.catatan && (
                                      <p className="text-[11px] text-slate-500 leading-normal mt-1 border-t border-slate-100/50 pt-1 italic">{log.catatan}</p>
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      </div>

                    </div>
                  )}

                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Invoice Detail Factur Preview Popup (Faktur Simulasi Pajak) */}
      {previewInvoice && (
        <div className="fixed inset-0 bg-slate-900/60 flex items-center justify-center z-50 p-4 overflow-y-auto" id="invoice-preview-popup">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-2xl w-full p-6 animate-fadeIn text-slate-800 relative space-y-6">
            
            {/* Header popup */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <FileCheck2 className="h-5 w-5 text-indigo-600" />
                <h3 className="text-sm font-bold text-slate-800">Preview Invoice Resmi Perusahaan</h3>
              </div>
              <button 
                onClick={() => setPreviewInvoice(null)}
                className="text-slate-400 hover:text-slate-600 p-1.5 hover:bg-slate-50 rounded"
                id="btn-close-preview"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Simulated Invoice Sheet layout */}
            <div className="border border-slate-200 p-5 rounded-xl bg-white space-y-4 font-sans text-xs relative overflow-hidden" id="doc-faktur-view">
              
              {/* PAID visual badge indicator overlay */}
              {previewInvoice.status === 'Lunas' && (
                <div className="absolute top-12 right-12 border-4 border-emerald-500 text-emerald-500 font-black text-xs uppercase tracking-widest px-4 py-1.5 rounded transform rotate-12 bg-white/90 z-20">
                  LUNAS / PAID
                </div>
              )}

              {/* Company Header */}
              <div className="flex justify-between items-start gap-4 border-b pb-4 border-slate-100">
                <div>
                  <h4 className="text-sm font-black text-indigo-900 uppercase tracking-tight">{settings.namaPerusahaan}</h4>
                  <p className="text-slate-500 text-[10px] leading-relaxed mt-1 max-w-xs">{settings.alamat}</p>
                  <p className="text-[10px] text-slate-400 font-semibold mt-1">NPWP: {settings.npwp}</p>
                </div>
                <div className="text-right">
                  <h3 className="font-extrabold text-base text-slate-700 uppercase tracking-widest">INVOICE</h3>
                  <p className="text-[10px] text-slate-400 font-mono mt-1">Nomor: {previewInvoice.nomorTagihan}</p>
                  <p className="text-[10px] text-slate-500 mt-1">Tanggal: {previewInvoice.tanggalTagihan}</p>
                </div>
              </div>

              {/* Debitur To info */}
              <div className="grid grid-cols-2 gap-4 bg-slate-50 p-3 rounded text-[11px]">
                <div>
                  <span className="font-bold text-slate-400 block text-[9px] uppercase">Ditujukan Kepada:</span>
                  <strong className="text-slate-800">{previewInvoice.customerDebitur}</strong>
                  <p className="text-slate-500 mt-1">Semen Customer Debitur</p>
                </div>
                <div>
                  <span className="font-bold text-slate-400 block text-[9px] uppercase">Beban Pihak Ketiga (Asal):</span>
                  <strong className="text-slate-800">{previewInvoice.rekanan}</strong>
                  <p className="text-slate-500 mt-1">Sponsorship & Kegiatan Lapangan</p>
                </div>
              </div>

              {/* Bill Details Item Lines table */}
              <div className="border border-slate-200 rounded overflow-hidden">
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-slate-100 text-[10px] font-bold text-slate-500 uppercase border-b border-slate-200">
                      <th className="p-2">Deskripsi Layanan / Kegiatan</th>
                      <th className="p-2 text-right">Biaya / Jumlah (Nett)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(() => {
                      const linkedIds = previewInvoice.paymentIds || [previewInvoice.paymentId].filter(Boolean);
                      const linkedPayments = payments.filter(p => linkedIds.includes(p.id));
                      
                      if (linkedPayments.length > 1) {
                        const totalBase = linkedPayments.reduce((acc, p) => acc + p.jumlahBayar, 0);
                        return linkedPayments.map((p, idx) => {
                          const ratio = totalBase > 0 ? (p.jumlahBayar / totalBase) : (1 / linkedPayments.length);
                          const proratedKotor = Math.round(previewInvoice.jumlahTagihKotor * ratio);
                          return (
                            <tr key={p.id} className="border-b border-slate-100 font-medium text-slate-700 text-[11px]">
                              <td className="p-2">
                                <span className="font-bold text-indigo-950 block">{idx + 1}. Layanan Vendor: {p.rekanan}</span>
                                <span className="text-[10px] text-slate-500 block">Keterangan: {p.catatan} (Modal: {formatRupiah(p.jumlahBayar)})</span>
                              </td>
                              <td className="p-2 text-right font-bold text-slate-800">{formatRupiah(proratedKotor)}</td>
                            </tr>
                          );
                        });
                      } else {
                        return (
                          <tr className="border-b border-slate-100 font-medium text-slate-700">
                            <td className="p-2">
                              Pembayaran kegiatan, penyalinan tagihan untuk porsi modal ke customer: 
                              <span className="italic block text-[10px] text-slate-400 mt-0.5">Asal vendor: {previewInvoice.rekanan}</span>
                            </td>
                            <td className="p-2 text-right font-bold text-slate-800">{formatRupiah(previewInvoice.jumlahTagihKotor)}</td>
                          </tr>
                        );
                      }
                    })()}
                  </tbody>
                </table>
              </div>

              {/* Taxation breakdown section */}
              <div className="flex justify-end text-[11px]">
                <div className="w-full sm:w-64 space-y-2 border-t pt-3 font-medium">
                  <div className="flex justify-between text-slate-500">
                    <span>Jumlah Kotor (sebelum pajak):</span>
                    <strong className="text-slate-800">{formatRupiah(previewInvoice.jumlahTagihKotor)}</strong>
                  </div>
                  <div className="flex justify-between text-emerald-700">
                    <span>PPN (+{previewInvoice.ppnTarif}%):</span>
                    <span>{formatRupiah(previewInvoice.ppnNominal)}</span>
                  </div>
                  <div className="flex justify-between text-rose-700">
                    <span>Potongan PPh Pasal 23 (-{previewInvoice.pphTarif}%):</span>
                    <span>({formatRupiah(previewInvoice.pphNominal)})</span>
                  </div>
                  <div className="flex justify-between text-slate-800 font-black text-xs border-t pt-2 border-slate-200">
                    <span>TOTAL TAGIHAN (NET):</span>
                    <span className="text-indigo-900">{formatRupiah(previewInvoice.totalTagihan)}</span>
                  </div>
                </div>
              </div>

              {/* Footer Signature */}
              <div className="flex justify-between items-end pt-6 border-t border-slate-100">
                <div className="text-[10px] text-slate-400 font-medium">
                  Tenggat Jatuh Tempo: <span className="font-bold text-slate-600">{previewInvoice.tanggalJatuhTempo}</span>
                </div>
                <div className="text-right space-y-4">
                  <p className="text-[10px] text-slate-500 font-medium">Mengetahui, Keuangan & Umum</p>
                  <div className="h-10 w-24 border-b border-dashed border-slate-300 mx-auto" />
                  <p className="text-[9px] font-bold text-slate-600 uppercase">{settings.namaPerusahaan}</p>
                </div>
              </div>

            </div>

            {/* Action controls inside pop up */}
            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <button
                onClick={() => {
                  alert('PDF berhasil diunduh ke folder Downloads! (Simulasi)');
                }}
                className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs py-2.5 rounded-lg flex items-center justify-center gap-1 cursor-pointer"
                id="btn-print-download"
              >
                <Printer className="h-4 w-4" />
                Download PDF Faktur (Mock)
              </button>
              
              <button
                onClick={() => {
                  alert('Notifikasi tagihan berhasil dikirimkan via WhatsApp dan Email ke: '+previewInvoice.customerDebitur);
                }}
                className="flex-1 bg-slate-800 hover:bg-slate-950 text-white font-extrabold text-xs py-2.5 rounded-lg flex items-center justify-center gap-1 cursor-pointer"
                id="btn-send-notif"
              >
                <Send className="h-4 w-4" />
                Kirim via WA & E-Mail (Simulasi)
              </button>
              
              <button
                onClick={() => setPreviewInvoice(null)}
                className="bg-slate-100 hover:bg-slate-200 text-slate-600 font-medium text-xs px-5 py-2.5 rounded-lg cursor-pointer transition-colors border"
              >
                Tutup
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
