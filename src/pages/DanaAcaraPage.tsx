// src/pages/DanaAcaraPage.tsx
import React, { useEffect, useState, useMemo } from 'react';
import { supabase, isSupabaseConfigured } from '../supabase';
import { DanaAcara, formatRupiah, Pengguna, Warga } from '../types';
import { 
  Calendar, Plus, Search, X, ExternalLink, Trash2, Edit2,
  TrendingUp, TrendingDown, Scale, Gift, Sparkles, Home, User
} from 'lucide-react';
import { WargaSearchSelect } from '../components/WargaSearchSelect';
import { ImageViewerModal } from '../components/ImageViewerModal';

export const DanaAcaraPage: React.FC<{ currentUser?: Pengguna }> = ({ currentUser }) => {
  const [dataList, setDataList] = useState<DanaAcara[]>([]);
  const [wargaList, setWargaList] = useState<Warga[]>([]);
  const [loading, setLoading] = useState(true);
  
  // State Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingItem, setEditingItem] = useState<DanaAcara | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  // State Filter & Search
  const [search, setSearch] = useState('');
  const [filterAcara, setFilterAcara] = useState<string>('Semua');
  const [filterKategori, setFilterKategori] = useState<string>('Semua');

  // Form State: Tambah Transaksi
  const [isWargaDonorAdd, setIsWargaDonorAdd] = useState(true);
  const [formDataAdd, setFormDataAdd] = useState({
    nama_acara: 'Acara Silaturahmi Paguyuban Beryl',
    kategori: 'Pemasukan' as 'Pemasukan' | 'Pengeluaran',
    pos_sub_anggaran: 'Donasi Sukarela',
    id_warga: '',
    nama_donatur_luar: '',
    id_rumah_manual: '',
    tanggal: new Date().toISOString().slice(0, 10),
    nominal: 50000,
    keterangan: '',
    bukti_nota: '',
  });

  // Form State: Edit Transaksi
  const [isWargaDonorEdit, setIsWargaDonorEdit] = useState(true);
  const [formDataEdit, setFormDataEdit] = useState({
    id_transaksi: 0,
    nama_acara: '',
    kategori: 'Pemasukan' as 'Pemasukan' | 'Pengeluaran',
    pos_sub_anggaran: 'Donasi Sukarela',
    id_warga: '',
    nama_donatur_luar: '',
    id_rumah_manual: '',
    tanggal: '',
    nominal: 0,
    keterangan: '',
    bukti_nota: '',
  });

  const canEdit = !currentUser || currentUser.peran === 'Super_Admin' || currentUser.peran === 'Admin_Keuangan';

  const loadData = async () => {
    setLoading(true);
    let loadedDana: DanaAcara[] = [];
    let loadedWarga: Warga[] = [];

    if (isSupabaseConfigured) {
      try {
        const [resDana, resWarga] = await Promise.all([
          supabase.from('dana_acara').select('*').order('tanggal', { ascending: false }),
          supabase.from('warga').select('*').order('id_rumah', { ascending: true }),
        ]);

        if (resWarga.data && resWarga.data.length > 0) {
          loadedWarga = resWarga.data;
        }

        if (resDana.data && resDana.data.length > 0) {
          loadedDana = resDana.data.map((d: any) => {
            let donorNama = d.nama_warga || d.nama_donatur_luar;
            let donorRumah = d.id_rumah;

            // Resolusi jika data warga tersimpan lewat id_warga
            if ((!donorNama || donorNama === 'Donatur') && d.id_warga && loadedWarga.length > 0) {
              const matchedWarga = loadedWarga.find(w => w.id_warga === d.id_warga);
              if (matchedWarga) {
                donorNama = matchedWarga.nama_lengkap;
                donorRumah = matchedWarga.id_rumah;
              }
            }

            return {
              ...d,
              nama_warga: donorNama || (d.kategori === 'Pemasukan' ? 'Warga Beryl' : '-'),
              id_rumah: donorRumah || '-',
              nama_donatur_luar: d.nama_donatur_luar || donorNama,
            };
          });
        }
      } catch (err: any) {
        console.warn('Fallback offline DanaAcara:', err.message);
      }
    }

    if (loadedDana.length === 0) {
      const local = localStorage.getItem('local_dana_acara');
      if (local) loadedDana = JSON.parse(local);
    }
    if (loadedWarga.length === 0) {
      const localW = localStorage.getItem('local_warga');
      if (localW) loadedWarga = JSON.parse(localW);
    }

    setDataList(loadedDana);
    setWargaList(loadedWarga);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
    const handleUpdate = () => loadData();
    window.addEventListener('app_data_updated', handleUpdate);
    return () => window.removeEventListener('app_data_updated', handleUpdate);
  }, []);

  // Daftar Acara Unik untuk Filter
  const uniqueAcaraList = useMemo(() => {
    const set = new Set<string>();
    dataList.forEach(d => {
      if (d.nama_acara) set.add(d.nama_acara.trim());
    });
    return Array.from(set);
  }, [dataList]);

  // Statistik Donasi & Pengeluaran Acara
  const stats = useMemo(() => {
    const targetData = filterAcara === 'Semua' 
      ? dataList 
      : dataList.filter(d => d.nama_acara === filterAcara);

    const totalMasuk = targetData
      .filter(d => d.kategori === 'Pemasukan')
      .reduce((sum, d) => sum + Number(d.nominal || 0), 0);

    const totalKeluar = targetData
      .filter(d => d.kategori === 'Pengeluaran')
      .reduce((sum, d) => sum + Number(d.nominal || 0), 0);

    const saldoSisa = totalMasuk - totalKeluar;
    const countDonatur = targetData.filter(d => d.kategori === 'Pemasukan').length;

    return { totalMasuk, totalKeluar, saldoSisa, countDonatur };
  }, [dataList, filterAcara]);

  // ==========================================
  // CREATE: TAMBAH TRANSAKSI ACARA BARU
  // ==========================================
  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    let finalDonorName = formDataAdd.nama_donatur_luar.trim();
    let finalRumah = formDataAdd.id_rumah_manual.trim() || '-';
    let selectedWargaObj: Warga | undefined;

    if (formDataAdd.kategori === 'Pemasukan') {
      if (isWargaDonorAdd && formDataAdd.id_warga) {
        selectedWargaObj = wargaList.find(w => String(w.id_warga) === String(formDataAdd.id_warga));
        if (selectedWargaObj) {
          finalDonorName = selectedWargaObj.nama_lengkap;
          finalRumah = selectedWargaObj.id_rumah;
        }
      }
      if (!finalDonorName) {
        alert('Silakan pilih warga donatur atau masukkan nama donatur!');
        return;
      }
    }

    const payload = {
      nama_acara: formDataAdd.nama_acara.trim(),
      kategori: formDataAdd.kategori,
      pos_sub_anggaran: formDataAdd.pos_sub_anggaran,
      id_warga: formDataAdd.kategori === 'Pemasukan' && isWargaDonorAdd && formDataAdd.id_warga ? Number(formDataAdd.id_warga) : null,
      nama_warga: selectedWargaObj?.nama_lengkap || finalDonorName,
      id_rumah: finalRumah,
      nama_donatur_luar: finalDonorName,
      tanggal: formDataAdd.tanggal,
      nominal: Number(formDataAdd.nominal),
      keterangan: formDataAdd.keterangan.trim() || (formDataAdd.kategori === 'Pemasukan' ? `Donasi Acara - ${finalDonorName}` : formDataAdd.pos_sub_anggaran),
      bukti_nota: formDataAdd.bukti_nota.trim(),
      diinput_oleh: currentUser?.id_pengguna || 1,
    };

    let generatedId = Date.now();

    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabase.from('dana_acara').insert([payload]).select();
        if (error) {
          console.error('Error insert dana_acara:', error);
          alert('Gagal menyimpan ke database cloud: ' + error.message);
        } else if (data && data[0]) {
          generatedId = data[0].id_transaksi;
        }
      } catch (err: any) {
        console.error('Supabase insert exception:', err);
      }
    }

    const newEntry: DanaAcara = {
      id_transaksi: generatedId,
      ...payload,
    };

    const updated = [newEntry, ...dataList];
    setDataList(updated);
    localStorage.setItem('local_dana_acara', JSON.stringify(updated));
    window.dispatchEvent(new Event('app_data_updated'));
    setShowAddModal(false);

    // Reset Form Tambah
    setFormDataAdd({
      nama_acara: formDataAdd.nama_acara,
      kategori: 'Pemasukan',
      pos_sub_anggaran: 'Donasi Sukarela',
      id_warga: '',
      nama_donatur_luar: '',
      id_rumah_manual: '',
      tanggal: new Date().toISOString().slice(0, 10),
      nominal: 50000,
      keterangan: '',
      bukti_nota: '',
    });
  };

  // ==========================================
  // UPDATE: BUKA MODAL EDIT TRANSAKSI
  // ==========================================
  const handleOpenEdit = (item: DanaAcara) => {
    if (!canEdit) return;
    setEditingItem(item);

    const hasWargaId = Boolean(item.id_warga && item.id_warga > 0);
    setIsWargaDonorEdit(hasWargaId || !item.nama_donatur_luar);

    setFormDataEdit({
      id_transaksi: item.id_transaksi,
      nama_acara: item.nama_acara || 'Acara Silaturahmi Paguyuban Beryl',
      kategori: item.kategori || 'Pemasukan',
      pos_sub_anggaran: item.pos_sub_anggaran || (item.kategori === 'Pemasukan' ? 'Donasi Sukarela' : 'Lain-lain Acara'),
      id_warga: item.id_warga ? String(item.id_warga) : '',
      nama_donatur_luar: item.nama_donatur_luar || item.nama_warga || '',
      id_rumah_manual: item.id_rumah || '',
      tanggal: item.tanggal || new Date().toISOString().slice(0, 10),
      nominal: Number(item.nominal || 0),
      keterangan: item.keterangan || '',
      bukti_nota: item.bukti_nota || '',
    });

    setShowEditModal(true);
  };

  // ==========================================
  // UPDATE: SIMPAN HASIL EDIT
  // ==========================================
  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem || !canEdit) return;

    let finalDonorName = formDataEdit.nama_donatur_luar.trim();
    let finalRumah = formDataEdit.id_rumah_manual.trim() || editingItem.id_rumah || '-';
    let selectedWargaObj: Warga | undefined;

    if (formDataEdit.kategori === 'Pemasukan') {
      if (isWargaDonorEdit && formDataEdit.id_warga) {
        selectedWargaObj = wargaList.find(w => String(w.id_warga) === String(formDataEdit.id_warga));
        if (selectedWargaObj) {
          finalDonorName = selectedWargaObj.nama_lengkap;
          finalRumah = selectedWargaObj.id_rumah;
        }
      }
      if (!finalDonorName) {
        alert('Nama donatur / keperluan tidak boleh kosong!');
        return;
      }
    } else {
      finalDonorName = editingItem.nama_donatur_luar || '';
    }

    const updatePayload = {
      nama_acara: formDataEdit.nama_acara.trim(),
      kategori: formDataEdit.kategori,
      pos_sub_anggaran: formDataEdit.pos_sub_anggaran,
      id_warga: formDataEdit.kategori === 'Pemasukan' && isWargaDonorEdit && formDataEdit.id_warga ? Number(formDataEdit.id_warga) : null,
      nama_warga: selectedWargaObj?.nama_lengkap || finalDonorName,
      id_rumah: finalRumah,
      nama_donatur_luar: finalDonorName,
      tanggal: formDataEdit.tanggal,
      nominal: Number(formDataEdit.nominal),
      keterangan: formDataEdit.keterangan.trim() || (formDataEdit.kategori === 'Pemasukan' ? `Donasi Acara - ${finalDonorName}` : formDataEdit.pos_sub_anggaran),
      bukti_nota: formDataEdit.bukti_nota.trim(),
      diinput_oleh: currentUser?.id_pengguna || 1,
    };

    if (isSupabaseConfigured) {
      try {
        const { error } = await supabase
          .from('dana_acara')
          .update(updatePayload)
          .eq('id_transaksi', editingItem.id_transaksi);

        if (error) {
          console.error('Error update dana_acara:', error);
          alert('Gagal update di cloud database: ' + error.message);
        }
      } catch (err: any) {
        console.error('Supabase update exception:', err);
      }
    }

    const updated = dataList.map(d => d.id_transaksi === editingItem.id_transaksi ? { ...d, ...updatePayload } : d);
    setDataList(updated);
    localStorage.setItem('local_dana_acara', JSON.stringify(updated));
    window.dispatchEvent(new Event('app_data_updated'));

    setShowEditModal(false);
    setEditingItem(null);
  };

  // ==========================================
  // DELETE: HAPUS TRANSAKSI ACARA
  // ==========================================
  const handleDelete = async (id: number) => {
    if (!canEdit) return;
    if (!confirm('Hapus transaksi acara ini? Tindakan ini akan langsung memperbarui saldo kas.')) return;

    if (isSupabaseConfigured) {
      try {
        await supabase.from('dana_acara').delete().eq('id_transaksi', id);
      } catch (err: any) {
        console.error('Error delete dana_acara:', err);
      }
    }

    const updated = dataList.filter(d => d.id_transaksi !== id);
    setDataList(updated);
    localStorage.setItem('local_dana_acara', JSON.stringify(updated));
    window.dispatchEvent(new Event('app_data_updated'));
  };

  // Filter & Search List
  const filteredData = dataList.filter(d => {
    const q = search.toLowerCase();
    const matchSearch = 
      (d.nama_acara?.toLowerCase() || '').includes(q) ||
      (d.nama_warga?.toLowerCase() || '').includes(q) ||
      (d.nama_donatur_luar?.toLowerCase() || '').includes(q) ||
      (d.id_rumah?.toLowerCase() || '').includes(q) ||
      (d.keterangan?.toLowerCase() || '').includes(q) ||
      (d.pos_sub_anggaran?.toLowerCase() || '').includes(q) ||
      String(d.nominal || '').includes(q);

    const matchAcara = filterAcara === 'Semua' || d.nama_acara === filterAcara;
    const matchKategori = filterKategori === 'Semua' || d.kategori === filterKategori;
    return matchSearch && matchAcara && matchKategori;
  });

  return (
    <div className="space-y-6 pb-12">
      {/* Header Halaman */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="p-2 bg-purple-100 text-purple-700 rounded-xl">
              <Calendar className="w-5 h-5" />
            </span>
            <h2 className="text-xl font-black text-slate-800 tracking-tight">Dana Acara Paguyuban Beryl</h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Pengelolaan donasi sukarela & pengeluaran kegiatan warga (Silaturahmi, PHBI, Turnamen, HUT RI).
          </p>
        </div>
        {canEdit && (
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center space-x-2 px-4 py-2.5 bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold rounded-xl shadow-sm transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Catat Transaksi Acara</span>
          </button>
        )}
      </div>

      {/* 4 Kartu KPI Ringkasan */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-white p-4 rounded-2xl border border-emerald-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider">Donasi Acara Masuk</span>
            <TrendingUp className="w-4 h-4 text-emerald-500" />
          </div>
          <p className="text-lg md:text-xl font-black text-emerald-700 mt-2">{formatRupiah(stats.totalMasuk)}</p>
          <span className="text-[10px] text-slate-400">{stats.countDonatur} Donatur Berpartisipasi</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-rose-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-rose-600 uppercase tracking-wider">Pengeluaran Acara</span>
            <TrendingDown className="w-4 h-4 text-rose-500" />
          </div>
          <p className="text-lg md:text-xl font-black text-rose-600 mt-2">-{formatRupiah(stats.totalKeluar)}</p>
          <span className="text-[10px] text-slate-400">Tenda, Konsumsi, Hadiah</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-purple-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-purple-600 uppercase tracking-wider">Sisa Saldo Acara</span>
            <Scale className="w-4 h-4 text-purple-500" />
          </div>
          <p className={`text-lg md:text-xl font-black mt-2 ${stats.saldoSisa >= 0 ? 'text-purple-700' : 'text-rose-600'}`}>
            {formatRupiah(stats.saldoSisa)}
          </p>
          <span className="text-[10px] text-slate-400">{stats.saldoSisa >= 0 ? 'Saldo Surplus ✓' : 'Defisit Anggaran ⚠'}</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Acara Terpilih</span>
            <Sparkles className="w-4 h-4 text-amber-500" />
          </div>
          <p className="text-sm font-bold text-slate-800 mt-2 truncate">{filterAcara}</p>
          <span className="text-[10px] text-slate-400">Terpisah dari Kas Iuran</span>
        </div>
      </div>

      {/* Bar Pencarian & Filter */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Cari transaksi acara, donatur, keperluan tenda / catering..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs outline-none focus:border-purple-500 shadow-2xs"
          />
        </div>

        <select
          value={filterAcara}
          onChange={(e) => setFilterAcara(e.target.value)}
          className="px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold outline-none text-slate-700 shadow-2xs"
        >
          <option value="Semua">Semua Nama Acara ({dataList.length})</option>
          {uniqueAcaraList.map(a => (
            <option key={a} value={a}>{a}</option>
          ))}
        </select>

        <select
          value={filterKategori}
          onChange={(e) => setFilterKategori(e.target.value)}
          className="px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold outline-none text-slate-700 shadow-2xs"
        >
          <option value="Semua">Semua Jenis (Masuk / Keluar)</option>
          <option value="Pemasukan">Pemasukan (Donasi)</option>
          <option value="Pengeluaran">Pengeluaran (Biaya Acara)</option>
        </select>
      </div>

      {/* Tabel Data Transaksi Acara */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 border-b text-[10px] uppercase font-bold text-slate-500 select-none">
              <tr>
                <th className="px-3 py-3.5 text-center w-12">No.</th>
                <th className="px-4 py-3.5 min-w-[95px]">Tanggal</th>
                <th className="px-4 py-3.5 min-w-[170px]">Nama Acara</th>
                <th className="px-4 py-3.5 min-w-[200px]">Donatur / Keperluan</th>
                <th className="px-4 py-3.5 min-w-[130px]">Sub-Anggaran</th>
                <th className="px-4 py-3.5 text-right min-w-[110px]">Nominal</th>
                <th className="px-4 py-3.5 text-center min-w-[80px]">Bukti</th>
                {canEdit && <th className="px-4 py-3.5 text-right min-w-[90px]">Aksi</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr><td colSpan={canEdit ? 8 : 7} className="px-4 py-8 text-center text-slate-400">Memuat data transaksi acara...</td></tr>
              ) : filteredData.length === 0 ? (
                <tr><td colSpan={canEdit ? 8 : 7} className="px-4 py-8 text-center text-slate-400">Belum ada catatan transaksi untuk filter ini.</td></tr>
              ) : (
                filteredData.map((item, idx) => {
                  const isMasuk = item.kategori === 'Pemasukan';
                  const donorDisplay = item.nama_warga || item.nama_donatur_luar || (isMasuk ? 'Warga Beryl' : '-');
                  const unitDisplay = item.id_rumah && item.id_rumah !== '-' ? item.id_rumah : '';

                  return (
                    <tr key={item.id_transaksi} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-3 py-3.5 text-center font-mono text-slate-400 text-xs">{idx + 1}</td>
                      <td className="px-4 py-3.5 font-mono text-slate-500">{item.tanggal}</td>
                      <td className="px-4 py-3.5 font-bold text-slate-900">{item.nama_acara}</td>
                      
                      {/* Kolom Donatur / Keperluan */}
                      <td className="px-4 py-3.5">
                        {isMasuk ? (
                          <div className="space-y-0.5">
                            <div className="flex items-center space-x-1.5 font-bold text-emerald-800">
                              <Gift className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                              <span className="truncate">{donorDisplay}</span>
                            </div>
                            <div className="flex items-center space-x-1.5 text-[10px] text-slate-400">
                              {unitDisplay && (
                                <span className="px-1.5 py-0.2 bg-emerald-50 text-emerald-700 rounded font-mono font-bold border border-emerald-200">
                                  {unitDisplay}
                                </span>
                              )}
                              {item.keterangan && item.keterangan !== donorDisplay && (
                                <span className="truncate">{item.keterangan}</span>
                              )}
                            </div>
                          </div>
                        ) : (
                          <div>
                            <p className="font-semibold text-slate-800 leading-tight">{item.keterangan}</p>
                          </div>
                        )}
                      </td>

                      <td className="px-4 py-3.5">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                          isMasuk ? 'bg-emerald-100 text-emerald-700' : 'bg-purple-100 text-purple-700'
                        }`}>
                          {item.pos_sub_anggaran || (isMasuk ? 'Donasi' : 'Biaya')}
                        </span>
                      </td>

                      <td className={`px-4 py-3.5 text-right font-black font-mono text-xs ${
                        isMasuk ? 'text-emerald-600' : 'text-rose-600'
                      }`}>
                        {isMasuk ? '+' : '-'}{formatRupiah(item.nominal)}
                      </td>

                      <td className="px-4 py-3.5 text-center">
                        {item.bukti_nota && item.bukti_nota.trim() !== '' ? (
                          <button
                            type="button"
                            onClick={() => setPreviewUrl(item.bukti_nota!)}
                            className="text-purple-600 hover:underline inline-flex items-center space-x-1 font-semibold"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                            <span>Lihat</span>
                          </button>
                        ) : '-'}
                      </td>

                      {canEdit && (
                        <td className="px-4 py-3.5 text-right space-x-1 whitespace-nowrap">
                          <button 
                            onClick={() => handleOpenEdit(item)} 
                            className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Edit Transaksi Acara"
                          >
                            <Edit2 className="w-3.5 h-3.5 inline" />
                          </button>
                          <button 
                            onClick={() => handleDelete(item.id_transaksi)} 
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors" 
                            title="Hapus Transaksi"
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
      {/* MODAL 1: TAMBAH TRANSAKSI ACARA BARU                                      */}
      {/* ========================================================================= */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/60 flex items-center justify-center p-4 z-50 backdrop-blur-xs">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="font-black text-slate-900 text-sm">Catat Transaksi Dana Acara Baru</h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-600"><X className="w-4 h-4" /></button>
            </div>

            <form onSubmit={handleAddSubmit} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-slate-600 mb-1">Nama Acara / Kegiatan *</label>
                <input
                  required
                  type="text"
                  placeholder="Misal: Acara Silaturahmi Paguyuban Beryl"
                  value={formDataAdd.nama_acara}
                  onChange={(e) => setFormDataAdd({ ...formDataAdd, nama_acara: e.target.value })}
                  className="w-full px-3 py-2 border rounded-xl font-bold outline-none focus:border-purple-500"
                />
              </div>

              {/* Toggle Kategori Masuk / Keluar */}
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setFormDataAdd({ ...formDataAdd, kategori: 'Pemasukan', pos_sub_anggaran: 'Donasi Sukarela' })}
                  className={`py-2 rounded-xl text-xs font-bold transition-all ${
                    formDataAdd.kategori === 'Pemasukan' ? 'bg-emerald-600 text-white shadow-xs' : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  + Pemasukan (Donasi)
                </button>
                <button
                  type="button"
                  onClick={() => setFormDataAdd({ ...formDataAdd, kategori: 'Pengeluaran', pos_sub_anggaran: 'Sewa Tenda' })}
                  className={`py-2 rounded-xl text-xs font-bold transition-all ${
                    formDataAdd.kategori === 'Pengeluaran' ? 'bg-rose-600 text-white shadow-xs' : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  - Pengeluaran (Biaya)
                </button>
              </div>

              {formDataAdd.kategori === 'Pemasukan' ? (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-600">Sumber Donatur</span>
                    <div className="flex space-x-1.5">
                      <button
                        type="button"
                        onClick={() => setIsWargaDonorAdd(true)}
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${isWargaDonorAdd ? 'bg-purple-600 text-white' : 'bg-slate-100 text-slate-600'}`}
                      >
                        Warga Beryl
                      </button>
                      <button
                        type="button"
                        onClick={() => setIsWargaDonorAdd(false)}
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${!isWargaDonorAdd ? 'bg-purple-600 text-white' : 'bg-slate-100 text-slate-600'}`}
                      >
                        Donatur Luar
                      </button>
                    </div>
                  </div>

                  {isWargaDonorAdd ? (
                    <WargaSearchSelect
                      wargaList={wargaList}
                      selectedId={formDataAdd.id_warga}
                      onSelect={(w) => setFormDataAdd({ ...formDataAdd, id_warga: w ? String(w.id_warga) : '' })}
                      label=""
                      placeholder="Ketik nama warga atau nomor unit blok..."
                    />
                  ) : (
                    <div className="grid grid-cols-3 gap-2">
                      <div className="col-span-2">
                        <label className="block text-[10px] font-bold text-slate-400 mb-0.5">Nama Donatur / Instansi *</label>
                        <input
                          required
                          type="text"
                          placeholder="Misal: PT PMM (Developer) / Sponsor Luar"
                          value={formDataAdd.nama_donatur_luar}
                          onChange={(e) => setFormDataAdd({ ...formDataAdd, nama_donatur_luar: e.target.value })}
                          className="w-full px-3 py-2 border rounded-xl"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 mb-0.5">Unit / Blok</label>
                        <input
                          type="text"
                          placeholder="A-Z"
                          value={formDataAdd.id_rumah_manual}
                          onChange={(e) => setFormDataAdd({ ...formDataAdd, id_rumah_manual: e.target.value })}
                          className="w-full px-3 py-2 border rounded-xl font-mono text-center"
                        />
                      </div>
                    </div>
                  )}

                  <div>
                    <label className="block font-bold text-slate-600 mb-1">Sub-Pos Donasi</label>
                    <select
                      value={formDataAdd.pos_sub_anggaran}
                      onChange={(e) => setFormDataAdd({ ...formDataAdd, pos_sub_anggaran: e.target.value })}
                      className="w-full px-3 py-2 border rounded-xl font-medium outline-none bg-white"
                    >
                      <option value="Donasi Sukarela">Donasi Sukarela Warga</option>
                      <option value="Sponsor Utama">Sponsor Utama Developer (PMM)</option>
                      <option value="Sponsor Luar">Sponsor / Donatur Luar</option>
                      <option value="Kupon / Bazar">Penjualan Kupon / Bazar</option>
                      <option value="Lain-lain Pemasukan">Lain-lain Pemasukan</option>
                    </select>
                  </div>
                </div>
              ) : (
                <div>
                  <label className="block font-bold text-slate-600 mb-1">Sub-Pos Pengeluaran Acara</label>
                  <select
                    value={formDataAdd.pos_sub_anggaran}
                    onChange={(e) => setFormDataAdd({ ...formDataAdd, pos_sub_anggaran: e.target.value })}
                    className="w-full px-3 py-2 border rounded-xl outline-none font-medium bg-white"
                  >
                    <option value="Sewa Tenda & Terpal">Sewa Tenda & Terpal</option>
                    <option value="Catering & Konsumsi">Catering & Konsumsi</option>
                    <option value="Banner & Spanduk">Banner & Spanduk</option>
                    <option value="Hadiah & Doorprize">Hadiah & Doorprize</option>
                    <option value="Sound System & Mic">Sound System & Mic</option>
                    <option value="Bensin & Angkut Barang">Bensin & Angkut Barang</option>
                    <option value="Amplop Undangan / Tokoh">Amplop Undangan / Tokoh</option>
                    <option value="Lain-lain Acara">Lain-lain Acara</option>
                  </select>
                </div>
              )}

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
                  <label className="block font-bold text-slate-600 mb-1">Nominal (Rp) *</label>
                  <input
                    required
                    type="number"
                    step="5000"
                    value={formDataAdd.nominal}
                    onChange={(e) => setFormDataAdd({ ...formDataAdd, nominal: Number(e.target.value) })}
                    className="w-full px-3 py-2 border rounded-xl font-black text-purple-700 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-600 mb-1">Keterangan / Rincian</label>
                <input
                  type="text"
                  placeholder="Misal: Sewa tenda 2 set + karpet / Donasi sukarela"
                  value={formDataAdd.keterangan}
                  onChange={(e) => setFormDataAdd({ ...formDataAdd, keterangan: e.target.value })}
                  className="w-full px-3 py-2 border rounded-xl outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-600 mb-1">Link URL Bukti / Nota (Opsional)</label>
                <input
                  type="text"
                  placeholder="https://drive.google.com/... atau link gambar"
                  value={formDataAdd.bukti_nota}
                  onChange={(e) => setFormDataAdd({ ...formDataAdd, bukti_nota: e.target.value })}
                  className="w-full px-3 py-2 border rounded-xl outline-none"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-3 border-t">
                <button type="button" onClick={() => setShowAddModal(false)} className="px-4 py-2 border rounded-xl font-bold text-slate-600">Batal</button>
                <button type="submit" className="px-5 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-bold shadow-md">Simpan Transaksi</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: EDIT / UPDATE TRANSAKSI ACARA (CRUD EDIT)                        */}
      {/* ========================================================================= */}
      {showEditModal && editingItem && (
        <div className="fixed inset-0 bg-slate-900/60 flex items-center justify-center p-4 z-50 backdrop-blur-xs">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b pb-3">
              <div className="flex items-center space-x-2">
                <Edit2 className="w-4 h-4 text-blue-600" />
                <h3 className="font-black text-slate-900 text-sm">Edit Data Transaksi Acara</h3>
              </div>
              <button onClick={() => setShowEditModal(false)} className="text-slate-400 hover:text-slate-600"><X className="w-4 h-4" /></button>
            </div>

            <form onSubmit={handleEditSubmit} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-slate-600 mb-1">Nama Acara / Kegiatan *</label>
                <input
                  required
                  type="text"
                  value={formDataEdit.nama_acara}
                  onChange={(e) => setFormDataEdit({ ...formDataEdit, nama_acara: e.target.value })}
                  className="w-full px-3 py-2 border rounded-xl font-bold outline-none focus:border-blue-500"
                />
              </div>

              {/* Toggle Kategori Masuk / Keluar */}
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setFormDataEdit({ ...formDataEdit, kategori: 'Pemasukan' })}
                  className={`py-2 rounded-xl text-xs font-bold transition-all ${
                    formDataEdit.kategori === 'Pemasukan' ? 'bg-emerald-600 text-white shadow-xs' : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  + Pemasukan (Donasi)
                </button>
                <button
                  type="button"
                  onClick={() => setFormDataEdit({ ...formDataEdit, kategori: 'Pengeluaran' })}
                  className={`py-2 rounded-xl text-xs font-bold transition-all ${
                    formDataEdit.kategori === 'Pengeluaran' ? 'bg-rose-600 text-white shadow-xs' : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  - Pengeluaran (Biaya)
                </button>
              </div>

              {formDataEdit.kategori === 'Pemasukan' ? (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-600">Pemberi Donatur</span>
                    <div className="flex space-x-1.5">
                      <button
                        type="button"
                        onClick={() => setIsWargaDonorEdit(true)}
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${isWargaDonorEdit ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600'}`}
                      >
                        Warga Beryl
                      </button>
                      <button
                        type="button"
                        onClick={() => setIsWargaDonorEdit(false)}
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${!isWargaDonorEdit ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600'}`}
                      >
                        Donatur Luar / Manual
                      </button>
                    </div>
                  </div>

                  {isWargaDonorEdit ? (
                    <WargaSearchSelect
                      wargaList={wargaList}
                      selectedId={formDataEdit.id_warga}
                      onSelect={(w) => {
                        setFormDataEdit({ 
                          ...formDataEdit, 
                          id_warga: w ? String(w.id_warga) : '',
                          nama_donatur_luar: w ? w.nama_lengkap : formDataEdit.nama_donatur_luar,
                          id_rumah_manual: w ? w.id_rumah : formDataEdit.id_rumah_manual
                        });
                      }}
                      label=""
                      placeholder="Ketik nama warga atau nomor unit blok..."
                    />
                  ) : (
                    <div className="grid grid-cols-3 gap-2">
                      <div className="col-span-2">
                        <label className="block text-[10px] font-bold text-slate-400 mb-0.5">Nama Donatur / Instansi *</label>
                        <input
                          required
                          type="text"
                          value={formDataEdit.nama_donatur_luar}
                          onChange={(e) => setFormDataEdit({ ...formDataEdit, nama_donatur_luar: e.target.value })}
                          className="w-full px-3 py-2 border rounded-xl"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 mb-0.5">Unit / Blok</label>
                        <input
                          type="text"
                          value={formDataEdit.id_rumah_manual}
                          onChange={(e) => setFormDataEdit({ ...formDataEdit, id_rumah_manual: e.target.value })}
                          className="w-full px-3 py-2 border rounded-xl font-mono text-center"
                        />
                      </div>
                    </div>
                  )}

                  <div>
                    <label className="block font-bold text-slate-600 mb-1">Sub-Pos Donasi</label>
                    <select
                      value={formDataEdit.pos_sub_anggaran}
                      onChange={(e) => setFormDataEdit({ ...formDataEdit, pos_sub_anggaran: e.target.value })}
                      className="w-full px-3 py-2 border rounded-xl font-medium outline-none bg-white"
                    >
                      <option value="Donasi Sukarela">Donasi Sukarela Warga</option>
                      <option value="Sponsor Utama">Sponsor Utama Developer (PMM)</option>
                      <option value="Sponsor Luar">Sponsor / Donatur Luar</option>
                      <option value="Kupon / Bazar">Penjualan Kupon / Bazar</option>
                      <option value="Lain-lain Pemasukan">Lain-lain Pemasukan</option>
                    </select>
                  </div>
                </div>
              ) : (
                <div>
                  <label className="block font-bold text-slate-600 mb-1">Sub-Pos Pengeluaran Acara</label>
                  <select
                    value={formDataEdit.pos_sub_anggaran}
                    onChange={(e) => setFormDataEdit({ ...formDataEdit, pos_sub_anggaran: e.target.value })}
                    className="w-full px-3 py-2 border rounded-xl outline-none font-medium bg-white"
                  >
                    <option value="Sewa Tenda & Terpal">Sewa Tenda & Terpal</option>
                    <option value="Catering & Konsumsi">Catering & Konsumsi</option>
                    <option value="Banner & Spanduk">Banner & Spanduk</option>
                    <option value="Hadiah & Doorprize">Hadiah & Doorprize</option>
                    <option value="Sound System & Mic">Sound System & Mic</option>
                    <option value="Bensin & Angkut Barang">Bensin & Angkut Barang</option>
                    <option value="Amplop Undangan / Tokoh">Amplop Undangan / Tokoh</option>
                    <option value="Lain-lain Acara">Lain-lain Acara</option>
                  </select>
                </div>
              )}

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
                  <label className="block font-bold text-slate-600 mb-1">Nominal (Rp) *</label>
                  <input
                    required
                    type="number"
                    step="5000"
                    value={formDataEdit.nominal}
                    onChange={(e) => setFormDataEdit({ ...formDataEdit, nominal: Number(e.target.value) })}
                    className="w-full px-3 py-2 border rounded-xl font-black text-blue-700 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-600 mb-1">Keterangan / Rincian Transaksi</label>
                <input
                  type="text"
                  value={formDataEdit.keterangan}
                  onChange={(e) => setFormDataEdit({ ...formDataEdit, keterangan: e.target.value })}
                  className="w-full px-3 py-2 border rounded-xl outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-600 mb-1">Link URL Bukti / Nota</label>
                <input
                  type="text"
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

export default DanaAcaraPage;