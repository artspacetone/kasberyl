import React, { useEffect, useState, useMemo } from 'react';
import { supabase, isSupabaseConfigured } from '../supabase';
import { formatRupiah } from '../types';
import { Scale, Printer } from 'lucide-react';

export const LaporanBalance: React.FC = () => {
  const [kasList, setKasList] = useState<any[]>([]);
  const [majelisList, setMajelisList] = useState<any[]>([]);
  const [danaAcaraList, setDanaAcaraList] = useState<any[]>([]);
  const [pengeluaranList, setPengeluaranList] = useState<any[]>([]);
  const [pinjamanList, setPinjamanList] = useState<any[]>([]);

  useEffect(() => {
    const load = async () => {
      let loadedK: any[] = [];
      let loadedM: any[] = [];
      let loadedA: any[] = [];
      let loadedP: any[] = [];
      let loadedQ: any[] = [];

      if (isSupabaseConfigured) {
        try {
          const [resKas, resMajelis, resAcara, resPengeluaran, resPinjaman] = await Promise.all([
            supabase.from('kas_warga_beryl').select('*'),
            supabase.from('infaq_majelis_albarokah').select('*'),
            supabase.from('dana_acara').select('*'),
            supabase.from('pengeluaran').select('*'),
            supabase.from('pinjaman_warga').select('*'),
          ]);
          if (resKas.data) loadedK = resKas.data;
          if (resMajelis.data) loadedM = resMajelis.data;
          if (resAcara.data) loadedA = resAcara.data;
          if (resPengeluaran.data) loadedP = resPengeluaran.data;
          if (resPinjaman.data) loadedQ = resPinjaman.data;
        } catch (err) {
          console.warn('Offline mode Laporan');
        }
      }

      if (loadedK.length === 0) loadedK = JSON.parse(localStorage.getItem('local_kas') || '[]');
      if (loadedM.length === 0) loadedM = JSON.parse(localStorage.getItem('local_majelis') || '[]');
      if (loadedA.length === 0) loadedA = JSON.parse(localStorage.getItem('local_dana_acara') || '[]');
      if (loadedP.length === 0) loadedP = JSON.parse(localStorage.getItem('local_pengeluaran') || '[]');
      if (loadedQ.length === 0) loadedQ = JSON.parse(localStorage.getItem('local_pinjaman') || '[]');

      setKasList(loadedK);
      setMajelisList(loadedM);
      setDanaAcaraList(loadedA);
      setPengeluaranList(loadedP);
      setPinjamanList(loadedQ);
    };
    load();
  }, []);

  const stats = useMemo(() => {
    const totalInfaqWarga = kasList.reduce((acc, k) => acc + Number(k.nominal || 0), 0);
    const totalInfaqMajelis = majelisList.filter(m => m.jenis_dana === 'Pemasukan').reduce((acc, m) => acc + Number(m.nominal || 0), 0);
    const totalDanaAcaraMasuk = danaAcaraList.filter(a => a.kategori === 'Pemasukan').reduce((acc, a) => acc + Number(a.nominal || 0), 0);
    const totalPemasukan = totalInfaqWarga + totalInfaqMajelis + totalDanaAcaraMasuk;
    
    const totalPengeluaranUmum = pengeluaranList.reduce((acc, p) => acc + Number(p.nominal || 0), 0);
    const totalPengeluaranAcara = danaAcaraList.filter(a => a.kategori === 'Pengeluaran').reduce((acc, a) => acc + Number(a.nominal || 0), 0);
    const totalPengeluaran = totalPengeluaranUmum + totalPengeluaranAcara;

    const totalPinjamanBeredar = pinjamanList.filter(p => p.status_pinjaman === 'Berjalan').reduce((acc, p) => acc + Number(p.sisa_pinjaman || 0), 0);
    const saldoKasRiil = totalPemasukan - totalPengeluaran - totalPinjamanBeredar;

    return {
      totalInfaqWarga, totalInfaqMajelis, totalDanaAcaraMasuk, totalPemasukan,
      totalPengeluaran, totalPinjamanBeredar, saldoKasRiil
    };
  }, [kasList, majelisList, danaAcaraList, pengeluaranList, pinjamanList]);

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Laporan & Rekonsiliasi Balance Kas</h2>
          <p className="text-xs text-slate-500 mt-0.5">Perhitungan otomatis seluruh arus kas masuk, keluar, piutang, dan saldo riil.</p>
        </div>
        <button
          onClick={() => window.print()}
          className="flex items-center space-x-2 px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold rounded-xl shadow-sm transition-all"
        >
          <Printer className="w-4 h-4" />
          <span>Cetak Laporan</span>
        </button>
      </div>

      <div className="bg-white rounded-3xl border border-slate-200 p-6 md:p-8 shadow-sm space-y-6">
        <div className="text-center border-b pb-4">
          <h3 className="text-base font-black uppercase tracking-wider text-slate-900">
            Laporan Rekapitulasi Kas Terpadu
          </h3>
          <p className="text-xs text-slate-500 mt-1">Warga Beryl & Majelis Al Barokah • Tahun Buku 2026</p>
        </div>

        <div className="space-y-3 text-xs">
          <div className="flex justify-between font-bold text-slate-700 border-b pb-1">
            <span>URAIAN POS KEUANGAN</span>
            <span>JUMLAH NOMINAL</span>
          </div>

          <div className="flex justify-between text-slate-600">
            <span>1. Kas Iuran Warga Beryl (Rp 10.000 / Bln)</span>
            <span className="font-bold text-emerald-600">+{formatRupiah(stats.totalInfaqWarga)}</span>
          </div>

          <div className="flex justify-between text-slate-600">
            <span>2. Dana Acara Paguyuban Beryl (Donasi Sukarela)</span>
            <span className="font-bold text-purple-600">+{formatRupiah(stats.totalDanaAcaraMasuk)}</span>
          </div>

          <div className="flex justify-between text-slate-600">
            <span>3. Infaq Majelis Al Barokah (Pengajian & PHBI)</span>
            <span className="font-bold text-teal-600">+{formatRupiah(stats.totalInfaqMajelis)}</span>
          </div>

          <div className="flex justify-between font-bold text-slate-800 bg-slate-50 p-2.5 rounded-xl border">
            <span>TOTAL AKUMULASI PEMASUKAN</span>
            <span className="text-emerald-700">{formatRupiah(stats.totalPemasukan)}</span>
          </div>

          <div className="flex justify-between text-slate-600 pt-2">
            <span>4. Total Seluruh Pengeluaran (Operasional, Sosial, Acara, Majelis)</span>
            <span className="font-bold text-rose-600">-{formatRupiah(stats.totalPengeluaran)}</span>
          </div>

          <div className="flex justify-between text-slate-600">
            <span>5. Pinjaman Qardhul Hasan Beredar (Belum Lunas)</span>
            <span className="font-bold text-amber-600">-{formatRupiah(stats.totalPinjamanBeredar)}</span>
          </div>

          <div className="flex justify-between font-black text-sm text-white bg-emerald-600 p-4 rounded-2xl shadow-md mt-4">
            <div className="flex items-center space-x-2">
              <Scale className="w-5 h-5" />
              <span>SALDO BALANCE KAS RIIL (LIKUID TUNAI / BANK)</span>
            </div>
            <span>{formatRupiah(stats.saldoKasRiil)}</span>
          </div>
        </div>
      </div>
    </div>
  );
};