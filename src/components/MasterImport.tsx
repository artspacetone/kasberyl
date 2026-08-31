import React, { useState, useCallback } from 'react';
import {
  X, Upload, FileSpreadsheet, CheckCircle2, AlertCircle, Loader2, Database, Users, Wallet, Calendar, BookOpen, Zap
} from 'lucide-react';
import { supabase } from '../supabase';
import { getXLSX } from '../lib/excel';

// ============================================================
// KONFIGURASI BULAN
// ============================================================
const MONTH_NAMES_FULL = [
  'Januari','Februari','Maret','April','Mei','Juni',
  'Juli','Agustus','September','Oktober','November','Desember'
];
const MONTH_KEYS = ['01','02','03','04','05','06','07','08','09','10','11','12'];

// ============================================================
// NORMALISASI ID RUMAH: 'A1/03' → 'Beryl-A1-03'
// ============================================================
const normalizeIdRumah = (raw: string): string => {
  const s = String(raw || '').trim().toUpperCase().replace(/\s+/g, '');
  // Coba format 'A1/03', 'A1/3', 'A1-03', 'A 1 03'
  const match = s.match(/^([A-Z]+)[\/\-\s]?(\d+)[\/\-\s]?(\d+)$/);
  if (match) {
    const blok = match[1];
    const nomor = match[3].padStart(2, '0');
    return `Beryl-${blok}-${nomor}`;
  }
  // Fallback
  return `Beryl-${s}`;
};

// ============================================================
// SANITASI STATUS HUNIAN
// ============================================================
const sanitizeStatusHunian = (val: any): string => {
  if (!val) return 'Menetap';
  const s = String(val).trim().toLowerCase();
  if (s.includes('kunjung')) return 'Kunjungan';
  if (s.includes('sewa') || s.includes('kontrak')) return 'Penyewa';
  if (s.includes('kosong')) return 'Kosong';
  return 'Menetap';
};

// ============================================================
// FORMAT TANGGAL AMAN
// ============================================================
const safeDate = (val: any, fallback: string = '2026-01-01'): string => {
  if (!val) return fallback;
  if (val instanceof Date) {
    const y = val.getFullYear();
    const m = String(val.getMonth() + 1).padStart(2, '0');
    const d = String(val.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }
  const str = String(val).trim();
  const isoMatch = str.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})/);
  if (isoMatch) return `${isoMatch[1]}-${isoMatch[2].padStart(2,'0')}-${isoMatch[3].padStart(2,'0')}`;
  const indoMatch = str.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{4})/);
  if (indoMatch) return `${indoMatch[3]}-${indoMatch[2].padStart(2,'0')}-${indoMatch[1].padStart(2,'0')}`;
  return fallback;
};

// ============================================================
// FUNGSI BACA SHEET DENGAN HEADER DI BARIS TERTENTU
// ============================================================
// Fungsi helper baca sheet dengan header di baris tertentu
// XLSX instance dilewatkan sebagai parameter agar tidak dependen pada global
const readSheetFromRow = (XLSX: any, wb: any, sheetName: string, headerRow: number): any[] => {
  if (!wb.SheetNames.includes(sheetName)) return [];
  const ws = wb.Sheets[sheetName];
  if (!ws) return [];
  const ref = ws['!ref'];
  if (!ref) return [];
  const range = XLSX.utils.decode_range(ref);
  // Ambil data mulai dari headerRow (0-indexed)
  const jsonData: any[] = [];
  const headers: string[] = [];
  for (let c = range.s.c; c <= range.e.c; c++) {
    const cellAddr = XLSX.utils.encode_cell({ r: headerRow, c });
    const cell = ws[cellAddr];
    headers.push(cell ? String(cell.v).trim() : `col_${c}`);
  }
  for (let r = headerRow + 1; r <= range.e.r; r++) {
    const row: any = {};
    let hasData = false;
    for (let c = range.s.c; c <= range.e.c; c++) {
      const cellAddr = XLSX.utils.encode_cell({ r, c });
      const cell = ws[cellAddr];
      const val = cell ? (cell.t === 'n' ? cell.v : (cell.w || cell.v)) : null;
      row[headers[c - range.s.c]] = val;
      if (val !== null && val !== undefined && val !== '') hasData = true;
    }
    if (hasData) jsonData.push(row);
  }
  return jsonData;
};

// ============================================================
// TIPE LOG PROGRESS
// ============================================================
interface LogEntry {
  type: 'info' | 'success' | 'error' | 'warn';
  msg: string;
}

interface ImportResult {
  rumah: number;
  warga: number;
  kasPemasukan: number;
  kasPengeluaran: number;
  danaAcaraMasuk: number;
  danaAcaraKeluar: number;
  infaqMasuk: number;
  infaqKeluar: number;
}

// ============================================================
// KOMPONEN UTAMA
// ============================================================
interface MasterImportProps {
  show: boolean;
  onClose: () => void;
  onImportComplete?: () => void;
}

export const MasterImport = ({ show, onClose, onImportComplete }: MasterImportProps) => {
  const [step, setStep] = useState<'idle' | 'uploading' | 'processing' | 'done' | 'error'>('idle');
  const [progress, setProgress] = useState(0);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [resetBeforeImport, setResetBeforeImport] = useState(false);
  const [selectedSheets, setSelectedSheets] = useState<Set<string>>(new Set([
    'DATABASE', 'PENGELUARAN', 'DAILY REPORT', 'KAS ACARA', 'INFAQ RAMADHAN'
  ]));
  const [availableSheets, setAvailableSheets] = useState<string[]>([]);
  const [pendingWorkbook, setPendingWorkbook] = useState<any>(null);

  const addLog = useCallback((type: LogEntry['type'], msg: string) => {
    setLogs(prev => [...prev, { type, msg }]);
  }, []);

  const reset = () => {
    setStep('idle');
    setProgress(0);
    setLogs([]);
    setResult(null);
    setPendingWorkbook(null);
    setAvailableSheets([]);
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  // ============================================================
  // TAHAP 1: BACA FILE EXCEL & DETEKSI SHEET
  // ============================================================
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setStep('uploading');
    addLog('info', `Membaca file: ${file.name} (${(file.size / 1024).toFixed(1)} KB)`);

    try {
      const XLSX = await getXLSX();
      const buffer = await file.arrayBuffer();
      const wb = XLSX.read(buffer, { type: 'array', cellDates: true });

      addLog('success', `File berhasil dibaca. Ditemukan ${wb.SheetNames.length} sheet:`);
      wb.SheetNames.forEach(name => addLog('info', `  📄 ${name}`));

      setAvailableSheets(wb.SheetNames);
      setPendingWorkbook(wb);
      setStep('idle');
    } catch (err: any) {
      addLog('error', 'Gagal membaca file Excel: ' + err.message);
      setStep('error');
    }

    e.target.value = '';
  };

  // ============================================================
  // TAHAP 2: PROSES IMPORT MULTI-SHEET
  // ============================================================
  const startImport = async () => {
    if (!pendingWorkbook) return;

    if (resetBeforeImport) {
      if (!confirm('PERHATIAN: Semua data lama akan dihapus sebelum import. Lanjutkan?')) return;
    }

    setStep('processing');
    setProgress(5);

    const importResult: ImportResult = {
      rumah: 0, warga: 0, kasPemasukan: 0, kasPengeluaran: 0,
      danaAcaraMasuk: 0, danaAcaraKeluar: 0, infaqMasuk: 0, infaqKeluar: 0
    };

    try {
      const XLSX = await getXLSX();
      const wb = pendingWorkbook;

      // Hapus data lama jika diminta
      if (resetBeforeImport) {
        addLog('warn', 'Menghapus semua data lama...');
        await supabase.from('kas_warga').delete().neq('id_transaksi', 0);
        await supabase.from('dana_acara').delete().neq('id_transaksi', 0);
        await supabase.from('warga').delete().neq('id_warga', 0);
        await supabase.from('rumah').delete().neq('id_rumah', '0');
        addLog('success', 'Data lama berhasil dihapus.');
      }
      setProgress(10);

      // Load warga existing untuk mapping ID
      const { data: existingWarga } = await supabase.from('warga').select('id_warga, nama_lengkap, id_rumah');
      const wargaMapByName = new Map((existingWarga || []).map(w => [w.nama_lengkap.toLowerCase().trim(), w.id_warga]));
      const wargaMapByRumah = new Map((existingWarga || []).map(w => [w.id_rumah?.toLowerCase().trim(), w.id_warga]));

      // Load existing rumah
      const { data: existingRumah } = await supabase.from('rumah').select('id_rumah');
      const existingRumahSet = new Set((existingRumah || []).map(r => r.id_rumah));

      // =========================================================
      // SHEET 1: DATABASE → rumah + warga + kas_warga (iuran bulanan)
      // =========================================================
      if (selectedSheets.has('DATABASE') && wb.SheetNames.includes('DATABASE')) {
        addLog('info', '═══════════════════════════════════');
        addLog('info', 'Memproses sheet DATABASE...');
        const dbRows = readSheetFromRow(XLSX, wb, 'DATABASE', 4); // header di baris ke-5 (index 4)
        addLog('info', `Ditemukan ${dbRows.length} baris data warga.`);

        const rumahToUpsert: any[] = [];
        const wargaToInsert: any[] = [];
        const kasPemasukan: any[] = [];
        const newWargaMap = new Map<string, number>(); // id_rumah → id_warga (sementara)

        for (const row of dbRows) {
          const blokNomor = String(row['Blok / Nomor'] || '').trim();
          const nama = String(row['Nama'] || '').trim();
          const whatsapp = row['Nomor Whatsapp'];
          const keterangan = String(row['Keterangan'] || '').trim();

          if (!blokNomor) continue; // skip baris kosong

          const idRumah = normalizeIdRumah(blokNomor);
          const statusHunian = sanitizeStatusHunian(keterangan);
          const hpStr = whatsapp ? String(whatsapp).replace(/\D/g, '') : '';
          const noHp = hpStr ? (hpStr.startsWith('0') ? '62' + hpStr.substring(1) : hpStr) : '';

          // 1. Siapkan data rumah
          if (!existingRumahSet.has(idRumah) && !rumahToUpsert.find(r => r.id_rumah === idRumah)) {
            rumahToUpsert.push({
              id_rumah: idRumah,
              blok_nomor: blokNomor.replace(/\//g, '-'),
              status_hunian: statusHunian,
              nama_pemilik_asli: nama || '-',
              no_hp_pemilik_asli: noHp || '-',
              tgl_mulai_huni: '2025-01-01',
            });
          }

          // 2. Siapkan data warga (hanya jika ada nama)
          if (nama) {
            const existingId = wargaMapByName.get(nama.toLowerCase()) || wargaMapByRumah.get(idRumah.toLowerCase());
            if (!existingId && !wargaToInsert.find(w => w.nama_lengkap?.toLowerCase() === nama.toLowerCase())) {
              wargaToInsert.push({
                id_rumah: idRumah,
                nama_lengkap: nama,
                no_hp: noHp || '-',
                jenis_kelamin: 'L',
                peran_keluarga: 'Kepala Keluarga',
                tempat_tgl_lahir: '-',
                agama: 'Islam',
                pekerjaan: '-',
                golongan_darah: '-',
                status_warga: 'Aktif',
                tanggal_bergabung: '2025-01-01',
              });
            }
          }
        }

        // Insert rumah
        if (rumahToUpsert.length > 0) {
          const { error } = await supabase.from('rumah').upsert(rumahToUpsert);
          if (error) throw new Error(`Gagal insert rumah: ${error.message}`);
          importResult.rumah = rumahToUpsert.length;
          addLog('success', `${rumahToUpsert.length} data rumah berhasil disimpan.`);
        }
        setProgress(25);

        // Insert warga
        let insertedWarga: any[] = [];
        if (wargaToInsert.length > 0) {
          // Insert per batch 50 untuk menghindari timeout
          const BATCH = 50;
          for (let i = 0; i < wargaToInsert.length; i += BATCH) {
            const batch = wargaToInsert.slice(i, i + BATCH);
            const { data, error } = await supabase.from('warga').insert(batch).select('id_warga, nama_lengkap, id_rumah');
            if (error) throw new Error(`Gagal insert warga batch ${i}: ${error.message}`);
            if (data) insertedWarga.push(...data);
          }
          importResult.warga = wargaToInsert.length;
          addLog('success', `${wargaToInsert.length} data warga berhasil disimpan.`);
        }
        setProgress(35);

        // Refresh warga map setelah insert
        const { data: refreshedWarga } = await supabase.from('warga').select('id_warga, nama_lengkap, id_rumah');
        const finalWargaByName = new Map((refreshedWarga || []).map(w => [w.nama_lengkap.toLowerCase().trim(), w.id_warga]));
        const finalWargaByRumah = new Map((refreshedWarga || []).map(w => [w.id_rumah?.toLowerCase().trim(), w.id_warga]));

        // 3. Proses iuran kas bulanan dari kolom Januari-Desember (2 tahun)
        for (const row of dbRows) {
          const blokNomor = String(row['Blok / Nomor'] || '').trim();
          const nama = String(row['Nama'] || '').trim();
          if (!blokNomor) continue;

          const idRumah = normalizeIdRumah(blokNomor);
          const idWarga = finalWargaByName.get(nama.toLowerCase()) || finalWargaByRumah.get(idRumah.toLowerCase());
          if (!idWarga) continue;

          // 12 bulan pertama (tahun 2026)
          for (let m = 0; m < 12; m++) {
            const monthName = MONTH_NAMES_FULL[m];
            const val = row[monthName];
            if (val !== null && val !== undefined && val !== '') {
              const nominal = Number(val);
              if (!isNaN(nominal) && nominal > 0) {
                kasPemasukan.push({
                  id_warga_pembayar: idWarga,
                  periode_bulan: `2026-${MONTH_KEYS[m]}-01`,
                  tanggal: `2026-${MONTH_KEYS[m]}-05`,
                  kategori: 'Pemasukan',
                  nominal: nominal,
                  keterangan: `Import Master Excel (${monthName} 2026)`,
                  status_bayar: 'Lunas',
                  bukti_transfer: 'Import Master Excel',
                  diinput_oleh: 1,
                });
              }
            }
          }

          // 12 bulan kedua (tahun 2027) - kolom ke-17 s/d 28
          const allKeys = Object.keys(row);
          for (let m = 0; m < 12; m++) {
            // Kolom 16-27 (index 16 s/d 27) = Januari-Desember tahun ke-2
            const colIndex = 16 + m;
            if (colIndex < allKeys.length) {
              const val = row[allKeys[colIndex]];
              if (val !== null && val !== undefined && val !== '') {
                const nominal = Number(val);
                if (!isNaN(nominal) && nominal > 0) {
                  kasPemasukan.push({
                    id_warga_pembayar: idWarga,
                    periode_bulan: `2027-${MONTH_KEYS[m]}-01`,
                    tanggal: `2027-${MONTH_KEYS[m]}-05`,
                    kategori: 'Pemasukan',
                    nominal: nominal,
                    keterangan: `Import Master Excel (${MONTH_NAMES_FULL[m]} 2027)`,
                    status_bayar: 'Lunas',
                    bukti_transfer: 'Import Master Excel',
                    diinput_oleh: 1,
                  });
                }
              }
            }
          }
        }

        // Insert kas pemasukan per batch
        if (kasPemasukan.length > 0) {
          const BATCH = 100;
          for (let i = 0; i < kasPemasukan.length; i += BATCH) {
            const batch = kasPemasukan.slice(i, i + BATCH);
            const { error } = await supabase.from('kas_warga').insert(batch);
            if (error) throw new Error(`Gagal insert kas pemasukan batch ${i}: ${error.message}`);
          }
          importResult.kasPemasukan = kasPemasukan.length;
          addLog('success', `${kasPemasukan.length} transaksi iuran kas berhasil disimpan.`);
        }
        setProgress(50);
      }

      // =========================================================
      // SHEET 2: PENGELUARAN → kas_warga (Pengeluaran) + dana_acara
      // =========================================================
      if (selectedSheets.has('PENGELUARAN') && wb.SheetNames.includes('PENGELUARAN')) {
        addLog('info', '═══════════════════════════════════');
        addLog('info', 'Memproses sheet PENGELUARAN...');
        const pengRows = readSheetFromRow(XLSX, wb, 'PENGELUARAN', 2); // header di baris ke-3
        addLog('info', `Ditemukan ${pengRows.length} baris pengeluaran.`);

        const kasPengeluaran: any[] = [];
        const acaraPengeluaran: any[] = [];

        for (const row of pengRows) {
          const tanggal = safeDate(row['Tanggal'], '2026-01-01');
          const keperluan = String(row['Keperluan'] || '-').trim();
          const jumlah = Number(row['Jumlah (Rp)'] || 0);
          const kategori = String(row['Kategori'] || 'Operasional').trim();
          const bukti = String(row['Bukti'] || 'Import Master Excel').trim();

          if (jumlah <= 0) continue;

          if (kategori.toLowerCase().includes('acara')) {
            acaraPengeluaran.push({
              nama_acara: 'Acara Paguyuban Beryl',
              tanggal,
              kategori: 'Pengeluaran',
              nominal: jumlah,
              keterangan: keperluan,
              status_bayar: 'Lunas',
              bukti_transfer: bukti,
              diinput_oleh: 1,
            });
          } else {
            kasPengeluaran.push({
              periode_bulan: tanggal.slice(0, 7) + '-01',
              tanggal,
              kategori: 'Pengeluaran',
              nominal: jumlah,
              keterangan: keperluan,
              status_bayar: 'Lunas',
              bukti_transfer: bukti,
              diinput_oleh: 1,
            });
          }
        }

        if (kasPengeluaran.length > 0) {
          const BATCH = 50;
          for (let i = 0; i < kasPengeluaran.length; i += BATCH) {
            const { error } = await supabase.from('kas_warga').insert(kasPengeluaran.slice(i, i + BATCH));
            if (error) throw new Error(`Gagal insert pengeluaran kas batch ${i}: ${error.message}`);
          }
          importResult.kasPengeluaran = kasPengeluaran.length;
          addLog('success', `${kasPengeluaran.length} pengeluaran kas operasional disimpan.`);
        }

        if (acaraPengeluaran.length > 0) {
          const BATCH = 50;
          for (let i = 0; i < acaraPengeluaran.length; i += BATCH) {
            const { error } = await supabase.from('dana_acara').insert(acaraPengeluaran.slice(i, i + BATCH));
            if (error) throw new Error(`Gagal insert pengeluaran acara batch ${i}: ${error.message}`);
          }
          importResult.danaAcaraKeluar = acaraPengeluaran.length;
          addLog('success', `${acaraPengeluaran.length} pengeluaran dana acara disimpan.`);
        }
        setProgress(60);
      }

      // =========================================================
      // SHEET 3: DAILY REPORT → kas_warga + dana_acara
      // =========================================================
      if (selectedSheets.has('DAILY REPORT') && wb.SheetNames.includes('DAILY REPORT')) {
        addLog('info', '═══════════════════════════════════');
        addLog('info', 'Memproses sheet DAILY REPORT...');
        const dailyRows = readSheetFromRow(XLSX, wb, 'DAILY REPORT', 2);
        addLog('info', `Ditemukan ${dailyRows.length} baris daily report.`);

        const { data: refreshedWarga2 } = await supabase.from('warga').select('id_warga, nama_lengkap, id_rumah');
        const wargaByName2 = new Map((refreshedWarga2 || []).map(w => [w.nama_lengkap.toLowerCase().trim(), w.id_warga]));

        let dailyKasCount = 0;
        let dailyAcaraCount = 0;
        const dailyKasBatch: any[] = [];
        const dailyAcaraBatch: any[] = [];

        for (const row of dailyRows) {
          const blokNo = String(row['Blok / No'] || '').trim();
          const kasOps = Number(row['Kas Operasional'] || 0);
          const danaSosial = Number(row['Dana Sosial'] || 0);
          const bulan = String(row['Bulan'] || 'Januari').trim();
          const tanggal = Number(row['Tanggal'] || 1);

          if (!blokNo && kasOps === 0 && danaSosial === 0) continue;

          // Parse bulan
          const monthIdx = MONTH_NAMES_FULL.findIndex(m => bulan.toLowerCase().startsWith(m.toLowerCase().substring(0, 3)));
          const monthCode = monthIdx >= 0 ? MONTH_KEYS[monthIdx] : '01';
          const dayStr = String(tanggal).padStart(2, '0');
          const tanggalStr = `2026-${monthCode}-${dayStr}`;

          // Cari ID warga berdasarkan blok atau nama
          const idRumah = normalizeIdRumah(blokNo);
          const idWarga = wargaByName2.get(blokNo.toLowerCase()) || wargaByName2.get(idRumah.toLowerCase());

          if (kasOps > 0) {
            dailyKasBatch.push({
              id_warga_pembayar: idWarga || null,
              periode_bulan: `2026-${monthCode}-01`,
              tanggal: tanggalStr,
              kategori: 'Pemasukan',
              nominal: kasOps,
              keterangan: `Import Daily Report (${blokNo})`,
              status_bayar: 'Lunas',
              bukti_transfer: 'Import Daily Report',
              diinput_oleh: 1,
            });
            dailyKasCount++;
          }

          if (danaSosial > 0) {
            dailyAcaraBatch.push({
              nama_acara: 'Kas Sosial Warga',
              id_warga_pembayar: idWarga || null,
              tanggal: tanggalStr,
              kategori: 'Pemasukan',
              nominal: danaSosial,
              keterangan: `Import Daily Report - Dana Sosial (${blokNo})`,
              status_bayar: 'Lunas',
              bukti_transfer: 'Import Daily Report',
              diinput_oleh: 1,
            });
            dailyAcaraCount++;
          }
        }

        if (dailyKasBatch.length > 0) {
          const BATCH = 100;
          for (let i = 0; i < dailyKasBatch.length; i += BATCH) {
            const { error } = await supabase.from('kas_warga').insert(dailyKasBatch.slice(i, i + BATCH));
            if (error) throw new Error(`Gagal insert daily kas batch ${i}: ${error.message}`);
          }
          importResult.kasPemasukan += dailyKasCount;
          addLog('success', `${dailyKasCount} transaksi kas operasional dari daily report disimpan.`);
        }

        if (dailyAcaraBatch.length > 0) {
          const BATCH = 100;
          for (let i = 0; i < dailyAcaraBatch.length; i += BATCH) {
            const { error } = await supabase.from('dana_acara').insert(dailyAcaraBatch.slice(i, i + BATCH));
            if (error) throw new Error(`Gagal insert daily acara batch ${i}: ${error.message}`);
          }
          importResult.danaAcaraMasuk += dailyAcaraCount;
          addLog('success', `${dailyAcaraCount} transaksi dana sosial dari daily report disimpan.`);
        }
        setProgress(70);
      }

      // =========================================================
      // SHEET 4: KAS ACARA → dana_acara (Pemasukan)
      // =========================================================
      if (selectedSheets.has('KAS ACARA') && wb.SheetNames.includes('KAS ACARA')) {
        addLog('info', '═══════════════════════════════════');
        addLog('info', 'Memproses sheet KAS ACARA...');
        const acaraRows = readSheetFromRow(XLSX, wb, 'KAS ACARA', 1); // header di baris ke-2
        addLog('info', `Ditemukan ${acaraRows.length} baris kas acara.`);

        const { data: refreshedWarga3 } = await supabase.from('warga').select('id_warga, nama_lengkap, id_rumah');
        const wargaByName3 = new Map((refreshedWarga3 || []).map(w => [w.nama_lengkap.toLowerCase().trim(), w.id_warga]));

        const acaraBatch: any[] = [];
        let acaraCount = 0;

        for (const row of acaraRows) {
          const nama = String(row['Nama Lengkap'] || '').trim();
          const blok = String(row['Blok / Nomor Rumah'] || '').trim();
          const nominal = Number(row['Iuran Kas Acara (Sukarela)'] || 0);

          if (nominal <= 0) continue;
          if (nama.toLowerCase().includes('pmm') || nama.toLowerCase().includes('total')) continue; // skip summary rows

          const idWarga = wargaByName3.get(nama.toLowerCase());

          acaraBatch.push({
            nama_acara: 'Kas Acara Paguyuban Beryl',
            id_warga_pembayar: idWarga || null,
            tanggal: '2026-01-25',
            kategori: 'Pemasukan',
            nominal: nominal,
            keterangan: `Iuran Kas Acara - ${nama} (${blok})`,
            status_bayar: 'Lunas',
            bukti_transfer: 'Import Master Excel - Kas Acara',
            diinput_oleh: 1,
          });
          acaraCount++;
        }

        if (acaraBatch.length > 0) {
          const BATCH = 50;
          for (let i = 0; i < acaraBatch.length; i += BATCH) {
            const { error } = await supabase.from('dana_acara').insert(acaraBatch.slice(i, i + BATCH));
            if (error) throw new Error(`Gagal insert kas acara batch ${i}: ${error.message}`);
          }
          importResult.danaAcaraMasuk += acaraCount;
          addLog('success', `${acaraCount} donasi kas acara disimpan.`);
        }
        setProgress(80);
      }

      // =========================================================
      // SHEET 5: INFAQ RAMADHAN → dana_acara
      // =========================================================
      if (selectedSheets.has('INFAQ RAMADHAN') && wb.SheetNames.includes('INFAQ RAMADHAN')) {
        addLog('info', '═══════════════════════════════════');
        addLog('info', 'Memproses sheet INFAQ RAMADHAN...');
        const infaqRows = readSheetFromRow(XLSX, wb, 'INFAQ RAMADHAN', 2);
        addLog('info', `Ditemukan ${infaqRows.length} baris infaq.`);

        const infaqMasuk: any[] = [];
        const infaqKeluar: any[] = [];
        let masukCount = 0;
        let keluarCount = 0;

        for (const row of infaqRows) {
          const tanggal = safeDate(row['Tanggal'], '2026-02-19');
          const uraian = String(row['Uraian'] || 'Infaq Warga').trim();
          const masuk = Number(row['Masuk (Rp)'] || 0);
          const keluar = Number(row['Keluar (Rp)'] || 0);

          if (masuk > 0) {
            infaqMasuk.push({
              nama_acara: 'Infaq Ramadhan 1447 H',
              tanggal,
              kategori: 'Pemasukan',
              nominal: masuk,
              keterangan: uraian,
              status_bayar: 'Lunas',
              bukti_transfer: 'Import Master Excel - Infaq Ramadhan',
              diinput_oleh: 1,
            });
            masukCount++;
          }

          if (keluar > 0) {
            infaqKeluar.push({
              nama_acara: 'Infaq Ramadhan 1447 H',
              tanggal,
              kategori: 'Pengeluaran',
              nominal: keluar,
              keterangan: uraian,
              status_bayar: 'Lunas',
              bukti_transfer: 'Import Master Excel - Infaq Ramadhan',
              diinput_oleh: 1,
            });
            keluarCount++;
          }
        }

        if (infaqMasuk.length > 0) {
          const BATCH = 50;
          for (let i = 0; i < infaqMasuk.length; i += BATCH) {
            const { error } = await supabase.from('dana_acara').insert(infaqMasuk.slice(i, i + BATCH));
            if (error) throw new Error(`Gagal insert infaq masuk batch ${i}: ${error.message}`);
          }
          importResult.infaqMasuk = masukCount;
          addLog('success', `${masukCount} transaksi infaq masuk disimpan.`);
        }

        if (infaqKeluar.length > 0) {
          const BATCH = 50;
          for (let i = 0; i < infaqKeluar.length; i += BATCH) {
            const { error } = await supabase.from('dana_acara').insert(infaqKeluar.slice(i, i + BATCH));
            if (error) throw new Error(`Gagal insert infaq keluar batch ${i}: ${error.message}`);
          }
          importResult.infaqKeluar = keluarCount;
          addLog('success', `${keluarCount} transaksi infaq keluar disimpan.`);
        }
        setProgress(90);
      }

      // =========================================================
      // SELESAI
      // =========================================================
      setProgress(100);
      setResult(importResult);
      setStep('done');
      addLog('info', '═══════════════════════════════════');
      addLog('success', 'IMPORT MASTER SELESAI! Semua data telah tersimpan.');
      addLog('info', 'Silakan buka halaman Dashboard, Kependudukan, Keuangan, dan Dana Acara untuk melihat data.');

      if (onImportComplete) onImportComplete();

    } catch (err: any) {
      addLog('error', `IMPORT GAGAL: ${err.message}`);
      setStep('error');
    }
  };

  // ============================================================
  // TOGGLE SHEET SELECTION
  // ============================================================
  const toggleSheet = (name: string) => {
    setSelectedSheets(prev => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });
  };

  // ============================================================
  // RENDER
  // ============================================================
  if (!show) return null;

  const sheetIcons: Record<string, any> = {
    'DATABASE': Database,
    'PENGELUARAN': Wallet,
    'DAILY REPORT': BookOpen,
    'KAS ACARA': Calendar,
    'INFAQ RAMADHAN': Users,
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-[60]">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-primary-600 to-primary-700 px-6 py-4 shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                <Zap className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="font-bold text-white text-base">Master Import Excel</h3>
                <p className="text-primary-200 text-xs">Upload sekali, data terisi ke semua halaman</p>
              </div>
            </div>
            <button onClick={handleClose} className="text-white/70 hover:text-white transition-colors p-1">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {/* Step 1: Upload */}
          <div>
            <h4 className="text-sm font-bold text-slate-700 mb-2 flex items-center space-x-2">
              <span className="w-6 h-6 bg-primary-100 text-primary-700 rounded-full flex items-center justify-center text-xs font-bold">1</span>
              <span>Pilih File Excel</span>
            </h4>
            <label className={
              `flex flex-col items-center justify-center border-2 border-dashed rounded-xl p-8 cursor-pointer transition-all ${
                step === 'uploading' ? 'border-primary-400 bg-primary-50' : 'border-slate-300 hover:border-primary-400 hover:bg-slate-50'
              }`
            }>
              {step === 'uploading' ? (
                <Loader2 className="w-8 h-8 text-primary-500 animate-spin mb-2" />
              ) : (
                <Upload className="w-8 h-8 text-slate-400 mb-2" />
              )}
              <span className="text-sm font-medium text-slate-600">
                {availableSheets.length > 0
                  ? `File siap: ${availableSheets.length} sheet terdeteksi`
                  : 'Klik untuk pilih file Excel'}
              </span>
              <span className="text-xs text-slate-400 mt-1">
                {availableSheets.length > 0
                  ? 'Klik untuk ganti file'
                  : 'Format: IURAN KAS PAGUYUBAN CLUSTER BERYL (.xlsx)'}
              </span>
              <input
                type="file"
                accept=".xlsx,.xls"
                onChange={handleFileSelect}
                className="hidden"
                disabled={step === 'processing'}
              />
            </label>
          </div>

          {/* Step 2: Pilih Sheet */}
          {availableSheets.length > 0 && (
            <div>
              <h4 className="text-sm font-bold text-slate-700 mb-2 flex items-center space-x-2">
                <span className="w-6 h-6 bg-primary-100 text-primary-700 rounded-full flex items-center justify-center text-xs font-bold">2</span>
                <span>Pilih Sheet yang Akan Diimpor</span>
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {availableSheets.map(name => {
                  const Icon = sheetIcons[name] || FileSpreadsheet;
                  const isSelected = selectedSheets.has(name);
                  const isRecommended = ['DATABASE', 'PENGELUARAN', 'KAS ACARA'].includes(name);
                  return (
                    <button
                      key={name}
                      onClick={() => toggleSheet(name)}
                      disabled={step === 'processing'}
                      className={
                        `flex items-center space-x-3 p-3 rounded-lg border-2 transition-all text-left ${
                          isSelected
                            ? 'border-primary-500 bg-primary-50 shadow-sm'
                            : 'border-slate-200 hover:border-slate-300 bg-white'
                        } ${step === 'processing' ? 'opacity-50 pointer-events-none' : ''}`
                      }
                    >
                      <Icon className={`w-5 h-5 shrink-0 ${isSelected ? 'text-primary-600' : 'text-slate-400'}`} />
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm font-semibold truncate ${isSelected ? 'text-primary-700' : 'text-slate-600'}`}>{name}</p>
                        <p className="text-[10px] text-slate-400">
                          {name === 'DATABASE' && 'Rumah + Warga + Iuran Kas Bulanan'}
                          {name === 'PENGELUARAN' && 'Pengeluaran Kas & Acara'}
                          {name === 'DAILY REPORT' && 'Transaksi Harian Kas & Dana Sosial'}
                          {name === 'KAS ACARA' && 'Donasi Sukarela Kas Acara'}
                          {name === 'INFAQ RAMADHAN' && 'Infaq Ramadhan 1447 H'}
                          {!['DATABASE','PENGELUARAN','DAILY REPORT','KAS ACARA','INFAQ RAMADHAN'].includes(name) && 'Sheet lainnya'}
                        </p>
                      </div>
                      <div className={
                        `w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 ${
                          isSelected ? 'border-primary-500 bg-primary-500' : 'border-slate-300'
                        }`
                      }>
                        {isSelected && <CheckCircle2 className="w-4 h-4 text-white" />}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Step 3: Opsi Reset */}
          {availableSheets.length > 0 && (
            <div>
              <h4 className="text-sm font-bold text-slate-700 mb-2 flex items-center space-x-2">
                <span className="w-6 h-6 bg-amber-100 text-amber-700 rounded-full flex items-center justify-center text-xs font-bold">3</span>
                <span>Opsi Import</span>
              </h4>
              <label className="flex items-start space-x-3 p-3 bg-amber-50 border border-amber-200 rounded-lg cursor-pointer">
                <input
                  type="checkbox"
                  checked={resetBeforeImport}
                  onChange={(e) => setResetBeforeImport(e.target.checked)}
                  disabled={step === 'processing'}
                  className="mt-0.5 w-4 h-4 text-amber-600 border-amber-300 rounded focus:ring-amber-500"
                />
                <div>
                  <p className="text-sm font-semibold text-amber-800">Hapus semua data lama sebelum import</p>
                  <p className="text-xs text-amber-600 mt-0.5">
                    Data warga, rumah, kas, dan dana acara yang ada akan dihapus bersih sebelum data baru diimpor.
                  </p>
                </div>
              </label>
            </div>
          )}

          {/* Progress Bar */}
          {step === 'processing' && (
            <div>
              <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
                <span>Memproses import...</span>
                <span>{progress}%</span>
              </div>
              <div className="w-full h-2.5 bg-slate-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-primary-500 to-emerald-500 rounded-full transition-all duration-500"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}

          {/* Log Console */}
          {logs.length > 0 && (
            <div>
              <h4 className="text-sm font-bold text-slate-700 mb-2">Log Proses</h4>
              <div className="bg-slate-900 rounded-lg p-4 max-h-48 overflow-y-auto font-mono text-xs space-y-0.5">
                {logs.map((log, i) => (
                  <div key={i} className={
                    log.type === 'error' ? 'text-red-400' :
                    log.type === 'warn' ? 'text-amber-400' :
                    log.type === 'success' ? 'text-emerald-400' :
                    'text-slate-400'
                  }>
                    <span className="text-slate-600 mr-2">[{String(i + 1).padStart(2, '0')}]</span>
                    {log.msg}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Result Summary */}
          {step === 'done' && result && (
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-5">
              <h4 className="text-sm font-bold text-emerald-800 mb-3 flex items-center space-x-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Import Berhasil! Ringkasan Data:</span>
              </h4>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="bg-white rounded-lg p-3 text-center border border-emerald-100">
                  <Database className="w-5 h-5 text-blue-500 mx-auto mb-1" />
                  <p className="text-lg font-bold text-slate-800">{result.rumah}</p>
                  <p className="text-[10px] text-slate-500">Rumah</p>
                </div>
                <div className="bg-white rounded-lg p-3 text-center border border-emerald-100">
                  <Users className="w-5 h-5 text-indigo-500 mx-auto mb-1" />
                  <p className="text-lg font-bold text-slate-800">{result.warga}</p>
                  <p className="text-[10px] text-slate-500">Warga</p>
                </div>
                <div className="bg-white rounded-lg p-3 text-center border border-emerald-100">
                  <Wallet className="w-5 h-5 text-emerald-500 mx-auto mb-1" />
                  <p className="text-lg font-bold text-slate-800">{result.kasPemasukan + result.kasPengeluaran}</p>
                  <p className="text-[10px] text-slate-500">Transaksi Kas</p>
                  <p className="text-[9px] text-slate-400">{result.kasPemasukan} masuk, {result.kasPengeluaran} keluar</p>
                </div>
                <div className="bg-white rounded-lg p-3 text-center border border-emerald-100">
                  <Calendar className="w-5 h-5 text-purple-500 mx-auto mb-1" />
                  <p className="text-lg font-bold text-slate-800">{result.danaAcaraMasuk + result.danaAcaraKeluar + result.infaqMasuk + result.infaqKeluar}</p>
                  <p className="text-[10px] text-slate-500">Dana Acara & Infaq</p>
                </div>
              </div>
              <div className="mt-3 p-2 bg-emerald-100 rounded-lg">
                <p className="text-xs text-emerald-700 text-center font-medium">
                  Semua data telah otomatis tampil di halaman Dashboard, Kependudukan, Keuangan, dan Dana Acara.
                </p>
              </div>
            </div>
          )}

          {/* Error State */}
          {step === 'error' && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start space-x-3">
              <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-bold text-red-800">Import Gagal</p>
                <p className="text-xs text-red-600 mt-1">
                  Periksa log proses di bawah untuk detail error. Pastikan format Excel sesuai dengan template.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-slate-200 px-6 py-4 shrink-0 flex justify-between items-center bg-slate-50">
          <button
            onClick={handleClose}
            className="px-4 py-2 border border-slate-300 rounded-lg text-sm font-medium text-slate-600 hover:bg-white transition-colors"
          >
            {step === 'done' ? 'Tutup' : 'Batal'}
          </button>
          <div className="flex space-x-2">
            {step === 'error' && (
              <button
                onClick={() => { setStep('idle'); setLogs(logs.filter(l => l.type === 'info' || l.type === 'success')); }}
                className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-sm font-medium transition-colors"
              >
                Coba Lagi
              </button>
            )}
            {step === 'done' && (
              <button
                onClick={handleClose}
                className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg text-sm font-medium transition-colors flex items-center space-x-2"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Selesai</span>
              </button>
            )}
            {availableSheets.length > 0 && (step === 'idle') && (
              <button
                onClick={startImport}
                disabled={selectedSheets.size === 0}
                className={
                  `px-5 py-2 rounded-lg text-sm font-bold transition-all flex items-center space-x-2 ${
                    selectedSheets.size === 0
                      ? 'bg-slate-300 text-slate-500 cursor-not-allowed'
                      : 'bg-gradient-to-r from-primary-600 to-emerald-600 hover:from-primary-700 hover:to-emerald-700 text-white shadow-md hover:shadow-lg'
                  }`
                }
              >
                <Zap className="w-4 h-4" />
                <span>Mulai Import ({selectedSheets.size} sheet)</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
