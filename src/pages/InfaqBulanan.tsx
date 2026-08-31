// src/pages/InfaqBulanan.tsx
import React, { useEffect, useState } from 'react';
import { supabase, isSupabaseConfigured } from '../supabase';
import { Warga, KasWargaBeryl, formatRupiah, NAMA_BULAN, Pengguna } from '../types';
import { CheckCircle2, Search, Plus, X, FileSpreadsheet, Share2 } from 'lucide-react';
import { WargaSearchSelect } from '../components/WargaSearchSelect';
import { exportMatriksKasToExcel } from '../utils/exportManager';
import { KuitansiModal, KuitansiData } from '../components/KuitansiModal';

export const InfaqBulananPage: React.FC<{ currentUser?: Pengguna }> = ({ currentUser }) => {
  const [wargaList, setWargaList] = useState<Warga[]>([]);
  const [kasList, setKasList] = useState<KasWargaBeryl[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedYear, setSelectedYear] = useState<number>(2026);
  const [showManualModal, setShowManualModal] = useState(false);
  const [activeKuitansi, setActiveKuitansi] = useState<KuitansiData | null>(null);

  const isGuest = !currentUser || currentUser.id_pengguna === 0 || currentUser.peran === 'Warga';
  const canEdit = !isGuest && (currentUser.peran === 'Super_Admin' || currentUser.peran === 'Admin_Keuangan');

  const [formManual, setFormManual] = useState({
    id_warga: '',
    bulan: 1,
    nominal: 10000,
    tanggal: new Date().toISOString().slice(0, 10),
    keterangan: 'Iuran Kas Warga',
  });

  const loadData = async () => {
    setLoading(true);
    let loadedWarga: Warga[] = [];
    let loadedKas: KasWargaBeryl[] = [];

    if (isSupabaseConfigured) {
      try {
        const [resWarga, resKas] = await Promise.all([
          supabase.from('warga').select('*').order('id_rumah', { ascending: true }),
          supabase.from('kas_warga_beryl').select('*'),
        ]);
        if (resWarga.data && resWarga.data.length > 0) loadedWarga = resWarga.data;
        if (resKas.data && resKas.data.length > 0) loadedKas = resKas.data;
      } catch (err: any) {
        console.warn('Fallback offline InfaqBulanan:', err.message);
      }
    }

    if (loadedWarga.length === 0) {
      const localW = localStorage.getItem('local_warga');
      if (localW) loadedWarga = JSON.parse(localW);
    }
    if (loadedKas.length === 0) {
      const localK = localStorage.getItem('local_kas');
      if (localK) loadedKas = JSON.parse(localK);
    }

    setWargaList(loadedWarga);
    setKasList(loadedKas);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
    const handleUpdate = () => loadData();
    window.addEventListener('app_data_updated', handleUpdate);
    return () => window.removeEventListener('app_data_updated', handleUpdate);
  }, []);

  const handleToggleMonth = async (idWarga: number, bulan: number) => {
    const monthCode = String(bulan).padStart(2, '0');
    const found = kasList.find(k => k.id_warga === idWarga && k.periode_bulan?.startsWith(`${selectedYear}-${monthCode}`) && k.status_bayar === 'Lunas');

    const wargaObj = wargaList.find(w => w.id_warga === idWarga);

    if (found) {
      // Jika sudah lunas: Buka Kuitansi Langsung (Bisa untuk Tamu / Pengurus)
      const kData: KuitansiData = {
        noKuitansi: `KAS/BERYL/${selectedYear}${monthCode}/${found.id_transaksi || found.id_warga}`,
        jenisTransaksi: 'Iuran Kas Warga (Rp 10.000)',
        namaWarga: wargaObj?.nama_lengkap || 'Warga Beryl',
        idRumah: wargaObj?.id_rumah || '-',
        noHp: wargaObj?.no_hp,
        tanggalBayar: found.tanggal || new Date().toISOString().slice(0, 10),
        nominal: Number(found.nominal || 10000),
        periodeAtauKeperluan: `Iuran Bulan ${NAMA_BULAN[bulan - 1]} ${selectedYear}`,
        namaPenerima: currentUser?.nama_lengkap || 'Bendahara Paguyuban',
      };
      setActiveKuitansi(kData);
    } else {
      if (!canEdit) return;
      if (!confirm(`Catat Iuran Kas Rp 10.000 untuk bulan ${NAMA_BULAN[bulan - 1]} ${selectedYear}?`)) return;
      
      const tanggalBayar = new Date().toISOString().slice(0, 10);
      const periodeBulan = `${selectedYear}-${monthCode}-01`;
      const newRecord: any = {
        id_transaksi: Date.now(),
        id_warga: idWarga,
        periode_bulan: periodeBulan,
        tanggal: tanggalBayar,
        nominal: 10000,
        peruntukan: 'Operasional dan Sosial',
        status_bayar: 'Lunas',
        keterangan: `Iuran Kas Warga (${NAMA_BULAN[bulan - 1]} ${selectedYear})`,
        bukti_transfer: 'Bayar Tunai/Cepat',
      };

      if (isSupabaseConfigured) {
        const { data } = await supabase.from('kas_warga_beryl').insert([{
          id_warga: idWarga,
          periode_bulan: periodeBulan,
          tanggal: tanggalBayar,
          nominal: 10000,
          peruntukan: 'Operasional dan Sosial',
          status_bayar: 'Lunas',
          keterangan: newRecord.keterangan,
          bukti_transfer: 'Bayar Tunai/Cepat'
        }]).select();
        if (data && data[0]) newRecord.id_transaksi = data[0].id_transaksi;
      }

      const updated = [...kasList, newRecord];
      setKasList(updated);
      localStorage.setItem('local_kas', JSON.stringify(updated));

      // Otomatis buka Kuitansi Resmi Digital
      const kData: KuitansiData = {
        noKuitansi: `KAS/BERYL/${selectedYear}${monthCode}/${newRecord.id_transaksi}`,
        jenisTransaksi: 'Iuran Kas Warga (Rp 10.000)',
        namaWarga: wargaObj?.nama_lengkap || 'Warga Beryl',
        idRumah: wargaObj?.id_rumah || '-',
        noHp: wargaObj?.no_hp,
        tanggalBayar: tanggalBayar,
        nominal: 10000,
        periodeAtauKeperluan: `Iuran Bulan ${NAMA_BULAN[bulan - 1]} ${selectedYear}`,
        namaPenerima: currentUser?.nama_lengkap || 'Bendahara Paguyuban',
      };
      setActiveKuitansi(kData);
    }
  };

  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canEdit || !formManual.id_warga) {
      alert('Silakan cari dan pilih warga terlebih dahulu!');
      return;
    }

    const monthCode = String(formManual.bulan).padStart(2, '0');
    const periodeBulan = `${selectedYear}-${monthCode}-01`;
    const newRecord: any = {
      id_transaksi: Date.now(),
      id_warga: Number(formManual.id_warga),
      periode_bulan: periodeBulan,
      tanggal: formManual.tanggal,
      nominal: Number(formManual.nominal),
      peruntukan: 'Operasional dan Sosial',
      status_bayar: 'Lunas',
      keterangan: formManual.keterangan,
      bukti_transfer: 'Input Manual',
    };

    if (isSupabaseConfigured) {
      const { data } = await supabase.from('kas_warga_beryl').insert([{
        id_warga: Number(formManual.id_warga),
        periode_bulan: periodeBulan,
        tanggal: formManual.tanggal,
        nominal: Number(formManual.nominal),
        peruntukan: 'Operasional dan Sosial',
        status_bayar: 'Lunas',
        keterangan: formManual.keterangan,
        bukti_transfer: 'Input Manual'
      }]).select();
      if (data && data[0]) newRecord.id_transaksi = data[0].id_transaksi;
    }

    const updated = [...kasList, newRecord];
    setKasList(updated);
    localStorage.setItem('local_kas', JSON.stringify(updated));
    setShowManualModal(false);

    const wargaObj = wargaList.find(w => String(w.id_warga) === String(formManual.id_warga));
    const kData: KuitansiData = {
      noKuitansi: `KAS/BERYL/${selectedYear}${monthCode}/${newRecord.id_transaksi}`,
      jenisTransaksi: 'Iuran Kas Warga (Rp 10.000)',
      namaWarga: wargaObj?.nama_lengkap || 'Warga Beryl',
      idRumah: wargaObj?.id_rumah || '-',
      noHp: wargaObj?.no_hp,
      tanggalBayar: formManual.tanggal,
      nominal: Number(formManual.nominal),
      periodeAtauKeperluan: `Iuran Bulan ${NAMA_BULAN[formManual.bulan - 1]} ${selectedYear}`,
      namaPenerima: currentUser?.nama_lengkap || 'Bendahara Paguyuban',
    };
    setActiveKuitansi(kData);

    setFormManual({
      id_warga: '',
      bulan: 1,
      nominal: 10000,
      tanggal: new Date().toISOString().slice(0, 10),
      keterangan: 'Iuran Kas Warga',
    });
  };

  const filteredWarga = wargaList.filter(w =>
    (w.nama_lengkap?.toLowerCase() || '').includes(search.toLowerCase()) ||
    (w.id_rumah?.toLowerCase() || '').includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 pb-12">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Kas Iuran Warga Beryl (Rp 10.000 / Bln)</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Klik tanda centang hijau untuk melihat / membagikan <strong>Kuitansi Resmi WhatsApp</strong>.
          </p>
        </div>
        <div className="flex items-center space-x-2">
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
              className="flex items-center space-x-1.5 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-sm transition-all"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Catat Bayar</span>
            </button>
          )}
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(Number(e.target.value))}
            className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold outline-none"
          >
            <option value={2026}>Tahun 2026</option>
            <option value={2025}>Tahun 2025</option>
          </select>
        </div>
      </div>

      <div className="relative">
        <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          placeholder="Cari nama warga atau blok unit..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs outline-none focus:border-emerald-500 shadow-2xs"
        />
      </div>

      {/* Matriks 12 Bulan */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-slate-100 text-[10px] uppercase font-bold text-slate-600 border-b select-none">
              <tr>
                <th className="px-3 py-3 text-center border-r w-12 sticky left-0 bg-slate-100 z-10">No.</th>
                <th className="px-3 py-3 border-r min-w-[70px] sticky left-[48px] bg-slate-100 z-10">Blok</th>
                <th className="px-3 py-3 border-r min-w-[150px] sticky left-[118px] bg-slate-100 z-10">Nama Warga</th>
                {NAMA_BULAN.map((m) => (
                  <th key={m} className="px-2 py-3 text-center border-r min-w-[45px]">{m.slice(0, 3)}</th>
                ))}
                <th className="px-3 py-3 text-right min-w-[90px]">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredWarga.map((w, idx) => {
                let totalPaid = 0;
                return (
                  <tr key={w.id_warga} className="hover:bg-slate-50 transition-colors">
                    <td className="px-3 py-2.5 text-center font-mono text-slate-400 border-r sticky left-0 bg-white z-10">{idx + 1}</td>
                    <td className="px-3 py-2.5 font-bold text-slate-800 border-r sticky left-[48px] bg-white z-10 whitespace-nowrap">{w.id_rumah || '-'}</td>
                    <td className="px-3 py-2.5 font-bold text-slate-900 border-r sticky left-[118px] bg-white z-10 truncate max-w-[180px]">{w.nama_lengkap}</td>
                    {Array.from({ length: 12 }, (_, i) => i + 1).map((bulan) => {
                      const pPrefix = `${selectedYear}-${String(bulan).padStart(2, '0')}`;
                      const isLunas = kasList.some(k => k.id_warga === w.id_warga && k.periode_bulan?.startsWith(pPrefix) && k.status_bayar === 'Lunas');
                      if (isLunas) totalPaid += 10000;
                      return (
                        <td
                          key={bulan}
                          onClick={() => handleToggleMonth(w.id_warga, bulan)}
                          className={`px-1 py-2 text-center border-r cursor-pointer transition-colors ${
                            isLunas ? 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100' : 'bg-rose-50/40 text-rose-300 hover:bg-rose-100'
                          }`}
                          title={isLunas ? `Lunas ${NAMA_BULAN[bulan - 1]}. Klik untuk Kuitansi WhatsApp.` : `Klik untuk bayar ${NAMA_BULAN[bulan - 1]}`}
                        >
                          {isLunas ? <CheckCircle2 className="w-4 h-4 mx-auto text-emerald-600" /> : <span className="text-[10px] font-bold text-rose-400">✕</span>}
                        </td>
                      );
                    })}
                    <td className="px-3 py-2.5 text-right font-black text-emerald-700 whitespace-nowrap">{formatRupiah(totalPaid)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Form Bayar */}
      {showManualModal && canEdit && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center p-4 z-50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="font-bold text-slate-800 text-sm">Catat Iuran Kas Warga</h3>
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

              <div className="flex justify-end space-x-2 pt-3 border-t">
                <button type="button" onClick={() => setShowManualModal(false)} className="px-4 py-2 border rounded-xl font-bold">Batal</button>
                <button type="submit" className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold">Simpan & Buat Kuitansi</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Kuitansi Digital & WhatsApp */}
      <KuitansiModal data={activeKuitansi} onClose={() => setActiveKuitansi(null)} />
    </div>
  );
};

export default InfaqBulananPage;