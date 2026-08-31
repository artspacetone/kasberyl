import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const formatRupiah = (amount: number): string => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(amount || 0);
};

export const NAMA_BULAN = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
];

// Normalisasi Nomor HP ke format standar Indonesia +628...
export const formatPhoneNumber62 = (hp: any): string => {
  if (!hp || String(hp).trim() === '' || String(hp).trim() === '-') return '-';
  let clean = String(hp).trim().replace(/[^\d+]/g, '');
  if (clean.startsWith('+62')) return clean;
  if (clean.startsWith('62')) return '+' + clean;
  if (clean.startsWith('0')) return '+62' + clean.slice(1);
  if (clean.startsWith('8')) return '+62' + clean;
  return clean;
};

// Generator URL WhatsApp
export const getWhatsAppLink = (hp: any): string | null => {
  const formatted = formatPhoneNumber62(hp);
  if (formatted === '-' || !formatted) return null;
  const digitsOnly = formatted.replace(/\D/g, '');
  return `https://wa.me/${digitsOnly}`;
};