import React, { useEffect, useState } from 'react';
import { supabase, isSupabaseConfigured } from '../supabase';
import { Pengeluaran, PosPengeluaran, formatRupiah, Pengguna } from '../types';
import { Plus, Search, X, ExternalLink, Trash2 } from 'lucide-react';

export const PengeluaranPage: React.FC<{ currentUser?: Pengguna }> = ({ currentUser }) => {
  const [dataList, setDataList] = useState<Pengeluaran[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [search, setSearch] = useState('');
  const [filterPos, setFilterPos] = useState<string>('Semua');

  const [formData, setFormData] = useState({
    pos_anggaran: 'Operasional_Warga' as PosPengeluaran,
    tanggal: new Date().toISOString().slice(0, 10),
    keperluan: '',
    nominal: 50000,
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
        if (!error && data && data.length > 0) loaded = data;
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const entry: Pengeluaran = {
      id_pengeluaran: Date.now(),
      ...formData,
      nominal: Number(formData.nominal),
    };

    if (isSupabaseConfigured) {
      await supabase.from('pengeluaran').insert([entry]);
    }

    const updated = [entry, ...dataList];
    setDataList(updated);
    localStorage.setItem('local_pengeluaran', JSON.stringify(updated));
    setShowModal(false);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Hapus data pengeluaran ini?')) return;
    if (isSupabaseConfigured) {
      await supabase.from('pengeluaran').delete().eq('id_pengeluaran', id);
    }
    const updated = dataList.filter(d => d.id_pengeluaran !== id);
    setDataList(updated);
    localStorage.setItem('local_pengeluaran', JSON.stringify(updated));
  };

  const filtered = dataList.filter(d => {
    const q = search.toLowerCase();
    const matchSearch = (d.keperluan?.toLowerCase() || '').includes(q);
    const matchPos = filterPos === 'Semua' || d.pos_anggaran === filterPos;
    return matchSearch && matchPos;
  });

  const totalOperasional = dataList.filter(d => d.pos_anggaran === 'Operasional_Warga').reduce((a, b) => a + Number(b.nominal), 0);
  const totalSosial = dataList.filter(d => d.pos_anggaran === 'Sosial_Warga').reduce((a, b) => a + Number(b.nominal), 0);
  const totalMajelis = dataList.filter(d => d.pos_anggaran === 'Acara_Majelis_Albarokah').reduce((a, b) => a + Number(b.nominal), 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Pengeluaran Terpadu</h2>
          <p className="text-xs text-slate-500 mt-0.5">Klasifikasi biaya: Operasional Warga, Sosial Warga, dan Acara Majelis Al Barokah.</p>
        </div>
        {canEdit && (
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center space-x-2 px-4 py-2.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl shadow-sm transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Catat Pengeluaran</span>
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-[10px] font-bold text-slate-400 uppercase">Pos Operasional Warga</span>
          <p className="text-lg font-black text-slate-800 mt-1">{formatRupiah(totalOperasional)}</p>
          <span className="text-[10px] text-slate-400">Listrik, Tenda, Perlengkapan</span>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-[10px] font-bold text-rose-500 uppercase">Pos Sosial Warga</span>
          <p className="text-lg font-black text-rose-600 mt-1">{formatRupiah(totalSosial)}</p>
          <span className="text-[10px] text-slate-400">Santunan Sakit & Takziah</span>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-[10px] font-bold text-teal-600 uppercase">Pos Majelis Al Barokah</span>
          <p className="text-lg font-black text-teal-700 mt-1">{formatRupiah(totalMajelis)}</p>
          <span className="text-[10px] text-slate-400">Penceramah, Konsumsi, PHBI</span>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Cari keterangan keperluan pengeluaran..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs outline-none focus:border-rose-500 shadow-2xs"
          />
        </div>
        <select
          value={filterPos}
          onChange={e => setFilterPos(e.target.value)}
          className="px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold outline-none text-slate-700"
        >
          <option value="Semua">Semua Pos Anggaran</option>
          <option value="Operasional_Warga">Operasional Warga</option>
          <option value="Sosial_Warga">Sosial Warga</option>
          <option value="Acara_Majelis_Albarokah">Acara Majelis Al Barokah</option>
        </select>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 border-b text-[10px] uppercase font-bold text-slate-500">
              <tr>
                <th className="px-3 py-3.5 text-center w-12">No.</th>
                <th className="px-4 py-3.5 min-w-[90px]">Tanggal</th>
                <th className="px-4 py-3.5 min-w-[140px]">Pos Anggaran</th>
                <th className="px-4 py-3.5 min-w-[180px]">Keperluan</th>
                <th className="px-4 py-3.5 text-right min-w-[100px]">Nominal</th>
                <th className="px-4 py-3.5 text-center min-w-[80px]">Bukti Nota</th>
                {canEdit && <th className="px-4 py-3.5 text-right min-w-[60px]">Aksi</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr><td colSpan={canEdit ? 7 : 6} className="px-4 py-8 text-center text-slate-400">Memuat pengeluaran...</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={canEdit ? 7 : 6} className="px-4 py-8 text-center text-slate-400">Belum ada data pengeluaran.</td></tr>
              ) : filtered.map((d, idx) => (
                <tr key={d.id_pengeluaran} className="hover:bg-slate-50">
                  <td className="px-3 py-3.5 text-center font-mono text-slate-400 text-xs">{idx + 1}</td>
                  <td className="px-4 py-3.5 font-mono text-slate-500">{d.tanggal}</td>
                  <td className="px-4 py-3.5">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      d.pos_anggaran === 'Operasional_Warga' ? 'bg-slate-100 text-slate-700' :
                      d.pos_anggaran === 'Sosial_Warga' ? 'bg-rose-100 text-rose-700' : 'bg-teal-100 text-teal-700'
                    }`}>
                      {d.pos_anggaran.replace(/_/g, ' ')}
                    </span>
                  </td>
                  <td className="px-4 py-3.5 font-medium text-slate-800">{d.keperluan}</td>
                  <td className="px-4 py-3.5 text-right font-black text-rose-600">-{formatRupiah(d.nominal)}</td>
                  <td className="px-4 py-3.5 text-center">
                    {d.bukti_nota && d.bukti_nota.startsWith('http') ? (
                      <a href={d.bukti_nota} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline inline-flex items-center space-x-1">
                        <ExternalLink className="w-3.5 h-3.5" />
                        <span>Nota</span>
                      </a>
                    ) : '-'}
                  </td>
                  {canEdit && (
                    <td className="px-4 py-3.5 text-right">
                      <button onClick={() => handleDelete(d.id_pengeluaran)} className="p-1 text-slate-400 hover:text-red-600">
                        <Trash2 className="w-3.5 h-3.5 inline" />
                      </button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center p-4 z-50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 space-y-4">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="font-bold text-slate-800 text-sm">Catat Pengeluaran Baru</h3>
              <button onClick={() => setShowModal(false)}><X className="w-4 h-4" /></button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-600 mb-1">Pos Anggaran *</label>
                <select
                  value={formData.pos_anggaran}
                  onChange={e => setFormData({ ...formData, pos_anggaran: e.target.value as PosPengeluaran })}
                  className="w-full px-3 py-2 border rounded-xl outline-none font-bold"
                >
                  <option value="Operasional_Warga">Operasional Warga</option>
                  <option value="Sosial_Warga">Sosial Warga (Santunan)</option>
                  <option value="Acara_Majelis_Albarokah">Acara Majelis Al Barokah (PHBI/Pengajian)</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-600 mb-1">Tanggal</label>
                  <input
                    required
                    type="date"
                    value={formData.tanggal}
                    onChange={e => setFormData({ ...formData, tanggal: e.target.value })}
                    className="w-full px-3 py-2 border rounded-xl outline-none"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-600 mb-1">Nominal (Rp) *</label>
                  <input
                    required
                    type="number"
                    step="1000"
                    value={formData.nominal}
                    onChange={e => setFormData({ ...formData, nominal: Number(e.target.value) })}
                    className="w-full px-3 py-2 border rounded-xl outline-none font-black text-rose-600"
                  />
                </div>
              </div>
              <div>
                <label className="block font-bold text-slate-600 mb-1">Keperluan / Keterangan *</label>
                <input
                  required
                  type="text"
                  placeholder="Misal: Beli mic wireless / Santunan sakit"
                  value={formData.keperluan}
                  onChange={e => setFormData({ ...formData, keperluan: e.target.value })}
                  className="w-full px-3 py-2 border rounded-xl outline-none"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-600 mb-1">Link Bukti Nota (Google Drive/URL)</label>
                <input
                  type="text"
                  placeholder="https://drive.google.com/..."
                  value={formData.bukti_nota}
                  onChange={e => setFormData({ ...formData, bukti_nota: e.target.value })}
                  className="w-full px-3 py-2 border rounded-xl outline-none"
                />
              </div>
              <div className="flex justify-end space-x-2 pt-3 border-t">
                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 border rounded-xl font-bold">Batal</button>
                <button type="submit" className="px-4 py-2 bg-rose-600 text-white rounded-xl font-bold">Simpan Pengeluaran</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};