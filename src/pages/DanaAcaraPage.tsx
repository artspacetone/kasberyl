import React, { useEffect, useState, useMemo } from 'react';
import { supabase, isSupabaseConfigured } from '../supabase';
import { DanaAcara, formatRupiah, Pengguna, Warga } from '../types';
import { 
  Calendar, Plus, Search, X, ExternalLink, Trash2, 
  TrendingUp, TrendingDown, Scale, Users, Gift, Sparkles 
} from 'lucide-react';
import { WargaSearchSelect } from '../components/WargaSearchSelect';

export const DanaAcaraPage: React.FC<{ currentUser?: Pengguna }> = ({ currentUser }) => {
  const [dataList, setDataList] = useState<DanaAcara[]>([]);
  const [wargaList, setWargaList] = useState<Warga[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [search, setSearch] = useState('');
  const [filterAcara, setFilterAcara] = useState<string>('Semua');
  const [filterKategori, setFilterKategori] = useState<string>('Semua');
  const [isWargaDonor, setIsWargaDonor] = useState(true);

  const [formData, setFormData] = useState({
    nama_acara: 'Acara Silaturahmi Paguyuban Beryl',
    kategori: 'Pemasukan' as 'Pemasukan' | 'Pengeluaran',
    pos_sub_anggaran: 'Donasi Sukarela',
    id_warga: '',
    nama_donatur_luar: '',
    tanggal: new Date().toISOString().slice(0, 10),
    nominal: 50000,
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
          supabase.from('dana_acara').select('*, warga(nama_lengkap, id_rumah)').order('tanggal', { ascending: false }),
          supabase.from('warga').select('*').order('id_rumah', { ascending: true }),
        ]);

        if (resDana.data) {
          loadedDana = resDana.data.map((d: any) => ({
            ...d,
            nama_warga: d.warga?.nama_lengkap || d.nama_donatur_luar,
            id_rumah: d.warga?.id_rumah,
          }));
        }
        if (resWarga.data) loadedWarga = resWarga.data;
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

  // Daftar Acara Unik
  const uniqueAcaraList = useMemo(() => {
    const set = new Set<string>();
    dataList.forEach(d => {
      if (d.nama_acara) set.add(d.nama_acara.trim());
    });
    return Array.from(set);
  }, [dataList]);

  // Statistik Dana Acara
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    let finalDonorName = formData.nama_donatur_luar;
    let selectedWargaObj: Warga | undefined;

    if (formData.kategori === 'Pemasukan') {
      if (isWargaDonor && formData.id_warga) {
        selectedWargaObj = wargaList.find(w => String(w.id_warga) === String(formData.id_warga));
        if (selectedWargaObj) {
          finalDonorName = `${selectedWargaObj.nama_lengkap} (${selectedWargaObj.id_rumah})`;
        }
      }
      if (!finalDonorName) {
        alert('Silakan pilih warga donatur atau masukkan nama donatur luar!');
        return;
      }
    }

    const entry: any = {
      id_transaksi: Date.now(),
      nama_acara: formData.nama_acara.trim(),
      kategori: formData.kategori,
      pos_sub_anggaran: formData.pos_sub_anggaran,
      id_warga: formData.kategori === 'Pemasukan' && isWargaDonor && formData.id_warga ? Number(formData.id_warga) : null,
      nama_warga: selectedWargaObj?.nama_lengkap || finalDonorName,
      id_rumah: selectedWargaObj?.id_rumah,
      nama_donatur_luar: finalDonorName,
      tanggal: formData.tanggal,
      nominal: Number(formData.nominal),
      keterangan: formData.keterangan || (formData.kategori === 'Pemasukan' ? `Donasi Acara - ${finalDonorName}` : formData.pos_sub_anggaran),
      bukti_nota: formData.bukti_nota,
      diinput_oleh: currentUser?.id_pengguna || 1,
    };

    if (isSupabaseConfigured) {
      const { data, error } = await supabase.from('dana_acara').insert([entry]).select();
      if (!error && data && data[0]) {
        entry.id_transaksi = data[0].id_transaksi;
      }
    }

    const updated = [entry, ...dataList];
    setDataList(updated);
    localStorage.setItem('local_dana_acara', JSON.stringify(updated));
    setShowModal(false);

    setFormData({
      nama_acara: formData.nama_acara,
      kategori: 'Pemasukan',
      pos_sub_anggaran: 'Donasi Sukarela',
      id_warga: '',
      nama_donatur_luar: '',
      tanggal: new Date().toISOString().slice(0, 10),
      nominal: 50000,
      keterangan: '',
      bukti_nota: '',
    });
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Hapus data transaksi acara ini?')) return;
    if (isSupabaseConfigured) {
      await supabase.from('dana_acara').delete().eq('id_transaksi', id);
    }
    const updated = dataList.filter(d => d.id_transaksi !== id);
    setDataList(updated);
    localStorage.setItem('local_dana_acara', JSON.stringify(updated));
  };

  const filteredData = dataList.filter(d => {
    const q = search.toLowerCase();
    const matchSearch = (d.nama_acara?.toLowerCase() || '').includes(q) ||
      (d.nama_warga?.toLowerCase() || '').includes(q) ||
      (d.keterangan?.toLowerCase() || '').includes(q) ||
      (d.pos_sub_anggaran?.toLowerCase() || '').includes(q);
    const matchAcara = filterAcara === 'Semua' || d.nama_acara === filterAcara;
    const matchKategori = filterKategori === 'Semua' || d.kategori === filterKategori;
    return matchSearch && matchAcara && matchKategori;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="p-2 bg-purple-100 text-purple-700 rounded-xl">
              <Calendar className="w-5 h-5" />
            </span>
            <h2 className="text-xl font-black text-slate-800 tracking-tight">Dana Acara Paguyuban Beryl</h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Pengelolaan donasi sukarela & pengeluaran kegiatan warga (Silaturahmi, Turnamen, HUT RI, Gathering).
          </p>
        </div>
        {canEdit && (
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center space-x-2 px-4 py-2.5 bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold rounded-xl shadow-sm transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Catat Transaksi Acara</span>
          </button>
        )}
      </div>

      {/* 4 Kartu KPI Ringkasan Khusus Acara */}
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
          <span className="text-[10px] text-slate-400">Tenda, Catering, Logistik, Hadiah</span>
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
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Status Acara Dipilih</span>
            <Sparkles className="w-4 h-4 text-amber-500" />
          </div>
          <p className="text-sm font-bold text-slate-800 mt-2 truncate">{filterAcara}</p>
          <span className="text-[10px] text-slate-400">Terpisah dari Kas Iuran Warga</span>
        </div>
      </div>

      {/* Bar Filter & Pencarian */}
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
          className="px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold outline-none text-slate-700"
        >
          <option value="Semua">Semua Nama Acara ({dataList.length})</option>
          {uniqueAcaraList.map(a => (
            <option key={a} value={a}>{a}</option>
          ))}
        </select>

        <select
          value={filterKategori}
          onChange={(e) => setFilterKategori(e.target.value)}
          className="px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold outline-none text-slate-700"
        >
          <option value="Semua">Semua Jenis (Masuk/Keluar)</option>
          <option value="Pemasukan">Pemasukan (Donasi)</option>
          <option value="Pengeluaran">Pengeluaran (Biaya Acara)</option>
        </select>
      </div>

      {/* Tabel Data Transaksi Acara */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 border-b text-[10px] uppercase font-bold text-slate-500">
              <tr>
                <th className="px-3 py-3.5 text-center w-12">No.</th>
                <th className="px-4 py-3.5 min-w-[90px]">Tanggal</th>
                <th className="px-4 py-3.5 min-w-[160px]">Nama Acara</th>
                <th className="px-4 py-3.5 min-w-[150px]">Donatur / Keperluan</th>
                <th className="px-4 py-3.5 min-w-[120px]">Sub-Anggaran</th>
                <th className="px-4 py-3.5 text-right min-w-[110px]">Nominal</th>
                <th className="px-4 py-3.5 text-center min-w-[80px]">Bukti</th>
                {canEdit && <th className="px-4 py-3.5 text-right min-w-[60px]">Aksi</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr><td colSpan={canEdit ? 8 : 7} className="px-4 py-8 text-center text-slate-400">Memuat data acara...</td></tr>
              ) : filteredData.length === 0 ? (
                <tr><td colSpan={canEdit ? 8 : 7} className="px-4 py-8 text-center text-slate-400">Belum ada catatan transaksi untuk acara ini.</td></tr>
              ) : (
                filteredData.map((item, idx) => (
                  <tr key={item.id_transaksi} className="hover:bg-slate-50">
                    <td className="px-3 py-3.5 text-center font-mono text-slate-400 text-xs">{idx + 1}</td>
                    <td className="px-4 py-3.5 font-mono text-slate-500">{item.tanggal}</td>
                    <td className="px-4 py-3.5 font-bold text-slate-900">{item.nama_acara}</td>
                    <td className="px-4 py-3.5 font-medium text-slate-800">
                      {item.kategori === 'Pemasukan' ? (
                        <span className="text-emerald-700 flex items-center space-x-1">
                          <Gift className="w-3.5 h-3.5 shrink-0" />
                          <span>{item.nama_warga || item.nama_donatur_luar}</span>
                        </span>
                      ) : (
                        <span>{item.keterangan}</span>
                      )}
                    </td>
                    <td className="px-4 py-3.5">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                        item.kategori === 'Pemasukan' ? 'bg-emerald-100 text-emerald-700' : 'bg-purple-100 text-purple-700'
                      }`}>
                        {item.pos_sub_anggaran || (item.kategori === 'Pemasukan' ? 'Donasi' : 'Biaya')}
                      </span>
                    </td>
                    <td className={`px-4 py-3.5 text-right font-black font-mono ${
                      item.kategori === 'Pemasukan' ? 'text-emerald-600' : 'text-rose-600'
                    }`}>
                      {item.kategori === 'Pemasukan' ? '+' : '-'}{formatRupiah(item.nominal)}
                    </td>
                    <td className="px-4 py-3.5 text-center">
                      {item.bukti_nota && item.bukti_nota.startsWith('http') ? (
                        <a href={item.bukti_nota} target="_blank" rel="noreferrer" className="text-purple-600 hover:underline inline-flex items-center space-x-1">
                          <ExternalLink className="w-3.5 h-3.5" />
                          <span>Nota</span>
                        </a>
                      ) : '-'}
                    </td>
                    {canEdit && (
                      <td className="px-4 py-3.5 text-right">
                        <button onClick={() => handleDelete(item.id_transaksi)} className="p-1 text-slate-400 hover:text-rose-600" title="Hapus">
                          <Trash2 className="w-3.5 h-3.5 inline" />
                        </button>
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Input Transaksi Acara */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center p-4 z-50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="font-bold text-slate-800 text-sm">Catat Transaksi Dana Acara</h3>
              <button onClick={() => setShowModal(false)}><X className="w-4 h-4" /></button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-600 mb-1">Nama Acara / Kegiatan *</label>
                <input
                  required
                  type="text"
                  placeholder="Misal: Acara Silaturahmi Paguyuban Beryl"
                  value={formData.nama_acara}
                  onChange={(e) => setFormData({ ...formData, nama_acara: e.target.value })}
                  className="w-full px-3 py-2 border rounded-xl font-bold"
                />
              </div>

              {/* Pilihan Kategori: Pemasukan (Donasi) atau Pengeluaran (Biaya) */}
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, kategori: 'Pemasukan', pos_sub_anggaran: 'Donasi Sukarela' })}
                  className={`py-2 rounded-xl text-xs font-bold transition-all ${
                    formData.kategori === 'Pemasukan' ? 'bg-emerald-600 text-white shadow-xs' : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  + Pemasukan (Donasi)
                </button>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, kategori: 'Pengeluaran', pos_sub_anggaran: 'Sewa Tenda' })}
                  className={`py-2 rounded-xl text-xs font-bold transition-all ${
                    formData.kategori === 'Pengeluaran' ? 'bg-rose-600 text-white shadow-xs' : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  - Pengeluaran (Biaya)
                </button>
              </div>

              {formData.kategori === 'Pemasukan' ? (
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="font-bold text-slate-600">Donatur Acara</span>
                    <div className="flex space-x-1.5">
                      <button
                        type="button"
                        onClick={() => setIsWargaDonor(true)}
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${isWargaDonor ? 'bg-purple-600 text-white' : 'bg-slate-100 text-slate-600'}`}
                      >
                        Warga Beryl
                      </button>
                      <button
                        type="button"
                        onClick={() => setIsWargaDonor(false)}
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${!isWargaDonor ? 'bg-purple-600 text-white' : 'bg-slate-100 text-slate-600'}`}
                      >
                        Donatur Luar
                      </button>
                    </div>
                  </div>

                  {isWargaDonor ? (
                    <WargaSearchSelect
                      wargaList={wargaList}
                      selectedId={formData.id_warga}
                      onSelect={(w) => setFormData({ ...formData, id_warga: w ? String(w.id_warga) : '' })}
                      label=""
                      placeholder="Ketik nama warga atau nomor unit blok..."
                    />
                  ) : (
                    <input
                      type="text"
                      placeholder="Misal: PT PMM / Sponsor Luar / Hamba Allah"
                      value={formData.nama_donatur_luar}
                      onChange={(e) => setFormData({ ...formData, nama_donatur_luar: e.target.value })}
                      className="w-full px-3 py-2 border rounded-xl"
                    />
                  )}
                </div>
              ) : (
                <div>
                  <label className="block font-bold text-slate-600 mb-1">Sub-Pos Pengeluaran Acara</label>
                  <select
                    value={formData.pos_sub_anggaran}
                    onChange={(e) => setFormData({ ...formData, pos_sub_anggaran: e.target.value })}
                    className="w-full px-3 py-2 border rounded-xl outline-none font-medium"
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
                  <label className="block font-bold text-slate-600 mb-1">Tanggal</label>
                  <input
                    required
                    type="date"
                    value={formData.tanggal}
                    onChange={(e) => setFormData({ ...formData, tanggal: e.target.value })}
                    className="w-full px-3 py-2 border rounded-xl outline-none"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-600 mb-1">Nominal (Rp) *</label>
                  <input
                    required
                    type="number"
                    step="5000"
                    value={formData.nominal}
                    onChange={(e) => setFormData({ ...formData, nominal: Number(e.target.value) })}
                    className="w-full px-3 py-2 border rounded-xl font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-600 mb-1">Keterangan / Rincian</label>
                <input
                  type="text"
                  placeholder="Misal: Sewa tenda 2 set + karpet"
                  value={formData.keterangan}
                  onChange={(e) => setFormData({ ...formData, keterangan: e.target.value })}
                  className="w-full px-3 py-2 border rounded-xl outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-600 mb-1">Link Bukti Nota / Transfer</label>
                <input
                  type="text"
                  placeholder="https://drive.google.com/..."
                  value={formData.bukti_nota}
                  onChange={(e) => setFormData({ ...formData, bukti_nota: e.target.value })}
                  className="w-full px-3 py-2 border rounded-xl outline-none"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-3 border-t">
                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 border rounded-xl font-bold">Batal</button>
                <button type="submit" className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-bold">Simpan Transaksi</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default DanaAcaraPage;