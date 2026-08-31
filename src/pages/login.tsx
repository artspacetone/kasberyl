// src/pages/login.tsx
import React, { useState } from 'react';
import { Shield, User, Lock, Loader2, AlertCircle, Eye, EyeOff, UserCheck } from 'lucide-react';
import { Pengguna } from '../types';
import { supabase, isSupabaseConfigured } from '../supabase';

export const Login: React.FC<{ onLogin: (user: Pengguna) => void }> = ({ onLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');

    const inputUser = username.trim().toLowerCase();
    const inputPass = password.trim();

    try {
      // 1. Cek ke Database Supabase jika Online
      if (isSupabaseConfigured) {
        try {
          const { data, error } = await supabase
            .from('pengguna')
            .select('*')
            .ilike('nama_lengkap', username.trim())
            .eq('password', inputPass)
            .maybeSingle();

          if (!error && data) {
            const userSession: Pengguna = {
              id_pengguna: data.id_pengguna,
              nama_lengkap: data.nama_lengkap,
              peran: data.peran,
              id_rumah: data.id_rumah || 'Beryl-A1-01',
            };
            onLogin(userSession);
            return;
          }
        } catch (dbErr) {
          console.warn('Database cloud error/offline, mencoba otentikasi lokal...');
        }
      }

      // 2. Kredensial Fallback Super Admin
      if (
        (inputUser === 'super admin' || inputUser === 'admin' || inputUser === 'superadmin') &&
        (inputPass === 'AdminBeryl2026!' || inputPass === 'Beryl123')
      ) {
        onLogin({
          id_pengguna: 1,
          nama_lengkap: 'Super Admin',
          peran: 'Super_Admin',
          id_rumah: 'Beryl-A1-01',
        });
        return;
      }

      // 3. Kredensial Fallback Bendahara
      if (
        (inputUser === 'bendahara' || inputUser === 'keuangan') &&
        (inputPass === 'KeuanganBeryl2026!' || inputPass === 'Beryl123' || inputPass === 'AdminBeryl2026!')
      ) {
        onLogin({
          id_pengguna: 2,
          nama_lengkap: 'Bendahara Keuangan',
          peran: 'Admin_Keuangan',
          id_rumah: 'Beryl-A1-02',
        });
        return;
      }

      // 4. Kredensial Fallback Admin Kependudukan
      if (
        (inputUser === 'kependudukan' || inputUser === 'sekretaris') &&
        (inputPass === 'WargaBeryl2026!' || inputPass === 'Beryl123' || inputPass === 'AdminBeryl2026!')
      ) {
        onLogin({
          id_pengguna: 3,
          nama_lengkap: 'Admin Kependudukan',
          peran: 'Admin_Kependudukan',
          id_rumah: 'Beryl-A1-03',
        });
        return;
      }

      setErrorMsg('Username atau Password yang Anda masukkan salah!');
    } catch (err: any) {
      setErrorMsg('Terjadi kesalahan saat memproses login.');
    } finally {
      setLoading(false);
    }
  };

  const handleWargaGuestLogin = () => {
    onLogin({
      id_pengguna: 0,
      nama_lengkap: 'Warga / Tamu Beryl',
      peran: 'Warga',
      id_rumah: 'Beryl-Warga',
    });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900 p-4">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-100">
        <div className="p-8 text-center bg-gradient-to-b from-slate-900 via-slate-800 to-emerald-950 text-white">
          <div className="w-16 h-16 bg-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-xl shadow-emerald-600/30">
            <Shield className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-black tracking-tight">WARGA BERYL</h1>
          <p className="text-emerald-400 text-xs font-bold uppercase tracking-widest mt-1">Majelis Taklim Al Barokah</p>
          <div className="mt-3 inline-flex items-center space-x-1.5 px-3 py-1 bg-white/10 rounded-full text-[10px] text-emerald-200">
            <span>Sistem Informasi Tata Kelola & Keuangan Terpadu</span>
          </div>
        </div>

        <div className="p-8 space-y-5">
          <form onSubmit={handleLogin} className="space-y-4">
            {errorMsg && (
              <div className="p-3 text-xs font-medium text-red-700 bg-red-50 border border-red-200 rounded-xl flex items-start space-x-2 animate-in fade-in duration-200">
                <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                <span>{errorMsg}</span>
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-slate-600 uppercase mb-1">
                Username
              </label>
              <div className="relative">
                <User className="h-4 w-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  autoComplete="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Masukkan Username"
                  className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:border-emerald-500 focus:bg-white transition-all font-medium text-slate-800"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-600 uppercase mb-1">
                Kata Sandi
              </label>
              <div className="relative">
                <Lock className="h-4 w-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-9 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:border-emerald-500 focus:bg-white transition-all font-medium text-slate-800"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 transition-all shadow-md shadow-emerald-700/20 disabled:opacity-50 uppercase tracking-wider"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : 'Masuk Aplikasi Pengurus'}
            </button>
          </form>

          <div className="relative flex py-1 items-center">
            <div className="flex-grow border-t border-slate-200"></div>
            <span className="flex-shrink mx-3 text-[10px] font-bold text-slate-400 uppercase">Akses Warga</span>
            <div className="flex-grow border-t border-slate-200"></div>
          </div>

          <div className="space-y-2">
            <button
              type="button"
              onClick={handleWargaGuestLogin}
              className="w-full flex items-center justify-center space-x-2 py-3 px-4 bg-slate-100 hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-300 text-slate-700 rounded-xl text-xs font-bold border border-slate-200 transition-all uppercase tracking-wider"
            >
              <UserCheck className="w-4 h-4 text-emerald-600" />
              <span>Masuk Sebagai Warga / Tamu</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;