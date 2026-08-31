// src/components/layout.tsx
import React, { ReactNode, useState } from 'react';
import {
  LayoutDashboard,
  Users,
  Wallet,
  Shield,
  Calendar,
  LogOut,
  Menu,
  Network,
  BookOpen,
  X,
  UserCog,
  KeyRound,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Eye as ViewIcon,
  FileSpreadsheet,
} from 'lucide-react';
import { Pengguna } from '../types';
import { cn } from '../lib/utils';
import { supabase } from '../supabase';

interface LayoutProps {
  user: Pengguna;
  activeTab: string;
  onNavigate: (tab: string) => void;
  onLogout: () => void;
  children: ReactNode;
}

export const Layout = ({ user, activeTab, onNavigate, onLogout, children }: LayoutProps) => {
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const isGuest = user.id_pengguna === 0;

  const [showChangePassModal, setShowChangePassModal] = useState(false);
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showOldPass, setShowOldPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);
  const [loadingChangePass, setLoadingChangePass] = useState(false);
  const [passErrorMsg, setPassErrorMsg] = useState('');
  const [passSuccessMsg, setPassSuccessMsg] = useState('');

  const isSuperAdmin = user.peran === 'Super_Admin';
  const isKependudukan = user.peran === 'Admin_Kependudukan' || isSuperAdmin;
  const isKeuangan = user.peran === 'Admin_Keuangan' || isSuperAdmin;
  const isSatpam = user.peran === 'Satpam' || isSuperAdmin;

  const navItems = [
    { id: 'dashboard', label: 'Dashboard Overview', icon: LayoutDashboard, show: true },
    { id: 'pengguna', label: 'Manajemen Akun', icon: UserCog, show: isSuperAdmin },
    { id: 'organisasi', label: 'Struktur Organisasi', icon: Network, show: true },
    { id: 'adart', label: 'AD/ART', icon: BookOpen, show: true },
    { id: 'kependudukan', label: 'Kependudukan', icon: Users, show: isKependudukan || isGuest },
    { id: 'keuangan', label: 'Keuangan Kas', icon: Wallet, show: isKeuangan || isGuest },
    { id: 'keamanan', label: 'Log Keamanan', icon: Shield, show: isSatpam },
    { id: 'dana_acara', label: 'Dana Acara', icon: Calendar, show: true },
    { id: 'data-import', label: 'Import Data Excel', icon: FileSpreadsheet, show: true },
  ];

  const handleNavigate = (tab: string) => {
    onNavigate(tab);
    setMobileSidebarOpen(false);
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPassErrorMsg('');
    setPassSuccessMsg('');

    if (isGuest) {
      setPassErrorMsg('Mode Tamu tidak dapat mengubah password.');
      return;
    }

    if (oldPassword.trim() !== (user.password || 'Beryl123')) {
      setPassErrorMsg('Password lama yang Anda masukkan salah!');
      return;
    }

    if (newPassword.trim().length < 6) {
      setPassErrorMsg('Password baru minimal harus 6 karakter!');
      return;
    }

    if (newPassword.trim() !== confirmPassword.trim()) {
      setPassErrorMsg('Konfirmasi password baru tidak cocok!');
      return;
    }

    setLoadingChangePass(true);

    try {
      const { error } = await supabase
        .from('pengguna')
        .update({ password: newPassword.trim() })
        .eq('id_pengguna', user.id_pengguna);

      if (error) throw error;

      user.password = newPassword.trim();
      setPassSuccessMsg('Password berhasil diperbarui!');

      setTimeout(() => {
        setShowChangePassModal(false);
        setOldPassword('');
        setNewPassword('');
        setConfirmPassword('');
        setPassSuccessMsg('');
      }, 1500);
    } catch (err: any) {
      setPassErrorMsg('Gagal memperbarui password: ' + err.message);
    } finally {
      setLoadingChangePass(false);
    }
  };

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      <div className="p-6 border-b border-slate-800 shrink-0">
        <h1 className="text-xl font-bold tracking-tight text-primary-400">BERYL SYSTEM</h1>
        <p className="text-xs text-slate-400 uppercase tracking-widest mt-1 font-semibold">
          Cluster Beryl - Maja
        </p>
      </div>

      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {navItems
          .filter((item) => item.show)
          .map((item) => (
            <button
              key={item.id}
              onClick={() => handleNavigate(item.id)}
              className={cn(
                'w-full flex items-center space-x-3 px-4 py-2.5 rounded-lg transition-all font-medium text-left text-sm',
                activeTab === item.id
                  ? 'bg-primary-600/15 text-primary-400 border border-primary-600/20'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              )}
            >
              <item.icon className="w-5 h-5 shrink-0 opacity-80" />
              <span className="truncate">{item.label}</span>
            </button>
          ))}
      </nav>

      {/* Profile & Action Buttons */}
      <div className="p-4 bg-slate-800/50 border-t border-slate-800 shrink-0 space-y-3">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-full bg-primary-500 flex items-center justify-center font-bold text-white text-lg shrink-0">
            {user.nama_lengkap.charAt(0)}
          </div>
          <div className="flex-1 text-left overflow-hidden min-w-0">
            <p className="text-sm font-semibold text-white truncate">{user.nama_lengkap}</p>
            <p className="text-[10px] text-slate-400 uppercase tracking-wider truncate flex items-center space-x-1">
              {isGuest && <ViewIcon className="w-3 h-3 text-amber-400 inline mr-1" />}
              <span>{isGuest ? 'Mode Tamu (View Only)' : user.peran.replace('_', ' ')}</span>
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          {!isGuest ? (
            <button
              onClick={() => setShowChangePassModal(true)}
              className="flex items-center justify-center space-x-1 px-2 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition-colors text-xs font-semibold"
              title="Ganti Password"
            >
              <KeyRound className="w-3.5 h-3.5 text-amber-400" />
              <span>Password</span>
            </button>
          ) : (
            <div className="px-2 py-2 bg-slate-800/50 text-slate-500 rounded-lg text-xs font-semibold text-center truncate">
              View Only
            </div>
          )}

          <button
            onClick={() => {
              onLogout();
              setMobileSidebarOpen(false);
            }}
            className="flex items-center justify-center space-x-1 px-2 py-2 bg-slate-800 hover:bg-red-500/20 hover:text-red-400 text-slate-300 rounded-lg transition-colors text-xs font-semibold"
            title="Keluar"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Keluar</span>
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 flex overflow-hidden">
      <aside className="w-64 bg-slate-900 text-white hidden md:flex flex-col shrink-0 fixed inset-y-0 left-0 z-30 shadow-xl">
        <SidebarContent />
      </aside>

      {mobileSidebarOpen && (
        <div className="md:hidden">
          <div
            className="fixed inset-0 bg-slate-900/60 z-40 backdrop-blur-sm transition-opacity"
            onClick={() => setMobileSidebarOpen(false)}
          />
          <aside className="fixed inset-y-0 left-0 w-72 bg-slate-900 text-white flex flex-col z-50 shadow-2xl animate-in slide-in-from-left duration-200">
            <button
              onClick={() => setMobileSidebarOpen(false)}
              className="absolute top-5 right-4 text-slate-400 hover:text-white transition-colors z-10 p-1"
            >
              <X className="w-5 h-5" />
            </button>
            <SidebarContent />
          </aside>
        </div>
      )}

      <main className="flex-1 flex flex-col min-w-0 md:ml-64 h-screen">
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 md:px-8 shrink-0 sticky top-0 z-20 shadow-sm">
          <button
            className="flex items-center justify-center p-2 -ml-2 md:hidden text-slate-500 hover:text-slate-800 transition-colors"
            onClick={() => setMobileSidebarOpen(true)}
            aria-label="Buka menu navigasi"
          >
            <Menu className="w-6 h-6" />
          </button>

          <h2 className="text-base font-semibold text-slate-700 hidden md:block">
            Beryl System (SIPEMA)
          </h2>

          <div className="flex items-center space-x-4 md:space-x-6 ml-auto">
            {isGuest ? (
              <span className="px-3 py-1 bg-amber-100 text-amber-800 border border-amber-200 rounded-full text-xs font-bold flex items-center space-x-1">
                <ViewIcon className="w-3.5 h-3.5" />
                <span>Mode Tamu (Akses View Only)</span>
              </span>
            ) : (
              <button
                onClick={() => setShowChangePassModal(true)}
                className="hidden sm:flex items-center space-x-1.5 px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
              >
                <KeyRound className="w-3.5 h-3.5 text-amber-500" />
                <span>Ganti Password</span>
              </button>
            )}

            <div className="text-right hidden sm:block">
              <p className="text-xs text-slate-500 font-medium">Masuk sebagai:</p>
              <p className="text-xs font-bold text-slate-900">{user.nama_lengkap}</p>
            </div>
            <div className="h-8 w-[1px] bg-slate-200 hidden sm:block" />
            <div className="w-8 h-8 rounded-full bg-primary-500 flex items-center justify-center font-bold text-white text-sm shadow-sm">
              {user.nama_lengkap.charAt(0)}
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-auto p-4 md:p-8 relative">
          <div className="max-w-6xl mx-auto space-y-6">{children}</div>
        </div>
      </main>

      {showChangePassModal && !isGuest && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 w-full max-w-md overflow-hidden relative p-6 space-y-4">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="font-bold text-slate-800 flex items-center space-x-2 text-sm">
                <KeyRound className="w-4 h-4 text-amber-500" />
                <span>Ganti Password Akun</span>
              </h3>
              <button
                onClick={() => {
                  setShowChangePassModal(false);
                  setPassErrorMsg('');
                  setPassSuccessMsg('');
                }}
                className="text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleChangePassword} className="space-y-4">
              {passErrorMsg && (
                <div className="p-3 text-xs font-medium text-red-700 bg-red-50 border border-red-200 rounded-lg flex items-center space-x-2">
                  <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
                  <span>{passErrorMsg}</span>
                </div>
              )}

              {passSuccessMsg && (
                <div className="p-3 text-xs font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg flex items-center space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>{passSuccessMsg}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">
                  Password Lama <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    required
                    type={showOldPass ? 'text' : 'password'}
                    value={oldPassword}
                    onChange={(e) => setOldPassword(e.target.value)}
                    placeholder="Masukkan password saat ini"
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm outline-none focus:border-primary-500 pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowOldPass(!showOldPass)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600"
                  >
                    {showOldPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">
                  Password Baru <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    required
                    type={showNewPass ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Minimal 6 karakter"
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm outline-none focus:border-primary-500 pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPass(!showNewPass)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600"
                  >
                    {showNewPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">
                  Konfirmasi Password Baru <span className="text-red-500">*</span>
                </label>
                <input
                  required
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Ulangi password baru"
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm outline-none focus:border-primary-500"
                />
              </div>

              <div className="pt-3 flex justify-end space-x-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    setShowChangePassModal(false);
                    setPassErrorMsg('');
                    setPassSuccessMsg('');
                  }}
                  className="px-4 py-2 border border-slate-200 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={loadingChangePass}
                  className="px-4 py-2 bg-primary-600 text-white rounded-lg text-xs font-semibold hover:bg-primary-700 flex items-center space-x-1.5"
                >
                  {loadingChangePass ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <span>Simpan Password</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};