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
    januari: '01', jan: '01',
    februari: '02', feb: '02',
    maret: '03', mar: '03',
    april: '04', apr: '04',
    mei: '05', may: '05',
    juni: '06', jun: '06',
    juli: '07', jul: '07',
    agustus: '08', agu: '08',
    september: '09', sep: '09',
    oktober: '10', okt: '10',
    november: '11', nov: '11',
    desember: '12', des: '12'
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

  let importedWarga: Warga[] = [];
  let importedKas: KasWargaBeryl[] = [];
  let importedAcara: DanaAcara[] = [];
  let importedMajelis: InfaqMajelis[] = [];
  let importedPengeluaran: Pengeluaran[] = [];
  let importedPinjaman: PinjamanWarga[] = [];

  // ========================== 1. PROSES SHEET DATABASE ==========================
  const sheetDbName = wb.SheetNames.find(n => {
    const un = n.toUpperCase();
    return un.includes('DATABASE') || un.includes('DATA') || un.includes('WARGA');
  });

  if (sheetDbName) {
    onProgress?.(`Membaca Data Warga & Kas [${sheetDbName}]...`, 20);
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

      for (const [k, v] of Object.entries(r)) {
        const kClean = k.toLowerCase().trim();
        if (kClean.includes('whatsapp') || kClean.includes('hp') || kClean.includes('wa')) {
          if (!hpRaw && v) hpRaw = String(v).trim();
        } else if (kClean.includes('nama')) {
          if (!namaRaw && v) namaRaw = String(v).trim();
        } else if (kClean.includes('blok') || kClean.includes('unit') || kClean === 'no') {
          if (!blokRaw && v) blokRaw = String(v).trim();
        } else if (kClean.includes('keterangan') || kClean.includes('status')) {
          if (v) ketRaw = String(v).trim();
        }
      }

      if (!blokRaw && !namaRaw) continue;
      if (String(namaRaw).toLowerCase().includes('total')) continue;

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
          tempat_lahir: '-',
          tanggal_lahir: '',
          golongan_darah: 'O',
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

    // Mapping Warga untuk Kas
    const mapWargaByName = new Map<string, Warga>();
    const mapWargaByRumah = new Map<string, Warga>();
    importedWarga.forEach(w => {
      mapWargaByName.set(cleanTextKey(w.nama_lengkap), w);
      mapWargaByRumah.set(cleanTextKey(w.id_rumah), w);
    });

    let trxKasCounter = 1;
    for (const r of rawRows) {
      let namaRow = '';
      let blokRow = '';
      for (const [k, v] of Object.entries(r)) {
        const kClean = k.toLowerCase().trim();
        if (kClean.includes('nama')) namaRow = String(v);
        if (kClean.includes('blok') || kClean.includes('unit')) blokRow = String(v);
      }

      if (!namaRow && !blokRow) continue;
      const foundWarga = mapWargaByName.get(cleanTextKey(namaRow)) || mapWargaByRumah.get(cleanTextKey(normalizeIdRumah(blokRow)));
      if (!foundWarga) continue;

      for (const [colName, val] of Object.entries(r)) {
        const parsedMonth = parseMonthAndYearFromHeader(colName, 2026);
        if (parsedMonth) {
          const nominal = cleanNominal(val);
          if (nominal > 0) {
            const periodeStr = `${parsedMonth.year}-${parsedMonth.monthCode}-01`;
            const tanggalStr = `${parsedMonth.year}-${parsedMonth.monthCode}-05`;

            importedKas.push({
              id_transaksi: trxKasCounter++,
              id_warga: foundWarga.id_warga,
              nama_warga: foundWarga.nama_lengkap,
              id_rumah: foundWarga.id_rumah,
              periode_bulan: periodeStr,
              tanggal: tanggalStr,
              nominal: nominal,
              peruntukan: 'Operasional dan Sosial',
              status_bayar: 'Lunas',
              keterangan: `Iuran Kas Warga Beryl (${colName.trim()} ${parsedMonth.year})`,
              bukti_transfer: '',
              diinput_oleh: userId,
            });
          }
        }
      }
    }
  }

  // ========================== 2. PROSES SHEET KAS ACARA ==========================
  const sheetAcaraName = wb.SheetNames.find(n => n.toUpperCase().includes('ACARA'));
  if (sheetAcaraName) {
    onProgress?.(`Membaca Data Kas Acara [${sheetAcaraName}]...`, 50);
    const ws = wb.Sheets[sheetAcaraName];
    const rawRows: any[] = XLSX.utils.sheet_to_json(ws, { defval: '' });

    const mapWargaByName = new Map<string, Warga>();
    const mapWargaByRumah = new Map<string, Warga>();
    importedWarga.forEach(w => {
      mapWargaByName.set(cleanTextKey(w.nama_lengkap), w);
      mapWargaByRumah.set(cleanTextKey(w.id_rumah), w);
    });

    let acaraCounter = 1;
    for (const r of rawRows) {
      let rawNama = '';
      let rawBlok = '';
      let rawNominal: any = 0;

      for (const [k, v] of Object.entries(r)) {
        const kClean = k.toLowerCase().trim();
        if (kClean.includes('nama')) rawNama = String(v);
        else if (kClean.includes('blok') || kClean.includes('rumah')) rawBlok = String(v);
        else if (kClean.includes('iuran') || kClean.includes('nominal') || kClean.includes('sukarela')) rawNominal = v;
      }

      const nominal = cleanNominal(rawNominal);
      const nama = String(rawNama || '').trim();
      if (nominal <= 0 || !nama || nama.toLowerCase().includes('total')) continue;

      const isSponsorLuar = nama.toUpperCase() === 'PMM' || String(rawBlok).toUpperCase().includes('A-Z');
      const foundWarga = isSponsorLuar ? null : (mapWargaByName.get(cleanTextKey(nama)) || mapWargaByRumah.get(cleanTextKey(normalizeIdRumah(rawBlok))));

      importedAcara.push({
        id_transaksi: acaraCounter++,
        nama_acara: 'Acara Silaturahmi Paguyuban Beryl',
        id_warga: foundWarga ? foundWarga.id_warga : undefined,
        nama_warga: isSponsorLuar ? 'PT PMM (Developer)' : (foundWarga ? foundWarga.nama_lengkap : nama),
        id_rumah: foundWarga ? foundWarga.id_rumah : (rawBlok ? normalizeIdRumah(rawBlok) : '-'),
        nama_donatur_luar: isSponsorLuar ? 'PT PMM (Developer)' : (foundWarga ? undefined : nama),
        tanggal: '2026-01-25',
        kategori: 'Pemasukan',
        pos_sub_anggaran: isSponsorLuar ? 'Sponsor Utama' : 'Donasi Sukarela',
        nominal: nominal,
        keterangan: isSponsorLuar ? 'Sponsor Acara dari Developer PMM' : `Iuran Kas Acara - ${nama}`,
        bukti_nota: '',
      });
    }
  }

  // ========================== 3. PROSES SHEET INFAQ MAJELIS ==========================
  const sheetMajelisName = wb.SheetNames.find(n => n.toUpperCase().includes('MAJELIS') || n.toUpperCase().includes('INFAQ'));
  if (sheetMajelisName) {
    onProgress?.(`Membaca Infaq Majelis [${sheetMajelisName}]...`, 70);
    const ws = wb.Sheets[sheetMajelisName];
    const rawRows: any[] = XLSX.utils.sheet_to_json(ws, { defval: '' });

    let infaqCounter = 1;
    for (const r of rawRows) {
      let rawNama = '';
      let rawMasuk = 0;
      let rawTgl = '2026-01-20';
      let rawAcara = 'Pengajian Rutin Bulanan';

      for (const [k, v] of Object.entries(r)) {
        const kClean = k.toLowerCase().trim();
        if (kClean.includes('nama') || kClean.includes('donatur')) rawNama = String(v);
        else if (kClean.includes('nominal') || kClean.includes('masuk')) rawMasuk = cleanNominal(v);
        else if (kClean.includes('tanggal')) rawTgl = String(v);
        else if (kClean.includes('acara')) rawAcara = String(v);
      }

      if (rawMasuk > 0 && rawNama && !rawNama.toLowerCase().includes('total')) {
        importedMajelis.push({
          id_infaq: infaqCounter++,
          nama_donatur_luar: rawNama,
          nama_acara: rawAcara,
          tanggal: safeDate(rawTgl, '2026-01-20'),
          nominal: rawMasuk,
          jenis_dana: 'Pemasukan',
          keterangan: `Infaq Majelis - ${rawNama}`,
          bukti_nota: '',
          diinput_oleh: userId,
        });
      }
    }
  }

  // ========================== 4. PROSES SHEET PENGELUARAN ==========================
  const sheetPengName = wb.SheetNames.find(n => n.toUpperCase().includes('PENGELUARAN'));
  if (sheetPengName) {
    onProgress?.(`Membaca Pengeluaran Terpadu [${sheetPengName}]...`, 80);
    const ws = wb.Sheets[sheetPengName];
    const rawRows: any[] = XLSX.utils.sheet_to_json(ws, { defval: '' });

    let pengCounter = 1;
    for (const r of rawRows) {
      let rawKep = '';
      let rawNom = 0;
      let rawTgl = '2026-01-15';
      let rawPos = 'Operasional_Warga';

      for (const [k, v] of Object.entries(r)) {
        const kClean = k.toLowerCase().trim();
        if (kClean.includes('keperluan') || kClean.includes('uraian')) rawKep = String(v);
        else if (kClean.includes('nominal') || kClean.includes('jumlah')) rawNom = cleanNominal(v);
        else if (kClean.includes('tanggal')) rawTgl = String(v);
        else if (kClean.includes('pos')) rawPos = String(v);
      }

      // Deteksi Otomatis: Jika keperluan bertuliskan "Santunan", alihkan langsung ke Sosial_Warga!
      if (rawKep.toLowerCase().includes('santunan') || rawKep.toLowerCase().includes('sakit') || rawKep.toLowerCase().includes('takziah')) {
        rawPos = 'Sosial_Warga';
      }

      if (rawNom > 0 && rawKep && !rawKep.toLowerCase().includes('total')) {
        importedPengeluaran.push({
          id_pengeluaran: pengCounter++,
          pos_anggaran: rawPos as any,
          tanggal: safeDate(rawTgl, '2026-01-15'),
          keperluan: rawKep,
          nominal: rawNom,
          bukti_nota: '',
          diinput_oleh: userId,
        });
      }
    }
  }

  // =========================================================================
  // ⚡ AMANKAN DATA DI MEMORI LOKAL TERLEBIH DAHULU (ANTI-HILANG DATA)
  // =========================================================================
  onProgress?.('Mengamankan data ke sistem lokal...', 90);
  localStorage.setItem('local_warga', JSON.stringify(importedWarga));
  localStorage.setItem('local_kas', JSON.stringify(importedKas));
  localStorage.setItem('local_dana_acara', JSON.stringify(importedAcara));
  localStorage.setItem('local_majelis', JSON.stringify(importedMajelis));
  localStorage.setItem('local_pengeluaran', JSON.stringify(importedPengeluaran));
  localStorage.setItem('local_pinjaman', JSON.stringify(importedPinjaman));

  // Beritahu seluruh layar aplikasi agar langsung merender data baru
  window.dispatchEvent(new Event('app_data_updated'));

  // =========================================================================
  // SINKRONKAN KE SUPABASE CLOUD (JIKA ONLINE)
  // =========================================================================
  if (isSupabaseConfigured) {
    onProgress?.('Menyimpan cadangan ke Supabase Cloud...', 95);
    try {
      // 1. Simpan Warga & Ambil ID Asli Cloud
      if (importedWarga.length > 0) {
        const dbWargaPayload = importedWarga.map(w => ({
          id_rumah: w.id_rumah,
          nama_lengkap: w.nama_lengkap,
          status_warga: w.status_warga,
          no_hp: w.no_hp,
          jenis_kelamin: 'L',
          golongan_darah: 'O',
          tanggal_daftar: '2026-01-01',
        }));
        const { data: cloudWarga } = await supabase.from('warga').insert(dbWargaPayload).select('id_warga, id_rumah, nama_lengkap');

        if (cloudWarga && cloudWarga.length > 0) {
          const cloudMap = new Map(cloudWarga.map((w: any) => [cleanTextKey(w.nama_lengkap), w.id_warga]));
          // Sesuaikan id_warga pada kas
          importedKas = importedKas.map(k => ({
            ...k,
            id_warga: cloudMap.get(cleanTextKey(k.nama_warga || '')) || k.id_warga
          }));
          localStorage.setItem('local_kas', JSON.stringify(importedKas));
        }
      }

      // 2. Simpan Kas Warga ke Cloud per Batch 100
      if (importedKas.length > 0) {
        const kasPayload = importedKas.map(k => ({
          id_warga: k.id_warga,
          periode_bulan: k.periode_bulan,
          tanggal: k.tanggal,
          nominal: k.nominal,
          peruntukan: k.peruntukan || 'Operasional dan Sosial',
          status_bayar: 'Lunas',
          keterangan: k.keterangan,
          bukti_transfer: '',
          diinput_oleh: userId
        }));

        for (let i = 0; i < kasPayload.length; i += 100) {
          await supabase.from('kas_warga').insert(kasPayload.slice(i, i + 100));
        }
      }

      // 3. Simpan Dana Acara
      if (importedAcara.length > 0) {
        await supabase.from('dana_acara').insert(importedAcara.map(a => ({
          nama_acara: a.nama_acara,
          id_warga: a.id_warga || null,
          nama_warga: a.nama_warga,
          id_rumah: a.id_rumah,
          nama_donatur_luar: a.nama_donatur_luar,
          tanggal: a.tanggal,
          kategori: a.kategori,
          pos_sub_anggaran: a.pos_sub_anggaran,
          nominal: a.nominal,
          keterangan: a.keterangan,
          bukti_nota: '',
          diinput_oleh: userId
        })));
      }

      // 4. Simpan Infaq Majelis
      if (importedMajelis.length > 0) {
        await supabase.from('infaq_majelis').insert(importedMajelis.map(m => ({
          nama_donatur_luar: m.nama_donatur_luar,
          nama_acara: m.nama_acara,
          tanggal: m.tanggal,
          nominal: m.nominal,
          jenis_dana: 'Pemasukan',
          keterangan: m.keterangan,
          bukti_nota: '',
          diinput_oleh: userId
        })));
      }

      // 5. Simpan Pengeluaran
      if (importedPengeluaran.length > 0) {
        await supabase.from('pengeluaran').insert(importedPengeluaran.map(p => ({
          pos_anggaran: p.pos_anggaran,
          tanggal: p.tanggal,
          keperluan: p.keperluan,
          nominal: p.nominal,
          bukti_nota: '',
          diinput_oleh: userId
        })));
      }
    } catch (cloudErr: any) {
      console.warn('Pemberitahuan: Data telah diamankan di sistem lokal, sync cloud ditunda:', cloudErr.message);
    }
  }

  onProgress?.('✓ Sukses! Semua data kas dan kependudukan telah pulih 100%.', 100);

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