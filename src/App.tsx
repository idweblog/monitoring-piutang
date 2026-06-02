/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  Building2, 
  Bell, 
  Layers, 
  Settings as SettingsIcon, 
  ClipboardList, 
  FileText, 
  User, 
  Sparkles,
  CheckCircle,
  Clock,
  X,
  Plus,
  Lock,
  LogIn,
  LogOut,
  ShieldCheck,
  KeyRound,
  Wallet
} from 'lucide-react';

import { Payment, Invoice, InvoiceLog, AppNotification, CompanySettings, UserRole, AppUser, DailyCashBalance } from './types';
import { 
  DEFAULT_SETTINGS, 
  INITIAL_PAYMENTS, 
  INITIAL_INVOICES, 
  INITIAL_LOGS, 
  INITIAL_NOTIFICATIONS,
  INITIAL_USERS,
  INITIAL_CASH_BALANCES
} from './mockData';

import { db, auth, handleFirestoreError, OperationType } from './firebase';
import { collection, doc, setDoc, deleteDoc, onSnapshot, getDocs } from 'firebase/firestore';
import { signInWithPopup, GoogleAuthProvider } from 'firebase/auth';

// Subcomponents
import { Dashboard } from './components/Dashboard';
import { PaymentsModule } from './components/PaymentsModule';
import { InvoicesModule } from './components/InvoicesModule';
import { SettingsModule } from './components/SettingsModule';
import { NotificationsPanel } from './components/NotificationsPanel';
import { CashModule } from './components/CashModule';

export default function App() {
  // Navigation & Role states
  const [activeTab, setActiveTab] = useState<'dashboard' | 'payments' | 'invoices' | 'cash' | 'settings'>('dashboard');
  const [userRole, setUserRole] = useState<UserRole>('SUPERVISOR_KEUANGAN_UMUM');

  // Core Persistent State (Synchronized with Firestore)
  const [payments, setPayments] = useState<Payment[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [logs, setLogs] = useState<InvoiceLog[]>([]);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [settings, setSettings] = useState<CompanySettings>(DEFAULT_SETTINGS);
  const [users, setUsers] = useState<AppUser[]>([]);
  const [cashBalances, setCashBalances] = useState<DailyCashBalance[]>([]);

  const [dbLoading, setDbLoading] = useState(true);
  const [showNotifDrawer, setShowNotifDrawer] = useState(false);
  const [activeFilterId, setActiveFilterId] = useState<string | undefined>(undefined);

  // Authentication States (Production Ready)
  const [currentLoggedInUser, setCurrentLoggedInUser] = useState<AppUser | null>(null);
  const [loginUsername, setLoginUsername] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [showCredentialsHelp, setShowCredentialsHelp] = useState(false);

  // Onboarding States for Empty Database
  const [isOnboardingSeeding, setIsOnboardingSeeding] = useState(false);
  const [newAdminNama, setNewAdminNama] = useState('');
  const [newAdminUsername, setNewAdminUsername] = useState('');
  const [newAdminPassword, setNewAdminPassword] = useState('');
  const [onboardingError, setOnboardingError] = useState('');

  const handleCreateFirstAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    setOnboardingError('');
    if (!newAdminNama.trim() || !newAdminUsername.trim() || !newAdminPassword.trim()) {
      setOnboardingError('Harap isi semua kolom pendaftaran dengan lengkap!');
      return;
    }
    if (newAdminPassword.trim().length < 4) {
      setOnboardingError('Kata Sandi minimal harus terdiri dari 4 karakter!');
      return;
    }
    setIsOnboardingSeeding(true);
    try {
      // 1. Create first admin user
      const adminId = `usr-${Date.now()}`;
      const firstAdmin: AppUser = {
        id: adminId,
        nama: newAdminNama.trim(),
        username: newAdminUsername.trim(),
        role: 'ADMINISTRATOR',
        password: newAdminPassword.trim()
      };
      await setDoc(doc(db, 'users', adminId), firstAdmin);

      // 2. Setup standard clean settings
      await setDoc(doc(db, 'settings', 'general'), {
        ...DEFAULT_SETTINGS,
        namaPerusahaan: 'Nama Perusahaan Anda',
        alamat: 'Alamat Kantor Utama',
        npwp: '00.000.000.0-000.000'
      });

      alert('Akun Administrator Pertama sukses dibuat! Silakan masuk dengan kredensial tersebut.');
      
      setNewAdminNama('');
      setNewAdminUsername('');
      setNewAdminPassword('');
    } catch (err) {
      console.error('Failed creating first user', err);
      setOnboardingError('Gagal memproses pendaftaran: ' + (err instanceof Error ? err.message : String(err)));
    } finally {
      setIsOnboardingSeeding(false);
    }
  };

  // Synchronize chosen corporate logo favicon and PWA manifest dynamically
  useEffect(() => {
    const logoId = settings.activeLogoId || 'logo-growth';
    const logoFile = logoId === 'logo-growth' ? '/logo-growth.svg' : logoId === 'logo-vault' ? '/logo-vault.svg' : '/logo-minimalist.svg';
    
    // Favicon Link update
    const faviconLink = document.getElementById('favicon-link') as HTMLLinkElement;
    if (faviconLink) {
      faviconLink.href = logoFile;
    }

    // Apple touch icon update
    const appleIcon = document.getElementById('apple-touch-icon') as HTMLLinkElement;
    if (appleIcon) {
      appleIcon.href = logoFile;
    }

    // Dynamic manifest generation based on active custom settings
    const activeName = settings.pwaName || `Monitoring Piutang ${settings.namaPerusahaan || ''}`.trim() || 'Monitoring Piutang Rekanan';
    const activeShortName = settings.pwaShortName || settings.namaPerusahaan || 'Piutang';

    const customManifestObj = {
      "short_name": activeShortName,
      "name": activeName,
      "description": `Sistem monitoring piutang dan rekap kas untuk ${settings.namaPerusahaan || 'perusahaan'}.`,
      "icons": [
        {
          "src": logoFile,
          "type": "image/svg+xml",
          "sizes": "192x192",
          "purpose": "any"
        },
        {
          "src": logoFile,
          "type": "image/svg+xml",
          "sizes": "512x512",
          "purpose": "any"
        },
        {
          "src": logoFile,
          "type": "image/svg+xml",
          "sizes": "192x192",
          "purpose": "maskable"
        }
      ],
      "start_url": "/",
      "background_color": "#0f172a",
      "theme_color": "#4f46e5",
      "display": "standalone",
      "orientation": "portrait"
    };

    const manifestStr = JSON.stringify(customManifestObj, null, 2);
    const blob = new Blob([manifestStr], { type: 'application/json' });
    const manifestUrl = URL.createObjectURL(blob);

    const manifestLink = document.getElementById('pwa-manifest-link') as HTMLLinkElement;
    if (manifestLink) {
      const oldUrl = manifestLink.getAttribute('href');
      if (oldUrl && oldUrl.startsWith('blob:')) {
        try {
          URL.revokeObjectURL(oldUrl);
        } catch (e) {
          console.error(e);
        }
      }
      manifestLink.href = manifestUrl;
    }

    return () => {
      if (manifestUrl) {
        try {
          URL.revokeObjectURL(manifestUrl);
        } catch (e) {
          console.error(e);
        }
      }
    };
  }, [settings.activeLogoId, settings.pwaName, settings.pwaShortName, settings.namaPerusahaan]);

  // Helper: Seed initial mock data if remote database is empty
  const initFirestoreSeed = async () => {
    console.log('Seeding initial data into Firestore...');
    try {
      // 1. Seed Company Settings
      await setDoc(doc(db, 'settings', 'general'), DEFAULT_SETTINGS);

      // 2. Seed Users
      for (const u of INITIAL_USERS) {
        await setDoc(doc(db, 'users', u.id), u);
      }

      // 3. Seed Payments
      for (const p of INITIAL_PAYMENTS) {
        await setDoc(doc(db, 'payments', p.id), p);
      }

      // 4. Seed Invoices
      for (const inv of INITIAL_INVOICES) {
        await setDoc(doc(db, 'invoices', inv.id), inv);
      }

      // 5. Seed Logs
      for (const lg of INITIAL_LOGS) {
        await setDoc(doc(db, 'logs', lg.id), lg);
      }

      // 6. Seed Notifications
      for (const n of INITIAL_NOTIFICATIONS) {
        await setDoc(doc(db, 'notifications', n.id), n);
      }

      // 7. Seed Cash Balances
      for (const cb of INITIAL_CASH_BALANCES) {
        await setDoc(doc(db, 'cashBalances', cb.id), cb);
      }
      console.log('Seeding completed successfully.');
    } catch (e) {
      console.error('Error seeding initial Firestore data:', e);
    }
  };

  // Real-time Firestore Subscriptions
  useEffect(() => {
    // 1. Subscribe to Users
    const unsubUsers = onSnapshot(collection(db, 'users'), (snapshot) => {
      const usersList: AppUser[] = [];
      snapshot.forEach(docSnap => {
        usersList.push(docSnap.data() as AppUser);
      });
      setUsers(usersList);
    }, (err) => handleFirestoreError(err, OperationType.LIST, 'users'));

    // 2. Subscribe to Payments
    const unsubPayments = onSnapshot(collection(db, 'payments'), (snapshot) => {
      const payList: Payment[] = [];
      snapshot.forEach(docSnap => {
        payList.push(docSnap.data() as Payment);
      });
      payList.sort((a, b) => b.id.localeCompare(a.id));
      setPayments(payList);
    }, (err) => handleFirestoreError(err, OperationType.LIST, 'payments'));

    // 3. Subscribe to Invoices
    const unsubInvoices = onSnapshot(collection(db, 'invoices'), (snapshot) => {
      const invList: Invoice[] = [];
      snapshot.forEach(docSnap => {
        invList.push(docSnap.data() as Invoice);
      });
      invList.sort((a, b) => b.id.localeCompare(a.id));
      setInvoices(invList);
    }, (err) => handleFirestoreError(err, OperationType.LIST, 'invoices'));

    // 4. Subscribe to Logs
    const unsubLogs = onSnapshot(collection(db, 'logs'), (snapshot) => {
      const logList: InvoiceLog[] = [];
      snapshot.forEach(docSnap => {
        logList.push(docSnap.data() as InvoiceLog);
      });
      logList.sort((a, b) => b.id.localeCompare(a.id));
      setLogs(logList);
    }, (err) => handleFirestoreError(err, OperationType.LIST, 'logs'));

    // 5. Subscribe to Notifications
    const unsubNotifs = onSnapshot(collection(db, 'notifications'), (snapshot) => {
      const notifList: AppNotification[] = [];
      snapshot.forEach(docSnap => {
        notifList.push(docSnap.data() as AppNotification);
      });
      notifList.sort((a, b) => b.id.localeCompare(a.id));
      setNotifications(notifList);
    }, (err) => handleFirestoreError(err, OperationType.LIST, 'notifications'));

    // 6. Subscribe to Settings
    const unsubSettings = onSnapshot(collection(db, 'settings'), (snapshot) => {
      let companySettings = DEFAULT_SETTINGS;
      snapshot.forEach(docSnap => {
        if (docSnap.id === 'general') {
          companySettings = docSnap.data() as CompanySettings;
        }
      });
      setSettings(companySettings);
    }, (err) => handleFirestoreError(err, OperationType.LIST, 'settings'));

    // 7. Subscribe to Cash Balances
    const unsubCash = onSnapshot(collection(db, 'cashBalances'), (snapshot) => {
      if (snapshot.empty && cashBalances.length === 0) {
        // Fallback seed will happen via users hook, but we can secure loading here
      }
      const cashList: DailyCashBalance[] = [];
      snapshot.forEach(docSnap => {
        cashList.push(docSnap.data() as DailyCashBalance);
      });
      cashList.sort((a, b) => a.tanggal.localeCompare(b.tanggal));
      setCashBalances(cashList);
      setDbLoading(false); // Make sure loading is disabled after settings and cash are subscribed!
    }, (err) => handleFirestoreError(err, OperationType.LIST, 'cashBalances'));

    // Load active logged-in session representation (survives refreshes only)
    const storedLoggedInUser = localStorage.getItem('monitoring_logged_in_user');
    if (storedLoggedInUser) {
      try {
        const parsedLoggedIn = JSON.parse(storedLoggedInUser);
        setCurrentLoggedInUser(parsedLoggedIn);
        setUserRole(parsedLoggedIn.role);
      } catch (e) {
        console.error('Failed restoring session', e);
      }
    }

    return () => {
      unsubUsers();
      unsubPayments();
      unsubInvoices();
      unsubLogs();
      unsubNotifs();
      unsubSettings();
      unsubCash();
    };
  }, []);

  // Sync current logged-in user changes if edited in system settings or if deleted
  useEffect(() => {
    if (currentLoggedInUser && users.length > 0) {
      const stillExists = users.find(u => u.id === currentLoggedInUser.id);
      if (stillExists) {
        if (
          stillExists.nama !== currentLoggedInUser.nama || 
          stillExists.username !== currentLoggedInUser.username || 
          stillExists.role !== currentLoggedInUser.role
        ) {
          setCurrentLoggedInUser(stillExists);
          setUserRole(stillExists.role);
          localStorage.setItem('monitoring_logged_in_user', JSON.stringify(stillExists));
          localStorage.setItem('monitoring_role', stillExists.role);
        }
      } else {
        // User was deleted from Settings panel! Trigger logout
        handleLogout();
      }
    }
  }, [users]);

  // Authentication Handlers
  const handleGoogleLogin = async () => {
    setLoginError('');
    try {
      const provider = new GoogleAuthProvider();
      const credentials = await signInWithPopup(auth, provider);
      const user = credentials.user;

      if (!user.email) {
        setLoginError('ID email Google tidak valid!');
        return;
      }

      const email = user.email.toLowerCase();
      const emailPrefix = email.split('@')[0];

      let foundUser = users.find(u => 
        u.username.toLowerCase() === email || 
        u.username.toLowerCase() === emailPrefix
      );

      if (!foundUser) {
        // If not registered, auto-provision profile as STAF_ADMINISTRASI_UMUM or ADMINISTRATOR (if db is empty)
        const isAdminSetup = users.length === 0;
        const newUid = `usr-google-${Date.now()}`;
        const newProvisionedUser: AppUser = {
          id: newUid,
          nama: user.displayName || 'Operator Google',
          username: email,
          role: isAdminSetup ? 'ADMINISTRATOR' : 'STAF_ADMINISTRASI_UMUM'
        };

        await setDoc(doc(db, 'users', newUid), newProvisionedUser);
        foundUser = newProvisionedUser;
        alert(`Selamat datang! Akun Anda baru saja terdaftar via Google Sign-In dengan hak akses bawaan: ${newProvisionedUser.role}.`);
      }

      setCurrentLoggedInUser(foundUser);
      setUserRole(foundUser.role);
      localStorage.setItem('monitoring_logged_in_user', JSON.stringify(foundUser));
      localStorage.setItem('monitoring_role', foundUser.role);
      setLoginUsername('');
      setLoginPassword('');
    } catch (err) {
      console.error('Google Sign In Error', err);
      // Show cleaner error message instead of complex JSON strings
      const message = err instanceof Error ? err.message : String(err);
      if (message.includes('auth/popup-blocked')) {
        setLoginError('Popup diblokir browser! Harap izinkan popup untuk masuk dengan Google.');
      } else {
        setLoginError('Gagal masuk via Google: ' + message);
      }
    }
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');

    const trimmedUsername = loginUsername.trim();
    if (!trimmedUsername) {
      setLoginError('Silakan masukkan Username Anda!');
      return;
    }

    const trimmedPassword = loginPassword.trim();
    if (!trimmedPassword) {
      setLoginError('Silakan masukkan Kata Sandi (Password) Anda!');
      return;
    }

    // Find user in the database
    const foundUser = users.find(u => u.username.toLowerCase() === trimmedUsername.toLowerCase());

    if (foundUser) {
      const dbPassword = foundUser.password || 'admin123';
      if (dbPassword !== trimmedPassword) {
        setLoginError('Kata sandi (Password) yang Anda masukkan salah! Silakan periksa kembali.');
        return;
      }

      setCurrentLoggedInUser(foundUser);
      setUserRole(foundUser.role);
      localStorage.setItem('monitoring_logged_in_user', JSON.stringify(foundUser));
      localStorage.setItem('monitoring_role', foundUser.role);
      setLoginUsername('');
      setLoginPassword('');
    } else {
      setLoginError('Username tidak ditemukan! Pastikan ejaan benar atau daftar melalui pihak administrator terkait.');
    }
  };

  const handleLogout = async () => {
    try {
      await auth.signOut();
    } catch (err) {
      console.error('Firebase Auth Sign Out Error', err);
    }
    setCurrentLoggedInUser(null);
    localStorage.removeItem('monitoring_logged_in_user');
    localStorage.removeItem('monitoring_role');
    setActiveTab('dashboard');
    setActiveFilterId(undefined);
  };

  // State manipulation triggers (Persisting directly to Firestore)
  const handleAddNewPayment = async (newPay: Omit<Payment, 'id' | 'hasInvoice'>) => {
    const payId = `pay-${Date.now()}`;
    const freshPayment: Payment = {
      ...newPay,
      id: payId,
      hasInvoice: false,
    };

    const newNotif: AppNotification = {
      id: `notif-${Date.now()}`,
      judul: 'Persetujuan Pembayaran Baru Terbuka',
      deskripsi: `Daftar pembayaran untuk ${freshPayment.rekanan} senilai Rp ${freshPayment.jumlahBayar.toLocaleString('id-ID')} telah diajukan. Butuh persetujuan Direktur.`,
      tanggal: '2026-05-28',
      tipe: 'approval',
      read: false,
      linkTo: { module: 'payments', id: freshPayment.id },
    };

    try {
      await setDoc(doc(db, 'payments', payId), freshPayment);
      await setDoc(doc(db, 'notifications', newNotif.id), newNotif);
      alert('Sukses menyimpan draf pembayaran! Notifikasi persetujuan berhasil diteruskan ke Direktur.');
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `payments/${payId}`);
    }
  };

  const handleApprovePayment = async (paymentId: string) => {
    const approvedPay = payments.find(p => p.id === paymentId);
    if (!approvedPay) return;

    const updatedPayment = {
      ...approvedPay,
      status: 'Aktif' as const,
      approvedBy: userRole === 'DIREKTUR' ? 'Direktur Utama (Verified)' : 'Administrator System',
      tanggalApprove: '2026-05-28',
    };

    const newNotif: AppNotification = {
      id: `notif-${Date.now()}`,
      judul: 'Rencana Pembayaran Disetujui',
      deskripsi: `Rencana pembayaran rekanan ${approvedPay.rekanan} senilai Rp ${approvedPay.jumlahBayar.toLocaleString('id-ID')} telah disetujui Direktur. Staf Admin sekarang bisa menerbitkan tagihan.`,
      tanggal: '2026-05-28',
      tipe: 'system',
      read: false,
      linkTo: { module: 'invoices', id: approvedPay.id }, // links to create invoice
    };

    try {
      await setDoc(doc(db, 'payments', paymentId), updatedPayment);
      await setDoc(doc(db, 'notifications', newNotif.id), newNotif);
      alert(`Rencana pembayaran ${approvedPay.rekanan} berhasil disetujui dan statusnya kini Aktif!`);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `payments/${paymentId}`);
    }
  };

  const handleCreateInvoice = async (newInv: Omit<Invoice, 'id'>, initialLogPos: string) => {
    const invoiceId = `inv-${Date.now()}`;
    const freshInvoice: Invoice = {
      ...newInv,
      id: invoiceId,
    };

    const relatedPayment = payments.find(p => p.id === newInv.paymentId);
    const updatedPayment = relatedPayment ? { ...relatedPayment, hasInvoice: true } : null;

    const initialLog: InvoiceLog = {
      id: `log-${Date.now()}`,
      invoiceId: invoiceId,
      tanggal: newInv.tanggalTagihan,
      posisi: initialLogPos,
      catatan: 'Invoice tagihan diterbitkan pertama kali berdasarkan daftar pembayaran rekanan.',
      updatedBy: userRole === 'STAF_ADMINISTRASI_UMUM' ? 'Staf Administrasi & Umum' : userRole === 'SUPERVISOR_KEUANGAN_UMUM' ? 'Supervisor Keuangan & Umum' : userRole === 'DIREKTUR' ? 'Direktur' : 'Administrator',
    };

    const newNotif: AppNotification = {
      id: `notif-${Date.now()}`,
      judul: 'Faktur Tagihan Baru Terbit',
      deskripsi: `Invoice ${newInv.nomorTagihan} senilai Rp ${newInv.totalTagihan.toLocaleString('id-ID')} untuk ${newInv.customerDebitur} berhasil dibuat.`,
      tanggal: '2026-05-28',
      tipe: 'log',
      read: false,
    };

    try {
      await setDoc(doc(db, 'invoices', invoiceId), freshInvoice);
      if (updatedPayment) {
        await setDoc(doc(db, 'payments', updatedPayment.id), updatedPayment);
      }
      await setDoc(doc(db, 'logs', initialLog.id), initialLog);
      await setDoc(doc(db, 'notifications', newNotif.id), newNotif);
      alert('Tagihan resmi berhasil diterbitkan! Log pelacakan posisi tagihan kini diaktifkan.');
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `invoices/${invoiceId}`);
    }
  };

  const handleAddInvoiceLog = async (invoiceId: string, logData: Omit<InvoiceLog, 'id' | 'updatedBy'>) => {
    const logId = `log-${Date.now()}`;
    const newLogItem: InvoiceLog = {
      ...logData,
      id: logId,
      updatedBy: userRole === 'STAF_ADMINISTRASI_UMUM' ? 'Staf Administrasi & Umum' : userRole === 'SUPERVISOR_KEUANGAN_UMUM' ? 'Supervisor Keuangan & Umum' : userRole === 'DIREKTUR' ? 'Direktur' : 'Administrator',
    };

    const relatedInv = invoices.find(i => i.id === invoiceId);
    const mockNotif: AppNotification = {
      id: `notif-${Date.now()}`,
      judul: 'Pembaruan Log Posisi Berkas',
      deskripsi: `Posisi fisik berkas tagihan ${relatedInv?.nomorTagihan} diperbarui ke: "${logData.posisi}"`,
      tanggal: '2026-05-28',
      tipe: 'log',
      read: false,
    };

    try {
      await setDoc(doc(db, 'logs', logId), newLogItem);
      await setDoc(doc(db, 'notifications', mockNotif.id), mockNotif);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `logs/${logId}`);
    }
  };

  const handleMarkInvoiceLunas = async (invoiceId: string, tanggalLunas: string) => {
    const relatedInv = invoices.find(i => i.id === invoiceId);
    if (!relatedInv) return;

    const updatedInvoice = {
      ...relatedInv,
      status: 'Lunas' as const,
      tanggalLunas: tanggalLunas,
    };

    const autoLog: InvoiceLog = {
      id: `log-${Date.now()}`,
      invoiceId,
      tanggal: tanggalLunas,
      posisi: 'Pembayaran Cair / Lunas',
      catatan: 'Pembayaran tagihan telah diterima penuh di rekening bank kas perusahaan.',
      updatedBy: 'Sistem Otomatis (Lunas)',
    };

    const newNotif: AppNotification = {
      id: `notif-${Date.now()}`,
      judul: 'FOKUS LUNAS: Pembayaran Berhasil Masuk',
      deskripsi: `Customer ${relatedInv.customerDebitur} telah sukses melunasi tagihan ${relatedInv.nomorTagihan} senilai Rp ${relatedInv.totalTagihan.toLocaleString('id-ID')}.`,
      tanggal: '2026-05-28',
      tipe: 'system',
      read: false,
    };

    try {
      await setDoc(doc(db, 'invoices', invoiceId), updatedInvoice);
      await setDoc(doc(db, 'logs', autoLog.id), autoLog);
      await setDoc(doc(db, 'notifications', newNotif.id), newNotif);
      alert(`Sukses menandai lunas tagihan ${relatedInv.nomorTagihan}. Dana piutang masuk kas!`);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `invoices/${invoiceId}`);
    }
  };

  // Factory reset Remote Database Collections completely
  const handleResetData = async () => {
    try {
      const cols = ['payments', 'invoices', 'logs', 'notifications', 'settings', 'users'];
      for (const col of cols) {
        const snap = await getDocs(collection(db, col));
        for (const docItem of snap.docs) {
          await deleteDoc(doc(db, col, docItem.id));
        }
      }
      await initFirestoreSeed();
      alert('Database sukses dikembalikan ke setelan pabrik!');
    } catch (error) {
      console.error('Reset database failed:', error);
      alert('Gagal mereset database ke setelan pabrik.');
    }
  };

  // Clear all live invoice transactions but keep Users/Settings configuration intact
  const handleClearAllData = async () => {
    try {
      const cols = ['payments', 'invoices', 'logs', 'notifications'];
      for (const col of cols) {
        const snap = await getDocs(collection(db, col));
        for (const docItem of snap.docs) {
          await deleteDoc(doc(db, col, docItem.id));
        }
      }
      alert('Seluruh data transaksi (pembayaran, invoice tagihan, log pelacakan, dan notifikasi) berhasil dikosongkan!');
    } catch (error) {
      console.error('Clear transactions failed:', error);
      alert('Gagal mengosongkan data transaksi.');
    }
  };

  const handleRestoreData = async (restoredState: any) => {
    try {
      if (restoredState.settings) {
        await setDoc(doc(db, 'settings', 'general'), restoredState.settings);
      }
      if (restoredState.users) {
        for (const u of restoredState.users) {
          await setDoc(doc(db, 'users', u.id), u);
        }
      }
      if (restoredState.payments) {
        for (const p of restoredState.payments) {
          await setDoc(doc(db, 'payments', p.id), p);
        }
      }
      if (restoredState.invoices) {
        for (const inv of restoredState.invoices) {
          await setDoc(doc(db, 'invoices', inv.id), inv);
        }
      }
      if (restoredState.logs) {
        for (const lg of restoredState.logs) {
          await setDoc(doc(db, 'logs', lg.id), lg);
        }
      }
      if (restoredState.notifications) {
        for (const n of restoredState.notifications) {
          await setDoc(doc(db, 'notifications', n.id), n);
        }
      }
      alert('Data cadangan berhasil dipulihkan!');
    } catch (error) {
      console.error('Restore failed:', error);
      alert('Gagal memulihkan data cadangan.');
    }
  };

  const handleUpdateSettings = async (newSettings: Partial<CompanySettings>) => {
    try {
      const mergedSettings = { ...settings, ...newSettings };
      await setDoc(doc(db, 'settings', 'general'), mergedSettings);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'settings/general');
    }
  };

  const handleUpdateUsers = async (nextUsers: AppUser[]) => {
    try {
      // Clean up deleted ones first
      const snapshot = await getDocs(collection(db, 'users'));
      for (const docItem of snapshot.docs) {
        const found = nextUsers.find(u => u.id === docItem.id);
        if (!found) {
          await deleteDoc(doc(db, 'users', docItem.id));
        }
      }
      // Write new operators
      for (const u of nextUsers) {
        await setDoc(doc(db, 'users', u.id), u);
      }
    } catch (error) {
      console.error('Update users list failed:', error);
    }
  };

  const handleMarkNotifAsRead = async (notifId: string) => {
    const target = notifications.find(n => n.id === notifId);
    if (!target) return;
    try {
      await setDoc(doc(db, 'notifications', notifId), { ...target, read: true });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `notifications/${notifId}`);
    }
  };

  const handleClearAllNotifications = async () => {
    try {
      for (const n of notifications) {
        await deleteDoc(doc(db, 'notifications', n.id));
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, 'notifications');
    }
  };

  // Cross module navigation link trigger
  const handleNavigateFromNotif = (module: 'payments' | 'invoices', id: string) => {
    setActiveFilterId(id);
    setShowNotifDrawer(false);
    if (module === 'payments') {
      setActiveTab('payments');
    } else {
      setActiveTab('invoices');
    }
  };

  const unreadNotifCount = notifications.filter(n => !n.read).length;

  if (dbLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6" id="db-loader">
        <div className="text-center space-y-4 animate-pulse">
          <div className="h-10 w-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs font-bold text-slate-500 uppercase tracking-widest font-mono">Sinkronisasi Database Firebase...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans flex flex-col justify-between" id="app-window">
      
      {/* Main Container Wrapper */}
      <div className="mx-auto flex-1 flex flex-col w-full" id="app-viewport-wrapper">
        
        {!currentLoggedInUser ? (
          users.length === 0 ? (
            /* Onboarding Layout when DB is empty */
            <div className="flex-1 flex flex-col items-center justify-center p-6 bg-slate-50" id="onboarding-container">
              <div className="w-full max-w-2xl bg-white rounded-2xl border border-slate-200/60 shadow-xl p-8 relative overflow-hidden animate-fadeIn">
                <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-emerald-500 via-teal-500 to-indigo-600" />
                
                <div className="text-center mb-6">
                  <div className="h-14 w-14 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center shadow-md mx-auto mb-3">
                    <Sparkles className="h-7 w-7 animate-pulse" />
                  </div>
                  <h2 className="text-xl font-black tracking-tight text-slate-800">Inisialisasi Database Baru</h2>
                  <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
                    Database aplikasi Anda terdeteksi **kosong & bersih**. Silakan pilih salah satu opsi di bawah ini untuk memulai operasional sistem:
                  </p>
                </div>

                {onboardingError && (
                  <div className="flex items-start gap-2 bg-rose-50 border border-rose-100 rounded-xl p-3 mb-6 text-[11px] text-rose-700 leading-tight">
                    <X className="h-3.5 w-3.5 shrink-0 text-rose-600 mt-0.5" />
                    <span>{onboardingError}</span>
                  </div>
                )}

                {isOnboardingSeeding ? (
                  <div className="text-center py-12 space-y-4">
                    <div className="h-10 w-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto" />
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-widest font-mono">Sedang menginisialisasi setup awal database...</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
                    {/* Option 1: Demo Seed */}
                    <div className="border border-slate-200/60 rounded-xl p-5 hover:border-indigo-400 hover:shadow-md transition-all flex flex-col justify-between">
                      <div>
                        <div className="h-8 w-8 bg-indigo-50 text-indigo-600 rounded-lg flex items-center justify-center text-sm font-bold mb-3">
                          📊
                        </div>
                        <h3 className="text-sm font-black text-slate-800">1. Gunakan Data Simulasi / Demo</h3>
                        <p className="text-[11px] text-slate-450 mt-2 leading-relaxed">
                          Sangat direkomendasikan untuk uji coba pertama kali. Mengonfigurasi database dengan data dummy lengkap: 4 akun bawaan (budi_keu, rina_admin, hadi_dir, agus_admin), 6 draf pembayaran rekanan, 4 faktur tagihan (invoice), log fisik pelacakan, dan riwayat notifikasi.
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={async () => {
                          setIsOnboardingSeeding(true);
                          try {
                            await initFirestoreSeed();
                            alert("Database sukses diisi dengan dataset demo!");
                          } catch (e) {
                            console.error(e);
                            setOnboardingError("Gagal memuat data demo: " + (e instanceof Error ? e.message : String(e)));
                          } finally {
                            setIsOnboardingSeeding(false);
                          }
                        }}
                        className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs py-2.5 rounded-lg mt-5 cursor-pointer transition-colors"
                      >
                        Gunakan Data Demo Bawaan
                      </button>
                    </div>

                    {/* Option 2: Clean Production Register */}
                    <div className="border border-slate-200/60 rounded-xl p-5 hover:border-emerald-400 hover:shadow-md transition-all">
                      <div className="h-8 w-8 bg-emerald-50 text-emerald-600 rounded-lg flex items-center justify-center text-sm font-bold mb-3">
                        🛡️
                      </div>
                      <h3 className="text-sm font-black text-slate-800">2. Mulai Bersih (Clean Setup)</h3>
                      <p className="text-[11px] text-slate-450 mt-2 leading-relaxed">
                        Pilih opsi ini untuk langsung menggunakan sistem perusahaan Anda secara riil tanpa data demo. Daftarkan akun Administrator Utama Anda yang pertama di bawah:
                  </p>

                      <form onSubmit={handleCreateFirstAdmin} className="space-y-3 mt-4">
                        <div>
                          <input
                            type="text"
                            placeholder="Nama Lengkap Operator"
                            className="w-full p-2.5 border border-slate-200 rounded-lg text-xs font-semibold focus:outline-none focus:border-emerald-500 bg-white"
                            value={newAdminNama}
                            onChange={(e) => setNewAdminNama(e.target.value)}
                            required
                          />
                        </div>
                        <div>
                          <input
                            type="text"
                            placeholder="Username"
                            className="w-full p-2.5 border border-slate-200 rounded-lg text-xs font-semibold font-mono focus:outline-none focus:border-emerald-500 bg-white"
                            value={newAdminUsername}
                            onChange={(e) => setNewAdminUsername(e.target.value)}
                            required
                          />
                        </div>
                        <div>
                          <input
                            type="password"
                            placeholder="Kata Sandi (Min 4 karakter)"
                            className="w-full p-2.5 border border-slate-200 rounded-lg text-xs font-semibold focus:outline-none focus:border-emerald-500 bg-white"
                            value={newAdminPassword}
                            onChange={(e) => setNewAdminPassword(e.target.value)}
                            required
                          />
                        </div>
                        <button
                          type="submit"
                          className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs py-2.5 rounded-lg cursor-pointer transition-colors mt-2"
                        >
                          Daftar Admin Utama & Mulai
                        </button>
                      </form>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            /* Production Grade Login Screen Layout */
            <div className="flex-1 flex flex-col items-center justify-center p-6 bg-slate-50" id="login-container">
              <div className="w-full max-w-md bg-white rounded-2xl border border-slate-200/60 shadow-xl p-8 relative overflow-hidden animate-fadeIn">
                <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-600" />
                
                <div className="text-center mb-6">
                  {(() => {
                    const logoFile = settings.activeLogoId === 'logo-minimalist' 
                      ? '/logo-minimalist.svg' 
                      : settings.activeLogoId === 'logo-vault' 
                      ? '/logo-vault.svg' 
                      : '/logo-growth.svg';
                    return (
                      <div className="h-16 w-16 bg-[#090d16] rounded-2xl flex items-center justify-center shadow-lg mx-auto mb-4 p-2.5 border border-slate-200/10">
                        <img src={logoFile} alt="App Logo" className="h-full w-full object-contain" referrerPolicy="no-referrer" />
                      </div>
                    );
                  })()}
                  <h2 className="text-lg font-black tracking-tight text-slate-800">Sistem Pelacakan Piutang</h2>
                  <p className="text-[10px] text-slate-400 mt-1 uppercase tracking-widest font-bold font-mono">
                    {settings.namaPerusahaan}
                  </p>
                  <div className="h-px w-10 bg-slate-200 mx-auto mt-3" />
                </div>

                {loginError && (
                  <div className="flex items-start gap-2 bg-rose-50 border border-rose-100 rounded-xl p-3 mb-4 text-[11px] text-rose-700 leading-tight">
                    <X className="h-3.5 w-3.5 shrink-0 text-rose-600 mt-0.5" />
                    <span>{loginError}</span>
                  </div>
                )}

                <form onSubmit={handleLogin} className="space-y-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider block">Username</label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
                        <User className="h-4 w-4" />
                      </span>
                      <input
                        type="text"
                        className="w-full p-2.5 pl-10 border border-slate-200 rounded-xl bg-white focus:outline-none focus:border-indigo-500 text-xs font-semibold text-slate-800 transition-all font-mono"
                        placeholder="Masukkan username anda"
                        value={loginUsername}
                        onChange={(e) => setLoginUsername(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider block">Kata Sandi (Password)</label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
                        <Lock className="h-4 w-4" />
                      </span>
                      <input
                        type="password"
                        className="w-full p-2.5 pl-10 border border-slate-200 rounded-xl bg-white focus:outline-none focus:border-indigo-500 text-xs font-semibold text-slate-800 transition-all font-mono"
                        placeholder="••••••••"
                        value={loginPassword}
                        onChange={(e) => setLoginPassword(e.target.value)}
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs py-3 rounded-xl transition-colors cursor-pointer shadow-md flex items-center justify-center gap-1.5 mt-2"
                  >
                    <LogIn className="h-3.5 w-3.5" /> Masuk ke Aplikasi
                  </button>
                </form>

                <div className="relative my-4">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-slate-200/80" />
                  </div>
                  <div className="relative flex justify-center text-xs">
                    <span className="bg-white px-2.5 text-[10px] text-slate-400 font-bold uppercase tracking-widest">Atau</span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleGoogleLogin}
                  className="w-full bg-white hover:bg-slate-50 text-slate-700 hover:text-slate-800 border border-slate-200/70 font-bold text-xs py-3 rounded-xl transition-all cursor-pointer shadow-sm hover:shadow-md flex items-center justify-center gap-2"
                >
                  <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24">
                    <path fill="#EA4335" d="M12 5.04c1.66 0 3.2.57 4.38 1.69l3.27-3.27C17.67 1.47 15.01 1 12 1 7.24 1 3.21 3.74 1.25 7.73l3.85 2.99C6.01 7.4 8.78 5.04 12 5.04z" />
                    <path fill="#4285F4" d="M23.49 12.27c0-.81-.07-1.59-.2-2.35H12v4.46h6.46c-.28 1.47-1.11 2.72-2.35 3.56l3.64 2.82c2.13-1.96 3.74-4.85 3.74-8.49z" />
                    <path fill="#FBBC05" d="M5.1 10.72c-.25-.73-.39-1.52-.39-2.34s.14-1.61.39-2.34L1.25 7.05C.45 8.64 0 10.42 0 12.27c0 1.95.49 3.82 1.35 5.46L5.1 14.81c-.25-.72-.39-1.52-.39-2.33s.14-1.61.39-2.34z" />
                    <path fill="#34A853" d="M12 23c3.24 0 5.97-1.07 7.96-2.91l-3.64-2.82c-1.12.75-2.55 1.19-4.32 1.19-3.23 0-5.99-2.36-6.91-5.68l-3.85 2.99C3.21 19.86 7.24 23 12 23z" />
                  </svg>
                  Masuk dengan Akun Google
                </button>
              </div>
            </div>
          )
        ) : (
          /* Normal Registered System view */
          <>
            {/* Real App Header */}
            <header className="bg-white border-b border-slate-100 shadow-sm sticky top-0 z-30" id="main-header">
              <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  {(() => {
                    const logoFile = settings.activeLogoId === 'logo-minimalist' 
                      ? '/logo-minimalist.svg' 
                      : settings.activeLogoId === 'logo-vault' 
                      ? '/logo-vault.svg' 
                      : '/logo-growth.svg';
                    return (
                      <div className="h-10 w-10 bg-[#090d16] rounded-xl flex items-center justify-center shadow-md p-1.5 border border-slate-200/10 shrink-0">
                        <img src={logoFile} alt="App Logo" className="h-full w-full object-contain" referrerPolicy="no-referrer" />
                      </div>
                    );
                  })()}
                  <div>
                    <h1 className="text-sm font-black text-slate-800 tracking-tight leading-none flex items-center gap-1.5">
                      {settings.namaPerusahaan}
                    </h1>
                    <p className="text-[10px] text-slate-400 font-bold tracking-widest uppercase mt-0.5">SISTEM MONITORING PIUTANG</p>
                  </div>
                </div>

                {/* Account Details and Actions */}
                <div className="flex items-center gap-3">
                  {/* Account Badge Info */}
                  <div className="hidden sm:flex flex-col text-right">
                    <span className="text-xs font-bold text-slate-800">{currentLoggedInUser.nama}</span>
                    <span className="text-[9px] text-indigo-600 font-extrabold uppercase tracking-wide">
                      {userRole === 'SUPERVISOR_KEUANGAN_UMUM' 
                        ? 'Supervisor Keuangan & Umum' 
                        : userRole === 'STAF_ADMINISTRASI_UMUM' 
                        ? 'Staf Administrasi & Umum' 
                        : userRole === 'DIREKTUR'
                        ? 'Direktur Utama'
                        : 'Sistem Administrator'}
                    </span>
                  </div>

                  <div className="h-8 w-px bg-slate-100 hidden sm:block mx-0.5" />

                  {/* Notification bell trigger */}
                  <button
                    onClick={() => setShowNotifDrawer(!showNotifDrawer)}
                    className="relative p-2 rounded-lg hover:bg-slate-50 transition-colors cursor-pointer text-slate-500"
                    id="btn-toggle-notif-drawer"
                  >
                    <Bell className="h-4.5 w-4.5" />
                    {unreadNotifCount > 0 && (
                      <span className="absolute top-1 right-1 h-3.5 w-3.5 bg-rose-500 rounded-full text-[8px] font-bold text-white flex items-center justify-center border border-white">
                        {unreadNotifCount}
                      </span>
                    )}
                  </button>

                  {/* Logout Button */}
                  <button
                    onClick={handleLogout}
                    className="flex items-center gap-1 text-[10px] font-black text-slate-500 hover:text-rose-600 transition-colors p-1.5 px-2.5 bg-slate-50 hover:bg-rose-50/50 rounded-lg border border-slate-200/40 cursor-pointer"
                    title="Keluar dari Akun"
                    id="btn-logout"
                  >
                    <LogOut className="h-3.5 w-3.5 mx-auto" strokeWidth={2.5} />
                    <span className="hidden md:inline uppercase tracking-wider text-[9px]">Keluar</span>
                  </button>
                </div>
              </div>

              {/* Navigation Menu (Responsive) */}
              <nav className="bg-slate-50 border-t border-slate-100/60 text-slate-500 px-4" id="main-navigation">
                <div className="max-w-7xl mx-auto flex overflow-x-auto gap-4 no-scrollbar">
                  <button
                    onClick={() => { setActiveTab('dashboard'); setActiveFilterId(undefined); }}
                    className={`py-2 text-[11px] font-bold whitespace-nowrap border-b-2 transition-all flex items-center gap-1 cursor-pointer ${
                      activeTab === 'dashboard' 
                        ? 'border-indigo-600 text-indigo-600' 
                        : 'border-transparent text-slate-500 hover:text-slate-800'
                    }`}
                    id="nav-dashboard"
                  >
                    📊 Dashboard
                  </button>

                  <button
                    onClick={() => { setActiveTab('payments'); setActiveFilterId(undefined); }}
                    className={`py-2 text-[11px] font-bold whitespace-nowrap border-b-2 transition-all flex items-center gap-1 cursor-pointer ${
                      activeTab === 'payments' 
                        ? 'border-indigo-600 text-indigo-600' 
                        : 'border-transparent text-slate-500 hover:text-slate-800'
                    }`}
                    id="nav-payments"
                  >
                    📋 Daftar Pembayaran
                  </button>

                  <button
                    onClick={() => { setActiveTab('invoices'); setActiveFilterId(undefined); }}
                    className={`py-2 text-[11px] font-bold whitespace-nowrap border-b-2 transition-all flex items-center gap-1 cursor-pointer ${
                      activeTab === 'invoices' 
                        ? 'border-indigo-600 text-indigo-600' 
                        : 'border-transparent text-slate-500 hover:text-slate-800'
                    }`}
                    id="nav-invoices"
                  >
                    🧾 Daftar Tagihan
                  </button>

                  <button
                    onClick={() => { setActiveTab('cash'); setActiveFilterId(undefined); }}
                    className={`py-2 text-[11px] font-bold whitespace-nowrap border-b-2 transition-all flex items-center gap-1 cursor-pointer ${
                      activeTab === 'cash' 
                        ? 'border-indigo-600 text-indigo-600' 
                        : 'border-transparent text-slate-500 hover:text-slate-800'
                    }`}
                    id="nav-cash"
                  >
                    💼 Kas Perusahaan
                  </button>

                  <button
                    onClick={() => { setActiveTab('settings'); setActiveFilterId(undefined); }}
                    className={`py-2 text-[11px] font-bold whitespace-nowrap border-b-2 transition-all flex items-center gap-1 cursor-pointer ${
                      activeTab === 'settings' 
                        ? 'border-indigo-600 text-indigo-600' 
                        : 'border-transparent text-slate-500 hover:text-slate-800'
                    }`}
                    id="nav-settings"
                  >
                    ⚙️ Pengaturan
                  </button>
                </div>
              </nav>
            </header>

            {/* Notif drawer popup overlay */}
            {showNotifDrawer && (
              <div className="absolute right-4 top-16 md:right-10 z-40 max-w-sm w-full shadow-2xl rounded-xl animate-scaleIn">
                <NotificationsPanel
                  notifications={notifications}
                  onMarkAsRead={handleMarkNotifAsRead}
                  onClearAll={handleClearAllNotifications}
                  onNavigate={handleNavigateFromNotif}
                />
              </div>
            )}

            {/* Primary Content Screen */}
            <main className="max-w-7xl mx-auto px-4 py-5 flex-1" id="main-content-layout">
              
              {/* Active Tab Router */}
              {activeTab === 'dashboard' && (
                <Dashboard
                  payments={payments}
                  invoices={invoices}
                  logs={logs}
                  notifications={notifications}
                  onNavigateToModule={handleNavigateFromNotif}
                  onApprovePayment={handleApprovePayment}
                  userRole={userRole}
                  settings={settings}
                  cashBalances={cashBalances}
                />
              )}

              {activeTab === 'payments' && (
                <PaymentsModule
                  payments={payments}
                  onCreatePayment={handleAddNewPayment}
                  onApprovePayment={handleApprovePayment}
                  userRole={userRole}
                  selectedPaymentId={activeFilterId}
                  onClearSelection={() => setActiveFilterId(undefined)}
                  settings={settings}
                />
              )}

              {activeTab === 'invoices' && (
                <InvoicesModule
                  invoices={invoices}
                  payments={payments}
                  logs={logs}
                  settings={settings}
                  userRole={userRole}
                  onCreateInvoice={handleCreateInvoice}
                  onAddInvoiceLog={handleAddInvoiceLog}
                  onMarkInvoiceLunas={handleMarkInvoiceLunas}
                  selectedInvoiceId={activeFilterId}
                />
              )}

              {activeTab === 'cash' && (
                <CashModule
                  cashBalances={cashBalances}
                  userRole={userRole}
                  currentUser={currentLoggedInUser}
                  settings={settings}
                />
              )}

              {activeTab === 'settings' && (
                <SettingsModule
                  settings={settings}
                  userRole={userRole}
                  onUpdateSettings={handleUpdateSettings}
                  onResetData={handleResetData}
                  onClearAllData={handleClearAllData}
                  logs={logs}
                  users={users}
                  onUpdateUsers={handleUpdateUsers}
                  payments={payments}
                  invoices={invoices}
                  notifications={notifications}
                  onRestoreData={handleRestoreData}
                />
              )}

            </main>

            {/* Footer */}
            <footer className="bg-white border-t border-slate-100 py-5 text-center text-[10px] text-slate-400 font-medium" id="main-footer">
              <p>© 2026 {settings.namaPerusahaan}. Hak Cipta Dilindungi Undang-Undang.</p>
              <p className="mt-0.5 text-slate-300">Disediakan untuk kemudahan proses pengawasan pencatatan piutang perusahaan.</p>
            </footer>
          </>
        )}

      </div>
    </div>
  );
}
