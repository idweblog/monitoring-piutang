import React, { useState, useEffect } from 'react';
import { CompanySettings } from '../types';
import { 
  Check, 
  Smartphone, 
  Laptop, 
  Sparkles, 
  Share2, 
  Download, 
  Info, 
  ShieldCheck, 
  Layers, 
  Compass, 
  ChevronRight,
  UserCheck
} from 'lucide-react';

interface BrandingSettingsProps {
  settings: CompanySettings;
  onUpdateSettings: (updates: Partial<CompanySettings>) => void;
}

export const BrandingSettings: React.FC<BrandingSettingsProps> = ({
  settings,
  onUpdateSettings
}) => {
  const [selectedLogo, setSelectedLogo] = useState<string>(settings.activeLogoId || 'logo-growth');
  const [activePreviewDevice, setActivePreviewDevice] = useState<'mobile' | 'desktop'>('mobile');
  const [installPrompt, setInstallPrompt] = useState<any>(null);
  const [isInstalled, setIsInstalled] = useState<boolean>(false);
  const [pwaName, setPwaName] = useState<string>(settings.pwaName || '');
  const [pwaShortName, setPwaShortName] = useState<string>(settings.pwaShortName || '');

  // Synchronize state changes when settings update externally
  useEffect(() => {
    setPwaName(settings.pwaName || '');
    setPwaShortName(settings.pwaShortName || '');
    setSelectedLogo(settings.activeLogoId || 'logo-growth');
  }, [settings]);

  // Monitor dynamic PWA installation events
  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setInstallPrompt(e);
      console.log('[PWA] beforeinstallprompt event captured.');
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setInstallPrompt(null);
      console.log('[PWA] Financial app installed successfully on device!');
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    // Initial check
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const logoOptions = [
    {
      id: 'logo-growth',
      name: 'Emerald Growth Flow',
      desc: 'Simbol grafik pertumbuhan piutang lancar berkombinasi dengan perisai likuiditas aman.',
      file: '/logo-growth.svg',
      primaryColor: 'text-emerald-500',
      badgeBg: 'bg-emerald-500/10 text-emerald-500',
      tag: 'Default Korporat'
    },
    {
      id: 'logo-vault',
      name: 'Treasury Vault Lock',
      desc: 'Simbol ketahanan kas fisik dan rekening terproteksi layaknya brankas bank konsol.',
      file: '/logo-vault.svg',
      primaryColor: 'text-amber-500',
      badgeBg: 'bg-amber-500/10 text-amber-500',
      tag: 'Klasik Keuangan'
    },
    {
      id: 'logo-minimalist',
      name: 'Neon Interlocking MP',
      desc: 'Monogram modern huruf M & P (Monitoring Piutang) berpijar, berkarakter tekno modern.',
      file: '/logo-minimalist.svg',
      primaryColor: 'text-purple-500',
      badgeBg: 'bg-indigo-500/10 text-indigo-500',
      tag: 'Tech Modern'
    }
  ];

  // Instantly apply the chosen favicon logo directly into DOM
  const applyFaviconStyle = (logoId: string) => {
    const logoRel = logoId === 'logo-growth' ? '/logo-growth.svg' : logoId === 'logo-vault' ? '/logo-vault.svg' : '/logo-minimalist.svg';
    
    // 1. Update browser favicon tag
    const faviconLink = document.getElementById('favicon-link') as HTMLLinkElement;
    if (faviconLink) {
      faviconLink.href = logoRel;
    }
    
    // 2. Update Apple touch icon tracker
    const appleIcon = document.getElementById('apple-touch-icon') as HTMLLinkElement;
    if (appleIcon) {
      appleIcon.href = logoRel;
    }
  };

  const handleLogoSelect = (logoId: string) => {
    setSelectedLogo(logoId);
    applyFaviconStyle(logoId);
    onUpdateSettings({ activeLogoId: logoId });
  };

  const triggerPWAInstall = async () => {
    if (!installPrompt) return;
    installPrompt.prompt();
    const { outcome } = await installPrompt.userChoice;
    console.log(`[PWA] Pilihan pemasangan aplikasi oleh user: ${outcome}`);
    if (outcome === 'accepted') {
      setIsInstalled(true);
      setInstallPrompt(null);
    }
  };

  const activeLogoObj = logoOptions.find(opt => opt.id === selectedLogo) || logoOptions[0];

  return (
    <div className="space-y-6 max-w-6xl mx-auto p-1 font-sans">
      
      {/* Dynamic Jumbotron Header */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-2xl p-6 text-white text-left relative overflow-hidden shadow-xl border border-indigo-500/10" id="branding-jumbo">
        <div className="absolute -top-12 -right-12 h-44 w-44 bg-indigo-500 rounded-full opacity-10 blur-xl" />
        <div className="absolute -bottom-16 -left-16 h-52 w-52 bg-emerald-500 rounded-full opacity-10 blur-2xl" />
        
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="space-y-2">
            <span className="text-[9px] bg-indigo-500/25 border border-indigo-400/20 text-indigo-300 font-extrabold px-2.5 py-1 rounded-full uppercase tracking-wider inline-flex items-center gap-1.5">
              <Sparkles className="h-3 w-3 text-amber-400" /> Premium App Identity &amp; Mobilization
            </span>
            <h2 className="text-xl md:text-2xl font-black tracking-tight text-white leading-tight">
              Logo Kustom &amp; PWA Mobile Center
            </h2>
            <p className="text-xs text-slate-300 max-w-xl leading-relaxed">
              Personalisasi logo sistem dan pasang langsung aplikasi keuangan ini ke layar utama smartphone karyawan/pimpinan Anda layaknya aplikasi asli App Store / Play Store.
            </p>
          </div>
          
          <div className="shrink-0 flex items-center gap-2">
            <button
              type="button"
              onClick={() => setActivePreviewDevice('mobile')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                activePreviewDevice === 'mobile' 
                  ? 'bg-white text-indigo-950 shadow-md' 
                  : 'bg-white/10 hover:bg-white/20 text-slate-200'
              }`}
            >
              <Smartphone className="h-3.5 w-3.5" /> Mobile Screen
            </button>
            <button
              type="button"
              onClick={() => setActivePreviewDevice('desktop')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                activePreviewDevice === 'desktop' 
                  ? 'bg-white text-indigo-950 shadow-md' 
                  : 'bg-white/10 hover:bg-white/20 text-slate-200'
              }`}
            >
              <Laptop className="h-3.5 w-3.5" /> Web Interface
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left Side: Logo picker & PWA install specs */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* Logo Options Container */}
          <div className="bg-white border border-slate-100 rounded-xl shadow-sm p-5 space-y-4" id="logo-options-card">
            <div>
              <h3 className="text-sm font-black text-slate-800">1. Pilih Identitas Visual &amp; Logo Utama</h3>
              <p className="text-[11px] text-slate-400 mt-0.5">Semua pilihan logo berskala SVG murni untuk menjaga ketajaman resolusi ikon smartphone.</p>
            </div>

            <div className="space-y-3.5">
              {logoOptions.map((opt) => (
                <div 
                  key={opt.id}
                  onClick={() => handleLogoSelect(opt.id)}
                  className={`border rounded-xl p-4 flex items-center justify-between gap-4 cursor-pointer transition-all ${
                    selectedLogo === opt.id 
                      ? 'border-indigo-500 bg-indigo-50/20 shadow-sm' 
                      : 'border-slate-100 hover:border-slate-200 hover:bg-slate-50/50'
                  }`}
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div className="h-14 w-14 rounded-xl border border-slate-200/50 overflow-hidden bg-slate-900 shrink-0 p-1.5 flex items-center justify-center">
                      <img 
                        src={opt.file} 
                        alt={opt.name} 
                        className="h-full w-full object-contain"
                        referrerPolicy="no-referrer"
                      />
                    </div>
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-black text-slate-800 tracking-tight">{opt.name}</span>
                        <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded ${opt.badgeBg}`}>
                          {opt.tag}
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-400 leading-normal">{opt.desc}</p>
                    </div>
                  </div>

                  <div className="shrink-0">
                    <div className={`h-6 w-6 rounded-full flex items-center justify-center border transition-all ${
                      selectedLogo === opt.id 
                        ? 'bg-indigo-600 border-indigo-600 text-white' 
                        : 'border-slate-200 bg-white'
                    }`}>
                      {selectedLogo === opt.id && <Check className="h-3.5 w-3.5 stroke-[3]" />}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* PWA Custom Name form card */}
          <div className="bg-white border border-slate-100 rounded-xl shadow-sm p-5 space-y-4 animate-fadeIn" id="pwa-naming-card">
            <div className="flex items-start justify-between gap-4 flex-col sm:flex-row">
              <div>
                <h3 className="text-sm font-black text-slate-800">2. Sesuaikan Nama Aplikasi PWA</h3>
                <p className="text-[11px] text-slate-400 mt-0.5">Nama yang akan tertera saat pimpinan atau rekanan memasang aplikasi ini di layar utama HP mereka.</p>
              </div>
              <button
                type="button"
                onClick={() => {
                  onUpdateSettings({ pwaName, pwaShortName });
                  alert('Sukses menyimpan penyesuaian nama PWA ke database!');
                }}
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs py-2 px-3.5 rounded-xl shadow-sm transition-colors cursor-pointer flex items-center gap-1.5 self-end sm:self-start"
              >
                <Check className="h-3.5 w-3.5" /> Simpan Nama PWA
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-500 uppercase block">Nama Lengkap Aplikasi PWA</label>
                <input
                  type="text"
                  value={pwaName}
                  onChange={(e) => setPwaName(e.target.value)}
                  onBlur={() => onUpdateSettings({ pwaName })}
                  placeholder={`Monitoring Piutang ${settings.namaPerusahaan}`}
                  className="w-full text-xs font-semibold p-2.5 bg-slate-50 border border-slate-205 rounded-lg focus:outline-none focus:border-indigo-500 transition-all font-sans text-slate-800"
                />
                <span className="text-[9.5px] text-slate-400 block mt-1">Muncul pada splash screen penginstalan awal (Auto-Save saat beralih fokus).</span>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-500 uppercase block">Nama Pendek (Di Bawah Ikon HP)</label>
                <input
                  type="text"
                  maxLength={12}
                  value={pwaShortName}
                  onChange={(e) => setPwaShortName(e.target.value)}
                  onBlur={() => onUpdateSettings({ pwaShortName })}
                  placeholder="Piutang"
                  className="w-full text-xs font-semibold p-2.5 bg-slate-50 border border-slate-205 rounded-lg focus:outline-none focus:border-indigo-500 transition-all font-sans text-slate-800"
                />
                <span className="text-[9.5px] text-slate-400 block mt-1">Maksimal 12 karakter agar tidak terpotong (...) (Auto-Save saat beralih fokus).</span>
              </div>
            </div>
          </div>

          {/* PWA State and Installation Prompt Box */}
          <div className="bg-white border border-slate-100 rounded-xl shadow-sm p-5 space-y-4" id="pwa-launcher-card">
            <div>
              <span className="text-[8px] tracking-widest font-black uppercase text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded inline-block">
                STANDALONE INTEGRATION
              </span>
              <h3 className="text-sm font-black text-slate-800 mt-2">3. Status Pemasangan Aplikasi (PWA)</h3>
              <p className="text-[11px] text-slate-400 mt-0.5">Pemasangan via Progressive Web App memperlakukan dashboard ini sebagai aplikasi mandiri di HP.</p>
            </div>

            <div className="bg-slate-50 border border-slate-100 p-4 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-tight block">Kondisi Saat Ini</span>
                {isInstalled ? (
                  <div className="flex items-center gap-2 text-emerald-700 font-extrabold text-xs">
                    <span className="h-2 w-2 rounded-full bg-emerald-500 animate-ping inline-block" />
                    <span className="text-[11px] bg-emerald-50 p-1 px-2.5 rounded-lg border border-emerald-100">
                      Telah Terpasang di Home Screen
                    </span>
                  </div>
                ) : installPrompt ? (
                  <div className="flex items-center gap-2 text-indigo-700 font-extrabold text-xs">
                    <span className="h-2 w-2 rounded-full bg-indigo-500 inline-block animate-pulse" />
                    <span className="text-[11px] bg-indigo-50 p-1 px-2.5 rounded-lg border border-indigo-100">
                      Siap Dipasang Langsung (Install Available)
                    </span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-amber-700 font-extrabold text-xs">
                    <span className="h-2 w-2 rounded-full bg-amber-500 inline-block" />
                    <span className="text-[11px] bg-amber-50 p-1 px-2.5 rounded-lg border border-amber-100">
                      Buka via Browser (Dukungan Offline Aktif)
                    </span>
                  </div>
                )}
              </div>

              {installPrompt && (
                <button
                  type="button"
                  onClick={triggerPWAInstall}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs px-4 py-2.5 rounded-xl shadow-lg shadow-indigo-150 transition-all flex items-center justify-center gap-2 cursor-pointer self-start sm:self-center"
                >
                  <Download className="h-4 w-4" /> Pasang Aplikasi Sekarang
                </button>
              )}
            </div>

            {/* Offline Specs Notification */}
            <div className="flex gap-2.5 bg-indigo-50/40 p-3.5 rounded-xl border border-indigo-100/50 text-[10.5px] text-indigo-950 leading-relaxed">
              <Info className="h-4.5 w-4.5 text-indigo-600 shrink-0 mt-0.5" />
              <div className="space-y-0.5">
                <span className="font-bold block">Keuntungan Aplikasi PWA Rekanan:</span>
                <span className="block text-[10px] text-slate-400">
                  • Berjalan lancar tanpa browser address bar (fitur full-screen penuh).<br/>
                  • Akses offline terhadap database piutang lokal yang tersimpan di HP.<br/>
                  • Membuka aplikasi secepat kilat berkat Service Worker caching.<br/>
                  • Hemat kuota dan alokasi memori internal di ponsel Anda.
                </span>
              </div>
            </div>
          </div>

        </div>

        {/* Right Side: High-fidelity Live mockup previews */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white border border-slate-100 rounded-xl shadow-sm p-4 space-y-4">
            <h3 className="text-xs font-black text-slate-400 tracking-wider uppercase">Live Visual Mockup</h3>
            
            {activePreviewDevice === 'mobile' ? (
              /* High fidelity mobile phone simulator container with chosen logo */
              <div className="mx-auto max-w-[280px] bg-slate-950 border-[6px] border-slate-800 rounded-[40px] p-2 relative shadow-2xl overflow-hidden aspect-[9/16]" id="phone-simulator">
                {/* Speaker pill notch */}
                <div className="absolute top-0.5 left-1/2 transform -translate-x-1/2 h-4 w-28 bg-slate-800 rounded-full z-20 flex items-center justify-center">
                  <div className="h-1 w-8 bg-slate-900 rounded-full" />
                </div>

                <div className="bg-slate-900 h-full w-full rounded-[32px] overflow-hidden relative flex flex-col justify-between">
                  
                  {/* Phone Status bar */}
                  <div className="flex justify-between items-center px-4 pt-1.5 text-slate-400 font-bold font-mono text-[8px] z-10">
                    <span>9:41</span>
                    <div className="flex items-center gap-1">
                      <span>5G</span>
                      <div className="h-2 w-4 border border-slate-400 rounded-sm p-0.5 flex items-center">
                        <div className="h-full w-full bg-slate-400 rounded-2xs" />
                      </div>
                    </div>
                  </div>

                  {/* App Drawer Main Screen - Icons Grid layout */}
                  <div className="flex-1 p-3 flex flex-col justify-between pt-6">
                    
                    {/* Simulated Widget Space */}
                    <div className="bg-white/10 backdrop-blur rounded-xl p-2 text-white font-sans text-left space-y-1">
                      <span className="text-[7px] opacity-60 font-black block leading-none uppercase">PIUTANG UTAMA</span>
                      <span className="text-[11px] font-black block leading-none">{settings.namaPerusahaan}</span>
                      <div className="flex justify-between items-center pt-1 border-t border-white/5">
                        <span className="text-[7px] text-emerald-400 font-extrabold leading-none">PWA AKTIF</span>
                        <span className="text-[8px] opacity-80 leading-none">100% Secure</span>
                      </div>
                    </div>

                    {/* App Grid Icon Simulator */}
                    <div className="grid grid-cols-4 gap-3 py-6">
                      
                      {/* Active PWA Icon */}
                      <div className="flex flex-col items-center gap-1">
                        <div className="h-11 w-11 rounded-xl bg-[#090d16] p-1.5 flex items-center justify-center shadow-lg transform active:scale-95 transition-all cursor-pointer border border-white/10">
                          <img 
                            src={activeLogoObj.file} 
                            alt="Brand Logo" 
                            className="h-full w-full object-contain"
                            referrerPolicy="no-referrer"
                          />
                        </div>
                        <span className="text-[8px] text-white font-extrabold tracking-tight truncate w-full text-center">
                          {pwaShortName || 'Piutang'}
                        </span>
                      </div>

                      {/* Fake dummy icons */}
                      {[
                        { name: 'WhatsUp', bg: 'bg-green-600', icon: '💬' },
                        { name: 'Bank BCA', bg: 'bg-blue-700', icon: '🏦' },
                        { name: 'Mail', bg: 'bg-indigo-600', icon: '✉️' },
                        { name: 'Safari', bg: 'bg-sky-500', icon: '🌐' },
                        { name: 'Settings', bg: 'bg-slate-600', icon: '⚙️' },
                        { name: 'Maps', bg: 'bg-emerald-500', icon: '📍' },
                        { name: 'File', bg: 'bg-amber-500', icon: '📁' },
                      ].map((dummy, index) => (
                        <div key={index} className="flex flex-col items-center gap-1 opacity-50">
                          <div className={`h-11 w-11 rounded-xl ${dummy.bg} flex items-center justify-center text-xs shadow`}>
                            {dummy.icon}
                          </div>
                          <span className="text-[8px] text-white/80 font-medium tracking-tight truncate w-full text-center">{dummy.name}</span>
                        </div>
                      ))}

                    </div>

                    {/* Onboarding hint display inside screen */}
                    <div className="bg-slate-950/70 p-2 border border-slate-800/40 rounded-xl text-center">
                      <p className="text-[8px] font-black text-indigo-400 uppercase tracking-widest leading-none">Petunjuk Instalasi</p>
                      <p className="text-[7.5px] text-slate-400 mt-1 leading-normal">
                        Buka browser HP, pilih <span className="text-white font-extrabold">"Tambahkan ke Layar Utama / Add to Home"</span> via tombol Bagikan (iOS) atau Menu (Android).
                      </p>
                    </div>

                  </div>

                  {/* Phone Bottom bar */}
                  <div className="h-1 w-24 bg-white/40 rounded-full mx-auto mb-1.5" />
                </div>
              </div>
            ) : (
              /* Desktop web application dashboard header mockup view */
              <div className="border border-slate-200/80 rounded-xl overflow-hidden shadow bg-slate-50 font-sans text-left aspect-[4/3] flex flex-col" id="desktop-simulator">
                
                {/* Browser Tab Line */}
                <div className="bg-slate-200 p-1.5 px-3 flex items-center gap-2 text-[8px] border-b border-slate-350">
                  <div className="flex gap-1">
                    <span className="h-2 w-2 rounded-full bg-rose-400" />
                    <span className="h-2 w-2 rounded-full bg-amber-400" />
                    <span className="h-2 w-2 rounded-full bg-emerald-400" />
                  </div>
                  <div className="bg-white px-2.5 py-0.5 rounded border border-slate-250 flex items-center gap-1.5 font-bold text-slate-600 w-44 truncate">
                    <img src={activeLogoObj.file} alt="Tab favicon" className="h-2.5 w-2.5 object-contain" referrerPolicy="no-referrer" />
                    <span>{pwaName || `Monitoring Piutang - ${settings.namaPerusahaan}`}</span>
                  </div>
                </div>

                {/* Simulated Header Interface */}
                <div className="bg-white border-b border-slate-100 p-2.5 flex items-center justify-between shadow-xs">
                  <div className="flex items-center gap-1.5">
                    <div className="h-6 w-6 rounded-md overflow-hidden bg-slate-900 p-0.5 flex items-center justify-center">
                      <img src={activeLogoObj.file} alt="Mock header logo" className="h-full w-full object-contain" referrerPolicy="no-referrer" />
                    </div>
                    <div>
                      <span className="text-[8px] font-black text-slate-800 leading-none block">{settings.namaPerusahaan}</span>
                      <span className="text-[6.5px] text-slate-400 leading-none uppercase block tracking-wider mt-0.5">Sistem Monitoring Piutang</span>
                    </div>
                  </div>
                  <div className="bg-indigo-50 border border-indigo-100 font-extrabold text-[7px] text-indigo-700 px-1.5 py-0.5 rounded">
                    Admin Panel
                  </div>
                </div>

                {/* Dashboard body mockup contents */}
                <div className="flex-1 p-3 space-y-2 max-h-[160px] overflow-hidden">
                  <div className="h-12 bg-white rounded border border-slate-100 p-2 flex justify-between items-center">
                    <div>
                      <span className="text-[6px] text-slate-400 uppercase tracking-tight block">Piutang Berjalan</span>
                      <span className="text-[10px] font-black text-slate-800 leading-tight block">Rp 492.510.000</span>
                    </div>
                    <span className="h-5 w-5 bg-indigo-50 text-indigo-600 rounded flex items-center justify-center text-[8px] font-bold">📈</span>
                  </div>
                  <div className="h-10 bg-white rounded border border-slate-100 p-2 flex justify-between items-center opacity-60">
                    <div>
                      <span className="text-[6px] text-slate-400 uppercase tracking-tight block">Kas Terkonsolidasi</span>
                      <span className="text-[10px] font-black text-emerald-600 leading-tight block">Rp 123.820.000</span>
                    </div>
                    <span className="h-5 w-5 bg-emerald-50 text-emerald-600 rounded flex items-center justify-center text-[8px] font-bold">💳</span>
                  </div>
                </div>

                <div className="p-2 border-t border-slate-150 bg-slate-100 text-center text-[7px] text-slate-400 font-bold leading-normal">
                  Simulasi tampilan browser atas logo yang Anda pilih.
                </div>
              </div>
            )}
          </div>

          {/* Interactive Step-by-Step guides */}
          <div className="bg-white border border-slate-100 rounded-xl shadow-sm p-4 space-y-4">
            <h3 className="text-xs font-black text-slate-850 uppercase tracking-wider flex items-center gap-1.5">
              <Compass className="h-4 w-4 text-indigo-500" /> Cara Instalasi Ponsel Manual
            </h3>

            <div className="space-y-3">
              {/* iOS Safari */}
              <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl space-y-2">
                <span className="text-[8px] font-black text-indigo-600 tracking-wider bg-indigo-100/60 px-2 py-0.5 rounded uppercase">iOS (iPhone Safari)</span>
                <ol className="text-[9.5px] text-slate-500 space-y-1.5 list-none">
                  <li className="flex items-start gap-2">
                    <span className="h-4 w-4 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center text-[8px] font-black shrink-0 mt-0.5">1</span>
                    <span>Buka URL website ini di browser <span className="font-extrabold text-slate-700">Safari</span> pada iPhone Anda.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="h-4 w-4 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center text-[8px] font-black shrink-0 mt-0.5">2</span>
                    <span>Tap tombol <span className="font-extrabold text-indigo-600 flex inline-flex items-center gap-0.5">Bagikan <Share2 className="h-3 w-3 inline" /></span> di menu bar bawah.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="h-4 w-4 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center text-[8px] font-black shrink-0 mt-0.5">3</span>
                    <span>Scroll ke bawah dan tap <span className="font-extrabold text-slate-700">"Tambahkan ke Layar Utama" (Add to Home Screen)</span>.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="h-4 w-4 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center text-[8px] font-black shrink-0 mt-0.5">4</span>
                    <span>Beri nama "Piutang" dan tekan <span className="font-extrabold text-emerald-600">"Tambah" (Add)</span>. Ikon cantik akan muncul di menu HP!</span>
                  </li>
                </ol>
              </div>

              {/* Android Chrome */}
              <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl space-y-2">
                <span className="text-[8px] font-black text-emerald-700 tracking-wider bg-emerald-100/60 px-2 py-0.5 rounded uppercase">Android (Chrome)</span>
                <ol className="text-[9.5px] text-slate-500 space-y-1.5 list-none">
                  <li className="flex items-start gap-2">
                    <span className="h-4 w-4 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center text-[8px] font-black shrink-0 mt-0.5">1</span>
                    <span>Buka URL di <span className="font-extrabold text-slate-700">Google Chrome</span> Android.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="h-4 w-4 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center text-[8px] font-black shrink-0 mt-0.5">2</span>
                    <span>Klik simbol tiga titik <span className="font-bold text-slate-700">(Menu)</span> di kanan atas layar.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="h-4 w-4 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center text-[8px] font-black shrink-0 mt-0.5">3</span>
                    <span>Klik <span className="font-extrabold text-slate-700">"Instal Aplikasi"</span> atau <span className="font-extrabold text-slate-700">"Tambahkan ke Layar Utama"</span>.</span>
                  </li>
                </ol>
              </div>
            </div>
          </div>
        </div>

      </div>

    </div>
  );
};
