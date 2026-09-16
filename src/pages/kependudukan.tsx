// src/pages/kependudukan.tsx
import React, { useEffect, useState, useMemo } from 'react';
import { 
  Search, UserPlus, X, Edit2, Trash2, Phone, ArrowUpDown, 
  ArrowUp, ArrowDown, FileSpreadsheet, CheckCircle2, Cake, 
  Users, Car, Droplet, Plus, Eye, Lock, MessageCircle, ShieldAlert
} from 'lucide-react';
import { supabase, isSupabaseConfigured } from '../supabase';
import { 
  Pengguna, Warga, AnggotaKeluarga, KendaraanWarga, 
  canManageWargaFull, NAMA_BULAN 
} from '../types';
import { formatPhoneNumber62, getWhatsAppLink } from '../lib/utils';
import { exportWargaToExcel } from '../utils/exportManager';

export const DataWarga = ({ user }: { user: Pengguna }) => {
  const [warga, setWarga] = useState<Warga[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('Semua');
  const [filterGolDarah, setFilterGolDarah] = useState<string>('Semua');

  // State Modals
  const [showFormModal, setShowFormModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [activeTabForm, setActiveTabForm] = useState<'kepala' | 'keluarga' | 'kendaraan'>('kepala');
  
  const [editingData, setEditingData] = useState<Warga | null>(null);
  const [selectedWargaDetail, setSelectedWargaDetail] = useState<Warga | null>(null);
  const [successMsg, setSuccessMsg] = useState('');
  const [alertMsg, setAlertMsg] = useState('');

  const [sortField, setSortField] = useState<keyof Warga>('id_rumah');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  // Form State Kepala Keluarga
  const [formKK, setFormKK] = useState({
    nama_lengkap: '',
    nik_kk: '',
    id_rumah: '',
    status_warga: 'Menetap',
    no_hp: '',
    jenis_kelamin: 'L' as 'L' | 'P',
    peran_keluarga: 'Kepala Keluarga',
    tempat_lahir: '',
    tanggal_lahir: '',
    golongan_darah: 'O',
    agama: 'Islam',
    pekerjaan: '-',
    alamat_asal: '-',
    kontak_darurat: '',
    keterangan: 'Menetap',
  });

  const [formAnggotaList, setFormAnggotaList] = useState<AnggotaKeluarga[]>([]);
  const [formKendaraanList, setFormKendaraanList] = useState<KendaraanWarga[]>([]);

  // HAK AKSES PENGURUS
  const isFullAdmin = canManageWargaFull(user);
  const isGuestOrWarga = user.peran === 'Warga' || user.id_pengguna === 0;

  const loadData = async () => {
    setLoading(true);
    let loaded: Warga[] = [];
    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabase
          .from('warga')
          .select('*')
          .order('id_rumah', { ascending: true });
        if (!error && data && data.length > 0) loaded = data;
      } catch (err) {
        console.warn('Fallback offline kependudukan:', err);
      }
    }
    
    if (loaded.length === 0) {
      const local = localStorage.getItem('local_warga');
      if (local) loaded = JSON.parse(local);
    }

    setWarga(loaded);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
    const handleUpdate = () => loadData();
    window.addEventListener('app_data_updated', handleUpdate);
    return () => window.removeEventListener('app_data_updated', handleUpdate);
  }, []);

  // Helper Hitung Umur
  const calculateAge = (tgl?: string): number => {
    if (!tgl) return 0;
    const birthDate = new Date(tgl);
    if (isNaN(birthDate.getTime())) return 0;
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return Math.max(0, age);
  };

  // Helper Format Tanggal Indonesia
  const formatDateIndo = (tgl?: string): string => {
    if (!tgl) return '-';
    const d = new Date(tgl);
    if (isNaN(d.getTime())) return tgl;
    return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
  };

  // Analisis Ulang Tahun Warga
  const birthdayData = useMemo(() => {
    const today = new Date();
    const currentMonth = today.getMonth();
    const currentDate = today.getDate();

    const todayList: { nama: string; idRumah: string; noHp?: string; hubungan: string; umur: number; tgl: string }[] = [];
    const monthList: { nama: string; idRumah: string; noHp?: string; hubungan: string; umur: number; tgl: string }[] = [];

    warga.forEach(w => {
      if (w.tanggal_lahir) {
        const d = new Date(w.tanggal_lahir);
        if (!isNaN(d.getTime())) {
          const age = calculateAge(w.tanggal_lahir);
          const item = {
            nama: w.nama_lengkap,
            idRumah: w.id_rumah,
            noHp: w.no_hp,
            hubungan: 'Kepala Keluarga',
            umur: age,
            tgl: w.tanggal_lahir
          };
          if (d.getMonth() === currentMonth && d.getDate() === currentDate) {
            todayList.push(item);
          } else if (d.getMonth() === currentMonth) {
            monthList.push(item);
          }
        }
      }

      (w.anggota_keluarga || []).forEach(a => {
        if (a.tanggal_lahir) {
          const d = new Date(a.tanggal_lahir);
          if (!isNaN(d.getTime())) {
            const age = calculateAge(a.tanggal_lahir);
            const item = {
              nama: `${a.nama} (${a.hubungan} dari ${w.nama_lengkap})`,
              idRumah: w.id_rumah,
              noHp: w.no_hp,
              hubungan: a.hubungan,
              umur: age,
              tgl: a.tanggal_lahir
            };
            if (d.getMonth() === currentMonth && d.getDate() === currentDate) {
              todayList.push(item);
            } else if (d.getMonth() === currentMonth) {
              monthList.push(item);
            }
          }
        }
      });
    });

    return { todayList, monthList };
  }, [warga]);

  // Statistik Demografi Tambahan
  const statsTambahan = useMemo(() => {
    let totalAnggotaKeluarga = 0;
    let totalMobil = 0;
    let totalMotor = 0;
    const golDarahCounts: Record<string, number> = { A: 0, B: 0, AB: 0, O: 0, 'Tidak Tahu': 0 };

    warga.forEach(w => {
      totalAnggotaKeluarga += (w.anggota_keluarga || []).length;
      (w.kendaraan || []).forEach(k => {
        if (k.jenis === 'Mobil') totalMobil++;
        else if (k.jenis === 'Motor') totalMotor++;
      });
      const golKK = w.golongan_darah || 'Tidak Tahu';
      golDarahCounts[golKK] = (golDarahCounts[golKK] || 0) + 1;

      (w.anggota_keluarga || []).forEach(a => {
        const golA = a.golongan_darah || 'Tidak Tahu';
        golDarahCounts[golA] = (golDarahCounts[golA] || 0) + 1;
      });
    });

    return {
      totalJiwa: warga.length + totalAnggotaKeluarga,
      totalMobil,
      totalMotor,
      golDarahCounts
    };
  }, [warga]);

  const handleSort = (field: keyof Warga) => {
    if (sortField === field) {
      setSortOrder(prev => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  const renderSortIcon = (field: keyof Warga) => {
    if (sortField !== field) return <ArrowUpDown className="w-3 h-3 text-slate-400 inline ml-1 opacity-60" />;
    return sortOrder === 'asc' ? (
      <ArrowUp className="w-3.5 h-3.5 text-emerald-600 inline ml-1" />
    ) : (
      <ArrowDown className="w-3.5 h-3.5 text-emerald-600 inline ml-1" />
    );
  };

  // =========================================================================
  // CRUD 1: TAMBAH WARGA BARU (Bisa Dilakukan Semua Warga / Mode Tamu)
  // =========================================================================
  const handleOpenAdd = () => {
    setEditingData(null);
    setFormKK({
      nama_lengkap: '',
      nik_kk: '',
      id_rumah: 'Beryl-A1-01',
      status_warga: 'Menetap',
      no_hp: '',
      jenis_kelamin: 'L',
      peran_keluarga: 'Kepala Keluarga',
      tempat_lahir: '',
      tanggal_lahir: '',
      golongan_darah: 'O',
      agama: 'Islam',
      pekerjaan: '-',
      alamat_asal: '-',
      kontak_darurat: '',
      keterangan: 'Menetap',
    });
    setFormAnggotaList([]);
    setFormKendaraanList([]);
    setActiveTabForm('kepala');
    setShowFormModal(true);
  };

  // =========================================================================
  // CRUD 2: EDIT DATA WARGA
  // =========================================================================
  const handleOpenEdit = (item: Warga) => {
    // Validasi Keamanan: Jika mode warga, batasi hanya unit sendiri jika id_rumah diset
    if (isGuestOrWarga && user.id_rumah && user.id_rumah !== 'Beryl-Warga' && item.id_rumah !== user.id_rumah) {
      setAlertMsg(`⚠️ Akses Dibatasi: Anda hanya diizinkan memperbarui data unit rumah Anda sendiri (${user.id_rumah}).`);
      setTimeout(() => setAlertMsg(''), 4000);
      return;
    }

    setEditingData(item);
    setFormKK({
      nama_lengkap: item.nama_lengkap,
      nik_kk: item.nik_kk || '',
      id_rumah: item.id_rumah || '',
      status_warga: item.status_warga || 'Menetap',
      no_hp: isFullAdmin ? formatPhoneNumber62(item.no_hp) : '', // Jangan bocorkan di form jika bukan admin
      jenis_kelamin: item.jenis_kelamin || 'L',
      peran_keluarga: item.peran_keluarga || 'Kepala Keluarga',
      tempat_lahir: item.tempat_lahir || '',
      tanggal_lahir: item.tanggal_lahir || '',
      golongan_darah: item.golongan_darah || 'O',
      agama: item.agama || 'Islam',
      pekerjaan: item.pekerjaan || '-',
      alamat_asal: item.alamat_asal || '-',
      kontak_darurat: isFullAdmin ? (item.kontak_darurat || '') : '',
      keterangan: item.keterangan || item.status_warga || 'Menetap',
    });
    setFormAnggotaList(item.anggota_keluarga || []);
    setFormKendaraanList(item.kendaraan || []);
    setActiveTabForm('kepala');
    setShowFormModal(true);
  };

  const handleOpenDetail = (item: Warga) => {
    setSelectedWargaDetail(item);
    setShowDetailModal(true);
  };

  // Handler Anggota Keluarga
  const handleAddAnggota = () => {
    setFormAnggotaList([
      ...formAnggotaList,
      {
        nama: '',
        hubungan: 'Istri',
        jenis_kelamin: 'P',
        tanggal_lahir: '',
        golongan_darah: 'O',
        pekerjaan: '-'
      }
    ]);
  };

  const handleUpdateAnggota = (index: number, field: keyof AnggotaKeluarga, value: any) => {
    const updated = [...formAnggotaList];
    updated[index] = { ...updated[index], [field]: value };
    setFormAnggotaList(updated);
  };

  const handleRemoveAnggota = (index: number) => {
    setFormAnggotaList(formAnggotaList.filter((_, i) => i !== index));
  };

  // Handler Kendaraan
  const handleAddKendaraan = () => {
    setFormKendaraanList([
      ...formKendaraanList,
      {
        jenis: 'Mobil',
        nomor_polisi: '',
        merk_model: '',
        warna: ''
      }
    ]);
  };

  const handleUpdateKendaraan = (index: number, field: keyof KendaraanWarga, value: any) => {
    const updated = [...formKendaraanList];
    updated[index] = { ...updated[index], [field]: value };
    setFormKendaraanList(updated);
  };

  const handleRemoveKendaraan = (index: number) => {
    setFormKendaraanList(formKendaraanList.filter((_, i) => i !== index));
  };

  // =========================================================================
  // CRUD 3: SIMPAN DATA WARGA
  // =========================================================================
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const payload: Partial<Warga> = {
      ...formKK,
      no_hp: formKK.no_hp ? formatPhoneNumber62(formKK.no_hp) : (editingData?.no_hp || '-'),
      status_warga: formKK.status_warga.trim(),
      keterangan: formKK.status_warga.trim(),
      anggota_keluarga: formAnggotaList,
      kendaraan: formKendaraanList,
    };

    let generatedId = Date.now();

    if (isSupabaseConfigured) {
      try {
        if (editingData) {
          await supabase.from('warga').update(payload).eq('id_warga', editingData.id_warga);
        } else {
          const { data } = await supabase.from('warga').insert([{ 
            ...payload, 
            tanggal_daftar: new Date().toISOString().slice(0, 10) 
          }]).select();

          if (data && data[0]) {
            generatedId = data[0].id_warga;
          }
        }
      } catch (err: any) {
        console.warn('Fallback offline penyimpanan warga:', err.message);
      }
    }

    let updatedWarga: Warga[] = [];
    if (editingData) {
      updatedWarga = warga.map(w => w.id_warga === editingData.id_warga ? { ...w, ...payload } as Warga : w);
    } else {
      const newEntry: Warga = {
        id_warga: generatedId,
        ...payload,
        tanggal_daftar: new Date().toISOString().slice(0, 10),
      } as Warga;
      updatedWarga = [newEntry, ...warga];
    }

    setWarga(updatedWarga);
    localStorage.setItem('local_warga', JSON.stringify(updatedWarga));
    window.dispatchEvent(new Event('app_data_updated'));

    setShowFormModal(false);
    setSuccessMsg(editingData ? '✓ Data warga berhasil diperbarui!' : '✓ Warga baru berhasil ditambahkan!');
    setTimeout(() => setSuccessMsg(''), 4000);
  };

  // =========================================================================
  // CRUD 4: HAPUS WARGA (DILINDUNGI KHUSUS ADMIN PENGURUS)
  // =========================================================================
  const handleDelete = async (id: number, namaWarga: string) => {
    if (!isFullAdmin) {
      setAlertMsg(`⛔ Keamanan Data: Warga biasa tidak diizinkan menghapus data warga lain (${namaWarga}). Hubungi Pengurus / Admin Kependudukan.`);
      setTimeout(() => setAlertMsg(''), 5000);
      return;
    }

    if (!confirm(`PERHATIAN PENGURUS: Hapus permanen data warga "${namaWarga}" beserta keluarga dan kendaraannya dari database?`)) return;

    if (isSupabaseConfigured) {
      try {
        await supabase.from('warga').delete().eq('id_warga', id);
      } catch (err) {
        console.error(err);
      }
    }
    const updated = warga.filter(w => w.id_warga !== id);
    setWarga(updated);
    localStorage.setItem('local_warga', JSON.stringify(updated));
    window.dispatchEvent(new Event('app_data_updated'));
    setSuccessMsg(`❌ Data warga "${namaWarga}" berhasil dihapus oleh Pengurus.`);
    setTimeout(() => setSuccessMsg(''), 3000);
  };

  // Export Excel yang Aman (Sensor Nomor jika bukan Admin)
  const handleExportExcelSecure = () => {
    const secureList = isFullAdmin 
      ? filteredWarga 
      : filteredWarga.map(w => ({
          ...w,
          no_hp: '[Terkunci Demi Privasi]',
          kontak_darurat: '[Terkunci Demi Privasi]'
        }));
    exportWargaToExcel(secureList);
  };

  // Filter Data Warga
  const filteredWarga = warga
    .filter(w => {
      const q = search.toLowerCase();
      const matchSearch = 
        (w.nama_lengkap?.toLowerCase() || '').includes(q) ||
        (w.id_rumah?.toLowerCase() || '').includes(q) ||
        (isFullAdmin && (w.no_hp || '').includes(q)) ||
        (w.golongan_darah || '').toLowerCase().includes(q) ||
        (w.kendaraan || []).some(k => k.nomor_polisi.toLowerCase().includes(q) || (k.merk_model || '').toLowerCase().includes(q)) ||
        (w.anggota_keluarga || []).some(a => a.nama.toLowerCase().includes(q));

      const matchStatus = filterStatus === 'Semua' || (w.status_warga || '').toLowerCase() === filterStatus.toLowerCase();
      const matchGolDarah = filterGolDarah === 'Semua' || (w.golongan_darah || '') === filterGolDarah;

      return matchSearch && matchStatus && matchGolDarah;
    })
    .sort((a, b) => {
      let valA = String(a[sortField] || '');
      let valB = String(b[sortField] || '');
      let comp = valA.localeCompare(valB, undefined, { numeric: true, sensitivity: 'base' });
      return sortOrder === 'asc' ? comp : -comp;
    });

  const sendWhatsAppBirthday = (nama: string, noHp?: string, umur?: number) => {
    if (!isFullAdmin) {
      alert('Fitur hubungi langsung nomor kontak warga hanya tersedia untuk Pengurus Paguyuban.');
      return;
    }
    const cleanHp = formatPhoneNumber62(noHp);
    const text = `*Selamat Ulang Tahun yang ke-${umur || ''} untuk ${nama}!* 🎉🎂\n\nSemoga senantiasa diberikan kesehatan, keberkahan usia, keselamatan, dan rezeki yang melimpah dari keluarga besar *Paguyuban Cluster Beryl & Majelis Al Barokah*.\n\n_Barakallahu fii umrik._ Aamiin Yaa Rabbal 'Aalamiin. 🤲`;
    const encoded = encodeURIComponent(text);
    if (cleanHp && cleanHp !== '-') {
      const digits = cleanHp.replace(/\D/g, '');
      window.open(`https://wa.me/${digits}?text=${encoded}`, '_blank');
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Banner Peringatan Keamanan */}
      {alertMsg && (
        <div className="p-4 bg-rose-50 border border-rose-300 rounded-2xl text-xs font-bold text-rose-800 flex items-start space-x-2 animate-in slide-in-from-top duration-200">
          <ShieldAlert className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
          <span>{alertMsg}</span>
        </div>
      )}

      {/* Header Halaman */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <h2 className="text-xl font-black text-slate-800 tracking-tight">Data Kependudukan Warga Beryl</h2>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-300 flex items-center space-x-1">
              <Lock className="w-3 h-3" />
              <span>Nomor Kontak Terkunci (Privasi Aman)</span>
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Informasi direktori warga Cluster Beryl. Nomor WhatsApp tetangga dikunci total demi privasi dan keamanan bersama.
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={handleExportExcelSecure}
            className="flex items-center space-x-2 px-4 py-2.5 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-xl text-xs font-bold shadow-2xs transition-all"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            <span>Export Excel</span>
          </button>
          
          <button
            onClick={handleOpenAdd}
            className="flex items-center space-x-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-sm transition-all"
          >
            <UserPlus className="w-4 h-4" />
            <span>Tambah Warga / KK</span>
          </button>
        </div>
      </div>

      {successMsg && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-2xl text-xs font-bold text-emerald-800 flex items-center space-x-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Widget Ulang Tahun */}
      {birthdayData.todayList.length > 0 && (
        <div className="bg-gradient-to-r from-pink-500 via-rose-500 to-amber-500 text-white rounded-3xl p-5 shadow-lg space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Cake className="w-6 h-6 text-amber-200 animate-bounce" />
              <div>
                <h3 className="font-black text-sm uppercase tracking-wider text-white">
                  🎉 Hari Ini Ada Warga yang Berulang Tahun!
                </h3>
                <p className="text-[11px] text-pink-100">Mari sampaikan doa dan ucapan selamat ulang tahun kepada tetangga kita.</p>
              </div>
            </div>
            <span className="px-3 py-1 bg-white/20 backdrop-blur-md rounded-full text-xs font-black">
              {birthdayData.todayList.length} Warga
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 pt-1">
            {birthdayData.todayList.map((b, idx) => (
              <div key={idx} className="bg-white/15 backdrop-blur-md border border-white/20 rounded-2xl p-3 flex justify-between items-center text-xs">
                <div>
                  <p className="font-black text-white">{b.nama}</p>
                  <span className="text-[10px] text-pink-100">Unit: {b.idRumah} • Usia ke-{b.umur} thn</span>
                </div>
                {isFullAdmin ? (
                  <button
                    onClick={() => sendWhatsAppBirthday(b.nama, b.noHp, b.umur)}
                    className="px-2.5 py-1 bg-white text-rose-600 hover:bg-rose-50 rounded-xl text-[10px] font-bold shadow-xs transition-all flex items-center space-x-1"
                  >
                    <MessageCircle className="w-3.5 h-3.5" />
                    <span>Kirim Ucapan</span>
                  </button>
                ) : (
                  <span className="text-[10px] text-white/80 italic">Doa Terbaik Warga</span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 4 Kartu Demografi Ringkas */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-1">
          <div className="flex justify-between items-center">
            <span className="text-[10px] font-bold text-slate-400 uppercase">Total Populasi Jiwa</span>
            <Users className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="text-2xl font-black text-slate-900">{statsTambahan.totalJiwa}</p>
          <p className="text-[10px] text-slate-400 font-medium">{warga.length} KK + {statsTambahan.totalJiwa - warga.length} Anggota</p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-blue-200 shadow-xs space-y-1">
          <div className="flex justify-between items-center">
            <span className="text-[10px] font-bold text-blue-600 uppercase">Total Kendaraan</span>
            <Car className="w-4 h-4 text-blue-600" />
          </div>
          <p className="text-2xl font-black text-slate-900">{statsTambahan.totalMobil + statsTambahan.totalMotor}</p>
          <p className="text-[10px] text-blue-700 font-semibold">{statsTambahan.totalMobil} Mobil • {statsTambahan.totalMotor} Motor</p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-rose-200 shadow-xs space-y-1">
          <div className="flex justify-between items-center">
            <span className="text-[10px] font-bold text-rose-600 uppercase">Golongan Darah O</span>
            <Droplet className="w-4 h-4 text-rose-600" />
          </div>
          <p className="text-2xl font-black text-rose-600">{statsTambahan.golDarahCounts['O'] || 0}</p>
          <p className="text-[10px] text-slate-400">Siaga donor darah darurat</p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-purple-200 shadow-xs space-y-1">
          <div className="flex justify-between items-center">
            <span className="text-[10px] font-bold text-purple-600 uppercase">Ultah Bulan Ini</span>
            <Cake className="w-4 h-4 text-purple-600" />
          </div>
          <p className="text-2xl font-black text-purple-700">{birthdayData.monthList.length + birthdayData.todayList.length}</p>
          <p className="text-[10px] text-purple-600 font-semibold">
            {NAMA_BULAN[new Date().getMonth()]}
          </p>
        </div>
      </div>

      {/* Filter & Pencarian */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Cari nama warga, nomor plat (B 1234), atau blok rumah..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs outline-none focus:border-emerald-500 shadow-2xs font-medium"
          />
        </div>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-xs outline-none font-semibold text-slate-700 shadow-2xs"
        >
          <option value="Semua">Semua Status Hunian</option>
          <option value="Menetap">Menetap (Pemilik)</option>
          <option value="Penyewa">Penyewa (Kontrak)</option>
          <option value="Kunjungan">Kunjungan</option>
        </select>
        <select
          value={filterGolDarah}
          onChange={(e) => setFilterGolDarah(e.target.value)}
          className="px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-xs outline-none font-semibold text-slate-700 shadow-2xs"
        >
          <option value="Semua">Semua Gol. Darah</option>
          <option value="O">Golongan O</option>
          <option value="A">Golongan A</option>
          <option value="B">Golongan B</option>
          <option value="AB">Golongan AB</option>
        </select>
      </div>

      {/* Tabel Data Warga Lengkap */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 border-b border-slate-200 text-[10px] uppercase font-bold text-slate-500 select-none">
              <tr>
                <th className="px-3 py-3.5 text-center w-12">No.</th>
                <th onClick={() => handleSort('id_rumah')} className="px-4 py-3.5 cursor-pointer hover:bg-slate-100 min-w-[95px]">
                  <span>Unit / Blok</span>
                  {renderSortIcon('id_rumah')}
                </th>
                <th onClick={() => handleSort('nama_lengkap')} className="px-4 py-3.5 cursor-pointer hover:bg-slate-100 min-w-[170px]">
                  <span>Kepala Keluarga</span>
                  {renderSortIcon('nama_lengkap')}
                </th>
                <th className="px-4 py-3.5 min-w-[170px]">Kontak WhatsApp (Privasi)</th>
                <th className="px-4 py-3.5 text-center min-w-[110px]">Keluarga</th>
                <th className="px-4 py-3.5 min-w-[140px]">Kendaraan / Plat</th>
                <th className="px-4 py-3.5 text-center min-w-[90px]">Gol. Darah</th>
                <th className="px-4 py-3.5 text-center min-w-[90px]">Status</th>
                <th className="px-4 py-3.5 text-right min-w-[110px]">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr><td colSpan={9} className="px-4 py-8 text-center text-slate-400">Memuat data kependudukan...</td></tr>
              ) : filteredWarga.length === 0 ? (
                <tr><td colSpan={9} className="px-4 py-8 text-center text-slate-400">Tidak ada data warga yang sesuai filter.</td></tr>
              ) : (
                filteredWarga.map((w, idx) => {
                  const anggotaCount = (w.anggota_keluarga || []).length;
                  const kendaraanCount = (w.kendaraan || []).length;
                  const waUrl = getWhatsAppLink(w.no_hp);

                  return (
                    <tr key={w.id_warga} className="hover:bg-slate-50 transition-colors">
                      <td className="px-3 py-3.5 text-center font-mono text-slate-400 text-xs">{idx + 1}</td>
                      <td className="px-4 py-3.5 font-mono font-bold text-slate-800">{w.id_rumah || '-'}</td>
                      
                      <td className="px-4 py-3.5">
                        <p className="font-bold text-slate-900 text-xs leading-tight">{w.nama_lengkap}</p>
                        {w.tanggal_lahir && (
                          <span className="text-[10px] text-slate-400 flex items-center space-x-1 mt-0.5">
                            <Cake className="w-3 h-3 text-pink-500 inline" />
                            <span>{formatDateIndo(w.tanggal_lahir)} ({calculateAge(w.tanggal_lahir)} thn)</span>
                          </span>
                        )}
                      </td>

                      {/* KOLOM NOMOR WHATSAPP: DIKUNCI TOTAL UNTUK MODE WARGA */}
                      <td className="px-4 py-3.5 font-mono">
                        {isFullAdmin ? (
                          // ADMIN: Bisa melihat nomor asli dan menghubungi langsung
                          waUrl ? (
                            <a 
                              href={waUrl} 
                              target="_blank" 
                              rel="noreferrer" 
                              className="inline-flex items-center space-x-1 px-2 py-0.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-lg text-xs font-bold transition-all shadow-2xs"
                              title="Hubungi WhatsApp"
                            >
                              <Phone className="w-3 h-3 text-emerald-600 shrink-0" />
                              <span>{formatPhoneNumber62(w.no_hp)}</span>
                            </a>
                          ) : (
                            <span className="text-slate-400 text-xs italic">-</span>
                          )
                        ) : (
                          // MODE WARGA / TAMU: NOMOR DIKUNCI TOTAL TANPA BISA DILIHAT
                          <span className="inline-flex items-center space-x-1.5 px-2.5 py-1 bg-slate-100 text-slate-500 rounded-lg text-xs font-semibold border border-slate-200 select-none">
                            <Lock className="w-3 h-3 text-amber-600 shrink-0" />
                            <span>Nomor Terkunci</span>
                          </span>
                        )}
                      </td>

                      {/* Anggota Keluarga */}
                      <td className="px-4 py-3.5 text-center">
                        <button
                          onClick={() => handleOpenDetail(w)}
                          className="inline-flex items-center space-x-1 px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-full text-[10px] font-bold transition-colors"
                        >
                          <Users className="w-3 h-3 text-slate-500" />
                          <span>{anggotaCount > 0 ? `+${anggotaCount} Anggota` : 'KK Tunggal'}</span>
                        </button>
                      </td>

                      {/* Kendaraan */}
                      <td className="px-4 py-3.5">
                        {kendaraanCount === 0 ? (
                          <span className="text-slate-400 text-[10px] italic">Tidak ada</span>
                        ) : (
                          <div className="space-y-0.5">
                            {(w.kendaraan || []).map((k, kIdx) => (
                              <div key={kIdx} className="inline-flex items-center space-x-1 px-2 py-0.5 bg-blue-50 text-blue-700 rounded text-[10px] font-bold mr-1 mb-0.5">
                                <span>{k.jenis === 'Mobil' ? '🚗' : '🏍️'}</span>
                                <span className="font-mono">{k.nomor_polisi}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </td>

                      {/* Golongan Darah */}
                      <td className="px-4 py-3.5 text-center">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${
                          w.golongan_darah === 'O' ? 'bg-rose-100 text-rose-700' :
                          w.golongan_darah === 'AB' ? 'bg-purple-100 text-purple-700' :
                          w.golongan_darah === 'A' || w.golongan_darah === 'B' ? 'bg-amber-100 text-amber-700' :
                          'bg-slate-100 text-slate-500'
                        }`}>
                          {w.golongan_darah || '-'}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="px-4 py-3.5 text-center">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-emerald-50 text-emerald-800 border border-emerald-200">
                          {w.status_warga || 'Menetap'}
                        </span>
                      </td>

                      {/* Kolom Aksi */}
                      <td className="px-4 py-3.5 text-right space-x-1 whitespace-nowrap">
                        <button
                          onClick={() => handleOpenDetail(w)}
                          className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Lihat Kartu Keluarga Lengkap"
                        >
                          <Eye className="w-3.5 h-3.5 inline" />
                        </button>

                        <button
                          onClick={() => handleOpenEdit(w)}
                          className="p-1.5 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                          title="Edit Data Warga"
                        >
                          <Edit2 className="w-3.5 h-3.5 inline" />
                        </button>

                        {/* Tombol Hapus Khusus Pengurus demi Keamanan */}
                        {isFullAdmin && (
                          <button
                            onClick={() => handleDelete(w.id_warga, w.nama_lengkap)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                            title="Hapus Data (Khusus Pengurus)"
                          >
                            <Trash2 className="w-3.5 h-3.5 inline" />
                          </button>
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

      {/* MODAL DETAIL KARTU KELUARGA & KENDARAAN (NOMOR TERKUNCI AMAN) */}
      {showDetailModal && selectedWargaDetail && (
        <div className="fixed inset-0 bg-slate-900/60 flex items-center justify-center p-4 z-50 backdrop-blur-xs">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-xl max-h-[90vh] overflow-y-auto overflow-hidden">
            <div className="bg-gradient-to-r from-emerald-800 to-teal-800 text-white p-5 flex justify-between items-start">
              <div>
                <span className="px-2.5 py-0.5 bg-white/20 text-emerald-100 rounded-full text-[10px] font-bold uppercase">
                  Kartu Identitas Warga Beryl
                </span>
                <h3 className="font-black text-lg text-white mt-1">{selectedWargaDetail.nama_lengkap}</h3>
                <p className="text-xs text-emerald-100">Unit Blok: <strong>{selectedWargaDetail.id_rumah}</strong> • Status: {selectedWargaDetail.status_warga}</p>
              </div>
              <button onClick={() => setShowDetailModal(false)} className="p-1 text-white/80 hover:text-white rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-5 text-xs">
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-2">
                <h4 className="font-bold text-slate-800 text-xs flex items-center space-x-1.5 border-b pb-2">
                  <Users className="w-4 h-4 text-emerald-600" />
                  <span>Biodata Kepala Keluarga:</span>
                </h4>
                <div className="grid grid-cols-2 gap-2 text-slate-600">
                  <div>
                    <span className="text-slate-400 block text-[10px]">No. WhatsApp:</span>
                    {isFullAdmin ? (
                      <span className="font-mono font-bold text-emerald-700">
                        {formatPhoneNumber62(selectedWargaDetail.no_hp)}
                      </span>
                    ) : (
                      <span className="font-bold text-amber-700 flex items-center space-x-1">
                        <Lock className="w-3 h-3" />
                        <span>Terkunci (Privasi Warga)</span>
                      </span>
                    )}
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">Golongan Darah:</span>
                    <span className="font-bold text-rose-600">{selectedWargaDetail.golongan_darah || '-'}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">Tempat & Tanggal Lahir:</span>
                    <span className="font-medium text-slate-800">
                      {selectedWargaDetail.tempat_lahir || '-'}, {formatDateIndo(selectedWargaDetail.tanggal_lahir)}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">Agama & Pekerjaan:</span>
                    <span className="font-medium text-slate-800">{selectedWargaDetail.agama || 'Islam'} • {selectedWargaDetail.pekerjaan || '-'}</span>
                  </div>
                  <div className="col-span-2 pt-1 border-t">
                    <span className="text-slate-400 block text-[10px]">Kontak Darurat:</span>
                    {isFullAdmin ? (
                      <span className="font-bold text-slate-800">{selectedWargaDetail.kontak_darurat || '-'}</span>
                    ) : (
                      <span className="font-bold text-slate-400 italic">Terkunci demi keamanan</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Anggota Keluarga */}
              <div className="space-y-2">
                <h4 className="font-bold text-slate-800 text-xs flex items-center justify-between">
                  <span className="flex items-center space-x-1.5">
                    <Users className="w-4 h-4 text-blue-600" />
                    <span>Daftar Anggota Keluarga ({ (selectedWargaDetail.anggota_keluarga || []).length } Orang):</span>
                  </span>
                </h4>

                {(selectedWargaDetail.anggota_keluarga || []).length === 0 ? (
                  <p className="p-3 bg-slate-50 rounded-xl text-slate-400 text-center italic">Belum ada data anggota keluarga tambahan.</p>
                ) : (
                  <div className="divide-y divide-slate-100 border border-slate-200 rounded-2xl overflow-hidden">
                    {(selectedWargaDetail.anggota_keluarga || []).map((a, idx) => (
                      <div key={idx} className="p-3 bg-white flex justify-between items-center hover:bg-slate-50">
                        <div>
                          <p className="font-bold text-slate-900">{a.nama}</p>
                          <p className="text-[10px] text-slate-400">
                            Hubungan: <strong className="text-slate-700">{a.hubungan}</strong> • {a.jenis_kelamin === 'L' ? 'Laki-laki' : 'Perempuan'}
                          </p>
                          {a.tanggal_lahir && (
                            <p className="text-[10px] text-pink-600 font-medium">
                              Lahir: {formatDateIndo(a.tanggal_lahir)} ({calculateAge(a.tanggal_lahir)} thn)
                            </p>
                          )}
                        </div>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                          Gol: {a.golongan_darah || '-'}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Kendaraan */}
              <div className="space-y-2">
                <h4 className="font-bold text-slate-800 text-xs flex items-center justify-between">
                  <span className="flex items-center space-x-1.5">
                    <Car className="w-4 h-4 text-amber-600" />
                    <span>Data Kendaraan Terdaftar ({ (selectedWargaDetail.kendaraan || []).length } Unit):</span>
                  </span>
                </h4>

                {(selectedWargaDetail.kendaraan || []).length === 0 ? (
                  <p className="p-3 bg-slate-50 rounded-xl text-slate-400 text-center italic">Tidak ada kendaraan terdaftar.</p>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {(selectedWargaDetail.kendaraan || []).map((k, idx) => (
                      <div key={idx} className="p-3 bg-slate-50 rounded-2xl border border-slate-200 flex items-center space-x-3">
                        <div className="w-8 h-8 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-sm">
                          {k.jenis === 'Mobil' ? '🚗' : '🏍️'}
                        </div>
                        <div>
                          <p className="font-mono font-black text-slate-900 text-xs">{k.nomor_polisi}</p>
                          <p className="text-[10px] text-slate-500">{k.jenis} • {k.merk_model || '-'} ({k.warna || '-'})</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="p-4 bg-slate-50 border-t flex justify-end">
              <button
                onClick={() => setShowDetailModal(false)}
                className="px-5 py-2 bg-slate-800 hover:bg-slate-900 text-white font-bold rounded-xl text-xs"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL FORM TAMBAH / EDIT WARGA */}
      {showFormModal && (
        <div className="fixed inset-0 bg-slate-900/60 flex items-center justify-center p-4 z-50 backdrop-blur-xs">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-5 border-b flex justify-between items-center sticky top-0 bg-white z-10">
              <div>
                <h3 className="font-black text-sm text-slate-900">
                  {editingData ? 'Edit Data Profil Warga & Keluarga' : 'Pendaftaran Data Warga & Keluarga Baru'}
                </h3>
                <p className="text-[11px] text-slate-400">Lengkapi data kepala keluarga, nomor WhatsApp, anggota keluarga, dan plat kendaraan.</p>
              </div>
              <button onClick={() => setShowFormModal(false)} className="text-slate-400 hover:text-slate-600"><X className="w-4 h-4" /></button>
            </div>

            <div className="flex border-b bg-slate-50 px-5 pt-2 space-x-2 text-xs font-bold">
              <button
                type="button"
                onClick={() => setActiveTabForm('kepala')}
                className={`pb-2.5 px-3 border-b-2 transition-all ${
                  activeTabForm === 'kepala' ? 'border-emerald-600 text-emerald-700' : 'border-transparent text-slate-400'
                }`}
              >
                1. Kepala Keluarga
              </button>
              <button
                type="button"
                onClick={() => setActiveTabForm('keluarga')}
                className={`pb-2.5 px-3 border-b-2 transition-all flex items-center space-x-1 ${
                  activeTabForm === 'keluarga' ? 'border-emerald-600 text-emerald-700' : 'border-transparent text-slate-400'
                }`}
              >
                <span>2. Anggota Keluarga</span>
                <span className="px-1.5 py-0.2 bg-blue-100 text-blue-700 rounded-full text-[10px]">
                  {formAnggotaList.length}
                </span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTabForm('kendaraan')}
                className={`pb-2.5 px-3 border-b-2 transition-all flex items-center space-x-1 ${
                  activeTabForm === 'kendaraan' ? 'border-emerald-600 text-emerald-700' : 'border-transparent text-slate-400'
                }`}
              >
                <span>3. Data Kendaraan</span>
                <span className="px-1.5 py-0.2 bg-amber-100 text-amber-700 rounded-full text-[10px]">
                  {formKendaraanList.length}
                </span>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
              {activeTabForm === 'kepala' && (
                <div className="space-y-3.5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block font-bold text-slate-600 mb-1">Nama Lengkap Kepala Keluarga *</label>
                      <input
                        required
                        type="text"
                        placeholder="Misal: Bapak H. Moch. Wahyu"
                        value={formKK.nama_lengkap}
                        onChange={(e) => setFormKK({ ...formKK, nama_lengkap: e.target.value })}
                        className="w-full px-3 py-2 border rounded-xl outline-none focus:border-emerald-500 font-medium"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-slate-600 mb-1">Unit / Blok Rumah *</label>
                      <input
                        required
                        type="text"
                        placeholder="Beryl-A1-01"
                        value={formKK.id_rumah}
                        onChange={(e) => setFormKK({ ...formKK, id_rumah: e.target.value })}
                        className="w-full px-3 py-2 border rounded-xl font-mono font-bold outline-none focus:border-emerald-500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block font-bold text-slate-600 mb-1">Status Hunian</label>
                      <select
                        value={formKK.status_warga}
                        onChange={(e) => setFormKK({ ...formKK, status_warga: e.target.value })}
                        className="w-full px-3 py-2 border rounded-xl font-bold text-emerald-700 bg-white"
                      >
                        <option value="Menetap">Menetap (Pemilik)</option>
                        <option value="Penyewa">Penyewa (Kontrak)</option>
                        <option value="Kunjungan">Kunjungan</option>
                        <option value="Pindahan">Pindahan</option>
                      </select>
                    </div>
                    <div>
                      <label className="block font-bold text-slate-600 mb-1">Nomor WhatsApp (+62)</label>
                      <input
                        type="text"
                        placeholder="081234567890"
                        value={formKK.no_hp}
                        onChange={(e) => setFormKK({ ...formKK, no_hp: e.target.value })}
                        className="w-full px-3 py-2 border rounded-xl font-mono font-bold text-emerald-700"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-slate-600 mb-1">Golongan Darah</label>
                      <select
                        value={formKK.golongan_darah}
                        onChange={(e) => setFormKK({ ...formKK, golongan_darah: e.target.value })}
                        className="w-full px-3 py-2 border rounded-xl font-bold text-rose-700 bg-white"
                      >
                        <option value="O">Golongan O</option>
                        <option value="A">Golongan A</option>
                        <option value="B">Golongan B</option>
                        <option value="AB">Golongan AB</option>
                        <option value="Tidak Tahu">Tidak Tahu</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block font-bold text-slate-600 mb-1">Tempat Lahir</label>
                      <input
                        type="text"
                        placeholder="Misal: Jakarta"
                        value={formKK.tempat_lahir}
                        onChange={(e) => setFormKK({ ...formKK, tempat_lahir: e.target.value })}
                        className="w-full px-3 py-2 border rounded-xl"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-slate-600 mb-1">Tanggal Lahir</label>
                      <input
                        type="date"
                        value={formKK.tanggal_lahir}
                        onChange={(e) => setFormKK({ ...formKK, tanggal_lahir: e.target.value })}
                        className="w-full px-3 py-2 border rounded-xl"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block font-bold text-slate-600 mb-1">Agama</label>
                      <select
                        value={formKK.agama}
                        onChange={(e) => setFormKK({ ...formKK, agama: e.target.value })}
                        className="w-full px-3 py-2 border rounded-xl bg-white"
                      >
                        <option value="Islam">Islam</option>
                        <option value="Kristen Protestan">Kristen Protestan</option>
                        <option value="Katolik">Katolik</option>
                        <option value="Hindu">Hindu</option>
                        <option value="Buddha">Buddha</option>
                        <option value="Lainnya">Lainnya</option>
                      </select>
                    </div>
                    <div>
                      <label className="block font-bold text-slate-600 mb-1">Pekerjaan</label>
                      <input
                        type="text"
                        placeholder="Misal: Karyawan Swasta"
                        value={formKK.pekerjaan}
                        onChange={(e) => setFormKK({ ...formKK, pekerjaan: e.target.value })}
                        className="w-full px-3 py-2 border rounded-xl"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-slate-600 mb-1">Kontak Darurat</label>
                      <input
                        type="text"
                        placeholder="Nama & No. HP Kerabat"
                        value={formKK.kontak_darurat}
                        onChange={(e) => setFormKK({ ...formKK, kontak_darurat: e.target.value })}
                        className="w-full px-3 py-2 border rounded-xl"
                      />
                    </div>
                  </div>
                </div>
              )}

              {activeTabForm === 'keluarga' && (
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <p className="font-bold text-slate-700">Daftar Anggota Keluarga Tambahan:</p>
                    <button
                      type="button"
                      onClick={handleAddAnggota}
                      className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center space-x-1"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Tambah Anggota</span>
                    </button>
                  </div>

                  {formAnggotaList.length === 0 ? (
                    <div className="p-6 bg-slate-50 rounded-2xl border text-center text-slate-400">
                      Belum ada anggota keluarga tambahan. Klik tombol <strong>&quot;Tambah Anggota&quot;</strong>.
                    </div>
                  ) : (
                    <div className="space-y-2.5">
                      {formAnggotaList.map((a, idx) => (
                        <div key={idx} className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                          <div className="flex justify-between items-center border-b pb-1.5">
                            <span className="font-bold text-slate-800 text-[11px]">Anggota #{idx + 1}</span>
                            <button
                              type="button"
                              onClick={() => handleRemoveAnggota(idx)}
                              className="text-rose-500 hover:text-rose-700 text-xs font-bold flex items-center space-x-0.5"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              <span>Hapus</span>
                            </button>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                            <div>
                              <label className="block text-[10px] font-bold text-slate-500 mb-0.5">Nama Anggota *</label>
                              <input
                                required
                                type="text"
                                placeholder="Nama lengkap"
                                value={a.nama}
                                onChange={(e) => handleUpdateAnggota(idx, 'nama', e.target.value)}
                                className="w-full px-2.5 py-1.5 bg-white border rounded-lg"
                              />
                            </div>
                            <div>
                              <label className="block text-[10px] font-bold text-slate-500 mb-0.5">Hubungan</label>
                              <select
                                value={a.hubungan}
                                onChange={(e) => handleUpdateAnggota(idx, 'hubungan', e.target.value)}
                                className="w-full px-2.5 py-1.5 bg-white border rounded-lg font-bold text-slate-800"
                              >
                                <option value="Istri">Istri</option>
                                <option value="Anak">Anak</option>
                                <option value="Ayah">Ayah</option>
                                <option value="Ibu">Ibu</option>
                                <option value="Mertua">Mertua</option>
                                <option value="Sepupu">Sepupu</option>
                                <option value="Kakak/Adik">Kakak / Adik</option>
                                <option value="Famili Lain">Famili Lain</option>
                              </select>
                            </div>
                            <div>
                              <label className="block text-[10px] font-bold text-slate-500 mb-0.5">Gol. Darah</label>
                              <select
                                value={a.golongan_darah || 'O'}
                                onChange={(e) => handleUpdateAnggota(idx, 'golongan_darah', e.target.value)}
                                className="w-full px-2.5 py-1.5 bg-white border rounded-lg"
                              >
                                <option value="O">Golongan O</option>
                                <option value="A">Golongan A</option>
                                <option value="B">Golongan B</option>
                                <option value="AB">Golongan AB</option>
                                <option value="Tidak Tahu">Tidak Tahu</option>
                              </select>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {activeTabForm === 'kendaraan' && (
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <p className="font-bold text-slate-700">Daftar Kendaraan Terdaftar:</p>
                    <button
                      type="button"
                      onClick={handleAddKendaraan}
                      className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold flex items-center space-x-1"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Tambah Kendaraan</span>
                    </button>
                  </div>

                  {formKendaraanList.length === 0 ? (
                    <div className="p-6 bg-slate-50 rounded-2xl border text-center text-slate-400">
                      Belum ada kendaraan terdaftar.
                    </div>
                  ) : (
                    <div className="space-y-2.5">
                      {formKendaraanList.map((k, idx) => (
                        <div key={idx} className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                          <div className="flex justify-between items-center border-b pb-1.5">
                            <span className="font-bold text-slate-800 text-[11px]">Kendaraan #{idx + 1}</span>
                            <button
                              type="button"
                              onClick={() => handleRemoveKendaraan(idx)}
                              className="text-rose-500 hover:text-rose-700 text-xs font-bold flex items-center space-x-0.5"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              <span>Hapus</span>
                            </button>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
                            <div>
                              <label className="block text-[10px] font-bold text-slate-500 mb-0.5">Jenis</label>
                              <select
                                value={k.jenis}
                                onChange={(e) => handleUpdateKendaraan(idx, 'jenis', e.target.value as any)}
                                className="w-full px-2.5 py-1.5 bg-white border rounded-lg font-bold"
                              >
                                <option value="Mobil">🚗 Mobil</option>
                                <option value="Motor">🏍️ Motor</option>
                                <option value="Sepeda Listrik">🛵 Sepeda Listrik</option>
                                <option value="Lainnya">🚲 Lainnya</option>
                              </select>
                            </div>
                            <div>
                              <label className="block text-[10px] font-bold text-slate-500 mb-0.5">Nomor Polisi (Plat) *</label>
                              <input
                                required
                                type="text"
                                placeholder="B 1234 XYZ"
                                value={k.nomor_polisi}
                                onChange={(e) => handleUpdateKendaraan(idx, 'nomor_polisi', e.target.value.toUpperCase())}
                                className="w-full px-2.5 py-1.5 bg-white border rounded-lg font-mono font-bold"
                              />
                            </div>
                            <div>
                              <label className="block text-[10px] font-bold text-slate-500 mb-0.5">Merk / Model</label>
                              <input
                                type="text"
                                placeholder="Misal: HR-V / NMAX"
                                value={k.merk_model || ''}
                                onChange={(e) => handleUpdateKendaraan(idx, 'merk_model', e.target.value)}
                                className="w-full px-2.5 py-1.5 bg-white border rounded-lg"
                              />
                            </div>
                            <div>
                              <label className="block text-[10px] font-bold text-slate-500 mb-0.5">Warna</label>
                              <input
                                type="text"
                                placeholder="Misal: Hitam"
                                value={k.warna || ''}
                                onChange={(e) => handleUpdateKendaraan(idx, 'warna', e.target.value)}
                                className="w-full px-2.5 py-1.5 bg-white border rounded-lg"
                              />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              <div className="flex justify-between items-center pt-4 border-t">
                <div className="flex space-x-1.5">
                  {activeTabForm !== 'kepala' && (
                    <button
                      type="button"
                      onClick={() => setActiveTabForm(activeTabForm === 'kendaraan' ? 'keluarga' : 'kepala')}
                      className="px-3 py-2 border rounded-xl font-bold text-slate-600"
                    >
                      Kembali
                    </button>
                  )}
                  {activeTabForm !== 'kendaraan' && (
                    <button
                      type="button"
                      onClick={() => setActiveTabForm(activeTabForm === 'kepala' ? 'keluarga' : 'kendaraan')}
                      className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl font-bold"
                    >
                      Lanjut ({activeTabForm === 'kepala' ? 'Keluarga' : 'Kendaraan'})
                    </button>
                  )}
                </div>

                <div className="flex space-x-2">
                  <button
                    type="button"
                    onClick={() => setShowFormModal(false)}
                    className="px-4 py-2 border rounded-xl font-bold text-slate-600"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold shadow-md shadow-emerald-700/20"
                  >
                    Simpan Data Lengkap
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export const Kependudukan = DataWarga;
export default DataWarga;