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

import { db, auth, handleFirestoreError, OperationType, isFirebaseConfigured } from './firebase';
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
  const isResettingRef = React.useRef(false);

  const [useLocalFallback, setUseLocalFallback] = useState(!isFirebaseConfigured);
  const useFallbackRef = React.useRef(!isFirebaseConfigured);
  const [firebaseError, setFirebaseError] = useState<string | null>(null);
  const [showDbDiagnostics, setShowDbDiagnostics] = useState(false);

  useEffect(() => {
    useFallbackRef.current = useLocalFallback;
  }, [useLocalFallback]);

  const handleRetryFirebaseConnection = () => {
    setFirebaseError(null);
    setDbLoading(true);
    setUseLocalFallback(false);
  };

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
      await persistSetDoc('users', adminId, firstAdmin);

      // 2. Setup standard clean settings
      await persistSetDoc('settings', 'general', {
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

  // LocalStorage Fallback database initializations
  const initLocalFallback = () => {
    console.warn("Using LocalStorage fallback mode because Firebase is unconfigured or offline.");
    setUseLocalFallback(true);
    
    // Load from localStorage or populate default initial values
    const storedUsers = localStorage.getItem('app_users');
    let loadedUsers = INITIAL_USERS;
    if (storedUsers) {
      try { 
        const parsed = JSON.parse(storedUsers); 
        // Sync check: ensure all INITIAL_USERS are present in loadedUsers
        const merged = [...parsed];
        let hasChanges = false;
        for (const defaultUser of INITIAL_USERS) {
          const exists = merged.some(u => u.username.toLowerCase() === defaultUser.username.toLowerCase());
          if (!exists) {
            merged.push(defaultUser);
            hasChanges = true;
          }
        }
        if (hasChanges) {
          localStorage.setItem('app_users', JSON.stringify(merged));
        }
        loadedUsers = merged;
      } catch (e) { 
        console.error(e); 
      }
    } else {
      localStorage.setItem('app_users', JSON.stringify(INITIAL_USERS));
    }
    setUsers(loadedUsers);

    const storedSettings = localStorage.getItem('app_settings');
    let loadedSettings = DEFAULT_SETTINGS;
    if (storedSettings) {
      try { loadedSettings = JSON.parse(storedSettings); } catch (e) { console.error(e); }
    } else {
      localStorage.setItem('app_settings', JSON.stringify(DEFAULT_SETTINGS));
    }
    setSettings(loadedSettings);

    const storedPayments = localStorage.getItem('app_payments');
    let loadedPayments = INITIAL_PAYMENTS;
    if (storedPayments) {
      try { loadedPayments = JSON.parse(storedPayments); } catch (e) { console.error(e); }
    } else {
      localStorage.setItem('app_payments', JSON.stringify(INITIAL_PAYMENTS));
    }
    setPayments(loadedPayments);

    const storedInvoices = localStorage.getItem('app_invoices');
    let loadedInvoices = INITIAL_INVOICES;
    if (storedInvoices) {
      try { loadedInvoices = JSON.parse(storedInvoices); } catch (e) { console.error(e); }
    } else {
      localStorage.setItem('app_invoices', JSON.stringify(INITIAL_INVOICES));
    }
    setInvoices(loadedInvoices);

    const storedLogs = localStorage.getItem('app_logs');
    let loadedLogs = INITIAL_LOGS;
    if (storedLogs) {
      try { loadedLogs = JSON.parse(storedLogs); } catch (e) { console.error(e); }
    } else {
      localStorage.setItem('app_logs', JSON.stringify(INITIAL_LOGS));
    }
    setLogs(loadedLogs);

    const storedNotifs = localStorage.getItem('app_notifications');
    let loadedNotifs = INITIAL_NOTIFICATIONS;
    if (storedNotifs) {
      try { loadedNotifs = JSON.parse(storedNotifs); } catch (e) { console.error(e); }
    } else {
      localStorage.setItem('app_notifications', JSON.stringify(INITIAL_NOTIFICATIONS));
    }
    setNotifications(loadedNotifs);

    const storedCash = localStorage.getItem('app_cash_balances');
    let loadedCash = INITIAL_CASH_BALANCES;
    if (storedCash) {
      try {
        loadedCash = JSON.parse(storedCash);
        loadedCash.sort((a: any, b: any) => a.tanggal.localeCompare(b.tanggal));
      } catch (e) {
        console.error(e);
      }
    } else {
      localStorage.setItem('app_cash_balances', JSON.stringify(INITIAL_CASH_BALANCES));
    }
    setCashBalances(loadedCash);

    setDbLoading(false);
  };

  const persistSetDoc = async (col: string, id: string, data: any) => {
    if (!isFirebaseConfigured || useLocalFallback) {
      if (col === 'users') {
        setUsers(prev => {
          const next = [...prev.filter(u => u.id !== id), data];
          localStorage.setItem('app_users', JSON.stringify(next));
          return next;
        });
      } else if (col === 'settings') {
        setSettings(data);
        localStorage.setItem('app_settings', JSON.stringify(data));
      } else if (col === 'payments') {
        setPayments(prev => {
          const next = [data, ...prev.filter(p => p.id !== id)];
          localStorage.setItem('app_payments', JSON.stringify(next));
          return next;
        });
      } else if (col === 'invoices') {
        setInvoices(prev => {
          const next = [data, ...prev.filter(i => i.id !== id)];
          localStorage.setItem('app_invoices', JSON.stringify(next));
          return next;
        });
      } else if (col === 'logs') {
        setLogs(prev => {
          const next = [data, ...prev.filter(l => l.id !== id)];
          localStorage.setItem('app_logs', JSON.stringify(next));
          return next;
        });
      } else if (col === 'notifications') {
        setNotifications(prev => {
          const next = [data, ...prev.filter(n => n.id !== id)];
          localStorage.setItem('app_notifications', JSON.stringify(next));
          return next;
        });
      } else if (col === 'cashBalances') {
        setCashBalances(prev => {
          const next = [...prev.filter(c => c.id !== id), data];
          next.sort((a, b) => a.tanggal.localeCompare(b.tanggal));
          localStorage.setItem('app_cash_balances', JSON.stringify(next));
          return next;
        });
      }
      return;
    }

    try {
      const withTimeout = (promise: Promise<any>, timeoutMs: number) => {
        let timeoutId: any;
        const timeoutPromise = new Promise((_, reject) => {
          timeoutId = setTimeout(() => reject(new Error("Timeout Firestore Operation")), timeoutMs);
        });
        return Promise.race([
          promise.then(res => {
            clearTimeout(timeoutId);
            return res;
          }),
          timeoutPromise
        ]);
      };
      await withTimeout(setDoc(doc(db, col, id), data), 3000);
    } catch (e) {
      console.warn(`Firestore setDoc error or timeout for ${col}/${id}, switching to LocalStorage:`, e);
      setUseLocalFallback(true);
      // Fallback action immediately
      if (col === 'users') {
        setUsers(prev => {
          const next = [...prev.filter(u => u.id !== id), data];
          localStorage.setItem('app_users', JSON.stringify(next));
          return next;
        });
      } else if (col === 'settings') {
        setSettings(data);
        localStorage.setItem('app_settings', JSON.stringify(data));
      } else if (col === 'payments') {
        setPayments(prev => {
          const next = [data, ...prev.filter(p => p.id !== id)];
          localStorage.setItem('app_payments', JSON.stringify(next));
          return next;
        });
      } else if (col === 'invoices') {
        setInvoices(prev => {
          const next = [data, ...prev.filter(i => i.id !== id)];
          localStorage.setItem('app_invoices', JSON.stringify(next));
          return next;
        });
      } else if (col === 'logs') {
        setLogs(prev => {
          const next = [data, ...prev.filter(l => l.id !== id)];
          localStorage.setItem('app_logs', JSON.stringify(next));
          return next;
        });
      } else if (col === 'notifications') {
        setNotifications(prev => {
          const next = [data, ...prev.filter(n => n.id !== id)];
          localStorage.setItem('app_notifications', JSON.stringify(next));
          return next;
        });
      } else if (col === 'cashBalances') {
        setCashBalances(prev => {
          const next = [...prev.filter(c => c.id !== id), data];
          next.sort((a, b) => a.tanggal.localeCompare(b.tanggal));
          localStorage.setItem('app_cash_balances', JSON.stringify(next));
          return next;
        });
      }
    }
  };

  const persistDeleteDoc = async (col: string, id: string) => {
    if (!isFirebaseConfigured || useLocalFallback) {
      if (col === 'users') {
        setUsers(prev => {
          const next = prev.filter(u => u.id !== id);
          localStorage.setItem('app_users', JSON.stringify(next));
          return next;
        });
      } else if (col === 'payments') {
        setPayments(prev => {
          const next = prev.filter(p => p.id !== id);
          localStorage.setItem('app_payments', JSON.stringify(next));
          return next;
        });
      } else if (col === 'invoices') {
        setInvoices(prev => {
          const next = prev.filter(i => i.id !== id);
          localStorage.setItem('app_invoices', JSON.stringify(next));
          return next;
        });
      } else if (col === 'logs') {
        setLogs(prev => {
          const next = prev.filter(l => l.id !== id);
          localStorage.setItem('app_logs', JSON.stringify(next));
          return next;
        });
      } else if (col === 'notifications') {
        setNotifications(prev => {
          const next = prev.filter(n => n.id !== id);
          localStorage.setItem('app_notifications', JSON.stringify(next));
          return next;
        });
      } else if (col === 'cashBalances') {
        setCashBalances(prev => {
          const next = prev.filter(c => c.id !== id);
          localStorage.setItem('app_cash_balances', JSON.stringify(next));
          return next;
        });
      }
      return;
    }

    try {
      const withTimeout = (promise: Promise<any>, timeoutMs: number) => {
        let timeoutId: any;
        const timeoutPromise = new Promise((_, reject) => {
          timeoutId = setTimeout(() => reject(new Error("Timeout Firestore Operation")), timeoutMs);
        });
        return Promise.race([
          promise.then(res => {
            clearTimeout(timeoutId);
            return res;
          }),
          timeoutPromise
        ]);
      };
      await withTimeout(deleteDoc(doc(db, col, id)), 3000);
    } catch (e) {
      console.warn(`Firestore deleteDoc error or timeout for ${col}/${id}, switching to LocalStorage:`, e);
      setUseLocalFallback(true);
      if (col === 'users') {
        setUsers(prev => {
          const next = prev.filter(u => u.id !== id);
          localStorage.setItem('app_users', JSON.stringify(next));
          return next;
        });
      } else if (col === 'payments') {
        setPayments(prev => {
          const next = prev.filter(p => p.id !== id);
          localStorage.setItem('app_payments', JSON.stringify(next));
          return next;
        });
      } else if (col === 'invoices') {
        setInvoices(prev => {
          const next = prev.filter(i => i.id !== id);
          localStorage.setItem('app_invoices', JSON.stringify(next));
          return next;
        });
      } else if (col === 'logs') {
        setLogs(prev => {
          const next = prev.filter(l => l.id !== id);
          localStorage.setItem('app_logs', JSON.stringify(next));
          return next;
        });
      } else if (col === 'notifications') {
        setNotifications(prev => {
          const next = prev.filter(n => n.id !== id);
          localStorage.setItem('app_notifications', JSON.stringify(next));
          return next;
        });
      } else if (col === 'cashBalances') {
        setCashBalances(prev => {
          const next = prev.filter(c => c.id !== id);
          localStorage.setItem('app_cash_balances', JSON.stringify(next));
          return next;
        });
      }
    }
  };

  // Helper: Seed initial mock data if remote database is empty
  const initFirestoreSeed = async () => {
    console.log('Seeding initial data...');
    const withTimeout = <T,>(promise: Promise<T>, timeoutMs: number): Promise<T> => {
      let timeoutId: any;
      const timeoutPromise = new Promise<never>((_, reject) => {
        timeoutId = setTimeout(() => reject(new Error("Timeout Firestore Seeding")), timeoutMs);
      });
      return Promise.race([
        promise.then(res => {
          clearTimeout(timeoutId);
          return res;
        }),
        timeoutPromise
      ]);
    };

    try {
      if (!isFirebaseConfigured || useLocalFallback) {
        setSettings(DEFAULT_SETTINGS);
        localStorage.setItem('app_settings', JSON.stringify(DEFAULT_SETTINGS));

        setUsers(INITIAL_USERS);
        localStorage.setItem('app_users', JSON.stringify(INITIAL_USERS));

        setPayments(INITIAL_PAYMENTS);
        localStorage.setItem('app_payments', JSON.stringify(INITIAL_PAYMENTS));

        setInvoices(INITIAL_INVOICES);
        localStorage.setItem('app_invoices', JSON.stringify(INITIAL_INVOICES));

        setLogs(INITIAL_LOGS);
        localStorage.setItem('app_logs', JSON.stringify(INITIAL_LOGS));

        setNotifications(INITIAL_NOTIFICATIONS);
        localStorage.setItem('app_notifications', JSON.stringify(INITIAL_NOTIFICATIONS));

        setCashBalances(INITIAL_CASH_BALANCES);
        localStorage.setItem('app_cash_balances', JSON.stringify(INITIAL_CASH_BALANCES));
        
        console.log('Seeding completed successfully (LocalStorage).');
        return;
      }

      console.log('Attempting to seed to Firestore with timeout safety...');
      
      const runSeedWithTimeout = async () => {
        const promises: Promise<any>[] = [];

        // 1. Seed Company Settings
        promises.push(setDoc(doc(db, 'settings', 'general'), DEFAULT_SETTINGS));

        // 2. Seed Users
        for (const u of INITIAL_USERS) {
          promises.push(setDoc(doc(db, 'users', u.id), u));
        }

        // 3. Seed Payments
        for (const p of INITIAL_PAYMENTS) {
          promises.push(setDoc(doc(db, 'payments', p.id), p));
        }

        // 4. Seed Invoices
        for (const inv of INITIAL_INVOICES) {
          promises.push(setDoc(doc(db, 'invoices', inv.id), inv));
        }

        // 5. Seed Logs
        for (const lg of INITIAL_LOGS) {
          promises.push(setDoc(doc(db, 'logs', lg.id), lg));
        }

        // 6. Seed Notifications
        for (const n of INITIAL_NOTIFICATIONS) {
          promises.push(setDoc(doc(db, 'notifications', n.id), n));
        }

        // 7. Seed Cash Balances
        for (const cb of INITIAL_CASH_BALANCES) {
          promises.push(setDoc(doc(db, 'cashBalances', cb.id), cb));
        }

        await Promise.all(promises);
      };

      // Set a robust aggregate 4-second timeout for the entirety of Firestore seeding
      await withTimeout(runSeedWithTimeout(), 4000);
      console.log('Seeding to Firestore completed successfully.');
    } catch (e) {
      console.warn('Error seeding initial Firestore data, falling back to LocalStorage immediately:', e);
      setUseLocalFallback(true);
      
      // Perform local fallbacks
      setSettings(DEFAULT_SETTINGS);
      localStorage.setItem('app_settings', JSON.stringify(DEFAULT_SETTINGS));

      setUsers(INITIAL_USERS);
      localStorage.setItem('app_users', JSON.stringify(INITIAL_USERS));

      setPayments(INITIAL_PAYMENTS);
      localStorage.setItem('app_payments', JSON.stringify(INITIAL_PAYMENTS));

      setInvoices(INITIAL_INVOICES);
      localStorage.setItem('app_invoices', JSON.stringify(INITIAL_INVOICES));

      setLogs(INITIAL_LOGS);
      localStorage.setItem('app_logs', JSON.stringify(INITIAL_LOGS));

      setNotifications(INITIAL_NOTIFICATIONS);
      localStorage.setItem('app_notifications', JSON.stringify(INITIAL_NOTIFICATIONS));

      setCashBalances(INITIAL_CASH_BALANCES);
      localStorage.setItem('app_cash_balances', JSON.stringify(INITIAL_CASH_BALANCES));
    }
  };

  // Real-time Firestore Subscriptions
  useEffect(() => {
    if (!isFirebaseConfigured || useLocalFallback) {
      initLocalFallback();
      return;
    }

    // Set a safety timeout: if Firestore takes more than 8 seconds to load/fire, automatically trigger LocalStorage fallback!
    const safetyTimeout = setTimeout(() => {
      if (dbLoading) {
        console.warn("Firestore subscription taking too long. Falling back to LocalStorage safety mode.");
        setFirebaseError("Menghubungkan ke Firestore tertunda (Timeout 8 Detik). Database Anda mungkin belum dibuat atau aturan keamanan (Security Rules) memblokir koneksi ini.");
        initLocalFallback();
      }
    }, 8000);

    const handleSubError = (colName: string, err: any) => {
      console.warn(`Firestore subscription failed for '${colName}', falling back to LocalStorage:`, err);
      setFirebaseError(`Gagal membaca koleksi Firestore '${colName}': ${err instanceof Error ? err.message : String(err)}`);
      initLocalFallback();
    };

    // 1. Subscribe to Users
    const unsubUsers = onSnapshot(collection(db, 'users'), (snapshot) => {
      if (useFallbackRef.current) return;
      const usersList: AppUser[] = [];
      snapshot.forEach(docSnap => {
        usersList.push(docSnap.data() as AppUser);
      });

      // Self-healing: if usersList is loaded but some critical INITIAL_USERS are missing in the DB,
      // upload them to Firestore silently so they are permanently registered and usable!
      let hasChanges = false;
      const promises: Promise<any>[] = [];
      
      for (const defaultUser of INITIAL_USERS) {
        const exists = usersList.some(u => u.username.toLowerCase() === defaultUser.username.toLowerCase());
        if (!exists) {
          promises.push(setDoc(doc(db, 'users', defaultUser.id), defaultUser));
          usersList.push(defaultUser);
          hasChanges = true;
        }
      }
      
      if (hasChanges) {
        Promise.all(promises).catch(err => console.warn("Failed self-healing default users in Firestore:", err));
      }

      setUsers(usersList);
    }, (err) => handleSubError('users', err));

    // 2. Subscribe to Payments
    const unsubPayments = onSnapshot(collection(db, 'payments'), (snapshot) => {
      if (useFallbackRef.current) return;
      const payList: Payment[] = [];
      snapshot.forEach(docSnap => {
        payList.push(docSnap.data() as Payment);
      });
      payList.sort((a, b) => b.id.localeCompare(a.id));
      setPayments(payList);
    }, (err) => handleSubError('payments', err));

    // 3. Subscribe to Invoices
    const unsubInvoices = onSnapshot(collection(db, 'invoices'), (snapshot) => {
      if (useFallbackRef.current) return;
      const invList: Invoice[] = [];
      snapshot.forEach(docSnap => {
        invList.push(docSnap.data() as Invoice);
      });
      invList.sort((a, b) => b.id.localeCompare(a.id));
      setInvoices(invList);
    }, (err) => handleSubError('invoices', err));

    // 4. Subscribe to Logs
    const unsubLogs = onSnapshot(collection(db, 'logs'), (snapshot) => {
      if (useFallbackRef.current) return;
      const logList: InvoiceLog[] = [];
      snapshot.forEach(docSnap => {
        logList.push(docSnap.data() as InvoiceLog);
      });
      logList.sort((a, b) => b.id.localeCompare(a.id));
      setLogs(logList);
    }, (err) => handleSubError('logs', err));

    // 5. Subscribe to Notifications
    const unsubNotifs = onSnapshot(collection(db, 'notifications'), (snapshot) => {
      if (useFallbackRef.current) return;
      const notifList: AppNotification[] = [];
      snapshot.forEach(docSnap => {
        notifList.push(docSnap.data() as AppNotification);
      });
      notifList.sort((a, b) => b.id.localeCompare(a.id));
      setNotifications(notifList);
    }, (err) => handleSubError('notifications', err));

    // 6. Subscribe to Settings
    const unsubSettings = onSnapshot(collection(db, 'settings'), (snapshot) => {
      if (useFallbackRef.current) return;
      let companySettings = DEFAULT_SETTINGS;
      snapshot.forEach(docSnap => {
        if (docSnap.id === 'general') {
          companySettings = docSnap.data() as CompanySettings;
        }
      });
      setSettings(companySettings);
    }, (err) => handleSubError('settings', err));

    // 7. Subscribe to Cash Balances
    const unsubCash = onSnapshot(collection(db, 'cashBalances'), (snapshot) => {
      if (useFallbackRef.current) return;
      const cashList: DailyCashBalance[] = [];
      snapshot.forEach(docSnap => {
        cashList.push(docSnap.data() as DailyCashBalance);
      });
      cashList.sort((a, b) => a.tanggal.localeCompare(b.tanggal));
      setCashBalances(cashList);
      clearTimeout(safetyTimeout); // Clear the safety loading fallback timeout!
      setDbLoading(false); // Make sure loading is disabled after settings and cash are subscribed!
      setFirebaseError(null); // Clear errors since connection was successful!
    }, (err) => handleSubError('cashBalances', err));

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
      clearTimeout(safetyTimeout);
      unsubUsers();
      unsubPayments();
      unsubInvoices();
      unsubLogs();
      unsubNotifs();
      unsubSettings();
      unsubCash();
    };
  }, [useLocalFallback]);

  // Sync current logged-in user changes if edited in system settings or if deleted
  useEffect(() => {
    if (isResettingRef.current) return;
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

        await persistSetDoc('users', newUid, newProvisionedUser);
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

  const handleInstantDemoLogin = (role: 'SUPER_ADMIN' | 'SUPERVISOR' | 'STAFF' | 'DIRECTOR') => {
    let username = 'anditasb';
    if (role === 'SUPERVISOR') username = 'hasrianti';
    else if (role === 'STAFF') username = 'muh.arash';
    else if (role === 'DIRECTOR') username = 'anditasb';

    const found = users.find(u => u.username.toLowerCase() === username.toLowerCase());
    if (found) {
      setCurrentLoggedInUser(found);
      setUserRole(found.role);
      localStorage.setItem('monitoring_logged_in_user', JSON.stringify(found));
      localStorage.setItem('monitoring_role', found.role);
      setLoginError('');
      alert(`Berhasil masuk sebagai ${found.nama} (${found.role === 'ADMINISTRATOR' ? 'Administrator & Direktur' : found.role === 'DIREKTUR' ? 'Direktur Utama' : found.role === 'SUPERVISOR_KEUANGAN_UMUM' ? 'Supervisor Keuangan & Umum' : 'Staf Administrasi & Umum'}). Selamat datang!`);
    } else {
      // Fallback if users array hasn't synchronized yet or is empty
      const fallbackUser = INITIAL_USERS.find(u => u.username.toLowerCase() === username.toLowerCase()) || INITIAL_USERS[0];
      setCurrentLoggedInUser(fallbackUser);
      setUserRole(fallbackUser.role);
      localStorage.setItem('monitoring_logged_in_user', JSON.stringify(fallbackUser));
      localStorage.setItem('monitoring_role', fallbackUser.role);
      setLoginError('');
      alert(`Berhasil masuk sebagai ${fallbackUser.nama} (${fallbackUser.role === 'ADMINISTRATOR' ? 'Administrator & Direktur' : fallbackUser.role === 'DIREKTUR' ? 'Direktur Utama' : fallbackUser.role === 'SUPERVISOR_KEUANGAN_UMUM' ? 'Supervisor Keuangan & Umum' : 'Staf Administrasi & Umum'}). Selamat datang!`);
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
    let foundUser = users.find(u => u.username.toLowerCase() === trimmedUsername.toLowerCase());

    // Bulletproof hardcoded user fallback & password sync/heal
    const fallbackMatch = INITIAL_USERS.find(u => u.username.toLowerCase() === trimmedUsername.toLowerCase());
    if (fallbackMatch && fallbackMatch.password === trimmedPassword) {
      if (!foundUser) {
        persistSetDoc('users', fallbackMatch.id, fallbackMatch);
        foundUser = fallbackMatch;
      } else if (foundUser.password !== trimmedPassword) {
        // If password in DB is outdated or differs, heal it back to the design specification (Setra(2025))
        persistSetDoc('users', foundUser.id, { ...foundUser, password: trimmedPassword });
        foundUser.password = trimmedPassword;
      }
    }

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
      await persistSetDoc('payments', payId, freshPayment);
      await persistSetDoc('notifications', newNotif.id, newNotif);
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
      await persistSetDoc('payments', paymentId, updatedPayment);
      await persistSetDoc('notifications', newNotif.id, newNotif);
      alert(`Rencana pembayaran ${approvedPay.rekanan} berhasil disetujui and statusnya kini Aktif!`);
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

    const paymentIdsToMark = newInv.paymentIds && newInv.paymentIds.length > 0
      ? newInv.paymentIds
      : (newInv.paymentId ? [newInv.paymentId] : []);

    const updatedPayments = payments
      .filter(p => paymentIdsToMark.includes(p.id))
      .map(p => ({ ...p, hasInvoice: true }));

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
      await persistSetDoc('invoices', invoiceId, freshInvoice);
      for (const pUp of updatedPayments) {
        await persistSetDoc('payments', pUp.id, pUp);
      }
      await persistSetDoc('logs', initialLog.id, initialLog);
      await persistSetDoc('notifications', newNotif.id, newNotif);
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
      await persistSetDoc('logs', logId, newLogItem);
      await persistSetDoc('notifications', mockNotif.id, mockNotif);
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
      await persistSetDoc('invoices', invoiceId, updatedInvoice);
      await persistSetDoc('logs', autoLog.id, autoLog);
      await persistSetDoc('notifications', newNotif.id, newNotif);

      // --- AUTOMATED COMPANY CASH BALANCE INCREMENTation ---
      const paymentIdToQuery = (relatedInv.paymentIds && relatedInv.paymentIds.length > 0)
        ? relatedInv.paymentIds[0]
        : relatedInv.paymentId;
      const relatedPayment = payments.find(p => p.id === paymentIdToQuery);
      const metodeBayar = relatedPayment?.metodeBayar || 'Tunai';

      // Match cash account ID based on invoice's payment method
      const matchedAccountId = (() => {
        const payLower = metodeBayar.toLowerCase();
        
        // 1. If physical Tunai, find first 'Kas' account
        if (payLower.includes('tunai')) {
          const kasAcc = settings.cashAccountsList?.find(acc => acc.tipe === 'Kas');
          if (kasAcc) return kasAcc.id;
        }
        
        // 2. Identify major brand words
        const brandMatch = metodeBayar.match(/(BCA|Mandiri|BNI|BRI|Danamon|CIMB|Kas Utama)/i);
        if (brandMatch) {
          const brand = brandMatch[0].toLowerCase();
          const matchedAcc = settings.cashAccountsList?.find(acc => acc.nama.toLowerCase().includes(brand));
          if (matchedAcc) return matchedAcc.id;
        }
        
        // 3. Fallback to generic comparison
        const cleanMethod = metodeBayar.replace(/^(Transfer|Giro)\s+/i, '').toLowerCase();
        const fallbackAcc = settings.cashAccountsList?.find(acc => 
          acc.nama.toLowerCase().includes(cleanMethod) || 
          cleanMethod.includes(acc.nama.toLowerCase())
        );
        if (fallbackAcc) return fallbackAcc.id;
        
        // Absolute fallback
        return settings.cashAccountsList?.[0]?.id || 'acc-kas-utama';
      })();

      const docId = `cash-${tanggalLunas}`;

      // Find closest prior cash balance record to serve as base if tanggalLunas doc is not created yet
      const baselineRecord = [...cashBalances]
        .filter(cb => cb.tanggal <= tanggalLunas)
        .sort((a, b) => b.tanggal.localeCompare(a.tanggal))[0];

      let previousBalances: { [accountId: string]: number } = {};
      if (baselineRecord) {
        previousBalances = { ...baselineRecord.balances };
      } else {
        settings.cashAccountsList?.forEach(acc => {
          previousBalances[acc.id] = 0;
        });
      }

      const exactRecord = cashBalances.find(cb => cb.tanggal === tanggalLunas);
      let targetBalances = { ...previousBalances };
      if (exactRecord) {
        targetBalances = { ...exactRecord.balances };
        targetBalances[matchedAccountId] = (targetBalances[matchedAccountId] || 0) + relatedInv.totalTagihan;
      } else {
        targetBalances[matchedAccountId] = (targetBalances[matchedAccountId] || 0) + relatedInv.totalTagihan;
      }

      const updatedDailyBalance: DailyCashBalance = {
        id: docId,
        tanggal: tanggalLunas,
        balances: targetBalances,
        catatan: exactRecord && exactRecord.catatan 
          ? `${exactRecord.catatan}; Pelunasan Invoice ${relatedInv.nomorTagihan} (+Rp ${relatedInv.totalTagihan.toLocaleString('id-ID')})`
          : `Pelunasan otomatis Invoice ${relatedInv.nomorTagihan} oleh sistem (+Rp ${relatedInv.totalTagihan.toLocaleString('id-ID')})`,
        updatedBy: 'Sistem Otomatis (Lunas)',
        updatedAt: new Date().toISOString().replace('T', ' ').slice(0, 16)
      };

      await persistSetDoc('cashBalances', docId, updatedDailyBalance);

      // Inter-day balance propagation for future dates to maintain running balance totals
      const futureRecords = cashBalances.filter(cb => cb.tanggal > tanggalLunas);
      for (const record of futureRecords) {
        const futureDocId = record.id;
        const nextBalances = { ...record.balances };
        nextBalances[matchedAccountId] = (nextBalances[matchedAccountId] || 0) + relatedInv.totalTagihan;
        
        await persistSetDoc('cashBalances', futureDocId, {
          ...record,
          balances: nextBalances,
          catatan: record.catatan 
            ? `${record.catatan} (Saldo diupdate dari Invoice ${relatedInv.nomorTagihan})`
            : `Saldo disinkronkan akibat pelunasan Invoice ${relatedInv.nomorTagihan}`
        });
      }

      alert(`Sukses menandai lunas tagihan ${relatedInv.nomorTagihan}. Dana pelunasan bersih senilai Rp ${relatedInv.totalTagihan.toLocaleString('id-ID')} otomatis ditambahkan ke rekening ${settings.cashAccountsList?.find(acc => acc.id === matchedAccountId)?.nama || 'Kas'} perusahaan!`);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `invoices/${invoiceId}`);
    }
  };

  // Factory reset Remote Database Collections completely
  const handleResetData = async () => {
    isResettingRef.current = true;
    try {
      // Immediately write the initial seed values to local storage cache to guarantee they are never null or empty
      localStorage.setItem('app_settings', JSON.stringify(DEFAULT_SETTINGS));
      localStorage.setItem('app_users', JSON.stringify(INITIAL_USERS));
      localStorage.setItem('app_payments', JSON.stringify(INITIAL_PAYMENTS));
      localStorage.setItem('app_invoices', JSON.stringify(INITIAL_INVOICES));
      localStorage.setItem('app_logs', JSON.stringify(INITIAL_LOGS));
      localStorage.setItem('app_notifications', JSON.stringify(INITIAL_NOTIFICATIONS));
      localStorage.setItem('app_cash_balances', JSON.stringify(INITIAL_CASH_BALANCES));

      // Optimistically clean and restore React local states immediately for instant UI response
      setSettings(DEFAULT_SETTINGS);
      setUsers(INITIAL_USERS);
      setPayments(INITIAL_PAYMENTS);
      setInvoices(INITIAL_INVOICES);
      setLogs(INITIAL_LOGS);
      setNotifications(INITIAL_NOTIFICATIONS);
      setCashBalances(INITIAL_CASH_BALANCES);

      if (!isFirebaseConfigured || useLocalFallback) {
        await initFirestoreSeed();
        
        // Auto-login to default seeded Administrator
        const defaultAdmin = INITIAL_USERS.find(u => u.role === 'ADMINISTRATOR') || INITIAL_USERS[0];
        setCurrentLoggedInUser(defaultAdmin);
        setUserRole(defaultAdmin.role);
        localStorage.setItem('monitoring_logged_in_user', JSON.stringify(defaultAdmin));
        localStorage.setItem('monitoring_role', defaultAdmin.role);

        alert('Database sukses dikembalikan ke setelan pabrik, dan Anda telah otomatis login sebagai Administrator!');
        return;
      }

      const withTimeout = <T,>(promise: Promise<T>, timeoutMs: number): Promise<T> => {
        let timeoutId: any;
        const timeoutPromise = new Promise<never>((_, reject) => {
          timeoutId = setTimeout(() => reject(new Error("Timeout Firestore Reset")), timeoutMs);
        });
        return Promise.race([
          promise.then(res => {
            clearTimeout(timeoutId);
            return res;
          }),
          timeoutPromise
        ]);
      };

      const cols = ['payments', 'invoices', 'logs', 'notifications', 'settings', 'users', 'cashBalances'];
      const deletePromises: Promise<any>[] = [];

      for (const col of cols) {
        // Fetch snapshot with safety timeout of 3s
        const snap = await withTimeout(getDocs(collection(db, col)), 3000).catch(err => {
          console.warn(`Firestore getDocs failed/timeout for resetting ${col}:`, err);
          return null;
        });
        if (snap) {
          for (const docItem of snap.docs) {
            deletePromises.push(
              withTimeout(deleteDoc(doc(db, col, docItem.id)), 2000).catch(err => {
                console.warn(`Firestore deleteDoc failed/timeout during reset for ${col}/${docItem.id}:`, err);
              })
            );
          }
        }
      }

      // Execute all safety deletes in parallel
      if (deletePromises.length > 0) {
        await Promise.all(deletePromises).catch(err => {
          console.warn("Some deletions failed during reset, proceeding to seed anyway:", err);
        });
      }

      await initFirestoreSeed();

      // Auto-login to default seeded Administrator
      const defaultAdmin = INITIAL_USERS.find(u => u.role === 'ADMINISTRATOR') || INITIAL_USERS[0];
      setCurrentLoggedInUser(defaultAdmin);
      setUserRole(defaultAdmin.role);
      localStorage.setItem('monitoring_logged_in_user', JSON.stringify(defaultAdmin));
      localStorage.setItem('monitoring_role', defaultAdmin.role);

      alert('Database sukses dikembalikan ke setelan pabrik, dan Anda telah otomatis login sebagai Administrator!');
    } catch (error) {
      console.error('Reset database failed:', error);
      alert('Gagal mereset database ke setelan pabrik.');
    } finally {
      isResettingRef.current = false;
    }
  };

  // Clear all live invoice transactions but keep Users/Settings configuration intact
  const handleClearAllData = async () => {
    isResettingRef.current = true;
    try {
      // Optimistically clear all local React states immediately for instant UI responsiveness
      setPayments([]);
      setInvoices([]);
      setLogs([]);
      setNotifications([]);
      setCashBalances([]);

      if (!isFirebaseConfigured || useLocalFallback) {
        localStorage.setItem('app_payments', JSON.stringify([]));
        localStorage.setItem('app_invoices', JSON.stringify([]));
        localStorage.setItem('app_logs', JSON.stringify([]));
        localStorage.setItem('app_notifications', JSON.stringify([]));
        localStorage.setItem('app_cash_balances', JSON.stringify([]));

        alert('Seluruh data transaksi (pembayaran, invoice tagihan, log pelacakan, notifikasi, dan rekap mutasi kas harian) berhasil dikosongkan!');
        return;
      }

      // Also overwrite key local storage elements for double safety
      localStorage.setItem('app_payments', JSON.stringify([]));
      localStorage.setItem('app_invoices', JSON.stringify([]));
      localStorage.setItem('app_logs', JSON.stringify([]));
      localStorage.setItem('app_notifications', JSON.stringify([]));
      localStorage.setItem('app_cash_balances', JSON.stringify([]));

      const withTimeout = <T,>(promise: Promise<T>, timeoutMs: number): Promise<T> => {
        let timeoutId: any;
        const timeoutPromise = new Promise<never>((_, reject) => {
          timeoutId = setTimeout(() => reject(new Error("Timeout Firestore Clear")), timeoutMs);
        });
        return Promise.race([
          promise.then(res => {
            clearTimeout(timeoutId);
            return res;
          }),
          timeoutPromise
        ]);
      };

      const cols = ['payments', 'invoices', 'logs', 'notifications', 'cashBalances'];
      const deletePromises: Promise<any>[] = [];

      for (const col of cols) {
        // Fetch snapshot with safety timeout of 3s
        const snap = await withTimeout(getDocs(collection(db, col)), 3000).catch(err => {
          console.warn(`Firestore getDocs failed/timeout for clearing ${col}:`, err);
          return null;
        });
        if (snap) {
          for (const docItem of snap.docs) {
            deletePromises.push(
              withTimeout(deleteDoc(doc(db, col, docItem.id)), 2005).catch(err => {
                console.warn(`Firestore deleteDoc failed/timeout during clear for ${col}/${docItem.id}:`, err);
              })
            );
          }
        }
      }

      // Execute all safety deletes in parallel
      if (deletePromises.length > 0) {
        await Promise.all(deletePromises).catch(err => {
          console.warn("Some deletions failed during clear, completing sweep anyway:", err);
        });
      }

      alert('Seluruh data transaksi (pembayaran, invoice tagihan, log pelacakan, notifikasi, dan rekap mutasi kas harian) berhasil dikosongkan!');
    } catch (error) {
      console.error('Clear transactions failed:', error);
      alert('Gagal mengosongkan data transaksi.');
    } finally {
      isResettingRef.current = false;
    }
  };

  const handleRestoreData = async (restoredState: any) => {
    try {
      if (restoredState.settings) {
        await persistSetDoc('settings', 'general', restoredState.settings);
      }
      if (restoredState.users) {
        for (const u of restoredState.users) {
          await persistSetDoc('users', u.id, u);
        }
      }
      if (restoredState.payments) {
        for (const p of restoredState.payments) {
          await persistSetDoc('payments', p.id, p);
        }
      }
      if (restoredState.invoices) {
        for (const inv of restoredState.invoices) {
          await persistSetDoc('invoices', inv.id, inv);
        }
      }
      if (restoredState.logs) {
        for (const lg of restoredState.logs) {
          await persistSetDoc('logs', lg.id, lg);
        }
      }
      if (restoredState.notifications) {
        for (const n of restoredState.notifications) {
          await persistSetDoc('notifications', n.id, n);
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
      await persistSetDoc('settings', 'general', mergedSettings);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'settings/general');
    }
  };

  const handleUpdateUsers = async (nextUsers: AppUser[]) => {
    try {
      if (!isFirebaseConfigured || useLocalFallback) {
        setUsers(nextUsers);
        localStorage.setItem('app_users', JSON.stringify(nextUsers));
        return;
      }
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
      await persistSetDoc('notifications', notifId, { ...target, read: true });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `notifications/${notifId}`);
    }
  };

  const handleClearAllNotifications = async () => {
    try {
      for (const n of notifications) {
        await persistDeleteDoc('notifications', n.id);
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

                            // Auto-login to default seeded Administrator
                            const defaultAdmin = INITIAL_USERS.find(u => u.role === 'ADMINISTRATOR') || INITIAL_USERS[0];
                            setCurrentLoggedInUser(defaultAdmin);
                            setUserRole(defaultAdmin.role);
                            localStorage.setItem('monitoring_logged_in_user', JSON.stringify(defaultAdmin));
                            localStorage.setItem('monitoring_role', defaultAdmin.role);

                            alert("Database sukses diisi dengan dataset demo dan Anda otomatis masuk sebagai Administrator!");
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

                {!settings.disableDemoLogin && (
                  <>
                    <div className="relative my-4">
                      <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-slate-250/80" />
                      </div>
                      <div className="relative flex justify-center text-xs">
                        <span className="bg-white px-2.5 text-[10px] text-indigo-600 font-bold uppercase tracking-widest">Atau Akses Instan Demo</span>
                      </div>
                    </div>

                    <div className="space-y-1.5" id="demo-quick-login-container">
                      <p className="text-[10px] text-slate-400 text-center font-medium leading-normal mb-2">
                        Gunakan salah satu kredensial bawaan berikut untuk langsung masuk otomatis ke dashboard monitoring piutang tanpa input manual:
                      </p>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                        <button
                          type="button"
                          onClick={() => handleInstantDemoLogin('SUPER_ADMIN')}
                          className="p-2.5 border border-violet-100 bg-violet-50/40 hover:bg-violet-100 text-violet-800 hover:text-violet-950 rounded-xl text-[10px] font-black text-center cursor-pointer transition-all flex flex-col justify-center items-center shadow-xs"
                          id="btn-demo-admin"
                        >
                          🛡️ Admin &amp; Direktur
                          <span className="text-[8px] font-semibold text-violet-500 font-mono mt-0.5">anditasb</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleInstantDemoLogin('SUPERVISOR')}
                          className="p-2.5 border border-indigo-100 bg-indigo-50/40 hover:bg-indigo-100 text-indigo-800 hover:text-indigo-950 rounded-xl text-[10px] font-black text-center cursor-pointer transition-all flex flex-col justify-center items-center shadow-xs"
                          id="btn-demo-supervisor"
                        >
                          💰 Spv Keuangan
                          <span className="text-[8px] font-semibold text-indigo-500 font-mono mt-0.5">hasrianti</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleInstantDemoLogin('STAFF')}
                          className="p-2.5 border border-amber-100 bg-amber-50/40 hover:bg-amber-100 text-amber-800 hover:text-amber-950 rounded-xl text-[10px] font-black text-center cursor-pointer transition-all flex flex-col justify-center items-center shadow-xs"
                          id="btn-demo-staff"
                        >
                          📋 Staf Administrasi
                          <span className="text-[8px] font-semibold text-amber-500 font-mono mt-0.5">muh.arash</span>
                        </button>
                      </div>
                    </div>
                  </>
                )}

                {/* Database Connection Diagnostic Panel */}
                <div className="mt-5 border-t border-slate-100 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowDbDiagnostics(!showDbDiagnostics)}
                    className="w-full flex items-center justify-between text-[10px] uppercase font-black tracking-wider text-slate-400 hover:text-indigo-600 transition-colors p-1.5 rounded-lg hover:bg-slate-50 cursor-pointer"
                  >
                    <span className="flex items-center gap-1.5 font-sans">
                      🛠️ Status &amp; Diagnostik Database
                    </span>
                    <span className="font-mono text-[9px]">
                      {showDbDiagnostics ? '[ SEMBUNYIKAN ]' : '[ DATA DIAGNOSTIK ]'}
                    </span>
                  </button>

                  {showDbDiagnostics && (
                    <div className="mt-3 p-3.5 bg-slate-50 border border-slate-200/50 rounded-xl text-[11px] text-slate-650 space-y-2.5 animate-fadeIn">
                      <div className="flex items-center justify-between font-bold">
                        <span>Mode Penyimpanan:</span>
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-black ${useLocalFallback ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'}`}>
                          <span className={`h-1 w-1 rounded-full ${useLocalFallback ? 'bg-amber-500' : 'bg-emerald-500 animate-pulse'}`} />
                          {useLocalFallback ? 'LocalStorage Fallback (Offline)' : 'Firebase Firestore (Live / Cloud)'}
                        </span>
                      </div>

                      <div className="space-y-1.5 bg-white p-2.5 rounded-lg border border-slate-200 font-mono text-[9px] leading-relaxed">
                        <div className="flex justify-between border-b border-slate-50 pb-1">
                          <span className="text-slate-400">PROJECT ID:</span>
                          <span className="font-bold text-slate-800 break-all text-right select-all pl-2">
                            {(import.meta as any).env.VITE_FIREBASE_PROJECT_ID || '(Kosong / Belum terdeteksi)'}
                          </span>
                        </div>
                        <div className="flex justify-between border-b border-slate-50 py-1">
                          <span className="text-slate-400">API KEY:</span>
                          <span className="font-bold text-slate-800 select-all">
                            {(import.meta as any).env.VITE_FIREBASE_API_KEY ? '✅ Tersedia (Terbaca)' : '❌ Kosong / Tidak Terbaca'}
                          </span>
                        </div>
                        <div className="flex justify-between py-0.5">
                          <span className="text-slate-400">DETEKSI PROYEK:</span>
                          <span className={`font-black ${isFirebaseConfigured ? 'text-emerald-600' : 'text-amber-600'}`}>
                            {isFirebaseConfigured ? '✅ TERASOSIASI DENGAN FIREBASE' : '❌ TIDAK TERKONEKSI'}
                          </span>
                        </div>
                      </div>

                      {firebaseError ? (
                        <div className="bg-rose-50 border border-rose-100 text-rose-700/90 p-3.5 rounded-xl text-[10px] space-y-2 font-sans leading-relaxed">
                          <div className="font-bold flex items-center gap-1.5 text-rose-800 text-[11px]">
                            <span>⚠️ Kendala Hubungan Cloud:</span>
                          </div>
                          <p>{firebaseError}</p>
                          <div className="pt-2 border-t border-rose-100/50 space-y-2">
                            <p className="font-bold text-rose-850">Mengapa ini terjadi saat deploy mandiri?</p>
                            <ol className="list-decimal pl-4.5 space-y-1.5 font-sans">
                              <li>
                                <strong>Firestore Belum Dibuat:</strong> Anda mungkin baru sekadar membuat <i>Proyek Firebase</i>, tapi belum mengaktifkan layanannya. Buka <a href="https://console.firebase.google.com/" target="_blank" rel="noopener noreferrer" className="font-bold underline text-rose-900 hover:text-indigo-600 transition-colors">Console Firebase</a>, masuk ke proyek <b>monitoring-piutang-1ff9c</b>, klik sidebar <b>Build ➔ Firestore Database</b>, dan buat basis datanya dengan menekan tombol <b>"Create Database"</b>.
                              </li>
                              <li>
                                <strong>Lokasi/Regional Firestore Tidak Sesuai:</strong> Pastikan Anda menggunakan lokasi database default, atau setel variabel lingkungan <code className="bg-rose-100/80 px-1 py-0.5 rounded font-mono text-rose-900">VITE_FIREBASE_FIRESTORE_DATABASE_ID</code> jika menggunakan database kustom non-default di Netlify.
                              </li>
                              <li>
                                <strong>Aturan Keamanan Memblokir (Security Rules):</strong> Di tab <b>Rules</b> pada Firestore Database, pastikan aturan Anda mengizinkan akses baca-tulis publik untuk pengujian:
                                <pre className="bg-slate-900/90 text-slate-100 p-2 rounded-lg text-[9px] font-mono mt-1 font-semibold overflow-x-auto select-all">
{`rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if true;
    }
  }
}`}
                                </pre>
                              </li>
                            </ol>
                          </div>
                        </div>
                      ) : (
                        !useLocalFallback && (
                          <div className="bg-emerald-50 text-emerald-700 p-2.5 rounded-xl text-[10px] leading-normal font-sans">
                            🎉 Koneksi sinkronisasi ke Firebase Firestore berhasil terhubung! Data Anda aman di Cloud.
                          </div>
                        )
                      )}

                      {useLocalFallback && isFirebaseConfigured && (
                        <div className="space-y-3 pt-1">
                          <button
                            type="button"
                            onClick={handleRetryFirebaseConnection}
                            className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 font-sans font-black text-white rounded-xl text-[10px] tracking-wider uppercase text-center shadow-lg shadow-indigo-100 hover:shadow-indigo-200 transition-all transform hover:-translate-y-0.5 cursor-pointer flex items-center justify-center gap-1.5"
                          >
                            🔄 Coba Sinkronisasi Ulang ke Firebase
                          </button>

                          <div className="text-[10px] text-slate-500 leading-relaxed bg-white p-2.5 rounded-lg border border-slate-150 font-sans">
                            💡 <strong>Petunjuk Penting Netlify Env:</strong> Jika variabel lingkungan di atas bernilai <code className="bg-slate-100 p-0.5 px-1 rounded font-mono text-slate-700">Kosong/Tidak Terbaca</code> padahal Anda telah mengisinya di dashboard Netlify, itu karena Vite membutuhkan variabel lingkungan saat proses build berlangsung.
                            <br />
                            <br />
                            <strong>Langkahnya:</strong> Anda wajib memicu bangun ulang sistem (**Trigger Deploy ➔ Deploy site**) di web Netlify setelah menyimpan variabel lingkungan tersebut agar bundler Vite memproses ulang dan membilas variabel lingkungan tersebut ke dalam file statis.
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
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
                    <div className="flex items-center gap-2 mt-0.5">
                      <p className="text-[10px] text-slate-500 font-bold uppercase">Sistem Monitoring Piutang</p>
                      <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[8px] font-black uppercase tracking-wider ${useLocalFallback ? 'bg-amber-50 text-amber-800 border border-amber-200' : 'bg-emerald-50 text-emerald-800 border border-emerald-200'}`}>
                        <span className={`h-1 w-1 rounded-full ${useLocalFallback ? 'bg-amber-500' : 'bg-emerald-500 animate-pulse'}`} />
                        {useLocalFallback ? '💾 Local' : '🔥 Firebase'}
                      </span>
                    </div>
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
                <div className="max-w-7xl mx-auto flex items-center py-1 overflow-x-auto no-scrollbar gap-4">
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
                  onPersistSetDoc={persistSetDoc}
                  onPersistDeleteDoc={persistDeleteDoc}
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
