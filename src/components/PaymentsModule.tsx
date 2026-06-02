/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Search, 
  Calendar, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  UserCheck, 
  ArrowRight, 
  DollarSign, 
  Check, 
  X,
  FileSpreadsheet
} from 'lucide-react';
import { Payment, UserRole, CompanySettings } from '../types';

interface PaymentsModuleProps {
  payments: Payment[];
  onCreatePayment: (payment: Omit<Payment, 'id' | 'hasInvoice'>) => void;
  onApprovePayment: (id: string) => void;
  userRole: UserRole;
  selectedPaymentId?: string;
  onClearSelection?: () => void;
  settings: CompanySettings;
}

const addDaysStr = (dateStr: string, days: number): string => {
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return '';
  d.setDate(d.getDate() + days);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const date = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${date}`;
};

export const PaymentsModule: React.FC<PaymentsModuleProps> = ({
  payments,
  onCreatePayment,
  onApprovePayment,
  userRole,
  selectedPaymentId,
  onClearSelection,
  settings,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'All' | 'Draft' | 'Aktif'>('All');
  const [isAddingNew, setIsAddingNew] = useState(false);

  const paymentMethods = settings?.metodePembayaranList || [
    'Transfer Mandiri',
    'Transfer BCA',
    'Transfer BNI',
    'Giro BNI',
    'Tunai'
  ];

  // Form states
  const [rekanan, setRekanan] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [tanggalBayar, setTanggalBayar] = useState('2026-05-28');
  const [jumlahBayar, setJumlahBayar] = useState<number | ''>('');
  const [jumlahBayarDisplay, setJumlahBayarDisplay] = useState('');
  const [metodeBayar, setMetodeBayar] = useState(paymentMethods[0] || 'Transfer Mandiri');
  const [catatan, setCatatan] = useState('');
  const [tanggalDeadline, setTanggalDeadline] = useState('');
  const [formError, setFormError] = useState('');

  // Sync methods from settings on change
  useEffect(() => {
    if (paymentMethods.length > 0) {
      setMetodeBayar(paymentMethods[0]);
    }
  }, [settings]);

  const handleJumlahBayarChange = (valStr: string) => {
    const clean = valStr.replace(/\D/g, '');
    if (clean === '') {
      setJumlahBayarDisplay('');
      setJumlahBayar('');
    } else {
      const num = Number(clean);
      setJumlahBayar(num);
      setJumlahBayarDisplay(num.toLocaleString('id-ID'));
    }
  };

  // Expand card state
  const [expandedPaymentId, setExpandedPaymentId] = useState<string | null>(null);

  useEffect(() => {
    if (selectedPaymentId) {
      setExpandedPaymentId(selectedPaymentId);
      // scroll to elements if necessary, but just keeping it open is great
    }
  }, [selectedPaymentId]);

  // Handle auto +3 days filling
  useEffect(() => {
    if (tanggalBayar) {
      setTanggalDeadline(addDaysStr(tanggalBayar, 3));
    }
  }, [tanggalBayar]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!rekanan.trim()) {
      setFormError('Nama rekanan / supplier wajib diisi');
      return;
    }
    if (!tanggalBayar) {
      setFormError('Tanggal pembayaran wajib diisi');
      return;
    }
    if (!jumlahBayar || Number(jumlahBayar) <= 0) {
      setFormError('Jumlah pembayaran harus berupa angka positif');
      return;
    }
    if (!catatan.trim()) {
      setFormError('Catatan peruntukan pembayaran wajib diisi');
      return;
    }

    onCreatePayment({
      rekanan,
      tanggalBayar,
      jumlahBayar: Number(jumlahBayar),
      metodeBayar,
      catatan,
      tanggalDeadlineTagihan: tanggalDeadline,
      status: 'Draft', // always begins as draft by Spv. Keuangan
    });

    // Reset Form
    setRekanan('');
    setJumlahBayar('');
    setJumlahBayarDisplay('');
    setMetodeBayar(paymentMethods[0] || 'Transfer Mandiri');
    setCatatan('');
    setIsAddingNew(false);
  };

  const filteredPayments = payments.filter((p) => {
    const matchesSearch = p.rekanan.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          p.catatan.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'All' || p.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const formatRupiah = (num: number) => {
    return 'Rp ' + num.toLocaleString('id-ID');
  };

  const canCreate = userRole === 'SUPERVISOR_KEUANGAN_UMUM' || userRole === 'ADMINISTRATOR';
  const canApprove = userRole === 'DIREKTUR' || userRole === 'ADMINISTRATOR';

  return (
    <div className="space-y-6" id="payments-module-root">
      
      {/* Header with quick instructions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
        <div>
          <h2 className="text-base font-bold text-slate-800">Daftar Pembayaran (Beban Ke Rekanan Pihak Ketiga)</h2>
          <p className="text-xs text-slate-400 mt-1">
            Gunakan modul ini untuk menginput draf pengeluaran kas yang dibayarkan ke vendor supplier, untuk ditagih (diapprove Direktur).
          </p>
        </div>
        {canCreate && !isAddingNew && (
          <button
            onClick={() => setIsAddingNew(true)}
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs px-4 py-2.5 rounded-lg shadow-sm hover:shadow flex items-center gap-1.5 transition-all self-start md:self-auto cursor-pointer"
            id="btn-add-payment-trigger"
          >
            <Plus className="h-4 w-4" />
            Input Pembayaran Baru
          </button>
        )}
      </div>

      {/* Adding Form Section */}
      {isAddingNew && (
        <div className="bg-white rounded-xl border border-indigo-100 shadow-sm p-5 animate-fadeIn" id="payment-add-form">
          <div className="flex items-center justify-between border-b border-indigo-50 pb-3 mb-4">
            <h3 className="text-sm font-bold text-indigo-950 flex items-center gap-1.5">
              <Plus className="h-4 w-4 text-indigo-600" />
              Buat Draf Rencana Pembayaran Baru
            </h3>
            <button 
              onClick={() => {
                setIsAddingNew(false);
                setFormError('');
              }}
              className="text-slate-400 hover:text-slate-600 p-1 hover:bg-slate-50 rounded"
              id="btn-close-add-form"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {formError && (
              <div className="p-3 bg-rose-50 border border-rose-100 rounded-lg text-rose-700 text-xs font-semibold flex items-center gap-2">
                <AlertCircle className="h-4 w-4 shrink-0" />
                {formError}
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Field 1: Nama Rekanan (Autocomplete) */}
              <div className="space-y-1.5 col-span-1 md:col-span-2 relative">
                <div className="flex justify-between items-center">
                  <label className="text-xs font-bold text-slate-600 block">
                    Nama Rekanan Vendor / Supplier <span className="text-rose-500">*</span>
                  </label>
                  {settings.rekananList?.includes(rekanan.trim()) && (
                    <span className="text-[10px] bg-indigo-50 text-indigo-700 font-extrabold px-2 py-0.5 rounded-full flex items-center gap-1">
                      <Check className="h-3 w-3" /> Rekanan Terdaftar
                    </span>
                  )}
                </div>
                
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Ketik untuk mencari atau menulis manual nama rekanan..."
                    value={rekanan}
                    onChange={(e) => {
                      setRekanan(e.target.value);
                      setShowSuggestions(true);
                    }}
                    onFocus={() => setShowSuggestions(true)}
                    onBlur={() => {
                      // Slight delay to allow clicking suggestion item
                      setTimeout(() => setShowSuggestions(false), 200);
                    }}
                    className="w-full text-xs p-2.5 bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-500 font-medium"
                    id="input-payment-rekanan"
                    autoComplete="off"
                  />
                  
                  {/* Floating suggestion list */}
                  {showSuggestions && (
                    (() => {
                      const suggestions = (settings.rekananList || []).filter(item =>
                        item.toLowerCase().includes(rekanan.toLowerCase())
                      );
                      if (suggestions.length === 0) return null;
                      return (
                        <div className="absolute z-50 w-full bg-white border border-slate-200 mt-1 max-h-48 overflow-y-auto rounded-lg shadow-lg py-1">
                          <p className="text-[9px] text-slate-400 font-bold px-3 py-1.5 uppercase tracking-wider bg-slate-50 border-b border-slate-100">
                            Rekomendasi Rekanan Terdaftar ({suggestions.length})
                          </p>
                          {suggestions.map((item, idx) => (
                            <button
                              key={idx}
                              type="button"
                              onClick={() => {
                                setRekanan(item);
                                setShowSuggestions(false);
                              }}
                              className="w-full text-left px-3 py-2 text-xs hover:bg-slate-50 hover:text-indigo-600 transition-colors cursor-pointer border-b border-slate-100/50 last:border-b-0 font-bold text-slate-700"
                            >
                              {item}
                            </button>
                          ))}
                        </div>
                      );
                    })()
                  )}
                </div>
              </div>

              {/* Field 2: Metode Pembayaran */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-600 block">Metode Pembayaran</label>
                <select
                  value={metodeBayar}
                  onChange={(e) => setMetodeBayar(e.target.value)}
                  className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-500 bg-white"
                  id="select-payment-metode"
                >
                  {paymentMethods.map((metode) => (
                    <option key={metode} value={metode}>{metode}</option>
                  ))}
                </select>
              </div>

              {/* Field 3: Jumlah Pembayaran */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-600 block">
                  Jumlah Dibayarkan (Rupiah) <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-xs text-slate-400 font-bold">Rp</span>
                  <input
                    type="text"
                    placeholder="Contoh: 45.000.000"
                    value={jumlahBayarDisplay}
                    onChange={(e) => handleJumlahBayarChange(e.target.value)}
                    className="w-full text-xs pl-8 pr-3 p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-500 bg-white font-semibold"
                    id="input-payment-jumlah"
                  />
                </div>
              </div>

              {/* Field 4: Tanggal Pembayaran */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-600 block">Tanggal Pembayaran</label>
                <input
                  type="date"
                  value={tanggalBayar}
                  onChange={(e) => setTanggalBayar(e.target.value)}
                  className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-500 bg-white"
                  id="input-payment-tanggal"
                />
              </div>

              {/* Field 5: Deadline Penagihan (Auto Filled +3 Days) */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-indigo-700 block flex items-center gap-1">
                  Tanggal Deadline Penerbitan Tagihan (Otomatis H+3)
                </label>
                <input
                  type="date"
                  value={tanggalDeadline}
                  readOnly
                  className="w-full text-xs p-2.5 bg-indigo-50/50 border border-indigo-100 text-indigo-900 rounded-lg focus:outline-none font-bold"
                  id="input-payment-deadline"
                />
                <span className="text-[10px] text-indigo-400 font-medium block">
                  Peringatan notifikasi akan otomatis dikirim ke Staf Admin jika lewat dari tanggal ini dan belum diinvoice.
                </span>
              </div>

              {/* Field 6: Catatan Peruntukan */}
              <div className="space-y-1 md:col-span-1">
                <label className="text-xs font-bold text-slate-600 block">
                  Peruntukan Pembayaran <span className="text-rose-500">*</span>
                </label>
                <textarea
                  placeholder="Contoh: Sponsorship spanduk, sewa alat crane Semen Tonasa"
                  value={catatan}
                  onChange={(e) => setCatatan(e.target.value)}
                  rows={2}
                  className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-500 bg-white"
                  id="input-payment-catatan"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setIsAddingNew(false)}
                className="bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold text-xs px-4 py-2 rounded-lg cursor-pointer transition-colors"
                id="btn-cancel-add-payment"
              >
                Kembali
              </button>
              <button
                type="submit"
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs px-5 py-2 rounded-lg shadow-sm hover:shadow transition-all cursor-pointer"
                id="btn-submit-payment"
              >
                Simpan & Kirim ke Direktur
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Filter and Table Card */}
      <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden" id="payments-list-card">
        {/* Controls */}
        <div className="p-4 border-b border-slate-100 bg-slate-50/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="relative max-w-md w-full sm:w-72">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Cari rekanan atau catatan..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="text-xs w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-500"
              id="search-payments"
            />
          </div>

          <div className="flex items-center gap-1.5 self-start sm:self-auto">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">Filter status:</span>
            {(['All', 'Draft', 'Aktif'] as const).map((status) => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={`text-xs px-3 py-1.5 font-bold rounded-lg transition-all cursor-pointer ${
                  statusFilter === status 
                    ? 'bg-slate-800 text-white' 
                    : 'bg-white text-slate-600 border border-slate-100 hover:bg-slate-50'
                }`}
                id={`btn-filter-payment-${status}`}
              >
                {status === 'All' ? 'Semua' : status}
              </button>
            ))}
          </div>
        </div>

        {/* Content table */}
        {filteredPayments.length === 0 ? (
          <div className="py-12 text-center text-slate-400 text-xs flex flex-col items-center justify-center gap-2">
            <FileSpreadsheet className="h-10 w-10 text-slate-300 stroke-[1.2]" />
            <p>Tidak ada data pembayaran yang cocok.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse" id="payments-table">
              <thead>
                <tr className="bg-slate-50/70 border-b border-slate-100 text-left text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">
                  <th className="px-4 py-3">Nama Rekanan Vendor</th>
                  <th className="px-4 py-3">Tgl Pembayaran</th>
                  <th className="px-4 py-3">Nominal Bayar</th>
                  <th className="px-4 py-3">Tgl Batas Invoice</th>
                  <th className="px-4 py-3">Status Rencana</th>
                  <th className="px-4 py-3 text-center">Status Invoice</th>
                  <th className="px-4 py-3 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {filteredPayments.map((p) => {
                  const isExpanded = expandedPaymentId === p.id;
                  const isDeadlineOverdue = !p.hasInvoice && p.status === 'Aktif' && new Date(p.tanggalDeadlineTagihan) < new Date('2026-05-28');

                  return (
                    <React.Fragment key={p.id}>
                      <tr 
                        className={`hover:bg-slate-50/50 cursor-pointer transition-colors ${
                          isExpanded ? 'bg-indigo-50/10' : ''
                        } ${isDeadlineOverdue ? 'bg-rose-50/10' : ''}`}
                        onClick={() => setExpandedPaymentId(isExpanded ? null : p.id)}
                        id={`payment-row-${p.id}`}
                      >
                        <td className="px-4 py-3.5 font-bold text-slate-800">
                          {p.rekanan}
                        </td>
                        <td className="px-4 py-3.5 whitespace-nowrap text-slate-500">
                          {p.tanggalBayar}
                        </td>
                        <td className="px-4 py-3.5 whitespace-nowrap font-extrabold text-slate-800">
                          {formatRupiah(p.jumlahBayar)}
                        </td>
                        <td className="px-4 py-3.5 whitespace-nowrap font-medium text-slate-500">
                          <span className={isDeadlineOverdue ? 'text-rose-600 font-extrabold text-[11px] underline' : ''}>
                            {p.tanggalDeadlineTagihan}
                          </span>
                        </td>
                        <td className="px-4 py-3.5 whitespace-nowrap">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold ${
                            p.status === 'Draft' 
                              ? 'bg-amber-100 text-amber-800' 
                              : 'bg-emerald-100 text-emerald-800'
                          }`}>
                            {p.status}
                          </span>
                        </td>
                        <td className="px-4 py-3.5 text-center whitespace-nowrap">
                          {p.hasInvoice ? (
                            <span className="bg-blue-100 text-blue-800 px-2 py-0.5 rounded text-[10px] font-bold">Sudah Diinvoice</span>
                          ) : (
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              isDeadlineOverdue ? 'bg-rose-100 text-rose-800 animate-pulse' : 'bg-slate-100 text-slate-600'
                            }`}>
                              Belum Diinvoice
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3.5 text-right whitespace-nowrap">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setExpandedPaymentId(isExpanded ? null : p.id);
                            }}
                            className="text-xs font-bold text-indigo-600 hover:text-indigo-800 underline"
                          >
                            {isExpanded ? 'Tutup Detail' : 'Buka Detail'}
                          </button>
                        </td>
                      </tr>

                      {/* Expandable details panel */}
                      {isExpanded && (
                        <tr>
                          <td colSpan={7} className="px-4 py-4 bg-indigo-50/5 border-l-4 border-indigo-400">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                              <div className="space-y-2">
                                <h4 className="font-bold text-indigo-950 uppercase tracking-wider text-[11px]">Detail Rencana Pembayaran</h4>
                                <p><span className="font-bold text-slate-500">Catatan Peruntukan:</span> {p.catatan}</p>
                                <p><span className="font-bold text-slate-500">Metode Pembayaran:</span> {p.metodeBayar}</p>
                                <p><span className="font-bold text-slate-500">Tanggal Ditenggat Tagih:</span> {p.tanggalDeadlineTagihan} (3 hari dari bayar)</p>
                              </div>

                              <div className="space-y-2 border-t md:border-t-0 md:border-l border-slate-100 pt-3 md:pt-0 md:pl-4">
                                <h4 className="font-bold text-indigo-950 uppercase tracking-wider text-[11px]">Langkah Persetujuan</h4>
                                
                                {p.status === 'Draft' ? (
                                  <div className="space-y-3">
                                    <div className="flex items-center gap-2 text-slate-600">
                                      <Clock className="h-4 w-4 text-amber-500 shrink-0" />
                                      <span>Status saat ini: <strong className="text-amber-700">DRAFT</strong>. Membutuhkan verifikasi Direktur agar siap ditarik ke Tagihan.</span>
                                    </div>
                                    {canApprove ? (
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          onApprovePayment(p.id);
                                        }}
                                        className="bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-[11px] px-3.5 py-1.5 rounded-lg flex items-center gap-1 transition-all shadow-sm cursor-pointer"
                                        id={`btn-approve-${p.id}`}
                                      >
                                        <UserCheck className="h-3.5 w-3.5" />
                                        BERIKAN PERSETUJUAN (APPROVE)
                                      </button>
                                    ) : (
                                      <div className="p-2 bg-amber-50 border border-amber-100 rounded text-[10px] text-amber-800">
                                        Lakukan login sebagai <strong>Direktur</strong> untuk menyetujui transaksi ini.
                                      </div>
                                    )}
                                  </div>
                                ) : (
                                  <div className="space-y-2">
                                    <div className="flex items-center gap-2 text-emerald-600">
                                      <CheckCircle2 className="h-4 w-4 shrink-0" />
                                      <span className="font-bold">STATUS AKTIF (TELAH DISETUJUI DIREKTUR)</span>
                                    </div>
                                    <p className="text-slate-500">
                                      Disetujui oleb: <span className="font-bold text-slate-700">{p.approvedBy || 'Direktur Utama'}</span> pada <span className="font-bold text-slate-700">{p.tanggalApprove || p.tanggalBayar}</span>.
                                    </p>
                                    
                                    {!p.hasInvoice && (
                                      <div className="pt-2">
                                        <p className="text-[11px] text-slate-500 mb-2">Data ini siap dipakai oleh Staf Administrasi untuk membuat tagihan resmi ke Customer PT Semen.</p>
                                      </div>
                                    )}
                                  </div>
                                )}
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
};
