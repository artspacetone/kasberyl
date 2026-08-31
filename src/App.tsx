// src/App.tsx
import React, { useState, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { 
  Dashboard, 
  DataWarga, 
  InfaqBulananPage, 
  DanaAcaraPage,
  InfaqMajelisPage, 
  PengeluaranPage,
  PinjamanWargaPage, 
  LaporanBalance,
  AdArt,
  DataImport, 
  Login 
} from './pages';
import { Pengguna, canAccessFinance } from './types';
import { Menu, LogOut, Wifi, WifiOff, Eye, ShieldCheck, Lock } from 'lucide-react';
import { isSupabaseConfigured } from './supabase';

export default function App() {
  // Sesi Login Persisten
  const [currentUser, setCurrentUser] = useState<Pengguna | null>(() => {
    const saved = localStorage.getItem('beryl_auth_session');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return null;
      }
    }
    return null;
  });

  const [activeTab, setActiveTab] = useState('dashboard');
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLoginSuccess = (user: Pengguna) => {
    setCurrentUser(user);
    localStorage.setItem('beryl_auth_session', JSON.stringify(user));
    setActiveTab('dashboard');
  };

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem('beryl_auth_session');
  };

  if (!currentUser) {
    return <Login onLogin={handleLoginSuccess} />;
  }

  const isGuestOrWarga = currentUser.peran === 'Warga' || currentUser.id_pengguna === 0;
  const financeAllowed = canAccessFinance(currentUser);

  return (
    <div className="min-h-screen bg-slate-50 flex">
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        mobileOpen={mobileOpen}
        setMobileOpen={setMobileOpen}
        currentUser={currentUser}
      />

      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 bg-white border-b border-slate-200 px-4 md:px-8 flex items-center justify-between sticky top-0 z-30 shadow-2xs">
          <div className="flex items-center space-x-3">
            <button 
              onClick={() => setMobileOpen(true)}
              className="lg:hidden p-2 text-slate-600 hover:bg-slate-100 rounded-xl"
              aria-label="Buka Menu"
            >
              <Menu className="w-5 h-5" />
            </button>
            <h1 className="text-xs md:text-sm font-black text-slate-800 tracking-tight">
              Warga Beryl & Majelis Al Barokah
            </h1>
          </div>

          <div className="flex items-center space-x-3">
            {isGuestOrWarga ? (
              <span className="inline-flex items-center space-x-1 px-3 py-1 rounded-full bg-amber-50 text-amber-800 border border-amber-200 text-[10px] font-bold">
                <Eye className="w-3 h-3 text-amber-600" />
                <span>Mode Warga (Akses Terkunci)</span>
              </span>
            ) : isSupabaseConfigured ? (
              <span className="hidden sm:inline-flex items-center space-x-1 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold">
                <Wifi className="w-3 h-3 text-emerald-600" />
                <span>Cloud Online (Multi-Device)</span>
              </span>
            ) : (
              <span className="hidden sm:inline-flex items-center space-x-1 px-2.5 py-1 rounded-full bg-amber-50 text-amber-800 border border-amber-200 text-[10px] font-bold">
                <WifiOff className="w-3 h-3 text-amber-600" />
                <span>Offline Lokal PC</span>
              </span>
            )}

            <span className="text-xs font-bold text-slate-700 hidden sm:inline">
              {currentUser.nama_lengkap}
            </span>
            <button
              onClick={handleLogout}
              className="p-2 text-slate-400 hover:text-rose-600 rounded-xl hover:bg-rose-50 transition-colors"
              title="Keluar Akun"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </header>

        {/* Warning Banner jika Warga membuka tab yang tidak memiliki izin */}
        {!isSupabaseConfigured && !isGuestOrWarga && (
          <div className="bg-amber-500 text-white text-xs px-4 py-2 text-center font-bold">
            ⚠️ Perhatian Pengurus: Kredensial Supabase Cloud belum dipasang di Netlify. Data baru tersimpan di browser PC ini saja. Pasang VITE_SUPABASE_URL di Netlify agar HP dapat membaca data.
          </div>
        )}

        <main className="flex-1 p-4 md:p-8 max-w-7xl w-full mx-auto">
          {activeTab === 'dashboard' && <Dashboard />}
          {activeTab === 'warga' && <DataWarga user={currentUser} />}
          {activeTab === 'infaq_bulanan' && (financeAllowed ? <InfaqBulananPage currentUser={currentUser} /> : <LockedView />)}
          {activeTab === 'dana_acara' && (financeAllowed ? <DanaAcaraPage currentUser={currentUser} /> : <LockedView />)}
          {activeTab === 'infaq_majelis' && (financeAllowed ? <InfaqMajelisPage currentUser={currentUser} /> : <LockedView />)}
          {activeTab === 'pengeluaran' && (financeAllowed ? <PengeluaranPage currentUser={currentUser} /> : <LockedView />)}
          {activeTab === 'pinjaman' && (financeAllowed ? <PinjamanWargaPage currentUser={currentUser} /> : <LockedView />)}
          {activeTab === 'laporan' && (financeAllowed ? <LaporanBalance /> : <LockedView />)}
          {activeTab === 'adart' && <AdArt />}
          {activeTab === 'import' && (financeAllowed ? <DataImport user={currentUser} onImportSuccess={() => setActiveTab('dashboard')} /> : <LockedView />)}
        </main>
      </div>
    </div>
  );
}

// Komponen Fallback untuk Halaman Terkunci
const LockedView: React.FC = () => (
  <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center max-w-md mx-auto space-y-3 shadow-xs my-8">
    <div className="w-12 h-12 bg-rose-100 text-rose-600 rounded-2xl flex items-center justify-center mx-auto">
      <Lock className="w-6 h-6" />
    </div>
    <h3 className="font-bold text-base text-slate-800">Akses Modul Keuangan Dikunci</h3>
    <p className="text-xs text-slate-500 leading-relaxed">
      Halaman ini khusus untuk Pengurus Paguyuban / Bendahara terverifikasi. Akun Warga atau Tamu tidak diizinkan membuka catatan transaksi keuangan.
    </p>
  </div>
);