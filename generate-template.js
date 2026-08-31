// generate-template.js
import XLSX from 'xlsx';

// Helper untuk membuat worksheet dengan header di baris tertentu
function createSheetWithHeader(workbook, sheetName, headerRow, dataRows) {
  const ws = {};
  const range = { s: { r: 0, c: 0 }, e: { r: headerRow + dataRows.length, c: dataRows[0]?.length || 0 } };
  ws['!ref'] = XLSX.utils.encode_range(range);

  // Tulis header
  dataRows[0].forEach((val, colIndex) => {
    const cellAddr = XLSX.utils.encode_cell({ r: headerRow - 1, c: colIndex });
    ws[cellAddr] = { t: 's', v: val };
  });

  // Tulis data
  dataRows.slice(1).forEach((row, rowIndex) => {
    row.forEach((val, colIndex) => {
      const cellAddr = XLSX.utils.encode_cell({ r: headerRow + rowIndex, c: colIndex });
      ws[cellAddr] = { t: typeof val === 'number' ? 'n' : 's', v: val };
    });
  });

  XLSX.utils.book_append_sheet(workbook, ws, sheetName);
}

// Buat workbook baru
const wb = XLSX.utils.book_new();

// ========== Sheet DATABASE ==========
const dbHeaders = ['Blok / Nomor', 'Nama', 'Nomor Whatsapp', 'Keterangan'];
const months = ['Januari','Februari','Maret','April','Mei','Juni','Juli','Agustus','September','Oktober','November','Desember'];
for (let i = 0; i < 12; i++) dbHeaders.push(months[i] + ' 2026');
for (let i = 0; i < 12; i++) dbHeaders.push(months[i] + ' 2027');

const dbData = [
  dbHeaders,
  ['A1/01', 'H. Moch. Wahyu Heriyanto', '081234567890', 'Menetap', 10000, 10000, 10000, 10000, 10000, 10000, 10000, 10000, 10000, 10000, 10000, 10000, 10000, 10000, 10000, 10000, 10000, 10000, 10000, 10000, 10000, 10000, 10000, 10000],
  ['A1/02', 'Pak Adam', '081234567891', 'Menetap', 10000, 10000, 10000, 10000, 10000, 10000, 10000, 10000, 10000, 10000, 10000, 10000, 10000, 10000, 10000, 10000, 10000, 10000, 10000, 10000, 10000, 10000, 10000, 10000],
  ['A1/03', 'Ibu Siti Hajar', '081234567892', 'Menetap', 10000, 10000, 10000, 10000, 10000, 10000, 10000, 10000, 10000, 10000, 10000, 10000, 10000, 10000, 10000, 10000, 10000, 10000, 10000, 10000, 10000, 10000, 10000],
];

const dbFullData = [
  [], [], [], [],
  ...dbData,
];
createSheetWithHeader(wb, 'DATABASE', 5, dbFullData);

// ========== Sheet PENGELUARAN ==========
const pengHeaders = ['Tanggal', 'Keperluan', 'Jumlah (Rp)', 'Kategori', 'Bukti'];
const pengData = [
  pengHeaders,
  ['2026-01-15', 'Beli bambu tenda', 150000, 'Operasional', ''],
  ['2026-02-01', 'Santunan warga sakit', 200000, 'Sosial', 'https://drive.google.com/...'],
  ['2026-03-10', 'Konsumsi pengajian', 50000, 'Acara', ''],
];
const pengFullData = [
  [], [],
  ...pengData,
];
createSheetWithHeader(wb, 'PENGELUARAN', 3, pengFullData);

// ========== Sheet DAILY REPORT ==========
const dailyHeaders = ['Blok / No', 'Kas Operasional', 'Dana Sosial', 'Bulan', 'Tanggal'];
const dailyData = [
  dailyHeaders,
  ['A1/01', 10000, 5000, 'Januari', 5],
  ['A1/02', 10000, 0, 'Januari', 6],
];
const dailyFullData = [
  [], [],
  ...dailyData,
];
createSheetWithHeader(wb, 'DAILY REPORT', 3, dailyFullData);

// ========== Sheet KAS ACARA ==========
const acaraHeaders = ['Nama Lengkap', 'Blok / Nomor Rumah', 'Iuran Kas Acara (Sukarela)'];
const acaraData = [
  acaraHeaders,
  ['Bapak Ahmad', 'A1/01', 50000],
  ['Ibu Siti', 'A1/02', 75000],
];
const acaraFullData = [
  [],
  ...acaraData,
];
createSheetWithHeader(wb, 'KAS ACARA', 2, acaraFullData);

// ========== Sheet INFAQ RAMADHAN ==========
const infaqHeaders = ['Tanggal', 'Uraian', 'Masuk (Rp)', 'Keluar (Rp)'];
const infaqData = [
  infaqHeaders,
  ['2026-02-19', 'Infaq Bapak Ahmad', 100000, 0],
  ['2026-02-20', 'Santunan anak yatim', 0, 50000],
];
const infaqFullData = [
  [], [],
  ...infaqData,
];
createSheetWithHeader(wb, 'INFAQ RAMADHAN', 3, infaqFullData);

// Simpan file
XLSX.writeFile(wb, 'master-template.xlsx');
console.log('✅ Template berhasil dibuat: master-template.xlsx');