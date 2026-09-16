// src/pages/pengguna.tsx
import React, { useEffect, useState, useMemo } from 'react';
import { 
  UserPlus, Search, Edit2, Trash2, Key, X, UserCog, 
  ArrowUpDown, ArrowUp, ArrowDown, CheckCircle2, 
  Shield, User, Lock, RotateCcw, Home
} from 'lucide-react';
import { Pengguna, Warga } from '../types';
import { supabase, isSupabaseConfigured } from '../supabase';
import { WargaSearchSelect } from '../components/WargaSearchSelect';

// Akun Default Sistem
const DEFAULT_USERS: Pengguna[] = [
  { id_pengguna: 1, nama_lengkap: 'Super Admin', peran: 'Super_Admin', id_rumah: 'Beryl-A1-01', password: 'AdminBeryl2026!' },
  { id_pengguna: 2, nama_lengkap: 'Bendahara Keuangan', peran: 'Admin_Keuangan', id_rumah: 'Beryl-A1-02', password: 'KeuanganBeryl2026!' },
  { id_pengguna: 3, nama_lengkap: 'Admin Kependudukan', peran: 'Admin_Kependudukan', id_rumah: 'Beryl-A1-03', password: 'WargaBeryl2026!' },
  { id_pengguna: 4, nama_lengkap: 'Satpam Beryl', peran: 'Satpam', id_rumah: 'Pos-Security', password: 'SatpamBeryl2026!' },
];

export const PenggunaPage = ({ currentUser }: { currentUser: Pengguna }) => {
  const [users, setUsers] = useState<Pengguna[]>([]);
  const [wargaList, setWargaList] = useState<Warga[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  
  // Modals
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState<Pengguna | null>(null);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  // Form Mode: 'pilih_warga' (Ambil dari data warga) vs 'manual' (Akun Satpam/Khusus)
  const [userFormMode, setUserFormMode] = useState<'pilih_warga' | 'manual'>('pilih_warga');
  const [selectedWargaId, setSelectedWargaId] = useState<string>('');

  // Form State Akun
  const [formData, setFormData] = useState({
    nama_lengkap: '',
    peran: 'Warga' as Pengguna['peran'],
    id_rumah: '',
    password: 'Beryl123',
  });

  // Sort State
  const [sortField, setSortField] = useState<string>('id_pengguna');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3000);
  };

  // =========================================================================
  // LOAD DATA PENGGUNA & DATA WARGA
  // =========================================================================
  const loadData = async () => {
    setLoading(true);
    let loadedUsers: Pengguna[] = [];
    let loadedWarga: Warga[] = [];

    // 1. Ambil dari Cache Lokal
    const localUsers = localStorage.getItem('local_pengguna');
    if (localUsers) {
      try { loadedUsers = JSON.parse(localUsers); } catch (e) {}
    }

    const localW = localStorage.getItem('local_warga');
    if (localW) {
      try { loadedWarga = JSON.parse(localW); } catch (e) {}
    }

    // 2. Ambil dari Supabase jika Online
    if (isSupabaseConfigured) {
      try {
        const [resUsers, resWarga] = await Promise.all([
          supabase.from('pengguna').select('*').order('id_pengguna', { ascending: true }),
          supabase.from('warga').select('*').order('id_rumah', { ascending: true }).limit(2000),
        ]);

        if (resUsers.data && resUsers.data.length > 0) {
          loadedUsers = resUsers.data;
          localStorage.setItem('local_pengguna', JSON.stringify(loadedUsers));
        }

        if (resWarga.data && resWarga.data.length > 0) {
          loadedWarga = resWarga.data;
          localStorage.setItem('local_warga', JSON.stringify(loadedWarga));
        }
      } catch (err: any) {
        console.warn('Fallback offline pengguna:', err.message);
      }
    }

    // Gunakan default awal jika pengguna masih kosong
    if (loadedUsers.length === 0) {
      loadedUsers = DEFAULT_USERS;
      localStorage.setItem('local_pengguna', JSON.stringify(DEFAULT_USERS));
    }

    setUsers(loadedUsers);
    setWargaList(loadedWarga);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  // Sortir
  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortOrder(prev => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  const renderSortIcon = (field: string) => {
    if (sortField !== field) return <ArrowUpDown className="w-3 h-3 text-slate-400 inline ml-1 opacity-60" />;
    return sortOrder === 'asc' ? (
      <ArrowUp className="w-3.5 h-3.5 text-primary-600 inline ml-1" />
    ) : (
      <ArrowDown className="w-3.5 h-3.5 text-primary-600 inline ml-1" />
    );
  };

  // =========================================================================
  // BUKA MODAL TAMBAH AKUN BARU
  // =========================================================================
  const handleOpenAdd = () => {
    setEditingUser(null);
    setSelectedWargaId('');
    setUserFormMode('pilih_warga');
    setFormData({
      nama_lengkap: '',
      peran: 'Warga',
      id_rumah: '',
      password: 'Beryl123',
    });
    setShowModal(true);
  };

  // =========================================================================
  // BUKA MODAL EDIT AKUN
  // =========================================================================
  const handleOpenEdit = (u: Pengguna) => {
    setEditingUser(u);
    setUserFormMode('manual');
    setFormData({
      nama_lengkap: u.nama_lengkap,
      peran: u.peran,
      id_rumah: u.id_rumah || '',
      password: u.password || 'Beryl123',
    });
    setShowModal(true);
  };

  // =========================================================================
  // KETIKA WARGA DIPILIH DARI DROPDOWN PENCARIAN CERDAS (AUTO-FILL)
  // =========================================================================
  const handleSelectWarga = (w: Warga | null) => {
    if (!w) {
      setSelectedWargaId('');
      setFormData(prev => ({ ...prev, nama_lengkap: '', id_rumah: '' }));
      return;
    }

    setSelectedWargaId(String(w.id_warga));
    // Auto-fill nama dan nomor rumah
    setFormData(prev => ({
      ...prev,
      nama_lengkap: w.nama_lengkap,
      id_rumah: w.id_rumah,
      password: prev.password || 'Beryl123'
    }));
  };

  // =========================================================================
  // SIMPAN AKUN (INSERT / UPDATE)
  // =========================================================================
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.nama_lengkap.trim()) {
      alert('Nama lengkap / Username tidak boleh kosong!');
      return;
    }

    const payload = {
      nama_lengkap: formData.nama_lengkap.trim(),
      peran: formData.peran,
      id_rumah: formData.id_rumah.trim() || null,
      password: formData.password.trim() || 'Beryl123',
    };

    let generatedId = Date.now();

    if (isSupabaseConfigured) {
      try {
        if (editingUser) {
          await supabase.from('pengguna').update(payload).eq('id_pengguna', editingUser.id_pengguna);
        } else {
          const { data, error } = await supabase.from('pengguna').insert([payload]).select();
          if (!error && data && data[0]) {
            generatedId = data[0].id_pengguna;
          }
        }
      } catch (err: any) {
        console.warn('Simpan akun offline:', err.message);
      }
    }

    let updatedUsers: Pengguna[] = [];
    if (editingUser) {
      updatedUsers = users.map(u => u.id_pengguna === editingUser.id_pengguna ? { ...u, ...payload } : u);
    } else {
      const newAcc: Pengguna = {
        id_pengguna: generatedId,
        ...payload,
        id_rumah: payload.id_rumah || '-'
      };
      updatedUsers = [newAcc, ...users];
    }

    setUsers(updatedUsers);
    localStorage.setItem('local_pengguna', JSON.stringify(updatedUsers));
    setShowModal(false);
    showToast(editingUser ? '✓ Akun berhasil diperbarui!' : '✓ Akun baru berhasil dibuat!');
  };

  // =========================================================================
  // HAPUS AKUN PENGGUNA
  // =========================================================================
  const handleDelete = async (id: number, nama: string) => {
    if (id === currentUser.id_pengguna) {
      alert('Anda tidak dapat menghapus akun Anda sendiri yang sedang aktif digunakan!');
      return;
    }

    if (!confirm(`Hapus akun login "${nama}"? Pengguna tidak akan bisa masuk lagi.`)) return;

    if (isSupabaseConfigured) {
      try {
        await supabase.from('pengguna').delete().eq('id_pengguna', id);
      } catch (err) {}
    }

    const updated = users.filter(u => u.id_pengguna !== id);
    setUsers(updated);
    localStorage.setItem('local_pengguna', JSON.stringify(updated));
    showToast(`❌ Akun "${nama}" berhasil dihapus.`);
  };

  // =========================================================================
  // RESET PASSWORD KE DEFAULT (Beryl123)
  // =========================================================================
  const handleQuickResetPassword = async (u: Pengguna) => {
    if (!confirm(`Reset kata sandi akun "${u.nama_lengkap}" menjadi "Beryl123"?`)) return;

    if (isSupabaseConfigured) {
      try {
        await supabase.from('pengguna').update({ password: 'Beryl123' }).eq('id_pengguna', u.id_pengguna);
      } catch (e) {}
    }

    const updated = users.map(acc => acc.id_pengguna === u.id_pengguna ? { ...acc, password: 'Beryl123' } : acc);
    setUsers(updated);
    localStorage.setItem('local_pengguna', JSON.stringify(updated));
    showToast(`🔑 Password "${u.nama_lengkap}" di-reset ke: Beryl123`);
  };

  // PENCARIAN FLEKSIBEL
  const q = search.toLowerCase().trim();
  const sortedUsers = useMemo(() => {
    return [...users]
      .filter(u => {
        if (!q) return true;
        const matchNama = (u.nama_lengkap || '').toLowerCase().includes(q);
        const matchPeran = (u.peran || '').toLowerCase().includes(q);
        const matchRumah = (u.id_rumah || '').toLowerCase().includes(q);
        return matchNama || matchPeran || matchRumah;
      })
      .sort((a: any, b: any) => {
        let valA = a[sortField] || '';
        let valB = b[sortField] || '';
        let comp = String(valA).localeCompare(String(valB), undefined, { numeric: true, sensitivity: 'base' });
        return sortOrder === 'asc' ? comp : -comp;
      });
  }, [users, q, sortField, sortOrder]);

  const getRoleBadge = (peran: string) => {
    switch (peran) {
      case 'Super_Admin':
        return 'bg-purple-100 text-purple-800 border-purple-300';
      case 'Admin_Keuangan':
        return 'bg-emerald-100 text-emerald-800 border-emerald-300';
      case 'Admin_Kependudukan':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'Satpam':
        return 'bg-amber-100 text-amber-800 border-amber-300';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Toast Alert */}
      {toastMsg && (
        <div className="fixed top-20 right-4 z-50 px-4 py-2.5 bg-slate-900 text-white rounded-2xl shadow-xl text-xs font-bold flex items-center space-x-2 animate-in slide-in-from-top-3 border border-slate-700">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* Header Halaman */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <UserCog className="w-6 h-6 text-primary-600" />
            <h2 className="text-xl font-black text-slate-800 tracking-tight">Manajemen Akun Pengguna & Hak Akses</h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Fitur Super Admin untuk mendaftarkan akun warga, pengurus paguyuban, bendahara kas, dan pos keamanan.
          </p>
        </div>
        <button
          onClick={handleOpenAdd}
          className="flex items-center space-x-2 px-4 py-2.5 bg-primary-600 text-white rounded-xl hover:bg-primary-700 text-xs font-bold shadow-sm transition-all"
        >
          <UserPlus className="w-4 h-4" />
          <span>Tambah Akun Baru</span>
        </button>
      </div>

      {/* Tabel Data Akun Pengguna */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <div className="relative flex-1 max-w-md w-full">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Cari nama, peran, atau nomor blok rumah..."
              className="w-full pl-10 pr-4 py-2 text-xs border border-slate-200 rounded-xl outline-none focus:border-primary-500 shadow-2xs font-medium"
            />
          </div>
          <span className="text-xs text-slate-400 font-bold">Total: {sortedUsers.length} Akun Terdaftar</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 text-[10px] uppercase font-bold text-slate-500 border-b border-slate-200 select-none">
              <tr>
                <th onClick={() => handleSort('id_pengguna')} className="px-5 py-3.5 cursor-pointer hover:bg-slate-100 w-16">
                  <span>ID</span>
                  {renderSortIcon('id_pengguna')}
                </th>
                <th onClick={() => handleSort('nama_lengkap')} className="px-5 py-3.5 cursor-pointer hover:bg-slate-100 min-w-[180px]">
                  <span>Nama Akun / Username</span>
                  {renderSortIcon('nama_lengkap')}
                </th>
                <th onClick={() => handleSort('peran')} className="px-5 py-3.5 cursor-pointer hover:bg-slate-100 min-w-[160px]">
                  <span>Hak Akses (Role)</span>
                  {renderSortIcon('peran')}
                </th>
                <th onClick={() => handleSort('id_rumah')} className="px-5 py-3.5 cursor-pointer hover:bg-slate-100 min-w-[120px]">
                  <span>Unit Rumah</span>
                  {renderSortIcon('id_rumah')}
                </th>
                <th className="px-5 py-3.5 min-w-[110px]">Kata Sandi</th>
                <th className="px-5 py-3.5 text-right min-w-[130px]">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-5 py-8 text-center text-slate-400">Memuat data pengguna...</td>
                </tr>
              ) : sortedUsers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-8 text-center text-slate-400">Tidak ada akun yang sesuai pencarian.</td>
                </tr>
              ) : (
                sortedUsers.map(u => (
                  <tr key={u.id_pengguna} className="hover:bg-slate-50 transition-colors">
                    <td className="px-5 py-3.5 text-slate-400 font-mono text-xs">#{u.id_pengguna}</td>
                    <td className="px-5 py-3.5 font-bold text-slate-900">
                      <div className="flex items-center space-x-2.5">
                        <div className="w-8 h-8 rounded-full bg-slate-100 border text-slate-700 font-bold flex items-center justify-center text-xs shrink-0">
                          {u.nama_lengkap.charAt(0).toUpperCase()}
                        </div>
                        <span className="truncate">{u.nama_lengkap}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase border ${getRoleBadge(u.peran)}`}>
                        {u.peran.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="font-mono font-bold text-slate-700 text-xs px-2 py-0.5 bg-slate-100 rounded border border-slate-200">
                        {u.id_rumah || '-'}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-slate-400 font-mono text-xs">••••••••</td>
                    <td className="px-5 py-3.5 text-right space-x-1 whitespace-nowrap">
                      <button
                        onClick={() => handleQuickResetPassword(u)}
                        className="p-1.5 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                        title="Reset Password ke: Beryl123"
                      >
                        <RotateCcw className="w-3.5 h-3.5 inline" />
                      </button>
                      <button
                        onClick={() => handleOpenEdit(u)}
                        className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="Edit Akun"
                      >
                        <Edit2 className="w-3.5 h-3.5 inline" />
                      </button>
                      {u.id_pengguna !== currentUser.id_pengguna && (
                        <button
                          onClick={() => handleDelete(u.id_pengguna, u.nama_lengkap)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                          title="Hapus Akun"
                        >
                          <Trash2 className="w-3.5 h-3.5 inline" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* MODAL PENDAFTARAN & EDIT AKUN DENGAN PENCARIAN WARGA CERDAS               */}
      {/* ========================================================================= */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/60 flex items-center justify-center p-4 z-50 backdrop-blur-xs">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden relative p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b pb-3">
              <div className="flex items-center space-x-2">
                <UserPlus className="w-5 h-5 text-primary-600" />
                <h3 className="font-bold text-slate-900 text-sm">
                  {editingUser ? 'Edit Akun Pengguna' : 'Pendaftaran Akun Pengguna Baru'}
                </h3>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Pilihan Metode: Ambil Dari Data Warga vs Input Manual */}
            {!editingUser && (
              <div className="flex bg-slate-100 p-1 rounded-xl text-xs font-bold space-x-1">
                <button
                  type="button"
                  onClick={() => setUserFormMode('pilih_warga')}
                  className={`flex-1 py-1.5 rounded-lg transition-all ${
                    userFormMode === 'pilih_warga' ? 'bg-white text-emerald-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  🔍 Pilih Dari Data Warga
                </button>
                <button
                  type="button"
                  onClick={() => setUserFormMode('manual')}
                  className={`flex-1 py-1.5 rounded-lg transition-all ${
                    userFormMode === 'manual' ? 'bg-white text-emerald-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  ✏️ Akun Khusus (Satpam/Pengurus)
                </button>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
              {/* KOMPONEN PENCARIAN CERDAS WARGA (MENCARI NAMA / BLOK) */}
              {!editingUser && userFormMode === 'pilih_warga' && (
                <div className="space-y-1 bg-emerald-50/50 p-3 rounded-2xl border border-emerald-200">
                  <WargaSearchSelect
                    wargaList={wargaList}
                    selectedId={selectedWargaId}
                    onSelect={handleSelectWarga}
                    label="Cari Warga yang Diberi Akun *"
                    placeholder="Ketik nama warga atau nomor blok..."
                    required
                  />
                  <p className="text-[10px] text-emerald-700 font-medium pt-1">
                    💡 Memilih warga otomatis mengisi Username dan Unit Blok di bawah.
                  </p>
                </div>
              )}

              <div>
                <label className="block font-bold text-slate-600 mb-1">
                  Username Login *
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    required
                    type="text"
                    value={formData.nama_lengkap}
                    onChange={e => setFormData({ ...formData, nama_lengkap: e.target.value })}
                    placeholder="Misal: Ahmad Junaidi / Pak Wahyu"
                    className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-xl outline-none focus:border-primary-500 font-bold text-slate-800"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-600 mb-1">
                  Unit Rumah / Blok Terdaftar
                </label>
                <div className="relative">
                  <Home className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={formData.id_rumah}
                    onChange={e => setFormData({ ...formData, id_rumah: e.target.value })}
                    placeholder="Contoh: Beryl-A2-03 atau Pos-Security"
                    className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-xl font-mono font-bold outline-none focus:border-primary-500"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-600 mb-1">Peran / Hak Akses Akun *</label>
                <select
                  required
                  value={formData.peran}
                  onChange={e => setFormData({ ...formData, peran: e.target.value as any })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-none font-bold text-slate-800 bg-white"
                >
                  <option value="Warga">Warga (Mode Warga - View Only Kas)</option>
                  <option value="Admin_Keuangan">Admin Keuangan / Bendahara (Kelola Kas & Kuitansi)</option>
                  <option value="Admin_Kependudukan">Admin Kependudukan / Sekretaris (Kelola KK)</option>
                  <option value="Satpam">Satpam (Buku Tamu Masuk/Keluar)</option>
                  <option value="Super_Admin">Super Admin (Akses Penuh Seluruh Sistem)</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-600 mb-1">Kata Sandi (Password) *</label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    required
                    type="text"
                    value={formData.password}
                    onChange={e => setFormData({ ...formData, password: e.target.value })}
                    placeholder="Password akun"
                    className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-xl font-mono text-xs outline-none focus:border-primary-500"
                  />
                </div>
                <p className="text-[10px] text-slate-400 mt-1">Default kata sandi warga: <strong>Beryl123</strong></p>
              </div>

              <div className="pt-3 flex justify-end space-x-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 border rounded-xl font-bold text-slate-600"
                >
                  Batal
                </button>
                <button 
                  type="submit" 
                  className="px-5 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-xl font-bold shadow-md"
                >
                  {editingUser ? 'Simpan Perubahan' : 'Daftarkan Akun'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default PenggunaPage;