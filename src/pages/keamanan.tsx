// src/pages/keamanan.tsx
import React, { useEffect, useState, useMemo, useRef } from 'react';
import { 
  Shield, UserCheck, Clock, LogOut, Search, Plus, 
  Trash2, Edit2, X, Car, AlertCircle, CheckCircle2,
  ArrowUpDown, ArrowUp, ArrowDown, UserPlus, Phone
} from 'lucide-react';
import { Tamu, Pengguna } from '../types';
import { supabase, isSupabaseConfigured } from '../supabase';

const getLocalISODateTime = () => {
  const tzOffset = (new Date()).getTimezoneOffset() * 60000;
  return new Date(Date.now() - tzOffset).toISOString().replace('T', ' ').slice(0, 19);
};

const formatDateTime = (dt: string | null) => {
  if (!dt) return '-';
  try {
    const d = new Date(dt.replace(' ', 'T'));
    return d.toLocaleString('id-ID', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return dt;
  }
};

export const Keamanan = ({ user }: { user: Pengguna }) => {
  const [tamu, setTamu] = useState<Tamu[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<'Semua' | 'Di Dalam' | 'Sudah Keluar'>('Semua');

  // Form Ref & State (Bebas dari Bug e.currentTarget.reset())
  const formRef = useRef<HTMLFormElement>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingTamu, setEditingTamu] = useState<Tamu | null>(null);

  // Form State Tambah
  const [formDataAdd, setFormDataAdd] = useState({
    nama_tamu: '',
    id_rumah_tujuan: '',
    titip_identitas: 'KTP',
  });

  // Form State Edit
  const [formDataEdit, setFormDataEdit] = useState({
    id_tamu: 0,
    nama_tamu: '',
    id_rumah_tujuan: '',
    titip_identitas: 'KTP',
    waktu_masuk: '',
    waktu_keluar: null as string | null,
  });

  // Sort State
  const [sortField, setSortField] = useState<string>('waktu_masuk');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  const isGuest = user.id_pengguna === 0 || user.peran === 'Warga';
  const canEdit = !isGuest && (user.peran === 'Satpam' || user.peran === 'Super_Admin');

  // =========================================================================
  // LOAD DATA KUNJUNGAN TAMU (CLOUD + LOKAL CACHE)
  // =========================================================================
  const loadData = async () => {
    setLoading(true);
    let loadedTamu: Tamu[] = [];

    // Ambil dari lokal terlebih dahulu
    const local = localStorage.getItem('local_tamu');
    if (local) {
      try { loadedTamu = JSON.parse(local); } catch (e) {}
    }

    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabase
          .from('tamu')
          .select('*')
          .order('waktu_masuk', { ascending: false });

        if (!error && data && data.length > 0) {
          loadedTamu = data;
          localStorage.setItem('local_tamu', JSON.stringify(loadedTamu));
        }
      } catch (err: any) {
        console.warn('Fallback data tamu lokal:', err.message);
      }
    }

    setTamu(loadedTamu);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 30000); // Polling otomatis tiap 30 detik
    return () => clearInterval(interval);
  }, []);

  // =========================================================================
  // CREATE: CATAT TAMU MASUK (AMPUH BEBAS ERROR NULL)
  // =========================================================================
  const handleMasuk = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!canEdit) return;

    const waktuSekarang = getLocalISODateTime();
    let generatedId = Date.now();

    const payload = {
      nama_tamu: formDataAdd.nama_tamu.trim(),
      id_rumah_tujuan: formDataAdd.id_rumah_tujuan.trim().toUpperCase(),
      waktu_masuk: waktuSekarang,
      waktu_keluar: null,
      titip_identitas: formDataAdd.titip_identitas,
    };

    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabase.from('tamu').insert([payload]).select();
        if (!error && data && data[0]) {
          generatedId = data[0].id_tamu;
        }
      } catch (err) {
        console.warn('Simpan tamu ke cloud offline:', err);
      }
    }

    const newRecord: Tamu = {
      id_tamu: generatedId,
      ...payload,
    };

    const updated = [newRecord, ...tamu];
    setTamu(updated);
    localStorage.setItem('local_tamu', JSON.stringify(updated));

    // Reset Form Aman Tanpa Crash
    setFormDataAdd({
      nama_tamu: '',
      id_rumah_tujuan: '',
      titip_identitas: 'KTP',
    });
    setShowAddModal(false);
  };

  // =========================================================================
  // UPDATE: 1-KLIK TANDAI TAMU KELUAR
  // =========================================================================
  const handleKeluar = async (id: number) => {
    if (!canEdit) return;
    const waktuKeluar = getLocalISODateTime();

    if (isSupabaseConfigured) {
      try {
        await supabase
          .from('tamu')
          .update({ waktu_keluar: waktuKeluar })
          .eq('id_tamu', id);
      } catch (err) {
        console.warn('Update waktu keluar offline:', err);
      }
    }

    const updated = tamu.map(t => t.id_tamu === id ? { ...t, waktu_keluar: waktuKeluar } : t);
    setTamu(updated);
    localStorage.setItem('local_tamu', JSON.stringify(updated));
  };

  // =========================================================================
  // UPDATE: EDIT KUNJUNGAN TAMU
  // =========================================================================
  const handleOpenEdit = (t: Tamu) => {
    if (!canEdit) return;
    setEditingTamu(t);
    setFormDataEdit({
      id_tamu: t.id_tamu,
      nama_tamu: t.nama_tamu,
      id_rumah_tujuan: t.id_rumah_tujuan,
      titip_identitas: t.titip_identitas,
      waktu_masuk: t.waktu_masuk,
      waktu_keluar: t.waktu_keluar,
    });
    setShowEditModal(true);
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTamu || !canEdit) return;

    const payload = {
      nama_tamu: formDataEdit.nama_tamu.trim(),
      id_rumah_tujuan: formDataEdit.id_rumah_tujuan.trim().toUpperCase(),
      titip_identitas: formDataEdit.titip_identitas,
      waktu_masuk: formDataEdit.waktu_masuk,
      waktu_keluar: formDataEdit.waktu_keluar,
    };

    if (isSupabaseConfigured) {
      try {
        await supabase.from('tamu').update(payload).eq('id_tamu', editingTamu.id_tamu);
      } catch (err) {
        console.warn('Update tamu offline:', err);
      }
    }

    const updated = tamu.map(t => t.id_tamu === editingTamu.id_tamu ? { ...t, ...payload } : t);
    setTamu(updated);
    localStorage.setItem('local_tamu', JSON.stringify(updated));
    setShowEditModal(false);
    setEditingTamu(null);
  };

  // =========================================================================
  // DELETE: HAPUS CATATAN TAMU
  // =========================================================================
  const handleDelete = async (id: number) => {
    if (!canEdit) return;
    if (!confirm('Hapus log kunjungan tamu ini?')) return;

    if (isSupabaseConfigured) {
      try {
        await supabase.from('tamu').delete().eq('id_tamu', id);
      } catch (err) {}
    }

    const updated = tamu.filter(t => t.id_tamu !== id);
    setTamu(updated);
    localStorage.setItem('local_tamu', JSON.stringify(updated));
  };

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

  // KPI Ringkasan
  const stats = useMemo(() => {
    const hariIniStr = getLocalISODateTime().slice(0, 10);
    const diDalam = tamu.filter(t => !t.waktu_keluar).length;
    const totalHariIni = tamu.filter(t => t.waktu_masuk?.startsWith(hariIniStr)).length;
    const sudahKeluarHariIni = tamu.filter(t => t.waktu_keluar && t.waktu_masuk?.startsWith(hariIniStr)).length;

    return { diDalam, totalHariIni, sudahKeluarHariIni };
  }, [tamu]);

  // Filter & Search List
  const filteredTamu = useMemo(() => {
    const q = search.toLowerCase().trim();
    return tamu
      .filter(t => {
        const matchSearch = !q || 
          (t.nama_tamu || '').toLowerCase().includes(q) ||
          (t.id_rumah_tujuan || '').toLowerCase().includes(q) ||
          (t.titip_identitas || '').toLowerCase().includes(q);

        const matchStatus = 
          filterStatus === 'Semua' ? true :
          filterStatus === 'Di Dalam' ? !t.waktu_keluar :
          Boolean(t.waktu_keluar);

        return matchSearch && matchStatus;
      })
      .sort((a: any, b: any) => {
        let valA = a[sortField] || '';
        let valB = b[sortField] || '';
        let comp = String(valA).localeCompare(String(valB), undefined, { numeric: true, sensitivity: 'base' });
        return sortOrder === 'asc' ? comp : -comp;
      });
  }, [tamu, search, filterStatus, sortField, sortOrder]);

  return (
    <div className="space-y-6 pb-12">
      {/* Header Halaman */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="p-2 bg-amber-100 text-amber-800 rounded-xl">
              <Shield className="w-5 h-5" />
            </span>
            <h2 className="text-xl font-black text-slate-800 tracking-tight">Log Keamanan & Buku Tamu Cluster Beryl</h2>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Pencatatan real-time keluar-masuk tamu, kurir paket, kendaraan luar, dan penitipan kartu identitas.
          </p>
        </div>
        {canEdit && (
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center space-x-2 px-4 py-2.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold shadow-sm transition-all"
          >
            <UserPlus className="w-4 h-4" />
            <span>Catat Tamu Masuk</span>
          </button>
        )}
      </div>

      {/* 3 Kartu KPI Satpam */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-amber-700 uppercase tracking-wider">Tamu Masih Di Dalam</span>
            <p className="text-2xl font-black text-amber-800 mt-1">{stats.diDalam} Orang</p>
            <span className="text-[10px] text-amber-600 font-medium">Perlu diawasi / belum keluar</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-200/70 text-amber-800 flex items-center justify-center">
            <Clock className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider">Total Kunjungan Hari Ini</span>
            <p className="text-2xl font-black text-emerald-800 mt-1">{stats.totalHariIni} Tamu</p>
            <span className="text-[10px] text-emerald-600 font-medium">{stats.sudahKeluarHariIni} sudah keluar portal</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-200/70 text-emerald-800 flex items-center justify-center">
            <UserCheck className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Total Riwayat Tamu</span>
            <p className="text-2xl font-black text-slate-800 mt-1">{tamu.length} Record</p>
            <span className="text-[10px] text-slate-400 font-medium">Arsip portal keamanan</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-slate-200 text-slate-700 flex items-center justify-center">
            <Shield className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Bar Pencarian & Filter Status */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Cari nama tamu, blok rumah tujuan (misal: A1-01), atau jenis identitas..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs outline-none focus:border-amber-500 shadow-2xs font-medium"
          />
        </div>

        <div className="flex bg-slate-200/60 p-1 rounded-xl space-x-1 text-xs font-bold">
          {(['Semua', 'Di Dalam', 'Sudah Keluar'] as const).map((st) => (
            <button
              key={st}
              onClick={() => setFilterStatus(st)}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                filterStatus === st ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {st === 'Di Dalam' ? `Di Dalam (${stats.diDalam})` : st}
            </button>
          ))}
        </div>
      </div>

      {/* Tabel Log Kunjungan Tamu */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 border-b text-[10px] uppercase font-bold text-slate-500 select-none">
              <tr>
                <th className="px-3 py-3.5 text-center w-12">No.</th>
                <th onClick={() => handleSort('waktu_masuk')} className="px-4 py-3.5 cursor-pointer hover:bg-slate-100 min-w-[130px]">
                  <span>Waktu Masuk</span>
                  {renderSortIcon('waktu_masuk')}
                </th>
                <th onClick={() => handleSort('nama_tamu')} className="px-4 py-3.5 cursor-pointer hover:bg-slate-100 min-w-[160px]">
                  <span>Nama Tamu</span>
                  {renderSortIcon('nama_tamu')}
                </th>
                <th onClick={() => handleSort('id_rumah_tujuan')} className="px-4 py-3.5 cursor-pointer hover:bg-slate-100 min-w-[110px]">
                  <span>Tujuan Unit</span>
                  {renderSortIcon('id_rumah_tujuan')}
                </th>
                <th className="px-4 py-3.5 min-w-[100px]">Titip ID</th>
                <th onClick={() => handleSort('waktu_keluar')} className="px-4 py-3.5 text-center min-w-[150px] cursor-pointer hover:bg-slate-100">
                  <span>Status / Keluar</span>
                  {renderSortIcon('waktu_keluar')}
                </th>
                {canEdit && <th className="px-4 py-3.5 text-right min-w-[100px]">Aksi</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr><td colSpan={canEdit ? 7 : 6} className="px-4 py-8 text-center text-slate-400">Memuat log keamanan...</td></tr>
              ) : filteredTamu.length === 0 ? (
                <tr><td colSpan={canEdit ? 7 : 6} className="px-4 py-8 text-center text-slate-400">Belum ada data kunjungan tamu yang sesuai.</td></tr>
              ) : (
                filteredTamu.map((t, idx) => {
                  const isAktif = !t.waktu_keluar;

                  return (
                    <tr key={t.id_tamu} className={`transition-colors ${isAktif ? 'bg-amber-50/40 hover:bg-amber-50/70' : 'hover:bg-slate-50 opacity-75'}`}>
                      <td className="px-3 py-3.5 text-center font-mono text-slate-400 text-xs">{idx + 1}</td>
                      <td className="px-4 py-3.5 font-mono text-slate-600 font-medium">
                        <div className="flex items-center space-x-1.5">
                          <Clock className="w-3.5 h-3.5 text-blue-600" />
                          <span>{formatDateTime(t.waktu_masuk)}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3.5 font-bold text-slate-900 text-xs">{t.nama_tamu}</td>
                      <td className="px-4 py-3.5">
                        <span className="px-2 py-0.5 rounded font-mono font-bold text-xs bg-slate-100 text-slate-800 border border-slate-200">
                          {t.id_rumah_tujuan}
                        </span>
                      </td>
                      <td className="px-4 py-3.5">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                          t.titip_identitas === 'Kosong' ? 'bg-slate-100 text-slate-500' : 'bg-blue-100 text-blue-700'
                        }`}>
                          {t.titip_identitas}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-center">
                        {isAktif ? (
                          canEdit ? (
                            <button
                              onClick={() => handleKeluar(t.id_tamu)}
                              className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-[10px] font-bold uppercase shadow-xs transition-all active:scale-95"
                              title="Klik untuk menandai tamu telah keluar portal"
                            >
                              <LogOut className="w-3 h-3" />
                              <span>Tandai Keluar</span>
                            </button>
                          ) : (
                            <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-300">
                              Di Dalam Klaster
                            </span>
                          )
                        ) : (
                          <div className="inline-flex items-center space-x-1 text-emerald-700 font-mono text-[11px]">
                            <UserCheck className="w-3.5 h-3.5 text-emerald-600" />
                            <span>{formatDateTime(t.waktu_keluar)}</span>
                          </div>
                        )}
                      </td>
                      {canEdit && (
                        <td className="px-4 py-3.5 text-right space-x-1 whitespace-nowrap">
                          <button
                            onClick={() => handleOpenEdit(t)}
                            className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg"
                            title="Edit Catatan Tamu"
                          >
                            <Edit2 className="w-3.5 h-3.5 inline" />
                          </button>
                          <button
                            onClick={() => handleDelete(t.id_tamu)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg"
                            title="Hapus Catatan"
                          >
                            <Trash2 className="w-3.5 h-3.5 inline" />
                          </button>
                        </td>
                      )}
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* MODAL 1: CATAT TAMU MASUK (AMPUH BEBAS ERROR NULL RESET)                  */}
      {/* ========================================================================= */}
      {showAddModal && canEdit && (
        <div className="fixed inset-0 bg-slate-900/60 flex items-center justify-center p-4 z-50 backdrop-blur-xs">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-6 space-y-4">
            <div className="flex justify-between items-center border-b pb-3">
              <div className="flex items-center space-x-2">
                <Shield className="w-5 h-5 text-amber-600" />
                <h3 className="font-bold text-slate-900 text-sm">Catat Tamu Masuk Portal</h3>
              </div>
              <button onClick={() => setShowAddModal(false)}><X className="w-4 h-4 text-slate-400" /></button>
            </div>

            <form ref={formRef} onSubmit={handleMasuk} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-slate-600 mb-1">Nama Tamu / Pengunjung / Kurir *</label>
                <input
                  required
                  type="text"
                  placeholder="Misal: Kurir JNE / Bpk. Hendra (Tamu B1/02)"
                  value={formDataAdd.nama_tamu}
                  onChange={e => setFormDataAdd({ ...formDataAdd, nama_tamu: e.target.value })}
                  className="w-full px-3 py-2 border rounded-xl font-bold outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-600 mb-1">Blok Rumah Tujuan *</label>
                <input
                  required
                  type="text"
                  placeholder="Contoh: Beryl-A1-03 atau B2-14"
                  value={formDataAdd.id_rumah_tujuan}
                  onChange={e => setFormDataAdd({ ...formDataAdd, id_rumah_tujuan: e.target.value })}
                  className="w-full px-3 py-2 border rounded-xl font-mono font-bold outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-600 mb-1">Titip Kartu Identitas</label>
                <select
                  value={formDataAdd.titip_identitas}
                  onChange={e => setFormDataAdd({ ...formDataAdd, titip_identitas: e.target.value })}
                  className="w-full px-3 py-2 border rounded-xl font-bold outline-none bg-white"
                >
                  <option value="KTP">KTP (Kartu Tanda Penduduk)</option>
                  <option value="SIM">SIM (Surat Izin Mengemudi)</option>
                  <option value="STNK">STNK Kendaraan</option>
                  <option value="Kartu Pelajar">Kartu Pelajar / Mahasiswa</option>
                  <option value="Kosong">Tidak Ada (Hanya Lapor / Kurir Cepat)</option>
                </select>
              </div>

              <div className="flex justify-end space-x-2 pt-3 border-t">
                <button type="button" onClick={() => setShowAddModal(false)} className="px-4 py-2 border rounded-xl font-bold text-slate-600">Batal</button>
                <button type="submit" className="px-5 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl font-bold shadow-md">Catat Masuk</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: EDIT LOG TAMU (CRUD UPDATE)                                      */}
      {/* ========================================================================= */}
      {showEditModal && editingTamu && canEdit && (
        <div className="fixed inset-0 bg-slate-900/60 flex items-center justify-center p-4 z-50 backdrop-blur-xs">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-6 space-y-4">
            <div className="flex justify-between items-center border-b pb-3">
              <div className="flex items-center space-x-2">
                <Edit2 className="w-4 h-4 text-blue-600" />
                <h3 className="font-bold text-slate-900 text-sm">Edit Log Kunjungan Tamu</h3>
              </div>
              <button onClick={() => setShowEditModal(false)}><X className="w-4 h-4 text-slate-400" /></button>
            </div>

            <form onSubmit={handleEditSubmit} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-slate-600 mb-1">Nama Tamu *</label>
                <input
                  required
                  type="text"
                  value={formDataEdit.nama_tamu}
                  onChange={e => setFormDataEdit({ ...formDataEdit, nama_tamu: e.target.value })}
                  className="w-full px-3 py-2 border rounded-xl font-bold outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-600 mb-1">Blok Rumah Tujuan *</label>
                <input
                  required
                  type="text"
                  value={formDataEdit.id_rumah_tujuan}
                  onChange={e => setFormDataEdit({ ...formDataEdit, id_rumah_tujuan: e.target.value })}
                  className="w-full px-3 py-2 border rounded-xl font-mono font-bold outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-600 mb-1">Titip Kartu Identitas</label>
                <select
                  value={formDataEdit.titip_identitas}
                  onChange={e => setFormDataEdit({ ...formDataEdit, titip_identitas: e.target.value })}
                  className="w-full px-3 py-2 border rounded-xl font-bold outline-none bg-white"
                >
                  <option value="KTP">KTP</option>
                  <option value="SIM">SIM</option>
                  <option value="STNK">STNK</option>
                  <option value="Kartu Pelajar">Kartu Pelajar</option>
                  <option value="Kosong">Tidak Ada</option>
                </select>
              </div>

              <div className="flex justify-end space-x-2 pt-3 border-t">
                <button type="button" onClick={() => setShowEditModal(false)} className="px-4 py-2 border rounded-xl font-bold text-slate-600">Batal</button>
                <button type="submit" className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold shadow-md">Simpan Perubahan</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Keamanan;