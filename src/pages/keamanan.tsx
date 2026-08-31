import React, { useEffect, useState } from 'react';
import { UserCheck, Clock, LogOut, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import { Tamu, Pengguna } from '../types';
import { supabase } from '../supabase';

const getLocalISODateTime = () => {
  const tzOffset = (new Date()).getTimezoneOffset() * 60000;
  return new Date(Date.now() - tzOffset).toISOString().replace('T', ' ').slice(0, 19);
};

const formatDateTime = (dt: string | null) => {
  if (!dt) return null;
  try {
    const d = new Date(dt.replace(' ', 'T'));
    return d.toLocaleString('id-ID', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return dt;
  }
};

export const Keamanan = ({ user }: { user: Pengguna }) => {
  const [tamu, setTamu] = useState<Tamu[]>([]);
  const [loading, setLoading] = useState(true);

  // State Sortir
  const [sortField, setSortField] = useState<string>('waktu_masuk');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  const isGuest = user.id_pengguna === 0;
  const canEdit = !isGuest && (user.peran === 'Satpam' || user.peran === 'Super_Admin');

  const loadData = async () => {
    const { data, error } = await supabase
      .from('tamu')
      .select('*')
      .order('waktu_masuk', { ascending: false });

    if (error) console.error('Error loading tamu:', error);
    setTamu(data || []);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 30_000);
    return () => clearInterval(interval);
  }, []);

  const handleKeluar = async (id: number) => {
    if (!canEdit) return;
    const { error } = await supabase
      .from('tamu')
      .update({ waktu_keluar: getLocalISODateTime() })
      .eq('id_tamu', id);

    if (error) return console.error('Error update tamu keluar:', error);
    loadData();
  };

  const handleMasuk = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!canEdit) return;

    const formData = new FormData(e.currentTarget);
    const payload = {
      nama_tamu: formData.get('nama_tamu') as string,
      id_rumah_tujuan: formData.get('id_rumah_tujuan') as string,
      waktu_masuk: getLocalISODateTime(),
      waktu_keluar: null,
      titip_identitas: formData.get('titip_identitas') as string,
    };

    const { error } = await supabase.from('tamu').insert([payload]);
    if (error) return console.error('Error insert tamu:', error);

    e.currentTarget.reset();
    loadData();
  };

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortOrder(prev => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  const renderSortIcon = (field: string) => {
    if (sortField !== field) return <ArrowUpDown className="w-3 h-3 text-slate-400 inline ml-1 opacity-60" />;
    return sortOrder === 'asc' ? (
      <ArrowUp className="w-3.5 h-3.5 text-primary-600 inline ml-1" />
    ) : (
      <ArrowDown className="w-3.5 h-3.5 text-primary-600 inline ml-1" />
    );
  };

  const sortedTamu = [...tamu].sort((a: any, b: any) => {
    let valA = a[sortField] || '';
    let valB = b[sortField] || '';
    let comp = String(valA).localeCompare(String(valB), undefined, { numeric: true, sensitivity: 'base' });
    return sortOrder === 'asc' ? comp : -comp;
  });

  const tamuAktif = sortedTamu.filter(t => !t.waktu_keluar);
  const tamuSelesai = sortedTamu.filter(t => t.waktu_keluar);

  return (
    <div className="space-y-6 flex-1 flex flex-col h-full relative">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">Log Keamanan</h2>
          <p className="text-slate-500 mt-1">
            {isGuest ? 'Pencatatan keluar masuk tamu (Mode Lihat Tamu).' : 'Pencatatan keluar masuk tamu dan visitor log.'}
          </p>
        </div>
        <div className="flex space-x-3">
          <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-2 text-center">
            <p className="text-[10px] font-bold text-amber-500 uppercase tracking-wider">Di Dalam</p>
            <p className="text-2xl font-bold text-amber-700">{tamu.filter(t => !t.waktu_keluar).length}</p>
          </div>
          <div className="bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-2 text-center">
            <p className="text-[10px] font-bold text-emerald-500 uppercase tracking-wider">Total Hari Ini</p>
            <p className="text-2xl font-bold text-emerald-700">
              {tamu.filter(t => t.waktu_masuk?.startsWith(getLocalISODateTime().slice(0, 10))).length}
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 flex-1 items-start">
        <div className={`${canEdit ? 'md:col-span-2' : 'md:col-span-3'} bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col overflow-hidden`}>
          <div className="p-5 border-b border-slate-100 flex justify-between items-center">
            <h4 className="font-bold text-slate-800">Daftar Kunjungan</h4>
            <span className="text-xs text-slate-400">{loading ? 'Memuat...' : `${tamu.length} record`}</span>
          </div>

          <div className="flex-1 overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-slate-50 text-[10px] uppercase tracking-wider text-slate-500 border-b border-slate-200 select-none">
                <tr>
                  <th onClick={() => handleSort('waktu_masuk')} className="px-5 py-3 font-bold cursor-pointer hover:bg-slate-100">
                    <span>Waktu Masuk</span>
                    {renderSortIcon('waktu_masuk')}
                  </th>
                  <th onClick={() => handleSort('nama_tamu')} className="px-5 py-3 font-bold cursor-pointer hover:bg-slate-100">
                    <span>Nama Tamu</span>
                    {renderSortIcon('nama_tamu')}
                  </th>
                  <th onClick={() => handleSort('id_rumah_tujuan')} className="px-5 py-3 font-bold cursor-pointer hover:bg-slate-100">
                    <span>Tujuan</span>
                    {renderSortIcon('id_rumah_tujuan')}
                  </th>
                  <th onClick={() => handleSort('titip_identitas')} className="px-5 py-3 font-bold cursor-pointer hover:bg-slate-100">
                    <span>Identitas</span>
                    {renderSortIcon('titip_identitas')}
                  </th>
                  <th onClick={() => handleSort('waktu_keluar')} className="px-5 py-3 font-bold text-center cursor-pointer hover:bg-slate-100">
                    <span>Status / Waktu Keluar</span>
                    {renderSortIcon('waktu_keluar')}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {tamuAktif.map(t => (
                  <tr key={t.id_tamu} className="hover:bg-amber-50/30 transition-colors bg-amber-50/10">
                    <td className="px-5 py-4 text-blue-600 font-mono text-xs font-medium">
                      <div className="flex items-center space-x-1.5">
                        <Clock className="w-3 h-3" />
                        <span>{formatDateTime(t.waktu_masuk)}</span>
                      </div>
                    </td>
                    <td className="px-5 py-4 font-medium text-slate-900">{t.nama_tamu}</td>
                    <td className="px-5 py-4 text-slate-500">{t.id_rumah_tujuan}</td>
                    <td className="px-5 py-4">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${t.titip_identitas === 'Kosong' ? 'bg-slate-100 text-slate-500' : 'bg-blue-100 text-blue-700'}`}>
                        {t.titip_identitas}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-center">
                      {canEdit ? (
                        <button
                          onClick={() => handleKeluar(t.id_tamu)}
                          className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-amber-100 hover:bg-amber-200 text-amber-700 rounded-full text-[10px] font-bold uppercase transition-colors"
                        >
                          <LogOut className="w-3 h-3" />
                          <span>Tandai Keluar</span>
                        </button>
                      ) : (
                        <span className="text-amber-600 text-xs font-bold">Masih Di Dalam</span>
                      )}
                    </td>
                  </tr>
                ))}

                {tamuSelesai.map(t => (
                  <tr key={t.id_tamu} className="hover:bg-slate-50 transition-colors opacity-70">
                    <td className="px-5 py-3 text-slate-400 font-mono text-xs">{formatDateTime(t.waktu_masuk)}</td>
                    <td className="px-5 py-3 text-slate-600 line-through">{t.nama_tamu}</td>
                    <td className="px-5 py-3 text-slate-400">{t.id_rumah_tujuan}</td>
                    <td className="px-5 py-3">
                      <span className="text-slate-400 text-[10px] uppercase">{t.titip_identitas}</span>
                    </td>
                    <td className="px-5 py-3 text-center">
                      <div className="flex items-center justify-center space-x-1.5 text-emerald-600">
                        <UserCheck className="w-3 h-3" />
                        <span className="font-mono text-xs">{formatDateTime(t.waktu_keluar)}</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {canEdit && (
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col sticky top-6">
            <div className="p-5 border-b border-slate-100">
              <h4 className="font-bold text-slate-800">Catat Tamu Masuk</h4>
            </div>
            <div className="p-5">
              <form onSubmit={handleMasuk} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">
                    Nama Tamu <span className="text-red-500">*</span>
                  </label>
                  <input
                    required
                    name="nama_tamu"
                    placeholder="Misal: Kurir JNE"
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">
                    Blok / Tujuan <span className="text-red-500">*</span>
                  </label>
                  <input
                    required
                    name="id_rumah_tujuan"
                    placeholder="Beryl-A1-01"
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Titip Identitas</label>
                  <select name="titip_identitas" className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm outline-none">
                    <option value="Kosong">Tidak Ada</option>
                    <option value="KTP">KTP</option>
                    <option value="SIM">SIM</option>
                    <option value="Kartu Pelajar">Kartu Pelajar</option>
                    <option value="Kartu Lainnya">Kartu Lainnya</option>
                  </select>
                </div>
                <div className="pt-2">
                  <button type="submit" className="w-full bg-primary-600 hover:bg-primary-700 text-white text-xs font-bold py-3 rounded-lg uppercase transition-colors">
                    Catat Masuk
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};