// src/pages/dashboard.tsx
import React, { useEffect, useState, useMemo } from 'react';
import { supabase, isSupabaseConfigured } from '../supabase';
import { formatRupiah, Warga, KasWargaBeryl, InfaqMajelis, Pengeluaran, PinjamanWarga, DanaAcara, NAMA_BULAN } from '../types';
import { 
  HeartHandshake, Landmark, ArrowDownCircle, 
  Scale, HandCoins, Sparkles, TrendingUp, Calendar, 
  FileSpreadsheet, Users, BarChart3, AlertTriangle, 
  CheckCircle2, Home, UserCheck, Clock,
  Coins, Building2, Wallet, ArrowRight, Minus, Plus, Equal,
  ShieldAlert, UserX
} from 'lucide-react';
import { exportMasterBackupExcel } from '../utils/exportManager';

export const Dashboard: React.FC = () => {
  const [wargaList, setWargaList] = useState<Warga[]>([]);
  const [kasList, setKasList] = useState<KasWargaBeryl[]>([]);
  const [majelisList, setMajelisList] = useState<InfaqMajelis[]>([]);
  const [danaAcaraList, setDanaAcaraList] = useState<DanaAcara[]>([]);
  const [pengeluaranList, setPengeluaranList] = useState<Pengeluaran[]>([]);
  const [pinjamanList, setPinjamanList] = useState<PinjamanWarga[]>([]);
  const [selectedYear, setSelectedYear] = useState<number>(2026);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    setLoading(true);
    let loadedW: Warga[] = [];
    let loadedK: KasWargaBeryl[] = [];
    let loadedM: InfaqMajelis[] = [];
    let loadedA: DanaAcara[] = [];
    let loadedP: Pengeluaran[] = [];
    let loadedQ: PinjamanWarga[] = [];

    if (isSupabaseConfigured) {
      try {
        const [resWarga, resKas, resMajelis, resAcara, resPengeluaran, resPinjaman] = await Promise.all([
          supabase.from('warga').select('*'),
          supabase.from('kas_warga_beryl').select('*'),
          supabase.from('infaq_majelis_albarokah').select('*'),
          supabase.from('dana_acara').select('*'),
          supabase.from('pengeluaran').select('*'),
          supabase.from('pinjaman_warga').select('*'),
        ]);

        if (resWarga.data && resWarga.data.length > 0) loadedW = resWarga.data;
        if (resKas.data && resKas.data.length > 0) loadedK = resKas.data;
        if (resMajelis.data && resMajelis.data.length > 0) loadedM = resMajelis.data;
        if (resAcara.data && resAcara.data.length > 0) loadedA = resAcara.data;
        if (resPengeluaran.data && resPengeluaran.data.length > 0) loadedP = resPengeluaran.data;
        if (resPinjaman.data && resPinjaman.data.length > 0) loadedQ = resPinjaman.data;
      } catch (err) {
        console.warn('Fallback offline Dashboard');
      }
    }

    if (loadedW.length === 0) loadedW = JSON.parse(localStorage.getItem('local_warga') || '[]');
    if (loadedK.length === 0) loadedK = JSON.parse(localStorage.getItem('local_kas') || '[]');
    if (loadedM.length === 0) loadedM = JSON.parse(localStorage.getItem('local_majelis') || '[]');
    if (loadedA.length === 0) loadedA = JSON.parse(localStorage.getItem('local_dana_acara') || '[]');
    if (loadedP.length === 0) loadedP = JSON.parse(localStorage.getItem('local_pengeluaran') || '[]');
    if (loadedQ.length === 0) loadedQ = JSON.parse(localStorage.getItem('local_pinjaman') || '[]');

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

  // KALKULASI DEMOGRAFI & REKONSILIASI KAS REAL-TIME
  const stats = useMemo(() => {
    const totalWarga = wargaList.length || 0;

    // 1. Demografi Status Warga
    const countMenetap = wargaList.filter(w => (w.status_warga || '').toLowerCase().includes('menetap')).length;
    const countKunjungan = wargaList.filter(w => (w.status_warga || '').toLowerCase().includes('kunjung')).length;
    const countSewa = wargaList.filter(w => (w.status_warga || '').toLowerCase().includes('sewa') || (w.status_warga || '').toLowerCase().includes('kontrak')).length;
    const countKosong = wargaList.filter(w => (w.status_warga || '').toLowerCase().includes('kosong')).length;
    const countLainnya = Math.max(0, totalWarga - (countMenetap + countKunjungan + countSewa + countKosong));

    const pctMenetap = totalWarga > 0 ? Math.round((countMenetap / totalWarga) * 100) : 0;
    const pctKunjungan = totalWarga > 0 ? Math.round((countKunjungan / totalWarga) * 100) : 0;
    const pctSewa = totalWarga > 0 ? Math.round((countSewa / totalWarga) * 100) : 0;
    const pctKosong = totalWarga > 0 ? Math.round((countKosong / totalWarga) * 100) : 0;

    // Warga aktif wajib iuran (unit berpenghuni)
    const wargaWajibKas = wargaList.filter(w => !(w.status_warga || '').toLowerCase().includes('kosong')).length || 1;

    // 2. Realisasi Kas Terkumpul Aktual
    const totalInfaqWargaAktual = kasList.reduce((acc, k) => acc + Number(k.nominal || 0), 0);
    const totalInfaqMajelisAktual = majelisList.filter(m => m.jenis_dana === 'Pemasukan').reduce((acc, m) => acc + Number(m.nominal || 0), 0);
    const totalDanaAcaraMasukAktual = danaAcaraList.filter(a => a.kategori === 'Pemasukan').reduce((acc, a) => acc + Number(a.nominal || 0), 0);

    const totalPemasukanSemuaAktual = totalInfaqWargaAktual + totalInfaqMajelisAktual + totalDanaAcaraMasukAktual;

    // 3. Seluruh Beban Pengeluaran & Piutang Pinjaman
    const totalPengeluaranUmum = pengeluaranList.reduce((acc, p) => acc + Number(p.nominal || 0), 0);
    const totalPengeluaranAcara = danaAcaraList.filter(a => a.kategori === 'Pengeluaran').reduce((acc, a) => acc + Number(a.nominal || 0), 0);
    const totalPengeluaranSemua = totalPengeluaranUmum + totalPengeluaranAcara;

    const totalPinjamanAktif = pinjamanList.filter(p => p.status_pinjaman === 'Berjalan').reduce((acc, p) => acc + Number(p.sisa_pinjaman || 0), 0);

    // 4. Potensi Kas Warga 1 Tahun (Jika 100% Lancar)
    // Target Kas = Total KK Wajib x 12 Bulan x Rp 10.000
    const targetKasWargaSetahunLancar = wargaWajibKas * 12 * 10000;
    
    // Kas Warga aktual pada tahun buku yang dipilih
    const kasTahunIniAktual = kasList
      .filter(k => k.periode_bulan?.startsWith(String(selectedYear)) && k.status_bayar === 'Lunas')
      .reduce((sum, k) => sum + Number(k.nominal || 0), 0);

    // Total Dana Tertunggak
    const totalDanaTertunggak = Math.max(0, targetKasWargaSetahunLancar - kasTahunIniAktual);
    const persentaseTunggakan = targetKasWargaSetahunLancar > 0 ? Math.round((totalDanaTertunggak / targetKasWargaSetahunLancar) * 100) : 0;
    const persentaseTerkumpul = 100 - persentaseTunggakan;

    // Sisa Kas yang SEHARUSNYA Ada (Teoretis Jika Kas 100% Lancar)
    const totalPemasukanSeharusnya = targetKasWargaSetahunLancar + totalInfaqMajelisAktual + totalDanaAcaraMasukAktual;
    const sisaKasSeharusnya = totalPemasukanSeharusnya - totalPengeluaranSemua - totalPinjamanAktif;

    // Sisa Kas RIIL Aktual di Dompet / Bank Saat Ini
    const saldoKasRiilAktual = totalPemasukanSemuaAktual - totalPengeluaranSemua - totalPinjamanAktif;

    // 5. Rata-Rata Kepatuhan Warga Membayar Kas (Tahun Berjalan)
    const monthlyBreakdown = NAMA_BULAN.map((bulanName, idx) => {
      const monthCode = String(idx + 1).padStart(2, '0');
      const prefix = `${selectedYear}-${monthCode}`;
      
      const kasBulan = kasList.filter(k => k.periode_bulan?.startsWith(prefix) && k.status_bayar === 'Lunas');
      const totalMasuk = kasBulan.reduce((sum, k) => sum + Number(k.nominal || 0), 0);
      const wargaBayarCount = new Set(kasBulan.map(k => k.id_warga)).size;
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

    // Rata-rata KK yang membayar per bulan
    const totalWargaBayarSemuaBulan = monthlyBreakdown.reduce((sum, m) => sum + m.wargaBayarCount, 0);
    const rataRataWargaBayarPerBulan = Math.round(totalWargaBayarSemuaBulan / 12);
    const rataRataPersentaseKepatuhan = wargaWajibKas > 0 ? Math.round((rataRataWargaBayarPerBulan / wargaWajibKas) * 100) : 0;
    const rataRataWargaMenunggakPerBulan = Math.max(0, wargaWajibKas - rataRataWargaBayarPerBulan);

    // Monitoring Bulan Berjalan
    const currentMonthIndex = new Date().getMonth();
    const currentMonthPrefix = `${selectedYear}-${String(currentMonthIndex + 1).padStart(2, '0')}`;
    const bayarBulanIni = new Set(kasList.filter(k => k.periode_bulan?.startsWith(currentMonthPrefix) && k.status_bayar === 'Lunas').map(k => k.id_warga)).size;
    const persentaseTargetBulanIni = Math.min(100, Math.round((bayarBulanIni / wargaWajibKas) * 100));

    return {
      totalWarga,
      wargaWajibKas,
      countMenetap,
      countKunjungan,
      countSewa,
      countKosong,
      countLainnya,
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
      bayarBulanIni,
      persentaseTargetBulanIni,
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

      {/* =========================================================================
          BAGIAN 1: INFOGRAFIS STATUS DATA WARGA (MENETAP VS KUNJUNGAN VS SEWA)
          ========================================================================= */}
      <div className="bg-white rounded-3xl border border-slate-200 p-5 md:p-6 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border-b border-slate-100 pb-3">
          <div className="flex items-center space-x-2.5">
            <div className="w-9 h-9 bg-emerald-100 text-emerald-700 rounded-xl flex items-center justify-center">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-slate-900">Infografis Data Hunian Warga Beryl</h3>
              <p className="text-xs text-slate-500">Perbandingan jumlah warga Menetap, Kunjungan, Penyewa, dan Unit Kosong.</p>
            </div>
          </div>
          <span className="px-3 py-1 bg-slate-100 text-slate-700 font-mono font-bold text-xs rounded-full border border-slate-200">
            Total Terdata: {stats.totalWarga} KK
          </span>
        </div>

        {/* 4 Kartu Status Hunian */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Menetap */}
          <div className="bg-emerald-50/70 border border-emerald-200 rounded-2xl p-4 space-y-1.5 hover:shadow-xs transition-all">
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

          {/* Kunjungan */}
          <div className="bg-purple-50/70 border border-purple-200 rounded-2xl p-4 space-y-1.5 hover:shadow-xs transition-all">
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

          {/* Penyewa */}
          <div className="bg-blue-50/70 border border-blue-200 rounded-2xl p-4 space-y-1.5 hover:shadow-xs transition-all">
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

          {/* Kosong */}
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-1.5 hover:shadow-xs transition-all">
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

        {/* Multi-Segment Ratio Bar */}
        <div className="space-y-1.5 pt-1">
          <div className="flex justify-between text-[11px] font-bold text-slate-600">
            <span>Rasio Distribusi Hunian Warga</span>
            <span>{stats.wargaWajibKas} KK Wajib Iuran Lingkungan</span>
          </div>
          <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden flex shadow-inner">
            <div style={{ width: `${stats.pctMenetap}%` }} className="bg-emerald-500 h-full transition-all duration-500" title={`Menetap: ${stats.countMenetap} KK`} />
            <div style={{ width: `${stats.pctKunjungan}%` }} className="bg-purple-500 h-full transition-all duration-500" title={`Kunjungan: ${stats.countKunjungan} KK`} />
            <div style={{ width: `${stats.pctSewa}%` }} className="bg-blue-500 h-full transition-all duration-500" title={`Penyewa: ${stats.countSewa} KK`} />
            <div style={{ width: `${stats.pctKosong}%` }} className="bg-slate-300 h-full transition-all duration-500" title={`Kosong: ${stats.countKosong} Unit`} />
          </div>
        </div>
      </div>

      {/* =========================================================================
          BAGIAN 2: INFOGRAFIS REKONSILIASI KAS & RATA-RATA KEPATUHAN WARGA
          ========================================================================= */}
      <div className="bg-white rounded-3xl border-2 border-emerald-500/30 p-6 shadow-sm space-y-6">
        {/* Header Rekonsiliasi & Tahun Buku */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b pb-4">
          <div>
            <div className="flex items-center space-x-2">
              <Scale className="w-5 h-5 text-emerald-700" />
              <h3 className="font-black text-base text-slate-900 tracking-tight">
                Rekonsiliasi Kas: Potensi Teoretis vs Dampak Tunggakan vs Saldo Kas Riil
              </h3>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Perbandingan transparansi antara uang yang <em>seharusnya terkumpul jika lancar 100%</em> dengan <em>sisa kas riil aktual di kas/bank</em>.
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

        {/* 4 Pilar Utama Analisis Komparasi Keuangan */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* 1. Kas Iuran Seharusnya */}
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

          {/* 2. Dana Tertunggak */}
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

          {/* 3. Sisa Kas Seharusnya */}
          <div className="bg-indigo-50/70 border border-indigo-200 rounded-2xl p-4 space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black text-indigo-700 uppercase tracking-wider">3. Sisa Kas Seharusnya</span>
              <TrendingUp className="w-4 h-4 text-indigo-600" />
            </div>
            <p className="text-xl font-black text-indigo-950">{formatRupiah(stats.sisaKasSeharusnya)}</p>
            <p className="text-[11px] text-indigo-700 leading-tight">
              Saldo sisa setelah dikurangi seluruh pengeluaran (jika kas lancar 100%).
            </p>
          </div>

          {/* 4. Sisa Kas RIIL Aktual */}
          <div className="bg-gradient-to-br from-emerald-600 to-teal-700 text-white rounded-2xl p-4 space-y-1.5 shadow-md">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black text-emerald-100 uppercase tracking-wider">4. Sisa Kas RIIL Aktual</span>
              <CheckCircle2 className="w-4 h-4 text-emerald-200" />
            </div>
            <p className="text-xl font-black text-white">{formatRupiah(stats.saldoKasRiilAktual)}</p>
            <p className="text-[11px] text-emerald-100 leading-tight">
              Uang tunai / bank nyata di tangan bendahara setelah dipotong tunggakan.
            </p>
          </div>
        </div>

        {/* PETA ALUR VISUAL KAS (Sangat Mudah Dipahami Orang Awam) */}
        <div className="bg-slate-50/80 border border-slate-200 rounded-2xl p-4 md:p-5 space-y-3">
          <div className="flex items-center space-x-2 font-bold text-xs text-slate-800">
            <Wallet className="w-4 h-4 text-emerald-600" />
            <span>Bagan Alur Perjalanan Uang Kas (Logika Sederhana untuk Warga):</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-5 gap-2.5 items-center text-center text-xs">
            {/* Step 1: Target */}
            <div className="bg-white p-3 rounded-xl border border-slate-200 space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase">Target Masuk</span>
              <p className="font-black text-slate-800">{formatRupiah(stats.targetKasWargaSetahunLancar)}</p>
              <span className="text-[9px] text-slate-500">100% Iuran Wajib</span>
            </div>

            {/* Minus Sign */}
            <div className="hidden sm:flex justify-center text-rose-500 font-black">
              <Minus className="w-5 h-5" />
            </div>

            {/* Step 2: Tunggakan */}
            <div className="bg-rose-50 p-3 rounded-xl border border-rose-200 space-y-1">
              <span className="text-[10px] font-bold text-rose-600 uppercase">Tunggakan</span>
              <p className="font-black text-rose-600">-{formatRupiah(stats.totalDanaTertunggak)}</p>
              <span className="text-[9px] text-rose-500">Belum Disetor</span>
            </div>

            {/* Minus/Plus Sign */}
            <div className="hidden sm:flex justify-center text-slate-400 font-black">
              <Minus className="w-5 h-5" />
            </div>

            {/* Step 3: Pengeluaran & Pinjaman */}
            <div className="bg-slate-100 p-3 rounded-xl border border-slate-300 space-y-1">
              <span className="text-[10px] font-bold text-slate-600 uppercase">Pengeluaran & Pinjaman</span>
              <p className="font-black text-slate-700">-{formatRupiah(stats.totalPengeluaranSemua + stats.totalPinjamanAktif)}</p>
              <span className="text-[9px] text-slate-500">Biaya Ops, Acara, Qardh</span>
            </div>
          </div>

          {/* Result Banner */}
          <div className="bg-emerald-600 text-white p-3.5 rounded-xl flex flex-col sm:flex-row justify-between items-center gap-2">
            <div className="flex items-center space-x-2">
              <Equal className="w-5 h-5 text-emerald-200 hidden sm:inline" />
              <span className="text-xs font-bold">Hasil Akhir Saldo Kas Riil Tersedia (Uang Nyata):</span>
            </div>
            <span className="text-lg font-black tracking-tight">{formatRupiah(stats.saldoKasRiilAktual)}</span>
          </div>
        </div>

        {/* KARTU RATA-RATA KEPATUHAN WARGA */}
        <div className="bg-gradient-to-r from-teal-50 via-emerald-50 to-indigo-50 border border-emerald-200 rounded-2xl p-4 md:p-5 space-y-3">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
            <div className="flex items-center space-x-2">
              <BarChart3 className="w-4 h-4 text-emerald-700" />
              <h4 className="font-black text-xs md:text-sm text-slate-900 uppercase tracking-wide">
                Statistik Rata-Rata Kepatuhan Warga Menunaikan Iuran Kas
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
                <p className="text-base font-black text-emerald-700">{stats.rataRataWargaBayarPerBulan} Orang / KK</p>
                <p className="text-[10px] text-slate-400">Dari total {stats.wargaWajibKas} KK wajib</p>
              </div>
            </div>

            <div className="bg-white/90 p-3 rounded-xl border border-rose-200 flex items-center space-x-3">
              <div className="w-9 h-9 rounded-lg bg-rose-100 text-rose-700 flex items-center justify-center font-bold text-sm shrink-0">
                <UserX className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[10px] text-slate-500 font-bold uppercase">Rata-Rata Nunggak / Bulan</p>
                <p className="text-base font-black text-rose-600">{stats.rataRataWargaMenunggakPerBulan} Orang / KK</p>
                <p className="text-[10px] text-slate-400">{100 - stats.rataRataPersentaseKepatuhan}% dari target bulanan</p>
              </div>
            </div>

            <div className="bg-white/90 p-3 rounded-xl border border-indigo-200 flex items-center space-x-3">
              <div className="w-9 h-9 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-sm shrink-0">
                <TrendingUp className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[10px] text-slate-500 font-bold uppercase">Tingkat Kepatuhan</p>
                <p className="text-base font-black text-indigo-900">{stats.rataRataPersentaseKepatuhan}%</p>
                <p className="text-[10px] text-slate-400">Kolektibilitas kas tahun {selectedYear}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Narrative Callout Box: Penjelasan Transparan bagi Warga */}
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-xs text-amber-900 space-y-2">
          <div className="flex items-center space-x-2 font-bold text-amber-950">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
            <span>Kesimpulan Transparansi Akuntansi bagi Warga:</span>
          </div>
          <p className="leading-relaxed">
            Total seluruh target penerimaan iuran kas warga untuk tahun buku {selectedYear} adalah sebesar{' '}
            <strong className="font-bold">{formatRupiah(stats.targetKasWargaSetahunLancar)}</strong>. Setelah dikurangi total seluruh beban pengeluaran operasional & sosial (
            <span className="font-semibold text-rose-700">-{formatRupiah(stats.totalPengeluaranSemua)}</span>) dan pinjaman bergulir beredar (
            <span className="font-semibold text-amber-800">-{formatRupiah(stats.totalPinjamanAktif)}</span>), maka{' '}
            <strong className="text-indigo-900 underline font-bold">
              Sisa Kas yang Seharusnya Ada adalah {formatRupiah(stats.sisaKasSeharusnya)}
            </strong>
            .
          </p>
          <p className="leading-relaxed pt-1 border-t border-amber-200/60">
            Namun, karena sampai saat ini masih terdapat{' '}
            <strong className="text-rose-700 font-bold">Dana Tertunggak sebesar {formatRupiah(stats.totalDanaTertunggak)}</strong> (dengan rata-rata partisipasi warga bayar adalah{' '}
            <strong className="text-slate-900">{stats.rataRataWargaBayarPerBulan} dari {stats.wargaWajibKas} KK</strong>), maka{' '}
            <strong className="text-emerald-800 font-black uppercase underline">
              Sisa Kas RIIL Likuid yang Benar-benar Ada di Dompet/Bank Bendahara Saat Ini adalah {formatRupiah(stats.saldoKasRiilAktual)}
            </strong>
            .
          </p>
        </div>
      </div>

      {/* =========================================================================
          BAGIAN 3: 5 KARTU RINGKASAN POS DANA AKTUAL
          ========================================================================= */}
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

      {/* =========================================================================
          BAGIAN 4: RINCIAN MASUKAN KAS & TUNGGAKAN PER BULAN (JAN - DES)
          ========================================================================= */}
      <div className="bg-white rounded-3xl border border-slate-200 p-5 md:p-6 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b pb-4">
          <div className="flex items-center space-x-2.5">
            <div className="w-9 h-9 bg-emerald-100 text-emerald-700 rounded-xl flex items-center justify-center">
              <BarChart3 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-slate-900">Rincian Masukan Kas & Tunggakan Iuran Per Bulan</h3>
              <p className="text-xs text-slate-500">Perbandingan perolehan kas lunas vs tunggakan per bulan pada tahun buku {selectedYear}.</p>
            </div>
          </div>
          <div className="text-right">
            <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
              Total Terkumpul: {formatRupiah(stats.kasTahunIniAktual)} ({stats.persentaseTerkumpul}%)
            </span>
          </div>
        </div>

        {/* Grid 12 Bulan */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {stats.monthlyBreakdown.map((m) => (
            <div key={m.bulan} className="bg-slate-50 border border-slate-200 rounded-2xl p-3.5 space-y-2 hover:border-emerald-300 transition-colors">
              <div className="flex justify-between items-center">
                <span className="font-black text-xs text-slate-800">{m.bulanSingkat}</span>
                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                  m.capaianPct >= 80 ? 'bg-emerald-100 text-emerald-700' :
                  m.capaianPct >= 40 ? 'bg-amber-100 text-amber-700' : 'bg-rose-100 text-rose-700'
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
                <span>{m.wargaBayarCount} Lunas</span>
                <span className="text-rose-500 font-semibold">{m.belumBayarCount} Blm</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* =========================================================================
          BAGIAN 5: 3 KARTU MONITORING OPERASIONAL
          ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Target Kas Bulan Berjalan */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="font-bold text-sm text-slate-800">Target Kas Bulan Berjalan</h3>
            <span className="text-xs font-bold text-emerald-600">{stats.persentaseTargetBulanIni}%</span>
          </div>
          <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
            <div className="h-full bg-emerald-500 rounded-full transition-all duration-500" style={{ width: `${stats.persentaseTargetBulanIni}%` }} />
          </div>
          <div className="grid grid-cols-2 gap-2 text-xs border-t border-slate-100 pt-3">
            <div>
              <p className="text-slate-400">Sudah Bayar</p>
              <p className="font-bold text-emerald-600">{stats.bayarBulanIni} Warga</p>
            </div>
            <div className="text-right">
              <p className="text-slate-400">Belum Bayar</p>
              <p className="font-bold text-rose-500">{Math.max(0, stats.wargaWajibKas - stats.bayarBulanIni)} Warga</p>
            </div>
          </div>
        </div>

        {/* Pinjaman Qardhul Hasan */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-sm text-slate-800">Pinjaman Qardhul Hasan</h3>
            <HandCoins className="w-4 h-4 text-amber-500" />
          </div>
          <p className="text-xl font-bold text-amber-600">{formatRupiah(stats.totalPinjamanAktif)}</p>
          <p className="text-xs text-slate-500">Dana sosial darurat dipinjamkan warga tanpa bunga dan memotong saldo kas riil.</p>
        </div>

        {/* Majelis Al Barokah */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-sm text-slate-800">Majelis Al Barokah</h3>
            <Sparkles className="w-4 h-4 text-teal-500" />
          </div>
          <p className="text-xl font-bold text-teal-700">{formatRupiah(stats.totalInfaqMajelisAktual)}</p>
          <p className="text-xs text-slate-500">Penerimaan infaq pengajian rutin & donasi kegiatan Peringatan Hari Besar Islam.</p>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;