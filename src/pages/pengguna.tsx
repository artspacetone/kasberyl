import React, { useEffect, useState } from 'react';
import { UserPlus, Search, Edit2, Trash2, Key, X, UserCog, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import { Pengguna, Rumah } from '../types';
import { supabase } from '../supabase';

export const PenggunaPage = ({ currentUser }: { currentUser: Pengguna }) => {
  const [users, setUsers] = useState<Pengguna[]>([]);
  const [rumahList, setRumahList] = useState<Rumah[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState<Pengguna | null>(null);

  // State Sortir
  const [sortField, setSortField] = useState<string>('id_pengguna');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  const loadData = async () => {
    try {
      const [resUsers, resRumah] = await Promise.all([
        supabase.from('pengguna').select('*').order('id_pengguna', { ascending: true }),
        supabase.from('rumah').select('*').order('id_rumah', { ascending: true }),
      ]);
      setUsers(resUsers.data || []);
      setRumahList(resRumah.data || []);
    } catch (err: any) {
      console.error('Gagal memuat pengguna:', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

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

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const payload: any = {
      nama_lengkap: formData.get('nama_lengkap') as string,
      peran: formData.get('peran') as string,
      id_rumah: (formData.get('id_rumah') as string) || null,
      password: (formData.get('password') as string) || 'Beryl123',
    };

    try {
      if (editingUser) {
        const { error } = await supabase
          .from('pengguna')
          .update(payload)
          .eq('id_pengguna', editingUser.id_pengguna);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('pengguna').insert([payload]);
        if (error) throw error;
      }

      setShowModal(false);
      setEditingUser(null);
      loadData();
    } catch (err: any) {
      alert('Gagal menyimpan pengguna: ' + err.message);
    }
  };

  const handleDelete = async (id: number) => {
    if (id === currentUser.id_pengguna) {
      alert('Anda tidak dapat menghapus akun Anda sendiri yang sedang digunakan!');
      return;
    }

    if (!confirm('Hapus akun pengguna ini? Akses pengguna akan dicabut secara permanen.')) return;

    try {
      const { error } = await supabase.from('pengguna').delete().eq('id_pengguna', id);
      if (error) throw error;
      loadData();
    } catch (err: any) {
      alert('Gagal menghapus pengguna: ' + err.message);
    }
  };

  // PENCARIAN FLEKSIBEL: Nama Lengkap, Peran, atau Blok / ID Rumah
  const q = search.toLowerCase().trim();
  const sortedUsers = [...users]
    .filter(u => {
      if (!q) return true;
      const matchNama = u.nama_lengkap?.toLowerCase().includes(q);
      const matchPeran = u.peran?.toLowerCase().includes(q);
      const matchRumah = u.id_rumah?.toLowerCase().includes(q);
      return matchNama || matchPeran || matchRumah;
    })
    .sort((a: any, b: any) => {
      let valA = a[sortField] || '';
      let valB = b[sortField] || '';
      let comp = String(valA).localeCompare(String(valB), undefined, { numeric: true, sensitivity: 'base' });
      return sortOrder === 'asc' ? comp : -comp;
    });

  const getRoleBadge = (peran: string) => {
    switch (peran) {
      case 'Super_Admin':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'Admin_Keuangan':
        return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'Admin_Kependudukan':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'Satpam':
        return 'bg-amber-100 text-amber-800 border-amber-200';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  return (
    <div className="space-y-6 relative">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
        <div>
          <div className="flex items-center space-x-2">
            <UserCog className="w-6 h-6 text-primary-600" />
            <h2 className="text-2xl font-bold tracking-tight text-slate-900">Manajemen Pengguna & Hak Akses</h2>
          </div>
          <p className="text-slate-500 mt-1">
            Fitur Super Admin untuk membuat akun Pengurus, Bendahara, Security, maupun Warga.
          </p>
        </div>
        <button
          onClick={() => {
            setEditingUser(null);
            setShowModal(true);
          }}
          className="flex items-center space-x-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 text-sm font-medium shadow-sm transition-colors"
        >
          <UserPlus className="w-4 h-4" />
          <span>Tambah Akun Baru</span>
        </button>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex justify-between items-center">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="🔍 Cari nama, peran, atau blok rumah (misal: A1-01)..."
              className="w-full pl-10 pr-4 py-2 text-sm border border-slate-200 rounded-lg outline-none focus:border-primary-500 transition-colors"
            />
          </div>
          <span className="text-xs text-slate-400 font-medium">Total: {sortedUsers.length} Akun</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50 text-[10px] uppercase tracking-wider text-slate-500 border-b border-slate-200 select-none">
              <tr>
                <th onClick={() => handleSort('id_pengguna')} className="px-5 py-3 font-bold cursor-pointer hover:bg-slate-100">
                  <span>ID</span>
                  {renderSortIcon('id_pengguna')}
                </th>
                <th onClick={() => handleSort('nama_lengkap')} className="px-5 py-3 font-bold cursor-pointer hover:bg-slate-100">
                  <span>Nama Lengkap</span>
                  {renderSortIcon('nama_lengkap')}
                </th>
                <th onClick={() => handleSort('peran')} className="px-5 py-3 font-bold cursor-pointer hover:bg-slate-100">
                  <span>Peran / Hak Akses</span>
                  {renderSortIcon('peran')}
                </th>
                <th onClick={() => handleSort('id_rumah')} className="px-5 py-3 font-bold cursor-pointer hover:bg-slate-100">
                  <span>Unit Rumah</span>
                  {renderSortIcon('id_rumah')}
                </th>
                <th className="px-5 py-3 font-bold">Password</th>
                <th className="px-5 py-3 font-bold text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-5 py-8 text-center text-slate-400">Memuat data pengguna...</td>
                </tr>
              ) : sortedUsers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-8 text-center text-slate-400">Tidak ada akun ditemukan.</td>
                </tr>
              ) : (
                sortedUsers.map(u => (
                  <tr key={u.id_pengguna} className="hover:bg-slate-50 transition-colors">
                    <td className="px-5 py-4 text-slate-400 font-mono text-xs">#{u.id_pengguna}</td>
                    <td className="px-5 py-4 font-bold text-slate-900 flex items-center space-x-2">
                      <div className="w-8 h-8 rounded-full bg-slate-200 text-slate-700 font-bold flex items-center justify-center text-xs">
                        {u.nama_lengkap.charAt(0).toUpperCase()}
                      </div>
                      <span>{u.nama_lengkap}</span>
                    </td>
                    <td className="px-5 py-4">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase border ${getRoleBadge(u.peran)}`}>
                        {u.peran.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-slate-500 font-mono text-xs font-bold">{u.id_rumah || '-'}</td>
                    <td className="px-5 py-4 text-slate-400 font-mono text-xs">••••••••</td>
                    <td className="px-5 py-4 text-right space-x-2">
                      <button
                        onClick={() => {
                          setEditingUser(u);
                          setShowModal(true);
                        }}
                        className="text-slate-400 hover:text-blue-600 transition-colors"
                        title="Edit Akun"
                      >
                        <Edit2 className="w-4 h-4 inline" />
                      </button>
                      <button
                        onClick={() => handleDelete(u.id_pengguna)}
                        className="text-slate-400 hover:text-red-600 transition-colors"
                        title="Hapus Akun"
                      >
                        <Trash2 className="w-4 h-4 inline" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 w-full max-w-md overflow-hidden relative">
            <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h3 className="font-bold text-slate-800">{editingUser ? 'Edit Akun Pengguna' : 'Tambah Akun Pengguna Baru'}</h3>
              <button
                onClick={() => {
                  setShowModal(false);
                  setEditingUser(null);
                }}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">
                  Username Login *
                </label>
                <input
                  required
                  name="nama_lengkap"
                  defaultValue={editingUser?.nama_lengkap || ''}
                  placeholder="Misal: wahyu / riyan / siti hajar"
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Peran / Hak Akses *</label>
                <select
                  required
                  name="peran"
                  defaultValue={editingUser?.peran || 'Warga'}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm outline-none"
                >
                  <option value="Super_Admin">Super Admin</option>
                  <option value="Admin_Keuangan">Admin Keuangan / Bendahara</option>
                  <option value="Admin_Kependudukan">Admin Kependudukan</option>
                  <option value="Satpam">Satpam / Security</option>
                  <option value="Warga">Warga (View Only)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Unit Rumah / Blok</label>
                <select
                  name="id_rumah"
                  defaultValue={editingUser?.id_rumah || ''}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm outline-none font-mono"
                >
                  <option value="">-- Pilih Unit Rumah --</option>
                  {rumahList.map(r => (
                    <option key={r.id_rumah} value={r.id_rumah}>
                      {r.id_rumah} ({r.nama_pemilik_asli})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Kata Sandi (Password) *</label>
                <div className="relative">
                  <input
                    required
                    type="text"
                    name="password"
                    defaultValue={editingUser?.password || 'Beryl123'}
                    placeholder="Masukkan password"
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm font-mono outline-none"
                  />
                  <Key className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
                </div>
              </div>

              <div className="pt-4 flex justify-end space-x-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    setEditingUser(null);
                  }}
                  className="px-4 py-2 border rounded-lg text-sm font-medium text-slate-600"
                >
                  Batal
                </button>
                <button type="submit" className="px-4 py-2 bg-primary-600 text-white rounded-lg text-sm font-medium">
                  Simpan Akun
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};