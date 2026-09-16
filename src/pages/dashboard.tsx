// src/pages/dashboard.tsx
import React, { useEffect, useState, useMemo } from 'react';
import { supabase, isSupabaseConfigured } from '../supabase';
import { formatRupiah, Warga, KasWargaBeryl, InfaqMajelis, Pengeluaran, PinjamanWarga, DanaAcara, NAMA_BULAN } from '../types';
import { 
  HeartHandshake, Landmark, ArrowDownCircle, 
  Scale, HandCoins, Sparkles, TrendingUp, Calendar, 
  FileSpreadsheet, Users, BarChart3, AlertTriangle, 
  CheckCircle2, Home, UserCheck, Clock,
  Coins, Building2, Wallet, Minus, Equal,
  UserX, ShieldCheck
} from 'lucide-react';
import { exportMasterBackupExcel } from '../utils/exportManager';

const cleanKey = (str: any): string => {
  if (!str) return '';
  return String(str).toLowerCase().trim().replace(/[^a-z0-9]/g, '');
};

export const Dashboard: React.FC = () => {
  const [wargaList, setWargaList] = useState<Warga[]>([]);
  const [kasList, setKasList] = useState<KasWargaBeryl[]>([]);
  const [majelisList, setMajelisList] = useState<InfaqMajelis[]>([]);
  const [danaAcaraList, setDanaAcaraList] = useState<DanaAcara[]>([]);
  const [pengeluaranList, setPengeluaranList] = useState<Pengeluaran[]>([]);
  const [pinjamanList, setPinjamanList] = useState<PinjamanWarga[]>([]);
  const [selectedYear, setSelectedYear] = useState<number>(2026);
  const [loading, setLoading] = useState(true);

  // =========================================================================
  // LOAD DATA DENGAN LIMIT 5.000 & SINKRONISASI CACHE LOKAL LENGKAP
  // =========================================================================
  const loadData = async () => {
    setLoading(true);
    let loadedW: Warga[] = [];
    let loadedK: KasWargaBeryl[] = [];
    let loadedM: InfaqMajelis[] = [];
    let loadedA: DanaAcara[] = [];
    let loadedP: Pengeluaran[] = [];
    let loadedQ: PinjamanWarga[] = [];

    // 1. Ambil Cache Lokal Terlebih Dahulu (Anti-Kosong)
    try {
      const localW = localStorage.getItem('local_warga');
      if (localW) loadedW = JSON.parse(localW);

      const localK = localStorage.getItem('local_kas');
      if (localK) loadedK = JSON.parse(localK);

      const localM = localStorage.getItem('local_majelis');
      if (localM) loadedM = JSON.parse(localM);

      const localA = localStorage.getItem('local_dana_acara');
      if (localA) loadedA = JSON.parse(localA);

      const localP = localStorage.getItem('local_pengeluaran');
      if (localP) loadedP = JSON.parse(localP);

      const localQ = localStorage.getItem('local_pinjaman');
      if (localQ) loadedQ = JSON.parse(localQ);
    } catch (e) {}

    // 2. Kueri Supabase Cloud (Menggunakan limit 5.000 agar tidak terpotong)
    if (isSupabaseConfigured) {
      try {
        const [resWarga, resKas, resMajelis, resAcara, resPengeluaran, resPinjaman] = await Promise.all([
          supabase.from('warga').select('*').limit(2000),
          supabase.from('kas_warga').select('*').limit(5000),
          supabase.from('infaq_majelis').select('*').limit(2000),
          supabase.from('dana_acara').select('*').limit(2000),
          supabase.from('pengeluaran').select('*').limit(2000),
          supabase.from('pinjaman_warga').select('*').limit(2000),
        ]);

        if (resWarga.data && resWarga.data.length > 0) loadedW = resWarga.data;
        
        if (resKas.data && resKas.data.length > 0) {
          loadedK = resKas.data;
        } else {
          // Coba view alias jika tabel utama kosong
          const resKasAlias = await supabase.from('kas_warga_beryl').select('*').limit(5000);
          if (resKasAlias.data && resKasAlias.data.length > 0) loadedK = resKasAlias.data;
        }

        if (resMajelis.data && resMajelis.data.length > 0) loadedM = resMajelis.data;
        if (resAcara.data && resAcara.data.length > 0) loadedA = resAcara.data;
        if (resPengeluaran.data && resPengeluaran.data.length > 0) loadedP = resPengeluaran.data;
        if (resPinjaman.data && resPinjaman.data.length > 0) loadedQ = resPinjaman.data;
      } catch (err) {
        console.warn('Dashboard menggunakan cache lokal terproteksi:', err);
      }
    }

    setWargaList(loadedW);
    setKasList(loadedK);
    setMajelisList(loadedM);
    setDanaAcaraList(loadedA);
    setPengeluaranList(loadedP);
    setPinjamanList(loadedQ);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
    const handleUpdate = () => loadData();
    window.addEventListener('app_data_updated', handleUpdate);
    return () => window.removeEventListener('app_data_updated', handleUpdate);
  }, []);

  // =========================================================================
  // KALKULASI STATISTIK MATEMATIS AKURAT (PRESISI 100%)
  // =========================================================================
  const stats = useMemo(() => {
    const totalWarga = wargaList.length || 0;

    // 1. Demografi Status Warga
    const countMenetap = wargaList.filter(w => (w.status_warga || '').toLowerCase().includes('menetap')).length;
    const countKunjungan = wargaList.filter(w => (w.status_warga || '').toLowerCase().includes('kunjung')).length;
    const countSewa = wargaList.filter(w => (w.status_warga || '').toLowerCase().includes('sewa') || (w.status_warga || '').toLowerCase().includes('kontrak')).length;
    const countKosong = wargaList.filter(w => (w.status_warga || '').toLowerCase().includes('kosong')).length;

    const pctMenetap = totalWarga > 0 ? Math.round((countMenetap / totalWarga) * 100) : 0;
    const pctKunjungan = totalWarga > 0 ? Math.round((countKunjungan / totalWarga) * 100) : 0;
    const pctSewa = totalWarga > 0 ? Math.round((countSewa / totalWarga) * 100) : 0;
    const pctKosong = totalWarga > 0 ? Math.round((countKosong / totalWarga) * 100) : 0;

    // Unit berpenghuni yang wajib kas (tidak kosong)
    const wargaWajibKas = wargaList.filter(w => !(w.status_warga || '').toLowerCase().includes('kosong')).length || (totalWarga > 0 ? totalWarga : 1);

    // 2. Realisasi Kas Tahun Buku Aktif (Filter Akurat Tahun)
    const yrStr = String(selectedYear);
    const kasTahunIni = kasList.filter(k => {
      const pBulan = k.periode_bulan || k.tanggal || '';
      const ket = k.keterangan || '';
      const isLunas = !k.status_bayar || k.status_bayar.toLowerCase() === 'lunas' || k.status_bayar.toLowerCase() === 'verified';
      return (pBulan.includes(yrStr) || ket.includes(yrStr)) && isLunas;
    });

    const kasTahunIniAktual = kasTahunIni.reduce((sum, k) => sum + Number(k.nominal || 10000), 0);
    const totalInfaqWargaAktual = kasList.reduce((acc, k) => acc + Number(k.nominal || 10000), 0);

    // 3. Pos Lainnya
    const totalInfaqMajelisAktual = majelisList.filter(m => m.jenis_dana === 'Pemasukan').reduce((acc, m) => acc + Number(m.nominal || 0), 0);
    const totalDanaAcaraMasukAktual = danaAcaraList.filter(a => a.kategori === 'Pemasukan').reduce((acc, a) => acc + Number(a.nominal || 0), 0);
    const totalPemasukanSemuaAktual = totalInfaqWargaAktual + totalInfaqMajelisAktual + totalDanaAcaraMasukAktual;

    const totalPengeluaranUmum = pengeluaranList.reduce((acc, p) => acc + Number(p.nominal || 0), 0);
    const totalPengeluaranAcara = danaAcaraList.filter(a => a.kategori === 'Pengeluaran').reduce((acc, a) => acc + Number(a.nominal || 0), 0);
    const totalPengeluaranSemua = totalPengeluaranUmum + totalPengeluaranAcara;

    const totalPinjamanAktif = pinjamanList.filter(p => p.status_pinjaman === 'Berjalan').reduce((acc, p) => acc + Number(p.sisa_pinjaman || 0), 0);

    // 4. Target & Tunggakan Berdasarkan Jumlah Warga Riil
    const targetKasWargaSetahunLancar = wargaWajibKas * 12 * 10000;
    const totalDanaTertunggak = Math.max(0, targetKasWargaSetahunLancar - kasTahunIniAktual);
    const persentaseTerkumpul = targetKasWargaSetahunLancar > 0 ? Math.min(100, Math.round((kasTahunIniAktual / targetKasWargaSetahunLancar) * 100)) : 0;
    const persentaseTunggakan = 100 - persentaseTerkumpul;

    // Sisa Kas Teoretis vs Saldo Kas Riil
    const totalPemasukanSeharusnya = targetKasWargaSetahunLancar + totalInfaqMajelisAktual + totalDanaAcaraMasukAktual;
    const sisaKasSeharusnya = totalPemasukanSeharusnya - totalPengeluaranSemua - totalPinjamanAktif;
    const saldoKasRiilAktual = totalPemasukanSemuaAktual - totalPengeluaranSemua - totalPinjamanAktif;

    // 5. Rincian 12 Bulan (Pencocokan Presisi Menggunakan Identitas Rumah/Warga)
    const monthlyBreakdown = NAMA_BULAN.map((bulanName, idx) => {
      const monthNum = idx + 1;
      const monthCode = String(monthNum).padStart(2, '0');
      const prefix = `${selectedYear}-${monthCode}`;
      const mNameLow = bulanName.toLowerCase();

      const kasBulan = kasTahunIni.filter(k => {
        const pBulan = k.periode_bulan || k.tanggal || '';
        const ket = (k.keterangan || '').toLowerCase();
        return pBulan.startsWith(prefix) || (ket.includes(mNameLow) && ket.includes(yrStr));
      });

      const totalMasuk = kasBulan.reduce((sum, k) => sum + Number(k.nominal || 10000), 0);

      // Hitung Warga Unik Menggunakan Kunci Rumah / Nama (Mencegah Bug ID Kosong)
      const uniquePayers = new Set<string>();
      kasBulan.forEach(k => {
        const pKey = cleanKey(k.id_rumah) || cleanKey(k.nama_warga) || (k.id_warga ? `id_${k.id_warga}` : '');
        if (pKey) uniquePayers.add(pKey);
      });

      // Jumlah warga bayar adalah jumlah pembayar unik atau hasil bagi nominal / 10.000
      const wargaBayarCount = Math.max(uniquePayers.size, Math.round(totalMasuk / 10000));
      const targetNominal = wargaWajibKas * 10000;
      const nominalTertunggakBulan = Math.max(0, targetNominal - totalMasuk);
      const capaianPct = targetNominal > 0 ? Math.min(100, Math.round((totalMasuk / targetNominal) * 100)) : 0;

      return {
        bulan: bulanName,
        bulanSingkat: bulanName.slice(0, 3),
        totalMasuk,
        targetNominal,
        nominalTertunggakBulan,
        wargaBayarCount,
        capaianPct,
        belumBayarCount: Math.max(0, wargaWajibKas - wargaBayarCount)
      };
    });

    // 6. Rata-Rata Kepatuhan Bulanan Akurat
    const totalWargaBayarSemuaBulan = monthlyBreakdown.reduce((sum, m) => sum + m.wargaBayarCount, 0);
    const rataRataWargaBayarPerBulan = Math.round(totalWargaBayarSemuaBulan / 12);
    const rataRataPersentaseKepatuhan = wargaWajibKas > 0 ? Math.min(100, Math.round((rataRataWargaBayarPerBulan / wargaWajibKas) * 100)) : 0;
    const rataRataWargaMenunggakPerBulan = Math.max(0, wargaWajibKas - rataRataWargaBayarPerBulan);

    // Bulan Berjalan Saat Ini
    const currentMonthIndex = new Date().getMonth();
    const currentMonthStats = monthlyBreakdown[currentMonthIndex] || monthlyBreakdown[0];

    return {
      totalWarga,
      wargaWajibKas,
      countMenetap,
      countKunjungan,
      countSewa,
      countKosong,
      pctMenetap,
      pctKunjungan,
      pctSewa,
      pctKosong,
      totalInfaqWargaAktual,
      totalInfaqMajelisAktual,
      totalDanaAcaraMasukAktual,
      totalPemasukanSemuaAktual,
      totalPengeluaranSemua,
      totalPinjamanAktif,
      targetKasWargaSetahunLancar,
      kasTahunIniAktual,
      totalDanaTertunggak,
      persentaseTunggakan,
      persentaseTerkumpul,
      totalPemasukanSeharusnya,
      sisaKasSeharusnya,
      saldoKasRiilAktual,
      currentMonthStats,
      monthlyBreakdown,
      rataRataWargaBayarPerBulan,
      rataRataPersentaseKepatuhan,
      rataRataWargaMenunggakPerBulan
    };
  }, [wargaList, kasList, majelisList, danaAcaraList, pengeluaranList, pinjamanList, selectedYear]);

  return (
    <div className="space-y-6 pb-12">
      {/* Banner Header Dashboard */}
      <div className="bg-gradient-to-r from-emerald-900 via-emerald-800 to-teal-900 rounded-3xl p-6 md:p-8 text-white shadow-xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="inline-flex items-center space-x-2 px-3 py-1 bg-white/20 backdrop-blur-md rounded-full text-xs font-bold uppercase tracking-wider text-emerald-100 mb-2">
            <Sparkles className="w-3.5 h-3.5 text-emerald-300" />
            <span>Sistem Informasi Tata Kelola & Keuangan Terpadu</span>
          </div>
          <h2 className="text-2xl md:text-3xl font-black tracking-tight">Warga Beryl & Majelis Al Barokah</h2>
          <p className="text-xs md:text-sm text-emerald-100 mt-1 max-w-2xl">
            Transparansi Real-Time Kas Iuran Warga (Rp 10.000), Dana Acara Paguyuban, Infaq Majelis, dan Pinjaman Qardhul Hasan.
          </p>
        </div>
        <button
          onClick={() => exportMasterBackupExcel(wargaList, kasList, danaAcaraList, majelisList, pengeluaranList, pinjamanList)}
          className="flex items-center space-x-2 px-4 py-2.5 bg-white text-emerald-950 hover:bg-emerald-50 rounded-xl text-xs font-black shadow-md transition-all shrink-0"
        >
          <FileSpreadsheet className="w-4 h-4 text-emerald-700" />
          <span>Export Master Excel</span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* BAGIAN 1: STATUS HUNIAN DATA WARGA                                        */}
      {/* ========================================================================= */}
      <div className="bg-white rounded-3xl border border-slate-200 p-5 md:p-6 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border-b border-slate-100 pb-3">
          <div className="flex items-center space-x-2.5">
            <div className="w-9 h-9 bg-emerald-100 text-emerald-700 rounded-xl flex items-center justify-center">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-slate-900">Infografis Data Hunian Warga Beryl</h3>
              <p className="text-xs text-slate-500">Distribusi status kependudukan seluruh Kepala Keluarga yang terdaftar.</p>
            </div>
          </div>
          <span className="px-3 py-1 bg-slate-100 text-slate-700 font-mono font-bold text-xs rounded-full border border-slate-200">
            Total Terdata: {stats.totalWarga} KK
          </span>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="bg-emerald-50/70 border border-emerald-200 rounded-2xl p-4 space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider">Warga Menetap</span>
              <Home className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="flex items-baseline space-x-2">
              <p className="text-2xl font-black text-emerald-950">{stats.countMenetap}</p>
              <span className="text-xs font-bold text-emerald-700">KK ({stats.pctMenetap}%)</span>
            </div>
            <p className="text-[10px] text-emerald-700 font-medium">Pemilik unit berdomisili tetap</p>
          </div>

          <div className="bg-purple-50/70 border border-purple-200 rounded-2xl p-4 space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-purple-800 uppercase tracking-wider">Warga Kunjungan</span>
              <Clock className="w-4 h-4 text-purple-600" />
            </div>
            <div className="flex items-baseline space-x-2">
              <p className="text-2xl font-black text-purple-950">{stats.countKunjungan}</p>
              <span className="text-xs font-bold text-purple-700">KK ({stats.pctKunjungan}%)</span>
            </div>
            <p className="text-[10px] text-purple-700 font-medium">Hunian berkala / musiman</p>
          </div>

          <div className="bg-blue-50/70 border border-blue-200 rounded-2xl p-4 space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-blue-800 uppercase tracking-wider">Warga Penyewa</span>
              <UserCheck className="w-4 h-4 text-blue-600" />
            </div>
            <div className="flex items-baseline space-x-2">
              <p className="text-2xl font-black text-blue-950">{stats.countSewa}</p>
              <span className="text-xs font-bold text-blue-700">KK ({stats.pctSewa}%)</span>
            </div>
            <p className="text-[10px] text-blue-700 font-medium">Warga sewa / kontrak unit</p>
          </div>

          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">Unit Kosong</span>
              <Building2 className="w-4 h-4 text-slate-400" />
            </div>
            <div className="flex items-baseline space-x-2">
              <p className="text-2xl font-black text-slate-800">{stats.countKosong}</p>
              <span className="text-xs font-bold text-slate-500">Unit ({stats.pctKosong}%)</span>
            </div>
            <p className="text-[10px] text-slate-400 font-medium">Belum berpenghuni</p>
          </div>
        </div>

        <div className="space-y-1.5 pt-1">
          <div className="flex justify-between text-[11px] font-bold text-slate-600">
            <span>Rasio Distribusi Hunian</span>
            <span>{stats.wargaWajibKas} KK Wajib Iuran Lingkungan</span>
          </div>
          <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden flex shadow-inner">
            <div style={{ width: `${stats.pctMenetap}%` }} className="bg-emerald-500 h-full transition-all duration-500" />
            <div style={{ width: `${stats.pctKunjungan}%` }} className="bg-purple-500 h-full transition-all duration-500" />
            <div style={{ width: `${stats.pctSewa}%` }} className="bg-blue-500 h-full transition-all duration-500" />
            <div style={{ width: `${stats.pctKosong}%` }} className="bg-slate-300 h-full transition-all duration-500" />
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* BAGIAN 2: REKONSILIASI KAS & RATA-RATA KEPATUHAN PRESISI                   */}
      {/* ========================================================================= */}
      <div className="bg-white rounded-3xl border-2 border-emerald-500/30 p-6 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b pb-4">
          <div>
            <div className="flex items-center space-x-2">
              <Scale className="w-5 h-5 text-emerald-700" />
              <h3 className="font-black text-base text-slate-900 tracking-tight">
                Rekonsiliasi Kas: Potensi Teoretis vs Dampak Tunggakan vs Saldo Kas Riil
              </h3>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Perbandingan transparansi antara uang yang <em>seharusnya terkumpul jika lancar 100%</em> dengan <em>sisa kas riil aktual</em>.
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-xs font-bold text-slate-500">Tahun Buku:</span>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
              className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 outline-none"
            >
              <option value={2026}>Tahun 2026</option>
              <option value={2025}>Tahun 2025</option>
            </select>
          </div>
        </div>

        {/* 4 Pilar Analisis Komparasi Keuangan */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider">1. Kas Iuran Seharusnya</span>
              <Coins className="w-4 h-4 text-blue-600" />
            </div>
            <p className="text-xl font-black text-slate-900">{formatRupiah(stats.targetKasWargaSetahunLancar)}</p>
            <p className="text-[11px] text-slate-500 leading-tight">
              Jika <strong className="text-slate-700">{stats.wargaWajibKas} KK</strong> lancar membayar Rp 10.000 selama 12 bulan penuh.
            </p>
          </div>

          <div className="bg-rose-50 border border-rose-200 rounded-2xl p-4 space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black text-rose-700 uppercase tracking-wider">2. Dana Tertunggak</span>
              <AlertTriangle className="w-4 h-4 text-rose-600" />
            </div>
            <p className="text-xl font-black text-rose-600">-{formatRupiah(stats.totalDanaTertunggak)}</p>
            <p className="text-[11px] text-rose-700 leading-tight">
              Belum terbayar (<strong className="font-bold">{stats.persentaseTunggakan}%</strong> tunggakan dari target tahun {selectedYear}).
            </p>
          </div>

          <div className="bg-indigo-50/70 border border-indigo-200 rounded-2xl p-4 space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black text-indigo-700 uppercase tracking-wider">3. Sisa Kas Seharusnya</span>
              <TrendingUp className="w-4 h-4 text-indigo-600" />
            </div>
            <p className="text-xl font-black text-indigo-950">{formatRupiah(stats.sisaKasSeharusnya)}</p>
            <p className="text-[11px] text-indigo-700 leading-tight">
              Saldo sisa setelah dikurangi seluruh beban operasional (jika kas 100% lancar).
            </p>
          </div>

          <div className="bg-gradient-to-br from-emerald-600 to-teal-700 text-white rounded-2xl p-4 space-y-1.5 shadow-md">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black text-emerald-100 uppercase tracking-wider">4. Sisa Kas RIIL Aktual</span>
              <CheckCircle2 className="w-4 h-4 text-emerald-200" />
            </div>
            <p className="text-xl font-black text-white">{formatRupiah(stats.saldoKasRiilAktual)}</p>
            <p className="text-[11px] text-emerald-100 leading-tight">
              Uang kas nyata di tangan bendahara setelah dipotong tunggakan warga.
            </p>
          </div>
        </div>

        {/* Peta Alur Arus Kas */}
        <div className="bg-slate-50/80 border border-slate-200 rounded-2xl p-4 md:p-5 space-y-3">
          <div className="flex items-center space-x-2 font-bold text-xs text-slate-800">
            <Wallet className="w-4 h-4 text-emerald-600" />
            <span>Bagan Alur Perjalanan Uang Kas Lingkungan:</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-5 gap-2.5 items-center text-center text-xs">
            <div className="bg-white p-3 rounded-xl border border-slate-200 space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase">Target Masuk</span>
              <p className="font-black text-slate-800">{formatRupiah(stats.targetKasWargaSetahunLancar)}</p>
              <span className="text-[9px] text-slate-500">100% Iuran Wajib</span>
            </div>

            <div className="hidden sm:flex justify-center text-rose-500 font-black">
              <Minus className="w-5 h-5" />
            </div>

            <div className="bg-rose-50 p-3 rounded-xl border border-rose-200 space-y-1">
              <span className="text-[10px] font-bold text-rose-600 uppercase">Tunggakan</span>
              <p className="font-black text-rose-600">-{formatRupiah(stats.totalDanaTertunggak)}</p>
              <span className="text-[9px] text-rose-500">Belum Disetor</span>
            </div>

            <div className="hidden sm:flex justify-center text-slate-400 font-black">
              <Minus className="w-5 h-5" />
            </div>

            <div className="bg-slate-100 p-3 rounded-xl border border-slate-300 space-y-1">
              <span className="text-[10px] font-bold text-slate-600 uppercase">Pengeluaran & Pinjaman</span>
              <p className="font-black text-slate-700">-{formatRupiah(stats.totalPengeluaranSemua + stats.totalPinjamanAktif)}</p>
              <span className="text-[9px] text-slate-500">Beban Ops, Acara, Qardh</span>
            </div>
          </div>

          <div className="bg-emerald-600 text-white p-3.5 rounded-xl flex flex-col sm:flex-row justify-between items-center gap-2">
            <div className="flex items-center space-x-2">
              <Equal className="w-5 h-5 text-emerald-200 hidden sm:inline" />
              <span className="text-xs font-bold">Hasil Akhir Saldo Kas Riil Tersedia di Kasir / Rekening:</span>
            </div>
            <span className="text-lg font-black tracking-tight">{formatRupiah(stats.saldoKasRiilAktual)}</span>
          </div>
        </div>

        {/* STATISTIK RATA-RATA KEPATUHAN WARGA AKURAT */}
        <div className="bg-gradient-to-r from-teal-50 via-emerald-50 to-indigo-50 border border-emerald-200 rounded-2xl p-4 md:p-5 space-y-3">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
            <div className="flex items-center space-x-2">
              <BarChart3 className="w-4 h-4 text-emerald-700" />
              <h4 className="font-black text-xs md:text-sm text-slate-900 uppercase tracking-wide">
                Statistik Rata-Rata Kepatuhan Warga Menunaikan Iuran Kas ({selectedYear})
              </h4>
            </div>
            <span className="text-xs font-bold text-emerald-800 bg-white px-3 py-1 rounded-full border border-emerald-200 shadow-2xs">
              Rata-rata: {stats.rataRataWargaBayarPerBulan} KK ({stats.rataRataPersentaseKepatuhan}%) per Bulan
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            <div className="bg-white/90 p-3 rounded-xl border border-emerald-200 flex items-center space-x-3">
              <div className="w-9 h-9 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-sm shrink-0">
                <UserCheck className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[10px] text-slate-500 font-bold uppercase">Rata-Rata Tertib / Bulan</p>
                <p className="text-base font-black text-emerald-700">{stats.rataRataWargaBayarPerBulan} KK Lunas</p>
                <p className="text-[10px] text-slate-400">Dari total {stats.wargaWajibKas} KK wajib iuran</p>
              </div>
            </div>

            <div className="bg-white/90 p-3 rounded-xl border border-rose-200 flex items-center space-x-3">
              <div className="w-9 h-9 rounded-lg bg-rose-100 text-rose-700 flex items-center justify-center font-bold text-sm shrink-0">
                <UserX className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[10px] text-slate-500 font-bold uppercase">Rata-Rata Menunggak / Bulan</p>
                <p className="text-base font-black text-rose-600">{stats.rataRataWargaMenunggakPerBulan} KK Menunggak</p>
                <p className="text-[10px] text-slate-400">{100 - stats.rataRataPersentaseKepatuhan}% dari target bulanan</p>
              </div>
            </div>

            <div className="bg-white/90 p-3 rounded-xl border border-indigo-200 flex items-center space-x-3">
              <div className="w-9 h-9 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-sm shrink-0">
                <TrendingUp className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[10px] text-slate-500 font-bold uppercase">Kolektibilitas Kas {selectedYear}</p>
                <p className="text-base font-black text-indigo-900">{stats.persentaseTerkumpul}% Terkumpul</p>
                <p className="text-[10px] text-slate-400">{formatRupiah(stats.kasTahunIniAktual)} lunas</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* BAGIAN 3: 5 KARTU RINGKASAN POS DANA                                      */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-emerald-600 uppercase">Kas Warga Terkumpul</span>
            <HeartHandshake className="w-4 h-4 text-emerald-500" />
          </div>
          <p className="text-base md:text-lg font-black text-slate-900 mt-2">{formatRupiah(stats.totalInfaqWargaAktual)}</p>
          <span className="text-[10px] text-slate-400">Realisasi Masuk Rp 10rb</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-purple-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-purple-600 uppercase">Dana Acara</span>
            <Calendar className="w-4 h-4 text-purple-500" />
          </div>
          <p className="text-base md:text-lg font-black text-purple-700 mt-2">{formatRupiah(stats.totalDanaAcaraMasukAktual)}</p>
          <span className="text-[10px] text-slate-400">Donasi & Sponsor Acara</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-teal-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-teal-600 uppercase">Infaq Majelis</span>
            <Landmark className="w-4 h-4 text-teal-500" />
          </div>
          <p className="text-base md:text-lg font-black text-teal-700 mt-2">{formatRupiah(stats.totalInfaqMajelisAktual)}</p>
          <span className="text-[10px] text-slate-400">Majelis Al Barokah</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-rose-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-rose-600 uppercase">Total Pengeluaran</span>
            <ArrowDownCircle className="w-4 h-4 text-rose-500" />
          </div>
          <p className="text-base md:text-lg font-black text-rose-600 mt-2">-{formatRupiah(stats.totalPengeluaranSemua)}</p>
          <span className="text-[10px] text-slate-400">Operasional, Sosial, Acara</span>
        </div>

        <div className="col-span-2 lg:col-span-1 bg-gradient-to-br from-emerald-600 to-teal-700 p-4 rounded-2xl text-white shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-100">Saldo Kas Riil</span>
            <Scale className="w-4 h-4 text-emerald-200" />
          </div>
          <p className="text-lg md:text-xl font-black mt-2">{formatRupiah(stats.saldoKasRiilAktual)}</p>
          <span className="text-[10px] text-emerald-200">Likuiditas Kas Bersih</span>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* BAGIAN 4: RINCIAN MASUKAN KAS & TUNGGAKAN 12 BULAN LENGKAP               */}
      {/* ========================================================================= */}
      <div className="bg-white rounded-3xl border border-slate-200 p-5 md:p-6 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b pb-4">
          <div className="flex items-center space-x-2.5">
            <div className="w-9 h-9 bg-emerald-100 text-emerald-700 rounded-xl flex items-center justify-center">
              <BarChart3 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-slate-900">Rincian Masukan Kas & Tunggakan Iuran Per Bulan ({selectedYear})</h3>
              <p className="text-xs text-slate-500">Perbandingan perolehan kas lunas vs tunggakan berdasarkan jumlah {stats.wargaWajibKas} KK warga wajib.</p>
            </div>
          </div>
          <div className="text-right">
            <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
              Total Terkumpul: {formatRupiah(stats.kasTahunIniAktual)} ({stats.persentaseTerkumpul}%)
            </span>
          </div>
        </div>

        {/* Grid 12 Bulan Akurat */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {stats.monthlyBreakdown.map((m) => (
            <div key={m.bulan} className="bg-slate-50 border border-slate-200 rounded-2xl p-3.5 space-y-2 hover:border-emerald-300 transition-colors">
              <div className="flex justify-between items-center">
                <span className="font-black text-xs text-slate-800">{m.bulanSingkat}</span>
                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                  m.capaianPct >= 60 ? 'bg-emerald-100 text-emerald-700' :
                  m.capaianPct >= 30 ? 'bg-amber-100 text-amber-700' : 'bg-rose-100 text-rose-700'
                }`}>
                  {m.capaianPct}%
                </span>
              </div>

              <div>
                <p className="font-black text-sm text-emerald-600 leading-tight">{formatRupiah(m.totalMasuk)}</p>
                {m.nominalTertunggakBulan > 0 && (
                  <p className="text-[9px] font-bold text-rose-500 leading-tight mt-0.5">
                    Tunggakan: -{formatRupiah(m.nominalTertunggakBulan)}
                  </p>
                )}
              </div>

              <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
                <div className="h-full bg-emerald-500 rounded-full transition-all duration-300" style={{ width: `${m.capaianPct}%` }} />
              </div>

              <div className="flex justify-between text-[10px] text-slate-400 pt-0.5">
                <span className="font-semibold text-emerald-700">{m.wargaBayarCount} Lunas</span>
                <span className="text-rose-500 font-semibold">{m.belumBayarCount} Blm</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;