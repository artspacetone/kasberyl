// src/pages/InfaqBulanan.tsx
import React, { useEffect, useState, useMemo, useCallback, useRef } from 'react';
import { supabase, isSupabaseConfigured } from '../supabase';
import { Warga, KasWargaBeryl, formatRupiah, NAMA_BULAN, Pengguna } from '../types';
import { 
  CheckCircle2, Search, Plus, X, FileSpreadsheet, 
  Edit2, Trash2, Receipt, ExternalLink, RefreshCw,
  ChevronLeft, ChevronRight, Zap, ShieldCheck, Database, Radio
} from 'lucide-react';
import { WargaSearchSelect } from '../components/WargaSearchSelect';
import { exportMatriksKasToExcel } from '../utils/exportManager';
import { KuitansiModal, KuitansiData } from '../components/KuitansiModal';
import { ImageViewerModal } from '../components/ImageViewerModal';
import { 
  parseRawKasTextToRecords, 
  forceInjectKasData, 
  emitSafeDataUpdated 
} from '../utils/permanentKasData';

const cleanKey = (str: any): string => {
  if (!str) return '';
  return String(str).toLowerCase().trim().replace(/[^a-z0-9]/g, '');
};

export const InfaqBulananPage: React.FC<{ currentUser?: Pengguna }> = ({ currentUser }) => {
  const [wargaList, setWargaList] = useState<Warga[]>([]);
  const [kasList, setKasList] = useState<KasWargaBeryl[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'matriks' | 'transaksi'>('matriks');
  const [search, setSearch] = useState('');
  const [selectedYear, setSelectedYear] = useState<number>(2026);
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'cancel' } | null>(null);

  // Modal Input Paksa
  const [showForceModal, setShowForceModal] = useState(false);
  const [rawTextInput, setRawTextInput] = useState('');
  const [isInjecting, setIsInjecting] = useState(false);

  // Flag lock anti-reload loop
  const isSelfUpdatingRef = useRef(false);

  // Paginasi Cerdas O(1)
  const [pageMatriks, setPageMatriks] = useState(1);
  const [rowsPerMatriks, setRowsPerMatriks] = useState(50);
  const [pageTrx, setPageTrx] = useState(1);
  const [rowsPerTrx, setRowsPerTrx] = useState(50);

  // Modals CRUD
  const [showManualModal, setShowManualModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingKas, setEditingKas] = useState<KasWargaBeryl | null>(null);
  const [activeKuitansi, setActiveKuitansi] = useState<KuitansiData | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const isGuest = !currentUser || currentUser.id_pengguna === 0 || currentUser.peran === 'Warga';
  const canEdit = !isGuest && (currentUser.peran === 'Super_Admin' || currentUser.peran === 'Admin_Keuangan');

  // Form State Tambah
  const [formManual, setFormManual] = useState({
    id_warga: '',
    bulan: 1,
    nominal: 10000,
    tanggal: new Date().toISOString().slice(0, 10),
    keterangan: 'Iuran Kas Warga',
    bukti_transfer: '',
  });

  // Form State Edit
  const [formEdit, setFormEdit] = useState({
    id_transaksi: 0,
    id_warga: 0,
    bulan: 1,
    tahun: 2026,
    nominal: 10000,
    tanggal: '',
    keterangan: '',
    status_bayar: 'Lunas' as 'Lunas' | 'Menunggu Verifikasi' | 'Tunggakan',
    bukti_transfer: '',
  });

  const showToast = useCallback((text: string, type: 'success' | 'cancel') => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 2500);
  }, []);

  // Matching Cerdas Berdasarkan Rumah & Nama
  const isMatchWarga = useCallback((k: KasWargaBeryl, w: Warga): boolean => {
    const rK = cleanKey(k.id_rumah);
    const rW = cleanKey(w.id_rumah);
    if (rK && rW && rK === rW) {
      return true;
    }
    if (k.id_warga && w.id_warga && String(k.id_warga) === String(w.id_warga)) {
      return true;
    }
    const nK = cleanKey(k.nama_warga);
    const nW = cleanKey(w.nama_lengkap);
    if (nK && nW && (nK === nW || nK.includes(nW) || nW.includes(nK))) {
      return true;
    }
    return false;
  }, []);

  const isMatchMonth = useCallback((k: KasWargaBeryl, year: number, month: number): boolean => {
    const monthCode = String(month).padStart(2, '0');
    const prefix = `${year}-${monthCode}`;
    
    if (k.periode_bulan && String(k.periode_bulan).startsWith(prefix)) {
      return true;
    }
    
    const ket = (k.keterangan || '').toLowerCase();
    const mName = NAMA_BULAN[month - 1].toLowerCase();
    if (ket.includes(mName) && ket.includes(String(year))) {
      return true;
    }

    if (k.tanggal && String(k.tanggal).startsWith(prefix) && (!k.periode_bulan || k.periode_bulan === '')) {
      return true;
    }
    
    return false;
  }, []);

  // =========================================================================
  // LOAD DATA DENGAN LIMIT 5.000 (MENGAMBIL SELURUH 1.028 DATA CLOUD KE HP & LAPTOP)
  // =========================================================================
  const loadData = useCallback(async () => {
    setLoading(true);
    let loadedWarga: Warga[] = [];
    let loadedKas: KasWargaBeryl[] = [];

    // 1. Ambil dari Memori Lokal Terlebih Dahulu
    const localW = localStorage.getItem('local_warga');
    if (localW) {
      try { loadedWarga = JSON.parse(localW); } catch (e) {}
    }

    const localK = localStorage.getItem('local_kas');
    if (localK) {
      try { loadedKas = JSON.parse(localK); } catch (e) {}
    }

    // 2. Ambil dari Supabase Cloud (Limit 5000 agar tidak terpotong 1000)
    if (isSupabaseConfigured) {
      try {
        const resWarga = await supabase.from('warga').select('*').order('id_rumah', { ascending: true }).limit(2000);
        if (resWarga.data && resWarga.data.length > 0) {
          loadedWarga = resWarga.data;
          localStorage.setItem('local_warga', JSON.stringify(loadedWarga));
        }

        const resKas = await supabase.from('kas_warga').select('*').order('tanggal', { ascending: false }).limit(5000);

        if (!resKas.error && resKas.data && resKas.data.length > 0) {
          // Cloud memiliki data: Utamakan Cloud agar HP & Laptop Sinkron 100%!
          loadedKas = resKas.data.map((d: any) => ({
            id_transaksi: d.id_transaksi,
            id_warga: d.id_warga || 0,
            nama_warga: d.nama_warga || 'Warga Beryl',
            id_rumah: d.id_rumah || '-',
            periode_bulan: d.periode_bulan,
            tanggal: d.tanggal,
            nominal: Number(d.nominal || 10000),
            peruntukan: d.peruntukan || 'Operasional dan Sosial',
            status_bayar: d.status_bayar || 'Lunas',
            keterangan: d.keterangan || 'Iuran Kas Warga',
            bukti_transfer: d.bukti_transfer || '',
            diinput_oleh: d.diinput_oleh || 1
          }));
          localStorage.setItem('local_kas', JSON.stringify(loadedKas));
        }
      } catch (err: any) {
        console.warn('Menggunakan data kas lokal:', err.message);
      }
    }

    setWargaList(loadedWarga);
    setKasList(loadedKas);
    setLoading(false);
  }, []);

  // REALTIME WEBSOCKET SUPABASE (HP & LAPTOP SINKRON DETIK ITU JUGA)
  useEffect(() => {
    loadData();

    let channel: any = null;
    if (isSupabaseConfigured) {
      channel = supabase
        .channel('public:kas_warga')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'kas_warga' }, () => {
          if (!isSelfUpdatingRef.current) {
            loadData();
          }
        })
        .subscribe();
    }

    const handleUpdate = () => {
      if (isSelfUpdatingRef.current) {
        isSelfUpdatingRef.current = false;
        return;
      }
      loadData();
    };

    window.addEventListener('app_data_updated', handleUpdate);
    return () => {
      window.removeEventListener('app_data_updated', handleUpdate);
      if (channel) supabase.removeChannel(channel);
    };
  }, [loadData]);

  // Pre-Computed Hash Map O(1)
  const kasMatrixMap = useMemo(() => {
    const map = new Map<string, KasWargaBeryl>();
    const yrStr = String(selectedYear);

    for (let i = 0; i < kasList.length; i++) {
      const k = kasList[i];
      const pBulan = k.periode_bulan || k.tanggal || '';
      if (!pBulan.includes(yrStr) && !(k.keterangan || '').includes(yrStr)) continue;

      let monthNum = 0;
      if (k.periode_bulan) {
        const parts = k.periode_bulan.split('-');
        if (parts.length >= 2) monthNum = parseInt(parts[1], 10);
      }
      if (!monthNum && k.keterangan) {
        const ketLow = k.keterangan.toLowerCase();
        for (let m = 0; m < 12; m++) {
          if (ketLow.includes(NAMA_BULAN[m].toLowerCase())) {
            monthNum = m + 1;
            break;
          }
        }
      }
      if (!monthNum) continue;

      if (k.id_rumah) {
        map.set(`rumah_${cleanKey(k.id_rumah)}_${monthNum}`, k);
      }
      if (k.id_warga) {
        map.set(`id_${k.id_warga}_${monthNum}`, k);
      }
      if (k.nama_warga) {
        map.set(`nama_${cleanKey(k.nama_warga)}_${monthNum}`, k);
      }
    }
    return map;
  }, [kasList, selectedYear]);

  const getKasItem = useCallback((w: Warga, bulan: number): KasWargaBeryl | undefined => {
    return (
      (w.id_rumah ? kasMatrixMap.get(`rumah_${cleanKey(w.id_rumah)}_${bulan}`) : undefined) ||
      (w.id_warga ? kasMatrixMap.get(`id_${w.id_warga}_${bulan}`) : undefined) ||
      (w.nama_lengkap ? kasMatrixMap.get(`nama_${cleanKey(w.nama_lengkap)}_${bulan}`) : undefined)
    );
  }, [kasMatrixMap]);

  // =========================================================================
  // KLIK 1X MASUK DANA, KLIK 2X BATAL (HAPUS BERDASARKAN RUMAH & BULAN PRESISI)
  // =========================================================================
  const handleCellClick = async (w: Warga, bulan: number) => {
    const found = getKasItem(w, bulan);

    // KASUS 1: BATALKAN PEMBAYARAN (HANYA HAPUS RUMAH INI DI BULAN INI)
    if (found) {
      if (!canEdit) {
        bukaKuitansi(w, found, bulan);
        return;
      }

      const konfirmasi = confirm(
        `Batalkan pembayaran Kas Rp 10.000 bulan ${NAMA_BULAN[bulan - 1]} ${selectedYear} untuk ${w.nama_lengkap} (${w.id_rumah})?`
      );
      if (!konfirmasi) return;

      const monthCode = String(bulan).padStart(2, '0');
      const targetPeriode = `${selectedYear}-${monthCode}-01`;

      // Hapus di cloud berdasarkan unit rumah dan bulan yang pasti
      if (isSupabaseConfigured) {
        try {
          await supabase.from('kas_warga').delete().match({
            id_rumah: w.id_rumah,
            periode_bulan: targetPeriode
          });
        } catch (e) {}
      }

      // Hapus hanya tepat 1 baris di memori lokal
      const targetIndex = kasList.findIndex(k => 
        (cleanKey(k.id_rumah) === cleanKey(w.id_rumah) && isMatchMonth(k, selectedYear, bulan)) ||
        (found.id_transaksi && k.id_transaksi === found.id_transaksi)
      );

      if (targetIndex !== -1) {
        const updated = [...kasList];
        updated.splice(targetIndex, 1);

        isSelfUpdatingRef.current = true;
        setKasList(updated);
        localStorage.setItem('local_kas', JSON.stringify(updated));
        emitSafeDataUpdated();
        showToast(`❌ Pembayaran ${NAMA_BULAN[bulan - 1]} ${w.id_rumah} dibatalkan`, 'cancel');
      }
      return;
    }

    // KASUS 2: MASUK DANA (BAYAR LUNAS DENGAN UPSERT ANTI-409)
    if (!canEdit) return;

    const monthCode = String(bulan).padStart(2, '0');
    const tanggalBayar = new Date().toISOString().slice(0, 10);
    const periodeBulan = `${selectedYear}-${monthCode}-01`;
    const generatedId = Date.now() + Math.floor(Math.random() * 10000);

    const newRecord: KasWargaBeryl = {
      id_transaksi: generatedId,
      id_warga: w.id_warga,
      nama_warga: w.nama_lengkap,
      id_rumah: w.id_rumah,
      periode_bulan: periodeBulan,
      tanggal: tanggalBayar,
      nominal: 10000,
      peruntukan: 'Operasional dan Sosial',
      status_bayar: 'Lunas',
      keterangan: `Iuran Kas Warga Beryl (${NAMA_BULAN[bulan - 1]} ${selectedYear})`,
      bukti_transfer: '',
      diinput_oleh: currentUser?.id_pengguna || 1,
    };

    if (isSupabaseConfigured) {
      try {
        await supabase.from('kas_warga').upsert([{
          id_rumah: w.id_rumah,
          nama_warga: w.nama_lengkap,
          periode_bulan: periodeBulan,
          tanggal: tanggalBayar,
          nominal: 10000,
          peruntukan: 'Operasional dan Sosial',
          status_bayar: 'Lunas',
          keterangan: newRecord.keterangan,
          bukti_transfer: '',
          diinput_oleh: currentUser?.id_pengguna || 1
        }], {
          onConflict: 'id_rumah,periode_bulan',
          ignoreDuplicates: false
        });
      } catch (e) {}
    }

    const updated = [newRecord, ...kasList];

    isSelfUpdatingRef.current = true;
    setKasList(updated);
    localStorage.setItem('local_kas', JSON.stringify(updated));
    emitSafeDataUpdated();

    showToast(`✓ Iuran ${NAMA_BULAN[bulan - 1]} ${w.id_rumah} LUNAS (+Rp 10.000)`, 'success');
  };

  // =========================================================================
  // PAKSA MASUKKAN 1.028 TRANSAKSI KE CLOUD SUPABASE & LOKAL
  // =========================================================================
  const handleForceInject = async () => {
    if (!rawTextInput.trim()) {
      alert('Silakan tempel teks catatan transaksi dari file new 3.txt terlebih dahulu!');
      return;
    }

    setIsInjecting(true);
    const parsed = parseRawKasTextToRecords(rawTextInput);
    if (parsed.length === 0) {
      alert('Format teks tidak terdeteksi. Pastikan format sesuai file new 3.txt!');
      setIsInjecting(false);
      return;
    }

    const ok = await forceInjectKasData(parsed);
    setKasList(parsed);
    setIsInjecting(false);
    setShowForceModal(false);

    if (ok) {
      showToast(`⚡ Sukses! ${parsed.length} Data Kas Berhasil Masuk Cloud & Lokal!`, 'success');
    } else {
      showToast(`⚠️ Tersimpan di Lokal, Periksa Koneksi Cloud Supabase`, 'cancel');
    }
  };

  const bukaKuitansi = (w: Warga, k: KasWargaBeryl, bulan: number) => {
    const monthCode = String(bulan).padStart(2, '0');
    const kData: KuitansiData = {
      noKuitansi: `KAS/BERYL/${selectedYear}${monthCode}/${k.id_transaksi}`,
      jenisTransaksi: 'Iuran Kas Warga (Rp 10.000)',
      namaWarga: w.nama_lengkap,
      idRumah: w.id_rumah || '-',
      noHp: w.no_hp,
      tanggalBayar: k.tanggal || new Date().toISOString().slice(0, 10),
      nominal: Number(k.nominal || 10000),
      periodeAtauKeperluan: `Iuran Bulan ${NAMA_BULAN[bulan - 1]} ${selectedYear}`,
      namaPenerima: currentUser?.nama_lengkap || 'Bendahara Paguyuban',
    };
    setActiveKuitansi(kData);
  };

  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canEdit || !formManual.id_warga) {
      alert('Silakan pilih warga terlebih dahulu!');
      return;
    }

    const monthCode = String(formManual.bulan).padStart(2, '0');
    const periodeBulan = `${selectedYear}-${monthCode}-01`;
    const generatedId = Date.now() + Math.floor(Math.random() * 10000);
    const wargaObj = wargaList.find(w => String(w.id_warga) === String(formManual.id_warga));

    const newRecord: any = {
      id_transaksi: generatedId,
      id_warga: Number(formManual.id_warga),
      nama_warga: wargaObj?.nama_lengkap || 'Warga Beryl',
      id_rumah: wargaObj?.id_rumah || '-',
      periode_bulan: periodeBulan,
      tanggal: formManual.tanggal,
      nominal: Number(formManual.nominal),
      peruntukan: 'Operasional dan Sosial',
      status_bayar: 'Lunas',
      keterangan: formManual.keterangan || `Iuran Kas Warga (${NAMA_BULAN[formManual.bulan - 1]} ${selectedYear})`,
      bukti_transfer: formManual.bukti_transfer.trim(),
    };

    if (isSupabaseConfigured && wargaObj) {
      try {
        await supabase.from('kas_warga').upsert([{
          id_rumah: wargaObj.id_rumah,
          nama_warga: wargaObj.nama_lengkap,
          periode_bulan: periodeBulan,
          tanggal: formManual.tanggal,
          nominal: Number(formManual.nominal),
          peruntukan: 'Operasional dan Sosial',
          status_bayar: 'Lunas',
          keterangan: newRecord.keterangan,
          bukti_transfer: formManual.bukti_transfer.trim(),
          diinput_oleh: currentUser?.id_pengguna || 1
        }], {
          onConflict: 'id_rumah,periode_bulan',
          ignoreDuplicates: false
        });
      } catch (e) {}
    }

    const updated = [newRecord, ...kasList];

    isSelfUpdatingRef.current = true;
    setKasList(updated);
    localStorage.setItem('local_kas', JSON.stringify(updated));
    emitSafeDataUpdated();
    setShowManualModal(false);

    if (wargaObj) {
      bukaKuitansi(wargaObj, newRecord, formManual.bulan);
    }
  };

  const handleOpenEdit = (item: KasWargaBeryl) => {
    if (!canEdit) return;
    setEditingKas(item);

    let b = 1;
    let y = 2026;
    if (item.periode_bulan) {
      const parts = item.periode_bulan.split('-');
      if (parts.length >= 2) {
        y = parseInt(parts[0], 10) || 2026;
        b = parseInt(parts[1], 10) || 1;
      }
    }

    setFormEdit({
      id_transaksi: item.id_transaksi,
      id_warga: item.id_warga,
      bulan: b,
      tahun: y,
      nominal: Number(item.nominal || 10000),
      tanggal: item.tanggal || new Date().toISOString().slice(0, 10),
      keterangan: item.keterangan || 'Iuran Kas Warga',
      status_bayar: item.status_bayar || 'Lunas',
      bukti_transfer: item.bukti_transfer || '',
    });
    setShowEditModal(true);
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingKas || !canEdit) return;

    const monthCode = String(formEdit.bulan).padStart(2, '0');
    const periodeBulan = `${formEdit.tahun}-${monthCode}-01`;

    const updatePayload = {
      periode_bulan: periodeBulan,
      tanggal: formEdit.tanggal,
      nominal: Number(formEdit.nominal),
      keterangan: formEdit.keterangan.trim(),
      status_bayar: formEdit.status_bayar,
      bukti_transfer: formEdit.bukti_transfer.trim(),
      diinput_oleh: currentUser?.id_pengguna || 1,
    };

    if (isSupabaseConfigured) {
      try {
        await supabase
          .from('kas_warga')
          .update(updatePayload)
          .match({ id_rumah: editingKas.id_rumah, periode_bulan: editingKas.periode_bulan });
      } catch (err: any) {}
    }

    const updated = kasList.map(k => 
      k.id_transaksi === editingKas.id_transaksi 
        ? { ...k, ...updatePayload } 
        : k
    );

    isSelfUpdatingRef.current = true;
    setKasList(updated);
    localStorage.setItem('local_kas', JSON.stringify(updated));
    emitSafeDataUpdated();

    setShowEditModal(false);
    setEditingKas(null);
    showToast('✓ Perubahan transaksi kas berhasil disimpan', 'success');
  };

  const handleDeleteKas = async (id: number) => {
    if (!canEdit) return;
    const item = kasList.find(k => k.id_transaksi === id);
    if (!confirm('Hapus transaksi pembayaran kas ini? Status bulan tersebut akan kembali menjadi Belum Bayar.')) return;

    if (isSupabaseConfigured && item) {
      try {
        await supabase.from('kas_warga').delete().match({
          id_rumah: item.id_rumah,
          periode_bulan: item.periode_bulan
        });
      } catch (err: any) {}
    }

    const updated = kasList.filter(k => k.id_transaksi !== id);

    isSelfUpdatingRef.current = true;
    setKasList(updated);
    localStorage.setItem('local_kas', JSON.stringify(updated));
    emitSafeDataUpdated();
    showToast('❌ Transaksi kas berhasil dihapus', 'cancel');
  };

  // Memoized Filtering
  const filteredWarga = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return wargaList;
    return wargaList.filter(w =>
      (w.nama_lengkap || '').toLowerCase().includes(q) ||
      (w.id_rumah || '').toLowerCase().includes(q)
    );
  }, [wargaList, search]);

  const paginatedWarga = useMemo(() => {
    const start = (pageMatriks - 1) * rowsPerMatriks;
    return filteredWarga.slice(start, start + rowsPerMatriks);
  }, [filteredWarga, pageMatriks, rowsPerMatriks]);

  const totalPagesMatriks = Math.ceil(filteredWarga.length / rowsPerMatriks) || 1;

  const filteredKasTransactions = useMemo(() => {
    const q = search.toLowerCase().trim();
    const yrStr = String(selectedYear);

    return kasList
      .filter(k => {
        const matchYear = String(k.periode_bulan || k.tanggal || k.keterangan || '').includes(yrStr);
        if (!matchYear) return false;
        if (!q) return true;

        const nama = (k.nama_warga || '').toLowerCase();
        const rumah = (k.id_rumah || '').toLowerCase();
        const ket = (k.keterangan || '').toLowerCase();
        return nama.includes(q) || rumah.includes(q) || ket.includes(q);
      })
      .sort((a, b) => (b.tanggal || '').localeCompare(a.tanggal || ''));
  }, [kasList, search, selectedYear]);

  const paginatedTransactions = useMemo(() => {
    const start = (pageTrx - 1) * rowsPerTrx;
    return filteredKasTransactions.slice(start, start + rowsPerTrx);
  }, [filteredKasTransactions, pageTrx, rowsPerTrx]);

  const totalPagesTrx = Math.ceil(filteredKasTransactions.length / rowsPerTrx) || 1;

  return (
    <div className="space-y-5 pb-12">
      {/* Toast Notification */}
      {toastMessage && (
        <div className={`fixed top-20 right-4 z-50 px-4 py-2.5 rounded-2xl shadow-xl text-xs font-bold text-white transition-all flex items-center space-x-2 animate-in slide-in-from-top-3 ${
          toastMessage.type === 'success' ? 'bg-emerald-600' : 'bg-rose-600'
        }`}>
          <span>{toastMessage.text}</span>
        </div>
      )}

      {/* Header Halaman */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <h2 className="text-xl font-black text-slate-800 tracking-tight">Kas Iuran Warga Beryl (Rp 10.000 / Bln)</h2>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 flex items-center space-x-1">
              <Radio className="w-3 h-3 text-emerald-600 animate-pulse" />
              <span>Realtime Cloud HP & Laptop</span>
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            ⚡ <strong>Klik 1x</strong> untuk Masuk Dana (Lunas) • <strong>Klik 2x / Klik Ulang</strong> untuk Batalkan Pembayaran.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {/* TOMBOL PAKSA MASUK KE CLOUD & LOKAL */}
          <button
            onClick={() => setShowForceModal(true)}
            className="flex items-center space-x-1.5 px-3 py-2 bg-gradient-to-r from-amber-600 to-rose-600 hover:from-amber-700 hover:to-rose-700 text-white rounded-xl text-xs font-black shadow-sm transition-all"
            title="Kunci & Masukkan 1.028 Transaksi ke Cloud"
          >
            <Zap className="w-3.5 h-3.5" />
            <span>⚡ Paksa Kunci 1.028 Data Kas ke Cloud</span>
          </button>

          <button
            onClick={() => exportMatriksKasToExcel(filteredWarga, kasList, selectedYear)}
            className="flex items-center space-x-1.5 px-3 py-2 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-xl text-xs font-bold shadow-2xs transition-all"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
            <span>Export Matriks</span>
          </button>
          
          {canEdit && (
            <button
              onClick={() => setShowManualModal(true)}
              className="flex items-center space-x-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-sm transition-all"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Catat Bayar Kas</span>
            </button>
          )}

          <select
            value={selectedYear}
            onChange={(e) => { setSelectedYear(Number(e.target.value)); setPageMatriks(1); }}
            className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold outline-none"
          >
            <option value={2026}>Tahun 2026</option>
            <option value={2025}>Tahun 2025</option>
          </select>
        </div>
      </div>

      {/* Switcher Tampilan & Pencarian */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div className="flex bg-slate-200/60 p-1 rounded-xl space-x-1 text-xs font-bold">
          <button
            onClick={() => setActiveTab('matriks')}
            className={`px-3.5 py-1.5 rounded-lg transition-all ${
              activeTab === 'matriks' ? 'bg-white text-emerald-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            📊 Matriks 12 Bulan ({wargaList.length} KK)
          </button>
          <button
            onClick={() => setActiveTab('transaksi')}
            className={`px-3.5 py-1.5 rounded-lg transition-all flex items-center space-x-1.5 ${
              activeTab === 'transaksi' ? 'bg-white text-emerald-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Receipt className="w-3.5 h-3.5" />
            <span>Daftar Transaksi Kas ({filteredKasTransactions.length})</span>
          </button>
        </div>

        <div className="w-full sm:w-72 relative">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Cari nama warga atau blok unit..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPageMatriks(1); setPageTrx(1); }}
            className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-xs outline-none focus:border-emerald-500 shadow-2xs"
          />
        </div>
      </div>

      {/* TAMPILAN 1: MATRIKS 12 BULAN DENGAN MATCHING UNIT RUMAH (ANTI-GAGAL) */}
      {activeTab === 'matriks' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-100 text-[10px] uppercase font-bold text-slate-600 border-b select-none">
                <tr>
                  <th className="px-3 py-3 text-center border-r w-12 sticky left-0 bg-slate-100 z-10">No.</th>
                  <th className="px-3 py-3 border-r min-w-[70px] sticky left-[48px] bg-slate-100 z-10">Blok</th>
                  <th className="px-3 py-3 border-r min-w-[160px] sticky left-[118px] bg-slate-100 z-10">Nama Warga</th>
                  {NAMA_BULAN.map((m) => (
                    <th key={m} className="px-2 py-3 text-center border-r min-w-[45px]">{m.slice(0, 3)}</th>
                  ))}
                  <th className="px-3 py-3 text-right min-w-[90px]">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {paginatedWarga.length === 0 ? (
                  <tr>
                    <td colSpan={16} className="px-4 py-8 text-center text-slate-400">
                      Tidak ada data warga yang cocok dengan pencarian "{search}".
                    </td>
                  </tr>
                ) : (
                  paginatedWarga.map((w, idx) => {
                    const rowNumber = (pageMatriks - 1) * rowsPerMatriks + idx + 1;
                    let totalPaid = 0;

                    return (
                      <tr key={w.id_warga || idx} className="hover:bg-slate-50 transition-colors">
                        <td className="px-3 py-2 text-center font-mono text-slate-400 border-r sticky left-0 bg-white z-10">{rowNumber}</td>
                        <td className="px-3 py-2 font-bold text-slate-800 border-r sticky left-[48px] bg-white z-10 whitespace-nowrap">{w.id_rumah || '-'}</td>
                        <td className="px-4 py-2 font-bold text-slate-900 border-r sticky left-[118px] bg-white z-10 truncate max-w-[180px]">{w.nama_lengkap}</td>
                        
                        {Array.from({ length: 12 }, (_, i) => i + 1).map((bulan) => {
                          const found = getKasItem(w, bulan);
                          const isSudahLunas = Boolean(found);
                          if (isSudahLunas) totalPaid += Number(found?.nominal || 10000);

                          return (
                            <td
                              key={bulan}
                              onClick={() => handleCellClick(w, bulan)}
                              onContextMenu={(e) => {
                                e.preventDefault();
                                if (found) bukaKuitansi(w, found, bulan);
                              }}
                              className={`px-1 py-1.5 text-center border-r select-none cursor-pointer transition-colors ${
                                isSudahLunas 
                                  ? 'bg-emerald-50 text-emerald-600 hover:bg-rose-100 hover:text-rose-700' 
                                  : 'bg-rose-50/40 text-rose-300 hover:bg-emerald-100 hover:text-emerald-700'
                              }`}
                              title={
                                isSudahLunas 
                                  ? `Lunas ${NAMA_BULAN[bulan - 1]}. Klik untuk BATALKAN. Klik kanan untuk Kuitansi.` 
                                  : `Klik 1x untuk catat LUNAS (${NAMA_BULAN[bulan - 1]}).`
                              }
                            >
                              {isSudahLunas ? (
                                <CheckCircle2 className="w-4 h-4 mx-auto text-emerald-600" />
                              ) : (
                                <span className="text-[10px] font-bold text-rose-400">✕</span>
                              )}
                            </td>
                          );
                        })}
                        <td className="px-3 py-2 text-right font-black text-emerald-700 whitespace-nowrap">{formatRupiah(totalPaid)}</td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Bar Paginasi */}
          <div className="p-3 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-600">
            <div>
              Menampilkan <strong>{(pageMatriks - 1) * rowsPerMatriks + 1}</strong> - <strong>{Math.min(pageMatriks * rowsPerMatriks, filteredWarga.length)}</strong> dari <strong>{filteredWarga.length}</strong> KK Warga
            </div>
            <div className="flex items-center space-x-1.5">
              <button
                disabled={pageMatriks <= 1}
                onClick={() => setPageMatriks(p => Math.max(1, p - 1))}
                className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed"
                title="Halaman Sebelumnya"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="px-2.5 font-bold text-slate-800">
                Hal {pageMatriks} / {totalPagesMatriks}
              </span>
              <button
                disabled={pageMatriks >= totalPagesMatriks}
                onClick={() => setPageMatriks(p => Math.min(totalPagesMatriks, p + 1))}
                className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed"
                title="Halaman Selanjutnya"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TAMPILAN 2: DAFTAR TRANSAKSI KAS */}
      {activeTab === 'transaksi' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 border-b text-[10px] uppercase font-bold text-slate-500 select-none">
                <tr>
                  <th className="px-3 py-3.5 text-center w-12">No.</th>
                  <th className="px-4 py-3.5 min-w-[95px]">Tanggal</th>
                  <th className="px-4 py-3.5 min-w-[110px]">Bulan Periode</th>
                  <th className="px-4 py-3.5 min-w-[160px]">Nama Warga & Unit</th>
                  <th className="px-4 py-3.5 min-w-[180px]">Keterangan</th>
                  <th className="px-4 py-3.5 text-right min-w-[100px]">Nominal</th>
                  <th className="px-4 py-3.5 text-center min-w-[80px]">Status</th>
                  {canEdit && <th className="px-4 py-3.5 text-right min-w-[100px]">Aksi</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {paginatedTransactions.length === 0 ? (
                  <tr>
                    <td colSpan={canEdit ? 8 : 7} className="px-4 py-8 text-center text-slate-400">
                      Belum ada transaksi kas untuk tahun {selectedYear} yang sesuai pencarian.
                    </td>
                  </tr>
                ) : (
                  paginatedTransactions.map((item, idx) => {
                    const rowNumber = (pageTrx - 1) * rowsPerTrx + idx + 1;
                    const nama = item.nama_warga || 'Warga Beryl';
                    const unit = item.id_rumah || '-';

                    return (
                      <tr key={item.id_transaksi || idx} className="hover:bg-slate-50 transition-colors">
                        <td className="px-3 py-2.5 text-center font-mono text-slate-400 text-xs">{rowNumber}</td>
                        <td className="px-4 py-2.5 font-mono text-slate-500">{item.tanggal}</td>
                        <td className="px-4 py-2.5 font-bold text-emerald-800">
                          {item.periode_bulan ? item.periode_bulan.slice(0, 7) : '-'}
                        </td>
                        <td className="px-4 py-2.5">
                          <p className="font-bold text-slate-900 leading-tight">{nama}</p>
                          <span className="text-[10px] text-slate-400 font-mono">Unit: {unit}</span>
                        </td>
                        <td className="px-4 py-2.5 text-slate-700 truncate max-w-[220px]">{item.keterangan}</td>
                        <td className="px-4 py-2.5 text-right font-black font-mono text-emerald-600">
                          +{formatRupiah(item.nominal)}
                        </td>
                        <td className="px-4 py-2.5 text-center">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-700 border border-emerald-200">
                            {item.status_bayar || 'Lunas'}
                          </span>
                        </td>
                        {canEdit && (
                          <td className="px-4 py-2.5 text-right space-x-1 whitespace-nowrap">
                            <button
                              onClick={() => {
                                const kData: KuitansiData = {
                                  noKuitansi: `KAS/BERYL/${item.periode_bulan?.replace(/-/g, '')}/${item.id_transaksi}`,
                                  jenisTransaksi: 'Iuran Kas Warga (Rp 10.000)',
                                  namaWarga: nama,
                                  idRumah: unit,
                                  tanggalBayar: item.tanggal,
                                  nominal: Number(item.nominal || 10000),
                                  periodeAtauKeperluan: item.keterangan || `Iuran Kas`,
                                  namaPenerima: currentUser?.nama_lengkap || 'Bendahara Paguyuban',
                                };
                                setActiveKuitansi(kData);
                              }}
                              className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-lg"
                              title="Kuitansi WhatsApp"
                            >
                              <Receipt className="w-3.5 h-3.5 inline" />
                            </button>
                            <button
                              onClick={() => handleOpenEdit(item)}
                              className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg"
                              title="Edit Transaksi Kas"
                            >
                              <Edit2 className="w-3.5 h-3.5 inline" />
                            </button>
                            <button
                              onClick={() => handleDeleteKas(item.id_transaksi)}
                              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg"
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

          {/* Bar Paginasi Transaksi */}
          <div className="p-3 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-600">
            <div>
              Menampilkan <strong>{(pageTrx - 1) * rowsPerTrx + 1}</strong> - <strong>{Math.min(pageTrx * rowsPerTrx, filteredKasTransactions.length)}</strong> dari <strong>{filteredKasTransactions.length}</strong> Transaksi
            </div>
            <div className="flex items-center space-x-1.5">
              <button
                disabled={pageTrx <= 1}
                onClick={() => setPageTrx(p => Math.max(1, p - 1))}
                className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed"
                title="Sebelumnya"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="px-2.5 font-bold text-slate-800">
                Hal {pageTrx} / {totalPagesTrx}
              </span>
              <button
                disabled={pageTrx >= totalPagesTrx}
                onClick={() => setPageTrx(p => Math.min(totalPagesTrx, p + 1))}
                className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed"
                title="Selanjutnya"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL PAKSA MASUK KE CLOUD & LOKAL */}
      {showForceModal && (
        <div className="fixed inset-0 bg-slate-900/60 flex items-center justify-center p-4 z-50 backdrop-blur-xs">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b pb-3">
              <div className="flex items-center space-x-2">
                <Database className="w-5 h-5 text-amber-600" />
                <h3 className="font-black text-slate-900 text-sm">Paksa Kunci 1.028 Data Kas ke Cloud & HP</h3>
              </div>
              <button onClick={() => setShowForceModal(false)}><X className="w-4 h-4" /></button>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Buka file <strong>new 3.txt</strong>, salin seluruh isinya (Ctrl+A lalu Ctrl+C), kemudian tempelkan di kotak bawah ini. Sistem akan langsung mengunggah dan mengunci seluruh 1.028 transaksi ke database Supabase sehingga <strong>di HP dan Laptop langsung muncul bersamaan detik ini juga!</strong>
            </p>

            <textarea
              rows={8}
              value={rawTextInput}
              onChange={(e) => setRawTextInput(e.target.value)}
              placeholder="Tempelkan seluruh isi file new 3.txt di sini..."
              className="w-full p-3 border rounded-xl font-mono text-[11px] outline-none focus:border-amber-500 bg-slate-50"
            />

            <div className="flex justify-between items-center pt-3 border-t">
              <span className="text-[10px] text-slate-400 font-bold">Terdeteksi: {rawTextInput.split('Unit:').length - 1} baris</span>
              <div className="flex space-x-2">
                <button type="button" onClick={() => setShowForceModal(false)} className="px-4 py-2 border rounded-xl font-bold text-xs">Batal</button>
                <button 
                  type="button" 
                  disabled={isInjecting}
                  onClick={handleForceInject} 
                  className="px-5 py-2 bg-gradient-to-r from-amber-600 to-rose-600 text-white rounded-xl font-bold text-xs shadow-md disabled:opacity-50"
                >
                  {isInjecting ? 'Mengunggah ke Cloud...' : '⚡ Masukkan ke Cloud Sekarang'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL INPUT MANUAL */}
      {showManualModal && canEdit && (
        <div className="fixed inset-0 bg-slate-900/60 flex items-center justify-center p-4 z-50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="font-bold text-slate-800 text-sm">Catat Iuran Kas Warga Baru</h3>
              <button onClick={() => setShowManualModal(false)}><X className="w-4 h-4" /></button>
            </div>
            <form onSubmit={handleManualSubmit} className="space-y-3 text-xs">
              <WargaSearchSelect
                wargaList={wargaList}
                selectedId={formManual.id_warga}
                onSelect={(w) => setFormManual({ ...formManual, id_warga: w ? String(w.id_warga) : '' })}
                label="Cari & Pilih Warga"
                required
              />

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-600 mb-1">Bulan Iuran</label>
                  <select 
                    value={formManual.bulan} 
                    onChange={e => setFormManual({ ...formManual, bulan: Number(e.target.value) })}
                    className="w-full px-3 py-2 border rounded-xl outline-none font-bold"
                  >
                    {NAMA_BULAN.map((m, idx) => <option key={m} value={idx + 1}>{m}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-600 mb-1">Nominal (Rp)</label>
                  <input 
                    required 
                    type="number" 
                    value={formManual.nominal} 
                    onChange={e => setFormManual({ ...formManual, nominal: Number(e.target.value) })} 
                    className="w-full px-3 py-2 border rounded-xl font-bold text-emerald-600"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-600 mb-1">Tanggal Bayar</label>
                <input 
                  required 
                  type="date" 
                  value={formManual.tanggal} 
                  onChange={e => setFormManual({ ...formManual, tanggal: e.target.value })} 
                  className="w-full px-3 py-2 border rounded-xl"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-600 mb-1">Link Bukti Transfer</label>
                <input 
                  type="text" 
                  placeholder="https://drive.google.com/..." 
                  value={formManual.bukti_transfer} 
                  onChange={e => setFormManual({ ...formManual, bukti_transfer: e.target.value })} 
                  className="w-full px-3 py-2 border rounded-xl"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-3 border-t">
                <button type="button" onClick={() => setShowManualModal(false)} className="px-4 py-2 border rounded-xl font-bold">Batal</button>
                <button type="submit" className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold">Simpan & Buat Kuitansi</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL EDIT TRANSAKSI */}
      {showEditModal && editingKas && canEdit && (
        <div className="fixed inset-0 bg-slate-900/60 flex items-center justify-center p-4 z-50 backdrop-blur-xs">
          <div className="bg-white rounded-3xl shadow-xl w-full max-w-md p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b pb-3">
              <div className="flex items-center space-x-2">
                <Edit2 className="w-4 h-4 text-blue-600" />
                <h3 className="font-bold text-slate-900 text-sm">Edit Data Transaksi Kas</h3>
              </div>
              <button onClick={() => setShowEditModal(false)}><X className="w-4 h-4" /></button>
            </div>

            <form onSubmit={handleEditSubmit} className="space-y-3.5 text-xs">
              <div className="p-3 bg-slate-50 rounded-xl border">
                <p className="text-slate-400 text-[10px] font-bold uppercase">Warga Pembayar:</p>
                <p className="text-sm font-black text-slate-900">
                  {editingKas.nama_warga} ({editingKas.id_rumah})
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-600 mb-1">Bulan Periode</label>
                  <select 
                    value={formEdit.bulan} 
                    onChange={e => setFormEdit({ ...formEdit, bulan: Number(e.target.value) })}
                    className="w-full px-3 py-2 border rounded-xl font-bold outline-none bg-white"
                  >
                    {NAMA_BULAN.map((m, idx) => <option key={m} value={idx + 1}>{m}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-600 mb-1">Tahun</label>
                  <select 
                    value={formEdit.tahun} 
                    onChange={e => setFormEdit({ ...formEdit, tahun: Number(e.target.value) })}
                    className="w-full px-3 py-2 border rounded-xl font-bold outline-none bg-white"
                  >
                    <option value={2026}>2026</option>
                    <option value={2025}>2025</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-600 mb-1">Tanggal Bayar</label>
                  <input 
                    required 
                    type="date" 
                    value={formEdit.tanggal} 
                    onChange={e => setFormEdit({ ...formEdit, tanggal: e.target.value })} 
                    className="w-full px-3 py-2 border rounded-xl"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-600 mb-1">Nominal (Rp)</label>
                  <input 
                    required 
                    type="number" 
                    value={formEdit.nominal} 
                    onChange={e => setFormEdit({ ...formEdit, nominal: Number(e.target.value) })} 
                    className="w-full px-3 py-2 border rounded-xl font-black text-blue-700"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-600 mb-1">Keterangan Transaksi</label>
                <input 
                  type="text" 
                  value={formEdit.keterangan} 
                  onChange={e => setFormEdit({ ...formEdit, keterangan: e.target.value })} 
                  className="w-full px-3 py-2 border rounded-xl"
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

      {/* Modal Kuitansi & Gambar */}
      <KuitansiModal data={activeKuitansi} onClose={() => setActiveKuitansi(null)} />
      <ImageViewerModal url={previewUrl} onClose={() => setPreviewUrl(null)} />
    </div>
  );
};

export default InfaqBulananPage;