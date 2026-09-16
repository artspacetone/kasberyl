# 🏛️ Portal Warga Beryl & Majelis Al Barokah (v2.6 Amanah)

Sistem Informasi Tata Kelola Lingkungan, Kependudukan, Kas Iuran Warga (Rp 10.000), Dana Acara Paguyuban, Infaq Majelis Al Barokah, Pengeluaran Terpadu, dan Pinjaman Sosial Qardhul Hasan.

## ✨ Fitur Unggulan
- ⚡ **Ultra-Fast O(1) Performance:** Merender ribuan data transaksi tanpa lag dengan memori rendah.
- 🔒 **Proteksi Privasi Warga:** Nomor kontak warga disensor otomatis (`🔒 Nomor Terkunci`) pada Mode Warga/Tamu.
- 💰 **Kas Iuran 1-Klik:** Klik 1x untuk Masuk Dana (Lunas), Klik 2x untuk Batalkan Pembayaran (Targeted Splice).
- 📱 **Mobile Responsive & PWA:** Dilengkapi Bottom Navigation Bar untuk layar HP dan siap di-install di Android/iOS.
- 📑 **Kuitansi Digital WhatsApp:** Tanda terima pembayaran resmi digital yang siap dibagikan ke WhatsApp warga.
- 🗄️ **Supabase Cloud Dual-Engine:** Sinkronisasi cloud PostgreSQL dengan fallback cache lokal anti-hilang data.

## 🚀 Menjalankan Proyek Secara Lokal

1. **Clone repositori:**
   \`\`\`bash
   git clone https://github.com/artspacetone/kasberyl.git
   cd kasberyl
   \`\`\`

2. **Install dependensi:**
   \`\`\`bash
   npm install
   \`\`\`

3. **Buat file `.env` untuk kredensial Supabase:**
   \`\`\`env
   VITE_SUPABASE_URL=https://xxxxxxxx.supabase.co
   VITE_SUPABASE_ANON_KEY=eyJhbGciOi...
   \`\`\`

4. **Jalankan server lokal:**
   \`\`\`bash
   npm run dev
   \`\`\`

5. **Build untuk produksi:**
   \`\`\`bash
   npm run build
   \`\`\`