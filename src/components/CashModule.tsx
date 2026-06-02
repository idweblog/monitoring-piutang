import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Wallet, 
  TrendingUp, 
  Plus, 
  Calendar, 
  FileText, 
  Edit2, 
  Trash2, 
  Info, 
  CheckCircle,
  User,
  Search,
  Building,
  Coins,
  ArrowRight,
  ShieldAlert,
  Loader
} from 'lucide-react';
import { DailyCashBalance, AppUser, CompanySettings, CashAccount } from '../types';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { doc, setDoc, deleteDoc } from 'firebase/firestore';

interface CashModuleProps {
  cashBalances: DailyCashBalance[];
  userRole: string;
  currentUser: AppUser | null;
  settings: CompanySettings;
  onPersistSetDoc: (col: string, id: string, data: any) => Promise<void>;
  onPersistDeleteDoc: (col: string, id: string) => Promise<void>;
}

export function CashModule({ 
  cashBalances, 
  userRole, 
  currentUser, 
  settings, 
  onPersistSetDoc, 
  onPersistDeleteDoc 
}: CashModuleProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showConfirmDeleteId, setShowConfirmDeleteId] = useState<string | null>(null);
  
  // Dynamic Registered Accounts List
  const defaultAccounts: CashAccount[] = [
    { id: 'acc-kas-utama', nama: 'Kas Utama (Fisik Cash)', tipe: 'Kas' },
    { id: 'acc-bank-bca', nama: 'Bank BCA', tipe: 'Bank', nomorRekening: '8223910291' },
    { id: 'acc-bank-mandiri', nama: 'Bank Mandiri', tipe: 'Bank', nomorRekening: '132009871123' },
    { id: 'acc-bank-bni', nama: 'Bank BNI', tipe: 'Bank', nomorRekening: '0983127455' }
  ];

  const activeAccounts = settings && settings.cashAccountsList && settings.cashAccountsList.length > 0
    ? settings.cashAccountsList
    : defaultAccounts;

  // Form states
  const [tanggal, setTanggal] = useState(new Date().toISOString().split('T')[0]);
  const [balancesInput, setBalancesInput] = useState<{ [accountId: string]: string }>({});
  const [catatan, setCatatan] = useState('');

  const [saving, setSaving] = useState(false);
  const [savingSuccess, setSavingSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Enforce access control
  const canInput = userRole === 'ADMINISTRATOR' || userRole === 'SUPERVISOR_KEUANGAN_UMUM';

  // Format Helper
  const formatIDR = (num: number) => {
    return 'Rp ' + num.toLocaleString('id-ID');
  };

  const handleBalanceInputChange = (accountId: string, valStr: string) => {
    const clean = valStr.replace(/\D/g, '');
    if (clean === '') {
      setBalancesInput(prev => ({
        ...prev,
        [accountId]: ''
      }));
    } else {
      const num = Number(clean);
      setBalancesInput(prev => ({
        ...prev,
        [accountId]: num.toLocaleString('id-ID')
      }));
    }
  };

  // Populate empty inputs when account size shifts or modal opens
  useEffect(() => {
    if (!editingId && isFormOpen) {
      const initVals: { [id: string]: string } = {};
      activeAccounts.forEach(acc => {
        initVals[acc.id] = '';
      });
      setBalancesInput(initVals);
    }
  }, [isFormOpen, editingId, settings]);

  // Record total helper supporting backwards compatibility
  const getRecordTotal = (rec: DailyCashBalance) => {
    let tot = 0;
    activeAccounts.forEach(acc => {
      if (rec.balances && rec.balances[acc.id] !== undefined) {
        tot += rec.balances[acc.id];
      } else {
        // Fallback for previous legacy schema data entries
        if (acc.id === 'acc-kas-utama' && rec.kasUtama !== undefined) tot += rec.kasUtama;
        else if (acc.id === 'acc-bank-bca' && rec.bankBCA !== undefined) tot += rec.bankBCA;
        else if (acc.id === 'acc-bank-mandiri' && rec.bankMandiri !== undefined) tot += rec.bankMandiri;
        else if (acc.id === 'acc-bank-bni' && rec.bankBNI !== undefined) tot += rec.bankBNI;
      }
    });
    return tot;
  };

  // Get latest balances (the record with the newest date)
  const latestBalance = cashBalances.length > 0 
    ? [...cashBalances].sort((a, b) => b.tanggal.localeCompare(a.tanggal))[0] 
    : null;

  const totalLatestCash = latestBalance ? getRecordTotal(latestBalance) : 0;

  // Handle Submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canInput) {
      setErrorMessage('Anda tidak memiliki izin memadai untuk memodifikasi kas.');
      return;
    }

    if (!tanggal) {
      setErrorMessage('Tanggal harus diisi.');
      return;
    }

    setSaving(true);
    setErrorMessage('');
    
    // Check if modifying or creating a new day
    const docId = editingId || `cash-${tanggal}`;

    // Get current time
    const now = new Date();
    const formattedTime = now.toLocaleDateString('id-ID', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    }) + ' ' + now.toLocaleTimeString('id-ID', {
      hour: '2-digit',
      minute: '2-digit'
    });

    const parsedBalances: { [accountId: string]: number } = {};
    activeAccounts.forEach(acc => {
      const valRaw = balancesInput[acc.id] || '';
      const valClean = valRaw.replace(/\D/g, '');
      parsedBalances[acc.id] = parseFloat(valClean) || 0;
    });

    const payload: DailyCashBalance = {
      id: docId,
      tanggal,
      balances: parsedBalances,
      catatan,
      updatedBy: currentUser?.nama || 'Pengguna Utama',
      updatedAt: formattedTime
    };

    try {
      await onPersistSetDoc('cashBalances', docId, payload);
      setSavingSuccess(true);
      setTimeout(() => {
        setSavingSuccess(false);
        setIsFormOpen(false);
        setEditingId(null);
        resetForm();
      }, 1500);
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `cashBalances/${docId}`);
      setErrorMessage('Gagal menyimpan data ke database.');
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (rec: DailyCashBalance) => {
    if (!canInput) return;
    setEditingId(rec.id);
    setTanggal(rec.tanggal);
    
    const vals: { [id: string]: string } = {};
    activeAccounts.forEach(acc => {
      let valNum = 0;
      if (rec.balances && rec.balances[acc.id] !== undefined) {
        valNum = rec.balances[acc.id];
      } else {
        // Backwards compatibility fallbacks
        if (acc.id === 'acc-kas-utama' && rec.kasUtama !== undefined) valNum = rec.kasUtama;
        else if (acc.id === 'acc-bank-bca' && rec.bankBCA !== undefined) valNum = rec.bankBCA;
        else if (acc.id === 'acc-bank-mandiri' && rec.bankMandiri !== undefined) valNum = rec.bankMandiri;
        else if (acc.id === 'acc-bank-bni' && rec.bankBNI !== undefined) valNum = rec.bankBNI;
      }
      vals[acc.id] = valNum > 0 ? valNum.toLocaleString('id-ID') : '';
    });
    setBalancesInput(vals);
    setCatatan(rec.catatan || '');
    setIsFormOpen(true);
  };

  const handleDelete = (id: string) => {
    if (!canInput) return;
    setShowConfirmDeleteId(id);
  };

  const executeDelete = async (id: string) => {
    try {
      await onPersistDeleteDoc('cashBalances', id);
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `cashBalances/${id}`);
    } finally {
      setShowConfirmDeleteId(null);
    }
  };

  const resetForm = () => {
    setTanggal(new Date().toISOString().split('T')[0]);
    const initVals: { [id: string]: string } = {};
    activeAccounts.forEach(acc => {
      initVals[acc.id] = '';
    });
    setBalancesInput(initVals);
    setCatatan('');
    setEditingId(null);
  };

  // Filter logs chronologically (descending for history logs)
  const filteredBalances = cashBalances
    .filter(rec => rec.tanggal.includes(searchTerm) || (rec.catatan && rec.catatan.toLowerCase().includes(searchTerm.toLowerCase())))
    .sort((a, b) => b.tanggal.localeCompare(a.tanggal));

  return (
    <motion.div 
      initial={{ opacity: 0, y: 15 }} 
      animate={{ opacity: 1, y: 0 }} 
      transition={{ duration: 0.35 }}
      className="space-y-6"
    >
      {/* Header section with cumulative summary and visual balance */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
        <div>
          <span className="text-[10px] font-black text-indigo-600 uppercase tracking-widest bg-indigo-50/50 px-2.5 py-1 rounded-full">
            Kas &amp; Bank Perusahaan
          </span>
          <h1 className="text-xl md:text-2xl font-black text-slate-800 tracking-tight mt-1 flex items-center gap-2">
            Kas Perusahaan
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Pantau dan rekap saldo keuangan korporat harian secara real-time dari seluruh rekening dan kas fisik yang dikononfigurasi.
          </p>
        </div>

        {canInput && (
          <button
            onClick={() => {
              resetForm();
              setIsFormOpen(true);
            }}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-[11px] font-black tracking-wider uppercase px-4 py-2.5 rounded-xl shadow-lg transition-all cursor-pointer transform hover:-translate-y-0.5 active:translate-y-0"
            id="btn-input-kas"
          >
            <Plus className="h-4 w-4" />
            Input Saldo Harian
          </button>
        )}
      </div>

      {/* Bento grid containing current breakdown on recently recorded day */}
      {latestBalance ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          <div className="sm:col-span-2 bg-gradient-to-r from-slate-900 to-indigo-950 text-white p-5 rounded-2xl shadow-lg flex flex-col justify-between border border-slate-800/80">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-indigo-300 uppercase tracking-wider block bg-white/10 px-2 py-0.5 rounded-md">
                  Total Dana Korporat
                </span>
                <span className="text-[9px] font-semibold text-slate-300 flex items-center gap-1">
                  <Calendar className="h-3 w-3" /> Tanggal: {latestBalance.tanggal}
                </span>
              </div>
              <h2 className="text-xl md:text-2xl font-black tracking-tight mt-3 text-slate-50 font-sans">
                {formatIDR(totalLatestCash)}
              </h2>
            </div>
            
            <div className="mt-5 pt-3.5 border-t border-white/10 flex items-center justify-between text-[10px] text-indigo-200">
              <span className="flex items-center gap-1.5 truncate max-w-[150px]">
                <User className="h-3.5 w-3.5" /> Ops: <strong>{latestBalance.updatedBy || 'Sistem'}</strong>
              </span>
              <span className="text-slate-400 font-mono">
                {latestBalance.updatedAt || ''}
              </span>
            </div>
          </div>

          {activeAccounts.map(acc => {
            let val = 0;
            if (latestBalance.balances && latestBalance.balances[acc.id] !== undefined) {
              val = latestBalance.balances[acc.id];
            } else {
              // Legacy fallback
              if (acc.id === 'acc-kas-utama' && latestBalance.kasUtama !== undefined) val = latestBalance.kasUtama;
              else if (acc.id === 'acc-bank-bca' && latestBalance.bankBCA !== undefined) val = latestBalance.bankBCA;
              else if (acc.id === 'acc-bank-mandiri' && latestBalance.bankMandiri !== undefined) val = latestBalance.bankMandiri;
              else if (acc.id === 'acc-bank-bni' && latestBalance.bankBNI !== undefined) val = latestBalance.bankBNI;
            }

            return (
              <div key={acc.id} className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-between">
                <div className="flex items-center justify-between">
                  <div className={`p-2 bg-slate-50 border rounded-lg ${
                    acc.tipe === 'Kas' ? 'border-amber-100 text-amber-600' : 'border-emerald-100 text-emerald-600'
                  }`}>
                    {acc.tipe === 'Kas' ? <Coins className="h-4 w-4" /> : <Building className="h-4 w-4" />}
                  </div>
                  <span className={`text-[8.5px] font-black px-2 py-0.5 rounded uppercase ${
                    acc.tipe === 'Kas' ? 'bg-amber-50 text-amber-700' : 'bg-emerald-50 text-emerald-700'
                  }`}>{acc.tipe}</span>
                </div>
                <div className="mt-3">
                  <span className="text-[10px] font-bold text-slate-400 block uppercase truncate" title={acc.nama}>{acc.nama}</span>
                  {acc.nomorRekening && (
                    <span className="text-[8px] text-slate-400 font-mono tracking-widest">{acc.nomorRekening}</span>
                  )}
                  <span className="text-sm font-black text-slate-800 mt-1 block truncate">{formatIDR(val)}</span>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-slate-50 p-6 text-center rounded-2xl border border-slate-200/50">
          <p className="text-xs text-slate-500 font-bold">Belum ada saldo harian terekam.</p>
        </div>
      )}

      {/* Input / Modify Modal Dialog with AnimatePresence */}
      <AnimatePresence>
        {isFormOpen && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white w-full max-w-lg rounded-2xl shadow-xl overflow-hidden border border-slate-100"
            >
              <div className="bg-slate-50 p-5 border-b border-slate-100 flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">Formulir Rekapitulasi</h3>
                  <h2 className="text-base font-black text-slate-800 tracking-tight mt-0.5">
                    {editingId ? 'Edit Saldo Harian' : 'Input Saldo Kas Perusahaan'}
                  </h2>
                </div>
                <button
                  onClick={() => setIsFormOpen(false)}
                  className="p-1 px-2 text-xs font-bold text-slate-400 hover:text-slate-600 transition-colors bg-slate-150 rounded cursor-pointer"
                >
                  Tutup
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-5 space-y-4">
                {errorMessage && (
                  <div className="bg-rose-50 border border-rose-100 text-rose-700 p-3 rounded-lg text-[11px] font-semibold flex items-start gap-2">
                    <ShieldAlert className="h-4 w-4 shrink-0 mt-0.5" />
                    <span>{errorMessage}</span>
                  </div>
                )}

                {savingSuccess && (
                  <div className="bg-emerald-50 border border-emerald-100 text-emerald-700 p-3 rounded-lg text-[11px] font-bold flex items-center gap-2">
                    <CheckCircle className="h-4 w-4" />
                    <span>Data berhasil disimpan! Sinkronisasi cloud selesai.</span>
                  </div>
                )}

                {/* Input Fields Wrapper */}
                <div className="space-y-4 max-h-[350px] overflow-y-auto pr-1">
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1 font-sans">Tanggal Rekap</label>
                    <div className="relative">
                      <Calendar className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                      <input
                        type="date"
                        required
                        disabled={!!editingId}
                        value={tanggal}
                        onChange={(e) => setTanggal(e.target.value)}
                        className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-lg text-slate-700 placeholder-slate-400 focus:outline-hidden focus:border-indigo-600 bg-slate-50 disabled:bg-slate-100 disabled:text-slate-400 font-bold"
                      />
                    </div>
                  </div>

                  <div className="border-t border-slate-100 pt-3">
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-2 font-sans">
                      Daftar Saldo Per Akun
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pb-2">
                      {activeAccounts.map(acc => (
                        <div key={acc.id} className="space-y-1">
                          <label className="text-[10px] font-semibold text-slate-500 block truncate" title={acc.nama}>
                            {acc.nama} {acc.nomorRekening ? `(${acc.nomorRekening})` : ''}
                          </label>
                          <div className="relative">
                            <div className="absolute left-2.5 top-2.5">
                              {acc.tipe === 'Kas' ? <Coins className="h-3.5 w-3.5 text-amber-500" /> : <Building className="h-3.5 w-3.5 text-emerald-500" />}
                            </div>
                            <input
                              type="text"
                              required
                              placeholder="Rp 0"
                              value={balancesInput[acc.id] ?? ''}
                              onChange={(e) => handleBalanceInputChange(acc.id, e.target.value)}
                              className="w-full pl-8 pr-3 py-1.5 text-xs text-slate-700 border border-slate-200 rounded-lg focus:outline-hidden focus:border-indigo-600 font-bold placeholder-slate-350"
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1 font-sans">Catatan Kas (Opsional)</label>
                  <textarea
                    rows={2}
                    placeholder="Contoh: Rekonsiliasi harian setelah setoran tunai..."
                    value={catatan}
                    onChange={(e) => setCatatan(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg text-slate-700 focus:outline-hidden focus:border-indigo-600 font-medium"
                  />
                </div>

                <div className="pt-2 border-t border-slate-100 flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setIsFormOpen(false)}
                    className="px-4 py-2 bg-slate-150 hover:bg-slate-200 transition-colors rounded-lg text-slate-500 text-xs font-bold cursor-pointer"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="flex items-center gap-1.5 px-5 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer"
                  >
                    {saving ? (
                      <>
                        <Loader className="h-3.5 w-3.5 animate-spin" /> Menyimpan...
                      </>
                    ) : (
                      'Simpan Rekap'
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Main Tabular History Logs and Search */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden" id="cash-history-log">
        <div className="p-5 border-b border-slate-100/80 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h2 className="text-sm font-black text-slate-800 flex items-center gap-1.5">
              📚 Log Riwayat Kas Harian
            </h2>
            <p className="text-[10px] text-slate-400 mt-0.5">Daftar historis pencantuman saldo kas yang terverifikasi di cloud.</p>
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
            <input
              type="text"
              placeholder="Cari tanggal / catatan..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-1.5 text-xs border border-slate-200 rounded-lg text-slate-600 focus:outline-hidden focus:border-indigo-500 placeholder-slate-400 font-medium"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/70 border-b border-slate-100 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                <th className="py-3 px-5">Tanggal</th>
                {activeAccounts.slice(0, 4).map(acc => (
                  <th key={acc.id} className="py-3 px-4 truncate max-w-[150px] font-sans" title={acc.nama}>
                    {acc.nama}
                  </th>
                ))}
                {activeAccounts.length > 4 && (
                  <th className="py-3 px-4 text-slate-400 font-sans">Lainnya</th>
                )}
                <th className="py-3 px-4 font-sans">Konsolidasi (Total)</th>
                <th className="py-3 px-5 text-center font-sans">Pemberi Rekap</th>
                {canInput && <th className="py-3 px-5 text-right font-sans">Aksi</th>}
              </tr>
            </thead>
            <tbody className="text-xs text-slate-600 divide-y divide-slate-100">
              {filteredBalances.length > 0 ? (
                filteredBalances.map((rec) => {
                  const dayTotal = getRecordTotal(rec);
                  const mainAccounts = activeAccounts.slice(0, 4);
                  
                  // Calculate other accounts sum for index > 4
                  let otherSum = 0;
                  if (activeAccounts.length > 4) {
                    activeAccounts.slice(4).forEach(acc => {
                      if (rec.balances && rec.balances[acc.id] !== undefined) {
                        otherSum += rec.balances[acc.id];
                      } else {
                        // Legacy fallbacks
                        if (acc.id === 'acc-kas-utama' && rec.kasUtama !== undefined) otherSum += rec.kasUtama;
                        else if (acc.id === 'acc-bank-bca' && rec.bankBCA !== undefined) otherSum += rec.bankBCA;
                        else if (acc.id === 'acc-bank-mandiri' && rec.bankMandiri !== undefined) otherSum += rec.bankMandiri;
                        else if (acc.id === 'acc-bank-bni' && rec.bankBNI !== undefined) otherSum += rec.bankBNI;
                      }
                    });
                  }

                  return (
                    <tr key={rec.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="py-3.5 px-5 font-bold text-slate-800">
                        <div className="flex items-center gap-1.5">
                          <Calendar className="h-3.5 w-3.5 text-indigo-505 text-indigo-500" />
                          {rec.tanggal}
                        </div>
                      </td>
                      {mainAccounts.map(acc => {
                        let amount = 0;
                        if (rec.balances && rec.balances[acc.id] !== undefined) {
                          amount = rec.balances[acc.id];
                        } else {
                          // Legacy fallbacks
                          if (acc.id === 'acc-kas-utama' && rec.kasUtama !== undefined) amount = rec.kasUtama;
                          else if (acc.id === 'acc-bank-bca' && rec.bankBCA !== undefined) amount = rec.bankBCA;
                          else if (acc.id === 'acc-bank-mandiri' && rec.bankMandiri !== undefined) amount = rec.bankMandiri;
                          else if (acc.id === 'acc-bank-bni' && rec.bankBNI !== undefined) amount = rec.bankBNI;
                        }
                        return (
                          <td key={acc.id} className="py-3.5 px-4 font-semibold text-slate-600">
                            {formatIDR(amount)}
                          </td>
                        );
                      })}
                      {activeAccounts.length > 4 && (
                        <td className="py-3.5 px-4 font-semibold text-slate-500">
                          {formatIDR(otherSum)}
                        </td>
                      )}
                      <td className="py-3.5 px-4 font-black text-indigo-600">
                        {formatIDR(dayTotal)}
                      </td>
                      <td className="py-3.5 px-5">
                        <div className="text-center bg-slate-50 border border-slate-100 rounded py-0.5 px-1.5 max-w-[160px] mx-auto leading-tight">
                          <span className="font-bold text-[9px] text-slate-600 block truncate">{rec.updatedBy || 'Sistem'}</span>
                          <span className="text-[8px] text-slate-400 block font-mono">{rec.updatedAt || ''}</span>
                        </div>
                      </td>
                      {canInput && (
                        <td className="py-3.5 px-5 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => handleEdit(rec)}
                              className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-slate-50 rounded transition-all cursor-pointer"
                              title="Sunting Data"
                            >
                              <Edit2 className="h-3.5 w-3.5" />
                            </button>
                            <button
                              onClick={() => handleDelete(rec.id)}
                              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-all cursor-pointer"
                              title="Hapus Data"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={activeAccounts.length > 4 ? 8 : 7} className="py-12 text-center text-slate-400 font-medium bg-slate-50/20">
                    <Info className="h-6 w-6 text-slate-300 mx-auto mb-2" />
                    Belum ada rekaman laporan pencatatan harian yang sesuai.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Non-blocking custom modal delete confirmation */}
      {showConfirmDeleteId && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fadeIn" id="cash-confirm-delete-modal">
          <div className="bg-white rounded-2xl max-w-sm w-full p-5 shadow-xl border border-slate-100/80 flex flex-col gap-3 animate-scaleIn">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-full bg-rose-50 text-rose-600">
                <ShieldAlert className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-xs tracking-tight">
                  Hapus Laporan Harian
                </h3>
                <p className="text-[10px] text-slate-400">Konfirmasi Penghapusan Laporan Kas</p>
              </div>
            </div>

            <p className="text-[11px] text-slate-600 leading-normal">
              Apakah Anda yakin ingin menghapus data catatan kas harian ini? Tindakan ini akan mengupdate rekap saldo rekening terkait secara permanen dan tidak dapat dibatalkan.
            </p>

            <div className="flex gap-2 justify-end mt-2">
              <button
                type="button"
                onClick={() => setShowConfirmDeleteId(null)}
                className="px-3.5 py-1.5 text-[11px] font-bold text-slate-500 bg-slate-50 border border-slate-200 rounded-lg hover:bg-slate-100 transition-all cursor-pointer"
                id="btn-delete-cancel"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={() => executeDelete(showConfirmDeleteId)}
                className="px-3.5 py-1.5 text-[11px] font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-lg transition-all cursor-pointer shadow-xs"
                id="btn-delete-execute"
              >
                Ya, Hapus Data
              </button>
            </div>
          </div>
        </div>
      )}

    </motion.div>
  );
}
