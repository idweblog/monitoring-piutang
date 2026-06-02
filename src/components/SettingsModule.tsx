/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  Building2, 
  Users, 
  Coins, 
  Settings, 
  Bell, 
  RefreshCcw, 
  History, 
  ShieldAlert, 
  Check, 
  Trash2,
  FileText,
  User,
  Briefcase,
  Edit,
  Wallet,
  Plus,
  Building,
  Sparkles
} from 'lucide-react';
import { CompanySettings, UserRole, InvoiceLog, AppUser, Payment, Invoice, AppNotification, CashAccount } from '../types';
import { BrandingSettings } from './BrandingSettings';

interface SettingsModuleProps {
  settings: CompanySettings;
  userRole: UserRole;
  onUpdateSettings: (settings: Partial<CompanySettings>) => void;
  onResetData: () => void;
  onClearAllData: () => void;
  logs: InvoiceLog[];
  users: AppUser[];
  onUpdateUsers: (users: AppUser[]) => void;
  payments: Payment[];
  invoices: Invoice[];
  notifications: AppNotification[];
  onRestoreData: (restoredState: any) => void;
}

export const SettingsModule: React.FC<SettingsModuleProps> = ({
  settings,
  userRole,
  onUpdateSettings,
  onResetData,
  onClearAllData,
  logs,
  users,
  onUpdateUsers,
  payments,
  invoices,
  notifications,
  onRestoreData,
}) => {
  const [activeTab, setActiveTab] = useState<'profile' | 'user-profile' | 'tax' | 'payment-methods' | 'partners' | 'tracking-positions' | 'users' | 'backup-restore' | 'notification' | 'system' | 'cash-accounts' | 'branding' | 'changelog'>('profile');

  // Local form states
  const [namaPerusahaan, setNamaPerusahaan] = useState(settings.namaPerusahaan);
  const [alamat, setAlamat] = useState(settings.alamat);
  const [npwp, setNpwp] = useState(settings.npwp);
  const [ppnDefault, setPpnDefault] = useState(settings.ppnDefault);
  const [pphDefault, setPphDefault] = useState(settings.pphDefault);
  const [formatNomorTagihan, setFormatNomorTagihan] = useState(settings.formatNomorTagihan);
  const [notifDeadlineH3, setNotifDeadlineH3] = useState(settings.notifDeadlineH3);
  const [notifDeadlineH1, setNotifDeadlineH1] = useState(settings.notifDeadlineH1);
  
  // New settings parameters
  const [jatuhTempoHariDefault, setJatuhTempoHariDefault] = useState(settings.jatuhTempoHariDefault ?? 30);
  const [metodePembayaranList, setMetodePembayaranList] = useState<string[]>(settings.metodePembayaranList || []);
  const [newPaymentMethodInput, setNewPaymentMethodInput] = useState('');

  // Aging labels & descriptions states
  const [agingBelumJatuhTempoLabel, setAgingBelumJatuhTempoLabel] = useState(settings.agingBelumJatuhTempoLabel || 'Belum Jatuh Tempo');
  const [agingBelumJatuhTempoDesc, setAgingBelumJatuhTempoDesc] = useState(settings.agingBelumJatuhTempoDesc || 'Tagihan lancar, belum jatuh tempo pembayaran.');
  const [agingLancarLabel, setAgingLancarLabel] = useState(settings.agingLancarLabel || 'Lancar (1 - 30 hari)');
  const [agingLancarDesc, setAgingLancarDesc] = useState(settings.agingLancarDesc || 'Keterlambatan ringan, mohon ingatkan mitra secara persuasif via telepon/WA.');
  const [agingKurangLancarLabel, setAgingKurangLancarLabel] = useState(settings.agingKurangLancarLabel || 'Kurang Lancar (31 - 60 hari)');
  const [agingKurangLancarDesc, setAgingKurangLancarDesc] = useState(settings.agingKurangLancarDesc || 'Keterlambatan sedang, layangkan Surat Peringatan ke-1 (SP1).');
  const [agingDiragukanLabel, setAgingDiragukanLabel] = useState(settings.agingDiragukanLabel || 'Diragukan (61 - 90 hari)');
  const [agingDiragukanDesc, setAgingDiragukanDesc] = useState(settings.agingDiragukanDesc || 'Keterlambatan tinggi, kirim Surat Peringatan ke-2 (SP2) & kunjungan langsung.');
  const [agingMacetLabel, setAgingMacetLabel] = useState(settings.agingMacetLabel || 'Macet (> 90 hari)');
  const [agingMacetDesc, setAgingMacetDesc] = useState(settings.agingMacetDesc || 'Kategori macet parah, pertimbangkan pembekuan transaksi / jalur somasi hukum.');

  // Payment method edit state
  const [editingPaymentMethodIndex, setEditingPaymentMethodIndex] = useState<number | null>(null);
  const [editingPaymentMethodValue, setEditingPaymentMethodValue] = useState('');

  // Rekanan list states
  const [rekananList, setRekananList] = useState<string[]>(settings.rekananList || []);
  const [newRekananInput, setNewRekananInput] = useState('');
  const [editingRekananIndex, setEditingRekananIndex] = useState<number | null>(null);
  const [editingRekananValue, setEditingRekananValue] = useState('');

  // Tracking position list states
  const [trackingPositionsList, setTrackingPositionsList] = useState<string[]>(settings.standardPositionsList || [
    'Berkas Dikirim ke Biro Keuangan Customer',
    'Verifikasi Berkas Lengkap (Tanda Terima Diterbitkan)',
    'Persetujuan Hubungan Pelanggan / Purchasing',
    'Menunggu Antrean Rilis Kas (Dana Approved)',
    'Pembayaran Cair / Lunas'
  ]);
  const [newPositionInput, setNewPositionInput] = useState('');
  const [editingPositionIndex, setEditingPositionIndex] = useState<number | null>(null);
  const [editingPositionValue, setEditingPositionValue] = useState('');

  // User form states
  const [newUserName, setNewUserName] = useState('');
  const [newUserUsername, setNewUserUsername] = useState('');
  const [newUserPassword, setNewUserPassword] = useState('');
  const [newUserRole, setNewUserRole] = useState<UserRole>('SUPERVISOR_KEUANGAN_UMUM');

  // Cash & Bank account states
  const [cashAccountsList, setCashAccountsList] = useState<CashAccount[]>(settings.cashAccountsList || [
    { id: 'acc-kas-utama', nama: 'Kas Utama (Fisik Cash)', tipe: 'Kas' },
    { id: 'acc-bank-bca', nama: 'Bank BCA', tipe: 'Bank', nomorRekening: '8223910291' },
    { id: 'acc-bank-mandiri', nama: 'Bank Mandiri', tipe: 'Bank', nomorRekening: '132009871123' },
    { id: 'acc-bank-bni', nama: 'Bank BNI', tipe: 'Bank', nomorRekening: '0983127455' }
  ]);
  const [newAccountNama, setNewAccountNama] = useState('');
  const [newAccountNoRek, setNewAccountNoRek] = useState('');
  const [newAccountTipe, setNewAccountTipe] = useState<'Kas' | 'Bank'>('Bank');
  const [editingAccountIndex, setEditingAccountIndex] = useState<number | null>(null);
  const [editingAccountNama, setEditingAccountNama] = useState('');
  const [editingAccountNoRek, setEditingAccountNoRek] = useState('');
  const [editingAccountTipe, setEditingAccountTipe] = useState<'Kas' | 'Bank'>('Bank');

  // User edit inline states
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [editingUserName, setEditingUserName] = useState('');
  const [editingUserUsername, setEditingUserUsername] = useState('');
  const [editingUserPassword, setEditingUserPassword] = useState('');
  const [editingUserRole, setEditingUserRole] = useState<UserRole>('SUPERVISOR_KEUANGAN_UMUM');

  // User profile states (Pengaturan profil pengguna)
  const currentUser = users.find(u => u.role === userRole) || users[0];
  const [editProfileName, setEditProfileName] = useState('');
  const [editProfileUsername, setEditProfileUsername] = useState('');
  const [editProfilePassword, setEditProfilePassword] = useState('');

  React.useEffect(() => {
    if (currentUser) {
      setEditProfileName(currentUser.nama);
      setEditProfileUsername(currentUser.username);
      setEditProfilePassword(currentUser.password || 'admin123');
    }
  }, [currentUser, userRole]);

  const [saveSuccess, setSaveSuccess] = useState(false);

  // Sync state if settings prop changes in App.tsx (e.g. on reset/restore)
  React.useEffect(() => {
    setNamaPerusahaan(settings.namaPerusahaan);
    setAlamat(settings.alamat);
    setNpwp(settings.npwp);
    setPpnDefault(settings.ppnDefault);
    setPphDefault(settings.pphDefault);
    setFormatNomorTagihan(settings.formatNomorTagihan);
    setNotifDeadlineH3(settings.notifDeadlineH3);
    setNotifDeadlineH1(settings.notifDeadlineH1);
    setJatuhTempoHariDefault(settings.jatuhTempoHariDefault ?? 30);
    setMetodePembayaranList(settings.metodePembayaranList || []);
    setRekananList(settings.rekananList || []);
    setTrackingPositionsList(settings.standardPositionsList || [
      'Berkas Dikirim ke Biro Keuangan Customer',
      'Verifikasi Berkas Lengkap (Tanda Terima Diterbitkan)',
      'Persetujuan Hubungan Pelanggan / Purchasing',
      'Menunggu Antrean Rilis Kas (Dana Approved)',
      'Pembayaran Cair / Lunas'
    ]);
    setAgingBelumJatuhTempoLabel(settings.agingBelumJatuhTempoLabel || 'Belum Jatuh Tempo');
    setAgingBelumJatuhTempoDesc(settings.agingBelumJatuhTempoDesc || 'Tagihan lancar, belum jatuh tempo pembayaran.');
    setAgingLancarLabel(settings.agingLancarLabel || 'Lancar (1 - 30 hari)');
    setAgingLancarDesc(settings.agingLancarDesc || 'Keterlambatan ringan, mohon ingatkan mitra secara persuasif via telepon/WA.');
    setAgingKurangLancarLabel(settings.agingKurangLancarLabel || 'Kurang Lancar (31 - 60 hari)');
    setAgingKurangLancarDesc(settings.agingKurangLancarDesc || 'Keterlambatan sedang, layangkan Surat Peringatan ke-1 (SP1).');
    setAgingDiragukanLabel(settings.agingDiragukanLabel || 'Diragukan (61 - 90 hari)');
    setAgingDiragukanDesc(settings.agingDiragukanDesc || 'Keterlambatan tinggi, kirim Surat Peringatan ke-2 (SP2) & kunjungan langsung.');
    setAgingMacetLabel(settings.agingMacetLabel || 'Macet (> 90 hari)');
    setAgingMacetDesc(settings.agingMacetDesc || 'Kategori macet parah, pertimbangkan pembekuan transaksi / jalur somasi hukum.');
    setCashAccountsList(settings.cashAccountsList || [
      { id: 'acc-kas-utama', nama: 'Kas Utama (Fisik Cash)', tipe: 'Kas' },
      { id: 'acc-bank-bca', nama: 'Bank BCA', tipe: 'Bank', nomorRekening: '8223910291' },
      { id: 'acc-bank-mandiri', nama: 'Bank Mandiri', tipe: 'Bank', nomorRekening: '132009871123' },
      { id: 'acc-bank-bni', nama: 'Bank BNI', tipe: 'Bank', nomorRekening: '0983127455' }
    ]);
  }, [settings]);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateSettings({
      namaPerusahaan,
      alamat,
      npwp,
      ppnDefault,
      pphDefault,
      formatNomorTagihan,
      notifDeadlineH3,
      notifDeadlineH1,
      metodePembayaranList,
      rekananList,
      jatuhTempoHariDefault: Number(jatuhTempoHariDefault),
      standardPositionsList: trackingPositionsList,
      agingBelumJatuhTempoLabel,
      agingBelumJatuhTempoDesc,
      agingLancarLabel,
      agingLancarDesc,
      agingKurangLancarLabel,
      agingKurangLancarDesc,
      agingDiragukanLabel,
      agingDiragukanDesc,
      agingMacetLabel,
      agingMacetDesc,
      cashAccountsList,
    });
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  const handleAddAccount = () => {
    if (!newAccountNama.trim()) {
      alert('Nama akun/rekening harus diisi.');
      return;
    }
    const newAcc: CashAccount = {
      id: `acc-${Date.now()}`,
      nama: newAccountNama.trim(),
      tipe: newAccountTipe,
      nomorRekening: newAccountTipe === 'Bank' ? newAccountNoRek.trim() : undefined
    };
    const updated = [...cashAccountsList, newAcc];
    setCashAccountsList(updated);
    setNewAccountNama('');
    setNewAccountNoRek('');
    onUpdateSettings({
      ...settings,
      cashAccountsList: updated
    });
  };

  const handleDeleteAccount = (id: string) => {
    if (confirm('Apakah Anda yakin ingin menghapus akun/rekening kas ini? Menghapus akun dari setelan tidak merusak data lama, namun akun tersebut tidak akan lagi dimuat untuk entri saldo baru.')) {
      const updated = cashAccountsList.filter(acc => acc.id !== id);
      setCashAccountsList(updated);
      onUpdateSettings({
        ...settings,
        cashAccountsList: updated
      });
    }
  };

  const handleStartEditAccount = (index: number) => {
    const acc = cashAccountsList[index];
    setEditingAccountIndex(index);
    setEditingAccountNama(acc.nama);
    setEditingAccountTipe(acc.tipe);
    setEditingAccountNoRek(acc.nomorRekening || '');
  };

  const handleSaveEditAccount = (index: number) => {
    if (!editingAccountNama.trim()) {
      alert('Nama akun/rekening tidak boleh kosong.');
      return;
    }
    const updated = [...cashAccountsList];
    updated[index] = {
      ...updated[index],
      nama: editingAccountNama.trim(),
      tipe: editingAccountTipe,
      nomorRekening: editingAccountTipe === 'Bank' ? editingAccountNoRek.trim() : undefined
    };
    setCashAccountsList(updated);
    setEditingAccountIndex(null);
    onUpdateSettings({
      ...settings,
      cashAccountsList: updated
    });
  };

  const handleAddPaymentMethod = () => {
    if (!newPaymentMethodInput.trim()) return;
    if (metodePembayaranList.includes(newPaymentMethodInput.trim())) {
      alert('Metode pembayaran ini sudah terdaftar.');
      return;
    }
    const updated = [...metodePembayaranList, newPaymentMethodInput.trim()];
    setMetodePembayaranList(updated);
    setNewPaymentMethodInput('');
    onUpdateSettings({
      ...settings,
      metodePembayaranList: updated,
    });
  };

  const handleDeletePaymentMethod = (index: number) => {
    const updated = metodePembayaranList.filter((_, i) => i !== index);
    setMetodePembayaranList(updated);
    onUpdateSettings({
      ...settings,
      metodePembayaranList: updated,
    });
  };

  const handleSaveEditPaymentMethod = (index: number) => {
    if (!editingPaymentMethodValue.trim()) return;
    const updated = [...metodePembayaranList];
    updated[index] = editingPaymentMethodValue.trim();
    setMetodePembayaranList(updated);
    setEditingPaymentMethodIndex(null);
    onUpdateSettings({
      ...settings,
      metodePembayaranList: updated,
    });
  };

  const handleAddRekanan = () => {
    if (!newRekananInput.trim()) return;
    if (rekananList.includes(newRekananInput.trim())) {
      alert('Nama rekanan ini sudah terdaftar.');
      return;
    }
    const updated = [...rekananList, newRekananInput.trim()];
    setRekananList(updated);
    setNewRekananInput('');
    onUpdateSettings({
      ...settings,
      rekananList: updated,
    });
  };

  const handleDeleteRekanan = (index: number) => {
    if (confirm('Apakah Anda yakin ingin menghapus nama rekanan ini?')) {
      const updated = rekananList.filter((_, i) => i !== index);
      setRekananList(updated);
      onUpdateSettings({
        ...settings,
        rekananList: updated,
      });
    }
  };

  const handleSaveEditRekanan = (index: number) => {
    if (!editingRekananValue.trim()) return;
    const updated = [...rekananList];
    updated[index] = editingRekananValue.trim();
    setRekananList(updated);
    setEditingRekananIndex(null);
    onUpdateSettings({
      ...settings,
      rekananList: updated,
    });
  };

  const handleAddPosition = () => {
    if (!newPositionInput.trim()) return;
    if (trackingPositionsList.includes(newPositionInput.trim())) {
      alert('Opsi posisi pelacakan ini sudah ada.');
      return;
    }
    const updated = [...trackingPositionsList, newPositionInput.trim()];
    setTrackingPositionsList(updated);
    setNewPositionInput('');
    onUpdateSettings({
      ...settings,
      standardPositionsList: updated,
    });
  };

  const handleDeletePosition = (index: number) => {
    if (confirm('Apakah Anda yakin ingin menghapus opsi posisi pelacakan ini?')) {
      const updated = trackingPositionsList.filter((_, i) => i !== index);
      setTrackingPositionsList(updated);
      onUpdateSettings({
        ...settings,
        standardPositionsList: updated,
      });
    }
  };

  const handleSaveEditPosition = (index: number) => {
    if (!editingPositionValue.trim()) return;
    const updated = [...trackingPositionsList];
    updated[index] = editingPositionValue.trim();
    setTrackingPositionsList(updated);
    setEditingPositionIndex(null);
    onUpdateSettings({
      ...settings,
      standardPositionsList: updated,
    });
  };

  const handleUpdateUserProfile = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editProfileName.trim() || !editProfileUsername.trim()) {
      alert('Nama dan Username tidak boleh kosong!');
      return;
    }
    if (users.some(u => u.username === editProfileUsername.trim() && u.id !== currentUser.id)) {
      alert('Username ini sudah digunakan oleh pengguna lain.');
      return;
    }
    const updatedUsers = users.map(u => {
      if (u.id === currentUser.id) {
        return {
          ...u,
          nama: editProfileName.trim(),
          username: editProfileUsername.trim(),
          password: editProfilePassword.trim() || 'admin123'
        };
      }
      return u;
    });
    onUpdateUsers(updatedUsers);
    alert('Profil pengguna Anda berhasil diperbarui!');
  };

  const handleAddUserSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUserName.trim() || !newUserUsername.trim()) {
      alert('Nama dan Username wajib diisi untuk membuat user baru.');
      return;
    }
    if (users.some(u => u.username === newUserUsername.trim())) {
      alert('Username ini sudah digunakan.');
      return;
    }
    const newUserObj: AppUser = {
      id: `usr-${Date.now()}`,
      nama: newUserName.trim(),
      username: newUserUsername.trim(),
      role: newUserRole,
      password: newUserPassword.trim() || 'admin123'
    };
    onUpdateUsers([...users, newUserObj]);
    setNewUserName('');
    setNewUserUsername('');
    setNewUserPassword('');
    alert(`Sukses menambahkan user ${newUserObj.nama}!`);
  };

  const handleDeleteUser = (userId: string) => {
    if (confirm('Apakah Anda yakin ingin menghapus user ini?')) {
      const remainingUsers = users.filter(u => u.id !== userId);
      onUpdateUsers(remainingUsers);
    }
  };

  const handleSaveEditUser = (userId: string) => {
    if (!editingUserName.trim() || !editingUserUsername.trim()) {
      alert('Nama dan Username tidak boleh kosong!');
      return;
    }
    // Check if username is already taken by another user
    if (users.some(u => u.username === editingUserUsername.trim() && u.id !== userId)) {
      alert('Username ini sudah digunakan oleh pengguna lain.');
      return;
    }
    const updatedUsers = users.map(u => {
      if (u.id === userId) {
        return {
          ...u,
          nama: editingUserName.trim(),
          username: editingUserUsername.trim(),
          role: editingUserRole,
          password: editingUserPassword.trim() || u.password || 'admin123'
        };
      }
      return u;
    });
    onUpdateUsers(updatedUsers);
    setEditingUserId(null);
    alert('Informasi user berhasil diperbarui!');
  };

  const handleDownloadBackup = () => {
    const payload = {
      payments,
      invoices,
      logs,
      notifications,
      settings,
      users,
      backupDate: new Date().toISOString(),
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `backup_pelacak_piutang_${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleUploadBackupFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const payload = JSON.parse(event.target?.result as string);
        if (payload && (payload.payments || payload.invoices || payload.settings)) {
          onRestoreData(payload);
          alert('Database berhasil di-restore dari file cadangan JSON!');
        } else {
          alert('Format data file backup tidak valid.');
        }
      } catch (err) {
        alert('Gagal membaca file backup. Pastikan file JSON valid.');
      }
    };
    reader.readAsText(file);
  };

  const isRoleAdmin = userRole === 'ADMINISTRATOR';

  return (
    <div className="space-y-6" id="settings-module-root">
      
      {/* Alert Banner if not Administrator */}
      {/* Alert Banner for simulating setting updates */}
      <div className="p-3.5 bg-indigo-50 border border-indigo-200/50 text-indigo-950 rounded-xl text-xs flex items-start gap-2.5">
        <Building2 className="h-4.5 w-4.5 text-indigo-600 shrink-0 mt-0.5" />
        <div>
          <span className="font-bold">Mode Pengisian & Simulasi Pengaturan Terkirim</span>
          <p className="mt-0.5 text-indigo-700">
            Sistem memperkenankan simulasi konfigurasi langsung di bawah ini agar Anda dapat merekam & menguji penyesuaian profil perusahaan, user aktif, metode pembayaran, nama rekanan terdaftar, dan notifikasi tenggat.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        
        {/* Navigation panel */}
        <div className="md:col-span-3 space-y-1 bg-white rounded-xl border border-slate-100 p-2 shadow-sm self-start">
          <button
            type="button"
            onClick={() => setActiveTab('profile')}
            className={`w-full text-left text-xs font-bold p-3 rounded-lg flex items-center gap-2 transition-all cursor-pointer ${
              activeTab === 'profile' 
                ? 'bg-indigo-600 text-white' 
                : 'text-slate-600 hover:bg-slate-50'
            }`}
            id="tab-profile"
          >
            <Building2 className="h-4 w-4" />
            Profil Perusahaan
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('user-profile')}
            className={`w-full text-left text-xs font-bold p-3 rounded-lg flex items-center gap-2 transition-all cursor-pointer ${
              activeTab === 'user-profile' 
                ? 'bg-indigo-600 text-white' 
                : 'text-slate-600 hover:bg-slate-50'
            }`}
            id="tab-user-profile"
          >
            <User className="h-4 w-4" />
            Profil Pengguna (Simulasi)
          </button>
          
          <button
            type="button"
            onClick={() => setActiveTab('tax')}
            className={`w-full text-left text-xs font-bold p-3 rounded-lg flex items-center gap-2 transition-all cursor-pointer ${
              activeTab === 'tax' 
                ? 'bg-indigo-600 text-white' 
                : 'text-slate-600 hover:bg-slate-50'
            }`}
            id="tab-tax"
          >
            <Coins className="h-4 w-4" />
            Parameter Pajak & Jatuh Tempo
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('payment-methods')}
            className={`w-full text-left text-xs font-bold p-3 rounded-lg flex items-center gap-2 transition-all cursor-pointer ${
              activeTab === 'payment-methods' 
                ? 'bg-indigo-600 text-white' 
                : 'text-slate-600 hover:bg-slate-50'
            }`}
            id="tab-payment-methods"
          >
            <Settings className="h-4 w-4" />
            Metode Pembayaran
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('cash-accounts')}
            className={`w-full text-left text-xs font-bold p-3 rounded-lg flex items-center gap-2 transition-all cursor-pointer ${
              activeTab === 'cash-accounts' 
                ? 'bg-indigo-600 text-white' 
                : 'text-slate-600 hover:bg-slate-50'
            }`}
            id="tab-cash-accounts"
          >
            <Wallet className="h-4 w-4 text-emerald-500" />
            Kas &amp; Rekening Perusahaan
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('branding')}
            className={`w-full text-left text-xs font-bold p-3 rounded-lg flex items-center gap-2 transition-all cursor-pointer ${
              activeTab === 'branding' 
                ? 'bg-indigo-600 text-white' 
                : 'text-slate-600 hover:bg-slate-50'
            }`}
            id="tab-branding"
          >
            <Sparkles className="h-4 w-4 text-amber-450 animate-pulse" />
            Logo Kustom &amp; PWA Center
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('partners')}
            className={`w-full text-left text-xs font-bold p-3 rounded-lg flex items-center gap-2 transition-all cursor-pointer ${
              activeTab === 'partners' 
                ? 'bg-indigo-600 text-white' 
                : 'text-slate-600 hover:bg-slate-50'
            }`}
            id="tab-partners"
          >
            <Briefcase className="h-4 w-4" />
            Manajemen Rekanan (Vendor)
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('tracking-positions')}
            className={`w-full text-left text-xs font-bold p-3 rounded-lg flex items-center gap-2 transition-all cursor-pointer ${
              activeTab === 'tracking-positions' 
                ? 'bg-indigo-600 text-white' 
                : 'text-slate-600 hover:bg-slate-50'
            }`}
            id="tab-tracking-positions"
          >
            <History className="h-4 w-4" />
            Pilihan Posisi Pelacakan
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('users')}
            className={`w-full text-left text-xs font-bold p-3 rounded-lg flex items-center gap-2 transition-all cursor-pointer ${
              activeTab === 'users' 
                ? 'bg-indigo-600 text-white' 
                : 'text-slate-600 hover:bg-slate-50'
            }`}
            id="tab-users"
          >
            <Users className="h-4 w-4" />
            Manajemen User & Hak Akses
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('backup-restore')}
            className={`w-full text-left text-xs font-bold p-3 rounded-lg flex items-center gap-2 transition-all cursor-pointer ${
              activeTab === 'backup-restore' 
                ? 'bg-indigo-600 text-white' 
                : 'text-slate-600 hover:bg-slate-50'
            }`}
            id="tab-backup-restore"
          >
            <History className="h-4 w-4" />
            Backup & Restore Database
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('notification')}
            className={`w-full text-left text-xs font-bold p-3 rounded-lg flex items-center gap-2 transition-all cursor-pointer ${
              activeTab === 'notification' 
                ? 'bg-indigo-600 text-white' 
                : 'text-slate-600 hover:bg-slate-50'
            }`}
            id="tab-notification"
          >
            <Bell className="h-4 w-4" />
            Pengaturan Notifikasi H+3
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('system')}
            className={`w-full text-left text-xs font-bold p-3 rounded-lg flex items-center gap-2 transition-all cursor-pointer ${
              activeTab === 'system' 
                ? 'bg-indigo-600 text-white' 
                : 'text-slate-600 hover:bg-slate-50'
            }`}
            id="tab-system"
          >
            <RefreshCcw className="h-4 w-4" />
            Developer & Reset Database
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('changelog')}
            className={`w-full text-left text-xs font-bold p-3 rounded-lg flex items-center gap-2 transition-all cursor-pointer ${
              activeTab === 'changelog' 
                ? 'bg-indigo-600 text-white' 
                : 'text-slate-600 hover:bg-slate-50'
            }`}
            id="tab-changelog"
          >
            <FileText className="h-4 w-4" />
            Riwayat Versi &amp; Catatan
          </button>
        </div>

        {/* Form detail parameters */}
        <div className="md:col-span-9 bg-white rounded-xl border border-slate-100 shadow-sm p-6">
          {saveSuccess && (
            <div className="p-3 bg-emerald-50 border border-emerald-100 text-emerald-800 rounded-lg text-xs font-semibold flex items-center gap-2 mb-4 animate-fadeIn">
              <Check className="h-4 w-4 text-emerald-600" />
              Pengaturan berhasil disimpan dan diperbarui!
            </div>
          )}

          <form onSubmit={handleSave} className="space-y-6">
            
            {/* SUB-MODULE: Profile */}
            {activeTab === 'profile' && (
              <div className="space-y-4 animate-fadeIn" id="content-profile">
                <div>
                  <h3 className="text-sm font-bold text-slate-800">Profil Identitas Perusahaan</h3>
                  <p className="text-xs text-slate-400 mt-1">Mengatur nama and kop yang akan dicetak di preview cetak invoice.</p>
                </div>

                <div className="space-y-4">
                  <div className="space-y-1 text-xs">
                    <label className="font-bold text-slate-600">Nama Perusahaan Penagih</label>
                    <input
                      type="text"
                      className="w-full p-2.5 border border-slate-200 rounded-lg bg-slate-50"
                      value={namaPerusahaan}
                      onChange={(e) => setNamaPerusahaan(e.target.value)}
                    />
                  </div>

                  <div className="space-y-1 text-xs">
                    <label className="font-bold text-slate-600">Alamat Surat & Kantor Utama</label>
                    <textarea
                      rows={3}
                      className="w-full p-2.5 border border-slate-200 rounded-lg bg-slate-50"
                      value={alamat}
                      onChange={(e) => setAlamat(e.target.value)}
                    />
                  </div>

                  <div className="space-y-1 text-xs">
                    <label className="font-bold text-slate-600">NPWP Pajak Resmi Perusahaan</label>
                    <input
                      type="text"
                      className="w-full p-2.5 border border-slate-200 rounded-lg bg-slate-50 font-mono"
                      value={npwp}
                      onChange={(e) => setNpwp(e.target.value)}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* SUB-MODULE: User Profile Config */}
            {activeTab === 'user-profile' && (
              <div className="space-y-4 animate-fadeIn" id="content-user-profile">
                <div>
                  <h3 className="text-sm font-bold text-slate-800">Profil Pengguna Aktif (Simulasi)</h3>
                  <p className="text-xs text-slate-400 mt-1">Ubah nama lengkap dan identitas akun Anda yang berjalan pada mode simulasi saat ini.</p>
                </div>

                <div className="max-w-xl bg-slate-50 p-5 rounded-xl border border-slate-200/60 space-y-4 font-sans">
                  <div className="flex items-center gap-2.5 pb-2 border-b border-slate-200">
                    <div className="h-10 w-10 bg-indigo-100 text-indigo-700 rounded-full flex items-center justify-center font-bold text-xs uppercase tracking-wider">
                      {editProfileName.slice(0, 2).toUpperCase() || 'US'}
                    </div>
                    <div>
                      <span className="text-xs font-bold text-slate-700 block">{currentUser?.nama || 'Pengguna'}</span>
                      <span className="text-[10px] text-indigo-600 font-extrabold uppercase tracking-wide">
                        {userRole === 'SUPERVISOR_KEUANGAN_UMUM' 
                          ? 'Supervisor Keuangan & Umum' 
                          : userRole === 'STAF_ADMINISTRASI_UMUM' 
                          ? 'Staf Administrasi & Umum' 
                          : 'Direktur'}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="space-y-1 text-xs">
                      <label className="font-bold text-slate-600 block">Nama Lengkap Anda</label>
                      <input
                        type="text"
                        className="w-full p-2.5 border border-slate-200 rounded-lg bg-white"
                        value={editProfileName}
                        onChange={(e) => setEditProfileName(e.target.value)}
                        placeholder="Contoh: Budi Santoso"
                      />
                    </div>

                    <div className="space-y-1 text-xs">
                      <label className="font-bold text-slate-600 block">Username Login Anda</label>
                      <input
                        type="text"
                        className="w-full p-2.5 border border-slate-200 rounded-lg bg-white font-mono"
                        value={editProfileUsername}
                        onChange={(e) => setEditProfileUsername(e.target.value)}
                        placeholder="Contoh: budi_keu"
                      />
                    </div>

                    <div className="space-y-1 text-xs">
                      <label className="font-bold text-slate-600 block">Kata Sandi (Password) Login Anda</label>
                      <input
                        type="text"
                        className="w-full p-2.5 border border-slate-200 rounded-lg bg-white"
                        value={editProfilePassword}
                        onChange={(e) => setEditProfilePassword(e.target.value)}
                        placeholder="Contoh: rahasia123"
                      />
                    </div>

                    <div className="pt-2">
                      <button
                        type="button"
                        onClick={handleUpdateUserProfile}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs px-4 py-2.5 rounded-lg cursor-pointer transition-colors"
                      >
                        Simpan Perubahan Profil Pengguna
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* SUB-MODULE: Tax parameters */}
            {activeTab === 'tax' && (
              <div className="space-y-4 animate-fadeIn" id="content-tax">
                <div>
                  <h3 className="text-sm font-bold text-slate-800">Parameter Pajak & Jatuh Tempo Default</h3>
                  <p className="text-xs text-slate-400 mt-1">Mengonfigurasi default tarif perpajakan, formatting serial invoice, dan jumlah hari jatuh tempo penagihan.</p>
                </div>

                <div className="space-y-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1 text-xs md:col-span-2">
                    <label className="font-bold text-slate-600">Format Seri Nomor Tagihan Otomatis</label>
                    <input
                      type="text"
                      className="w-full p-2.5 border border-slate-200 rounded-lg bg-slate-50 font-mono"
                      value={formatNomorTagihan}
                      onChange={(e) => setFormatNomorTagihan(e.target.value)}
                    />
                    <span className="text-[10px] text-slate-400 font-medium block mt-1">
                      Kunci tagihan: <strong>{'{YEAR}'}</strong> untuk tahun berjalan, <strong>{'{MONTH}'}</strong> untuk bulan berjalan, <strong>{'{COUNT}'}</strong> untuk nomor counter tagihan.
                    </span>
                  </div>

                  <div className="space-y-1 text-xs">
                    <label className="font-bold text-slate-600">Tarif PPN Default (%)</label>
                    <input
                      type="number"
                      className="w-full p-2.5 border border-slate-200 rounded-lg bg-slate-50"
                      value={ppnDefault}
                      onChange={(e) => setPpnDefault(Number(e.target.value))}
                    />
                  </div>

                  <div className="space-y-1 text-xs">
                    <label className="font-bold text-slate-600">Tarif Potongan PPh Pasal 23 (%)</label>
                    <input
                      type="number"
                      className="w-full p-2.5 border border-slate-200 rounded-lg bg-slate-50"
                      value={pphDefault}
                      onChange={(e) => setPphDefault(Number(e.target.value))}
                    />
                  </div>

                  <div className="space-y-1 text-xs md:col-span-2">
                    <label className="font-bold text-slate-600">Masa Jatuh Tempo Bawaan Tagihan (Hari)</label>
                    <input
                      type="number"
                      className="w-full p-2.5 border border-slate-200 rounded-lg bg-slate-50 font-bold"
                      value={jatuhTempoHariDefault}
                      onChange={(e) => setJatuhTempoHariDefault(Number(e.target.value))}
                    />
                    <span className="text-[10px] text-slate-400 font-medium block mt-1">
                      Mengatur tenggat jatuh tempo tagihan baru secara otomatis sejak tagihan diterbitkan (contoh: 30 hari).
                    </span>
                  </div>

                  {/* Kategori Umur Piutang */}
                  <div className="md:col-span-2 border-t border-slate-100 pt-4 mt-2">
                    <h4 className="text-xs font-bold text-slate-700 mb-1">Deskripsi Kategori Umur Piutang & Tindakan (Aging of Accounts Receivable)</h4>
                    <p className="text-[11px] text-slate-400 mb-4">Sesuaikan label kategori umur piutang serta deskripsi tindakan operasional yang harus diambil untuk masing-masing kategori.</p>
                    
                    <div className="space-y-4">
                      {/* 1. Belum Jatuh Tempo */}
                      <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-100 space-y-3">
                        <span className="text-[10px] font-black tracking-wider text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">KATEGORI 1: BELUM JATUH TEMPO</span>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                          <div className="space-y-1 text-xs">
                            <label className="font-bold text-slate-500">Nama Label</label>
                            <input
                              type="text"
                              className="w-full p-2 border border-slate-200 rounded bg-white text-slate-800 font-bold"
                              value={agingBelumJatuhTempoLabel}
                              onChange={(e) => setAgingBelumJatuhTempoLabel(e.target.value)}
                            />
                          </div>
                          <div className="space-y-1 text-xs md:col-span-2">
                            <label className="font-bold text-slate-500">Deskripsi / Rekomendasi Tindakan</label>
                            <input
                              type="text"
                              className="w-full p-2 border border-slate-200 rounded bg-white text-slate-600"
                              value={agingBelumJatuhTempoDesc}
                              onChange={(e) => setAgingBelumJatuhTempoDesc(e.target.value)}
                            />
                          </div>
                        </div>
                      </div>

                      {/* 2. Lancar */}
                      <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-100 space-y-3">
                        <span className="text-[10px] font-black tracking-wider text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded">KATEGORI 2: LANCAR (1 - 30 HARI)</span>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                          <div className="space-y-1 text-xs">
                            <label className="font-bold text-slate-500">Nama Label</label>
                            <input
                              type="text"
                              className="w-full p-2 border border-slate-200 rounded bg-white text-slate-800 font-bold"
                              value={agingLancarLabel}
                              onChange={(e) => setAgingLancarLabel(e.target.value)}
                            />
                          </div>
                          <div className="space-y-1 text-xs md:col-span-2">
                            <label className="font-bold text-slate-500">Deskripsi / Rekomendasi Tindakan</label>
                            <input
                              type="text"
                              className="w-full p-2 border border-slate-200 rounded bg-white text-slate-600"
                              value={agingLancarDesc}
                              onChange={(e) => setAgingLancarDesc(e.target.value)}
                            />
                          </div>
                        </div>
                      </div>

                      {/* 3. Kurang Lancar */}
                      <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-100 space-y-3">
                        <span className="text-[10px] font-black tracking-wider text-amber-600 bg-amber-50 px-2 py-0.5 rounded">KATEGORI 3: KURANG LANCAR (31 - 60 HARI)</span>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                          <div className="space-y-1 text-xs">
                            <label className="font-bold text-slate-500">Nama Label</label>
                            <input
                              type="text"
                              className="w-full p-2 border border-slate-200 rounded bg-white text-slate-800 font-bold"
                              value={agingKurangLancarLabel}
                              onChange={(e) => setAgingKurangLancarLabel(e.target.value)}
                            />
                          </div>
                          <div className="space-y-1 text-xs md:col-span-2">
                            <label className="font-bold text-slate-500">Deskripsi / Rekomendasi Tindakan</label>
                            <input
                              type="text"
                              className="w-full p-2 border border-slate-200 rounded bg-white text-slate-600"
                              value={agingKurangLancarDesc}
                              onChange={(e) => setAgingKurangLancarDesc(e.target.value)}
                            />
                          </div>
                        </div>
                      </div>

                      {/* 4. Diragukan */}
                      <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-100 space-y-3">
                        <span className="text-[10px] font-black tracking-wider text-orange-600 bg-orange-50 px-2 py-0.5 rounded">KATEGORI 4: DIRAGUKAN (61 - 90 HARI)</span>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                          <div className="space-y-1 text-xs">
                            <label className="font-bold text-slate-500">Nama Label</label>
                            <input
                              type="text"
                              className="w-full p-2 border border-slate-200 rounded bg-white text-slate-800 font-bold"
                              value={agingDiragukanLabel}
                              onChange={(e) => setAgingDiragukanLabel(e.target.value)}
                            />
                          </div>
                          <div className="space-y-1 text-xs md:col-span-2">
                            <label className="font-bold text-slate-500">Deskripsi / Rekomendasi Tindakan</label>
                            <input
                              type="text"
                              className="w-full p-2 border border-slate-200 rounded bg-white text-slate-600"
                              value={agingDiragukanDesc}
                              onChange={(e) => setAgingDiragukanDesc(e.target.value)}
                            />
                          </div>
                        </div>
                      </div>

                      {/* 5. Macet */}
                      <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-100 space-y-3">
                        <span className="text-[10px] font-black tracking-wider text-rose-600 bg-rose-50 px-2 py-0.5 rounded">KATEGORI 5: MACET (&gt; 90 HARI)</span>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                          <div className="space-y-1 text-xs">
                            <label className="font-bold text-slate-500">Nama Label</label>
                            <input
                              type="text"
                              className="w-full p-2 border border-slate-200 rounded bg-white text-slate-800 font-bold"
                              value={agingMacetLabel}
                              onChange={(e) => setAgingMacetLabel(e.target.value)}
                            />
                          </div>
                          <div className="space-y-1 text-xs md:col-span-2">
                            <label className="font-bold text-slate-500">Deskripsi / Rekomendasi Tindakan</label>
                            <input
                              type="text"
                              className="w-full p-2 border border-slate-200 rounded bg-white text-slate-600"
                              value={agingMacetDesc}
                              onChange={(e) => setAgingMacetDesc(e.target.value)}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* SUB-MODULE: Payment Methods Config */}
            {activeTab === 'payment-methods' && (
              <div className="space-y-4 animate-fadeIn" id="content-payment-methods">
                <div>
                  <h3 className="text-sm font-bold text-slate-800">Manajemen Metode Pembayaran</h3>
                  <p className="text-xs text-slate-400 mt-1">Mengonfigurasi opsi metode pembayaran yang tersedia saat pencatatan pengeluaran & bilyet giro bank.</p>
                </div>

                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/60 space-y-4">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      className="text-xs flex-1 p-2.5 border border-slate-200 rounded-lg bg-white"
                      placeholder="Masukkan nama metode baru (cth: Bank Mandiri VA, Bilyet Giro Mandiri)"
                      value={newPaymentMethodInput}
                      onChange={(e) => setNewPaymentMethodInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddPaymentMethod();
                        }
                      }}
                    />
                    <button
                      type="button"
                      onClick={handleAddPaymentMethod}
                      className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs px-4 py-2 text-center rounded-lg cursor-pointer"
                    >
                      Tambah Opsi
                    </button>
                  </div>

                  <div className="space-y-2">
                    <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Opsi Terdaftar Saat Ini ({metodePembayaranList.length})</span>
                    {metodePembayaranList.length === 0 ? (
                      <p className="text-xs text-slate-400 italic">Belum ada metode pembayaran yang dikonfigurasi.</p>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {metodePembayaranList.map((m, idx) => (
                          <div key={idx} className="flex justify-between items-center text-xs p-2.5 bg-white border border-slate-100 rounded-lg shadow-2xs">
                            {editingPaymentMethodIndex === idx ? (
                              <div className="flex gap-2 w-full">
                                <input
                                  type="text"
                                  className="text-xs flex-1 p-1.5 border border-slate-200 rounded bg-white"
                                  value={editingPaymentMethodValue}
                                  onChange={(e) => setEditingPaymentMethodValue(e.target.value)}
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                      e.preventDefault();
                                      handleSaveEditPaymentMethod(idx);
                                    }
                                  }}
                                  autoFocus
                                />
                                <button
                                  type="button"
                                  onClick={() => handleSaveEditPaymentMethod(idx)}
                                  className="text-[10px] bg-emerald-500 hover:bg-emerald-600 text-white font-bold px-2.5 py-1.5 rounded"
                                >
                                  Simpan
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setEditingPaymentMethodIndex(null)}
                                  className="text-[10px] bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold px-2.5 py-1.5 rounded"
                                >
                                  Batal
                                </button>
                              </div>
                            ) : (
                              <>
                                <span className="font-bold text-slate-700 capitalize">{m}</span>
                                <div className="flex gap-1.5">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setEditingPaymentMethodIndex(idx);
                                      setEditingPaymentMethodValue(m);
                                    }}
                                    className="text-slate-400 hover:text-indigo-600 p-1 rounded hover:bg-indigo-50 transition-colors"
                                    title="Edit metode pembayaran ini"
                                  >
                                    <Edit className="h-3.5 w-3.5" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleDeletePaymentMethod(idx)}
                                    className="text-slate-400 hover:text-rose-600 p-1 rounded hover:bg-rose-50 transition-colors"
                                    title="Hapus metode ini"
                                  >
                                    <Trash2 className="h-3.5 w-3.5" />
                                  </button>
                                </div>
                              </>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* SUB-MODULE: Partners Config */}
            {activeTab === 'partners' && (
              <div className="space-y-4 animate-fadeIn" id="content-partners">
                <div>
                  <h3 className="text-sm font-bold text-slate-800">Manajemen Nama Rekanan (Vendor)</h3>
                  <p className="text-xs text-slate-400 mt-1">Mengatur daftar nama rekanan vendor atau supplier resmi pihak ketiga.</p>
                </div>

                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/60 space-y-4 font-sans">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      className="text-xs flex-1 p-2.5 border border-slate-200 rounded-lg bg-white"
                      placeholder="Masukkan nama rekanan baru (cth: PT Semen Indonesia, CV Sahabat Kita)"
                      value={newRekananInput}
                      onChange={(e) => setNewRekananInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddRekanan();
                        }
                      }}
                    />
                    <button
                      type="button"
                      onClick={handleAddRekanan}
                      className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs px-4 py-2 text-center rounded-lg cursor-pointer"
                    >
                      Tambah Rekanan
                    </button>
                  </div>

                  <div className="space-y-2">
                    <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Daftar Rekanan Terdaftar ({rekananList.length})</span>
                    {rekananList.length === 0 ? (
                      <p className="text-xs text-slate-400 italic">Belum ada nama rekanan yang didaftarkan.</p>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {rekananList.map((r, idx) => (
                          <div key={idx} className="flex justify-between items-center text-xs p-2.5 bg-white border border-slate-100 rounded-lg shadow-2xs">
                            {editingRekananIndex === idx ? (
                              <div className="flex gap-2 w-full">
                                <input
                                  type="text"
                                  className="text-xs flex-1 p-1.5 border border-slate-200 rounded bg-white"
                                  value={editingRekananValue}
                                  onChange={(e) => setEditingRekananValue(e.target.value)}
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                      e.preventDefault();
                                      handleSaveEditRekanan(idx);
                                    }
                                  }}
                                  autoFocus
                                />
                                <button
                                  type="button"
                                  onClick={() => handleSaveEditRekanan(idx)}
                                  className="text-[10px] bg-emerald-500 hover:bg-emerald-600 text-white font-bold px-2.5 py-1.5 rounded"
                                >
                                  Simpan
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setEditingRekananIndex(null)}
                                  className="text-[10px] bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold px-2.5 py-1.5 rounded"
                                >
                                  Batal
                                </button>
                              </div>
                            ) : (
                              <>
                                <span className="font-bold text-slate-700 uppercase tracking-tight">{r}</span>
                                <div className="flex gap-1.5">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setEditingRekananIndex(idx);
                                      setEditingRekananValue(r);
                                    }}
                                    className="text-slate-400 hover:text-indigo-600 p-1 rounded hover:bg-indigo-50 transition-colors"
                                    title="Edit rekanan ini"
                                  >
                                    <Edit className="h-3.5 w-3.5" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleDeleteRekanan(idx)}
                                    className="text-slate-400 hover:text-rose-600 p-1 rounded hover:bg-rose-50 transition-colors"
                                    title="Hapus rekanan ini"
                                  >
                                    <Trash2 className="h-3.5 w-3.5" />
                                  </button>
                                </div>
                              </>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* SUB-MODULE: Tracking Positions Config */}
            {activeTab === 'tracking-positions' && (
              <div className="space-y-4 animate-fadeIn" id="content-tracking-positions">
                <div>
                  <h3 className="text-sm font-bold text-slate-800">Opsi Posisi Pelacakan Dokumen</h3>
                  <p className="text-xs text-slate-400 mt-1">Mengatur daftar pilihan status/posisi berkas fisik tagihan (Invoice) untuk pelacakan dinamis oleh staf.</p>
                </div>

                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/60 space-y-4 font-sans">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      className="text-xs flex-1 p-2.5 border border-slate-200 rounded-lg bg-white"
                      placeholder="Masukkan nama status posisi baru (cth: Berkas Diterima Loket C, dsb.)"
                      value={newPositionInput}
                      onChange={(e) => setNewPositionInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddPosition();
                        }
                      }}
                    />
                    <button
                      type="button"
                      onClick={handleAddPosition}
                      className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs px-4 py-2 text-center rounded-lg cursor-pointer transition-colors"
                    >
                      Tambah Posisi
                    </button>
                  </div>

                  <div className="space-y-2">
                    <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Opsi Status Terdaftar ({trackingPositionsList.length})</span>
                    <p className="text-[10px] text-amber-600 bg-amber-50 rounded p-2 border border-amber-100/60 font-medium">
                      Status ini akan ditawarkan secara otomatis kepada Staf saat memperbarui pergerakan berkas invoice, melengkapi proses tanda terima s.d. pencairan dana.
                    </p>
                    {trackingPositionsList.length === 0 ? (
                      <p className="text-xs text-slate-400 italic">Belum ada pilihan posisi yang didaftarkan.</p>
                    ) : (
                      <div className="space-y-1.5">
                        {trackingPositionsList.map((pos, idx) => (
                          <div key={idx} className="flex justify-between items-center text-xs p-2.5 bg-white border border-slate-100 rounded-lg shadow-2xs">
                            {editingPositionIndex === idx ? (
                              <div className="flex gap-2 w-full">
                                <input
                                  type="text"
                                  className="text-xs flex-1 p-1.5 border border-slate-200 rounded bg-white"
                                  value={editingPositionValue}
                                  onChange={(e) => setEditingPositionValue(e.target.value)}
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                      e.preventDefault();
                                      handleSaveEditPosition(idx);
                                    }
                                  }}
                                  autoFocus
                                />
                                <button
                                  type="button"
                                  onClick={() => handleSaveEditPosition(idx)}
                                  className="text-[10px] bg-emerald-500 hover:bg-emerald-600 text-white font-bold px-2.5 py-1.5 rounded"
                                >
                                  Simpan
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setEditingPositionIndex(null)}
                                  className="text-[10px] bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold px-2.5 py-1.5 rounded"
                                >
                                  Batal
                                </button>
                              </div>
                            ) : (
                              <>
                                <div className="flex items-center gap-2">
                                  <span className="h-5 w-5 bg-indigo-50 text-indigo-700 text-[10px] font-bold flex items-center justify-center rounded-full">
                                    {idx + 1}
                                  </span>
                                  <span className="font-bold text-slate-700">{pos}</span>
                                </div>
                                <div className="flex gap-1.5">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setEditingPositionIndex(idx);
                                      setEditingPositionValue(pos);
                                    }}
                                    className="text-slate-400 hover:text-indigo-600 p-1 rounded hover:bg-indigo-50 transition-colors"
                                    title="Edit posisi ini"
                                  >
                                    <Edit className="h-3.5 w-3.5" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleDeletePosition(idx)}
                                    className="text-slate-400 hover:text-rose-600 p-1 rounded hover:bg-rose-50 transition-colors"
                                    title="Hapus posisi ini"
                                  >
                                    <Trash2 className="h-3.5 w-3.5" />
                                  </button>
                                </div>
                              </>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* SUB-MODULE: User & Role Management */}
            {activeTab === 'users' && (
              <div className="space-y-4 animate-fadeIn" id="content-users">
                <div>
                  <h3 className="text-sm font-bold text-slate-800">Manajemen User & Hak Akses</h3>
                  <p className="text-xs text-slate-400 mt-1">Kelola kredensial pengguna, profil, dan hak akses yang tersimpan dalam database local storage.</p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
                  {/* Left Column: Create user form (special for simulation) */}
                  <div className="lg:col-span-4 bg-slate-50 p-4 rounded-xl border border-slate-200/60 space-y-3 self-start relative overflow-hidden animate-fadeIn">
                    {!isRoleAdmin && (
                      <div className="absolute inset-0 bg-slate-100/70 backdrop-blur-xs flex flex-col items-center justify-center p-4 text-center z-10 animate-fadeIn">
                        <ShieldAlert className="h-8 w-8 text-amber-600 mb-2" />
                        <span className="text-xs font-bold text-slate-800">Akses Terkunci</span>
                        <p className="text-[10px] text-slate-500 mt-1 max-w-[180px] leading-tight font-medium">
                          Gunakan pemilih peran <strong className="text-indigo-600">Administrator</strong> di bar atas untuk membuka pendaftaran staf baru.
                        </p>
                      </div>
                    )}
                    
                    <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Tambah User Baru</h4>
                    
                    <div className="space-y-1 text-xs">
                      <label className="font-bold text-slate-600">Nama Lengkap</label>
                      <input
                        type="text"
                        disabled={!isRoleAdmin}
                        className="w-full p-2 border border-slate-200 rounded bg-white focus:outline-none focus:border-indigo-500"
                        placeholder="Cth: Budiyono Ahmad"
                        value={newUserName}
                        onChange={(e) => setNewUserName(e.target.value)}
                      />
                    </div>

                    <div className="space-y-1 text-xs">
                      <label className="font-bold text-slate-600">Username</label>
                      <input
                        type="text"
                        disabled={!isRoleAdmin}
                        className="w-full p-2 border border-slate-200 rounded bg-white font-mono focus:outline-none focus:border-indigo-500"
                        placeholder="cth: budiyono"
                        value={newUserUsername}
                        onChange={(e) => setNewUserUsername(e.target.value)}
                      />
                    </div>

                    <div className="space-y-1 text-xs">
                      <label className="font-bold text-slate-600">Kata Sandi (Password)</label>
                      <input
                        type="text"
                        disabled={!isRoleAdmin}
                        className="w-full p-2 border border-slate-200 rounded bg-white focus:outline-none focus:border-indigo-500"
                        placeholder="Cth: budiyono123 (Kosong = 'admin123')"
                        value={newUserPassword}
                        onChange={(e) => setNewUserPassword(e.target.value)}
                      />
                    </div>

                    <div className="space-y-1 text-xs">
                      <label className="font-bold text-slate-600">Akses Role</label>
                      <select
                        disabled={!isRoleAdmin}
                        className="w-full p-2 border border-slate-200 rounded bg-white focus:outline-none focus:border-indigo-500"
                        value={newUserRole}
                        onChange={(e) => setNewUserRole(e.target.value as UserRole)}
                      >
                        <option value="SUPERVISOR_KEUANGAN_UMUM">Supervisor Keuangan & Umum</option>
                        <option value="STAF_ADMINISTRASI_UMUM">Staf Administrasi & Umum</option>
                        <option value="DIREKTUR">Direktur</option>
                        <option value="ADMINISTRATOR">Administrator</option>
                      </select>
                    </div>

                    <button
                      type="button"
                      disabled={!isRoleAdmin}
                      onClick={handleAddUserSubmit}
                      className="w-full bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold py-2 rounded-lg transition-colors cursor-pointer disabled:opacity-50"
                    >
                      Daftarkan Staf Baru
                    </button>
                  </div>

                  {/* Right Column: User list table */}
                  <div className="lg:col-span-8 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Daftar Akun Pengguna Aktif</span>
                      {isRoleAdmin && (
                        <span className="bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider animate-pulse">
                          Mode Otoritas Administrator Aktif
                        </span>
                      )}
                    </div>
                    
                    <div className="border border-slate-100 rounded-lg overflow-x-auto">
                      <table className="w-full text-left text-xs text-slate-600 border-collapse">
                        <thead>
                          <tr className="bg-slate-50 text-[10px] uppercase font-bold text-slate-500 border-b border-slate-100">
                            <th className="p-3">Nama</th>
                            <th className="p-3">Username</th>
                            <th className="p-3">Password</th>
                            <th className="p-3">Role</th>
                            <th className="p-3 text-center">Tindakan</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 bg-white">
                          {users.map((usr) => (
                            <tr key={usr.id} className="hover:bg-slate-50/50">
                              {editingUserId === usr.id ? (
                                <>
                                  <td className="p-3">
                                    <input
                                      type="text"
                                      className="w-full p-1.5 text-xs font-bold border border-slate-200 rounded text-slate-800 bg-white focus:outline-none focus:border-indigo-500"
                                      value={editingUserName}
                                      onChange={(e) => setEditingUserName(e.target.value)}
                                    />
                                  </td>
                                  <td className="p-3">
                                    <input
                                      type="text"
                                      className="w-full p-1.5 text-xs font-mono border border-slate-200 rounded text-slate-800 bg-white focus:outline-none focus:border-indigo-500"
                                      value={editingUserUsername}
                                      onChange={(e) => setEditingUserUsername(e.target.value)}
                                    />
                                  </td>
                                  <td className="p-3">
                                    <input
                                      type="text"
                                      className="w-full p-1.5 text-xs font-mono border border-slate-200 rounded text-slate-800 bg-white focus:outline-none focus:border-indigo-500"
                                      value={editingUserPassword}
                                      onChange={(e) => setEditingUserPassword(e.target.value)}
                                      placeholder="Password"
                                    />
                                  </td>
                                  <td className="p-3">
                                    <select
                                      className="w-full p-1.5 text-xs border border-slate-200 rounded text-slate-800 bg-white focus:outline-none focus:border-indigo-500"
                                      value={editingUserRole}
                                      onChange={(e) => setEditingUserRole(e.target.value as UserRole)}
                                    >
                                      <option value="SUPERVISOR_KEUANGAN_UMUM">Supervisor Keuangan & Umum</option>
                                      <option value="STAF_ADMINISTRASI_UMUM">Staf Administrasi & Umum</option>
                                      <option value="DIREKTUR">Direktur</option>
                                      <option value="ADMINISTRATOR">Administrator</option>
                                    </select>
                                  </td>
                                  <td className="p-3 text-center">
                                    <div className="flex items-center justify-center gap-1.5">
                                      <button
                                        type="button"
                                        onClick={() => handleSaveEditUser(usr.id)}
                                        className="bg-emerald-500 hover:bg-emerald-600 text-white font-bold px-2 py-1 rounded text-[10px] cursor-pointer"
                                        title="Simpan perubahan"
                                      >
                                        Simpan
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => setEditingUserId(null)}
                                        className="bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold px-2 py-1 rounded text-[10px] cursor-pointer"
                                        title="Batal edit"
                                      >
                                        Batal
                                      </button>
                                    </div>
                                  </td>
                                </>
                              ) : (
                                <>
                                  <td className="p-3 font-semibold text-slate-800">{usr.nama}</td>
                                  <td className="p-3 font-mono text-slate-500">{usr.username}</td>
                                  <td className="p-3 font-mono text-indigo-600 font-bold">{usr.password || 'admin123'}</td>
                                  <td className="p-3">
                                    <span className={`px-2 py-1 rounded-sm text-[9px] font-bold tracking-tight inline-block ${
                                      usr.role === 'DIREKTUR' 
                                        ? 'bg-amber-100 text-amber-800' 
                                        : usr.role === 'SUPERVISOR_KEUANGAN_UMUM'
                                        ? 'bg-indigo-100 text-indigo-800'
                                        : usr.role === 'ADMINISTRATOR'
                                        ? 'bg-purple-100 text-purple-800'
                                        : 'bg-emerald-100 text-emerald-800'
                                    }`}>
                                      {usr.role === 'SUPERVISOR_KEUANGAN_UMUM'
                                        ? 'Supervisor Keuangan & Umum'
                                        : usr.role === 'STAF_ADMINISTRASI_UMUM'
                                        ? 'Staf Administrasi & Umum'
                                        : usr.role === 'DIREKTUR'
                                        ? 'Direktur'
                                        : usr.role === 'ADMINISTRATOR'
                                        ? 'Administrator'
                                        : usr.role}
                                    </span>
                                  </td>
                                  <td className="p-3 text-center">
                                    {isRoleAdmin ? (
                                      <div className="flex items-center justify-center gap-1.5 animate-fadeIn">
                                        <button
                                          type="button"
                                          onClick={() => {
                                            setEditingUserId(usr.id);
                                            setEditingUserName(usr.nama);
                                            setEditingUserUsername(usr.username);
                                            setEditingUserPassword(usr.password || 'admin123');
                                            setEditingUserRole(usr.role);
                                          }}
                                          className="text-indigo-600 hover:bg-indigo-50 p-1 rounded transition-colors cursor-pointer"
                                          title="Ubah info user ini"
                                        >
                                          <Edit className="h-3.5 w-3.5" />
                                        </button>
                                        <button
                                          type="button"
                                          onClick={() => handleDeleteUser(usr.id)}
                                          className="text-rose-600 hover:bg-rose-50 p-1 rounded transition-colors cursor-pointer"
                                          title="Hapus user"
                                        >
                                          <Trash2 className="h-3.5 w-3.5" />
                                        </button>
                                      </div>
                                    ) : (
                                      <span className="text-[10px] text-slate-450 italic">Hanya Baca</span>
                                    )}
                                  </td>
                                </>
                              )}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* SUB-MODULE: Backup & Restore Data */}
            {activeTab === 'backup-restore' && (
              <div className="space-y-4 animate-fadeIn" id="content-backup-restore">
                <div>
                  <h3 className="text-sm font-bold text-slate-800">Backup & Restore Database</h3>
                  <p className="text-xs text-slate-400 mt-1">Ekspor seluruh database lokal program ke file JSON untuk mengamankan data atau muat ulang data cadangan.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Left option: Export/Backup */}
                  <div className="border border-slate-200/80 rounded-xl p-5 space-y-3.5 bg-slate-50/50">
                    <div className="space-y-1">
                      <h4 className="text-xs font-bold text-indigo-900 block uppercase">Ekspor / Unduh Backup</h4>
                      <p className="text-[11px] text-slate-500 leading-relaxed">
                        Lakukan backup rutin. Seluruh data (rekanan pembayaran, kuitansi invoice tagihan, tracking log pelacakan, notifikasi, dan daftar setup user) akan diekspor sebagai file JSON enkripsi terikat.
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={handleDownloadBackup}
                      className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs px-4 py-2.5 rounded-lg inline-flex items-center gap-1.5 cursor-pointer shadow-xs transition-colors"
                    >
                      <FileText className="h-4 w-4" />
                      Unduh Berkas Backup (.json)
                    </button>
                  </div>

                  {/* Right option: Import/Restore */}
                  <div className="border border-slate-200/80 rounded-xl p-5 space-y-3.5 bg-slate-50/50">
                    <div className="space-y-1">
                      <h4 className="text-xs font-bold text-emerald-900 block uppercase">Unggah / Import Restore</h4>
                      <p className="text-[11px] text-slate-500 leading-relaxed">
                        Pilih file backup (.json) yang sebelumnya Anda unduh dari sistem ini untuk memulihkan seluruh riwayat penagihan piutang dan posisi berkas fisik yang disimpan.
                      </p>
                    </div>

                    <div className="relative">
                      <input
                        type="file"
                        accept=".json"
                        onChange={handleUploadBackupFile}
                        className="text-xs w-full text-slate-500 file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-[11px] file:font-semibold file:bg-slate-800 file:text-white hover:file:bg-slate-900 cursor-pointer"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* SUB-MODULE: Notification config */}
            {activeTab === 'notification' && (
              <div className="space-y-4 animate-fadeIn" id="content-notification">
                <div>
                  <h3 className="text-sm font-bold text-slate-800">Jadwal Notifikasi Peringatan Terintegrasi</h3>
                  <p className="text-xs text-slate-400 mt-1">Sistem akan secara otomatis mendeteksi Tanggal Pembayaran rekanan dan menghitung +3 hari deadline tagihan.</p>
                </div>

                <div className="space-y-3 pt-2">
                  <div className="flex items-center justify-between p-3.5 bg-slate-50 rounded-lg border border-slate-200">
                    <div className="text-xs">
                      <strong className="text-slate-800 block">Peringatan Deadline H-1 (Sebelum Batas H+3 Terlewat)</strong>
                      <span className="text-slate-400">Kirim peringatan ke Staf Admin jika tagihan belum diinput H-1 dari masa tenggat.</span>
                    </div>
                    <input
                      type="checkbox"
                      className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 rounded"
                      checked={notifDeadlineH1}
                      onChange={(e) => setNotifDeadlineH1(e.target.checked)}
                    />
                  </div>

                  <div className="flex items-center justify-between p-3.5 bg-slate-50 rounded-lg border border-slate-200">
                    <div className="text-xs">
                      <strong className="text-slate-800 block">Peringatan Hari H Deadline Lewat (Massa Tenggat Habis)</strong>
                      <span className="text-slate-400">Kirim alert status darurat merah di dashboard utama jika tenggat 3 hari lewat total.</span>
                    </div>
                    <input
                      type="checkbox"
                      className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 rounded"
                      checked={notifDeadlineH3}
                      onChange={(e) => setNotifDeadlineH3(e.target.checked)}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* SUB-MODULE: Cash & Bank Accounts Config */}
            {activeTab === 'cash-accounts' && (
              <div className="space-y-4 animate-fadeIn" id="content-cash-accounts">
                <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-extrabold text-slate-800">Pengaturan Akun Kas &amp; Rekening Perusahaan</h3>
                    <p className="text-xs text-slate-400 mt-0.5">Tambah, ubah, atau hapus rekening bank dan kas fisik utama yang dipantau dalam menu Likuiditas Kas.</p>
                  </div>
                  <span className="text-[10px] text-indigo-700 bg-indigo-50 font-black px-2.5 py-1 rounded-full uppercase tracking-wider">
                    Total: {cashAccountsList.length} Akun
                  </span>
                </div>

                {/* Form Tambah Akun Baru */}
                <div className="bg-slate-50 border border-slate-200/60 p-4.5 rounded-xl space-y-4">
                  <h4 className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                    <Plus className="h-4 w-4 text-emerald-600" />
                    Tambah Akun Baru
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-3 text-xs">
                    <div className="md:col-span-3 space-y-1">
                      <label className="font-semibold text-slate-500">Tipe Akun</label>
                      <select
                        className="w-full p-2 border border-slate-200 rounded-lg bg-white"
                        value={newAccountTipe}
                        onChange={(e) => setNewAccountTipe(e.target.value as 'Kas' | 'Bank')}
                      >
                        <option value="Bank">Bank (Rekening)</option>
                        <option value="Kas">Kas (Fisik Cash / Brankas)</option>
                      </select>
                    </div>

                    <div className="md:col-span-5 space-y-1">
                      <label className="font-semibold text-slate-500">Nama Akun / Bank</label>
                      <input
                        type="text"
                        className="w-full p-2 border border-slate-200 rounded-lg bg-white"
                        placeholder="Contoh: Bank BCA, Kas Kecil, Bank Mandiri Ops"
                        value={newAccountNama}
                        onChange={(e) => setNewAccountNama(e.target.value)}
                      />
                    </div>

                    <div className="md:col-span-4 space-y-1">
                      <label className="font-semibold text-slate-500">
                        {newAccountTipe === 'Bank' ? 'Nomor Rekening' : 'Nomor Rekening (Opsional)'}
                      </label>
                      <input
                        type="text"
                        className="w-full p-2 border border-slate-200 rounded-lg bg-white font-mono"
                        placeholder={newAccountTipe === 'Bank' ? '822391...' : '-'}
                        disabled={newAccountTipe === 'Kas'}
                        value={newAccountNoRek}
                        onChange={(e) => setNewAccountNoRek(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="flex justify-end pt-1">
                    <button
                      type="button"
                      onClick={handleAddAccount}
                      className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs px-4 py-2 rounded-lg transition-colors cursor-pointer flex items-center gap-1.5"
                    >
                      <Plus className="h-3.5 w-3.5" />
                      Tambah Akun ke Setelan
                    </button>
                  </div>
                </div>

                {/* Grid List Akun Saat Ini */}
                <div className="space-y-3">
                  <span className="text-[11px] font-black tracking-wider text-slate-500 uppercase block">Daftar Akun yang Aktif</span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {cashAccountsList.map((acc, index) => (
                      <div key={acc.id} className="p-4 bg-white border border-slate-200 rounded-xl shadow-2xs space-y-3 relative group overflow-hidden">
                        {editingAccountIndex === index ? (
                          /* Inline Edit Form */
                          <div className="space-y-3 text-xs text-slate-700">
                            <div className="space-y-1">
                              <label className="font-bold text-slate-550 block">Nama Akun/Bank</label>
                              <input
                                type="text"
                                className="w-full p-2 border border-slate-200 rounded"
                                value={editingAccountNama}
                                onChange={(e) => setEditingAccountNama(e.target.value)}
                              />
                            </div>

                            <div className="grid grid-cols-2 gap-2">
                              <div className="space-y-1">
                                <label className="font-bold text-slate-550 block">Tipe</label>
                                <select
                                  className="w-full p-2 border border-slate-200 rounded bg-white"
                                  value={editingAccountTipe}
                                  onChange={(e) => setEditingAccountTipe(e.target.value as 'Kas' | 'Bank')}
                                >
                                  <option value="Bank">Bank</option>
                                  <option value="Kas">Kas</option>
                                </select>
                              </div>
                              <div className="space-y-1">
                                <label className="font-bold text-slate-550 block">No. Rekening</label>
                                <input
                                  type="text"
                                  className="w-full p-2 border border-slate-200 rounded font-mono"
                                  disabled={editingAccountTipe === 'Kas'}
                                  value={editingAccountNoRek}
                                  onChange={(e) => setEditingAccountNoRek(e.target.value)}
                                />
                              </div>
                            </div>

                            <div className="flex justify-end gap-1.5 pt-1.5 border-t border-slate-100">
                              <button
                                type="button"
                                onClick={() => setEditingAccountIndex(null)}
                                className="px-2.5 py-1.5 border border-slate-200 text-[10px] font-bold rounded text-slate-500"
                              >
                                Batal
                              </button>
                              <button
                                type="button"
                                onClick={() => handleSaveEditAccount(index)}
                                className="px-3 py-1.5 bg-indigo-600 text-white [box-shadow:none] font-bold text-[10px] rounded"
                              >
                                Simpan
                              </button>
                            </div>
                          </div>
                        ) : (
                          /* Standard View */
                          <div className="flex items-start justify-between">
                            <div className="flex items-center gap-3">
                              <div className={`h-10 w-10 rounded-xl flex items-center justify-center shrink-0 ${
                                acc.tipe === 'Kas' ? 'bg-amber-50 text-amber-600' : 'bg-emerald-50 text-emerald-600'
                              }`}>
                                <Building className="h-5 w-5" />
                              </div>
                              
                              <div className="space-y-0.5">
                                <span className="text-xs font-extrabold text-slate-800 block leading-tight">{acc.nama}</span>
                                <div className="flex items-center gap-2">
                                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded uppercase ${
                                    acc.tipe === 'Kas' ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'
                                  }`}>
                                    {acc.tipe}
                                  </span>
                                  {acc.nomorRekening && (
                                    <span className="text-[10px] font-semibold text-slate-400 font-mono tracking-wider">
                                      {acc.nomorRekening}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>

                            <div className="flex gap-1 shrink-0">
                              <button
                                type="button"
                                onClick={() => handleStartEditAccount(index)}
                                className="p-1 px-2 border border-slate-100 hover:border-slate-300 hover:bg-slate-50 rounded text-slate-500 transition-all cursor-pointer"
                                title="Ubah informasi"
                              >
                                <Edit className="h-3.5 w-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteAccount(acc.id)}
                                className="p-1 px-2 border border-red-50 hover:bg-red-55 text-red-500 rounded transition-all cursor-pointer"
                                title="Hapus"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'branding' && (
              <div className="animate-fadeIn" id="content-branding">
                <BrandingSettings 
                  settings={settings}
                  onUpdateSettings={onUpdateSettings}
                />
              </div>
            )}

            {/* SUB-MODULE: System developers */}
            {activeTab === 'system' && (
              <div className="space-y-4 animate-fadeIn" id="content-system">
                <div>
                  <h3 className="text-sm font-bold text-slate-800">Opsi Pengembang & Pembersihan Data</h3>
                  <p className="text-xs text-slate-400 mt-1">Dipergunakan untuk melakukan pengaturan dan pembersihan data operasional sistem.</p>
                </div>

                {/* Option 1: Empty All Transactions */}
                <div className="p-4 bg-indigo-50/55 border border-indigo-100 rounded-xl space-y-3">
                  <h4 className="text-xs font-bold text-indigo-800">Kosongkan Seluruh Data Transaksi (Mulai dari Nol/Bersih)</h4>
                  <p className="text-slate-600 text-xs leading-relaxed">
                    Tindakan ini akan <strong>menghapus semua</strong> daftar pembayaran, invoice tagihan, dan log pelacakan fisik secara menyeluruh. Sangat disarankan jika Anda siap memasukkan data asli/riil perusahaan agar tidak tercampur dengan data demonstrasi bawaan. User login yang ada saat ini akan tetap dipertahankan.
                  </p>
                  
                  <button
                    type="button"
                    onClick={() => {
                      if (window.confirm('Apakah Anda yakin ingin menghapus seluruh data transaksi asli & demonstrasi? Tindakan ini tidak dapat dibatalkan.')) {
                        onClearAllData();
                      }
                    }}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold px-4 py-2 rounded-lg flex items-center gap-1.5 cursor-pointer shadow-sm transition-all"
                    id="btn-clear-all-transactions"
                  >
                    <Trash2 className="h-4 w-4 text-white/90" />
                    Kosongkan Seluruh Data Transaksi
                  </button>
                </div>

                {/* Option 2: Reset Factory Settings (with Dummy Data) */}
                <div className="p-4 bg-rose-50 border border-rose-100 rounded-xl space-y-3">
                  <h4 className="text-xs font-bold text-rose-800">Kembalikan Data Contoh Bawaan (Setelan Pabrik)</h4>
                  <p className="text-rose-700 text-xs">
                    Tindakan ini akan menghapus data yang Anda buat sendiri dan memuat kembali semua data demonstrasi awal (seperti transaksi PT Sinergi Mandiri Utama). Gunakan ini jika Anda ingin melakukan demo sistem kembali.
                  </p>
                  
                  <button
                    type="button"
                    onClick={() => {
                      if (window.confirm('Apakah Anda yakin ingin menghapus seluruh data kustom dan memuat ulang data default pabrik?')) {
                        onResetData();
                      }
                    }}
                    className="bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold px-4 py-2 rounded-lg flex items-center gap-1.5 cursor-pointer shadow-sm transition-all"
                    id="btn-reset-database"
                  >
                    <RefreshCcw className="h-4 w-4 animate-spin-slow" />
                    Reset & Muat Contoh Data Bawaan
                  </button>
                </div>
              </div>
            )}

            {activeTab === 'changelog' && (
              <div className="space-y-6 animate-fadeIn" id="content-changelog">
                <div>
                  <h3 className="text-sm font-bold text-slate-800">Riwayat Versi &amp; Log Perubahan Sistem</h3>
                  <p className="text-xs text-slate-400 mt-1">Simak perkembangan historis dari sistem pelacakan piutang Anda.</p>
                </div>

                <div className="relative border-l-2 border-slate-100 pl-4 ml-2 space-y-6">
                  {/* Version v1.4.0 */}
                  <div className="relative group">
                    <div className="absolute -left-[21px] top-1 h-2.5 w-2.5 rounded-full bg-indigo-600 ring-4 ring-white" />
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-black text-slate-800">Versi v1.4.0 (Tinggi Keamanan)</span>
                        <span className="text-[9px] bg-indigo-50 text-indigo-600 font-bold px-1.5 py-0.5 rounded">Rilis Terbaru</span>
                      </div>
                      <span className="text-[10px] text-slate-400 block mt-0.5">31 Mei 2026</span>
                      <ul className="list-disc pl-4 text-xs text-slate-600 mt-2 space-y-1">
                        <li><strong>Inisialisasi Onboarding Tanpa Reset Sesi:</strong> Menghapus prosedur auto-reset menggunakan data dummy saat deploy ulang atau sinkronisasi ke Github di hosting target.</li>
                        <li><strong>Firebase Authentication (Google Sign-In):</strong> Mengintegrasikan Google Sign-In pop-up secara langsung demi kemudahan verifikasi admin dan operator.</li>
                        <li><strong>Dapur Onboarding Mandiri:</strong> Ketika database kosong, sistem kini memunculkan halaman persetujuan bersih sehingga admin pertama dapat dilaunching tanpa data simulasi.</li>
                      </ul>
                    </div>
                  </div>

                  {/* Version / History 1.3.0 */}
                  <div className="relative group">
                    <div className="absolute -left-[21px] top-1 h-2.5 w-2.5 rounded-full bg-slate-200 ring-4 ring-white" />
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-705">Versi v1.3.0</span>
                      </div>
                      <span className="text-[10px] text-slate-400 block mt-0.5">15 Mei 2026</span>
                      <ul className="list-disc pl-4 text-xs text-slate-600 mt-1 space-y-1">
                        <li><strong>Kas &amp; Rekening Multi-Akun:</strong> Dukungan penuh pencatatan mutasi kas utama korporasi, Bank BCA, Bank Mandiri, dan Bank BNI secara taktis.</li>
                        <li><strong>PWA &amp; Logo Kustomization:</strong> Penambahan antarmuka unggah logo serta setting nama PWA (Progressive Web App) internal perusahaan.</li>
                      </ul>
                    </div>
                  </div>

                  {/* Version / History 1.2.0 */}
                  <div className="relative group">
                    <div className="absolute -left-[21px] top-1 h-2.5 w-2.5 rounded-full bg-slate-200 ring-4 ring-white" />
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-705">Versi v1.2.0</span>
                      </div>
                      <span className="text-[10px] text-slate-400 block mt-0.5">28 April 2026</span>
                      <ul className="list-disc pl-4 text-xs text-slate-600 mt-1 space-y-1">
                        <li><strong>Manajemen Rekanan (Vendoring):</strong> Tambah-hapus dan edit nama rekanan kustom langsung dari dashboard Pengaturan.</li>
                        <li><strong>Peta Posisi Pelacakan (Tracking):</strong> Kustomisasi 5 tingkat tahapan pelacakan piutang sesuai Standard Operating Procedure (SOP) internal Anda.</li>
                      </ul>
                    </div>
                  </div>

                  {/* Version / History 1.1.0 */}
                  <div className="relative group">
                    <div className="absolute -left-[21px] top-1 h-2.5 w-2.5 rounded-full bg-slate-200 ring-4 ring-white" />
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-705">Versi v1.1.0</span>
                      </div>
                      <span className="text-[10px] text-slate-400 block mt-0.5">10 April 2026</span>
                      <ul className="list-disc pl-4 text-xs text-slate-600 mt-1 space-y-1">
                        <li><strong>Dashboard Aging &amp; Umur Piutang:</strong> Diagram lingkaran interaktif dan tabel pengawasan piutang berumur (0-30, 31-60, 61-90, &gt;90 hari) dengan rekomendasi tindakan taktis otomatis.</li>
                        <li><strong>Notifikasi Peringatan Terintegrasi:</strong> Pemberitahuan sistem untuk invoice dengan tenggat waktu kurang dari 3 hari.</li>
                      </ul>
                    </div>
                  </div>

                  {/* Version / History 1.0.0 */}
                  <div className="relative group">
                    <div className="absolute -left-[21px] top-1 h-2.5 w-2.5 rounded-full bg-slate-300 ring-4 ring-white" />
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-705">Versi v1.0.0 (Rilis Dasar)</span>
                      </div>
                      <span className="text-[10px] text-slate-400 block mt-0.5">20 Maret 2026</span>
                      <ul className="list-disc pl-4 text-xs text-slate-600 mt-1 space-y-1">
                        <li><strong>Modul Pelacak Piutang (Core):</strong> Inisiasi draf pembayaran rekanan, invoice tagihan, dan rekaman log progres fisik berkas tagihan.</li>
                        <li><strong>Simulasi 3 Role Pengguna:</strong> supervisor_keu_umum, staf_admin_umum, dan direktur untuk rilis otorisasi.</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Save Buttons Row */}
            {(activeTab === 'profile' || activeTab === 'tax' || activeTab === 'notification') && (
              <div className="flex justify-end gap-3 border-t border-slate-100 pt-4">
                <button
                  type="submit"
                  className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs px-5 py-2.5 rounded-lg shadow-sm hover:shadow transition-all cursor-pointer"
                  id="btn-save-settings"
                >
                  Simpan Perubahan Setelan
                </button>
              </div>
            )}

          </form>
        </div>

      </div>

    </div>
  );
};
