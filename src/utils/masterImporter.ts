// src/utils/masterImporter.ts
import { getXLSX } from '../lib/excel';
import { supabase, isSupabaseConfigured } from '../supabase';
import { Warga, KasWargaBeryl, InfaqMajelis, Pengeluaran, PinjamanWarga, DanaAcara } from '../types';
import { formatPhoneNumber62 } from '../lib/utils';

const normalizeIdRumah = (raw: string): string => {
  const s = String(raw || '').trim().toUpperCase().replace(/\s+/g, '');
  if (!s || s === 'A-Z' || s === 'ALL' || s === 'PMM') return 'Beryl-A-Z';
  const match = s.match(/^([A-Z0-9]+)[\/\-\s]?([A-Z0-9]+)?[\/\-\s]?(\d+)?$/);
  if (match) {
    const blok = match[1];
    const no = match[3] ? match[3].padStart(2, '0') : (match[2] || '01').padStart(2, '0');
    return `Beryl-${blok}-${no}`;
  }
  return `Beryl-${s.replace('/', '-')}`;
};

const cleanNominal = (val: any): number => {
  if (val === null || val === undefined) return 0;
  if (typeof val === 'number') return isNaN(val) ? 0 : Math.round(val);
  const cleanStr = String(val).replace(/[^0-9]/g, '');
  const num = parseInt(cleanStr, 10);
  return isNaN(num) ? 0 : num;
};

const safeDate = (val: any, fallback: string = '2026-01-01'): string => {
  if (!val) return fallback;
  if (val instanceof Date) {
    const y = val.getFullYear();
    const m = String(val.getMonth() + 1).padStart(2, '0');
    const d = String(val.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }
  const str = String(val).trim();
  const match = str.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})/);
  if (match) return `${match[1]}-${match[2].padStart(2, '0')}-${match[3].padStart(2, '0')}`;
  
  const indoMatch = str.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{4})/);
  if (indoMatch) return `${indoMatch[3]}-${indoMatch[2].padStart(2, '0')}-${indoMatch[1].padStart(2, '0')}`;
  return fallback;
};

const parseMonthAndYearFromHeader = (headerName: string, defaultYear: number = 2026): { monthCode: string; year: number } | null => {
  const clean = String(headerName || '').toLowerCase().trim().replace(/[^a-z0-9]/g, ' ');
  
  const monthMap: Record<string, string> = {
    januari: '01', jan: '01', january: '01',
    februari: '02', feb: '02', february: '02',
    maret: '03', mar: '03', march: '03',
    april: '04', apr: '04',
    mei: '05', may: '05',
    juni: '06', jun: '06', june: '06',
    juli: '07', jul: '07', july: '07',
    agustus: '08', agu: '08', ags: '08', august: '08',
    september: '09', sep: '09',
    oktober: '10', okt: '10', oct: '10', october: '10',
    november: '11', nov: '11',
    desember: '12', des: '12', dec: '12', december: '12'
  };

  for (const [key, code] of Object.entries(monthMap)) {
    if (clean.includes(key)) {
      const yearMatch = clean.match(/20\d{2}/);
      const year = yearMatch ? parseInt(yearMatch[0], 10) : defaultYear;
      return { monthCode: code, year };
    }
  }
  return null;
};

const cleanTextKey = (str: string): string => {
  return String(str || '').toLowerCase().replace(/[^a-z0-9]/g, '');
};

export const processMasterExcelImport = async (
  file: File,
  userId: number,
  onProgress?: (msg: string, pct: number) => void
) => {
  onProgress?.('Membuka file Excel master...', 5);
  const XLSX = await getXLSX();
  const buffer = await file.arrayBuffer();
  const wb = XLSX.read(buffer, { type: 'array', cellDates: true });

  // =========================================================================
  // TAHAP 1: RESET TOTAL DATA LAMA
  // =========================================================================
  onProgress?.('Membersihkan data lama di database Cloud & Lokal...', 10);
  
  if (isSupabaseConfigured) {
    try {
      await supabase.from('cicilan_pinjaman').delete().neq('id_cicilan', 0);
      await supabase.from('pinjaman_warga').delete().neq('id_pinjaman', 0);
      await supabase.from('pengeluaran').delete().neq('id_pengeluaran', 0);
      await supabase.from('infaq_majelis_albarokah').delete().neq('id_infaq', 0);
      await supabase.from('dana_acara').delete().neq('id_transaksi', 0);
      await supabase.from('kas_warga_beryl').delete().neq('id_transaksi', 0);
      await supabase.from('warga').delete().neq('id_warga', 0);
      await supabase.from('rumah').delete().neq('id_rumah', '0');
    } catch (err: any) {
      console.warn('Peringatan reset database:', err.message);
    }
  }

  localStorage.removeItem('local_warga');
  localStorage.removeItem('local_kas');
  localStorage.removeItem('local_dana_acara');
  localStorage.removeItem('local_majelis');
  localStorage.removeItem('local_pengeluaran');
  localStorage.removeItem('local_pinjaman');

  let importedWarga: Warga[] = [];
  let importedKas: KasWargaBeryl[] = [];
  let importedAcara: DanaAcara[] = [];
  let importedMajelis: InfaqMajelis[] = [];
  let importedPengeluaran: Pengeluaran[] = [];
  let importedPinjaman: PinjamanWarga[] = [];

  // =========================================================================
  // TAHAP 2: PROSES SHEET DATABASE (WARGA + KAS Rp 10.000)
  // =========================================================================
  const sheetDbName = wb.SheetNames.find(n => {
    const un = n.toUpperCase();
    return un.includes('DATABASE') || un.includes('DATA') || un.includes('WARGA');
  });

  if (sheetDbName) {
    onProgress?.(`Memproses Data Warga & Kas Bulanan [${sheetDbName}]...`, 25);
    const ws = wb.Sheets[sheetDbName];
    const rawRows: any[] = XLSX.utils.sheet_to_json(ws, { defval: '' });

    const rumahMap = new Map<string, any>();
    const wargaMap = new Map<string, Warga>();
    let idCounter = 1;

    for (const r of rawRows) {
      let blokRaw = '';
      let namaRaw = '';
      let hpRaw = '';
      let ketRaw = 'Menetap';
      let golDarahRaw = 'O';
      let tglLahirRaw = '';

      for (const [k, v] of Object.entries(r)) {
        const kClean = k.toLowerCase().trim();
        
        if (
          kClean.includes('whatsapp') || 
          kClean.includes('no wa') || 
          kClean.includes('no. wa') || 
          kClean.includes('nomor wa') || 
          kClean.includes('nomor whatsapp') || 
          kClean.includes('hp') || 
          kClean.includes('telepon') || 
          kClean.includes('ponsel') || 
          kClean.includes('kontak')
        ) {
          if (!hpRaw && v) hpRaw = String(v).trim();
        } 
        else if (kClean.includes('nama') || kClean.includes('warga') || kClean.includes('penghuni') || kClean.includes('pemilik')) {
          if (!namaRaw && v) namaRaw = String(v).trim();
        } 
        else if (
          kClean.includes('blok') || 
          kClean.includes('unit') || 
          kClean.includes('rumah') || 
          kClean === 'no' || 
          kClean === 'nomor' || 
          kClean.includes('blok / nomor') || 
          kClean.includes('blok/nomor')
        ) {
          if (!blokRaw && v) blokRaw = String(v).trim();
        } 
        else if (kClean.includes('keterangan') || kClean.includes('status') || kClean.includes('hunian')) {
          if (v) ketRaw = String(v).trim();
        }
        else if (kClean.includes('darah') || kClean.includes('gol')) {
          if (v) golDarahRaw = String(v).trim();
        }
        else if (kClean.includes('lahir') || kClean.includes('tgl lahir')) {
          if (v) tglLahirRaw = String(v).trim();
        }
      }

      if (!blokRaw && !namaRaw) continue;
      if (String(namaRaw).toLowerCase().includes('total') || String(blokRaw).toLowerCase().includes('total')) continue;

      const idRumah = normalizeIdRumah(blokRaw || 'A1/01');
      const nama = String(namaRaw || `Warga Unit ${idRumah}`).trim();
      const noHpFormatted = formatPhoneNumber62(hpRaw);
      const statusWarga = String(ketRaw || 'Menetap').trim() || 'Menetap';

      if (!rumahMap.has(idRumah)) {
        rumahMap.set(idRumah, {
          id_rumah: idRumah,
          blok_nomor: idRumah.replace('Beryl-', ''),
          status_hunian: statusWarga,
          nama_pemilik_asli: nama,
          no_hp_pemilik_asli: noHpFormatted,
          tgl_mulai_huni: '2026-01-01',
        });
      }

      const cleanKey = cleanTextKey(nama) + '_' + cleanTextKey(idRumah);
      if (!wargaMap.has(cleanKey)) {
        wargaMap.set(cleanKey, {
          id_warga: idCounter++,
          id_rumah: idRumah,
          nama_lengkap: nama,
          nik_kk: String(r['NIK'] || r['No KK'] || '-'),
          status_warga: statusWarga,
          no_hp: noHpFormatted,
          jenis_kelamin: 'L',
          peran_keluarga: 'Kepala Keluarga',
          tempat_lahir: '',
          tanggal_lahir: tglLahirRaw ? safeDate(tglLahirRaw, '') : '',
          golongan_darah: golDarahRaw || 'O',
          agama: 'Islam',
          pekerjaan: '-',
          alamat_asal: '-',
          keterangan: statusWarga,
          tanggal_daftar: '2026-01-01',
          anggota_keluarga: [],
          kendaraan: []
        });
      }
    }

    importedWarga = Array.from(wargaMap.values());

    // SIMPAN RUMAH & WARGA (DENGAN PENANGKAPAN ID CLOUD REAL)
    const validSupabaseWargaMapByName = new Map<string, number>();
    const validSupabaseWargaMapByRumah = new Map<string, number>();

    if (isSupabaseConfigured) {
      try {
        if (rumahMap.size > 0) {
          await supabase.from('rumah').upsert(Array.from(rumahMap.values()));
        }

        if (importedWarga.length > 0) {
          const dbWargaPayload = importedWarga.map(w => ({
            id_rumah: w.id_rumah,
            nik_kk: w.nik_kk || null,
            nama_lengkap: w.nama_lengkap,
            status_warga: w.status_warga,
            no_hp: w.no_hp,
            jenis_kelamin: w.jenis_kelamin || 'L',
            peran_keluarga: w.peran_keluarga || 'Kepala Keluarga',
            tempat_lahir: w.tempat_lahir || null,
            tanggal_lahir: w.tanggal_lahir ? w.tanggal_lahir : null,
            golongan_darah: w.golongan_darah || 'O',
            agama: w.agama || 'Islam',
            pekerjaan: w.pekerjaan || '-',
            alamat_asal: w.alamat_asal || '-',
            keterangan: w.keterangan || null,
            tanggal_daftar: w.tanggal_daftar || '2026-01-01',
            anggota_keluarga: w.anggota_keluarga || [],
            kendaraan: w.kendaraan || []
          }));

          const { data: insertedDbWarga, error } = await supabase
            .from('warga')
            .insert(dbWargaPayload)
            .select('id_warga, nama_lengkap, id_rumah, no_hp');

          if (!error && insertedDbWarga && insertedDbWarga.length > 0) {
            importedWarga = insertedDbWarga as Warga[];
            insertedDbWarga.forEach((w: any) => {
              validSupabaseWargaMapByName.set(cleanTextKey(w.nama_lengkap), w.id_warga);
              validSupabaseWargaMapByRumah.set(cleanTextKey(w.id_rumah), w.id_warga);
            });
          }
        }
      } catch (e) {
        console.warn('Fallback offline Warga:', e);
      }
    }

    // Resolver lokal & fallback
    const mapWargaByName = new Map<string, Warga>();
    const mapWargaByRumah = new Map<string, Warga>();
    importedWarga.forEach(w => {
      mapWargaByName.set(cleanTextKey(w.nama_lengkap), w);
      mapWargaByRumah.set(cleanTextKey(w.id_rumah), w);
    });

    // 2.2 Ekstraksi Iuran Kas Bulanan (Bebas Konflik 409)
    let trxKasCounter = 1;
    const dbKasPayload: any[] = [];

    for (const r of rawRows) {
      let namaRow = '';
      let blokRow = '';
      for (const [k, v] of Object.entries(r)) {
        const kClean = k.toLowerCase().trim();
        if (kClean.includes('nama') || kClean.includes('warga')) namaRow = String(v);
        if (kClean.includes('blok') || kClean.includes('nomor') || kClean.includes('unit')) blokRow = String(v);
      }

      if (!namaRow && !blokRow) continue;
      const foundWarga = mapWargaByName.get(cleanTextKey(namaRow)) || mapWargaByRumah.get(cleanTextKey(normalizeIdRumah(blokRow)));
      if (!foundWarga) continue;

      const validIdWarga = validSupabaseWargaMapByName.get(cleanTextKey(namaRow)) || 
                           validSupabaseWargaMapByRumah.get(cleanTextKey(normalizeIdRumah(blokRow))) || 
                           foundWarga.id_warga;

      for (const [colName, val] of Object.entries(r)) {
        const parsedMonth = parseMonthAndYearFromHeader(colName, 2026);
        if (parsedMonth) {
          const nominal = cleanNominal(val);
          if (nominal > 0) {
            const periodeStr = `${parsedMonth.year}-${parsedMonth.monthCode}-01`;
            const tanggalStr = `${parsedMonth.year}-${parsedMonth.monthCode}-05`;

            importedKas.push({
              id_transaksi: trxKasCounter++,
              id_warga: validIdWarga,
              nama_warga: foundWarga.nama_lengkap,
              id_rumah: foundWarga.id_rumah,
              periode_bulan: periodeStr,
              tanggal: tanggalStr,
              nominal: nominal,
              peruntukan: 'Operasional dan Sosial',
              status_bayar: 'Lunas',
              keterangan: `Iuran Kas Warga Beryl (${colName.trim()} ${parsedMonth.year})`,
              bukti_transfer: 'Import Master Excel',
              diinput_oleh: userId,
            });

            dbKasPayload.push({
              id_warga: validIdWarga || null,
              periode_bulan: periodeStr,
              tanggal: tanggalStr,
              nominal: nominal,
              peruntukan: 'Operasional dan Sosial',
              status_bayar: 'Lunas',
              keterangan: `Iuran Kas Warga Beryl (${colName.trim()} ${parsedMonth.year})`,
              bukti_transfer: 'Import Master Excel',
              diinput_oleh: userId,
            });
          }
        }
      }
    }

    if (isSupabaseConfigured && dbKasPayload.length > 0) {
      try {
        const BATCH = 50;
        for (let i = 0; i < dbKasPayload.length; i += BATCH) {
          await supabase.from('kas_warga_beryl').insert(dbKasPayload.slice(i, i + BATCH));
        }
      } catch (e) {
        console.warn('Fallback offline Kas Warga:', e);
      }
    }
  }

  // =========================================================================
  // TAHAP 3: PROSES SHEET KAS ACARA / DANA ACARA
  // =========================================================================
  const sheetAcaraName = wb.SheetNames.find(n => {
    const un = n.toUpperCase();
    return un.includes('KAS ACARA') || un.includes('DANA ACARA') || un === 'ACARA';
  });

  if (sheetAcaraName) {
    onProgress?.(`Memproses Kas Acara Paguyuban [${sheetAcaraName}]...`, 50);
    const ws = wb.Sheets[sheetAcaraName];
    const rawRows: any[] = XLSX.utils.sheet_to_json(ws, { defval: '' });

    const mapWargaByName = new Map<string, Warga>();
    const mapWargaByRumah = new Map<string, Warga>();
    importedWarga.forEach(w => {
      mapWargaByName.set(cleanTextKey(w.nama_lengkap), w);
      mapWargaByRumah.set(cleanTextKey(w.id_rumah), w);
    });

    let acaraTrxCounter = 1;
    const dbAcaraPayload: any[] = [];

    for (const r of rawRows) {
      let rawNama = '';
      let rawBlok = '';
      let rawNominal: any = 0;
      let rawAcara = 'Acara Silaturahmi Paguyuban Beryl';
      let rawTgl = '2026-01-25';

      for (const [k, v] of Object.entries(r)) {
        const kClean = k.toLowerCase().trim();
        if (kClean.includes('nama') || kClean.includes('donatur')) rawNama = String(v);
        else if (kClean.includes('blok') || kClean.includes('rumah') || kClean.includes('unit')) rawBlok = String(v);
        else if (kClean.includes('iuran') || kClean.includes('nominal') || kClean.includes('jumlah') || kClean.includes('sukarela')) rawNominal = v;
        else if (kClean.includes('acara') || kClean.includes('kegiatan')) rawAcara = String(v);
        else if (kClean.includes('tanggal') || kClean.includes('tgl')) rawTgl = String(v);
      }

      const nominal = cleanNominal(rawNominal);
      const nama = String(rawNama || '').trim();
      if (nominal <= 0 || !nama || nama.toLowerCase().includes('total')) continue;

      const isSponsorLuar = nama.toUpperCase() === 'PMM' || String(rawBlok).toUpperCase().includes('A-Z');
      const foundWarga = isSponsorLuar ? null : (mapWargaByName.get(cleanTextKey(nama)) || mapWargaByRumah.get(cleanTextKey(normalizeIdRumah(rawBlok))));

      const idRumahClean = isSponsorLuar 
        ? 'Beryl-A-Z' 
        : (foundWarga ? foundWarga.id_rumah : (rawBlok ? normalizeIdRumah(String(rawBlok)) : '-'));

      const itemAcara: DanaAcara = {
        id_transaksi: acaraTrxCounter++,
        nama_acara: String(rawAcara || 'Acara Silaturahmi Paguyuban Beryl').trim(),
        id_warga: foundWarga ? foundWarga.id_warga : undefined,
        nama_warga: isSponsorLuar ? `Sponsor PMM (${idRumahClean})` : (foundWarga ? foundWarga.nama_lengkap : nama),
        id_rumah: idRumahClean,
        nama_donatur_luar: isSponsorLuar ? 'PMM (Sponsor Developer)' : (foundWarga ? undefined : `${nama} (${rawBlok})`),
        tanggal: safeDate(rawTgl, '2026-01-25'),
        kategori: 'Pemasukan',
        pos_sub_anggaran: isSponsorLuar ? 'Sponsor Utama PMM' : 'Donasi Sukarela Warga',
        nominal: nominal,
        keterangan: isSponsorLuar ? 'Sponsor Acara Silaturahmi dari PMM' : `Iuran Kas Acara - ${nama} (${rawBlok || '-'})`,
        bukti_nota: 'Import Master Excel - Kas Acara',
      };

      importedAcara.push(itemAcara);
      dbAcaraPayload.push({
        nama_acara: itemAcara.nama_acara,
        id_warga: itemAcara.id_warga || null,
        nama_donatur_luar: itemAcara.nama_donatur_luar || null,
        tanggal: itemAcara.tanggal,
        kategori: itemAcara.kategori,
        pos_sub_anggaran: itemAcara.pos_sub_anggaran,
        nominal: itemAcara.nominal,
        keterangan: itemAcara.keterangan,
        bukti_nota: itemAcara.bukti_nota,
        diinput_oleh: userId,
      });
    }

    if (isSupabaseConfigured && dbAcaraPayload.length > 0) {
      try {
        await supabase.from('dana_acara').insert(dbAcaraPayload);
      } catch (e) {
        console.warn('Fallback offline Dana Acara:', e);
      }
    }
  }

  // =========================================================================
  // TAHAP 4: PROSES SHEET INFAQ MAJELIS AL BAROKAH & RAMADHAN
  // =========================================================================
  const sheetMajelisName = wb.SheetNames.find(n => {
    const un = n.toUpperCase();
    return un.includes('MAJELIS') || un.includes('INFAQ') || un.includes('RAMADHAN');
  });

  if (sheetMajelisName) {
    onProgress?.(`Memproses Infaq Majelis Al Barokah [${sheetMajelisName}]...`, 65);
    const ws = wb.Sheets[sheetMajelisName];
    const rawRows: any[] = XLSX.utils.sheet_to_json(ws, { defval: '' });

    let infaqCounter = 1;
    const dbMajelisPayload: any[] = [];

    for (const r of rawRows) {
      let rawNama = '';
      let rawNominalMasuk = 0;
      let rawNominalKeluar = 0;
      let rawAcara = 'Pengajian Rutin & PHBI Majelis Al Barokah';
      let rawTgl = '2026-01-20';
      let rawKet = '';

      for (const [k, v] of Object.entries(r)) {
        const kClean = k.toLowerCase().trim();
        if (kClean.includes('nama') || kClean.includes('donatur') || kClean.includes('uraian')) rawNama = String(v);
        else if (kClean.includes('masuk') || (kClean.includes('nominal') && !kClean.includes('keluar')) || kClean.includes('jumlah')) rawNominalMasuk = cleanNominal(v);
        else if (kClean.includes('keluar')) rawNominalKeluar = cleanNominal(v);
        else if (kClean.includes('acara') || kClean.includes('kegiatan')) rawAcara = String(v);
        else if (kClean.includes('tanggal') || kClean.includes('tgl')) rawTgl = String(v);
        else if (kClean.includes('keterangan')) rawKet = String(v);
      }

      if (rawNominalMasuk > 0 && rawNama && !rawNama.toLowerCase().includes('total')) {
        const itemM: InfaqMajelis = {
          id_infaq: infaqCounter++,
          nama_donatur_luar: String(rawNama).trim(),
          nama_acara: String(rawAcara).trim(),
          tanggal: safeDate(rawTgl, '2026-01-20'),
          nominal: rawNominalMasuk,
          jenis_dana: 'Pemasukan',
          keterangan: String(rawKet || `Infaq Majelis - ${rawNama}`).trim(),
          bukti_nota: 'Import Master Excel',
        };

        importedMajelis.push(itemM);
        dbMajelisPayload.push({
          nama_acara: itemM.nama_acara,
          nama_donatur_luar: itemM.nama_donatur_luar,
          tanggal: itemM.tanggal,
          nominal: itemM.nominal,
          jenis_dana: 'Pemasukan',
          keterangan: itemM.keterangan,
          bukti_nota: itemM.bukti_nota,
          diinput_oleh: userId,
        });
      }

      if (rawNominalKeluar > 0) {
        importedPengeluaran.push({
          id_pengeluaran: 5000 + infaqCounter,
          pos_anggaran: 'Acara_Majelis_Albarokah',
          tanggal: safeDate(rawTgl, '2026-01-20'),
          keperluan: String(rawNama || 'Pengeluaran Acara Majelis').trim(),
          nominal: rawNominalKeluar,
          bukti_nota: 'Import Master Excel',
        });
      }
    }

    if (isSupabaseConfigured && dbMajelisPayload.length > 0) {
      try {
        await supabase.from('infaq_majelis_albarokah').insert(dbMajelisPayload);
      } catch (e) {
        console.warn('Fallback offline Infaq Majelis:', e);
      }
    }
  }

  // =========================================================================
  // TAHAP 5: PROSES SHEET PENGELUARAN TERPADU
  // =========================================================================
  const sheetPengeluaranName = wb.SheetNames.find(n => {
    const un = n.toUpperCase();
    return un.includes('PENGELUARAN') || un.includes('KELUARAN');
  });

  if (sheetPengeluaranName) {
    onProgress?.(`Memproses Pengeluaran Terpadu [${sheetPengeluaranName}]...`, 80);
    const ws = wb.Sheets[sheetPengeluaranName];
    const rawRows: any[] = XLSX.utils.sheet_to_json(ws, { defval: '' });

    let pengCounter = importedPengeluaran.length + 1;
    const dbPengPayload: any[] = [];

    for (const r of rawRows) {
      let rawKeperluan = '';
      let rawNominal = 0;
      let rawPos = '';
      let rawTgl = '2026-01-15';
      let rawBukti = 'Import Master Excel';

      for (const [k, v] of Object.entries(r)) {
        const kClean = k.toLowerCase().trim();
        if (kClean.includes('keperluan') || kClean.includes('keterangan') || kClean.includes('uraian') || kClean.includes('nama')) rawKeperluan = String(v);
        else if (kClean.includes('nominal') || kClean.includes('jumlah') || kClean.includes('keluar') || kClean.includes('biaya')) rawNominal = cleanNominal(v);
        else if (kClean.includes('pos') || kClean.includes('kategori') || kClean.includes('jenis')) rawPos = String(v).toLowerCase();
        else if (kClean.includes('tanggal') || kClean.includes('tgl')) rawTgl = String(v);
        else if (kClean.includes('bukti') || kClean.includes('nota') || kClean.includes('link')) rawBukti = String(v);
      }

      if (rawNominal > 0 && rawKeperluan && !rawKeperluan.toLowerCase().includes('total')) {
        let posAnggaran: 'Operasional_Warga' | 'Sosial_Warga' | 'Acara_Majelis_Albarokah' | 'Acara_Warga' = 'Operasional_Warga';
        if (rawPos.includes('sosial') || rawPos.includes('santunan')) {
          posAnggaran = 'Sosial_Warga';
        } else if (rawPos.includes('majelis') || rawPos.includes('tarawih') || rawPos.includes('phbi')) {
          posAnggaran = 'Acara_Majelis_Albarokah';
        } else if (rawPos.includes('acara') || rawPos.includes('silaturahmi') || rawPos.includes('lomba')) {
          posAnggaran = 'Acara_Warga';
        }

        const itemP: Pengeluaran = {
          id_pengeluaran: pengCounter++,
          pos_anggaran: posAnggaran as any,
          tanggal: safeDate(rawTgl, '2026-01-15'),
          keperluan: String(rawKeperluan).trim(),
          nominal: rawNominal,
          bukti_nota: String(rawBukti).trim(),
        };

        importedPengeluaran.push(itemP);
        dbPengPayload.push({
          pos_anggaran: itemP.pos_anggaran,
          tanggal: itemP.tanggal,
          keperluan: itemP.keperluan,
          nominal: itemP.nominal,
          bukti_nota: itemP.bukti_nota,
          diinput_oleh: userId,
        });
      }
    }

    if (isSupabaseConfigured && dbPengPayload.length > 0) {
      try {
        await supabase.from('pengeluaran').insert(dbPengPayload);
      } catch (e) {
        console.warn('Fallback offline Pengeluaran:', e);
      }
    }
  }

  // =========================================================================
  // TAHAP 6: PROSES SHEET PINJAMAN WARGA (QARDHUL HASAN)
  // =========================================================================
  const sheetPinjamanName = wb.SheetNames.find(n => {
    const un = n.toUpperCase();
    return un.includes('PINJAMAN') || un.includes('QARDH');
  });

  if (sheetPinjamanName) {
    onProgress?.(`Memproses Pinjaman Sosial [${sheetPinjamanName}]...`, 90);
    const ws = wb.Sheets[sheetPinjamanName];
    const rawRows: any[] = XLSX.utils.sheet_to_json(ws, { defval: '' });

    const mapWargaByName = new Map<string, Warga>();
    const mapWargaByRumah = new Map<string, Warga>();
    importedWarga.forEach(w => {
      mapWargaByName.set(cleanTextKey(w.nama_lengkap), w);
      mapWargaByRumah.set(cleanTextKey(w.id_rumah), w);
    });

    let pinjamCounter = 1;
    const dbPinjamPayload: any[] = [];

    for (const r of rawRows) {
      let rawNama = '';
      let rawBlok = '';
      let rawNominal = 0;
      let rawTgl = '2026-01-25';
      let rawKep = 'Pinjaman Dana Darurat Sosial';

      for (const [k, v] of Object.entries(r)) {
        const kClean = k.toLowerCase().trim();
        if (kClean.includes('nama') || kClean.includes('peminjam')) rawNama = String(v);
        else if (kClean.includes('blok') || kClean.includes('unit') || kClean.includes('rumah')) rawBlok = String(v);
        else if (kClean.includes('nominal') || kClean.includes('jumlah') || kClean.includes('plafon')) rawNominal = cleanNominal(v);
        else if (kClean.includes('tanggal') || kClean.includes('tgl')) rawTgl = String(v);
        else if (kClean.includes('keperluan') || kClean.includes('keterangan') || kClean.includes('alasan')) rawKep = String(v);
      }

      if (rawNominal > 0 && rawNama && !rawNama.toLowerCase().includes('total')) {
        const foundWarga = mapWargaByName.get(cleanTextKey(rawNama)) || mapWargaByRumah.get(cleanTextKey(normalizeIdRumah(rawBlok)));
        const idW = foundWarga ? foundWarga.id_warga : (importedWarga[0]?.id_warga || null);

        importedPinjaman.push({
          id_pinjaman: pinjamCounter++,
          id_warga: idW || 1,
          nama_warga: String(rawNama).trim(),
          id_rumah: foundWarga ? foundWarga.id_rumah : normalizeIdRumah(rawBlok || 'A1/01'),
          tanggal_pinjam: safeDate(rawTgl, '2026-01-25'),
          nominal_pinjaman: rawNominal,
          sisa_pinjaman: rawNominal,
          status_pinjaman: 'Berjalan',
          keterangan: String(rawKep).trim(),
        });

        dbPinjamPayload.push({
          id_warga: idW || null,
          tanggal_pinjam: safeDate(rawTgl, '2026-01-25'),
          nominal_pinjaman: rawNominal,
          sisa_pinjaman: rawNominal,
          status_pinjaman: 'Berjalan',
          keterangan: String(rawKep).trim(),
        });
      }
    }

    if (isSupabaseConfigured && dbPinjamPayload.length > 0) {
      try {
        await supabase.from('pinjaman_warga').insert(dbPinjamPayload);
      } catch (e) {
        console.warn('Fallback offline Pinjaman:', e);
      }
    }
  }

  // =========================================================================
  // TAHAP 7: SIMPAN LOKAL & REAL-TIME BROADCAST
  // =========================================================================
  localStorage.setItem('local_warga', JSON.stringify(importedWarga));
  localStorage.setItem('local_kas', JSON.stringify(importedKas));
  localStorage.setItem('local_dana_acara', JSON.stringify(importedAcara));
  localStorage.setItem('local_majelis', JSON.stringify(importedMajelis));
  localStorage.setItem('local_pengeluaran', JSON.stringify(importedPengeluaran));
  localStorage.setItem('local_pinjaman', JSON.stringify(importedPinjaman));

  window.dispatchEvent(new Event('app_data_updated'));
  onProgress?.('Import Master Berhasil 100%! Semua data telah tersinkron.', 100);

  return {
    totalWarga: importedWarga.length,
    totalKas: importedKas.length,
    totalAcara: importedAcara.length,
    totalMajelis: importedMajelis.length,
    totalPengeluaran: importedPengeluaran.length,
    totalPinjaman: importedPinjaman.length,
  };
};

export default processMasterExcelImport;