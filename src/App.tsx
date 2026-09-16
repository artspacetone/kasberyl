// src/App.tsx
import React, { useState } from 'react';
import { Sidebar } from './components/Sidebar';
import { BottomMobileNav } from './components/BottomMobileNav';
import { PWAInstallPrompt } from './components/PWAInstallPrompt';
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
  Login,
  Keamanan,
  Organisasi,
  PenggunaPage
} from './pages';
import { Pengguna } from './types';
import { Menu, LogOut, Wifi, WifiOff, Eye, Lock } from 'lucide-react';
import { isSupabaseConfigured } from './supabase';

export default function App() {
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
  const isSuperAdmin = currentUser.peran === 'Super_Admin';

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col lg:flex-row pb-16 lg:pb-0">
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        mobileOpen={mobileOpen}
        setMobileOpen={setMobileOpen}
        currentUser={currentUser}
      />

      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 bg-white border-b border-slate-200 px-4 md:px-8 flex items-center justify-between sticky top-0 z-30 shadow-xs">
          <div className="flex items-center space-x-3">
            <button 
              onClick={() => setMobileOpen(true)}
              className="lg:hidden p-2 text-slate-600 hover:bg-slate-100 rounded-xl"
              aria-label="Buka Menu"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-xs md:text-sm font-black text-slate-800 tracking-tight">
                Warga Beryl & Majelis Al Barokah
              </h1>
              <p className="text-[10px] text-slate-400 hidden sm:block">Cluster Beryl • Permata Mutiara Maja</p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            {isGuestOrWarga ? (
              <span className="inline-flex items-center space-x-1 px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-[10px] font-bold">
                <Eye className="w-3 h-3 text-emerald-600" />
                <span>Mode Warga (Transparansi Terbuka)</span>
              </span>
            ) : isSupabaseConfigured ? (
              <span className="hidden sm:inline-flex items-center space-x-1 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold">
                <Wifi className="w-3 h-3 text-emerald-600" />
                <span>Supabase Online</span>
              </span>
            ) : (
              <span className="hidden sm:inline-flex items-center space-x-1 px-2.5 py-1 rounded-full bg-amber-50 text-amber-800 border border-amber-200 text-[10px] font-bold">
                <WifiOff className="w-3 h-3 text-amber-600" />
                <span>Lokal Offline</span>
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

        {/* Notifikasi Status Mode Warga (Transparan & Aman) */}
        {isGuestOrWarga && (
          <div className="bg-emerald-50 border-b border-emerald-200 text-emerald-900 text-[11px] px-4 py-2 text-center font-medium">
            👋 <strong>Selamat Datang di Portal Warga Beryl:</strong> Seluruh modul keuangan kas, donasi acara, infaq majelis, dan data warga terbuka secara transparan dalam mode <em>Lihat Saja (View-Only)</em>.
          </div>
        )}

        {/* Konten Halaman: Seluruh Modul Terbuka untuk Mode Warga */}
        <main className="flex-1 p-4 md:p-8 max-w-7xl w-full mx-auto">
          {activeTab === 'dashboard' && <Dashboard />}
          {activeTab === 'warga' && <DataWarga user={currentUser} />}
          {activeTab === 'infaq_bulanan' && <InfaqBulananPage currentUser={currentUser} />}
          {activeTab === 'dana_acara' && <DanaAcaraPage currentUser={currentUser} />}
          {activeTab === 'infaq_majelis' && <InfaqMajelisPage currentUser={currentUser} />}
          {activeTab === 'pengeluaran' && <PengeluaranPage currentUser={currentUser} />}
          {activeTab === 'pinjaman' && <PinjamanWargaPage currentUser={currentUser} />}
          {activeTab === 'laporan' && <LaporanBalance />}
          {activeTab === 'keamanan' && <Keamanan user={currentUser} />}
          {activeTab === 'organisasi' && <Organisasi user={currentUser} />}
          {activeTab === 'pengguna' && (
            isSuperAdmin ? (
              <PenggunaPage currentUser={currentUser} />
            ) : (
              <div className="bg-white rounded-3xl border border-slate-200 p-10 text-center max-w-md mx-auto space-y-3 shadow-xs my-8">
                <div className="w-12 h-12 bg-purple-100 text-purple-600 rounded-2xl flex items-center justify-center mx-auto">
                  <Lock className="w-6 h-6" />
                </div>
                <h3 className="font-bold text-base text-slate-800">Manajemen Akun Khusus Super Admin</h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Pengaturan kata sandi dan hak akses akun pengurus hanya dapat dikelola oleh Super Admin.
                </p>
              </div>
            )
          )}
          {activeTab === 'adart' && <AdArt />}
          {activeTab === 'import' && <DataImport user={currentUser} onImportSuccess={() => setActiveTab('dashboard')} />}
        </main>
      </div>

      <BottomMobileNav
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenMenu={() => setMobileOpen(true)}
        currentUser={currentUser}
      />

      <PWAInstallPrompt />
    </div>
  );
}