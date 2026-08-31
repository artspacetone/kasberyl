// src/utils/excelParser.ts
import { getXLSX } from '../lib/excel'; // Perbaikan path: dari './excel' menjadi '../lib/excel'

export interface ParsedExcelData {
  masukanKas: {
    idRumah: string;
    nama: string;
    hp: string;
    statusRaw: string;
    payments: { monthIndex: number; value: any }[];
  }[];
  danaAcara: any[];
  keluaran: any[];
}

export const parseExcelFile = async (file: File): Promise<ParsedExcelData> => {
  const XLSX = await getXLSX();
  const data = await file.arrayBuffer();
  const wb = XLSX.read(data, { type: 'array' });

  const result: ParsedExcelData = {
    masukanKas: [],
    danaAcara: [],
    keluaran: [],
  };

  // Sheet 'masukan kas'
  const sheet1 = wb.Sheets['masukan kas'];
  if (sheet1) {
    const raw = XLSX.utils.sheet_to_json(sheet1, { header: 1 });
    const headerIdx = raw.findIndex((row: any[]) => row[0] === 'Blok / Nomor');
    if (headerIdx !== -1) {
      const monthStartIdx = 4; // kolom E = Januari 2026
      const rows = raw.slice(headerIdx + 1).filter((row: any[]) => row[0] && row[0] !== 'Total Kas Masuk :');
      const masukan = rows.map((row) => {
        const idRumahRaw = row[0].toString().trim();
        const idRumah = `Beryl-${idRumahRaw.replace('/', '-')}`;
        const nama = row[1]?.toString().trim() || '';
        const hp = row[2]?.toString().trim() || '-';
        const statusRaw = row[3]?.toString().trim() || '';
        const payments: any[] = [];
        for (let i = 0; i < 24; i++) {
          const val = row[monthStartIdx + i];
          payments.push({
            monthIndex: i,
            value: val || null,
          });
        }
        return { idRumah, nama, hp, statusRaw, payments };
      });
      result.masukanKas = masukan;
    }
  }

  // Sheet 'dana acara'
  const sheet2 = wb.Sheets['dana acara'];
  if (sheet2) {
    const json = XLSX.utils.sheet_to_json(sheet2);
    result.danaAcara = json;
  }

  // Sheet 'keluaran'
  const sheet3 = wb.Sheets['keluaran'];
  if (sheet3) {
    const json = XLSX.utils.sheet_to_json(sheet3);
    result.keluaran = json;
  }

  return result;
};