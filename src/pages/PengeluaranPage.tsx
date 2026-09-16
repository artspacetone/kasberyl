// src/pages/PengeluaranPage.tsx
import React, { useEffect, useState, useMemo } from 'react';
import { supabase, isSupabaseConfigured } from '../supabase';
import { Pengeluaran, PosPengeluaran, formatRupiah, Pengguna } from '../types';
import { 
  Plus, Search, X, ExternalLink, Trash2, Edit2, 
  ArrowDownCircle, HeartHandshake, Landmark, Sparkles, Receipt
} from 'lucide-react';
import { ImageViewerModal } from '../components/ImageViewerModal';

export const PengeluaranPage: React.FC<{ currentUser?: Pengguna }> = ({ currentUser }) => {
  const [dataList, setDataList] = useState<Pengeluaran[]>([]);
  const [loading, setLoading] = useState(true);

  // State Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingItem, setEditingItem] = useState<Pengeluaran | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  // State Filter & Search
  const [search, setSearch] = useState('');
  const [filterPos, setFilterPos] = useState<string>('Semua');

  // Form State: Tambah Pengeluaran Baru
  const [formDataAdd, setFormDataAdd] = useState({
    pos_anggaran: 'Operasional_Warga' as PosPengeluaran,
    tanggal: new Date().toISOString().slice(0, 10),
    keperluan: '',
    nominal: 50000,
    bukti_nota: '',
  });

  // Form State: Edit Pengeluaran
  const [formDataEdit, setFormDataEdit] = useState({
    id_pengeluaran: 0,
    pos_anggaran: 'Operasional_Warga' as PosPengeluaran,
    tanggal: '',
    keperluan: '',
    nominal: 0,
    bukti_nota: '',
  });

  const canEdit = !currentUser || currentUser.peran === 'Super_Admin' || currentUser.peran === 'Admin_Keuangan';

  const loadData = async () => {
    setLoading(true);
    let loaded: Pengeluaran[] = [];

    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabase
          .from('pengeluaran')
          .select('*')
          .order('tanggal', { ascending: false });

        if (!error && data && data.length > 0) {
          loaded = data;
        }
      } catch (err: any) {
        console.warn('Fallback offline Pengeluaran:', err.message);
      }
    }

    if (loaded.length === 0) {
      const local = localStorage.getItem('local_pengeluaran');
      if (local) loaded = JSON.parse(local);
    }

    setDataList(loaded);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
    const handleUpdate = () => loadData();
    window.addEventListener('app_data_updated', handleUpdate);
    return () => window.removeEventListener('app_data_updated', handleUpdate);
  }, []);

  // Statistik Ringkasan Pos Pengeluaran
  const stats = useMemo(() => {
    const totalOperasional = dataList
      .filter(d => d.pos_anggaran === 'Operasional_Warga')
      .reduce((a, b) => a + Number(b.nominal || 0), 0);

    const totalSosial = dataList
      .filter(d => d.pos_anggaran === 'Sosial_Warga')
      .reduce((a, b) => a + Number(b.nominal || 0), 0);

    const totalMajelis = dataList
      .filter(d => d.pos_anggaran === 'Acara_Majelis_Albarokah')
      .reduce((a, b) => a + Number(b.nominal || 0), 0);

    const totalAcaraWarga = dataList
      .filter(d => d.pos_anggaran === 'Acara_Warga')
      .reduce((a, b) => a + Number(b.nominal || 0), 0);

    const totalSemua = totalOperasional + totalSosial + totalMajelis + totalAcaraWarga;

    return { totalOperasional, totalSosial, totalMajelis, totalAcaraWarga, totalSemua };
  }, [dataList]);

  // CREATE: Tambah Pengeluaran
  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canEdit) return;

    const payload = {
      pos_anggaran: formDataAdd.pos_anggaran,
      tanggal: formDataAdd.tanggal,
      keperluan: formDataAdd.keperluan.trim(),
      nominal: Number(formDataAdd.nominal),
      bukti_nota: formDataAdd.bukti_nota.trim(),
      diinput_oleh: currentUser?.id_pengguna || 1,
    };

    let generatedId = Date.now();

    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabase
          .from('pengeluaran')
          .insert([payload])
          .select();

        if (error) {
          console.error('Error insert pengeluaran:', error);
          alert('Gagal menyimpan ke cloud: ' + error.message);
        } else if (data && data[0]) {
          generatedId = data[0].id_pengeluaran;
        }
      } catch (err: any) {
        console.error('Supabase exception:', err);
      }
    }

    const newEntry: Pengeluaran = {
      id_pengeluaran: generatedId,
      ...payload,
    };

    const updated = [newEntry, ...dataList];
    setDataList(updated);
    localStorage.setItem('local_pengeluaran', JSON.stringify(updated));
    window.dispatchEvent(new Event('app_data_updated'));
    setShowAddModal(false);

    setFormDataAdd({
      pos_anggaran: 'Operasional_Warga',
      tanggal: new Date().toISOString().slice(0, 10),
      keperluan: '',
      nominal: 50000,
      bukti_nota: '',
    });
  };

  // UPDATE: Buka Modal Edit
  const handleOpenEdit = (item: Pengeluaran) => {
    if (!canEdit) return;
    setEditingItem(item);
    setFormDataEdit({
      id_pengeluaran: item.id_pengeluaran,
      pos_anggaran: item.pos_anggaran,
      tanggal: item.tanggal || new Date().toISOString().slice(0, 10),
      keperluan: item.keperluan || '',
      nominal: Number(item.nominal || 0),
      bukti_nota: item.bukti_nota || '',
    });
    setShowEditModal(true);
  };

  // UPDATE: Simpan Hasil Edit
  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem || !canEdit) return;

    const updatePayload = {
      pos_anggaran: formDataEdit.pos_anggaran,
      tanggal: formDataEdit.tanggal,
      keperluan: formDataEdit.keperluan.trim(),
      nominal: Number(formDataEdit.nominal),
      bukti_nota: formDataEdit.bukti_nota.trim(),
      diinput_oleh: currentUser?.id_pengguna || 1,
    };

    if (isSupabaseConfigured) {
      try {
        const { error } = await supabase
          .from('pengeluaran')
          .update(updatePayload)
          .eq('id_pengeluaran', editingItem.id_pengeluaran);

        if (error) {
          console.error('Error update pengeluaran:', error);
          alert('Gagal update di cloud: ' + error.message);
        }
      } catch (err: any) {
        console.error('Supabase update exception:', err);
      }
    }

    const updated = dataList.map(d => 
      d.id_pengeluaran === editingItem.id_pengeluaran 
        ? { ...d, ...updatePayload } 
        : d
    );

    setDataList(updated);
    localStorage.setItem('local_pengeluaran', JSON.stringify(updated));
    window.dispatchEvent(new Event('app_data_updated'));

    setShowEditModal(false);
    setEditingItem(null);
  };

  // DELETE: Hapus Pengeluaran
  const handleDelete = async (id: number) => {
    if (!canEdit) return;
    if (!confirm('Hapus data pengeluaran ini? Saldo kas akan otomatis disesuaikan kembali.')) return;

    if (isSupabaseConfigured) {
      try {
        await supabase.from('pengeluaran').delete().eq('id_pengeluaran', id);
      } catch (err: any) {
        console.error('Error delete pengeluaran:', err);
      }
    }

    const updated = dataList.filter(d => d.id_pengeluaran !== id);
    setDataList(updated);
    localStorage.setItem('local_pengeluaran', JSON.stringify(updated));
    window.dispatchEvent(new Event('app_data_updated'));
  };

  // Filter Data
  const filtered = dataList.filter(d => {
    const q = search.toLowerCase();
    const matchSearch = 
      (d.keperluan?.toLowerCase() || '').includes(q) ||
      (d.pos_anggaran?.toLowerCase() || '').includes(q) ||
      (d.tanggal || '').includes(q) ||
      String(d.nominal || '').includes(q);

    const matchPos = filterPos === 'Semua' || d.pos_anggaran === filterPos;
    return matchSearch && matchPos;
  });

  return (
    <div className="space-y-6 pb-12">
      {/* Header Halaman */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="p-2 bg-rose-100 text-rose-700 rounded-xl">
              <ArrowDownCircle className="w-5 h-5" />
            </span>
            <h2 className="text-xl font-black text-slate-800 tracking-tight">Pengeluaran Terpadu Paguyuban</h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Klasifikasi beban biaya: Operasional Paguyuban, Dana Sosial (Santunan Sakit/Duka), Acara Warga, dan Majelis Al Barokah.
          </p>
        </div>
        {canEdit && (
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center space-x-2 px-4 py-2.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl shadow-sm transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Catat Pengeluaran Baru</span>
          </button>
        )}
      </div>

      {/* 4 Kartu KPI Ringkasan Pos Biaya */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Operasional Warga</span>
            <Receipt className="w-4 h-4 text-slate-500" />
          </div>
          <p className="text-lg md:text-xl font-black text-slate-800 mt-2">{formatRupiah(stats.totalOperasional)}</p>
          <span className="text-[10px] text-slate-400">Listrik, Tenda, Stempel, ATK</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-rose-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-rose-600 uppercase tracking-wider">Pos Sosial Warga</span>
            <HeartHandshake className="w-4 h-4 text-rose-600" />
          </div>
          <p className="text-lg md:text-xl font-black text-rose-600 mt-2">{formatRupiah(stats.totalSosial)}</p>
          <span className="text-[10px] text-rose-700 font-semibold">Santunan Sakit & Takziah</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-teal-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-teal-600 uppercase tracking-wider">Majelis Al Barokah</span>
            <Landmark className="w-4 h-4 text-teal-600" />
          </div>
          <p className="text-lg md:text-xl font-black text-teal-700 mt-2">{formatRupiah(stats.totalMajelis)}</p>
          <span className="text-[10px] text-teal-700 font-semibold">Tarawih, PHBI, Pengajian</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-purple-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-purple-600 uppercase tracking-wider">Total Beban Keluar</span>
            <Sparkles className="w-4 h-4 text-purple-600" />
          </div>
          <p className="text-lg md:text-xl font-black text-purple-700 mt-2">-{formatRupiah(stats.totalSemua)}</p>
          <span className="text-[10px] text-slate-400">{dataList.length} Transaksi Tercatat</span>
        </div>
      </div>

      {/* Bar Filter & Pencarian */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Cari rincian keperluan pengeluaran (misal: santunan, tenda, stempel, listrik)..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs outline-none focus:border-rose-500 shadow-2xs"
          />
        </div>

        <select
          value={filterPos}
          onChange={e => setFilterPos(e.target.value)}
          className="px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold outline-none text-slate-700 shadow-2xs"
        >
          <option value="Semua">Semua Pos Anggaran ({dataList.length})</option>
          <option value="Operasional_Warga">Operasional Warga</option>
          <option value="Sosial_Warga">Sosial Warga (Santunan)</option>
          <option value="Acara_Majelis_Albarokah">Acara Majelis Al Barokah</option>
          <option value="Acara_Warga">Acara Paguyuban Warga</option>
        </select>
      </div>

      {/* Tabel Data Pengeluaran */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 border-b text-[10px] uppercase font-bold text-slate-500 select-none">
              <tr>
                <th className="px-3 py-3.5 text-center w-12">No.</th>
                <th className="px-4 py-3.5 min-w-[95px]">Tanggal</th>
                <th className="px-4 py-3.5 min-w-[150px]">Pos Anggaran</th>
                <th className="px-4 py-3.5 min-w-[260px]">Keperluan / Rincian Biaya</th>
                <th className="px-4 py-3.5 text-right min-w-[110px]">Nominal</th>
                <th className="px-4 py-3.5 text-center min-w-[80px]">Bukti Nota</th>
                {canEdit && <th className="px-4 py-3.5 text-right min-w-[90px]">Aksi</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr><td colSpan={canEdit ? 7 : 6} className="px-4 py-8 text-center text-slate-400">Memuat catatan pengeluaran...</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={canEdit ? 7 : 6} className="px-4 py-8 text-center text-slate-400">Belum ada data pengeluaran untuk filter ini.</td></tr>
              ) : (
                filtered.map((d, idx) => {
                  const isSosial = d.pos_anggaran === 'Sosial_Warga';
                  const isMajelis = d.pos_anggaran === 'Acara_Majelis_Albarokah';
                  const isAcara = d.pos_anggaran === 'Acara_Warga';

                  return (
                    <tr key={d.id_pengeluaran} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-3 py-3.5 text-center font-mono text-slate-400 text-xs">{idx + 1}</td>
                      <td className="px-4 py-3.5 font-mono text-slate-500">{d.tanggal}</td>
                      
                      <td className="px-4 py-3.5">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase border ${
                          isSosial ? 'bg-rose-50 text-rose-700 border-rose-200' :
                          isMajelis ? 'bg-teal-50 text-teal-700 border-teal-200' :
                          isAcara ? 'bg-purple-50 text-purple-700 border-purple-200' :
                          'bg-slate-100 text-slate-700 border-slate-200'
                        }`}>
                          {d.pos_anggaran.replace(/_/g, ' ')}
                        </span>
                      </td>

                      <td className="px-4 py-3.5">
                        <p className="font-semibold text-slate-900 leading-snug">{d.keperluan}</p>
                      </td>

                      <td className="px-4 py-3.5 text-right font-black font-mono text-rose-600 text-xs">
                        -{formatRupiah(d.nominal)}
                      </td>

                      <td className="px-4 py-3.5 text-center">
                        {d.bukti_nota && d.bukti_nota.trim() !== '' ? (
                          <button
                            type="button"
                            onClick={() => setPreviewUrl(d.bukti_nota!)}
                            className="text-blue-600 hover:underline inline-flex items-center space-x-1 font-semibold"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                            <span>Nota</span>
                          </button>
                        ) : (
                          <span className="text-slate-300">-</span>
                        )}
                      </td>

                      {canEdit && (
                        <td className="px-4 py-3.5 text-right space-x-1 whitespace-nowrap">
                          <button
                            onClick={() => handleOpenEdit(d)}
                            className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Edit Pengeluaran"
                          >
                            <Edit2 className="w-3.5 h-3.5 inline" />
                          </button>
                          <button
                            onClick={() => handleDelete(d.id_pengeluaran)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                            title="Hapus Pengeluaran"
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

      {/* MODAL 1: TAMBAH PENGELUARAN */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/60 flex items-center justify-center p-4 z-50 backdrop-blur-xs">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="font-black text-slate-900 text-sm">Catat Pengeluaran Kas Baru</h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-600"><X className="w-4 h-4" /></button>
            </div>

            <form onSubmit={handleAddSubmit} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-slate-600 mb-1">Pos Anggaran Pengeluaran *</label>
                <select
                  value={formDataAdd.pos_anggaran}
                  onChange={e => setFormDataAdd({ ...formDataAdd, pos_anggaran: e.target.value as PosPengeluaran })}
                  className="w-full px-3 py-2 border rounded-xl outline-none font-bold text-slate-800 bg-white focus:border-rose-500"
                >
                  <option value="Operasional_Warga">Operasional Warga (Listrik, Stempel, ATK, Kebersihan)</option>
                  <option value="Sosial_Warga">Sosial Warga (Santunan Sakit, Takziah, Musibah)</option>
                  <option value="Acara_Majelis_Albarokah">Acara Majelis Al Barokah (PHBI, Pengajian, Tarawih)</option>
                  <option value="Acara_Warga">Acara Paguyuban Warga (Silaturahmi, 17-an)</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-600 mb-1">Tanggal Transaksi *</label>
                  <input
                    required
                    type="date"
                    value={formDataAdd.tanggal}
                    onChange={(e) => setFormDataAdd({ ...formDataAdd, tanggal: e.target.value })}
                    className="w-full px-3 py-2 border rounded-xl outline-none"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-600 mb-1">Nominal Biaya (Rp) *</label>
                  <input
                    required
                    type="number"
                    step="1000"
                    value={formDataAdd.nominal}
                    onChange={(e) => setFormDataAdd({ ...formDataAdd, nominal: Number(e.target.value) })}
                    className="w-full px-3 py-2 border rounded-xl outline-none font-black text-rose-600"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-600 mb-1">Keperluan / Keterangan Lengkap *</label>
                <textarea
                  required
                  rows={2}
                  placeholder="Misal: Santunan untuk Pak Encep A5/11 (Paska Operasi) / Pembelian token listrik"
                  value={formDataAdd.keperluan}
                  onChange={(e) => setFormDataAdd({ ...formDataAdd, keperluan: e.target.value })}
                  className="w-full px-3 py-2 border rounded-xl outline-none focus:border-rose-500"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-600 mb-1">Link URL Bukti / Nota (Opsional)</label>
                <input
                  type="text"
                  placeholder="https://drive.google.com/... atau tautan gambar"
                  value={formDataAdd.bukti_nota}
                  onChange={(e) => setFormDataAdd({ ...formDataAdd, bukti_nota: e.target.value })}
                  className="w-full px-3 py-2 border rounded-xl outline-none"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-3 border-t">
                <button type="button" onClick={() => setShowAddModal(false)} className="px-4 py-2 border rounded-xl font-bold text-slate-600">Batal</button>
                <button type="submit" className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold shadow-md">Simpan Pengeluaran</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: EDIT PENGELUARAN */}
      {showEditModal && editingItem && (
        <div className="fixed inset-0 bg-slate-900/60 flex items-center justify-center p-4 z-50 backdrop-blur-xs">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b pb-3">
              <div className="flex items-center space-x-2">
                <Edit2 className="w-4 h-4 text-blue-600" />
                <h3 className="font-black text-slate-900 text-sm">Edit Data Pengeluaran Kas</h3>
              </div>
              <button onClick={() => setShowEditModal(false)} className="text-slate-400 hover:text-slate-600"><X className="w-4 h-4" /></button>
            </div>

            <form onSubmit={handleEditSubmit} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-slate-600 mb-1">Pos Anggaran Pengeluaran *</label>
                <select
                  value={formDataEdit.pos_anggaran}
                  onChange={(e) => setFormDataEdit({ ...formDataEdit, pos_anggaran: e.target.value as PosPengeluaran })}
                  className="w-full px-3 py-2 border rounded-xl outline-none font-bold text-slate-800 bg-white focus:border-blue-500"
                >
                  <option value="Operasional_Warga">Operasional Warga (Listrik, Stempel, ATK, Kebersihan)</option>
                  <option value="Sosial_Warga">Sosial Warga (Santunan Sakit, Takziah, Musibah)</option>
                  <option value="Acara_Majelis_Albarokah">Acara Majelis Al Barokah (PHBI, Pengajian, Tarawih)</option>
                  <option value="Acara_Warga">Acara Paguyuban Warga (Silaturahmi, 17-an)</option>
                </select>
                <p className="text-[10px] text-slate-400 mt-1">
                  💡 Pindahkan ke <strong>Sosial Warga</strong> jika pengeluaran berupa santunan sakit warga.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-600 mb-1">Tanggal Transaksi *</label>
                  <input
                    required
                    type="date"
                    value={formDataEdit.tanggal}
                    onChange={(e) => setFormDataEdit({ ...formDataEdit, tanggal: e.target.value })}
                    className="w-full px-3 py-2 border rounded-xl outline-none"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-600 mb-1">Nominal Biaya (Rp) *</label>
                  <input
                    required
                    type="number"
                    step="1000"
                    value={formDataEdit.nominal}
                    onChange={(e) => setFormDataEdit({ ...formDataEdit, nominal: Number(e.target.value) })}
                    className="w-full px-3 py-2 border rounded-xl outline-none font-black text-blue-700"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-600 mb-1">Keperluan / Keterangan *</label>
                <textarea
                  required
                  rows={2}
                  value={formDataEdit.keperluan}
                  onChange={(e) => setFormDataEdit({ ...formDataEdit, keperluan: e.target.value })}
                  className="w-full px-3 py-2 border rounded-xl outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-600 mb-1">Link URL Bukti / Nota</label>
                <input
                  type="text"
                  placeholder="https://..."
                  value={formDataEdit.bukti_nota}
                  onChange={(e) => setFormDataEdit({ ...formDataEdit, bukti_nota: e.target.value })}
                  className="w-full px-3 py-2 border rounded-xl outline-none"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-3 border-t">
                <button type="button" onClick={() => setShowEditModal(false)} className="px-4 py-2 border rounded-xl font-bold text-slate-600">Batal</button>
                <button type="submit" className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold shadow-md">Simpan Perubahan</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Preview Gambar / Tautan */}
      <ImageViewerModal url={previewUrl} onClose={() => setPreviewUrl(null)} />
    </div>
  );
};

export default PengeluaranPage;