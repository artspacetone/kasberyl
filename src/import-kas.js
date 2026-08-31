import Database from 'better-sqlite3';

const db = new Database('./sipema.db');

// Menggabungkan seluruh data OCR PDF dari Halaman 1 sampai 4
const rawData = `
A1/03 Menetap Rp10,000 Rp10,000 Rp10,000 Rp10,000 Rp10,000 Rp50,000
A1/04 Menetap Rp10,000 Rp10,000 Rp10,000 Rp10,000 Rp40,000
A1/09 Menetap Rp0
A1/10 Kunjungan Rp10,000 Rp10,000 Rp20,000
A1/20 Menetap Rp0
A1/22 Menetap Rp10,000 Rp10,000 Rp10,000 Rp10,000 Rp10,000 Rp50,000
A1/23 Menetap Rp10,000 Rp10,000 Rp10,000 Rp10,000 Rp40,000
A2/03 Kunjungan Rp10,000 Rp10,000 Rp10,000 Rp10,000 Rp40,000
A2/08 Kunjungan Rp0
A2/09 Kunjungan Rp10,000 Rp10,000 Rp10,000 Rp10,000 Rp10,000 Rp50,000
A2/11 Menetap Belum mulai Belum mulai Belum mulai Rp10,000 Rp10,000
A2/25 Kunjungan Rp0
A3/01 Kunjungan Rp10,000 Rp10,000 Rp10,000 Rp10,000 Rp10,000 Rp10,000 Rp60,000
A3/06 Ditempati 2026 Rp0
A3/09 Kunjungan Rp10,000 Rp10,000 Rp10,000 Rp30,000
A3/10 Kunjungan Rp10,000 Rp10,000 Rp10,000 Rp10,000 Rp10,000 Rp10,000 Rp10,000 Rp10,000 Rp10,000 Rp10,000 Rp100,000
A3/12 Kunjungan Rp0
A3/15 Kunjungan Belum mulai Rp10,000 Rp10,000 Rp10,000 Rp10,000 Rp10,000 Rp50,000
A4/01 Kunjungan Rp10,000 Rp10,000 Rp10,000 Rp10,000 Rp10,000 Rp10,000 Rp10,000 Rp10,000 Rp80,000
A4/05 Kunjungan Rp10,000 Rp10,000 Rp10,000 Rp10,000 Rp10,000 Rp10,000 Rp10,000 Rp10,000 Rp10,000 Rp10,000 Rp10,000 Rp10,000 Rp120,000
A4/06 Kunjungan Rp10,000 Rp10,000 Rp10,000 Rp10,000 Rp10,000 Rp10,000 Rp10,000 Rp10,000 Rp10,000 Rp10,000 Rp10,000 Rp10,000 Rp120,000
A4/08 Menetap Rp10,000 Rp10,000 Rp20,000
A4/10 Kunjungan Rp10,000 Rp10,000 Rp10,000 Rp10,000 Rp10,000 Rp50,000
A4/11 Menetap Rp10,000 Rp10,000 Rp10,000 Rp10,000 Rp10,000 Rp50,000
A4/12 Menetap Belum mulai Belum mulai Belum mulai Rp10,000 Rp10,000 Rp10,000 Rp10,000 Rp10,000 Rp50,000
A4/15 Ditempati 2026 Rp0
A4/17 Menetap Rp10,000 Rp10,000 Rp20,000
A5/03 Kunjungan Rp10,000 Rp10,000 Rp10,000 Rp10,000 Rp10,000 Rp10,000 Rp60,000
A5/06 Kunjungan Rp10,000 Rp10,000 Rp10,000 Rp10,000 Rp40,000
A5/09 Menetap Rp10,000 Rp10,000 Rp10,000 Rp10,000 Rp10,000 Rp50,000
A5/11 Kunjungan Rp10,000 Rp10,000
A5/14 Ditempati 2026 Rp0
A5/18 Menetap Belum mulai Belum mulai Rp10,000 Rp10,000 Rp10,000 Rp10,000 Rp10,000 Rp10,000 Rp10,000 Rp10,000 Rp10,000 Rp10,000 Rp100,000
A5/22 Menetap Rp10,000 Rp10,000 Rp10,000 Rp10,000 Rp40,000
A5/29 Menetap Rp0
B1/02 Menetap Rp10,000 Rp10,000 Rp10,000 Rp10,000 Rp10,000 Rp50,000
B1/03 Menetap Belum mulai Belum mulai Belum mulai Rp10,000 Rp10,000
B1/04 Menetap Belum mulai Belum mulai Rp10,000 Rp10,000 Rp10,000 Rp10,000 Rp10,000 Rp50,000
B1/10 Kunjungan Belum mulai Rp10,000 Rp10,000 Rp10,000 Rp10,000 Rp10,000 Rp10,000 Rp60,000
B1/11 Kunjungan Rp0
B1/12 Menetap Belum mulai Belum mulai Belum mulai Belum mulai Rp0
B1/19 Kunjungan Rp10,000 Rp10,000 Rp10,000 Rp30,000
B1/20 Ditempati 2026 Rp10,000 Rp10,000 Rp10,000 Rp10,000 Rp10,000 Rp50,000
B1/21 Ditempati 2026 Belum mulai Belum mulai Belum mulai Rp0
B2/01 Kunjungan Rp10,000 Rp10,000 Rp10,000 Rp10,000 Rp10,000 Rp10,000 Rp60,000
B2/05 Ditempati 2026 Belum mulai Belum mulai Rp10,000 Rp10,000 Rp10,000 Rp10,000 Rp10,000 Rp50,000
B2/06 Ditempati 2026 Belum mulai Belum mulai Belum mulai Rp10,000 Rp10,000
B2/07 Menetap Rp10,000 Rp10,000 Rp10,000 Rp30,000
B2/08 Menetap Belum mulai Belum mulai Belum mulai Belum mulai Rp0
B2/10 Belum mulai Rp0
B2/11 Kunjungan Rp10,000 Rp10,000
B2/13 Kunjungan Rp10,000 Rp10,000 Rp10,000 Rp10,000 Rp10,000 Rp50,000
B2/14 Kunjungan Rp10,000 Rp10,000 Rp10,000 Rp10,000 Rp10,000 Rp10,000 Rp10,000 Rp70,000
B2/17 Kunjungan Rp0
B2/18 Kunjungan Rp10,000 Rp10,000
B2/22 Menetap Rp10,000 Rp10,000 Rp10,000 Rp10,000 Rp10,000 Rp10,000 Rp60,000
B2/36 Kunjungan Belum mulai Rp0
B2/38 Ditempati 2026 Rp10,000 Rp10,000
B3/01 Menetap Rp10,000 Rp10,000 Rp10,000 Rp10,000 Rp40,000
B3/06 Menetap Rp10,000 Rp10,000 Rp10,000 Rp10,000 Rp10,000 Rp50,000
B3/07 Menetap Rp10,000 Rp10,000 Rp10,000 Rp10,000 Rp10,000 Rp50,000
B3/16 Ditempati 2026 Rp10,000 Rp10,000
B3/20 Menetap Belum mulai Belum mulai Rp10,000 Rp10,000 Rp10,000 Rp10,000 Rp10,000 Rp50,000
B3/21 Menetap Rp10,000 Rp10,000 Rp10,000 Rp30,000
B3/23 Kunjungan Rp0
B3/27 Menetap Belum mulai Belum mulai Belum mulai Belum mulai Rp0
B3/30 Kunjungan Rp10,000 Rp10,000
B3/37 Kunjungan Rp10,000 Rp10,000 Rp10,000 Rp10,000 Rp10,000 Rp10,000 Rp10,000 Rp70,000
B3/38 Menetap Rp10,000 Rp10,000
B4/01 Menetap Rp10,000 Rp10,000 Rp10,000 Rp10,000 Rp10,000 Rp10,000 Rp60,000
B4/03 Kunjungan Rp10,000 Rp10,000 Rp10,000 Rp10,000 Rp10,000 Rp50,000
B4/04 Menetap Rp10,000 Rp10,000 Rp10,000 Rp30,000
B4/05 Kunjungan Rp0
B4/06 Ditempati 2026 Rp10,000 Rp10,000 Rp10,000 Rp10,000 Rp40,000
B4/09 Kunjungan Rp0
B4/13 Ditempati 2026 Rp10,000 Rp10,000 Rp10,000 Rp10,000 Rp40,000
B4/23 Kunjungan Rp10,000 Rp10,000
B4/24 Ditempati 2026 Rp10,000 Rp10,000 Rp10,000 Rp10,000 Rp40,000
B4/30 Kunjungan Rp0
B4/36 Kunjungan Rp10,000 Rp10,000 Rp10,000 Rp30,000
B4/37 Menetap Rp0
B4/38 Menetap Rp10,000 Rp10,000 Rp10,000 Rp10,000 Rp10,000 Rp10,000 Rp60,000
B5/10 Ditempati 2026 Rp10,000 Rp10,000 Rp10,000 Rp30,000
B5/17 Kunjungan Rp10,000 Rp10,000 Rp10,000 Rp10,000 Rp40,000
B5/22 Kunjungan Belum mulai Belum mulai Belum mulai Belum mulai Rp0
B5/23 Menetap Belum mulai Belum mulai Belum mulai Belum mulai Rp0
B5/24 Kunjungan Belum mulai Belum mulai Belum mulai Belum mulai Rp0
B5/27 Kunjungan Belum mulai Belum mulai Belum mulai Rp10,000 Rp10,000 Rp10,000 Rp10,000 Rp10,000 Rp50,000
B5/30 Menetap Belum mulai Belum mulai Belum mulai Belum mulai Rp0
B6/03 Ditempati 2026 Rp10,000 Rp10,000 Rp10,000 Rp10,000 Rp40,000
B6/05 Menetap Rp10,000 Rp10,000 Rp10,000 Rp30,000
B6/09 Kunjungan Rp0
B6/12 Kunjungan Rp10,000 Rp10,000 Rp10,000 Rp10,000 Rp40,000
B6/14 Menetap Rp10,000 Rp10,000
B6/20 Menetap Rp10,000 Rp10,000 Rp10,000 Rp10,000 Rp10,000 Rp10,000 Rp10,000 Rp10,000 Rp10,000 Rp10,000 Rp10,000 Rp10,000 Rp120,000
B6/22 Kunjungan Belum mulai Rp10,000 Rp10,000
B6/23 Kunjungan Rp10,000 Rp10,000 Rp10,000 Rp10,000 Rp10,000 Rp50,000
B6/24 Menetap Rp10,000 Rp10,000 Rp10,000 Rp10,000 Rp40,000
C1/02 Menetap Rp10,000 Rp10,000 Rp10,000 Rp10,000 Rp10,000 Rp10,000 Rp10,000 Rp70,000
C1/05 Menetap Rp0
C1/09 Ditempati 2026 Rp10,000 Rp10,000 Rp10,000 Rp10,000 Rp10,000 Rp10,000 Rp60,000
C1/10 Ditempati 2026 Belum mulai Rp10,000 Rp10,000 Rp20,000
C1/13 Kunjungan Rp10,000 Rp10,000 Rp10,000 Rp10,000 Rp10,000 Rp10,000 Rp60,000
C1/14 Kunjungan Rp10,000 Rp10,000 Rp10,000 Rp10,000 Rp10,000 Rp10,000 Rp60,000
C1/20 Menetap Belum mulai Belum mulai Rp0
C1/23 Ditempati 2026 Rp10,000 Rp10,000 Rp10,000 Rp10,000 Rp10,000 Rp10,000 Rp60,000
C2/01 Kunjungan Rp10,000 Rp10,000 Rp10,000 Rp10,000 Rp10,000 Rp50,000
C2/02 Menetap Rp10,000 Rp10,000 Rp10,000 Rp10,000 Rp10,000 Rp50,000
C2/04 Menetap Rp10,000 Rp10,000 Rp10,000 Rp30,000
C2/05 Menetap Rp10,000 Rp10,000 Rp10,000 Rp10,000 Rp10,000 Rp10,000 Rp10,000 Rp10,000 Rp10,000 Rp10,000 Rp10,000 Rp10,000 Rp120,000
C2/06 Menetap Rp10,000 Rp10,000 Rp10,000 Rp10,000 Rp10,000 Rp50,000
C2/07 Menetap Rp10,000 Rp10,000 Rp10,000 Rp10,000 Rp40,000
C2/08 Ditempati 2026 Rp10,000 Rp10,000 Rp10,000 Rp10,000 Rp10,000 Rp10,000 Rp60,000
C2/12 Kunjungan Rp10,000 Rp10,000 Rp10,000 Rp10,000 Rp40,000
C2/13 Kunjungan Rp10,000 Rp10,000 Rp10,000 Rp10,000 Rp10,000 Rp10,000 Rp60,000
C2/14 Kunjungan Rp0
C2/16 Ditempati 2026 Rp10,000 Rp10,000
C3/04 Kunjungan Belum mulai Rp10,000 Rp10,000 Rp10,000 Rp10,000 Rp40,000
C3/05 Ditempati 2026 Rp10,000 Rp10,000 Rp10,000 Rp10,000 Rp10,000 Rp10,000 Rp60,000
C3/21 Menetap Rp10,000 Rp10,000 Rp10,000 Rp10,000 Rp10,000 Rp50,000
C3/22 Ditempati 2026 Rp10,000 Rp10,000 Rp10,000 Rp10,000 Rp10,000 Rp10,000 Rp10,000 Rp70,000
C3/23 Kunjungan Belum mulai Belum mulai Rp10,000 Rp10,000
C3/26 Kunjungan Belum mulai Rp10,000 Rp10,000 Rp10,000 Rp10,000 Rp10,000 Rp50,000
C4/02 Menetap Rp10,000 Rp10,000 Rp10,000 Rp10,000 Rp10,000 Rp50,000
C4/06 Kunjungan Rp10,000 Rp10,000 Rp10,000 Rp10,000 Rp10,000 Rp10,000 Rp60,000
C4/07 Kunjungan Rp10,000 Rp10,000 Rp20,000
C4/09 Menetap Rp10,000 Rp10,000 Rp10,000 Rp10,000 Rp10,000 Rp10,000 Rp60,000
C4/10 Kunjungan Rp10,000 Rp10,000 Rp10,000 Rp10,000 Rp10,000 Rp50,000
C4/14 Kunjungan Rp0
C4/15 Menetap Rp10,000 take over take over Rp10,000 Rp20,000
C4/16 Kunjungan Rp10,000 Rp10,000 Rp10,000 Rp10,000 Rp40,000
C4/17 Menetap Rp10,000 Rp10,000 Rp10,000 Rp10,000 Rp10,000 Rp10,000 Rp60,000
C4/18 Menetap Rp10,000 Rp10,000 Rp10,000 Rp10,000 Rp10,000 Rp50,000
C5/01 Kunjungan Rp0
C5/02 Menetap Rp10,000 Rp10,000 Rp10,000 Rp10,000 Rp10,000 Rp10,000 Rp10,000 Rp10,000 Rp80,000
C5/03 Kunjungan Rp10,000 Rp10,000 Rp20,000
C5/04 Menetap Rp10,000 Rp10,000 Rp10,000 Rp10,000 Rp10,000 Rp50,000
C5/05 Kunjungan Rp10,000 Rp10,000
C5/06 Kunjungan Rp0
C5/07 Menetap Rp10,000 Rp10,000
C5/08 Kunjungan Rp10,000 Rp10,000 Rp10,000 Rp10,000 Rp10,000 Rp10,000 Rp60,000
C5/09 Menetap Rp10,000 Rp10,000 Rp10,000 Rp10,000 Rp10,000 Rp10,000 Rp60,000
C5/13 Kunjungan Rp0
C5/15 Kunjungan Belum mulai Rp10,000 Rp10,000 Rp10,000 Rp10,000 Rp10,000 Rp10,000 Rp10,000 Rp10,000 Rp10,000 Rp10,000 Rp110,000
C5/16 Menetap Rp10,000 Rp10,000 Rp10,000 Rp10,000 Rp10,000 Rp10,000 Rp10,000 Rp10,000 Rp80,000
C5/17 Menetap Rp10,000 Rp10,000 Rp10,000 Rp10,000 Rp10,000 Rp10,000 Rp60,000
C5/18 Menetap Rp10,000 Rp10,000 Rp10,000 Rp10,000 Rp10,000 Rp10,000 Rp10,000 Rp10,000 Rp10,000 Rp10,000 Rp10,000 Rp10,000 Rp120,000
C5/19 Kunjungan Rp10,000 Rp10,000
C5/22 Kunjungan Rp10,000 Rp10,000
C5/23 Menetap Rp10,000 Rp10,000 Rp10,000 Rp10,000 Rp10,000 Rp10,000 Rp10,000 Rp10,000 Rp10,000 Rp10,000 Rp10,000 Rp10,000 Rp120,000
D1/13 Ditempati 2026 Belum mulai Belum mulai Belum mulai Rp10,000 Rp10,000 Rp10,000 Rp30,000
D1/16 Menetap Belum mulai Belum mulai Rp0
D2/11 Kunjungan Belum mulai Belum mulai Rp0
D2/13 Menetap Rp10,000 Rp10,000 Rp10,000 Rp10,000 Rp40,000
D2/19 Kunjungan Belum mulai Belum mulai Belum mulai Rp10,000 Rp10,000 Rp20,000
D3/01 Menetap Rp10,000 Rp10,000 Rp10,000 Rp10,000 Rp10,000 Rp50,000
D3/02 Kunjungan Rp0
D3/04 Kunjungan Rp10,000 Rp10,000 Rp10,000 Rp10,000 Rp10,000 Rp10,000 Rp10,000 Rp10,000 Rp10,000 Rp10,000 Rp10,000 Rp10,000 Rp120,000
D3/05 Menetap Rp10,000 Rp10,000 Rp10,000 Rp10,000 Rp10,000 Rp50,000
D3/07 Kunjungan Rp10,000 Rp10,000
D3/11 Kunjungan Rp0
D3/12 Menetap Rp10,000 Rp10,000 Rp20,000
D3/15 Kunjungan Rp10,000 Rp10,000 Rp20,000
D3/17 Kunjungan Rp0
D3/20 Kunjungan Rp10,000 Rp10,000 Rp10,000 Rp10,000 Rp10,000 Rp10,000 Rp10,000 Rp10,000 Rp10,000 Rp10,000 Rp10,000 Rp10,000 Rp120,000
D3/21 Kunjungan Rp10,000 Rp10,000
D3/22 Kunjungan Rp10,000 Rp10,000 Rp10,000 Rp10,000 Rp40,000
D3/26 Menetap Rp0
D3/27 Kunjungan Rp10,000 Rp10,000 Rp20,000
D3/32 Kunjungan Rp0
D3/35 Menetap Rp10,000 Rp10,000 Rp10,000 Rp10,000 Rp40,000
D3/36 Menetap Rp10,000 Rp10,000 Rp10,000 Rp10,000 Rp10,000 Rp10,000 Rp60,000
D3/37 Ditempati 2026 Rp0
D3/41 Kunjungan Rp0
D4/11 Kunjungan Belum mulai Belum mulai Belum mulai Belum mulai Rp0
D4/28 Menetap Rp10,000 Rp10,000 Rp10,000 Rp10,000 Rp10,000 Rp10,000 Rp60,000
D4/33 Ditempati 2026 Belum mulai Belum mulai Belum mulai Belum mulai Rp0
`;

const lines = rawData.trim().split('\n');

const bulanNames = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
];

let insertedKas = 0;

db.transaction(() => {
    lines.forEach(line => {
        if (line.trim() === '') return;

        // Ambil format Blok (Contoh: A1/03)
        const blockMatch = line.match(/^([A-D]\d\/\d\d)/);
        if (!blockMatch) return;

        const rawBlock = blockMatch[1];
        const idRumah = `Beryl-${rawBlock.replace('/', '-')}`;

        // Hapus Blok dan status dari baris data
        let restOfLine = line.substring(blockMatch[0].length).trim();
        restOfLine = restOfLine.replace(/^(Menetap|Kunjungan|Ditempati 2026|Belum mulai)/i, '').trim();
        
        // Hapus Angka Total di akhir baris (Rp50,000 atau Rp120,000 atau Rp0)
        restOfLine = restOfLine.replace(/Rp\d+(?:[,.]\d+)*\s*$/, '').trim();

        // Cari pecahan token per bulan yang valid
        const tokens = restOfLine.match(/(Rp\s*10[,.]000|Belum mulai|take over)/gi) || [];

        // Cari Kepala Keluarga di Rumah Tersebut
        let idWarga = null;
        const wargaRecord = db.prepare(`SELECT id_warga FROM warga WHERE id_rumah = ? AND peran_keluarga = 'Kepala Keluarga'`).get(idRumah);
        
        if (wargaRecord) {
            idWarga = wargaRecord.id_warga;
        } else {
            const anyWarga = db.prepare(`SELECT id_warga FROM warga WHERE id_rumah = ? AND status_warga = 'Aktif'`).get(idRumah);
            if (anyWarga) idWarga = anyWarga.id_warga;
        }

        // Simpan transaksi untuk setiap bulan
        tokens.forEach((token, index) => {
            const isLunas = token.replace(/\s|[,.]/g, '').toLowerCase() === 'rp10000';

            if (isLunas && idWarga) {
                const monthNum = String(index + 1).padStart(2, '0');
                const periode = `2026-${monthNum}-01`;
                const tanggalBayar = `2026-${monthNum}-05`;
                const namaBulan = bulanNames[index];
                const keterangan = `Iuran Kas ${namaBulan} 2026 (Import)`;

                const existingKas = db.prepare(`SELECT id_transaksi FROM kas_warga WHERE id_warga_pembayar = ? AND periode_bulan = ? AND kategori = 'Pemasukan'`).get(idWarga, periode);

                if (!existingKas) {
                    db.prepare(`INSERT INTO kas_warga (id_warga_pembayar, periode_bulan, tanggal, kategori, nominal, keterangan, status_bayar, bukti_transfer, diinput_oleh) 
                                VALUES (?, ?, ?, 'Pemasukan', 10000, ?, 'Lunas', 'Admin Input', 1)`)
                      .run(idWarga, periode, tanggalBayar, keterangan);
                    insertedKas++;
                }
            }
        });
    });
})();

console.log(`=========================================`);
console.log(`✅ Import Data Iuran Kas Selesai!`);
console.log(`💰 Total Transaksi Berhasil Dimasukkan: ${insertedKas}`);
console.log(`=========================================`);