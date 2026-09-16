// src/types.ts
export type PeranPengguna = 'Super_Admin' | 'Admin_Keuangan' | 'Admin_Kependudukan' | 'Satpam' | 'Warga';

export type StatusWarga = 'Menetap' | 'Penyewa' | 'Kosong' | 'Kunjungan' | 'Pindahan' | string;
export type PosPengeluaran = 'Operasional_Warga' | 'Sosial_Warga' | 'Acara_Warga' | 'Acara_Majelis_Albarokah';
export type StatusPinjaman = 'Berjalan' | 'Lunas' | 'Macet';

export interface AnggotaKeluarga {
  id_anggota?: string | number;
  nama: string;
  hubungan: 'Istri' | 'Anak' | 'Ayah' | 'Ibu' | 'Mertua' | 'Sepupu' | 'Kakak/Adik' | 'Famili Lain' | string;
  jenis_kelamin: 'L' | 'P';
  tanggal_lahir?: string;
  golongan_darah?: 'A' | 'B' | 'AB' | 'O' | 'Tidak Tahu' | string;
  pekerjaan?: string;
  keterangan?: string;
}

export interface KendaraanWarga {
  id_kendaraan?: string | number;
  jenis: 'Mobil' | 'Motor' | 'Sepeda Listrik' | 'Lainnya';
  nomor_polisi: string;
  merk_model?: string;
  warna?: string;
}

export interface Pengguna {
  id_pengguna: number;
  nama_lengkap: string;
  peran: PeranPengguna;
  id_rumah: string;
  password?: string;
}

export interface Rumah {
  id_rumah: string;
  blok_nomor: string;
  status_hunian: string;
  nama_pemilik_asli: string;
  no_hp_pemilik_asli: string;
  tgl_mulai_huni: string;
}

export interface Warga {
  id_warga: number;
  id_rumah: string;
  nik_kk?: string;
  nama_lengkap: string;
  status_warga: StatusWarga;
  no_hp: string;
  jenis_kelamin?: 'L' | 'P';
  peran_keluarga?: string;
  tempat_lahir?: string;
  tanggal_lahir?: string;
  golongan_darah?: 'A' | 'B' | 'AB' | 'O' | 'Tidak Tahu' | string;
  agama?: string;
  pekerjaan?: string;
  alamat_asal?: string;
  kontak_darurat?: string;
  keterangan?: string;
  tanggal_daftar?: string;
  anggota_keluarga?: AnggotaKeluarga[];
  kendaraan?: KendaraanWarga[];
}

export interface KasWargaBeryl {
  id_transaksi: number;
  id_warga: number;
  nama_warga?: string;
  id_rumah?: string;
  periode_bulan: string;
  tanggal: string;
  nominal: number;
  peruntukan?: string;
  status_bayar: 'Lunas' | 'Menunggu Verifikasi' | 'Tunggakan';
  keterangan: string;
  bukti_transfer?: string;
  diinput_oleh?: number;
}

export interface DanaAcara {
  id_transaksi: number;
  nama_acara: string;
  id_warga?: number;
  nama_warga?: string;
  id_rumah?: string;
  nama_donatur_luar?: string;
  tanggal: string;
  kategori: 'Pemasukan' | 'Pengeluaran';
  pos_sub_anggaran?: string;
  nominal: number;
  keterangan: string;
  bukti_nota?: string;
  diinput_oleh?: number;
}

export interface InfaqMajelis {
  id_infaq: number;
  id_warga?: number;
  nama_warga?: string;
  nama_donatur_luar?: string;
  nama_acara: string;
  tanggal: string;
  nominal: number;
  jenis_dana: 'Pemasukan' | 'Pengeluaran';
  keterangan: string;
  bukti_nota?: string;
  diinput_oleh?: number;
}

export interface Pengeluaran {
  id_pengeluaran: number;
  pos_anggaran: PosPengeluaran;
  tanggal: string;
  keperluan: string;
  nominal: number;
  bukti_nota?: string;
  diinput_oleh?: number;
}

export interface PinjamanWarga {
  id_pinjaman: number;
  id_warga: number;
  nama_warga?: string;
  id_rumah?: string;
  tanggal_pinjam: string;
  nominal_pinjaman: number;
  sisa_pinjaman: number;
  status_pinjaman: StatusPinjaman;
  keterangan: string;
}

export interface CicilanPinjaman {
  id_cicilan: number;
  id_pinjaman: number;
  tanggal_bayar: string;
  nominal: number;
  catatan?: string;
}

export interface Pengurus {
  id_pengurus: number;
  jabatan: string;
  nama_pengurus: string;
  periode: string;
  kontak: string;
}

export interface Tamu {
  id_tamu: number;
  nama_tamu: string;
  id_rumah_tujuan: string;
  waktu_masuk: string;
  waktu_keluar: string | null;
  titip_identitas: string;
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

export const canAccessFinance = (user: Pengguna | null): boolean => {
  if (!user) return false;
  return user.peran === 'Super_Admin' || user.peran === 'Admin_Keuangan';
};

export const canManageWargaFull = (user: Pengguna | null): boolean => {
  if (!user) return false;
  return user.peran === 'Super_Admin' || user.peran === 'Admin_Kependudukan';
};