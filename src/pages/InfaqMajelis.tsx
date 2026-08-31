import React, { useEffect, useState } from 'react';
import { supabase, isSupabaseConfigured } from '../supabase';
import { InfaqMajelis, formatRupiah, Pengguna, Warga } from '../types';
import { Plus, Search, X, ExternalLink, Trash2 } from 'lucide-react';
import { WargaSearchSelect } from '../components/WargaSearchSelect';

export const InfaqMajelisPage: React.FC<{ currentUser?: Pengguna }> = ({ currentUser }) => {
  const [dataList, setDataList] = useState<InfaqMajelis[]>([]);
  const [wargaList, setWargaList] = useState<Warga[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [search, setSearch] = useState('');
  const [isWargaDonor, setIsWargaDonor] = useState(true);

  const [formData, setFormData] = useState({
    id_warga: '',
    nama_donatur_luar: '',
    nama_acara: 'Pengajian Rutin Bulanan',
    tanggal: new Date().toISOString().slice(0, 10),
    nominal: 50000,
    jenis_dana: 'Pemasukan' as 'Pemasukan' | 'Pengeluaran',
    keterangan: '',
    bukti_nota: '',
  });

  const canEdit = !currentUser || currentUser.peran === 'Super_Admin' || currentUser.peran === 'Admin_Keuangan';

  const loadData = async () => {
    setLoading(true);
    let loaded: InfaqMajelis[] = [];
    let loadedWarga: Warga[] = [];

    if (isSupabaseConfigured) {
      try {
        const [resMajelis, resWarga] = await Promise.all([
          supabase.from('infaq_majelis_albarokah').select('*').order('tanggal', { ascending: false }),
          supabase.from('warga').select('*').order('id_rumah', { ascending: true }),
        ]);
        if (!resMajelis.error && resMajelis.data) loaded = resMajelis.data;
        if (!resWarga.error && resWarga.data) loadedWarga = resWarga.data;
      } catch (err) {
        console.warn(err);
      }
    }

    if (loaded.length === 0) {
      const local = localStorage.getItem('local_majelis');
      if (local) loaded = JSON.parse(local);
    }
    if (loadedWarga.length === 0) {
      const localW = localStorage.getItem('local_warga');
      if (localW) loadedWarga = JSON.parse(localW);
    }

    setDataList(loaded);
    setWargaList(loadedWarga);
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
    let finalDonorName = formData.nama_donatur_luar;

    if (isWargaDonor && formData.id_warga) {
      const found = wargaList.find(w => String(w.id_warga) === String(formData.id_warga));
      if (found) finalDonorName = `${found.nama_lengkap} (${found.id_rumah})`;
    }

    if (!finalDonorName) {
      alert('Silakan pilih warga atau masukkan nama donatur!');
      return;
    }

    const entry: InfaqMajelis = {
      id_infaq: Date.now(),
      id_warga: isWargaDonor && formData.id_warga ? Number(formData.id_warga) : undefined,
      nama_donatur_luar: finalDonorName,
      nama_acara: formData.nama_acara,
      tanggal: formData.tanggal,
      nominal: Number(formData.nominal),
      jenis_dana: formData.jenis_dana,
      keterangan: formData.keterangan || `Infaq Majelis - ${finalDonorName}`,
      bukti_nota: formData.bukti_nota,
    };

    if (isSupabaseConfigured) {
      await supabase.from('infaq_majelis_albarokah').insert([entry]);
    }

    const updated = [entry, ...dataList];
    setDataList(updated);
    localStorage.setItem('local_majelis', JSON.stringify(updated));
    setShowModal(false);
    setFormData({
      id_warga: '',
      nama_donatur_luar: '',
      nama_acara: 'Pengajian Rutin Bulanan',
      tanggal: new Date().toISOString().slice(0, 10),
      nominal: 50000,
      jenis_dana: 'Pemasukan',
      keterangan: '',
      bukti_nota: '',
    });
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Hapus data infaq majelis ini?')) return;
    if (isSupabaseConfigured) {
      await supabase.from('infaq_majelis_albarokah').delete().eq('id_infaq', id);
    }
    const updated = dataList.filter(d => d.id_infaq !== id);
    setDataList(updated);
    localStorage.setItem('local_majelis', JSON.stringify(updated));
  };

  const filtered = dataList.filter(d =>
    (d.nama_acara?.toLowerCase() || '').includes(search.toLowerCase()) ||
    (d.nama_donatur_luar?.toLowerCase() || '').includes(search.toLowerCase()) ||
    (d.keterangan?.toLowerCase() || '').includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Infaq Majelis Al Barokah</h2>
          <p className="text-xs text-slate-500 mt-0.5">Pencatatan dana pengajian rutin dan acara besar Islam (PHBI).</p>
        </div>
        {canEdit && (
          <button onClick={() => setShowModal(true)} className="flex items-center space-x-2 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold rounded-xl shadow-sm">
            <Plus className="w-4 h-4" />
            <span>Catat Infaq Majelis</span>
          </button>
        )}
      </div>

      <div className="relative">
        <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          placeholder="Cari acara / donatur / keterangan..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-xs outline-none focus:border-teal-500"
        />
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 border-b text-[10px] uppercase font-bold text-slate-500">
              <tr>
                <th className="px-3 py-3.5 text-center w-12">No.</th>
                <th className="px-4 py-3.5 min-w-[90px]">Tanggal</th>
                <th className="px-4 py-3.5 min-w-[160px]">Nama Acara / Kegiatan</th>
                <th className="px-4 py-3.5 min-w-[140px]">Donatur / Jamaah</th>
                <th className="px-4 py-3.5 text-right min-w-[100px]">Nominal</th>
                <th className="px-4 py-3.5 text-center min-w-[80px]">Bukti</th>
                {canEdit && <th className="px-4 py-3.5 text-right min-w-[60px]">Aksi</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr><td colSpan={canEdit ? 7 : 6} className="px-4 py-8 text-center text-slate-400">Memuat infaq majelis...</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={canEdit ? 7 : 6} className="px-4 py-8 text-center text-slate-400">Belum ada catatan infaq majelis.</td></tr>
              ) : (
                filtered.map((item, idx) => (
                  <tr key={item.id_infaq} className="hover:bg-slate-50">
                    <td className="px-3 py-3.5 text-center font-mono text-slate-400 text-xs">{idx + 1}</td>
                    <td className="px-4 py-3.5 font-mono text-slate-500">{item.tanggal}</td>
                    <td className="px-4 py-3.5 font-bold text-slate-900">{item.nama_acara}</td>
                    <td className="px-4 py-3.5 text-teal-700 font-medium">{item.nama_donatur_luar || '-'}</td>
                    <td className="px-4 py-3.5 text-right font-black text-emerald-600">+{formatRupiah(item.nominal)}</td>
                    <td className="px-4 py-3.5 text-center">
                      {item.bukti_nota && item.bukti_nota.startsWith('http') ? (
                        <a href={item.bukti_nota} target="_blank" rel="noreferrer" className="text-teal-600 hover:underline inline-flex items-center space-x-1">
                          <ExternalLink className="w-3.5 h-3.5" />
                          <span>Link</span>
                        </a>
                      ) : '-'}
                    </td>
                    {canEdit && (
                      <td className="px-4 py-3.5 text-right">
                        <button onClick={() => handleDelete(item.id_infaq)} className="p-1 text-slate-400 hover:text-red-600">
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

      {/* Modal Input Infaq Majelis dengan Search Warga */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center p-4 z-50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="font-bold text-slate-800 text-sm">Catat Infaq Majelis Al Barokah</h3>
              <button onClick={() => setShowModal(false)}><X className="w-4 h-4" /></button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-600 mb-1">Nama Acara / Kegiatan *</label>
                <input required type="text" value={formData.nama_acara} onChange={(e) => setFormData({ ...formData, nama_acara: e.target.value })} className="w-full px-3 py-2 border rounded-xl font-medium" />
              </div>

              {/* Toggle Donatur: Warga Beryl atau Donatur Luar */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="font-bold text-slate-600">Sumber Donatur</span>
                  <div className="flex space-x-2">
                    <button
                      type="button"
                      onClick={() => setIsWargaDonor(true)}
                      className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${isWargaDonor ? 'bg-teal-600 text-white' : 'bg-slate-100 text-slate-600'}`}
                    >
                      Warga Beryl
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsWargaDonor(false)}
                      className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${!isWargaDonor ? 'bg-teal-600 text-white' : 'bg-slate-100 text-slate-600'}`}
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
                    placeholder="Ketik nama warga atau blok..."
                  />
                ) : (
                  <input
                    type="text"
                    placeholder="Misal: Hamba Allah / Tamu Luar"
                    value={formData.nama_donatur_luar}
                    onChange={(e) => setFormData({ ...formData, nama_donatur_luar: e.target.value })}
                    className="w-full px-3 py-2 border rounded-xl"
                  />
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-600 mb-1">Tanggal</label>
                  <input required type="date" value={formData.tanggal} onChange={(e) => setFormData({ ...formData, tanggal: e.target.value })} className="w-full px-3 py-2 border rounded-xl" />
                </div>
                <div>
                  <label className="block font-bold text-slate-600 mb-1">Nominal (Rp) *</label>
                  <input required type="number" step="5000" value={formData.nominal} onChange={(e) => setFormData({ ...formData, nominal: Number(e.target.value) })} className="w-full px-3 py-2 border rounded-xl font-bold text-emerald-600" />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-600 mb-1">Keterangan Tambahan</label>
                <input type="text" placeholder="Infaq konsumsi / sound / dll" value={formData.keterangan} onChange={(e) => setFormData({ ...formData, keterangan: e.target.value })} className="w-full px-3 py-2 border rounded-xl" />
              </div>

              <div className="flex justify-end space-x-2 pt-3 border-t">
                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 border rounded-xl font-bold">Batal</button>
                <button type="submit" className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl font-bold">Simpan Infaq</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default InfaqMajelisPage;