import express from 'express';
import path from 'path';
import sqlite3 from 'sqlite3';

const app = express();
const PORT = 3001;

app.use(express.json());

const dbPath = path.resolve(process.cwd(), 'masjid_alabrokah.db');
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Koneksi Database SQLite Gagal:', err.message);
  } else {
    console.log('Terhubung ke Database SQLite Lokal:', dbPath);
  }
});

db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS warga (
      id_warga INTEGER PRIMARY KEY AUTOINCREMENT,
      nama_lengkap TEXT NOT NULL,
      nik_kk TEXT,
      status_warga TEXT DEFAULT 'Baru',
      no_hp TEXT,
      alamat_blok TEXT NOT NULL,
      keterangan TEXT,
      tanggal_daftar DATE
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS infaq_bulanan (
      id_infaq INTEGER PRIMARY KEY AUTOINCREMENT,
      id_warga INTEGER NOT NULL,
      tahun INTEGER NOT NULL,
      bulan INTEGER NOT NULL,
      nominal REAL DEFAULT 10000,
      tanggal_bayar DATE,
      keterangan TEXT,
      FOREIGN KEY (id_warga) REFERENCES warga(id_warga)
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS transaksi_keuangan (
      id_transaksi INTEGER PRIMARY KEY AUTOINCREMENT,
      jenis TEXT CHECK(jenis IN ('Pemasukan', 'Pengeluaran')),
      pos_dana TEXT NOT NULL,
      nama_acara TEXT,
      id_warga INTEGER,
      nominal REAL NOT NULL,
      tanggal DATE NOT NULL,
      keterangan TEXT,
      bukti_nota TEXT,
      FOREIGN KEY (id_warga) REFERENCES warga(id_warga)
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS pinjaman_warga (
      id_pinjaman INTEGER PRIMARY KEY AUTOINCREMENT,
      id_warga INTEGER NOT NULL,
      tanggal_pinjam DATE NOT NULL,
      nominal_pinjaman REAL NOT NULL,
      sisa_pinjaman REAL NOT NULL,
      status_pinjaman TEXT DEFAULT 'Berjalan',
      keterangan TEXT,
      FOREIGN KEY (id_warga) REFERENCES warga(id_warga)
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS cicilan_pinjaman (
      id_cicilan INTEGER PRIMARY KEY AUTOINCREMENT,
      id_pinjaman INTEGER NOT NULL,
      tanggal_bayar DATE NOT NULL,
      nominal REAL NOT NULL,
      catatan TEXT,
      FOREIGN KEY (id_pinjaman) REFERENCES pinjaman_warga(id_pinjaman)
    )
  `);
});

// Helper DB Promise
const query = (sql: string, params: any[] = []): Promise<any[]> => {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
};

const run = (sql: string, params: any[] = []): Promise<any> => {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function (err) {
      if (err) reject(err);
      else resolve({ id: this.lastID, changes: this.changes });
    });
  });
};

// API Endpoint: Data Warga
app.get('/api/warga', async (_req, res) => {
  try {
    const rows = await query('SELECT * FROM warga ORDER BY nama_lengkap ASC');
    res.json(rows);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/warga', async (req, res) => {
  try {
    const { nama_lengkap, nik_kk, status_warga, no_hp, alamat_blok, keterangan, tanggal_daftar } = req.body;
    const result = await run(
      `INSERT INTO warga (nama_lengkap, nik_kk, status_warga, no_hp, alamat_blok, keterangan, tanggal_daftar) 
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [nama_lengkap, nik_kk, status_warga || 'Baru', no_hp, alamat_blok, keterangan, tanggal_daftar || new Date().toISOString().slice(0, 10)]
    );
    res.json({ success: true, id_warga: result.id });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// API Endpoint: Infaq Bulanan
app.get('/api/infaq-bulanan', async (req, res) => {
  try {
    const tahun = req.query.tahun || new Date().getFullYear();
    const rows = await query(
      `SELECT i.*, w.nama_lengkap, w.alamat_blok 
       FROM infaq_bulanan i 
       JOIN warga w ON i.id_warga = w.id_warga 
       WHERE i.tahun = ?`,
      [tahun]
    );
    res.json(rows);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/infaq-bulanan', async (req, res) => {
  try {
    const { id_warga, tahun, bulan, nominal, tanggal_bayar, keterangan } = req.body;
    const result = await run(
      `INSERT INTO infaq_bulanan (id_warga, tahun, bulan, nominal, tanggal_bayar, keterangan) 
       VALUES (?, ?, ?, ?, ?, ?)`,
      [id_warga, tahun, bulan, nominal || 10000, tanggal_bayar || new Date().toISOString().slice(0, 10), keterangan]
    );
    res.json({ success: true, id_infaq: result.id });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// API Endpoint: Transaksi Keuangan (Acara, Infaq Majelis, Pengeluaran)
app.get('/api/transaksi', async (_req, res) => {
  try {
    const rows = await query(
      `SELECT t.*, w.nama_lengkap as nama_warga 
       FROM transaksi_keuangan t 
       LEFT JOIN warga w ON t.id_warga = w.id_warga 
       ORDER BY t.tanggal DESC, t.id_transaksi DESC`
    );
    res.json(rows);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/transaksi', async (req, res) => {
  try {
    const { jenis, pos_dana, nama_acara, id_warga, nominal, tanggal, keterangan, bukti_nota } = req.body;
    const result = await run(
      `INSERT INTO transaksi_keuangan (jenis, pos_dana, nama_acara, id_warga, nominal, tanggal, keterangan, bukti_nota) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [jenis, pos_dana, nama_acara || null, id_warga || null, nominal, tanggal, keterangan, bukti_nota || null]
    );
    res.json({ success: true, id_transaksi: result.id });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// API Endpoint: Pinjaman Warga
app.get('/api/pinjaman', async (_req, res) => {
  try {
    const rows = await query(
      `SELECT p.*, w.nama_lengkap as nama_warga 
       FROM pinjaman_warga p 
       JOIN warga w ON p.id_warga = w.id_warga 
       ORDER BY p.id_pinjaman DESC`
    );
    res.json(rows);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/pinjaman', async (req, res) => {
  try {
    const { id_warga, tanggal_pinjam, nominal_pinjaman, keterangan } = req.body;
    const result = await run(
      `INSERT INTO pinjaman_warga (id_warga, tanggal_pinjam, nominal_pinjaman, sisa_pinjaman, status_pinjaman, keterangan) 
       VALUES (?, ?, ?, ?, 'Berjalan', ?)`,
      [id_warga, tanggal_pinjam, nominal_pinjaman, nominal_pinjaman, keterangan]
    );
    res.json({ success: true, id_pinjaman: result.id });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/pinjaman/cicil', async (req, res) => {
  try {
    const { id_pinjaman, tanggal_bayar, nominal, catatan } = req.body;
    await run(
      `INSERT INTO cicilan_pinjaman (id_pinjaman, tanggal_bayar, nominal, catatan) 
       VALUES (?, ?, ?, ?)`,
      [id_pinjaman, tanggal_bayar, nominal, catatan]
    );

    const pinjaman: any = await query('SELECT * FROM pinjaman_warga WHERE id_pinjaman = ?', [id_pinjaman]);
    if (pinjaman.length > 0) {
      const sisaBaru = Math.max(0, pinjaman[0].sisa_pinjaman - nominal);
      const statusBaru = sisaBaru === 0 ? 'Lunas' : 'Berjalan';
      await run('UPDATE pinjaman_warga SET sisa_pinjaman = ?, status_pinjaman = ? WHERE id_pinjaman = ?', [
        sisaBaru,
        statusBaru,
        id_pinjaman,
      ]);
    }

    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Backend Server Al-Abrokah aktif di http://localhost:${PORT}`);
});