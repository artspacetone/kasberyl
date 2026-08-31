// src/pages/PinjamanWarga.tsx
import React, { useEffect, useState, useMemo } from 'react';
import { supabase, isSupabaseConfigured } from '../supabase';
import { Warga, PinjamanWarga, CicilanPinjaman, formatRupiah, Pengguna } from '../types';
import { 
  Plus, X, Trash2, Edit2, Search, FileSpreadsheet, 
  HandCoins, CheckCircle2, AlertTriangle, History, 
  Calendar, FileText, Coins, Eye, Activity, HeartPulse, GraduationCap, 
  Home, ShoppingBag, Briefcase, HelpCircle
} from 'lucide-react';
import { WargaSearchSelect } from '../components/WargaSearchSelect';
import { exportPinjamanToExcel } from '../utils/exportManager';

const KATEGORI_PENGGUNAAN = [
  { label: 'Darurat Medis / Berobat', icon: HeartPulse, color: 'bg-rose-50 text-rose-700 border-rose-200' },
  { label: 'Biaya Pendidikan / Sekolah', icon: GraduationCap, color: 'bg-blue-50 text-blue-700 border-blue-200' },
  { label: 'Renovasi Musibah / Darurat Rumah', icon: Home, color: 'bg-amber-50 text-amber-700 border-amber-200' },
  { label: 'Kebutuhan Pokok Mendesak', icon: ShoppingBag, color: 'bg-purple-50 text-purple-700 border-purple-200' },
  { label: 'Modal Usaha Kecil Warga', icon: Briefcase, color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  { label: 'Lain-lain Kebutuhan Sosial', icon: HelpCircle, color: 'bg-slate-50 text-slate-700 border-slate-200' }
];

export const PinjamanWargaPage: React.FC<{ currentUser?: Pengguna }> = ({ currentUser }) => {
  const [wargaList, setWargaList] = useState<Warga[]>([]);
  const [pinjamanList, setPinjamanList] = useState<PinjamanWarga[]>([]);
  const [cicilanList, setCicilanList] = useState<CicilanPinjaman[]>([]);
  const [loading, setLoading] = useState(true);
  
  // State Filter & Pencarian
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('Semua');

  // State Modal CRUD
  const [showModalAdd, setShowModalAdd] = useState(false);
  const [showModalEdit, setShowModalEdit] = useState(false);
  const [showModalCicil, setShowModalCicil] = useState(false);
  const [showModalDetail, setShowModalDetail] = useState(false);
  
  const [selectedPinjaman, setSelectedPinjaman] = useState<PinjamanWarga | null>(null);

  // Hak Akses (Warga/Tamu = View Only)
  const isGuest = !currentUser || currentUser.id_pengguna === 0 || currentUser.peran === 'Warga';
  const canEdit = !isGuest && (currentUser.peran === 'Super_Admin' || currentUser.peran === 'Admin_Keuangan');

  // Form State Tambah
  const [formAdd, setFormAdd] = useState({
    id_warga: '',
    kategori_penggunaan: 'Darurat Medis / Berobat',
    nominal_pinjaman: 500000,
    tanggal_pinjam: new Date().toISOString().slice(0, 10),
    keterangan_detail: '',
  });

  // Form State Edit
  const [formEdit, setFormEdit] = useState({
    id_pinjaman: 0,
    kategori_penggunaan: '',
    nominal_pinjaman: 0,
    sisa_pinjaman: 0,
    tanggal_pinjam: '',
    status_pinjaman: 'Berjalan' as 'Berjalan' | 'Lunas' | 'Macet',
    keterangan_detail: '',
  });

  // Form State Cicilan
  const [formCicil, setFormCicil] = useState({
    nominal: 100000,
    tanggal_bayar: new Date().toISOString().slice(0, 10),
    catatan: 'Angsuran Pinjaman',
  });

  const loadData = async () => {
    setLoading(true);
    let loadedW: Warga[] = [];
    let loadedP: PinjamanWarga[] = [];
    let loadedC: CicilanPinjaman[] = [];

    if (isSupabaseConfigured) {
      try {
        const [resWarga, resPinjam, resCicilan] = await Promise.all([
          supabase.from('warga').select('*').order('id_rumah', { ascending: true }),
          supabase.from('pinjaman_warga').select('*, warga(nama_lengkap, id_rumah)').order('id_pinjaman', { ascending: false }),
          supabase.from('cicilan_pinjaman').select('*').order('tanggal_bayar', { ascending: false }),
        ]);

        if (resWarga.data && resWarga.data.length > 0) loadedW = resWarga.data;
        if (resPinjam.data && resPinjam.data.length > 0) {
          loadedP = resPinjam.data.map((p: any) => ({
            ...p,
            nama_warga: p.warga?.nama_lengkap || p.nama_warga,
            id_rumah: p.warga?.id_rumah || p.id_rumah,
          }));
        }
        if (resCicilan.data && resCicilan.data.length > 0) loadedC = resCicilan.data;
      } catch (err) {
        console.warn('Fallback offline Pinjaman:', err);
      }
    }

    if (loadedW.length === 0) {
      const localW = localStorage.getItem('local_warga');
      if (localW) loadedW = JSON.parse(localW);
    }
    if (loadedP.length === 0) {
      const localP = localStorage.getItem('local_pinjaman');
      if (localP) loadedP = JSON.parse(localP);
    }
    if (loadedC.length === 0) {
      const localC = localStorage.getItem('local_cicilan');
      if (localC) loadedC = JSON.parse(localC);
    }

    setWargaList(loadedW);
    setPinjamanList(loadedP);
    setCicilanList(loadedC);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
    const handleUpdate = () => loadData();
    window.addEventListener('app_data_updated', handleUpdate);
    return () => window.removeEventListener('app_data_updated', handleUpdate);
  }, []);

  // Statistik Ringkasan Dana Pinjaman Qardhul Hasan
  const stats = useMemo(() => {
    const totalPlafon = pinjamanList.reduce((sum, p) => sum + Number(p.nominal_pinjaman || 0), 0);
    const totalSisaPiutang = pinjamanList
      .filter(p => p.status_pinjaman === 'Berjalan' || p.status_pinjaman === 'Macet')
      .reduce((sum, p) => sum + Number(p.sisa_pinjaman || 0), 0);
    const totalTerpulihkan = Math.max(0, totalPlafon - totalSisaPiutang);
    const countBerjalan = pinjamanList.filter(p => p.status_pinjaman === 'Berjalan').length;
    const countLunas = pinjamanList.filter(p => p.status_pinjaman === 'Lunas').length;

    return { totalPlafon, totalSisaPiutang, totalTerpulihkan, countBerjalan, countLunas };
  }, [pinjamanList]);

  // CREATE: Tambah Pinjaman Baru
  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canEdit || !formAdd.id_warga) {
      alert('Silakan pilih warga peminjam terlebih dahulu!');
      return;
    }

    const nom = Number(formAdd.nominal_pinjaman);
    const selectedWarga = wargaList.find(w => String(w.id_warga) === String(formAdd.id_warga));
    
    // Format keterangan lengkap: [Kategori Penggunaan] - Detail
    const finalKeterangan = formAdd.keterangan_detail 
      ? `[${formAdd.kategori_penggunaan}] ${formAdd.keterangan_detail}`
      : `[${formAdd.kategori_penggunaan}] Pinjaman Dana Darurat Sosial`;

    const newEntry: PinjamanWarga = {
      id_pinjaman: Date.now(),
      id_warga: Number(formAdd.id_warga),
      nama_warga: selectedWarga?.nama_lengkap || 'Warga Beryl',
      id_rumah: selectedWarga?.id_rumah || 'Beryl-A1-01',
      tanggal_pinjam: formAdd.tanggal_pinjam,
      nominal_pinjaman: nom,
      sisa_pinjaman: nom,
      status_pinjaman: 'Berjalan',
      keterangan: finalKeterangan,
    };

    if (isSupabaseConfigured) {
      const { data } = await supabase.from('pinjaman_warga').insert([{
        id_warga: Number(formAdd.id_warga),
        tanggal_pinjam: formAdd.tanggal_pinjam,
        nominal_pinjaman: nom,
        sisa_pinjaman: nom,
        status_pinjaman: 'Berjalan',
        keterangan: newEntry.keterangan
      }]).select();
      if (data && data[0]) newEntry.id_pinjaman = data[0].id_pinjaman;
    }

    const updated = [newEntry, ...pinjamanList];
    setPinjamanList(updated);
    localStorage.setItem('local_pinjaman', JSON.stringify(updated));
    setShowModalAdd(false);

    // Reset Form
    setFormAdd({
      id_warga: '',
      kategori_penggunaan: 'Darurat Medis / Berobat',
      nominal_pinjaman: 500000,
      tanggal_pinjam: new Date().toISOString().slice(0, 10),
      keterangan_detail: '',
    });
  };

  // UPDATE: Buka Form Edit Pinjaman
  const handleOpenEdit = (p: PinjamanWarga) => {
    if (!canEdit) return;
    setSelectedPinjaman(p);

    // Ekstraksi kategori jika tersimpan dalam format [Kategori] Detail
    let kat = 'Darurat Medis / Berobat';
    let det = p.keterangan || '';
    const match = det.match(/^\[(.*?)\]\s*(.*)$/);
    if (match) {
      kat = match[1];
      det = match[2];
    }

    setFormEdit({
      id_pinjaman: p.id_pinjaman,
      kategori_penggunaan: kat,
      nominal_pinjaman: p.nominal_pinjaman,
      sisa_pinjaman: p.sisa_pinjaman,
      tanggal_pinjam: p.tanggal_pinjam,
      status_pinjaman: p.status_pinjaman,
      keterangan_detail: det,
    });
    setShowModalEdit(true);
  };

  // UPDATE: Simpan Perubahan Data Pinjaman
  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canEdit || !selectedPinjaman) return;

    const finalKeterangan = formEdit.keterangan_detail 
      ? `[${formEdit.kategori_penggunaan}] ${formEdit.keterangan_detail}`
      : `[${formEdit.kategori_penggunaan}] Pinjaman Dana Darurat Sosial`;

    const updatedSisa = Number(formEdit.sisa_pinjaman);
    const updatedStatus = updatedSisa === 0 ? 'Lunas' : formEdit.status_pinjaman;

    const payload = {
      nominal_pinjaman: Number(formEdit.nominal_pinjaman),
      sisa_pinjaman: updatedSisa,
      tanggal_pinjam: formEdit.tanggal_pinjam,
      status_pinjaman: updatedStatus,
      keterangan: finalKeterangan
    };

    if (isSupabaseConfigured) {
      await supabase.from('pinjaman_warga').update(payload).eq('id_pinjaman', selectedPinjaman.id_pinjaman);
    }

    const updated = pinjamanList.map(p => p.id_pinjaman === selectedPinjaman.id_pinjaman ? { ...p, ...payload } : p);
    setPinjamanList(updated);
    localStorage.setItem('local_pinjaman', JSON.stringify(updated));
    setShowModalEdit(false);
    setSelectedPinjaman(null);
  };

  // UPDATE: Bayar Cicilan Pinjaman
  const handleCicilSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canEdit || !selectedPinjaman) return;

    const bayar = Number(formCicil.nominal);
    const sisaBaru = Math.max(0, selectedPinjaman.sisa_pinjaman - bayar);
    const statusBaru = sisaBaru === 0 ? 'Lunas' : 'Berjalan';

    const newCicilan: CicilanPinjaman = {
      id_cicilan: Date.now(),
      id_pinjaman: selectedPinjaman.id_pinjaman,
      tanggal_bayar: formCicil.tanggal_bayar,
      nominal: bayar,
      catatan: formCicil.catatan || `Angsuran (${formatRupiah(bayar)})`,
    };

    if (isSupabaseConfigured) {
      await supabase.from('cicilan_pinjaman').insert([{
        id_pinjaman: selectedPinjaman.id_pinjaman,
        tanggal_bayar: formCicil.tanggal_bayar,
        nominal: bayar,
        catatan: newCicilan.catatan,
      }]);
      await supabase.from('pinjaman_warga').update({ sisa_pinjaman: sisaBaru, status_pinjaman: statusBaru }).eq('id_pinjaman', selectedPinjaman.id_pinjaman);
    }

    // Update state pinjaman & cicilan
    const updatedPinjaman = pinjamanList.map(p => p.id_pinjaman === selectedPinjaman.id_pinjaman ? { ...p, sisa_pinjaman: sisaBaru, status_pinjaman: statusBaru } : p);
    const updatedCicilan = [newCicilan, ...cicilanList];

    setPinjamanList(updatedPinjaman);
    setCicilanList(updatedCicilan);

    localStorage.setItem('local_pinjaman', JSON.stringify(updatedPinjaman));
    localStorage.setItem('local_cicilan', JSON.stringify(updatedCicilan));

    setShowModalCicil(false);
    setSelectedPinjaman(null);
    setFormCicil({
      nominal: 100000,
      tanggal_bayar: new Date().toISOString().slice(0, 10),
      catatan: 'Angsuran Pinjaman',
    });
  };

  // DELETE: Hapus Data Pinjaman
  const handleDeletePinjaman = async (id: number) => {
    if (!canEdit) return;
    if (!confirm('PERHATIAN: Hapus data pinjaman ini beserta seluruh riwayat cicilannya?')) return;

    if (isSupabaseConfigured) {
      await supabase.from('cicilan_pinjaman').delete().eq('id_pinjaman', id);
      await supabase.from('pinjaman_warga').delete().eq('id_pinjaman', id);
    }

    const updatedP = pinjamanList.filter(p => p.id_pinjaman !== id);
    const updatedC = cicilanList.filter(c => c.id_pinjaman !== id);

    setPinjamanList(updatedP);
    setCicilanList(updatedC);

    localStorage.setItem('local_pinjaman', JSON.stringify(updatedP));
    localStorage.setItem('local_cicilan', JSON.stringify(updatedC));
  };

  // READ: Buka Detail & Riwayat Cicilan
  const handleOpenDetail = (p: PinjamanWarga) => {
    setSelectedPinjaman(p);
    setShowModalDetail(true);
  };

  // Filter Data Tabel
  const filteredList = pinjamanList.filter(p => {
    const q = search.toLowerCase();
    const matchSearch = (p.nama_warga?.toLowerCase() || '').includes(q) ||
      (p.id_rumah?.toLowerCase() || '').includes(q) ||
      (p.keterangan?.toLowerCase() || '').includes(q);
    const matchStatus = filterStatus === 'Semua' || p.status_pinjaman === filterStatus;
    return matchSearch && matchStatus;
  });

  return (
    <div className="space-y-6 pb-12">
      {/* Header Halaman */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="p-2 bg-amber-100 text-amber-800 rounded-xl">
              <HandCoins className="w-5 h-5" />
            </span>
            <h2 className="text-xl font-black text-slate-800 tracking-tight">Pinjaman Sosial Warga (Qardhul Hasan)</h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            {isGuest 
              ? 'Penyaluran dana talangan darurat tanpa bunga murni tolong-menolong (Mode Tamu: Lihat Saja).'
              : 'Pencatatan dana darurat tolong-menolong tanpa bunga (Akad Qardhul Hasan), rincian penggunaan, dan mutasi cicilan.'}
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => exportPinjamanToExcel(filteredList)}
            className="flex items-center space-x-2 px-4 py-2.5 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-xl text-xs font-bold shadow-2xs transition-all"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            <span>Export Excel</span>
          </button>
          {canEdit && (
            <button
              onClick={() => setShowModalAdd(true)}
              className="flex items-center space-x-2 px-4 py-2.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold shadow-sm transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>Tambah Pinjaman Baru</span>
            </button>
          )}
        </div>
      </div>

      {/* 4 Kartu KPI Ringkasan Pinjaman */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Total Disalurkan</span>
            <Coins className="w-4 h-4 text-blue-600" />
          </div>
          <p className="text-lg font-black text-slate-900 mt-2">{formatRupiah(stats.totalPlafon)}</p>
          <span className="text-[10px] text-slate-400">{pinjamanList.length} Pengajuan Tercatat</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-amber-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-amber-700 uppercase tracking-wider">Sisa Piutang Beredar</span>
            <AlertTriangle className="w-4 h-4 text-amber-600" />
          </div>
          <p className="text-lg font-black text-amber-600 mt-2">{formatRupiah(stats.totalSisaPiutang)}</p>
          <span className="text-[10px] text-amber-700 font-semibold">{stats.countBerjalan} Peminjam Aktif</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-emerald-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider">Dana Terpulihkan</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="text-lg font-black text-emerald-600 mt-2">{formatRupiah(stats.totalTerpulihkan)}</p>
          <span className="text-[10px] text-emerald-700 font-semibold">{stats.countLunas} Pinjaman Lunas</span>
        </div>

        <div className="bg-gradient-to-br from-amber-600 to-amber-700 text-white p-4 rounded-2xl shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-amber-100">Akad Pinjaman</span>
            <Activity className="w-4 h-4 text-amber-200" />
          </div>
          <p className="text-sm font-black mt-2">Qardhul Hasan (0% Riba)</p>
          <span className="text-[10px] text-amber-100">Dana Sosial Bergulir Paguyuban</span>
        </div>
      </div>

      {/* Bar Pencarian & Filter Status */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Cari peminjam, blok, keperluan (misal: berobat, sekolah, darurat)..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs outline-none focus:border-amber-500 shadow-2xs"
          />
        </div>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold outline-none text-slate-700 shadow-2xs"
        >
          <option value="Semua">Semua Status ({pinjamanList.length})</option>
          <option value="Berjalan">Status: Berjalan Aktif ({stats.countBerjalan})</option>
          <option value="Lunas">Status: Lunas ({stats.countLunas})</option>
          <option value="Macet">Status: Macet / Kendala</option>
        </select>
      </div>

      {/* Tabel Data Pinjaman & Keterangan Penggunaan */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 border-b border-slate-200 text-[10px] uppercase font-bold text-slate-500 select-none">
              <tr>
                <th className="px-3 py-3.5 text-center w-12">No.</th>
                <th className="px-4 py-3.5 min-w-[150px]">Peminjam & Unit</th>
                <th className="px-4 py-3.5 min-w-[90px]">Tanggal Pinjam</th>
                <th className="px-4 py-3.5 min-w-[220px]">Keperluan / Penggunaan Dana</th>
                <th className="px-4 py-3.5 text-right min-w-[110px]">Plafon Pinjam</th>
                <th className="px-4 py-3.5 text-right min-w-[110px]">Sisa Tagihan</th>
                <th className="px-4 py-3.5 text-center min-w-[90px]">Status</th>
                <th className="px-4 py-3.5 text-right min-w-[130px]">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr><td colSpan={8} className="px-4 py-8 text-center text-slate-400">Memuat data pinjaman warga...</td></tr>
              ) : filteredList.length === 0 ? (
                <tr><td colSpan={8} className="px-4 py-8 text-center text-slate-400">Tidak ada catatan pinjaman yang cocok.</td></tr>
              ) : (
                filteredList.map((p, idx) => {
                  const isLunas = p.status_pinjaman === 'Lunas';
                  const cicilanCount = cicilanList.filter(c => c.id_pinjaman === p.id_pinjaman).length;

                  return (
                    <tr key={p.id_pinjaman} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-3 py-3.5 text-center font-mono text-slate-400 text-xs">{idx + 1}</td>
                      <td className="px-4 py-3.5">
                        <p className="font-bold text-slate-900 text-xs leading-tight">{p.nama_warga}</p>
                        <span className="text-[10px] font-mono text-slate-400 font-medium">Unit: {p.id_rumah || '-'}</span>
                      </td>
                      <td className="px-4 py-3.5 font-mono text-slate-500">{p.tanggal_pinjam}</td>
                      
                      {/* Kolom Keterangan / Penggunaan Dana yang Ditonjolkan */}
                      <td className="px-4 py-3.5">
                        <div className="space-y-1">
                          <p className="font-medium text-slate-800 text-xs leading-snug">
                            {p.keterangan || 'Pinjaman Dana Darurat Sosial'}
                          </p>
                          <div className="flex items-center space-x-1.5 text-[10px] text-slate-400">
                            <FileText className="w-3 h-3 text-amber-500" />
                            <span>Riwayat: {cicilanCount}x Pembayaran Angsuran</span>
                          </div>
                        </div>
                      </td>

                      <td className="px-4 py-3.5 text-right font-bold text-slate-700">
                        {formatRupiah(p.nominal_pinjaman)}
                      </td>
                      <td className={`px-4 py-3.5 text-right font-black font-mono ${isLunas ? 'text-emerald-600' : 'text-amber-600'}`}>
                        {formatRupiah(p.sisa_pinjaman)}
                      </td>
                      <td className="px-4 py-3.5 text-center">
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase border ${
                          isLunas ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                          p.status_pinjaman === 'Berjalan' ? 'bg-amber-50 text-amber-800 border-amber-200' :
                          'bg-rose-50 text-rose-700 border-rose-200'
                        }`}>
                          {p.status_pinjaman}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-right space-x-1 whitespace-nowrap">
                        <button
                          onClick={() => handleOpenDetail(p)}
                          className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Lihat Riwayat Cicilan"
                        >
                          <History className="w-4 h-4 inline" />
                        </button>

                        {canEdit && (
                          <>
                            {!isLunas && (
                              <button
                                onClick={() => { setSelectedPinjaman(p); setShowModalCicil(true); }}
                                className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[10px] font-bold uppercase shadow-2xs transition-all"
                                title="Catat Cicilan"
                              >
                                Cicil
                              </button>
                            )}
                            <button
                              onClick={() => handleOpenEdit(p)}
                              className="p-1.5 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                              title="Edit Pinjaman"
                            >
                              <Edit2 className="w-3.5 h-3.5 inline" />
                            </button>
                            <button
                              onClick={() => handleDeletePinjaman(p.id_pinjaman)}
                              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                              title="Hapus Data"
                            >
                              <Trash2 className="w-3.5 h-3.5 inline" />
                            </button>
                          </>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* =========================================================================
          MODAL 1: CREATE (TAMBAH PINJAMAN BARU)
          ========================================================================= */}
      {showModalAdd && canEdit && (
        <div className="fixed inset-0 bg-slate-900/60 flex items-center justify-center p-4 z-50 backdrop-blur-xs">
          <div className="bg-white rounded-3xl shadow-xl w-full max-w-md p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b pb-3">
              <div className="flex items-center space-x-2">
                <HandCoins className="w-5 h-5 text-amber-600" />
                <h3 className="font-bold text-slate-900 text-sm">Catat Pinjaman Qardhul Hasan Baru</h3>
              </div>
              <button onClick={() => setShowModalAdd(false)} className="text-slate-400 hover:text-slate-600"><X className="w-4 h-4" /></button>
            </div>

            <form onSubmit={handleAddSubmit} className="space-y-3.5 text-xs">
              <WargaSearchSelect
                wargaList={wargaList}
                selectedId={formAdd.id_warga}
                onSelect={(w) => setFormAdd({ ...formAdd, id_warga: w ? String(w.id_warga) : '' })}
                label="Cari & Pilih Warga Peminjam"
                required
              />

              {/* Kategori Penggunaan Cepat */}
              <div>
                <label className="block font-bold text-slate-600 mb-1">Tujuan / Kategori Penggunaan Dana *</label>
                <select
                  value={formAdd.kategori_penggunaan}
                  onChange={(e) => setFormAdd({ ...formAdd, kategori_penggunaan: e.target.value })}
                  className="w-full px-3 py-2 border rounded-xl font-bold text-slate-800 outline-none focus:border-amber-500 bg-white"
                >
                  {KATEGORI_PENGGUNAAN.map((k) => (
                    <option key={k.label} value={k.label}>{k.label}</option>
                  ))}
                </select>
              </div>

              {/* Rincian Keterangan Penggunaan */}
              <div>
                <label className="block font-bold text-slate-600 mb-1">Rincian Keterangan / Keperluan Medis/Pendidikan</label>
                <textarea
                  rows={2}
                  placeholder="Misal: Biaya rawat inap rumah sakit anak / SPP ujian sekolah darurat"
                  value={formAdd.keterangan_detail}
                  onChange={(e) => setFormAdd({ ...formAdd, keterangan_detail: e.target.value })}
                  className="w-full px-3 py-2 border rounded-xl outline-none focus:border-amber-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-600 mb-1">Nominal Pinjaman (Rp) *</label>
                  <input 
                    required 
                    type="number" 
                    step="50000" 
                    value={formAdd.nominal_pinjaman} 
                    onChange={(e) => setFormAdd({ ...formAdd, nominal_pinjaman: Number(e.target.value) })} 
                    className="w-full px-3 py-2 border rounded-xl font-black text-amber-700 outline-none" 
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-600 mb-1">Tanggal Pinjam *</label>
                  <input 
                    required 
                    type="date" 
                    value={formAdd.tanggal_pinjam} 
                    onChange={(e) => setFormAdd({ ...formAdd, tanggal_pinjam: e.target.value })} 
                    className="w-full px-3 py-2 border rounded-xl outline-none" 
                  />
                </div>
              </div>

              <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-[11px] text-amber-900 leading-relaxed">
                💡 <strong>Akad Qardhul Hasan:</strong> Pinjaman dana sosial murni tanpa bunga/riba. Warga peminjam hanya wajib mengembalikan pokok pinjaman sesuai kesepakatan cicilan.
              </div>

              <div className="flex justify-end space-x-2 pt-3 border-t">
                <button type="button" onClick={() => setShowModalAdd(false)} className="px-4 py-2 border rounded-xl font-bold text-slate-600">Batal</button>
                <button type="submit" className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl font-bold">Simpan Pinjaman</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL 2: UPDATE (EDIT DATA PINJAMAN)
          ========================================================================= */}
      {showModalEdit && selectedPinjaman && canEdit && (
        <div className="fixed inset-0 bg-slate-900/60 flex items-center justify-center p-4 z-50 backdrop-blur-xs">
          <div className="bg-white rounded-3xl shadow-xl w-full max-w-md p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="font-bold text-slate-900 text-sm">Edit Data Pinjaman & Keperluan</h3>
              <button onClick={() => setShowModalEdit(false)} className="text-slate-400 hover:text-slate-600"><X className="w-4 h-4" /></button>
            </div>

            <form onSubmit={handleEditSubmit} className="space-y-3.5 text-xs">
              <div className="p-3 bg-slate-50 rounded-xl border">
                <p className="text-slate-500 text-[10px] uppercase font-bold">Peminjam:</p>
                <p className="text-sm font-bold text-slate-900">{selectedPinjaman.nama_warga} ({selectedPinjaman.id_rumah})</p>
              </div>

              <div>
                <label className="block font-bold text-slate-600 mb-1">Kategori Penggunaan *</label>
                <select
                  value={formEdit.kategori_penggunaan}
                  onChange={(e) => setFormEdit({ ...formEdit, kategori_penggunaan: e.target.value })}
                  className="w-full px-3 py-2 border rounded-xl font-bold text-slate-800 outline-none focus:border-amber-500 bg-white"
                >
                  {KATEGORI_PENGGUNAAN.map((k) => (
                    <option key={k.label} value={k.label}>{k.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-600 mb-1">Keterangan / Keperluan Pinjaman</label>
                <textarea
                  rows={2}
                  value={formEdit.keterangan_detail}
                  onChange={(e) => setFormEdit({ ...formEdit, keterangan_detail: e.target.value })}
                  className="w-full px-3 py-2 border rounded-xl outline-none focus:border-amber-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-600 mb-1">Plafon Pinjaman (Rp) *</label>
                  <input
                    required
                    type="number"
                    value={formEdit.nominal_pinjaman}
                    onChange={(e) => setFormEdit({ ...formEdit, nominal_pinjaman: Number(e.target.value) })}
                    className="w-full px-3 py-2 border rounded-xl font-bold"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-600 mb-1">Sisa Tagihan (Rp) *</label>
                  <input
                    required
                    type="number"
                    value={formEdit.sisa_pinjaman}
                    onChange={(e) => setFormEdit({ ...formEdit, sisa_pinjaman: Number(e.target.value) })}
                    className="w-full px-3 py-2 border rounded-xl font-black text-amber-700"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-600 mb-1">Tanggal Pinjam</label>
                  <input
                    required
                    type="date"
                    value={formEdit.tanggal_pinjam}
                    onChange={(e) => setFormEdit({ ...formEdit, tanggal_pinjam: e.target.value })}
                    className="w-full px-3 py-2 border rounded-xl outline-none"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-600 mb-1">Status Pinjaman</label>
                  <select
                    value={formEdit.status_pinjaman}
                    onChange={(e) => setFormEdit({ ...formEdit, status_pinjaman: e.target.value as any })}
                    className="w-full px-3 py-2 border rounded-xl font-bold outline-none bg-white"
                  >
                    <option value="Berjalan">Berjalan</option>
                    <option value="Lunas">Lunas</option>
                    <option value="Macet">Macet</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end space-x-2 pt-3 border-t">
                <button type="button" onClick={() => setShowModalEdit(false)} className="px-4 py-2 border rounded-xl font-bold text-slate-600">Batal</button>
                <button type="submit" className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl font-bold">Simpan Perubahan</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL 3: BAYAR CICILAN PINJAMAN
          ========================================================================= */}
      {showModalCicil && selectedPinjaman && canEdit && (
        <div className="fixed inset-0 bg-slate-900/60 flex items-center justify-center p-4 z-50 backdrop-blur-xs">
          <div className="bg-white rounded-3xl shadow-xl w-full max-w-md p-6 space-y-4">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="font-bold text-slate-900 text-sm">Catat Pembayaran Cicilan Pinjaman</h3>
              <button onClick={() => setShowModalCicil(false)} className="text-slate-400 hover:text-slate-600"><X className="w-4 h-4" /></button>
            </div>
            
            <div className="p-3.5 bg-amber-50 rounded-2xl border border-amber-200 text-xs space-y-1">
              <p>Peminjam: <strong className="text-slate-900">{selectedPinjaman.nama_warga} ({selectedPinjaman.id_rumah})</strong></p>
              <p>Keperluan: <span className="text-slate-700 font-medium">{selectedPinjaman.keterangan}</span></p>
              <p>Sisa Tagihan Saat Ini: <strong className="text-amber-800 font-black">{formatRupiah(selectedPinjaman.sisa_pinjaman)}</strong></p>
            </div>

            <form onSubmit={handleCicilSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-600 mb-1">Nominal Cicilan (Rp) *</label>
                <input 
                  required 
                  type="number" 
                  step="10000" 
                  max={selectedPinjaman.sisa_pinjaman} 
                  value={formCicil.nominal} 
                  onChange={(e) => setFormCicil({ ...formCicil, nominal: Number(e.target.value) })} 
                  className="w-full px-3 py-2 border rounded-xl font-black text-emerald-600 outline-none text-sm" 
                />
              </div>

              <div>
                <label className="block font-bold text-slate-600 mb-1">Tanggal Pembayaran</label>
                <input 
                  required 
                  type="date" 
                  value={formCicil.tanggal_bayar} 
                  onChange={(e) => setFormCicil({ ...formCicil, tanggal_bayar: e.target.value })} 
                  className="w-full px-3 py-2 border rounded-xl outline-none" 
                />
              </div>

              <div>
                <label className="block font-bold text-slate-600 mb-1">Catatan / Keterangan Cicilan</label>
                <input 
                  type="text" 
                  placeholder="Misal: Angsuran ke-1 / Titip tunai ke bendahara" 
                  value={formCicil.catatan} 
                  onChange={(e) => setFormCicil({ ...formCicil, catatan: e.target.value })} 
                  className="w-full px-3 py-2 border rounded-xl outline-none" 
                />
              </div>

              <div className="flex justify-end space-x-2 pt-3 border-t">
                <button type="button" onClick={() => setShowModalCicil(false)} className="px-4 py-2 border rounded-xl font-bold text-slate-600">Batal</button>
                <button type="submit" className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold">Simpan Cicilan</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL 4: READ / DETAIL RIWAYAT CICILAN LENGKAP
          ========================================================================= */}
      {showModalDetail && selectedPinjaman && (
        <div className="fixed inset-0 bg-slate-900/60 flex items-center justify-center p-4 z-50 backdrop-blur-xs">
          <div className="bg-white rounded-3xl shadow-xl w-full max-w-lg p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b pb-3">
              <div className="flex items-center space-x-2">
                <History className="w-5 h-5 text-blue-600" />
                <h3 className="font-bold text-slate-900 text-sm">Detail & Riwayat Cicilan Pinjaman</h3>
              </div>
              <button onClick={() => setShowModalDetail(false)} className="text-slate-400 hover:text-slate-600"><X className="w-4 h-4" /></button>
            </div>

            {/* Ringkasan Pinjaman */}
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-2 text-xs">
              <div className="flex justify-between items-start">
                <div>
                  <span className="text-[10px] text-slate-400 font-bold uppercase">Nama Peminjam:</span>
                  <p className="text-sm font-black text-slate-900">{selectedPinjaman.nama_warga} ({selectedPinjaman.id_rumah})</p>
                </div>
                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase border ${
                  selectedPinjaman.status_pinjaman === 'Lunas' ? 'bg-emerald-100 text-emerald-700 border-emerald-200' : 'bg-amber-100 text-amber-800 border-amber-200'
                }`}>
                  {selectedPinjaman.status_pinjaman}
                </span>
              </div>

              <div className="pt-1 border-t border-slate-200">
                <span className="text-[10px] text-slate-400 font-bold uppercase">Keperluan / Tujuan Penggunaan:</span>
                <p className="text-xs font-semibold text-slate-800 leading-relaxed mt-0.5">{selectedPinjaman.keterangan}</p>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-200">
                <div>
                  <span className="text-[10px] text-slate-400 font-bold uppercase">Total Plafon:</span>
                  <p className="text-sm font-bold text-slate-800">{formatRupiah(selectedPinjaman.nominal_pinjaman)}</p>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 font-bold uppercase">Sisa Tagihan:</span>
                  <p className="text-sm font-black text-amber-700">{formatRupiah(selectedPinjaman.sisa_pinjaman)}</p>
                </div>
              </div>
            </div>

            {/* Riwayat Pembayaran Angsuran */}
            <div className="space-y-2">
              <h4 className="font-bold text-xs text-slate-800 flex items-center justify-between">
                <span>Daftar Riwayat Angsuran Masuk:</span>
                <span className="text-slate-400 font-normal">
                  {cicilanList.filter(c => c.id_pinjaman === selectedPinjaman.id_pinjaman).length} Transaksi
                </span>
              </h4>

              <div className="border border-slate-200 rounded-2xl overflow-hidden divide-y divide-slate-100 max-h-48 overflow-y-auto">
                {cicilanList.filter(c => c.id_pinjaman === selectedPinjaman.id_pinjaman).length === 0 ? (
                  <div className="p-4 text-center text-slate-400 text-xs">Belum ada catatan pembayaran cicilan.</div>
                ) : (
                  cicilanList
                    .filter(c => c.id_pinjaman === selectedPinjaman.id_pinjaman)
                    .map((c, idx) => (
                      <div key={c.id_cicilan || idx} className="p-3 flex justify-between items-center text-xs hover:bg-slate-50">
                        <div>
                          <span className="font-bold text-slate-800">{c.catatan || `Angsuran ke-${idx + 1}`}</span>
                          <p className="text-[10px] text-slate-400 font-mono">{c.tanggal_bayar}</p>
                        </div>
                        <span className="font-black text-emerald-600 font-mono">+{formatRupiah(c.nominal)}</span>
                      </div>
                    ))
                )}
              </div>
            </div>

            <div className="flex justify-end pt-3 border-t">
              <button 
                type="button" 
                onClick={() => setShowModalDetail(false)} 
                className="px-5 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-bold"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PinjamanWargaPage;