// src/pages/keuangan.tsx
import React, { useEffect, useState } from 'react';
import { formatRupiah, Pengguna, Warga } from '../types';
import {
  X, Plus, Edit2, Trash2, TrendingUp, TrendingDown, Wallet, FileDown,
  CheckCircle2, FileSpreadsheet, Upload, ExternalLink, ArrowUpDown, ArrowUp, ArrowDown, Search
} from 'lucide-react';
import { supabase } from '../supabase';

const getLocalISODate = () =>
  new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 10);

const getLocalISOMonth = () =>
  new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 7);

const MONTH_KEYS = ['01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12'];
const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];

export const Keuangan = ({ user, module, onNavigate }: { user: Pengguna; module: 'kas' | 'acara'; onNavigate?: (tab: string) => void }) => {
  const [data, setData] = useState<any[]>([]);
  const [wargaList, setWargaList] = useState<Warga[]>([]);
  const [tab, setTab] = useState<'Pemasukan' | 'Pengeluaran' | 'Matriks'>('Pemasukan');
  const [showFormModal, setShowFormModal] = useState(false);
  const [editingData, setEditingData] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedYear, setSelectedYear] = useState<string>('2026');

  const [sortField, setSortField] = useState<string>('tanggal');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  const table = module === 'kas' ? 'kas_warga' : 'dana_acara';

  const isGuest = user.id_pengguna === 0;
  const isAdminKeuangan = !isGuest && (user.peran === 'Admin_Keuangan' || user.peran === 'Super_Admin');

  const loadData = async () => {
    try {
      const [resTrx, resWarga] = await Promise.all([
        supabase.from(table).select('*, warga(nama_lengkap)').order('tanggal', { ascending: false }),
        supabase.from('warga').select('*').order('id_rumah', { ascending: true }),
      ]);

      if (resTrx.error) throw resTrx.error;

      const mapped = (resTrx.data || []).map((d: any) => ({
        ...d,
        nama_warga: d.warga?.nama_lengkap,
      }));
      setData(mapped);
      setWargaList(resWarga.data || []);
    } catch (err: any) {
      console.error('Gagal memuat data keuangan:', err.message);
    }
  };

  useEffect(() => {
    loadData();
    setTab('Pemasukan');
  }, [module]);

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(prev => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const renderSortIcon = (field: string) => {
    if (sortField !== field) return <ArrowUpDown className="w-3 h-3 text-slate-400 inline ml-1 opacity-60" />;
    return sortDirection === 'asc' ? (
      <ArrowUp className="w-3.5 h-3.5 text-primary-600 inline ml-1" />
    ) : (
      <ArrowDown className="w-3.5 h-3.5 text-primary-600 inline ml-1" />
    );
  };

  const handleValidasi = async (id: number) => {
    if (!isAdminKeuangan) return;
    try {
      const { error } = await supabase.from(table).update({ status_bayar: 'Lunas' }).eq('id_transaksi', id);
      if (error) throw error;
      loadData();
    } catch (err: any) {
      alert('Gagal memvalidasi transaksi: ' + err.message);
    }
  };

  const handleQuickPayMatriks = async (idWarga: number, monthKey: string) => {
    if (!isAdminKeuangan) return;

    const periode = `${selectedYear}-${monthKey}-01`;
    const tanggalBayar = getLocalISODate();

    if (!confirm(`Catat pembayaran Kas Rp 10.000 untuk bulan ${monthKey}/${selectedYear}?`)) return;

    try {
      const { error } = await supabase.from('kas_warga').insert([
        {
          id_warga_pembayar: idWarga,
          periode_bulan: periode,
          tanggal: tanggalBayar,
          kategori: 'Pemasukan',
          nominal: 10000,
          keterangan: `Iuran Wajib Bulanan ${selectedYear}-${monthKey}`,
          status_bayar: 'Lunas',
          bukti_transfer: 'Admin Quick Pay',
          diinput_oleh: user.id_pengguna,
        },
      ]);

      if (error) throw error;
      loadData();
    } catch (err: any) {
      alert('Gagal mencatat iuran: ' + err.message);
    }
  };

  const handleAdminFormSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!isAdminKeuangan) return;

    const formData = new FormData(e.currentTarget);

    const payloadData: any = {
      tanggal: formData.get('tanggal'),
      kategori: tab === 'Matriks' ? 'Pemasukan' : tab,
      nominal: Number(formData.get('nominal')),
      keterangan: formData.get('keterangan'),
      bukti_transfer: formData.get('bukti_transfer') || 'Kosong',
    };

    try {
      if (!editingData) {
        const idWarga = formData.get('id_warga_pembayar');
        payloadData.id_warga_pembayar = idWarga ? Number(idWarga) : null;
        payloadData.status_bayar = 'Lunas';
        payloadData.diinput_oleh = user.id_pengguna;

        if (module === 'kas') {
          payloadData.periode_bulan = formData.get('periode_bulan')
            ? formData.get('periode_bulan') + '-01'
            : getLocalISOMonth() + '-01';
        }

        if (module === 'acara') {
          payloadData.nama_acara = formData.get('nama_acara') || 'Event Terbuka';
        }

        const { error } = await supabase.from(table).insert([payloadData]);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from(table)
          .update(payloadData)
          .eq('id_transaksi', editingData.id_transaksi);
        if (error) throw error;
      }

      setShowFormModal(false);
      setEditingData(null);
      loadData();
    } catch (err: any) {
      alert('Gagal menyimpan transaksi:\n' + err.message);
    }
  };

  const handleDelete = async (id: number) => {
    if (!isAdminKeuangan) return;
    if (!confirm('Hapus transaksi ini?')) return;
    try {
      const { error } = await supabase.from(table).delete().eq('id_transaksi', id);
      if (error) throw error;
      loadData();
    } catch (err: any) {
      alert('Gagal menghapus transaksi: ' + err.message);
    }
  };

  const exportMatriksLengkapCSV = () => {
    if (isGuest) return;
    const headers = [
      'No',
      'Blok / Unit',
      'Nama Lengkap Warga',
      'Status Warga',
      ...MONTH_NAMES.map(m => `Iuran ${m} ${selectedYear}`),
      'Total Iuran Kas Paid (Rp)',
      'Total Donasi Acara (Rp)',
    ];

    const rows = wargaList.map((w, idx) => {
      let totalKasPaid = 0;
      const monthStatuses = MONTH_KEYS.map(m => {
        const pStr = `${selectedYear}-${m}-01`;
        const hasPaid = data.some(
          d =>
            d.id_warga_pembayar === w.id_warga &&
            d.kategori === 'Pemasukan' &&
            d.status_bayar === 'Lunas' &&
            d.periode_bulan === pStr
        );
        if (hasPaid) {
          totalKasPaid += 10000;
          return 'LUNAS (10.000)';
        }
        return 'BELUM BAYAR';
      });

      return [
        idx + 1,
        `"${w.id_rumah}"`,
        `"${w.nama_lengkap.replace(/"/g, '""')}"`,
        `"${w.status_warga}"`,
        ...monthStatuses.map(ms => `"${ms}"`),
        totalKasPaid,
      ].join(',');
    });

    const csvContent = [headers.join(','), ...rows].join('\n');
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Laporan_Keuangan_Warga_SIPEMA_${selectedYear}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const matrixRows = wargaList.map(w => {
    let paidCount = 0;
    MONTH_KEYS.forEach(mKey => {
      const periodeStr = `${selectedYear}-${mKey}-01`;
      const isPaid = data.some(
        d =>
          d.id_warga_pembayar === w.id_warga &&
          d.kategori === 'Pemasukan' &&
          d.status_bayar === 'Lunas' &&
          d.periode_bulan === periodeStr
      );
      if (isPaid) paidCount++;
    });
    return {
      warga: w,
      paidCount,
      total: paidCount * 10000,
    };
  });

  const sortedMatrixRows = [...matrixRows]
    .filter(({ warga: w }) => {
      if (!searchQuery) return true;
      const q = searchQuery.toLowerCase().trim();
      return (
        (w.id_rumah && w.id_rumah.toLowerCase().includes(q)) ||
        (w.nama_lengkap && w.nama_lengkap.toLowerCase().includes(q))
      );
    })
    .sort((a, b) => {
      let comp = 0;
      if (sortField === 'rumah') {
        comp = (a.warga.id_rumah || '').localeCompare(b.warga.id_rumah || '', undefined, { numeric: true, sensitivity: 'base' });
      } else if (sortField === 'nama') {
        comp = (a.warga.nama_lengkap || '').localeCompare(b.warga.nama_lengkap || '');
      } else if (sortField === 'total') {
        comp = a.total - b.total;
      }
      return sortDirection === 'asc' ? comp : -comp;
    });

  const filteredData = data.filter(
    d =>
      d.kategori === tab &&
      (!searchQuery ||
        d.nama_warga?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        d.keterangan?.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const sortedFilteredData = [...filteredData].sort((a, b) => {
    let valA: any = '';
    let valB: any = '';

    if (sortField === 'tanggal') {
      valA = a.tanggal || '';
      valB = b.tanggal || '';
    } else if (sortField === 'periode') {
      valA = a.periode_bulan || a.nama_acara || '';
      valB = b.periode_bulan || b.nama_acara || '';
    } else if (sortField === 'sumber') {
      valA = a.nama_warga || '';
      valB = b.nama_warga || '';
    } else if (sortField === 'keterangan') {
      valA = a.keterangan || '';
      valB = b.keterangan || '';
    } else if (sortField === 'kategori') {
      valA = a.kategori || '';
      valB = b.kategori || '';
    } else if (sortField === 'nominal') {
      valA = a.nominal || 0;
      valB = b.nominal || 0;
      return sortDirection === 'asc' ? valA - valB : valB - valA;
    } else if (sortField === 'status_bayar') {
      valA = a.status_bayar || '';
      valB = b.status_bayar || '';
    } else {
      valA = a[sortField] || '';
      valB = b[sortField] || '';
    }

    let comp = String(valA).localeCompare(String(valB), undefined, { numeric: true, sensitivity: 'base' });
    return sortDirection === 'asc' ? comp : -comp;
  });

  const semuaPemasukan = data.filter(d => d.kategori === 'Pemasukan' && d.status_bayar === 'Lunas');
  const semuaPengeluaran = data.filter(d => d.kategori === 'Pengeluaran' && d.status_bayar === 'Lunas');
  const totalPemasukan = semuaPemasukan.reduce((s, d) => s + (d.nominal || 0), 0);
  const totalPengeluaran = semuaPengeluaran.reduce((s, d) => s + (d.nominal || 0), 0);
  const saldoBersih = totalPemasukan - totalPengeluaran;

  return (
    <div className="space-y-6 relative">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">
            {module === 'kas' ? 'Keuangan Kas Warga (Rp 10.000)' : 'Dana Acara'}
          </h2>
          <p className="text-slate-500 mt-1">
            {isGuest
              ? 'Laporan rekapitulasi keuangan kas (Mode Lihat Tamu).'
              : module === 'kas'
              ? 'Pengelolaan iuran wajib bulanan dan rekapitulasi pembayaran warga.'
              : 'Donasi sukarela dan pengeluaran kegiatan paguyuban.'}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {isAdminKeuangan && (
            <button
              onClick={() => onNavigate?.('data-import')}
              className="flex items-center space-x-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg shadow-sm text-sm font-medium transition-colors"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>Import Data Excel</span>
            </button>
          )}
          {!isGuest && module === 'kas' && (
            <button
              onClick={exportMatriksLengkapCSV}
              className="flex items-center space-x-2 px-4 py-2 bg-white border text-slate-700 hover:bg-slate-50 rounded-lg shadow-sm text-sm font-medium transition-colors"
            >
              <FileDown className="w-4 h-4" />
              <span>Export CSV</span>
            </button>
          )}
          {isAdminKeuangan && (
            <button
              onClick={() => {
                setEditingData(null);
                setShowFormModal(true);
              }}
              className="flex items-center space-x-2 px-4 py-2 bg-primary-600 text-white rounded-lg shadow-sm hover:bg-primary-700 transition-colors text-sm font-medium"
            >
              <Plus className="w-4 h-4" />
              <span>Catat Transaksi</span>
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white rounded-xl border border-emerald-200 p-4 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <p className="text-[10px] font-bold text-emerald-500 uppercase tracking-wider">Total Pemasukan</p>
            <TrendingUp className="w-4 h-4 text-emerald-400" />
          </div>
          <p className="text-lg font-bold text-emerald-700 leading-tight">{formatRupiah(totalPemasukan)}</p>
          <p className="text-[10px] text-slate-400 mt-0.5">{semuaPemasukan.length} transaksi lunas</p>
        </div>

        <div className="bg-white rounded-xl border border-red-200 p-4 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <p className="text-[10px] font-bold text-red-500 uppercase tracking-wider">Total Pengeluaran</p>
            <TrendingDown className="w-4 h-4 text-red-400" />
          </div>
          <p className="text-lg font-bold text-red-700 leading-tight">{formatRupiah(totalPengeluaran)}</p>
          <p className="text-[10px] text-slate-400 mt-0.5">{semuaPengeluaran.length} transaksi</p>
        </div>

        <div className={`bg-white rounded-xl border p-4 shadow-sm ${saldoBersih >= 0 ? 'border-blue-200' : 'border-rose-300'}`}>
          <div className="flex items-center justify-between mb-2">
            <p className="text-[10px] font-bold text-blue-500 uppercase tracking-wider">Saldo Kas Saat Ini</p>
            <Wallet className="w-4 h-4 text-blue-400" />
          </div>
          <p className={`text-lg font-bold leading-tight ${saldoBersih >= 0 ? 'text-blue-700' : 'text-rose-600'}`}>
            {formatRupiah(saldoBersih)}
          </p>
          <p className="text-[10px] text-slate-400 mt-0.5">{saldoBersih >= 0 ? 'Saldo Sehat ✓' : 'Saldo Defisit ⚠'}</p>
        </div>

        <div className="bg-white rounded-xl border border-amber-200 p-4 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <p className="text-[10px] font-bold text-amber-500 uppercase tracking-wider">Total Warga Aktif</p>
          </div>
          <p className="text-lg font-bold text-amber-700 leading-tight">{wargaList.length} KK</p>
          <p className="text-[10px] text-slate-400 mt-0.5">Membayar Kas @ Rp 10rb</p>
        </div>
      </div>

      <div className="flex flex-col md:flex-row justify-between gap-4">
        <div className="flex space-x-1 bg-slate-200/50 p-1 rounded-xl w-fit">
          <button
            onClick={() => { setTab('Pemasukan'); setSortField('tanggal'); setSortDirection('desc'); }}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              tab === 'Pemasukan' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Pemasukan
          </button>
          <button
            onClick={() => { setTab('Pengeluaran'); setSortField('tanggal'); setSortDirection('desc'); }}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              tab === 'Pengeluaran' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Pengeluaran
          </button>
          {module === 'kas' && (
            <button
              onClick={() => { setTab('Matriks'); setSortField('rumah'); setSortDirection('asc'); }}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                tab === 'Matriks' ? 'bg-white shadow-sm text-primary-600 font-bold' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              📊 Matriks Rekap Jan - Des
            </button>
          )}
        </div>

        <div className="w-full md:w-72 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder={tab === 'Matriks' ? "🔍 Cari nama / blok di matriks..." : "🔍 Cari keterangan / warga..."}
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-sm outline-none focus:border-primary-500 transition-colors shadow-xs"
          />
        </div>
      </div>

      {tab === 'Matriks' && module === 'kas' && (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
            <div>
              <h3 className="font-bold text-slate-800 text-sm">
                Matriks Pembayaran Kas Warga (Januari - Desember {selectedYear})
              </h3>
              <p className="text-xs text-slate-500">
                Gunakan input pencarian di atas untuk memfilter warga / blok. Klik header Blok/Nama/Total untuk menyortir.
              </p>
            </div>
            <select
              value={selectedYear}
              onChange={e => setSelectedYear(e.target.value)}
              className="px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-bold text-slate-700 bg-white"
            >
              <option value="2026">Tahun 2026</option>
              <option value="2025">Tahun 2025</option>
            </select>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600 border-collapse">
              <thead className="bg-slate-100 text-[10px] uppercase font-bold text-slate-600 border-b border-slate-200 select-none">
                <tr>
                  <th
                    onClick={() => handleSort('rumah')}
                    className="px-3 py-3 border-r border-slate-200 sticky left-0 bg-slate-100 z-10 min-w-[70px] cursor-pointer hover:bg-slate-200 transition-colors"
                  >
                    <span>Blok</span>
                    {renderSortIcon('rumah')}
                  </th>
                  <th
                    onClick={() => handleSort('nama')}
                    className="px-4 py-3 border-r border-slate-200 sticky left-[70px] bg-slate-100 z-10 min-w-[160px] cursor-pointer hover:bg-slate-200 transition-colors"
                  >
                    <span>Nama Warga</span>
                    {renderSortIcon('nama')}
                  </th>
                  {MONTH_NAMES.map(m => (
                    <th key={m} className="px-2 py-3 text-center border-r border-slate-200 min-w-[45px]">
                      {m}
                    </th>
                  ))}
                  <th
                    onClick={() => handleSort('total')}
                    className="px-3 py-3 text-right cursor-pointer hover:bg-slate-200 transition-colors min-w-[90px]"
                  >
                    <span>Total</span>
                    {renderSortIcon('total')}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {sortedMatrixRows.map(({ warga: w, total }) => {
                  return (
                    <tr key={w.id_warga} className="hover:bg-slate-50 transition-colors">
                      <td className="px-3 py-2.5 font-bold text-slate-800 border-r border-slate-200 sticky left-0 bg-white z-10 whitespace-nowrap">
                        {w.id_rumah}
                      </td>
                      <td className="px-4 py-2.5 font-medium text-slate-900 border-r border-slate-200 sticky left-[70px] bg-white z-10 truncate max-w-[180px]">
                        {w.nama_lengkap}
                      </td>
                      {MONTH_KEYS.map((mKey, idx) => {
                        const periodeStr = `${selectedYear}-${mKey}-01`;
                        const isPaid = data.some(
                          d =>
                            d.id_warga_pembayar === w.id_warga &&
                            d.kategori === 'Pemasukan' &&
                            d.status_bayar === 'Lunas' &&
                            d.periode_bulan === periodeStr
                        );

                        return (
                          <td
                            key={mKey}
                            className={`px-2 py-2 text-center border-r border-slate-200 transition-colors ${
                              isAdminKeuangan && !isPaid ? 'cursor-pointer hover:bg-rose-100' : ''
                            } ${isPaid ? 'bg-emerald-50' : 'bg-rose-50/50'}`}
                            onClick={() => isAdminKeuangan && !isPaid && handleQuickPayMatriks(w.id_warga, mKey)}
                            title={
                              isPaid
                                ? `Lunas ${MONTH_NAMES[idx]}`
                                : isAdminKeuangan
                                ? `Klik untuk bayar ${MONTH_NAMES[idx]}`
                                : `Belum bayar ${MONTH_NAMES[idx]}`
                            }
                          >
                            {isPaid ? (
                              <CheckCircle2 className="w-4 h-4 text-emerald-600 mx-auto" />
                            ) : (
                              <span className="text-[10px] font-bold text-rose-400">✕</span>
                            )}
                          </td>
                        );
                      })}
                      <td className="px-3 py-2.5 text-right font-bold text-emerald-700 whitespace-nowrap">
                        {formatRupiah(total)}
                      </td>
                    </tr>
                  );
                })}
                {sortedMatrixRows.length === 0 && (
                  <tr>
                    <td colSpan={15} className="px-4 py-8 text-center text-slate-400 text-xs">
                      Tidak ada warga / blok ditemukan dengan kata kunci "{searchQuery}".
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab !== 'Matriks' && (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            {tab === 'Pengeluaran' ? (
              <table className="w-full text-left text-sm text-slate-600">
                <thead className="bg-slate-50 text-[10px] uppercase text-slate-500 border-b border-slate-200 select-none">
                  <tr>
                    <th className="px-4 py-3 font-bold text-center w-12">No</th>
                    <th onClick={() => handleSort('tanggal')} className="px-4 py-3 font-bold whitespace-nowrap cursor-pointer hover:bg-slate-100">
                      <span>Tanggal</span>
                      {renderSortIcon('tanggal')}
                    </th>
                    <th onClick={() => handleSort('keterangan')} className="px-4 py-3 font-bold cursor-pointer hover:bg-slate-100">
                      <span>Keperluan / Keterangan</span>
                      {renderSortIcon('keterangan')}
                    </th>
                    <th onClick={() => handleSort('kategori')} className="px-4 py-3 font-bold cursor-pointer hover:bg-slate-100">
                      <span>Kategori</span>
                      {renderSortIcon('kategori')}
                    </th>
                    <th className="px-4 py-3 font-bold text-center">Bukti</th>
                    <th onClick={() => handleSort('nominal')} className="px-4 py-3 font-bold text-right cursor-pointer hover:bg-slate-100">
                      <span>Nominal</span>
                      {renderSortIcon('nominal')}
                    </th>
                    {isAdminKeuangan && <th className="px-4 py-3 font-bold text-right">Aksi</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {sortedFilteredData.map((item, idx) => (
                    <tr key={item.id_transaksi} className="hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-3.5 text-center text-slate-400 font-mono text-xs">{idx + 1}</td>
                      <td className="px-4 py-3.5 text-slate-700 whitespace-nowrap font-medium">{item.tanggal}</td>
                      <td className="px-4 py-3.5 text-slate-800 max-w-[280px] break-words">{item.keterangan}</td>
                      <td className="px-4 py-3.5">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-slate-100 text-slate-600 border border-slate-200">
                          {item.kategori || 'Operasional'}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-center">
                        {item.bukti_transfer && item.bukti_transfer.startsWith('http') ? (
                          <a
                            href={item.bukti_transfer}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center space-x-1 px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-blue-600 border border-blue-200 rounded text-xs font-semibold transition-colors"
                          >
                            <ExternalLink className="w-3 h-3" />
                            <span>Lihat Bukti</span>
                          </a>
                        ) : (
                          <span className="text-slate-400 text-xs italic">Tidak ada</span>
                        )}
                      </td>
                      <td className="px-4 py-3.5 text-right font-mono font-semibold text-red-600 whitespace-nowrap">
                        -{formatRupiah(item.nominal)}
                      </td>
                      {isAdminKeuangan && (
                        <td className="px-4 py-3.5 text-right space-x-2 whitespace-nowrap">
                          <button onClick={() => { setEditingData(item); setShowFormModal(true); }} className="text-slate-400 hover:text-blue-600">
                            <Edit2 className="w-4 h-4 inline" />
                          </button>
                          <button onClick={() => handleDelete(item.id_transaksi)} className="text-slate-400 hover:text-red-600">
                            <Trash2 className="w-4 h-4 inline" />
                          </button>
                        </td>
                      )}
                    </tr>
                  ))}
                  {sortedFilteredData.length === 0 && (
                    <tr>
                      <td colSpan={isAdminKeuangan ? 7 : 6} className="px-5 py-10 text-center text-slate-400 text-sm">
                        Belum ada data pengeluaran.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            ) : (
              <table className="w-full text-left text-sm text-slate-600">
                <thead className="bg-slate-50 text-[10px] uppercase text-slate-500 border-b border-slate-200 select-none">
                  <tr>
                    <th onClick={() => handleSort('tanggal')} className="px-5 py-3 font-bold cursor-pointer hover:bg-slate-100">
                      <span>Tanggal</span>
                      {renderSortIcon('tanggal')}
                    </th>
                    {module === 'kas' && (
                      <th onClick={() => handleSort('periode')} className="px-5 py-3 font-bold cursor-pointer hover:bg-slate-100">
                        <span>Periode</span>
                        {renderSortIcon('periode')}
                      </th>
                    )}
                    {module === 'acara' && (
                      <th onClick={() => handleSort('periode')} className="px-5 py-3 font-bold cursor-pointer hover:bg-slate-100">
                        <span>Nama Acara</span>
                        {renderSortIcon('periode')}
                      </th>
                    )}
                    <th onClick={() => handleSort('sumber')} className="px-5 py-3 font-bold cursor-pointer hover:bg-slate-100">
                      <span>Warga / Sumber</span>
                      {renderSortIcon('sumber')}
                    </th>
                    <th onClick={() => handleSort('keterangan')} className="px-5 py-3 font-bold cursor-pointer hover:bg-slate-100">
                      <span>Keterangan</span>
                      {renderSortIcon('keterangan')}
                    </th>
                    <th onClick={() => handleSort('nominal')} className="px-5 py-3 font-bold text-right cursor-pointer hover:bg-slate-100">
                      <span>Nominal</span>
                      {renderSortIcon('nominal')}
                    </th>
                    <th onClick={() => handleSort('status_bayar')} className="px-5 py-3 font-bold text-center cursor-pointer hover:bg-slate-100">
                      <span>Status</span>
                      {renderSortIcon('status_bayar')}
                    </th>
                    {isAdminKeuangan && <th className="px-5 py-3 font-bold text-right">Aksi</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {sortedFilteredData.map(item => (
                    <tr key={item.id_transaksi} className="hover:bg-slate-50 transition-colors">
                      <td className="px-5 py-4 text-slate-500 whitespace-nowrap">{item.tanggal}</td>
                      {module === 'kas' && (
                        <td className="px-5 py-4 text-slate-500 font-mono text-xs">{item.periode_bulan?.slice(0, 7)}</td>
                      )}
                      {module === 'acara' && (
                        <td className="px-5 py-4 text-slate-700 font-medium">{item.nama_acara || '-'}</td>
                      )}
                      <td className="px-5 py-4 font-medium text-slate-900">
                        {item.nama_warga || <span className="text-slate-400 font-normal text-xs italic">Non-warga / General</span>}
                      </td>
                      <td className="px-5 py-4 text-slate-500 max-w-[200px] truncate">{item.keterangan}</td>
                      <td className="px-5 py-4 text-right font-mono font-semibold text-emerald-600">
                        +{formatRupiah(item.nominal)}
                      </td>
                      <td className="px-5 py-4 text-center">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase ${item.status_bayar === 'Lunas' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                          {item.status_bayar}
                        </span>
                      </td>
                      {isAdminKeuangan && (
                        <td className="px-5 py-4 text-right space-x-2 whitespace-nowrap">
                          {item.status_bayar === 'Menunggu Verifikasi' && (
                            <button onClick={() => handleValidasi(item.id_transaksi)} className="text-[10px] font-bold text-blue-600 px-2 py-1 bg-blue-50 rounded">
                              Validasi
                            </button>
                          )}
                          <button onClick={() => { setEditingData(item); setShowFormModal(true); }} className="text-slate-400 hover:text-blue-600">
                            <Edit2 className="w-4 h-4 inline" />
                          </button>
                          <button onClick={() => handleDelete(item.id_transaksi)} className="text-slate-400 hover:text-red-600">
                            <Trash2 className="w-4 h-4 inline" />
                          </button>
                        </td>
                      )}
                    </tr>
                  ))}
                  {sortedFilteredData.length === 0 && (
                    <tr>
                      <td colSpan={isAdminKeuangan ? 8 : 7} className="px-5 py-10 text-center text-slate-400 text-sm">
                        Belum ada data pemasukan.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {showFormModal && isAdminKeuangan && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden relative">
            <div className="p-4 border-b flex justify-between items-center bg-slate-50">
              <h3 className="font-bold text-slate-800">{editingData ? 'Edit' : 'Catat'} Transaksi</h3>
              <button onClick={() => { setShowFormModal(false); setEditingData(null); }} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleAdminFormSubmit} className="p-6 space-y-4">
              {!editingData && tab === 'Pemasukan' && (
                <>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Pilih Warga Pembayar</label>
                    <select name="id_warga_pembayar" className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm outline-none">
                      <option value="">-- Non Warga / Bebas --</option>
                      {wargaList.map(w => (
                        <option key={w.id_warga} value={w.id_warga}>
                          {w.nama_lengkap} ({w.id_rumah})
                        </option>
                      ))}
                    </select>
                  </div>
                  {module === 'kas' && (
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Periode Bulan</label>
                      <input required type="month" name="periode_bulan" defaultValue={getLocalISOMonth()} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm outline-none" />
                    </div>
                  )}
                </>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Tanggal</label>
                <input required type="date" name="tanggal" defaultValue={editingData?.tanggal || getLocalISODate()} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm outline-none" />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Nominal (Rp)</label>
                <input required type="number" min="0" step="1000" name="nominal" defaultValue={editingData?.nominal} placeholder="10000" className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm outline-none" />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Keterangan / Keperluan</label>
                <input required name="keterangan" defaultValue={editingData?.keterangan} placeholder="Misal: Print Kartu Iuran / Pembelian Bambu Tenda" className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm outline-none" />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Link Bukti Transfer / Nota (Google Drive / URL)</label>
                <input name="bukti_transfer" defaultValue={editingData?.bukti_transfer} placeholder="https://drive.google.com/..." className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm outline-none" />
              </div>

              <div className="pt-4 flex justify-end space-x-2">
                <button type="button" onClick={() => { setShowFormModal(false); setEditingData(null); }} className="px-4 py-2 border border-slate-200 rounded-lg text-sm font-medium text-slate-600">
                  Batal
                </button>
                <button type="submit" className="px-4 py-2 bg-primary-600 text-white rounded-lg text-sm font-medium">
                  Simpan Transaksi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};