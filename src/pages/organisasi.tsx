import React, { useEffect, useState } from 'react';
import { Pengurus, Pengguna } from '../types';
import { Network, Plus, Edit2, Trash2, X, MessageCircle, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import { supabase } from '../supabase';

const formatWA = (hp: string) => {
  if (!hp || hp === '-' || hp.trim() === '') return null;
  let formatted = hp.replace(/\D/g, '');
  if (formatted.startsWith('0')) {
    formatted = '62' + formatted.substring(1);
  }
  return `https://wa.me/${formatted}`;
};

const JABATAN_ORDER: Record<string, number> = {
  Ketua: 1,
  'Wakil Ketua': 2,
  Sekretaris: 3,
  Bendahara: 4,
  'Wakil Bendahara': 5,
};

export const Organisasi = ({ user }: { user: Pengguna }) => {
  const [pengurus, setPengurus] = useState<Pengurus[]>([]);
  const [loading, setLoading] = useState(true);
  const [showFormModal, setShowFormModal] = useState(false);
  const [editingData, setEditingData] = useState<Pengurus | null>(null);

  // State Sortir
  const [sortField, setSortField] = useState<string>('jabatan');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  const isGuest = user.id_pengguna === 0;
  const canEdit = !isGuest && (user.peran === 'Super_Admin' || user.peran === 'Admin_Kependudukan');

  const loadData = async () => {
    try {
      const { data, error } = await supabase.from('organisasi').select('*');
      if (error) throw error;
      setPengurus(data || []);
    } catch (err: any) {
      console.error('Error loading organisasi:', err.message);
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

  const sortedPengurus = [...pengurus].sort((a: any, b: any) => {
    if (sortField === 'jabatan') {
      const orderA = JABATAN_ORDER[a.jabatan] ?? 99;
      const orderB = JABATAN_ORDER[b.jabatan] ?? 99;
      return sortOrder === 'asc' ? orderA - orderB : orderB - orderA;
    }
    let valA = a[sortField] || '';
    let valB = b[sortField] || '';
    let comp = String(valA).localeCompare(String(valB), undefined, { numeric: true, sensitivity: 'base' });
    return sortOrder === 'asc' ? comp : -comp;
  });

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!canEdit) return;

    const formData = new FormData(e.currentTarget);
    const payload = Object.fromEntries(formData.entries());

    if (!editingData && 'id_pengurus' in payload) {
      delete payload.id_pengurus;
    }

    try {
      if (editingData) {
        const { error } = await supabase
          .from('organisasi')
          .update(payload)
          .eq('id_pengurus', editingData.id_pengurus);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('organisasi').insert([payload]);
        if (error) throw error;
      }

      setShowFormModal(false);
      setEditingData(null);
      loadData();
    } catch (err: any) {
      alert('Gagal menyimpan data: ' + err.message);
    }
  };

  const handleDelete = async (id: number) => {
    if (!canEdit) return;
    if (!confirm('Hapus data pengurus ini? Tindakan tidak dapat dibatalkan.')) return;

    try {
      const { error } = await supabase.from('organisasi').delete().eq('id_pengurus', id);
      if (error) throw error;
      loadData();
    } catch (err: any) {
      alert('Gagal menghapus data: ' + err.message);
    }
  };

  return (
    <div className="space-y-6 relative">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">Struktur Organisasi</h2>
          <p className="text-slate-500 mt-1">
            {isGuest ? 'Daftar pengurus paguyuban Cluster Beryl (Mode Lihat Tamu).' : 'Kelola daftar pengurus paguyuban Cluster Beryl.'}
          </p>
        </div>
        {canEdit && (
          <div className="flex space-x-3">
            <button
              onClick={() => {
                setEditingData(null);
                setShowFormModal(true);
              }}
              className="flex items-center space-x-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 text-sm font-medium shadow-sm transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Tambah Pengurus</span>
            </button>
          </div>
        )}
      </div>

      {pengurus.filter(p => JABATAN_ORDER[p.jabatan] && JABATAN_ORDER[p.jabatan] <= 2).length > 0 && (
        <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl p-6 text-white">
          <div className="flex items-center space-x-2 mb-4">
            <Network className="w-4 h-4 text-primary-400" />
            <span className="text-xs font-bold uppercase tracking-widest text-primary-400">
              Struktur Inti
            </span>
          </div>
          <div className="flex flex-wrap gap-3 justify-center">
            {pengurus
              .filter(p => JABATAN_ORDER[p.jabatan] && JABATAN_ORDER[p.jabatan] <= 5)
              .map(p => (
                <div
                  key={p.id_pengurus}
                  className="text-center bg-slate-700/50 rounded-xl px-4 py-3 min-w-[130px] border border-slate-600/50"
                >
                  <div className="w-10 h-10 rounded-full bg-primary-500 flex items-center justify-center font-bold text-white text-lg mx-auto mb-2">
                    {p.nama_pengurus.charAt(0)}
                  </div>
                  <p className="text-[10px] font-bold text-primary-400 uppercase tracking-wider">
                    {p.jabatan}
                  </p>
                  <p className="text-sm font-semibold text-white mt-0.5">{p.nama_pengurus}</p>
                  {formatWA(p.kontak) && (
                    <a
                      href={formatWA(p.kontak)!}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[10px] text-emerald-400 hover:underline mt-1 inline-flex items-center space-x-1"
                    >
                      <MessageCircle className="w-2.5 h-2.5" />
                      <span>WA</span>
                    </a>
                  )}
                </div>
              ))}
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50 text-[10px] uppercase tracking-wider text-slate-500 border-b border-slate-200 select-none">
              <tr>
                <th onClick={() => handleSort('jabatan')} className="px-5 py-3 font-bold cursor-pointer hover:bg-slate-100">
                  <span>Jabatan</span>
                  {renderSortIcon('jabatan')}
                </th>
                <th onClick={() => handleSort('nama_pengurus')} className="px-5 py-3 font-bold cursor-pointer hover:bg-slate-100">
                  <span>Nama Pengurus</span>
                  {renderSortIcon('nama_pengurus')}
                </th>
                <th onClick={() => handleSort('periode')} className="px-5 py-3 font-bold cursor-pointer hover:bg-slate-100">
                  <span>Periode</span>
                  {renderSortIcon('periode')}
                </th>
                <th onClick={() => handleSort('kontak')} className="px-5 py-3 font-bold cursor-pointer hover:bg-slate-100">
                  <span>Kontak</span>
                  {renderSortIcon('kontak')}
                </th>
                {canEdit && <th className="px-5 py-3 font-bold text-right">Aksi</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={canEdit ? 5 : 4} className="px-5 py-8 text-center text-slate-400 text-sm">
                    Memuat data pengurus...
                  </td>
                </tr>
              ) : sortedPengurus.length === 0 ? (
                <tr>
                  <td colSpan={canEdit ? 5 : 4} className="px-5 py-10 text-center text-slate-400 text-sm">
                    Belum ada data pengurus.
                  </td>
                </tr>
              ) : (
                sortedPengurus.map(p => (
                  <tr key={p.id_pengurus} className="hover:bg-slate-50 transition-colors">
                    <td className="px-5 py-4 font-semibold text-slate-900">{p.jabatan}</td>
                    <td className="px-5 py-4 font-medium text-slate-800">{p.nama_pengurus}</td>
                    <td className="px-5 py-4 text-slate-500">{p.periode}</td>
                    <td className="px-5 py-4 font-mono">
                      {formatWA(p.kontak) ? (
                        <a
                          href={formatWA(p.kontak)!}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center space-x-1.5 text-emerald-600 hover:underline font-medium"
                        >
                          <MessageCircle className="w-3.5 h-3.5" />
                          <span>{p.kontak}</span>
                        </a>
                      ) : (
                        <span className="text-slate-400">{p.kontak || '-'}</span>
                      )}
                    </td>
                    {canEdit && (
                      <td className="px-5 py-4 text-right space-x-2">
                        <button
                          onClick={() => {
                            setEditingData(p);
                            setShowFormModal(true);
                          }}
                          title="Edit"
                          className="text-slate-400 hover:text-blue-600 transition-colors"
                        >
                          <Edit2 className="w-4 h-4 inline" />
                        </button>
                        <button
                          onClick={() => handleDelete(p.id_pengurus)}
                          title="Hapus"
                          className="text-slate-400 hover:text-red-600 transition-colors"
                        >
                          <Trash2 className="w-4 h-4 inline" />
                        </button>
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showFormModal && canEdit && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 w-full max-w-md overflow-hidden relative">
            <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h3 className="font-bold text-slate-800">{editingData ? 'Edit' : 'Tambah'} Pengurus</h3>
              <button
                onClick={() => {
                  setShowFormModal(false);
                  setEditingData(null);
                }}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Jabatan *</label>
                <input
                  required
                  name="jabatan"
                  defaultValue={editingData?.jabatan || ''}
                  placeholder="Misal: Ketua RT"
                  className="w-full px-3 py-2 border rounded-lg text-sm outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Nama Pengurus *</label>
                <input
                  required
                  name="nama_pengurus"
                  defaultValue={editingData?.nama_pengurus || ''}
                  placeholder="Nama Warga"
                  className="w-full px-3 py-2 border rounded-lg text-sm outline-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Periode *</label>
                  <input
                    required
                    name="periode"
                    defaultValue={editingData?.periode || ''}
                    placeholder="2026 - 2030"
                    className="w-full px-3 py-2 border rounded-lg text-sm outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Kontak</label>
                  <input
                    name="kontak"
                    defaultValue={editingData?.kontak || ''}
                    placeholder="0812xxxx"
                    className="w-full px-3 py-2 border rounded-lg text-sm outline-none"
                  />
                </div>
              </div>
              <div className="pt-4 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowFormModal(false);
                    setEditingData(null);
                  }}
                  className="px-4 py-2 border rounded-lg text-sm text-slate-600"
                >
                  Batal
                </button>
                <button type="submit" className="px-4 py-2 bg-primary-600 rounded-lg text-sm font-medium text-white">
                  Simpan Data
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};