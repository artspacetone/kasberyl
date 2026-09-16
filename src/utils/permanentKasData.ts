// src/utils/permanentKasData.ts
import { KasWargaBeryl } from '../types';
import { supabase, isSupabaseConfigured } from '../supabase';

let debounceTimer: any = null;
export const emitSafeDataUpdated = () => {
  if (debounceTimer) clearTimeout(debounceTimer);
  debounceTimer = setTimeout(() => {
    window.dispatchEvent(new Event('app_data_updated'));
  }, 120);
};

// Parser Cerdas Format new 3.txt
export const parseRawKasTextToRecords = (rawText: string): KasWargaBeryl[] => {
  const lines = rawText.split('\n');
  const records: KasWargaBeryl[] = [];
  
  let currentId = 0;
  let currentTanggal = '';
  let currentPeriode = '';
  let currentNama = '';
  let currentUnit = '';
  let currentKet = '';
  const currentNominal = 10000;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    // Header transaksi: e.g. "1 \t 2026-12-05 \t 2026-12"
    const headerMatch = line.match(/^(\d+)\s+(\d{4}-\d{2}-\d{2})\s+(\d{4}-\d{2})/);
    if (headerMatch) {
      currentId = parseInt(headerMatch[1], 10);
      currentTanggal = headerMatch[2];
      currentPeriode = headerMatch[3] + '-01';
      currentNama = '';
      currentUnit = '';
      currentKet = '';
      continue;
    }

    // Baris Unit & Keterangan
    if (line.includes('Unit:')) {
      const unitMatch = line.match(/Unit:\s*([^\t\n]+)/);
      if (unitMatch) {
        currentUnit = unitMatch[1].trim();
      }

      const ketMatch = line.match(/(Iuran Kas[^\t\n]+)/);
      if (ketMatch) {
        currentKet = ketMatch[1].trim();
      }

      if (currentNama && currentUnit) {
        records.push({
          id_transaksi: currentId || (Date.now() + records.length),
          id_warga: currentId || (records.length + 1),
          nama_warga: currentNama,
          id_rumah: currentUnit,
          periode_bulan: currentPeriode || '2026-01-01',
          tanggal: currentTanggal || '2026-01-05',
          nominal: currentNominal,
          peruntukan: 'Operasional dan Sosial',
          status_bayar: 'Lunas',
          keterangan: currentKet || `Iuran Kas Warga Beryl (${currentUnit})`,
          bukti_transfer: '',
          diinput_oleh: 1
        });
        currentNama = '';
      }
      continue;
    }

    // Baris Nama Warga
    if (!line.includes('Unit:') && !headerMatch && line.length > 2 && !line.includes('Iuran Kas')) {
      currentNama = line.replace(/\t/g, '').trim();
    }
  }

  return records;
};

// Fungsi Memaksa Memasukkan 1.028 Transaksi ke Supabase Cloud (Anti-409)
export const forceInjectKasData = async (dataList: KasWargaBeryl[]): Promise<boolean> => {
  // 1. Simpan di Lokal Seketika
  localStorage.setItem('local_kas', JSON.stringify(dataList));
  emitSafeDataUpdated();

  // 2. Kirim ke Supabase Cloud dengan onConflict 'id_rumah,periode_bulan'
  if (isSupabaseConfigured) {
    try {
      const dbPayload = dataList.map(k => ({
        id_rumah: k.id_rumah,
        nama_warga: k.nama_warga,
        periode_bulan: k.periode_bulan,
        tanggal: k.tanggal,
        nominal: k.nominal,
        peruntukan: k.peruntukan || 'Operasional dan Sosial',
        status_bayar: 'Lunas',
        keterangan: k.keterangan,
        bukti_transfer: '',
        diinput_oleh: 1
      }));

      for (let i = 0; i < dbPayload.length; i += 100) {
        const batch = dbPayload.slice(i, i + 100);
        const { error } = await supabase.from('kas_warga').upsert(batch, {
          onConflict: 'id_rumah,periode_bulan',
          ignoreDuplicates: false
        });
        if (error) {
          console.error('Batch error:', error.message);
        }
      }
      return true;
    } catch (e: any) {
      console.error('Sync cloud error:', e.message);
      return false;
    }
  }
  return true;
};