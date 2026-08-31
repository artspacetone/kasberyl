// src/utils/templateGenerator.ts
import { getXLSX } from '../lib/excel';

export const downloadMasterTemplateExcel = async () => {
  const XLSX = await getXLSX();
  const wb = XLSX.utils.book_new();

  // =========================================================================
  // SHEET 1: DATABASE (Data Warga + Matriks Iuran 12 Bulan @ Rp 10.000)
  // =========================================================================
  const wsDatabaseData = [
    [
      'Blok / Nomor', 'Nama Lengkap', 'Nomor Whatsapp', 'Keterangan',
      'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
      'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
    ],
    ['A1/01', 'H. Moch. Wahyu', '081234567890', 'Menetap', 10000, 10000, 10000, 10000, '', '', '', '', '', '', '', ''],
    ['A1/02', 'Pak Adam', '081234567891', 'Menetap', 10000, 10000, '', '', '', '', '', '', '', '', '', ''],
    ['A1/03', 'M. Su Chandra', '081234567892', 'Menetap', 10000, 10000, '', '', '', '', '', '', '', '', '', ''],
    ['A1/04', 'Marten Tenis', '081234567893', 'Menetap', 10000, '', '', '', '', '', '', '', '', '', '', ''],
    ['A1/10', 'Jeffry W. Marbun', '081234567894', 'Menetap', 10000, '', '', '', '', '', '', '', '', '', '', ''],
    ['A1/23', 'Slamet', '081234567895', 'Menetap', 10000, 10000, '', '', '', '', '', '', '', '', '', ''],
    ['A2/03', 'Ahmad Junaidi', '081234567896', 'Menetap', 10000, '', '', '', '', '', '', '', '', '', '', ''],
    ['A2/09', 'Puryani', '081234567897', 'Menetap', 10000, 10000, '', '', '', '', '', '', '', '', '', ''],
    ['A4/01', 'Iin', '081234567898', 'Penyewa', 10000, '', '', '', '', '', '', '', '', '', '', '', ''],
    ['A4/05', 'Fredi', '081234567899', 'Menetap', 10000, 10000, '', '', '', '', '', '', '', '', '', '']
  ];
  const wsDatabase = XLSX.utils.aoa_to_sheet(wsDatabaseData);
  XLSX.utils.book_append_sheet(wb, wsDatabase, 'DATABASE');

  // =========================================================================
  // SHEET 2: KAS ACARA (Donasi Sukarela & Sponsor Acara Paguyuban)
  // Format sesuai gambar: Nama Lengkap | Blok / Nomor Rumah | Iuran Kas Acara (Sukarela)
  // =========================================================================
  const wsKasAcaraData = [
    ['Nama Lengkap', 'Blok / Nomor Rumah', 'Iuran Kas Acara (Sukarela)'],
    ['PMM', 'A-Z', 2500000],
    ['M. Su Chandra', 'A1 / 03', 50000],
    ['Marten Tenis', 'A1 / 04', 50000],
    ['Jeffry W. Marbun', 'A1 / 10', 30000],
    ['Slamet', 'A1 / 23', 50000],
    ['Ahmad Junaidi', 'A2 / 03', 50000],
    ['Puryani', 'A2 / 09', 50000],
    ['Iin', 'A4 / 01', 30000],
    ['Fredi', 'A4 / 05', 50000]
  ];
  const wsKasAcara = XLSX.utils.aoa_to_sheet(wsKasAcaraData);
  XLSX.utils.book_append_sheet(wb, wsKasAcara, 'KAS ACARA');

  // =========================================================================
  // SHEET 3: INFAQ MAJELIS (Pengajian & PHBI Al Barokah)
  // =========================================================================
  const wsMajelisData = [
    ['Tanggal', 'Nama Acara', 'Nama Donatur', 'Nominal', 'Keterangan', 'Bukti'],
    ['2026-01-20', 'Pengajian Bulanan', 'H. Ahmad Subarjo', 100000, 'Infaq Konsumsi Pengajian', 'https://drive.google.com/...'],
    ['2026-02-15', 'Peringatan Isra Mi\'raj 1447 H', 'Hamba Allah', 500000, 'Infaq Penceramah & Sound', 'https://drive.google.com/...']
  ];
  const wsMajelis = XLSX.utils.aoa_to_sheet(wsMajelisData);
  XLSX.utils.book_append_sheet(wb, wsMajelis, 'INFAQ MAJELIS');

  // =========================================================================
  // SHEET 4: PENGELUARAN (Operasional, Sosial, Acara, Majelis)
  // =========================================================================
  const wsPengeluaranData = [
    ['Tanggal', 'Pos Anggaran', 'Keperluan', 'Nominal', 'Bukti'],
    ['2026-01-14', 'Operasional_Warga', 'Print Buku Kas & Stempel Pengurus', 108000, 'https://drive.google.com/...'],
    ['2026-01-25', 'Acara_Warga', 'Sewa Tenda Acara Silaturahmi', 600000, 'https://drive.google.com/...'],
    ['2026-01-27', 'Acara_Warga', 'Catering Acara Silaturahmi', 2500000, 'https://drive.google.com/...'],
    ['2026-02-17', 'Sosial_Warga', 'Santunan Warga Sakit Rawat Inap Blok C3/21', 200000, 'https://drive.google.com/...'],
    ['2026-02-20', 'Acara_Majelis_Albarokah', 'Konsumsi Snack Box Pengajian Bulanan', 350000, 'https://drive.google.com/...']
  ];
  const wsPengeluaran = XLSX.utils.aoa_to_sheet(wsPengeluaranData);
  XLSX.utils.book_append_sheet(wb, wsPengeluaran, 'PENGELUARAN');

  // =========================================================================
  // SHEET 5: PINJAMAN WARGA (Qardhul Hasan)
  // =========================================================================
  const wsPinjamanData = [
    ['Tanggal', 'Nama Warga', 'Blok / Unit', 'Nominal Pinjaman', 'Keperluan'],
    ['2026-01-25', 'Pak Encep', 'A5/11', 500000, 'Pinjaman Darurat Pengobatan Keluarga']
  ];
  const wsPinjaman = XLSX.utils.aoa_to_sheet(wsPinjamanData);
  XLSX.utils.book_append_sheet(wb, wsPinjaman, 'PINJAMAN WARGA');

  // Unduh File Excel Template Lengkap 5 Sheet
  XLSX.writeFile(wb, 'Template_Master_Warga_Beryl_Majelis_AlBarokah.xlsx');
};