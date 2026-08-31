// src/utils/exportManager.ts
import { getXLSX } from '../lib/excel';
import { Warga, KasWargaBeryl, DanaAcara, InfaqMajelis, Pengeluaran, PinjamanWarga, NAMA_BULAN } from '../types';

export const exportWargaToExcel = async (wargaList: Warga[]) => {
  const XLSX = await getXLSX();
  const wb = XLSX.utils.book_new();

  // 1. Sheet Utama Data Warga
  const dataWarga = wargaList.map((w, idx) => {
    const listKendaraan = (w.kendaraan || []).map(k => `${k.jenis}: ${k.nomor_polisi} (${k.merk_model || '-'})`).join('; ');
    const listAnggota = (w.anggota_keluarga || []).map(a => `${a.nama} (${a.hubungan}, Gol: ${a.golongan_darah || '-'})`).join('; ');

    return {
      'No.': idx + 1,
      'Unit / Blok': w.id_rumah || '-',
      'Nama Kepala Keluarga': w.nama_lengkap,
      'No. WhatsApp (+62)': w.no_hp || '-',
      'Status Hunian': w.status_warga || 'Menetap',
      'Golongan Darah': w.golongan_darah || 'Tidak Tahu',
      'Tanggal Lahir': w.tanggal_lahir || '-',
      'Agama': w.agama || 'Islam',
      'Pekerjaan': w.pekerjaan || '-',
      'Jumlah Anggota Keluarga': (w.anggota_keluarga || []).length,
      'Rincian Anggota Keluarga': listAnggota || '-',
      'Jumlah Kendaraan': (w.kendaraan || []).length,
      'Daftar Kendaraan & Plat': listKendaraan || '-',
      'Kontak Darurat': w.kontak_darurat || '-',
      'Alamat Asal': w.alamat_asal || '-',
      'Keterangan': w.keterangan || '-'
    };
  });

  const wsWarga = XLSX.utils.json_to_sheet(dataWarga);
  XLSX.utils.book_append_sheet(wb, wsWarga, 'DATA WARGA LENGKAP');

  // 2. Sheet Khusus Database Kendaraan
  const dataKendaraan: any[] = [];
  let kCounter = 1;
  wargaList.forEach(w => {
    (w.kendaraan || []).forEach(k => {
      dataKendaraan.push({
        'No.': kCounter++,
        'Unit / Blok': w.id_rumah || '-',
        'Pemilik / KK': w.nama_lengkap,
        'No. WhatsApp': w.no_hp || '-',
        'Jenis Kendaraan': k.jenis,
        'Nomor Polisi (Plat)': k.nomor_polisi,
        'Merk / Model': k.merk_model || '-',
        'Warna': k.warna || '-'
      });
    });
  });

  if (dataKendaraan.length > 0) {
    const wsKendaraan = XLSX.utils.json_to_sheet(dataKendaraan);
    XLSX.utils.book_append_sheet(wb, wsKendaraan, 'DATABASE KENDARAAN');
  }

  // 3. Sheet Khusus Database Anggota Keluarga
  const dataKeluarga: any[] = [];
  let aCounter = 1;
  wargaList.forEach(w => {
    (w.anggota_keluarga || []).forEach(a => {
      dataKeluarga.push({
        'No.': aCounter++,
        'Unit / Blok': w.id_rumah || '-',
        'Kepala Keluarga': w.nama_lengkap,
        'Nama Anggota': a.nama,
        'Hubungan': a.hubungan,
        'L/P': a.jenis_kelamin,
        'Tanggal Lahir': a.tanggal_lahir || '-',
        'Golongan Darah': a.golongan_darah || '-',
        'Pekerjaan': a.pekerjaan || '-'
      });
    });
  });

  if (dataKeluarga.length > 0) {
    const wsKeluarga = XLSX.utils.json_to_sheet(dataKeluarga);
    XLSX.utils.book_append_sheet(wb, wsKeluarga, 'ANGGOTA KELUARGA');
  }

  XLSX.writeFile(wb, `Data_Warga_Beryl_Lengkap_${new Date().toISOString().slice(0, 10)}.xlsx`);
};

export const exportMatriksKasToExcel = async (wargaList: Warga[], kasList: KasWargaBeryl[], year: number = 2026) => {
  const XLSX = await getXLSX();
  const wb = XLSX.utils.book_new();

  const data = wargaList.map((w, idx) => {
    const row: any = {
      'No.': idx + 1,
      'Unit / Blok': w.id_rumah || '-',
      'Nama Lengkap': w.nama_lengkap
    };

    let totalSetahun = 0;
    for (let m = 1; m <= 12; m++) {
      const monthCode = String(m).padStart(2, '0');
      const prefix = `${year}-${monthCode}`;
      const isPaid = kasList.some(k => k.id_warga === w.id_warga && k.periode_bulan?.startsWith(prefix) && k.status_bayar === 'Lunas');
      row[NAMA_BULAN[m - 1]] = isPaid ? 10000 : 0;
      if (isPaid) totalSetahun += 10000;
    }
    row['Total Terbayar (Rp)'] = totalSetahun;
    return row;
  });

  const ws = XLSX.utils.json_to_sheet(data);
  XLSX.utils.book_append_sheet(wb, ws, `KAS WARGA ${year}`);
  XLSX.writeFile(wb, `Rekap_Iuran_Kas_Warga_Beryl_${year}.xlsx`);
};

export const exportDanaAcaraToExcel = async (acaraList: DanaAcara[]) => {
  const XLSX = await getXLSX();
  const wb = XLSX.utils.book_new();

  const data = acaraList.map((a, idx) => ({
    'No.': idx + 1,
    'Tanggal': a.tanggal,
    'Nama Acara': a.nama_acara,
    'Kategori': a.kategori,
    'Donatur / Keperluan': a.nama_warga || a.nama_donatur_luar || a.keterangan,
    'Sub-Anggaran': a.pos_sub_anggaran || '-',
    'Nominal (Rp)': a.nominal,
    'Link Bukti Nota': a.bukti_nota || '-'
  }));

  const ws = XLSX.utils.json_to_sheet(data);
  XLSX.utils.book_append_sheet(wb, ws, 'DANA ACARA');
  XLSX.writeFile(wb, `Laporan_Dana_Acara_Beryl_${new Date().toISOString().slice(0, 10)}.xlsx`);
};

export const exportInfaqMajelisToExcel = async (majelisList: InfaqMajelis[]) => {
  const XLSX = await getXLSX();
  const wb = XLSX.utils.book_new();

  const data = majelisList.map((m, idx) => ({
    'No.': idx + 1,
    'Tanggal': m.tanggal,
    'Nama Acara / Pengajian': m.nama_acara,
    'Donatur / Jamaah': m.nama_donatur_luar || m.nama_warga || 'Hamba Allah',
    'Nominal (Rp)': m.nominal,
    'Keterangan': m.keterangan || '-',
    'Link Bukti': m.bukti_nota || '-'
  }));

  const ws = XLSX.utils.json_to_sheet(data);
  XLSX.utils.book_append_sheet(wb, ws, 'INFAQ MAJELIS');
  XLSX.writeFile(wb, `Laporan_Infaq_Majelis_AlBarokah_${new Date().toISOString().slice(0, 10)}.xlsx`);
};

export const exportPengeluaranToExcel = async (pengeluaranList: Pengeluaran[]) => {
  const XLSX = await getXLSX();
  const wb = XLSX.utils.book_new();

  const data = pengeluaranList.map((p, idx) => ({
    'No.': idx + 1,
    'Tanggal': p.tanggal,
    'Pos Anggaran': p.pos_anggaran.replace(/_/g, ' '),
    'Keperluan / Rincian': p.keperluan,
    'Nominal (Rp)': p.nominal,
    'Link Bukti Nota': p.bukti_nota || '-'
  }));

  const ws = XLSX.utils.json_to_sheet(data);
  XLSX.utils.book_append_sheet(wb, ws, 'PENGELUARAN');
  XLSX.writeFile(wb, `Laporan_Pengeluaran_Beryl_${new Date().toISOString().slice(0, 10)}.xlsx`);
};

export const exportPinjamanToExcel = async (pinjamanList: PinjamanWarga[]) => {
  const XLSX = await getXLSX();
  const wb = XLSX.utils.book_new();

  const data = pinjamanList.map((p, idx) => ({
    'No.': idx + 1,
    'Tanggal Pinjam': p.tanggal_pinjam,
    'Nama Warga': p.nama_warga,
    'Unit / Blok': p.id_rumah || '-',
    'Nominal Pinjaman (Rp)': p.nominal_pinjaman,
    'Sisa Tagihan (Rp)': p.sisa_pinjaman,
    'Status': p.status_pinjaman,
    'Keperluan': p.keterangan || '-'
  }));

  const ws = XLSX.utils.json_to_sheet(data);
  XLSX.utils.book_append_sheet(wb, ws, 'PINJAMAN QARDH');
  XLSX.writeFile(wb, `Laporan_Pinjaman_Qardh_${new Date().toISOString().slice(0, 10)}.xlsx`);
};

export const exportMasterBackupExcel = async (
  wargaList: Warga[],
  kasList: KasWargaBeryl[],
  acaraList: DanaAcara[],
  majelisList: InfaqMajelis[],
  pengeluaranList: Pengeluaran[],
  pinjamanList: PinjamanWarga[]
) => {
  const XLSX = await getXLSX();
  const wb = XLSX.utils.book_new();

  // 1. DATABASE
  const dbRows = wargaList.map((w) => {
    const row: any = {
      'Blok / Nomor': w.id_rumah?.replace('Beryl-', '') || '',
      'Nama Lengkap': w.nama_lengkap,
      'Nomor Whatsapp': w.no_hp || '',
      'Keterangan': w.status_warga || 'Menetap'
    };
    for (let m = 1; m <= 12; m++) {
      const monthCode = String(m).padStart(2, '0');
      const isPaid = kasList.some(k => k.id_warga === w.id_warga && k.periode_bulan?.startsWith(`2026-${monthCode}`) && k.status_bayar === 'Lunas');
      row[NAMA_BULAN[m - 1]] = isPaid ? 10000 : '';
    }
    return row;
  });
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(dbRows), 'DATABASE');

  // 2. KAS ACARA
  const acaraRows = acaraList.map(a => ({
    'Nama Lengkap': a.nama_warga || a.nama_donatur_luar || '-',
    'Blok / Nomor Rumah': a.id_rumah?.replace('Beryl-', '') || '-',
    'Iuran Kas Acara (Sukarela)': a.nominal,
    'Tanggal': a.tanggal,
    'Kategori': a.kategori,
    'Keterangan': a.keterangan || '-'
  }));
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(acaraRows), 'KAS ACARA');

  // 3. INFAQ MAJELIS
  const majelisRows = majelisList.map(m => ({
    'Tanggal': m.tanggal,
    'Nama Acara': m.nama_acara,
    'Nama Donatur': m.nama_donatur_luar || m.nama_warga || '-',
    'Nominal': m.nominal,
    'Keterangan': m.keterangan || '-',
    'Bukti': m.bukti_nota || '-'
  }));
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(majelisRows), 'INFAQ MAJELIS');

  // 4. PENGELUARAN
  const pengRows = pengeluaranList.map(p => ({
    'Tanggal': p.tanggal,
    'Pos Anggaran': p.pos_anggaran,
    'Keperluan': p.keperluan,
    'Nominal': p.nominal,
    'Bukti': p.bukti_nota || '-'
  }));
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(pengRows), 'PENGELUARAN');

  // 5. PINJAMAN WARGA
  const pinjamRows = pinjamanList.map(p => ({
    'Tanggal': p.tanggal_pinjam,
    'Nama Warga': p.nama_warga || '-',
    'Blok / Unit': p.id_rumah?.replace('Beryl-', '') || '-',
    'Nominal Pinjaman': p.nominal_pinjaman,
    'Sisa Pinjaman': p.sisa_pinjaman,
    'Status': p.status_pinjaman,
    'Keperluan': p.keterangan || '-'
  }));
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(pinjamRows), 'PINJAMAN WARGA');

  XLSX.writeFile(wb, `BACKUP_DATABASE_WARGA_BERYL_${new Date().toISOString().slice(0, 10)}.xlsx`);
};