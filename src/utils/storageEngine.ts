// src/utils/storageEngine.ts
import { KasWargaBeryl } from '../types';

// Penyimpanan pintar per tahun buku agar TIDAK PERNAH menabrak limit 5MB browser
export const saveYearKasCache = (year: number, data: KasWargaBeryl[]): void => {
  try {
    const key = `local_kas_${year}`;
    // Simpan hanya data milik tahun tersebut
    const yrStr = String(year);
    const yearFiltered = data.filter(k => 
      (k.periode_bulan && k.periode_bulan.startsWith(yrStr)) ||
      (k.tanggal && k.tanggal.startsWith(yrStr)) ||
      (k.keterangan && k.keterangan.includes(yrStr))
    );
    localStorage.setItem(key, JSON.stringify(yearFiltered));
    
    // Simpan juga versi global kecil untuk modul lain
    localStorage.setItem('local_kas', JSON.stringify(yearFiltered));
  } catch (err: any) {
    console.warn('Peringatan kuota penyimpanan:', err.message);
  }
};

export const getYearKasCache = (year: number): KasWargaBeryl[] => {
  try {
    const key = `local_kas_${year}`;
    const raw = localStorage.getItem(key);
    if (raw) return JSON.parse(raw);

    // Fallback ke cache global jika partisi belum ada
    const fallback = localStorage.getItem('local_kas');
    if (fallback) {
      const parsed: KasWargaBeryl[] = JSON.parse(fallback);
      const yrStr = String(year);
      return parsed.filter(k => 
        (k.periode_bulan && k.periode_bulan.startsWith(yrStr)) ||
        (k.tanggal && k.tanggal.startsWith(yrStr)) ||
        (k.keterangan && k.keterangan.includes(yrStr))
      );
    }
  } catch (e) {}
  return [];
};