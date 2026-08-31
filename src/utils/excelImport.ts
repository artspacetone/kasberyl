// src/utils/excelImport.ts
import { supabase } from '../supabase';
import { ParsedExcelData } from './excelParser';

const KAS_WARGA_FIELDS = ['id_warga_pembayar','periode_bulan','tanggal','kategori','nominal','keterangan','status_bayar','bukti_transfer','diinput_oleh'];
const DANA_ACARA_FIELDS = ['id_warga_pembayar','nama_acara','tanggal','kategori','nominal','keterangan','status_bayar','bukti_transfer','diinput_oleh'];

const pick = (obj: any, fields: string[]) => {
  const out: any = {};
  fields.forEach(f => { if (obj[f] !== undefined) out[f] = obj[f]; });
  return out;
};

export const importExcelToDatabase = async (data: ParsedExcelData, userId: number) => {
  const report = {
    warga: 0,
    kasPemasukan: 0,
    danaAcaraPemasukan: 0,
    pengeluaranKas: 0,
    pengeluaranAcara: 0,
    errors: [] as string[],
  };

  // ============ 1. IMPORT RUMAH & WARGA ============
  const rumahMap = new Map<string, any>();
  const wargaList: any[] = [];

  data.masukanKas.forEach((item) => {
    const { idRumah, nama, hp, statusRaw } = item;
    if (!idRumah || !nama) return;

    let statusHunian = 'Menetap';
    const s = statusRaw.toLowerCase();
    if (s.includes('kunjungan')) statusHunian = 'Kunjungan';
    else if (s.includes('sewa')) statusHunian = 'Penyewa';
    else if (s.includes('kosong')) statusHunian = 'Kosong';
    else if (s.includes('ditempati')) statusHunian = 'Menetap';

    if (!rumahMap.has(idRumah)) {
      rumahMap.set(idRumah, {
        id_rumah: idRumah,
        blok_nomor: idRumah.replace('Beryl-', ''),
        status_hunian: statusHunian,
        nama_pemilik_asli: nama,
        no_hp_pemilik_asli: hp,
        tgl_mulai_huni: new Date().toISOString().slice(0,10),
      });
    }

    wargaList.push({
      id_rumah: idRumah,
      nama_lengkap: nama,
      no_hp: hp,
      jenis_kelamin: 'L',
      peran_keluarga: 'Kepala Keluarga',
      tempat_tgl_lahir: '-',
      agama: 'Islam',
      pekerjaan: '-',
      golongan_darah: '-',
      status_warga: 'Aktif',
      tanggal_bergabung: new Date().toISOString().slice(0,10),
    });
  });

  if (rumahMap.size > 0) {
    const { error } = await supabase.from('rumah').upsert(Array.from(rumahMap.values()));
    if (error) report.errors.push(`Rumah: ${error.message}`);
  }

  let wargaByRumah = new Map<string, number>();
  if (wargaList.length > 0) {
    const { data: inserted, error } = await supabase.from('warga').insert(wargaList).select('id_warga, id_rumah');
    if (error) {
      report.errors.push(`Warga: ${error.message}`);
    } else {
      report.warga = wargaList.length;
      inserted?.forEach((w: any) => wargaByRumah.set(w.id_rumah, w.id_warga));
    }
  }

  // ============ 2. IMPORT KAS PEMASUKAN ============
  const kasPemasukanPayload: any[] = [];
  data.masukanKas.forEach((item) => {
    const { idRumah, payments } = item;
    if (!idRumah) return;
    payments.forEach((p: any) => {
      if (p.value && String(p.value).trim() !== '') {
        const year = new Date().getFullYear() + Math.floor(p.monthIndex / 12);
        const month = (p.monthIndex % 12) + 1;
        const idWarga = wargaByRumah.get(idRumah);
        if (!idWarga) return;
        kasPemasukanPayload.push({
          id_warga_pembayar: idWarga,
          periode_bulan: `${year}-${String(month).padStart(2,'0')}-01`,
          tanggal: `${year}-${String(month).padStart(2,'0')}-05`,
          kategori: 'Pemasukan',
          nominal: 10000,
          keterangan: `Iuran Wajib ${year}-${String(month).padStart(2,'0')} (Import)`,
          status_bayar: 'Lunas',
          bukti_transfer: 'Import Excel',
          diinput_oleh: userId,
        });
      }
    });
  });

  if (kasPemasukanPayload.length > 0) {
    const filtered = kasPemasukanPayload.map(p => pick(p, KAS_WARGA_FIELDS));
    const { error } = await supabase.from('kas_warga').insert(filtered);
    if (error) report.errors.push(`Kas Pemasukan: ${error.message}`);
    else report.kasPemasukan = filtered.length;
  }

  // ============ 3. IMPORT DANA ACARA PEMASUKAN ============
  const acaraRows = data.danaAcara;
  if (acaraRows.length > 0) {
    const wargaRes = await supabase.from('warga').select('*');
    const wargaAll = wargaRes.data || [];
    const wargaByNama = new Map(wargaAll.map((w: any) => [w.nama_lengkap.toLowerCase(), w.id_warga]));
    const wargaByRumah = new Map(wargaAll.map((w: any) => [w.id_rumah.toLowerCase(), w.id_warga]));

    const payloadAcara = acaraRows.map((row: any) => {
      const nama = row['Nama Lengkap'] || '';
      const blok = row['Blok / Nomor Rumah'] || '';
      const nominal = Number(row['Iuran Kas Acara (Sukarela)']) || 0;
      const idWarga = wargaByNama.get(nama.toLowerCase()) || wargaByRumah.get(blok.toLowerCase());
      return {
        id_warga_pembayar: idWarga || null,
        nama_acara: 'Iuran Kas Acara',
        tanggal: new Date().toISOString().slice(0,10),
        kategori: 'Pemasukan',
        nominal,
        keterangan: `Iuran Kas Acara - ${nama} (${blok})`,
        status_bayar: 'Lunas',
        bukti_transfer: 'Import Excel',
        diinput_oleh: userId,
      };
    }).filter((p: any) => p.nominal > 0);

    if (payloadAcara.length > 0) {
      const filtered = payloadAcara.map(p => pick(p, DANA_ACARA_FIELDS));
      const { error } = await supabase.from('dana_acara').insert(filtered);
      if (error) report.errors.push(`Dana Acara Pemasukan: ${error.message}`);
      else report.danaAcaraPemasukan = filtered.length;
    }
  }

  // ============ 4. IMPORT PENGELUARAN ============
  const keluaranRows = data.keluaran;
  if (keluaranRows.length > 0) {
    const payloadKeluaran = keluaranRows.map((row: any) => {
      const tanggal = row['Tanggal'] ? new Date(row['Tanggal']).toISOString().slice(0,10) : new Date().toISOString().slice(0,10);
      const keterangan = row['Keperluan'] || '';
      const nominal = Number(row['Jumlah']) || 0;
      const kategori = row['Kategori'] || 'Operasional';
      const bukti = row['Bukti'] || '';
      return {
        tanggal,
        keterangan,
        nominal,
        kategori: 'Pengeluaran',
        status_bayar: 'Lunas',
        bukti_transfer: bukti,
        diinput_oleh: userId,
        nama_acara: kategori === 'Acara' ? 'Acara Paguyuban' : 'Operasional',
      };
    });

    const kasPengeluaran = payloadKeluaran.filter(p => p.nama_acara !== 'Acara');
    const acaraPengeluaran = payloadKeluaran.filter(p => p.nama_acara === 'Acara');

    if (kasPengeluaran.length > 0) {
      const kasPayload = kasPengeluaran.map(p => {
        const { nama_acara, ...rest } = p;
        return pick({ ...rest, periode_bulan: p.tanggal.slice(0,7) + '-01' }, KAS_WARGA_FIELDS);
      });
      const { error } = await supabase.from('kas_warga').insert(kasPayload);
      if (error) report.errors.push(`Pengeluaran Kas: ${error.message}`);
      else report.pengeluaranKas = kasPayload.length;
    }

    if (acaraPengeluaran.length > 0) {
      const acaraPayload = acaraPengeluaran.map(p => pick(p, DANA_ACARA_FIELDS));
      const { error } = await supabase.from('dana_acara').insert(acaraPayload);
      if (error) report.errors.push(`Pengeluaran Acara: ${error.message}`);
      else report.pengeluaranAcara = acaraPayload.length;
    }
  }

  return report;
};