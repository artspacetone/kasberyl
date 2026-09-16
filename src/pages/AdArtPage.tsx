// src/pages/AdArtPage.tsx
import React, { useState, useEffect, useMemo } from 'react';
import { 
  Book, Heart, Building, Shield, Bell, Cat, 
  Users, Award, Gavel, Lock, Landmark, FileText, 
  ChevronDown, ChevronUp, CheckCircle2, AlertTriangle, 
  Info, Printer, Search, Plus, Edit2, Trash2, RotateCcw, 
  Save, X, ShieldCheck
} from 'lucide-react';
import { supabase, isSupabaseConfigured } from '../supabase';
import { Pengguna } from '../types';

interface ClauseItemObject {
  type: 'warning' | 'info';
  text: string;
}

type ClauseItemType = string | ClauseItemObject;

interface Clause {
  id: string;
  title: string;
  type: 'primary' | 'secondary';
  iconType?: 'alert' | 'info';
  amount?: string;
  amountLabel?: string;
  items: ClauseItemType[];
}

interface Chapter {
  id: string;
  title: string;
  subtitle: string;
  color: string;
  icon_name: string;
  clauses: Clause[];
  urutan?: number;
}

// Map Icon Komponen
const ICON_MAP: Record<string, React.ElementType> = {
  Book, Heart, Building, Shield, Bell, Cat, Users, Award, Gavel, Lock, Landmark, FileText
};

// =========================================================================
// DATA RESMI 12 BAB + 6 PEDOMAN OPERASIONAL AD/ART EDISI 2026
// =========================================================================
const INITIAL_ADART_DATA: Chapter[] = [
  {
    id: "bab-1",
    title: "BAB I: NAMA, KEDUDUKAN, ASAS, DAN KETENTUAN UMUM",
    subtitle: "4 Pasal",
    color: "bg-emerald-900",
    icon_name: "Book",
    urutan: 1,
    clauses: [
      {
        id: "Pasal 1",
        title: "Nama dan Kedudukan",
        type: "primary",
        items: [
          "Organisasi warga ini bernama Paguyuban Warga Beryl, selanjutnya dalam dokumen ini disebut \"Paguyuban\".",
          "Paguyuban berkedudukan di lingkungan Cluster Beryl Permata Mutiara Maja, Desa Curug Badak, Kecamatan Maja, Kabupaten Lebak, Provinsi Banten.",
          "Paguyuban merupakan wadah komunikasi, silaturahmi, musyawarah, gotong royong, kepedulian sosial, dan koordinasi warga.",
          "Paguyuban bukan merupakan lembaga pemerintahan dan tidak menggantikan kewenangan Pemerintah Desa, RT, RW, Kepolisian, Pengembang, atau lembaga resmi lainnya.",
          "Seluruh kegiatan Paguyuban dilaksanakan sesuai dengan peraturan perundang-undangan dan ketentuan Pemerintah Desa yang berlaku."
        ]
      },
      {
        id: "Pasal 2",
        title: "Asas dan Sifat Paguyuban",
        type: "secondary",
        iconType: "info",
        items: [
          "Paguyuban berasaskan Pancasila, Undang-Undang Dasar Negara Republik Indonesia Tahun 1945, kekeluargaan, gotong royong, musyawarah, kepedulian sosial, serta nilai-nilai kebaikan dan ketertiban.",
          "Paguyuban bersifat sosial, nirlaba, mandiri, nonpartisan, dan tidak bertujuan mencari keuntungan.",
          "Paguyuban tidak boleh digunakan sebagai sarana untuk kepentingan politik praktis, kepentingan pribadi, atau kepentingan kelompok yang merugikan warga.",
          "Setiap aturan dalam AD/ART ini harus dilaksanakan secara wajar, proporsional, santun, dan tidak bertentangan dengan hukum yang berlaku."
        ]
      },
      {
        id: "Pasal 3",
        title: "Status Masa Transisi",
        type: "secondary",
        iconType: "info",
        items: [
          "Paguyuban dibentuk sebagai wadah koordinasi warga selama lingkungan Cluster Beryl masih dalam masa perkembangan dan belum memiliki struktur RT definitif sesuai ketentuan Pemerintah Desa.",
          "Paguyuban tidak menetapkan dirinya sebagai RT dan tidak menggunakan kewenangan yang hanya dimiliki oleh RT/RW atau Pemerintah Desa.",
          "Setelah RT definitif terbentuk dan ditetapkan sesuai prosedur Pemerintah Desa, Paguyuban melakukan penyesuaian fungsi, kepengurusan, aset, data, dan kegiatan sesuai hasil musyawarah warga serta ketentuan pemerintah.",
          "Selama masa transisi, Paguyuban tetap dapat menjalankan kegiatan sosial, komunikasi warga, gotong royong, dan kegiatan lain yang disepakati bersama sepanjang tidak bertentangan dengan kewenangan lembaga resmi."
        ]
      },
      {
        id: "Pasal 4",
        title: "Pengertian Istilah",
        type: "secondary",
        iconType: "info",
        items: [
          "Warga adalah orang yang tinggal atau berdomisili di Cluster Beryl, baik sebagai pemilik rumah maupun penghuni yang sah.",
          "Kepala Keluarga (KK) adalah satu kesatuan keluarga yang tercatat berdasarkan administrasi kependudukan yang berlaku.",
          "Pemilik adalah pihak yang secara sah memiliki atau menguasai unit rumah berdasarkan dokumen kepemilikan atau perjanjian yang sah.",
          "Penyewa adalah pihak yang menempati rumah berdasarkan perjanjian sewa atau izin dari pemilik.",
          "Pengurus adalah warga yang dipilih atau ditunjuk melalui mekanisme Paguyuban untuk menjalankan tugas organisasi.",
          "Dana Operasional Kegiatan Warga Beryl adalah 50% dari Iuran Kas Warga yang digunakan hanya untuk kegiatan dan kebutuhan umum warga, bukan untuk kepentingan pribadi.",
          "Dana Sosial Kemanusiaan adalah 50% dari Iuran Kas Warga yang digunakan untuk bantuan sosial dan kemanusiaan sesuai ketentuan AD/ART.",
          "Musyawarah Warga adalah forum pengambilan keputusan yang melibatkan warga sesuai ketentuan AD/ART.",
          "Hari adalah hari kalender, termasuk Sabtu, Minggu, dan hari libur, kecuali dinyatakan lain."
        ]
      }
    ]
  },
  {
    id: "bab-2",
    title: "BAB II: KAS IURAN WARGA DAN DANA SOSIAL",
    subtitle: "8 Pasal",
    color: "bg-emerald-700",
    icon_name: "Heart",
    urutan: 2,
    clauses: [
      {
        id: "Pasal 5",
        title: "Iuran Kas Warga",
        type: "primary",
        amount: "Rp 10.000",
        amountLabel: "Per KK / Bulan",
        items: [
          "Setiap Kepala Keluarga yang menempati unit rumah di Cluster Beryl wajib membayar Iuran Kas Warga sebesar Rp10.000 (sepuluh ribu rupiah) per bulan.",
          "Kewajiban iuran berlaku bagi pemilik yang menempati rumah maupun penyewa yang menempati rumah berdasarkan hubungan sewa yang sah.",
          "Untuk rumah yang kosong dan tidak ditempati, kewajiban iuran ditentukan berdasarkan hasil musyawarah warga dan dicatat secara jelas dalam pembukuan.",
          "Iuran bulan berjalan dibayarkan paling lambat tanggal 15 pada bulan yang sama.",
          "Iuran mulai diberlakukan sejak Januari 2026, kecuali terdapat keputusan musyawarah yang menetapkan tanggal efektif yang berbeda.",
          "Pembayaran diutamakan melalui rekening atau metode pembayaran resmi yang ditetapkan Bendahara agar setiap transaksi memiliki bukti.",
          "Setiap pembayaran harus dicatat berdasarkan bulan pembayaran dan identitas rumah atau Kepala Keluarga yang membayar."
        ]
      },
      {
        id: "Pasal 6",
        title: "Pembagian Iuran Kas 50% : 50%",
        type: "primary",
        amount: "50% : 50%",
        amountLabel: "Pembagian Tetap",
        items: [
          { type: 'info', text: "Iuran Kas Warga sebesar Rp10.000 per KK per bulan dibagi secara tetap dengan komposisi 50% untuk Operasional Kegiatan Warga Beryl dan 50% untuk Dana Sosial Kemanusiaan." },
          "Dari setiap Iuran Kas Warga sebesar Rp10.000 per KK per bulan, sebesar Rp5.000 dialokasikan untuk Pos Operasional Kegiatan Warga Beryl.",
          "Dari setiap Iuran Kas Warga sebesar Rp10.000 per KK per bulan, sebesar Rp5.000 dialokasikan untuk Pos Dana Sosial Kemanusiaan.",
          "Dengan demikian, pembagian normal Iuran Kas adalah Rp5.000 : Rp5.000 untuk setiap KK setiap bulan.",
          "Pos Operasional Kegiatan Warga Beryl digunakan untuk kebutuhan dan kegiatan yang manfaatnya bersifat umum bagi lingkungan atau warga secara bersama-sama.",
          "Pos Dana Sosial Kemanusiaan digunakan untuk membantu warga yang membutuhkan bantuan sosial atau kemanusiaan sesuai kriteria dan mekanisme yang diatur dalam AD/ART.",
          "Kedua pos dana tersebut wajib dicatat secara terpisah dalam pembukuan Bendahara agar jumlah saldo masing-masing pos dapat diketahui.",
          "Dana Pos Operasional tidak boleh digunakan untuk bantuan pribadi yang seharusnya berasal dari Pos Dana Sosial Kemanusiaan, kecuali telah ada keputusan musyawarah yang sah.",
          "Dana Pos Dana Sosial Kemanusiaan tidak boleh digunakan untuk membiayai kegiatan operasional rutin Paguyuban, kecuali dalam keadaan darurat kemanusiaan atau berdasarkan keputusan Musyawarah Warga.",
          "Penggunaan dana harus tetap memperhatikan saldo yang tersedia pada masing-masing pos dan tidak boleh dicatat seolah-olah dana tersedia apabila saldo sebenarnya tidak mencukupi.",
          { type: 'warning', text: "Perubahan komposisi 50% : 50% hanya dapat dilakukan melalui Musyawarah Warga dan harus dicatat dalam berita acara serta diumumkan kepada seluruh warga sebelum diberlakukan." },
          "Ketua, Bendahara, atau Pengurus tidak berwenang mengubah pembagian 50% : 50% secara sepihak."
        ]
      },
      {
        id: "Pasal 7",
        title: "Peruntukan Dana Operasional Kegiatan Warga Beryl",
        type: "secondary",
        iconType: "info",
        items: [
          "Dana Operasional Kegiatan Warga Beryl hanya digunakan untuk kepentingan umum warga dan bukan untuk kepentingan pribadi Pengurus atau anggota.",
          "Dana Operasional dapat digunakan untuk kegiatan gotong royong, kegiatan kemasyarakatan, kegiatan keagamaan yang disepakati, administrasi Paguyuban, perlengkapan kegiatan warga, kebutuhan kebersihan bersama, kegiatan keamanan lingkungan yang bersifat swadaya, serta kebutuhan umum lain yang telah disetujui.",
          "Dana Operasional tidak boleh digunakan untuk membayar kebutuhan pribadi seseorang, membayar utang pribadi, membeli barang pribadi, atau memberikan keuntungan pribadi kepada Pengurus.",
          "Apabila suatu kegiatan hanya memberikan manfaat pribadi kepada satu orang atau satu keluarga, biaya kegiatan tersebut tidak boleh dibebankan kepada Pos Operasional Kegiatan Warga.",
          "Setiap penggunaan dana operasional harus memiliki tujuan yang jelas dan dapat dijelaskan kepada warga.",
          "Pengeluaran harus dicatat dalam pembukuan dan, apabila memungkinkan, dilengkapi bukti pembayaran."
        ]
      },
      {
        id: "Pasal 8",
        title: "Akad Tabarru' dan Prinsip Dana Sosial",
        type: "secondary",
        iconType: "info",
        items: [
          { type: 'info', text: "Dana Sosial Kemanusiaan merupakan dana gotong royong berdasarkan niat saling membantu. Pembayaran iuran tidak boleh dipahami sebagai premi asuransi dan tidak memberikan hak otomatis atas sejumlah uang tertentu." },
          "Dana Sosial Kemanusiaan berasal dari 50% Iuran Kas Warga sebagaimana diatur dalam Pasal 6.",
          "Bantuan sosial diberikan berdasarkan kebutuhan, tingkat kedaruratan, kemampuan saldo Dana Sosial, hasil verifikasi, dan keputusan Pengurus sesuai AD/ART.",
          "Besarnya bantuan tidak otomatis sama untuk setiap kasus karena kondisi kesehatan, kebutuhan, dan kemampuan dana dapat berbeda.",
          "Tidak ada warga yang dapat menuntut pembayaran bantuan dengan jumlah tertentu hanya karena telah membayar iuran.",
          "Apabila saldo Dana Sosial tidak mencukupi, Pengurus dapat mengusulkan penggalangan bantuan sukarela kepada warga tanpa menjadikannya kewajiban tambahan."
        ]
      },
      {
        id: "Pasal 9",
        title: "Kriteria Bantuan Sakit dan Darurat",
        type: "primary",
        items: [
          "Bantuan sosial kesehatan diprioritaskan untuk kondisi yang membutuhkan pertolongan nyata dan mendesak.",
          "Kriteria prioritas meliputi rawat inap di rumah sakit atau fasilitas kesehatan, tindakan operasi, kecelakaan berat, kondisi medis darurat, atau kondisi sakit yang menyebabkan warga tidak mampu memperoleh pengobatan karena keterbatasan biaya.",
          "Rawat inap untuk keperluan prioritas umum adalah perawatan sekurang-kurangnya 2 x 24 jam, kecuali Pengurus menilai terdapat keadaan medis yang lebih mendesak.",
          "Bantuan tidak diberikan untuk setiap keluhan kesehatan ringan atau pemeriksaan rutin yang tidak bersifat mendesak.",
          "Bantuan diberikan berdasarkan kondisi nyata warga, kebutuhan pengobatan, kemampuan keuangan warga yang bersangkutan, dan kemampuan Pos Dana Sosial Kemanusiaan.",
          "Bantuan dapat diberikan kepada anggota keluarga inti yang tinggal bersama warga dan menjadi tanggungan warga yang bersangkutan, sepanjang kondisi tersebut dapat diverifikasi.",
          "Dalam keadaan yang mengancam keselamatan jiwa, pertolongan medis harus didahulukan dan tidak perlu menunggu keputusan Pengurus."
        ]
      },
      {
        id: "Pasal 10",
        title: "Mekanisme Bantuan Darurat",
        type: "secondary",
        iconType: "info",
        items: [
          "Warga yang mengetahui adanya tetangga dalam kondisi sakit atau darurat dapat melaporkan kepada Ketua, Pengurus, atau Bendahara.",
          "Laporan dapat disampaikan secara lisan atau melalui media komunikasi resmi Paguyuban apabila keadaan membutuhkan tindakan segera.",
          "Untuk kondisi darurat yang mengancam keselamatan jiwa, warga tidak perlu menunggu keputusan bantuan Paguyuban untuk membawa pasien ke fasilitas kesehatan.",
          "Pengurus dapat melakukan visitasi untuk memastikan kondisi warga secara kekeluargaan.",
          "Jika warga tidak mampu berobat karena keterbatasan biaya, Pengurus dapat memberikan bantuan awal sesuai kemampuan Pos Dana Sosial Kemanusiaan dan kebutuhan yang telah diverifikasi.",
          "Bantuan dapat diberikan langsung kepada warga, keluarga, fasilitas kesehatan, atau pihak lain yang secara langsung menangani kebutuhan tersebut.",
          "Setiap bantuan wajib dicatat dalam pembukuan dengan menyebutkan tanggal, tujuan bantuan, nominal, dan dasar pemberian bantuan.",
          "Informasi kesehatan pribadi penerima bantuan tidak boleh disebarluaskan kepada warga yang tidak berkepentingan."
        ]
      },
      {
        id: "Pasal 11",
        title: "Prioritas Penerima Bantuan",
        type: "secondary",
        iconType: "alert",
        items: [
          "Dalam kondisi bantuan sosial umum dan ketika jumlah permohonan melebihi kemampuan Pos Dana Sosial Kemanusiaan, prioritas dapat diberikan kepada warga yang aktif memenuhi kewajiban kas.",
          { type: 'warning', text: "Warga yang tidak membayar iuran selama 3 bulan atau lebih tanpa alasan yang dapat diterima dapat kehilangan hak prioritas bantuan sosial umum." },
          "Ketentuan kehilangan hak prioritas tidak berlaku untuk pertolongan kemanusiaan yang bersifat darurat dan menyangkut keselamatan jiwa.",
          "Tidak membayar iuran tidak boleh menjadi alasan untuk membiarkan warga dalam keadaan darurat tanpa pertolongan kemanusiaan.",
          "Pengurus wajib mempertimbangkan kemampuan warga dalam membayar iuran sebelum memberikan keputusan yang berkaitan dengan hak prioritas.",
          "Status kehilangan hak prioritas harus diberitahukan secara pribadi kepada warga yang bersangkutan dan tidak diumumkan untuk mempermalukan warga."
        ]
      },
      {
        id: "Pasal 12",
        title: "Pembukuan dan Transparansi Keuangan",
        type: "secondary",
        iconType: "info",
        items: [
          "Bendahara bertanggung jawab mencatat seluruh penerimaan dan pengeluaran dana Paguyuban.",
          "Pembukuan wajib memisahkan sekurang-kurangnya Pos Operasional Kegiatan Warga Beryl dan Pos Dana Sosial Kemanusiaan.",
          "Laporan keuangan sekurang-kurangnya memuat saldo awal, penerimaan iuran, jumlah alokasi 50% untuk masing-masing pos, pengeluaran masing-masing pos, dan saldo akhir masing-masing pos.",
          "Setiap pengeluaran harus memiliki bukti transaksi atau catatan yang dapat dipertanggungjawabkan.",
          "Laporan keuangan disampaikan kepada warga sekurang-kurangnya 1 kali setiap 3 bulan.",
          "Warga berhak meminta penjelasan mengenai transaksi keuangan melalui Pengurus dengan cara yang santun.",
          "Dana Paguyuban tidak boleh dicampur dengan rekening atau uang pribadi Pengurus.",
          "Apabila terdapat kesalahan pencatatan, Bendahara wajib memperbaikinya dan mencatat perubahan tersebut secara transparan."
        ]
      }
    ]
  },
  {
    id: "bab-3",
    title: "BAB III: IPL DAN HUBUNGAN DENGAN PENGEMBANG",
    subtitle: "4 Pasal",
    color: "bg-teal-800",
    icon_name: "Building",
    urutan: 3,
    clauses: [
      {
        id: "Pasal 13",
        title: "Kondisi Lingkungan dan Warga Perintis",
        type: "primary",
        items: [
          "Cluster Beryl merupakan kawasan yang masih berkembang dan pembangunan lingkungan dapat berlangsung secara bertahap.",
          "Selama pembangunan masih berjalan, beberapa fasilitas lingkungan dapat mengalami perubahan, perbaikan, atau penyempurnaan.",
          "Warga diharapkan menjaga komunikasi yang baik dengan Pengembang mengenai fasilitas, keamanan, kebersihan, jalan, drainase, sampah, dan kebutuhan lingkungan lainnya.",
          "Paguyuban dapat membantu menyampaikan aspirasi warga kepada Pengembang secara tertib dan kolektif."
        ]
      },
      {
        id: "Pasal 14",
        title: "IPL Pengembang",
        type: "primary",
        amount: "Rp 75.000",
        amountLabel: "Per Unit / Bulan",
        items: [
          "IPL adalah biaya pemeliharaan lingkungan yang dibayarkan warga kepada Pengembang apabila kewajiban tersebut berlaku berdasarkan perjanjian, ketentuan penjualan, atau ketentuan resmi Pengembang yang mengikat warga.",
          "Besaran IPL yang berlaku saat ini adalah Rp75.000 per unit per bulan berdasarkan informasi yang menjadi dasar kesepakatan warga.",
          "Pembayaran IPL merupakan transaksi antara warga dan Pengembang dan bukan merupakan penerimaan Kas Paguyuban.",
          "Paguyuban tidak menerima, menyimpan, mengelola, atau menggunakan dana IPL.",
          "Perubahan nominal, mekanisme pembayaran, fasilitas, atau kebijakan IPL menjadi kewenangan pihak yang secara sah menetapkan IPL dan tidak dapat ditetapkan sepihak oleh Paguyuban.",
          "Apabila terdapat perbedaan antara informasi dalam AD/ART dengan perjanjian atau ketentuan resmi Pengembang, warga berhak meminta penjelasan kepada Pengembang dan Paguyuban dapat membantu memfasilitasi komunikasi."
        ]
      },
      {
        id: "Pasal 15",
        title: "Kedisiplinan Pembayaran IPL",
        type: "secondary",
        iconType: "alert",
        items: [
          "Warga yang memiliki kewajiban IPL diimbau membayar tepat waktu sesuai ketentuan Pengembang.",
          "Paguyuban tidak berwenang menjatuhkan sanksi atas tunggakan IPL.",
          "Setiap sanksi atas tunggakan IPL hanya dapat diberlakukan oleh pihak yang memiliki kewenangan berdasarkan perjanjian atau ketentuan yang berlaku.",
          "Paguyuban tidak menjamin bahwa pembayaran IPL akan menghasilkan fasilitas tertentu apabila fasilitas tersebut berada di luar kewenangan Paguyuban.",
          "Apabila terjadi persoalan pembayaran atau pelayanan IPL, warga dapat meminta bantuan Paguyuban untuk memfasilitasi komunikasi dengan Pengembang."
        ]
      },
      {
        id: "Pasal 16",
        title: "Hubungan Paguyuban dengan Pengembang",
        type: "secondary",
        iconType: "info",
        items: [
          "Paguyuban bertindak sebagai wadah komunikasi warga dan bukan sebagai kuasa hukum warga kecuali diberikan kuasa secara khusus dan tertulis.",
          "Setiap komunikasi dengan Pengembang harus dilakukan dengan bahasa yang santun, berdasarkan fakta, dan tidak menyebarkan tuduhan yang belum terbukti.",
          "Keluhan warga mengenai fasilitas atau pelayanan lingkungan diupayakan disampaikan secara tertulis agar dapat ditindaklanjuti.",
          "Dalam hal terdapat permasalahan bersama, Pengurus dapat mengumpulkan data, dokumentasi, dan masukan warga untuk disampaikan secara kolektif.",
          "Paguyuban tidak dapat menghapus, mengubah, atau menggantikan kewajiban yang secara sah terdapat dalam perjanjian antara pemilik atau penghuni dengan Pengembang."
        ]
      }
    ]
  },
  {
    id: "bab-4",
    title: "BAB IV: ADMINISTRASI, PENGHUNI, KEAMANAN, DAN AKSES",
    subtitle: "5 Pasal",
    color: "bg-slate-800",
    icon_name: "Shield",
    urutan: 4,
    clauses: [
      {
        id: "Pasal 17",
        title: "Administrasi Warga",
        type: "primary",
        items: [
          "Setiap warga yang mulai menempati rumah di Cluster Beryl wajib melapor kepada Pengurus untuk keperluan pendataan lingkungan.",
          "Pendataan dilakukan hanya untuk kepentingan administrasi, keamanan, komunikasi, kegiatan sosial, dan kebutuhan lingkungan yang sah.",
          "Warga wajib memberikan informasi yang benar mengenai nama penghuni, nomor rumah, nomor telepon yang dapat dihubungi, dan status tinggal apabila data tersebut diperlukan.",
          "Perubahan jumlah penghuni, perpindahan, atau perubahan status tinggal agar diberitahukan kepada Pengurus agar data lingkungan tetap diperbarui."
        ]
      },
      {
        id: "Pasal 18",
        title: "Penghuni Baru dan Penyewa",
        type: "secondary",
        iconType: "alert",
        items: [
          "Pemilik atau penghuni yang baru menempati rumah wajib memberitahukan kepada Pengurus paling lambat 24 jam sejak mulai menempati rumah.",
          "Pemilik rumah yang menyewakan rumah bertanggung jawab memberitahukan kepada Pengurus bahwa rumah tersebut disewakan.",
          "Untuk kepentingan administrasi yang sah, Pengurus dapat meminta dokumen identitas penghuni yang diperlukan.",
          "Apabila salinan KTP atau KK diperlukan, penggunaannya hanya untuk tujuan administrasi yang telah dijelaskan kepada pemilik data.",
          { type: 'warning', text: "Dokumen identitas tidak boleh disebarkan ke grup warga, media sosial, atau pihak lain yang tidak berkepentingan." },
          "Pengurus wajib membatasi akses terhadap data identitas hanya kepada orang yang memang membutuhkan data tersebut untuk menjalankan tugas.",
          "Data yang sudah tidak diperlukan untuk tujuan administrasi harus dihapus atau dimusnahkan dengan cara yang aman sesuai ketentuan yang berlaku."
        ]
      },
      {
        id: "Pasal 19",
        title: "Tamu Menginap",
        type: "secondary",
        iconType: "info",
        items: [
          "Tuan rumah bertanggung jawab atas tamu yang diundangnya selama berada di lingkungan Cluster Beryl.",
          "Tamu yang menginap lebih dari 3 hari berturut-turut wajib diberitahukan kepada Pengurus atau petugas keamanan.",
          "Pemberitahuan minimal memuat nama tamu, rumah yang dikunjungi, dan perkiraan lama menginap.",
          "Salinan KTP tamu hanya dapat diminta apabila benar-benar diperlukan untuk tujuan keamanan atau administrasi yang sah dan harus dikelola dengan prinsip kerahasiaan.",
          "Data tamu tidak boleh dipublikasikan atau disebarkan kepada warga lain tanpa dasar yang sah."
        ]
      },
      {
        id: "Pasal 20",
        title: "Sistem Keamanan Lingkungan",
        type: "primary",
        items: [
          "Keamanan lingkungan dilakukan secara kolaboratif antara Pengembang, petugas keamanan, Pengurus, dan warga sesuai kewenangan masing-masing.",
          "Warga wajib menjaga kewaspadaan dan segera melaporkan kejadian yang mencurigakan kepada petugas keamanan atau Pengurus.",
          "Warga dilarang melakukan tindakan main hakim sendiri terhadap orang yang dicurigai.",
          "Dalam keadaan yang diduga merupakan tindak pidana atau membahayakan keselamatan, warga dianjurkan segera menghubungi aparat yang berwenang.",
          "Informasi mengenai dugaan pelanggaran harus disampaikan berdasarkan kejadian atau fakta yang diketahui dan tidak boleh disertai tuduhan yang belum terbukti."
        ]
      },
      {
        id: "Pasal 21",
        title: "Pengaturan Portal / Gerbang Malam",
        type: "secondary",
        iconType: "info",
        items: [
          "Portal atau gerbang utama dapat ditutup mulai pukul 23.00 WIB sebagai bagian dari pengamanan lingkungan, sepanjang sesuai dengan kebijakan Pengembang atau pengelola kawasan.",
          "Penutupan portal tidak boleh menghilangkan hak warga untuk keluar atau masuk ke rumahnya.",
          "Warga yang masuk atau keluar setelah pukul 23.00 WIB tetap harus mengikuti prosedur keamanan yang berlaku.",
          "Tamu yang datang setelah pukul 23.00 WIB wajib mengikuti pemeriksaan atau pencatatan keamanan sesuai prosedur yang berlaku.",
          "Dalam keadaan darurat, akses untuk ambulans, pemadam kebakaran, polisi, dan kendaraan darurat lainnya harus diprioritaskan."
        ]
      }
    ]
  },
  {
    id: "bab-5",
    title: "BAB V: KETERTIBAN UMUM, LINGKUNGAN, PARKIR, ACARA, RENOVASI, DAN USAHA",
    subtitle: "8 Pasal",
    color: "bg-orange-700",
    icon_name: "Bell",
    urutan: 5,
    clauses: [
      {
        id: "Pasal 22",
        title: "Jam Tenang Lingkungan",
        type: "primary",
        items: [
          "Jam tenang berlaku setiap hari mulai pukul 22.00 WIB sampai dengan pukul 06.00 WIB.",
          "Pada jam tenang, warga wajib menjaga agar suara dari rumah, kendaraan, musik, pekerjaan, atau kegiatan lainnya tidak mengganggu waktu istirahat tetangga.",
          "Penggunaan pengeras suara dengan volume yang terdengar mengganggu rumah tetangga pada jam tenang tidak diperbolehkan.",
          "Kegiatan keluarga atau acara khusus yang diperkirakan menimbulkan suara di atas batas kewajaran setelah pukul 22.00 WIB harus diberitahukan kepada tetangga terdekat sekurang-kurangnya 2 hari sebelumnya.",
          "Pemberitahuan kepada tetangga bukan berarti memberikan hak untuk mengganggu waktu istirahat tanpa batas. Penyelenggara tetap wajib menjaga tingkat kebisingan dan menghentikan kegiatan yang mengganggu setelah diminta secara wajar."
        ]
      },
      {
        id: "Pasal 23",
        title: "Parkir Kendaraan",
        type: "secondary",
        iconType: "alert",
        items: [
          "Kendaraan warga wajib diparkir di dalam carport atau area parkir yang menjadi hak atau tanggung jawab masing-masing.",
          "Kendaraan tidak boleh diparkir dengan cara yang menutup akses rumah tetangga, hydrant, saluran air, pintu gerbang, jalur evakuasi, atau akses kendaraan darurat.",
          "Apabila kendaraan terpaksa diparkir di jalan karena keadaan tertentu, kendaraan harus ditempatkan sedemikian rupa sehingga tetap tersedia ruang yang cukup untuk kendaraan darurat dan tidak menghalangi akses warga.",
          "Parkir kendaraan di jalan umum tidak boleh digunakan sebagai tempat penyimpanan kendaraan secara permanen.",
          "Kendaraan rusak atau tidak dapat digunakan tidak boleh dibiarkan dalam waktu lama di badan jalan.",
          "Jika terjadi perselisihan mengenai lokasi parkir, Pengurus terlebih dahulu memfasilitasi penyelesaian secara kekeluargaan."
        ]
      },
      {
        id: "Pasal 24",
        title: "Kebersihan dan Sampah",
        type: "secondary",
        iconType: "info",
        items: [
          "Setiap warga bertanggung jawab menjaga kebersihan area rumah, halaman, saluran air, dan area di depan rumah yang berada dalam tanggung jawabnya.",
          "Sampah rumah tangga wajib ditempatkan pada tempat sampah yang tertutup atau tempat yang telah ditentukan untuk pengangkutan.",
          "Warga dilarang membuang sampah ke jalan, saluran air, lahan kosong, atau fasilitas umum.",
          "Warga dilarang membakar sampah dengan cara yang menimbulkan asap, bau, atau risiko kebakaran yang mengganggu atau membahayakan lingkungan.",
          "Apabila terdapat kegiatan yang menghasilkan sampah dalam jumlah besar, penyelenggara bertanggung jawab memastikan seluruh sampah dibersihkan setelah kegiatan."
        ]
      },
      {
        id: "Pasal 25",
        title: "Penggunaan Jalan dan Fasilitas Umum untuk Acara",
        type: "secondary",
        iconType: "info",
        items: [
          "Penggunaan jalan atau fasilitas umum untuk kegiatan pribadi, termasuk pemasangan tenda, kursi, panggung, atau perlengkapan acara, wajib memperhatikan keselamatan dan akses warga.",
          "Apabila penggunaan tersebut mengurangi akses jalan, penyelenggara wajib meminta persetujuan Pengurus dan memberitahukan kepada tetangga yang terdampak paling lambat 2 hari sebelum acara.",
          "Jalur kendaraan darurat harus tetap tersedia setiap saat.",
          "Perlengkapan acara tidak boleh dipasang pada hydrant, saluran air, tiang utilitas, atau lokasi yang dapat membahayakan keselamatan.",
          "Penyelenggara bertanggung jawab terhadap keamanan, kebersihan, dan kerusakan yang ditimbulkan oleh kegiatan.",
          "Seluruh perlengkapan acara dan sampah harus dibersihkan paling lambat 24 jam setelah acara selesai."
        ]
      },
      {
        id: "Pasal 26",
        title: "Renovasi Bangunan",
        type: "primary",
        amount: "Rp 2.000.000",
        amountLabel: "Deposit Pengembang",
        items: [
          "Warga yang akan melakukan renovasi yang berdampak pada struktur bangunan, tampilan depan, kanopi, dapur, saluran air, halaman, atau fasilitas lingkungan wajib mengikuti prosedur izin yang ditetapkan Pengembang dan ketentuan lingkungan yang berlaku.",
          "Sebelum renovasi dimulai, pemilik wajib memberitahukan rencana pekerjaan kepada Pengurus agar dapat diketahui apakah pekerjaan tersebut berpotensi mengganggu tetangga atau fasilitas umum.",
          "Deposit renovasi sebesar Rp2.000.000 hanya berlaku apabila jumlah tersebut memang ditetapkan oleh Pengembang atau pihak yang berwenang sebagai uang jaminan renovasi.",
          "Deposit renovasi bukan merupakan uang kas Paguyuban dan tidak disetorkan kepada Bendahara Paguyuban.",
          "Pengembalian deposit menjadi tanggung jawab pihak yang menerima deposit sesuai prosedur dan ketentuan yang berlaku.",
          "Sebelum renovasi dimulai, pemilik wajib memastikan batas tanah, posisi bangunan, saluran air, dan bagian yang berbatasan dengan rumah tetangga telah diketahui dengan jelas.",
          "Renovasi tidak boleh melewati batas tanah yang sah atau merusak bagian milik tetangga.",
          "Material bangunan tidak boleh diletakkan secara permanen di jalan atau fasilitas umum.",
          "Pemilik bertanggung jawab atas kerusakan jalan, saluran, utilitas, atau fasilitas umum yang disebabkan oleh pekerjaan renovasinya.",
          "Setelah renovasi selesai, area sekitar wajib dibersihkan dan dikembalikan ke kondisi yang layak."
        ]
      },
      {
        id: "Pasal 27",
        title: "Jam Kerja Renovasi",
        type: "secondary",
        iconType: "info",
        items: [
          "Pekerjaan renovasi yang menimbulkan suara bising atau getaran hanya boleh dilakukan pada waktu yang wajar.",
          "Sebagai pedoman lingkungan, pekerjaan konstruksi dilakukan antara pukul 08.00 WIB sampai pukul 17.00 WIB.",
          "Pekerjaan di luar waktu tersebut hanya diperbolehkan apabila bersifat darurat atau telah mendapat persetujuan khusus dari Pengurus dan tetangga yang terdampak.",
          "Pekerja renovasi wajib menjaga ketertiban, tidak mengganggu warga, dan tidak menggunakan fasilitas rumah warga lain tanpa izin."
        ]
      },
      {
        id: "Pasal 28",
        title: "Etika Wirausaha Warga",
        type: "secondary",
        iconType: "alert",
        items: [
          "Warga diperbolehkan menjalankan usaha dari rumah sepanjang usaha tersebut sesuai ketentuan hukum, tidak menimbulkan gangguan, dan tidak mengubah fungsi lingkungan secara berlebihan.",
          "Usaha tidak boleh menimbulkan kebisingan, bau, limbah, parkir berlebihan, kerumunan, atau gangguan lain yang merugikan tetangga.",
          "Warga dianjurkan menghormati usaha warga lain yang telah berjalan lebih dahulu.",
          { type: 'warning', text: "Tidak diperbolehkan menggunakan aturan Paguyuban untuk memaksa warga menghentikan usaha yang sah hanya karena terdapat usaha sejenis." },
          "Apabila terdapat beberapa usaha sejenis, warga diharapkan menjaga persaingan secara sehat, santun, dan tidak saling menjatuhkan.",
          "Promosi usaha di grup komunikasi warga harus mengikuti etika dan aturan grup yang disepakati."
        ]
      },
      {
        id: "Pasal 29",
        title: "Larangan Kegiatan yang Mengganggu Lingkungan",
        type: "secondary",
        iconType: "alert",
        items: [
          "Warga dilarang melakukan kegiatan yang menimbulkan bahaya kebakaran, pencemaran, bau menyengat, suara berlebihan, atau gangguan keamanan.",
          "Kegiatan yang menggunakan bahan berbahaya, mudah terbakar, atau menghasilkan limbah khusus wajib mengikuti ketentuan hukum dan tidak boleh dilakukan sembarangan di lingkungan rumah tinggal.",
          "Apabila suatu usaha atau kegiatan menimbulkan keluhan warga, Pengurus memfasilitasi klarifikasi terlebih dahulu sebelum memberikan rekomendasi tindakan."
        ]
      }
    ]
  },
  {
    id: "bab-6",
    title: "BAB VI: PEMELIHARAAN HEWAN",
    subtitle: "4 Pasal",
    color: "bg-purple-800",
    icon_name: "Cat",
    urutan: 6,
    clauses: [
      {
        id: "Pasal 30",
        title: "Ketentuan Umum Hewan Peliharaan",
        type: "primary",
        items: [
          "Pemilik hewan wajib bertanggung jawab atas kesehatan, kebersihan, keamanan, dan perilaku hewan peliharaannya.",
          "Hewan peliharaan tidak boleh dibiarkan berkeliaran sehingga mengganggu atau membahayakan warga.",
          "Pemilik wajib membersihkan kotoran hewan yang ditinggalkan di jalan, halaman, atau fasilitas umum.",
          "Hewan yang diketahui membahayakan orang lain harus dikendalikan dengan cara yang aman."
        ]
      },
      {
        id: "Pasal 31",
        title: "Unggas",
        type: "secondary",
        iconType: "alert",
        items: [
          "Pemeliharaan ayam, bebek, burung, atau unggas lainnya diperbolehkan sepanjang jumlah dan cara pemeliharaannya tidak mengganggu lingkungan.",
          "Kandang harus dijaga kebersihan dan tidak boleh menimbulkan bau, lalat, suara, atau limbah yang mengganggu tetangga.",
          "Peternakan unggas berskala komersial tidak diperbolehkan apabila bertentangan dengan fungsi kawasan perumahan atau menimbulkan gangguan lingkungan.",
          "Pemilik bertanggung jawab mencegah unggas masuk ke rumah atau halaman tetangga."
        ]
      },
      {
        id: "Pasal 32",
        title: "Kucing",
        type: "secondary",
        iconType: "info",
        items: [
          "Pemilik kucing bertanggung jawab menjaga agar hewan tidak mengganggu tetangga.",
          "Pemilik wajib berupaya mencegah kucing membuang kotoran di rumah, teras, kendaraan, atau halaman tetangga.",
          "Jika kucing menimbulkan gangguan berulang, pemilik wajib melakukan tindakan pengendalian yang wajar."
        ]
      },
      {
        id: "Pasal 33",
        title: "Anjing dan Hewan yang Berpotensi Membahayakan",
        type: "secondary",
        iconType: "info",
        items: [
          "Anjing yang dibawa keluar rumah wajib dikendalikan oleh pemilik dan menggunakan tali penuntun apabila diperlukan untuk menjaga keselamatan.",
          "Pemilik wajib memastikan hewan tidak menyerang, mengejar, atau menakut-nakuti warga.",
          "Suara hewan yang terus-menerus mengganggu pada malam hari harus dikendalikan oleh pemilik.",
          "Apabila terjadi insiden gigitan atau serangan, pemilik wajib bertanggung jawab melakukan penanganan yang diperlukan dan membantu korban memperoleh pertolongan."
        ]
      }
    ]
  },
  {
    id: "bab-7",
    title: "BAB VII: KEANGGOTAAN, HAK, DAN KEWAJIBAN",
    subtitle: "5 Pasal",
    color: "bg-blue-800",
    icon_name: "Users",
    urutan: 7,
    clauses: [
      {
        id: "Pasal 34",
        title: "Keanggotaan Paguyuban",
        type: "primary",
        items: [
          "Anggota Paguyuban adalah warga yang berdomisili atau menempati rumah secara sah di Cluster Beryl.",
          "Pemilik rumah yang tidak tinggal di Cluster Beryl tetap dapat terlibat dalam urusan yang berkaitan dengan rumah miliknya.",
          "Penyewa yang tinggal di Cluster Beryl merupakan bagian dari komunitas warga dan wajib menghormati aturan lingkungan.",
          "Satu rumah yang dihuni oleh satu keluarga memiliki 1 hak suara dalam musyawarah, kecuali ketentuan hukum atau hasil musyawarah yang sah menentukan mekanisme lain."
        ]
      },
      {
        id: "Pasal 35",
        title: "Hak Warga",
        type: "secondary",
        iconType: "info",
        items: [
          "Mendapatkan informasi mengenai kegiatan dan keputusan Paguyuban.",
          "Menyampaikan pendapat, usulan, kritik, atau keberatan melalui mekanisme yang santun.",
          "Mengikuti kegiatan sosial dan kemasyarakatan sesuai ketentuan.",
          "Mendapatkan pelayanan administrasi internal Paguyuban secara wajar.",
          "Mendapatkan bantuan sosial sesuai kemampuan Pos Dana Sosial Kemanusiaan dan ketentuan AD/ART.",
          "Meminta penjelasan mengenai penggunaan dana Paguyuban melalui mekanisme pertanggungjawaban."
        ]
      },
      {
        id: "Pasal 36",
        title: "Kewajiban Warga",
        type: "secondary",
        iconType: "alert",
        items: [
          "Menjaga kerukunan, keamanan, kebersihan, dan ketertiban lingkungan.",
          "Mematuhi AD/ART dan keputusan musyawarah yang sah.",
          "Membayar Iuran Kas Warga sesuai ketentuan.",
          "Membayar kewajiban kepada Pengembang apabila memang menjadi kewajiban berdasarkan ketentuan yang berlaku.",
          "Menghormati hak dan privasi tetangga.",
          "Bertanggung jawab atas tindakan anggota keluarga, pekerja, penyewa, atau tamu yang berada dalam tanggung jawabnya sepanjang sesuai dengan hukum yang berlaku."
        ]
      },
      {
        id: "Pasal 37",
        title: "Persyaratan Pengurus Paguyuban",
        type: "primary",
        items: [
          "Pengurus harus merupakan warga yang dikenal baik, dapat dipercaya, mampu bekerja sama, dan bersedia menjalankan tugas secara sukarela.",
          "Calon Ketua dan Bendahara diutamakan merupakan pemilik rumah atau warga yang memiliki hubungan tinggal yang jelas dan dapat mempertanggungjawabkan tugasnya selama masa kepengurusan.",
          "Penyewa dapat menjadi anggota aktif dan dapat diberikan tanggung jawab kepanitiaan atau bidang tertentu sesuai hasil musyawarah.",
          "Persyaratan tersebut merupakan ketentuan internal Paguyuban dan tidak boleh digunakan untuk menghilangkan hak penyewa sebagai warga dalam hal yang memang menjadi haknya menurut hukum.",
          "Pengurus wajib menghindari konflik kepentingan dan tidak boleh menggunakan jabatan untuk memperoleh keuntungan pribadi."
        ]
      },
      {
        id: "Pasal 38",
        title: "Larangan bagi Pengurus",
        type: "secondary",
        iconType: "alert",
        items: [
          "Pengurus dilarang menggunakan uang Paguyuban untuk kepentingan pribadi.",
          "Pengurus dilarang menyalahgunakan data pribadi warga.",
          "Pengurus dilarang menggunakan jabatan untuk mengintimidasi atau memaksa warga.",
          "Pengurus wajib mengungkapkan kepada warga apabila terdapat hubungan pribadi atau kepentingan finansial yang dapat memengaruhi keputusan.",
          "Apabila terdapat konflik kepentingan, Pengurus yang bersangkutan tidak ikut menentukan keputusan mengenai kepentingan tersebut."
        ]
      }
    ]
  },
  {
    id: "bab-8",
    title: "BAB VIII: MUSYAWARAH, PENGURUS, KEPUTUSAN, DAN TRANSISI RT",
    subtitle: "7 Pasal",
    color: "bg-amber-800",
    icon_name: "Award",
    urutan: 8,
    clauses: [
      {
        id: "Pasal 39",
        title: "Jenis Musyawarah",
        type: "primary",
        items: [
          "Musyawarah Warga dilaksanakan sekurang-kurangnya 1 kali dalam 6 bulan.",
          "Musyawarah Khusus dapat dilaksanakan apabila terdapat keadaan penting yang membutuhkan keputusan warga.",
          "Rapat Pengurus dapat dilaksanakan sewaktu-waktu untuk membahas kegiatan operasional Paguyuban.",
          "Musyawarah dapat dilakukan secara langsung atau menggunakan sarana komunikasi digital apabila disepakati dan peserta dapat diverifikasi."
        ]
      },
      {
        id: "Pasal 40",
        title: "Pemberitahuan Musyawarah",
        type: "secondary",
        iconType: "info",
        items: [
          "Undangan Musyawarah Warga disampaikan paling lambat 3 hari sebelum pelaksanaan, kecuali keadaan darurat.",
          "Undangan sekurang-kurangnya mencantumkan waktu, tempat, dan agenda musyawarah.",
          "Untuk perubahan AD/ART, perubahan iuran, penggunaan dana dalam jumlah besar, atau keputusan penting lainnya, agenda harus dijelaskan secara khusus dalam undangan.",
          "Warga diberikan kesempatan menyampaikan usulan sebelum musyawarah apabila usulan tersebut berkaitan dengan agenda yang akan dibahas."
        ]
      },
      {
        id: "Pasal 41",
        title: "Kuorum Musyawarah",
        type: "secondary",
        iconType: "info",
        items: [
          "Musyawarah Warga dinyatakan memenuhi kuorum apabila dihadiri sekurang-kurangnya 50% + 1 dari jumlah Kepala Keluarga yang tercatat sebagai warga menetap.",
          "Jumlah warga yang menjadi dasar penghitungan kuorum harus menggunakan data terakhir yang tersedia dan dapat diverifikasi.",
          "Apabila kuorum tidak tercapai, musyawarah dapat ditunda dan dijadwalkan kembali.",
          "Pada musyawarah kedua, keputusan dapat diambil apabila ketentuan dalam undangan telah diberitahukan kepada warga dan peserta yang hadir menyetujui untuk melanjutkan musyawarah.",
          "Keputusan yang berkaitan dengan perubahan AD/ART, pembubaran Paguyuban, atau penggunaan seluruh aset Paguyuban harus mengikuti ketentuan khusus dalam AD/ART."
        ]
      },
      {
        id: "Pasal 42",
        title: "Cara Pengambilan Keputusan",
        type: "primary",
        items: [
          "Keputusan diutamakan melalui musyawarah untuk mencapai mufakat.",
          "Apabila mufakat tidak tercapai setelah pembahasan yang wajar, keputusan dapat dilakukan melalui pemungutan suara.",
          "Setiap Kepala Keluarga memiliki 1 suara dalam pemungutan suara, kecuali ketentuan hukum atau keputusan khusus yang sah menentukan mekanisme lain.",
          "Keputusan biasa ditetapkan berdasarkan suara terbanyak dari peserta yang memiliki hak suara dan hadir.",
          "Dalam hal jumlah suara sama, pembahasan dapat ditunda untuk mencari mufakat atau dilakukan pemungutan suara ulang.",
          "Setiap keputusan penting harus dicatat dalam notulen dan, apabila diperlukan, dituangkan dalam berita acara."
        ]
      },
      {
        id: "Pasal 43",
        title: "Kepengurusan dan Pembagian Tugas",
        type: "secondary",
        iconType: "info",
        items: [
          "Struktur Pengurus sekurang-kurangnya terdiri atas Ketua, Sekretaris, dan Bendahara.",
          "Bidang atau seksi tambahan dapat dibentuk sesuai kebutuhan warga.",
          "Ketua bertugas mengoordinasikan kegiatan dan mewakili Paguyuban dalam komunikasi dengan pihak luar sesuai mandat warga.",
          "Sekretaris bertugas mengelola administrasi, surat-menyurat, notulen, dan dokumentasi organisasi.",
          "Bendahara bertugas mengelola penerimaan, pengeluaran, pembukuan, dan laporan keuangan.",
          "Pengurus menjalankan tugas berdasarkan keputusan warga dan tidak memiliki kewenangan pribadi di luar mandat organisasi."
        ]
      },
      {
        id: "Pasal 44",
        title: "Pergantian Pengurus Antar Waktu",
        type: "secondary",
        iconType: "alert",
        items: [
          "Pengurus dapat berhenti karena mengundurkan diri, pindah domisili, meninggal dunia, tidak dapat menjalankan tugas secara tetap, atau diberhentikan berdasarkan keputusan musyawarah.",
          "Apabila Ketua atau Bendahara berhalangan tetap, Pengurus dapat menunjuk Pelaksana Tugas untuk menjaga kelangsungan administrasi.",
          "Penunjukan Pelaksana Tugas harus dicatat dalam berita acara dan dilaporkan kepada warga.",
          "Pelaksana Tugas menjalankan kewenangan terbatas sampai pengurus definitif ditetapkan."
        ]
      },
      {
        id: "Pasal 45",
        title: "Transisi Pembentukan RT Definitif",
        type: "primary",
        items: [
          { type: 'warning', text: "Pembentukan RT definitif bukan kewenangan Paguyuban. Paguyuban hanya dapat mengusulkan, memfasilitasi, dan membantu proses sesuai ketentuan Pemerintah Desa." },
          "Pengajuan pembentukan RT dilakukan apabila jumlah penduduk atau Kepala Keluarga dan persyaratan administrasi telah memenuhi ketentuan Pemerintah Desa dan peraturan daerah yang berlaku pada saat pengajuan.",
          "Apabila Pemerintah Desa menetapkan jumlah minimal Kepala Keluarga tertentu sebagai syarat pembentukan RT, angka tersebut menjadi acuan utama dan mengesampingkan angka yang tercantum dalam AD/ART ini.",
          "Warga yang akan mengajukan pembentukan RT wajib melengkapi dokumen kependudukan sesuai persyaratan Pemerintah Desa.",
          "Calon Ketua RT harus memenuhi persyaratan yang ditetapkan oleh Pemerintah Desa dan ketentuan hukum yang berlaku.",
          "Paguyuban membantu mempersiapkan data warga, daftar hadir, usulan warga, dan dokumen pendukung lainnya sepanjang diperbolehkan oleh Pemerintah Desa.",
          "Setelah RT definitif terbentuk, kewenangan dan tata kerja Paguyuban harus disesuaikan dengan struktur pemerintahan lingkungan yang baru."
        ]
      }
    ]
  },
  {
    id: "bab-9",
    title: "BAB IX: SANKSI, PENGADUAN, DAN PENYELESAIAN PERSELISIHAN",
    subtitle: "6 Pasal",
    color: "bg-red-800",
    icon_name: "Gavel",
    urutan: 9,
    clauses: [
      {
        id: "Pasal 46",
        title: "Prinsip Penegakan Aturan",
        type: "primary",
        items: [
          "Penegakan aturan dilakukan secara bertahap, santun, adil, dan berdasarkan fakta.",
          "Tujuan utama penegakan aturan adalah memperbaiki perilaku dan menjaga kerukunan, bukan mempermalukan atau menghukum warga.",
          "Pengurus wajib memberikan kesempatan kepada warga yang diduga melanggar untuk menjelaskan keadaan sebelum tindakan administratif dilakukan.",
          "Pengurus tidak boleh memberikan sanksi berdasarkan rumor atau tuduhan yang belum diverifikasi."
        ]
      },
      {
        id: "Pasal 47",
        title: "Tingkatan Tindakan Administratif",
        type: "secondary",
        iconType: "alert",
        items: [
          "Pelanggaran pertama pada umumnya diselesaikan melalui teguran lisan secara kekeluargaan.",
          "Apabila pelanggaran berulang, Pengurus dapat memberikan teguran tertulis yang menjelaskan bentuk pelanggaran dan tindakan yang diharapkan.",
          "Apabila pelanggaran tetap berulang dan berdampak serius terhadap warga, Pengurus dapat membawa persoalan tersebut ke Musyawarah Warga.",
          "Paguyuban tidak boleh menjatuhkan denda, menyita barang, memutus akses rumah, menghalangi warga keluar-masuk, atau melakukan tindakan fisik sebagai sanksi.",
          "Apabila pelanggaran merupakan dugaan tindak pidana atau membahayakan keselamatan, persoalan dapat dilaporkan kepada pihak berwenang."
        ]
      },
      {
        id: "Pasal 48",
        title: "Ketentuan Tunggakan Iuran Kas",
        type: "secondary",
        iconType: "alert",
        items: [
          "Warga yang menunggak Iuran Kas Warga wajib diberitahukan secara pribadi oleh Bendahara atau Pengurus.",
          "Tunggakan 1 sampai 2 bulan diberikan pengingat secara santun.",
          { type: 'warning', text: "Tunggakan 3 bulan atau lebih dapat menyebabkan hilangnya hak prioritas bantuan sosial umum sebagaimana diatur dalam Pasal 11." },
          "Pengecualian dapat diberikan kepada warga yang mengalami kesulitan ekonomi, keadaan darurat, atau kondisi lain yang dapat diterima setelah disampaikan kepada Pengurus.",
          "Warga tetap dapat membayar tunggakan secara bertahap berdasarkan kesepakatan dengan Bendahara.",
          "Tidak diperbolehkan mengumumkan nominal tunggakan seorang warga kepada grup umum atau media sosial."
        ]
      },
      {
        id: "Pasal 49",
        title: "Mekanisme Pengaduan",
        type: "secondary",
        iconType: "info",
        items: [
          "Warga yang merasa dirugikan oleh tindakan warga lain dapat menyampaikan pengaduan kepada Pengurus.",
          "Pengaduan sebaiknya disampaikan secara tertulis atau melalui saluran komunikasi resmi agar dapat dicatat.",
          "Pengurus wajib menjaga kerahasiaan identitas pihak yang mengadu sepanjang memungkinkan dan sesuai ketentuan hukum.",
          "Pengurus melakukan klarifikasi kepada pihak yang terlibat sebelum mengambil keputusan.",
          "Pengaduan tidak boleh digunakan untuk menyerang pribadi, menyebarkan fitnah, atau mempermalukan warga lain."
        ]
      },
      {
        id: "Pasal 50",
        title: "Penyelesaian Perselisihan",
        type: "primary",
        items: [
          "Perselisihan antarwarga terlebih dahulu diselesaikan secara langsung dengan cara kekeluargaan apabila keadaan memungkinkan.",
          "Apabila tidak selesai, Pengurus dapat menjadi fasilitator pertemuan antara pihak yang berselisih.",
          "Apabila tetap tidak mencapai kesepakatan, persoalan dapat dibawa ke Musyawarah Warga untuk mendapatkan solusi yang disepakati.",
          "Untuk persoalan yang menyangkut hak kepemilikan tanah, tindak pidana, kekerasan, atau perkara hukum lainnya, warga tetap berhak menggunakan mekanisme hukum yang tersedia.",
          "Paguyuban tidak menggantikan kewenangan polisi, pengadilan, Pemerintah Desa, atau lembaga hukum lainnya."
        ]
      },
      {
        id: "Pasal 51",
        title: "Keadaan Darurat",
        type: "secondary",
        iconType: "alert",
        items: [
          "Dalam keadaan darurat seperti kebakaran, kecelakaan, bencana, ancaman keamanan, atau kondisi medis yang mengancam keselamatan, keselamatan manusia menjadi prioritas utama.",
          "Warga wajib membantu sesuai kemampuan dan tidak melakukan tindakan yang membahayakan diri sendiri maupun orang lain.",
          "Akses kendaraan darurat harus diprioritaskan dan tidak boleh terhalang oleh parkir, tenda, material bangunan, atau kegiatan warga.",
          "Setelah keadaan darurat tertangani, Pengurus dapat melakukan evaluasi dan mencatat kejadian untuk perbaikan sistem lingkungan."
        ]
      }
    ]
  },
  {
    id: "bab-10",
    title: "BAB X: DATA PRIBADI DAN KERAHASIAAN",
    subtitle: "4 Pasal",
    color: "bg-slate-900",
    icon_name: "Lock",
    urutan: 10,
    clauses: [
      {
        id: "Pasal 52",
        title: "Prinsip Pengelolaan Data Warga",
        type: "primary",
        items: [
          "Data warga hanya dikumpulkan untuk tujuan yang jelas, sah, dan diperlukan untuk kegiatan Paguyuban.",
          "Pengurus wajib menghindari pengumpulan data yang tidak diperlukan.",
          "Data pribadi warga tidak boleh digunakan untuk kepentingan pribadi Pengurus.",
          "Data kesehatan warga merupakan informasi yang harus dijaga secara khusus dan hanya boleh digunakan sejauh diperlukan untuk proses bantuan sosial."
        ]
      },
      {
        id: "Pasal 53",
        title: "KTP, KK, dan Dokumen Identitas",
        type: "secondary",
        iconType: "alert",
        items: [
          "Apabila KTP, KK, atau dokumen identitas diperlukan, Pengurus harus menjelaskan tujuan penggunaannya.",
          "Pengurus hanya meminta data yang benar-benar diperlukan.",
          { type: 'warning', text: "Dokumen identitas tidak boleh disebarluaskan melalui grup WhatsApp, Telegram, media sosial, atau media publik lainnya." },
          "Salinan dokumen identitas disimpan secara aman dan hanya dapat diakses oleh Pengurus yang ditugaskan.",
          "Dokumen identitas tidak boleh diberikan kepada pihak lain tanpa dasar yang sah atau persetujuan yang diperlukan.",
          "Jika tujuan pengumpulan data telah selesai dan data tidak lagi diperlukan, dokumen harus dihapus atau dimusnahkan dengan aman."
        ]
      },
      {
        id: "Pasal 54",
        title: "Data Kesehatan untuk Bantuan Sosial",
        type: "secondary",
        iconType: "info",
        items: [
          "Informasi mengenai penyakit, diagnosis, hasil pemeriksaan, atau kondisi kesehatan warga hanya dikumpulkan apabila diperlukan untuk menilai bantuan sosial.",
          "Informasi kesehatan tidak boleh diumumkan kepada seluruh warga tanpa alasan yang sah.",
          "Dalam pengumuman penggalangan bantuan, informasi yang disampaikan dibatasi pada informasi yang diperlukan dan telah disetujui oleh warga atau keluarganya.",
          "Pengurus wajib menjaga kerahasiaan informasi kesehatan warga."
        ]
      },
      {
        id: "Pasal 55",
        title: "Tanggung Jawab Pengurus atas Data",
        type: "secondary",
        iconType: "info",
        items: [
          "Pengurus yang memiliki akses terhadap data warga wajib menjaga kerahasiaannya.",
          "Apabila terjadi kehilangan atau penyebaran data, Pengurus wajib segera melakukan tindakan pengamanan dan memberitahukan kepada pihak yang terdampak apabila diperlukan.",
          "Pergantian Pengurus harus disertai serah terima data secara tertib.",
          "Pengurus yang sudah tidak menjabat tidak boleh tetap menyimpan data warga tanpa alasan yang sah."
        ]
      }
    ]
  },
  {
    id: "bab-11",
    title: "BAB XI: KEUANGAN, ASET, KONFLIK KEPENTINGAN, DAN AUDIT",
    subtitle: "5 Pasal",
    color: "bg-emerald-800",
    icon_name: "Landmark",
    urutan: 11,
    clauses: [
      {
        id: "Pasal 56",
        title: "Sumber Dana Paguyuban",
        type: "primary",
        items: [
          "Sumber dana Paguyuban dapat berasal dari Iuran Kas Warga, sumbangan sukarela, bantuan yang sah, hasil kegiatan sosial, atau sumber lain yang tidak bertentangan dengan hukum.",
          "Iuran Kas Warga sebesar Rp10.000 per KK per bulan tetap dibagi 50% untuk Pos Operasional Kegiatan Warga Beryl dan 50% untuk Pos Dana Sosial Kemanusiaan.",
          "Sumbangan sukarela dapat dialokasikan untuk tujuan tertentu apabila pemberi sumbangan menyatakan tujuan tersebut dan tujuan tersebut dapat diterima oleh Paguyuban.",
          "Dana yang berasal dari pihak luar tidak boleh membuat Paguyuban kehilangan independensinya."
        ]
      },
      {
        id: "Pasal 57",
        title: "Pengeluaran Dana",
        type: "secondary",
        iconType: "info",
        items: [
          "Pengeluaran rutin dalam batas anggaran yang telah disepakati dapat dilakukan oleh Bendahara sesuai mandat Pengurus.",
          "Pengeluaran dalam jumlah besar atau di luar anggaran harus mendapatkan persetujuan Ketua dan sekurang-kurangnya satu Pengurus lainnya.",
          "Penggunaan dana untuk kepentingan pribadi Pengurus tidak diperbolehkan.",
          "Setiap pengeluaran wajib memiliki bukti transaksi atau catatan yang menjelaskan tujuan penggunaan.",
          "Pengeluaran harus dibebankan kepada pos dana yang sesuai dengan tujuan penggunaannya."
        ]
      },
      {
        id: "Pasal 58",
        title: "Aset Paguyuban",
        type: "secondary",
        iconType: "info",
        items: [
          "Barang yang dibeli menggunakan dana Paguyuban merupakan aset Paguyuban dan bukan milik pribadi Pengurus.",
          "Aset harus dicatat dan dijaga oleh Pengurus.",
          "Apabila Pengurus berganti, seluruh aset wajib diserahterimakan dan dicatat dalam berita acara.",
          "Aset tidak boleh dijual, dipinjamkan secara permanen, atau dialihkan untuk kepentingan pribadi tanpa keputusan yang sah."
        ]
      },
      {
        id: "Pasal 59",
        title: "Konflik Kepentingan Keuangan",
        type: "secondary",
        iconType: "alert",
        items: [
          "Pengurus wajib menghindari transaksi antara Paguyuban dengan dirinya sendiri apabila transaksi tersebut dapat menimbulkan konflik kepentingan.",
          "Apabila transaksi dengan Pengurus atau keluarganya benar-benar diperlukan, hubungan tersebut harus disampaikan kepada Pengurus lain dan dicatat dalam laporan.",
          "Keputusan mengenai transaksi tersebut harus dilakukan secara transparan dan tidak boleh ditentukan oleh pihak yang menerima manfaat langsung."
        ]
      },
      {
        id: "Pasal 60",
        title: "Pemeriksaan Keuangan",
        type: "primary",
        items: [
          "Laporan keuangan dapat diperiksa oleh warga melalui mekanisme pemeriksaan yang disepakati.",
          "Pemeriksaan dilakukan berdasarkan catatan penerimaan, pengeluaran, bukti transaksi, dan saldo masing-masing pos dana.",
          "Pemeriksaan harus memastikan bahwa pembagian Iuran Kas sebesar 50% untuk Operasional Kegiatan Warga Beryl dan 50% untuk Dana Sosial Kemanusiaan telah dicatat dengan benar.",
          "Apabila ditemukan perbedaan atau transaksi yang belum jelas, Pengurus wajib memberikan penjelasan.",
          "Apabila terdapat dugaan penyalahgunaan dana, persoalan dapat dibawa ke Musyawarah Warga dan, apabila diperlukan, dilanjutkan kepada pihak yang berwenang."
        ]
      }
    ]
  },
  {
    id: "bab-12",
    title: "BAB XII: PERUBAHAN AD/ART, MASA BERLAKU, DAN PENUTUP",
    subtitle: "7 Pasal",
    color: "bg-slate-800",
    icon_name: "FileText",
    urutan: 12,
    clauses: [
      {
        id: "Pasal 61",
        title: "Perubahan AD/ART",
        type: "primary",
        items: [
          "Perubahan AD/ART hanya dapat dilakukan melalui Musyawarah Warga.",
          "Usulan perubahan disampaikan paling lambat 7 hari sebelum musyawarah agar warga memiliki kesempatan membaca dan memberikan masukan.",
          "Perubahan AD/ART sekurang-kurangnya harus disetujui oleh 60% dari peserta yang memiliki hak suara dan hadir dalam musyawarah, sepanjang tidak bertentangan dengan ketentuan hukum atau aturan Pemerintah Desa.",
          "Perubahan yang berkaitan dengan nominal iuran, pembagian dana 50% : 50%, penggunaan dana sosial, hak suara, atau masa transisi RT harus disebutkan secara jelas dalam agenda musyawarah.",
          "Setiap perubahan wajib dicatat dalam berita acara dan versi terbaru AD/ART harus diumumkan kepada warga."
        ]
      },
      {
        id: "Pasal 62",
        title: "Perubahan Nominal Iuran",
        type: "secondary",
        iconType: "alert",
        items: [
          "Nominal Iuran Kas Warga tidak dapat diubah secara sepihak oleh Ketua atau Bendahara.",
          "Perubahan nominal harus dibahas dalam Musyawarah Warga.",
          "Usulan perubahan nominal harus menjelaskan alasan, kebutuhan penggunaan dana, dan dampak terhadap warga.",
          "Keputusan perubahan nominal mulai berlaku pada tanggal yang disebutkan secara jelas dalam berita acara.",
          "Warga harus diberitahukan mengenai nominal baru sebelum kewajiban pembayaran diberlakukan.",
          "Apabila nominal iuran berubah, pembagian antara Pos Operasional dan Pos Dana Sosial tetap mengikuti komposisi 50% : 50% sampai terdapat keputusan musyawarah yang secara khusus mengubah komposisi tersebut."
        ]
      },
      {
        id: "Pasal 63",
        title: "Perubahan Komposisi Dana 50% : 50%",
        type: "secondary",
        iconType: "alert",
        items: [
          "Komposisi Iuran Kas sebesar 50% untuk Operasional Kegiatan Warga Beryl dan 50% untuk Dana Sosial Kemanusiaan merupakan ketentuan dasar penggunaan Iuran Kas.",
          "Ketua, Bendahara, atau Pengurus tidak berwenang mengubah komposisi tersebut secara sepihak.",
          "Perubahan komposisi hanya dapat dilakukan melalui Musyawarah Warga.",
          "Usulan perubahan wajib menjelaskan alasan, kondisi saldo masing-masing pos, kebutuhan warga, dan dampak perubahan.",
          "Keputusan perubahan harus dicatat dalam berita acara dan diumumkan kepada seluruh warga.",
          "Perubahan tidak berlaku surut terhadap transaksi yang telah dibukukan sebelum tanggal berlakunya keputusan."
        ]
      },
      {
        id: "Pasal 64",
        title: "Keadaan yang Belum Diatur",
        type: "secondary",
        iconType: "info",
        items: [
          "Hal yang belum diatur dalam AD/ART diselesaikan terlebih dahulu melalui musyawarah dan asas kekeluargaan.",
          "Dalam mengambil keputusan, Pengurus wajib mempertimbangkan hukum yang berlaku, ketentuan Pemerintah Desa, kepentingan umum, keadilan, dan kemampuan warga.",
          "Keputusan sementara yang dibuat untuk keadaan mendesak wajib dilaporkan kepada warga pada kesempatan musyawarah berikutnya."
        ]
      },
      {
        id: "Pasal 65",
        title: "Masa Berlaku",
        type: "primary",
        items: [
          "AD/ART ini berlaku sejak disahkan melalui Musyawarah Warga.",
          "AD/ART tetap berlaku selama Paguyuban masih menjalankan fungsi yang disepakati warga.",
          "Apabila terdapat peraturan pemerintah atau ketentuan resmi yang lebih tinggi dan bertentangan dengan ketentuan AD/ART ini, ketentuan pemerintah yang berlaku menjadi acuan.",
          "Bagian AD/ART yang tidak bertentangan tetap berlaku dan bagian yang bertentangan wajib disesuaikan melalui musyawarah."
        ]
      },
      {
        id: "Pasal 66",
        title: "Masa Transisi Setelah RT Definitif Terbentuk",
        type: "secondary",
        iconType: "info",
        items: [
          "Setelah RT definitif terbentuk dan ditetapkan sesuai prosedur Pemerintah Desa, Pengurus wajib melakukan inventarisasi seluruh kegiatan, dokumen, aset, dan saldo dana Paguyuban.",
          "Status kelanjutan Paguyuban dibahas dalam Musyawarah Warga.",
          "Apabila Paguyuban dihentikan, saldo dana dan aset tidak boleh dibagikan kepada Pengurus secara pribadi.",
          "Penyerahan aset atau dana kepada RT, kegiatan sosial warga, atau bentuk lain harus ditetapkan melalui musyawarah dan dibuatkan berita acara.",
          "Data pribadi warga harus tetap dikelola sesuai tujuan dan ketentuan perlindungan data meskipun terjadi pergantian lembaga atau kepengurusan.",
          "Apabila terdapat dua pos dana yang masih memiliki saldo, masing-masing saldo harus dicatat secara terpisah dalam berita acara sebelum ditentukan penggunaannya.",
          "Saldo Dana Sosial Kemanusiaan harus tetap diprioritaskan untuk tujuan sosial dan kemanusiaan atau tujuan lain yang secara sah diputuskan melalui Musyawarah Warga."
        ]
      },
      {
        id: "Pasal 67",
        title: "Penutup",
        type: "primary",
        items: [
          "AD/ART ini disusun sebagai pedoman bersama untuk menciptakan lingkungan Cluster Beryl yang aman, tertib, bersih, rukun, saling menghormati, dan saling membantu.",
          "Setiap aturan dilaksanakan dengan mengutamakan musyawarah, kepentingan bersama, keadilan, dan hubungan baik antarwarga.",
          "Perbedaan pendapat merupakan hal yang wajar dan diselesaikan dengan komunikasi yang baik tanpa saling merendahkan.",
          "Dengan disahkannya AD/ART ini, seluruh warga diharapkan memahami hak, kewajiban, batas kewenangan Pengurus, serta mekanisme penyelesaian persoalan lingkungan.",
          "Dokumen ini berlaku sejak tanggal disahkan dalam Musyawarah Warga."
        ]
      }
    ]
  },
  {
    id: "lampiran",
    title: "LAMPIRAN: PEDOMAN OPERASIONAL SINGKAT",
    subtitle: "6 Pedoman",
    color: "bg-teal-900",
    icon_name: "Award",
    urutan: 13,
    clauses: [
      {
        id: "Pedoman 1",
        title: "Alur Pembayaran Iuran Kas",
        type: "primary",
        items: [
          "1. Setiap KK membayar Rp10.000 setiap bulan paling lambat tanggal 15.",
          "2. Bendahara mencatat pembayaran berdasarkan rumah atau Kepala Keluarga.",
          "3. Rp5.000 dari setiap pembayaran dicatat sebagai Pos Operasional Kegiatan Warga Beryl.",
          "4. Rp5.000 dari setiap pembayaran dicatat sebagai Pos Dana Sosial Kemanusiaan.",
          "5. Kedua saldo dicatat secara terpisah.",
          "6. Pengeluaran hanya dilakukan sesuai peruntukan masing-masing pos.",
          "7. Saldo dan penggunaan dana dilaporkan kepada warga secara berkala."
        ]
      },
      {
        id: "Pedoman 2",
        title: "Alur Pengaduan Warga",
        type: "secondary",
        iconType: "info",
        items: [
          "1. Warga menyampaikan pengaduan kepada Pengurus.",
          "2. Pengurus mencatat pokok permasalahan.",
          "3. Pengurus melakukan klarifikasi kepada pihak terkait.",
          "4. Jika diperlukan, Pengurus mempertemukan para pihak.",
          "5. Jika tidak selesai, persoalan dibawa ke Musyawarah Warga atau pihak berwenang sesuai jenis persoalannya."
        ]
      },
      {
        id: "Pedoman 3",
        title: "Alur Bantuan Dana Sosial",
        type: "primary",
        items: [
          "1. Laporan diterima oleh Pengurus.",
          "2. Kondisi warga diverifikasi.",
          "3. Pengurus menentukan tingkat kedaruratan.",
          "4. Saldo Pos Dana Sosial Kemanusiaan diperiksa.",
          "5. Bantuan diberikan sesuai kemampuan dan kebutuhan.",
          "6. Transaksi dicatat dalam pembukuan.",
          "7. Informasi pribadi penerima dijaga kerahasiaannya."
        ]
      },
      {
        id: "Pedoman 4",
        title: "Alur Renovasi",
        type: "secondary",
        iconType: "info",
        items: [
          "1. Pemilik memastikan aturan renovasi Pengembang.",
          "2. Pemilik memastikan batas tanah dan area pekerjaan.",
          "3. Pemilik menyampaikan pemberitahuan kepada Pengurus.",
          "4. Jika diperlukan, pemilik menyampaikan rencana kepada tetangga yang terdampak.",
          "5. Deposit dibayarkan langsung kepada pihak yang berwenang menerima deposit.",
          "6. Renovasi dilakukan sesuai izin dan jam kerja.",
          "7. Material tidak menghalangi akses darurat.",
          "8. Setelah selesai, area dibersihkan dan kerusakan diperbaiki."
        ]
      },
      {
        id: "Pedoman 5",
        title: "Alur Pergantian Pengurus",
        type: "secondary",
        iconType: "info",
        items: [
          "1. Pengurus lama menyampaikan kondisi administrasi.",
          "2. Seluruh uang dan aset dihitung.",
          "3. Saldo Pos Operasional dan Pos Dana Sosial dihitung secara terpisah.",
          "4. Dokumen dan data diserahterimakan.",
          "5. Dibuat berita acara serah terima.",
          "6. Pengurus baru mulai menjalankan tugas setelah serah terima."
        ]
      },
      {
        id: "Pedoman 6",
        title: "Prinsip Utama Warga Beryl",
        type: "primary",
        items: [
          "Jaga rumah sendiri.",
          "Jaga kebersihan lingkungan.",
          "Hormati waktu istirahat tetangga.",
          "Jangan menghalangi akses darurat.",
          "Jangan mengambil hak atau merugikan tetangga.",
          "Jaga kerahasiaan data warga.",
          "Selesaikan masalah dengan komunikasi terlebih dahulu.",
          "Utamakan musyawarah dan kepentingan bersama.",
          "Iuran Kas Warga sebesar Rp10.000 dibagi 50% untuk kegiatan umum warga dan 50% untuk Dana Sosial Kemanusiaan.",
          "Dana kegiatan umum digunakan untuk kepentingan bersama dan bukan kepentingan pribadi.",
          "Dana Sosial digunakan untuk membantu warga sesuai kebutuhan, kemampuan dana, dan ketentuan AD/ART.",
          "Jika persoalan berada di luar kewenangan Paguyuban, serahkan kepada pihak yang berwenang."
        ]
      }
    ]
  }
];

export const AdArtPage: React.FC<{ currentUser?: Pengguna }> = ({ currentUser }) => {
  const [chapters, setChapters] = useState<Chapter[]>(INITIAL_ADART_DATA);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [openSections, setOpenSections] = useState<string[]>(['bab-1', 'bab-2']);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  // Modals CRUD State
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedChapterId, setSelectedChapterId] = useState<string>('bab-1');
  const [editingClauseIndex, setEditingClauseIndex] = useState<number>(-1);

  // Form State Edit Pasal
  const [clauseForm, setClauseForm] = useState<Clause>({
    id: 'Pasal Baru',
    title: '',
    type: 'primary',
    amount: '',
    amountLabel: '',
    items: ['']
  });

  const canEdit = !currentUser || currentUser.peran === 'Super_Admin';

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3000);
  };

  // =========================================================================
  // LOAD DATA AD/ART (SUPABASE CLOUD + LOCALSTORAGE FALLBACK)
  // =========================================================================
  const loadAdArtData = async () => {
    setLoading(true);
    let loaded: Chapter[] = [];

    // Ambil dari cache lokal
    const local = localStorage.getItem('local_adart_data');
    if (local) {
      try {
        loaded = JSON.parse(local);
      } catch (e) {}
    }

    // Ambil dari Supabase jika terhubung
    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabase
          .from('adart_chapters')
          .select('*')
          .order('urutan', { ascending: true });

        if (!error && data && data.length > 0) {
          loaded = data.map((d: any) => ({
            id: d.id,
            title: d.title,
            subtitle: d.subtitle,
            color: d.color,
            icon_name: d.icon_name || 'Book',
            clauses: d.clauses || [],
            urutan: d.urutan || 1
          }));
          localStorage.setItem('local_adart_data', JSON.stringify(loaded));
        }
      } catch (err: any) {
        console.warn('Fallback AD/ART lokal:', err.message);
      }
    }

    if (loaded.length === 0) {
      loaded = INITIAL_ADART_DATA;
      localStorage.setItem('local_adart_data', JSON.stringify(INITIAL_ADART_DATA));
    }

    setChapters(loaded);
    setLoading(false);
  };

  useEffect(() => {
    loadAdArtData();
  }, []);

  // Simpan Dokumen AD/ART ke Cloud & Local
  const saveAllChapters = async (updatedChapters: Chapter[]) => {
    setChapters(updatedChapters);
    localStorage.setItem('local_adart_data', JSON.stringify(updatedChapters));

    if (isSupabaseConfigured) {
      try {
        const payload = updatedChapters.map((c, idx) => ({
          id: c.id,
          title: c.title,
          subtitle: c.subtitle,
          color: c.color,
          icon_name: c.icon_name,
          clauses: c.clauses,
          urutan: c.urutan || idx + 1,
          updated_at: new Date().toISOString()
        }));

        await supabase.from('adart_chapters').upsert(payload);
      } catch (e) {
        console.warn('Sync cloud AD/ART ditunda:', e);
      }
    }

    showToast('✓ Perubahan dokumen AD/ART berhasil disimpan!');
  };

  // =========================================================================
  // CRUD 1: EDIT PASAL YANG SUDAH ADA
  // =========================================================================
  const handleOpenEditClause = (chapterId: string, clauseIdx: number) => {
    const chap = chapters.find(c => c.id === chapterId);
    if (!chap || !chap.clauses[clauseIdx]) return;

    const cl = chap.clauses[clauseIdx];
    setSelectedChapterId(chapterId);
    setEditingClauseIndex(clauseIdx);
    setClauseForm({
      id: cl.id,
      title: cl.title,
      type: cl.type,
      amount: cl.amount || '',
      amountLabel: cl.amountLabel || '',
      items: cl.items.map(item => typeof item === 'string' ? item : item.text)
    });
    setShowEditModal(true);
  };

  // =========================================================================
  // CRUD 2: TAMBAH PASAL BARU DI BAB TERTENTU
  // =========================================================================
  const handleOpenAddClause = (chapterId: string) => {
    const chap = chapters.find(c => c.id === chapterId);
    const nextPasalNum = (chap?.clauses.length || 0) + 1;
    setSelectedChapterId(chapterId);
    setEditingClauseIndex(-1); // -1 menandakan tambah baru
    setClauseForm({
      id: `Pasal ${nextPasalNum}`,
      title: 'Judul Pasal Baru',
      type: 'primary',
      amount: '',
      amountLabel: '',
      items: ['Tuliskan butir-butir aturan pasal di sini...']
    });
    setShowEditModal(true);
  };

  // Simpan Perubahan Form Modal
  const handleSaveClauseForm = (e: React.FormEvent) => {
    e.preventDefault();
    const updated = chapters.map(chap => {
      if (chap.id !== selectedChapterId) return chap;

      const newClauses = [...chap.clauses];
      const clausePayload: Clause = {
        id: clauseForm.id.trim(),
        title: clauseForm.title.trim(),
        type: clauseForm.type,
        amount: clauseForm.amount?.trim() || undefined,
        amountLabel: clauseForm.amountLabel?.trim() || undefined,
        items: clauseForm.items.filter(item => String(item).trim() !== '')
      };

      if (editingClauseIndex >= 0) {
        newClauses[editingClauseIndex] = clausePayload;
      } else {
        newClauses.push(clausePayload);
      }

      return {
        ...chap,
        subtitle: `${newClauses.length} Pasal`,
        clauses: newClauses
      };
    });

    saveAllChapters(updated);
    setShowEditModal(false);
  };

  // =========================================================================
  // CRUD 3: HAPUS PASAL
  // =========================================================================
  const handleDeleteClause = (chapterId: string, clauseIdx: number) => {
    const chap = chapters.find(c => c.id === chapterId);
    if (!chap || !chap.clauses[clauseIdx]) return;
    const clauseName = chap.clauses[clauseIdx].id;

    if (!confirm(`Hapus ${clauseName} ("${chap.clauses[clauseIdx].title}") dari dokumen AD/ART?`)) return;

    const updated = chapters.map(c => {
      if (c.id !== chapterId) return c;
      const filteredClauses = c.clauses.filter((_, idx) => idx !== clauseIdx);
      return {
        ...c,
        subtitle: `${filteredClauses.length} Pasal`,
        clauses: filteredClauses
      };
    });

    saveAllChapters(updated);
  };

  // =========================================================================
  // RESET KE DOKUMEN MASTER 2026
  // =========================================================================
  const handleResetToMaster = () => {
    if (!confirm('Pulihkan dokumen ke versi resmi AD/ART Edisi Penyempurnaan 2026 (12 BAB + 6 Pedoman)?')) return;
    saveAllChapters(INITIAL_ADART_DATA);
  };

  const toggleSection = (id: string) => {
    if (openSections.includes(id)) {
      setOpenSections(openSections.filter(s => s !== id));
    } else {
      setOpenSections([...openSections, id]);
    }
  };

  const handleExpandAll = () => {
    setOpenSections(chapters.map(d => d.id));
  };

  const handleCollapseAll = () => {
    setOpenSections([]);
  };

  // Filter Pencarian Pasal
  const filteredData = useMemo(() => {
    if (!search.trim()) return chapters;
    const q = search.toLowerCase();
    return chapters.filter(chap => {
      const matchChapter = chap.title.toLowerCase().includes(q) || chap.subtitle.toLowerCase().includes(q);
      const matchClauses = chap.clauses.some(c => 
        c.id.toLowerCase().includes(q) || 
        c.title.toLowerCase().includes(q) ||
        (c.amount && c.amount.toLowerCase().includes(q)) ||
        c.items.some(item => typeof item === 'string' ? item.toLowerCase().includes(q) : item.text.toLowerCase().includes(q))
      );
      return matchChapter || matchClauses;
    });
  }, [chapters, search]);

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-16">
      {/* Toast Alert */}
      {toastMsg && (
        <div className="fixed top-20 right-4 z-50 px-4 py-2.5 bg-emerald-600 text-white rounded-2xl shadow-xl text-xs font-bold flex items-center space-x-2 animate-in slide-in-from-top-3">
          <CheckCircle2 className="w-4 h-4" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* Header Halaman Resmi */}
      <div className="bg-gradient-to-r from-emerald-950 via-emerald-900 to-teal-950 rounded-3xl p-6 md:p-8 text-white shadow-xl">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <div className="inline-flex items-center space-x-2 px-3 py-1 bg-white/20 backdrop-blur-md rounded-full text-xs font-bold uppercase tracking-wider text-emerald-100 mb-2">
              <FileText className="w-3.5 h-3.5 text-emerald-300" />
              <span>Dokumen Pedoman Internal Paguyuban</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-black tracking-tight">
              AD / ART Warga Beryl
            </h1>
            <p className="text-xs md:text-sm text-emerald-100 mt-1 max-w-2xl leading-relaxed">
              Anggaran Dasar dan Anggaran Rumah Tangga pedoman bersama mengenai organisasi, iuran kas, pembagian dana 50% operasional dan 50% dana sosial kemanusiaan, keamanan, ketertiban, renovasi, usaha warga, musyawarah, dan transisi menuju RT definitif.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <button
              onClick={() => window.print()}
              className="flex items-center space-x-1.5 px-3.5 py-2.5 bg-white text-slate-900 hover:bg-slate-100 rounded-xl text-xs font-black shadow-md transition-all"
              title="Cetak atau simpan dokumen sebagai PDF"
            >
              <Printer className="w-4 h-4 text-emerald-700" />
              <span>Cetak / PDF</span>
            </button>
            {canEdit && (
              <button
                onClick={handleResetToMaster}
                className="flex items-center space-x-1.5 px-3.5 py-2.5 bg-emerald-800/80 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all border border-emerald-600"
                title="Pulihkan Dokumen Asli 2026"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset Asli 2026</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Bar Pencarian & Tombol Buka/Tutup */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Cari pasal (misal: iuran, 50%, sosial, IPL, sakit, renovasi, parkir, warung)..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs outline-none focus:border-emerald-500 shadow-2xs font-medium"
          />
        </div>
        <div className="flex items-center space-x-2 shrink-0 w-full sm:w-auto justify-end">
          <button
            onClick={handleExpandAll}
            className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors shadow-2xs"
          >
            Buka Semua
          </button>
          <button
            onClick={handleCollapseAll}
            className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors shadow-2xs"
          >
            Tutup Semua
          </button>
        </div>
      </div>

      {/* Daftar Bab AD/ART (Accordion Dinamis Penuh) */}
      <div className="space-y-4">
        {filteredData.map((section) => {
          const isOpen = openSections.includes(section.id);
          const IconComponent = ICON_MAP[section.icon_name] || Book;

          return (
            <div key={section.id} className="bg-white rounded-2xl shadow-xs border border-slate-200 overflow-hidden">
              <div className={`flex items-center justify-between p-4 md:p-5 transition-colors ${section.color} text-white`}>
                <button 
                  onClick={() => toggleSection(section.id)}
                  className="flex items-center space-x-3.5 text-left flex-1 min-w-0"
                >
                  <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center backdrop-blur-xs shrink-0">
                    <IconComponent className="w-5 h-5 text-white" />
                  </div>
                  <div className="truncate">
                    <h2 className="text-sm md:text-base font-black tracking-tight leading-snug truncate">{section.title}</h2>
                    <p className="text-[11px] text-white/80 font-medium">{section.subtitle}</p>
                  </div>
                </button>

                <div className="flex items-center space-x-2 shrink-0 pl-2">
                  {canEdit && (
                    <button
                      onClick={() => handleOpenAddClause(section.id)}
                      className="p-1.5 bg-white/20 hover:bg-white/30 rounded-lg text-white text-xs font-bold flex items-center space-x-1"
                      title="Tambah Pasal di Bab Ini"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline text-[10px]">Tambah Pasal</span>
                    </button>
                  )}
                  <button onClick={() => toggleSection(section.id)} className="p-1">
                    {isOpen ? <ChevronUp className="w-5 h-5 text-white/90" /> : <ChevronDown className="w-5 h-5 text-white/90" />}
                  </button>
                </div>
              </div>

              {isOpen && (
                <div className="p-4 md:p-6 space-y-4 bg-slate-50/60">
                  {section.clauses.map((clause, cIdx) => (
                    <div 
                      key={cIdx} 
                      className={`rounded-2xl border p-4 md:p-5 transition-all relative ${
                        clause.type === 'primary' 
                          ? 'bg-emerald-50/50 border-emerald-200 shadow-2xs' 
                          : 'bg-white border-slate-200 shadow-2xs'
                      }`}
                    >
                      <div className="flex justify-between items-start mb-3 gap-3">
                        <div className="flex items-center space-x-3">
                          {clause.type === 'primary' ? (
                            <div className="w-8 h-8 rounded-full bg-emerald-600 flex items-center justify-center shrink-0 shadow-xs">
                              <CheckCircle2 className="w-4 h-4 text-white" />
                            </div>
                          ) : (
                            <div className="w-8 h-8 rounded-xl bg-slate-100 flex items-center justify-center shrink-0 border border-slate-200">
                              {clause.iconType === 'alert' ? 
                                <AlertTriangle className="w-4 h-4 text-amber-500" /> : 
                                <Info className="w-4 h-4 text-slate-500" />
                              }
                            </div>
                          )}
                          <div>
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{clause.id}</span>
                            <h3 className="font-black text-xs md:text-sm text-slate-900 leading-tight">{clause.title}</h3>
                          </div>
                        </div>

                        <div className="flex items-center space-x-2 shrink-0">
                          {clause.amount && (
                            <div className="text-right bg-white/90 px-3 py-1.5 rounded-xl border border-slate-200 shadow-2xs">
                              <span className="text-[9px] text-slate-400 uppercase font-bold tracking-wider block">{clause.amountLabel}</span>
                              <p className="text-xs md:text-sm font-black text-emerald-700 tracking-tight">{clause.amount}</p>
                            </div>
                          )}

                          {canEdit && (
                            <div className="flex items-center space-x-1">
                              <button
                                onClick={() => handleOpenEditClause(section.id, cIdx)}
                                className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg"
                                title="Edit Pasal Ini"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleDeleteClause(section.id, cIdx)}
                                className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg"
                                title="Hapus Pasal Ini"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Butir-Butir Pasal */}
                      <div className="space-y-2 pl-11">
                        {clause.items.map((item, i) => {
                          if (typeof item === 'object') {
                            if (item.type === 'warning') {
                              return (
                                <div key={i} className="flex items-start space-x-2 text-xs text-amber-900 bg-amber-50 p-3 rounded-xl border border-amber-200 leading-relaxed font-medium">
                                  <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0 text-amber-600" />
                                  <span>{item.text}</span>
                                </div>
                              );
                            }
                            if (item.type === 'info') {
                              return (
                                <div key={i} className="flex items-start space-x-2 text-xs text-teal-900 bg-teal-50 p-3 rounded-xl border border-teal-200 leading-relaxed font-medium">
                                  <Info className="w-4 h-4 mt-0.5 shrink-0 text-teal-600" />
                                  <span>{item.text}</span>
                                </div>
                              );
                            }
                          }
                          return (
                            <div key={i} className="flex items-start space-x-2.5">
                              <span className={`w-1.5 h-1.5 rounded-full mt-1.5 shrink-0 ${clause.type === 'primary' ? 'bg-emerald-500' : 'bg-slate-400'}`} />
                              <p className="text-xs text-slate-700 leading-relaxed font-normal">
                                {typeof item === 'string' ? item : item.text}
                              </p>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* MODAL CRUD: EDIT / TAMBAH PASAL */}
      {showEditModal && canEdit && (
        <div className="fixed inset-0 bg-slate-900/60 flex items-center justify-center p-4 z-50 backdrop-blur-xs">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-xl max-h-[90vh] overflow-y-auto p-6 space-y-4">
            <div className="flex justify-between items-center border-b pb-3">
              <div className="flex items-center space-x-2">
                <Edit2 className="w-4 h-4 text-emerald-600" />
                <h3 className="font-bold text-slate-900 text-sm">
                  {editingClauseIndex >= 0 ? 'Edit Aturan Pasal' : 'Tambah Pasal Baru'}
                </h3>
              </div>
              <button onClick={() => setShowEditModal(false)}><X className="w-4 h-4 text-slate-400" /></button>
            </div>

            <form onSubmit={handleSaveClauseForm} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-600 mb-1">Nomor / Label Pasal *</label>
                  <input
                    required
                    type="text"
                    value={clauseForm.id}
                    onChange={(e) => setClauseForm({ ...clauseForm, id: e.target.value })}
                    placeholder="Contoh: Pasal 6"
                    className="w-full px-3 py-2 border rounded-xl font-bold"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-600 mb-1">Tipe Tampilan</label>
                  <select
                    value={clauseForm.type}
                    onChange={(e) => setClauseForm({ ...clauseForm, type: e.target.value as any })}
                    className="w-full px-3 py-2 border rounded-xl bg-white font-bold"
                  >
                    <option value="primary">Utama (Warna Hijau Emerald)</option>
                    <option value="secondary">Standar (Warna Putih/Abu)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-600 mb-1">Judul Pasal *</label>
                <input
                  required
                  type="text"
                  value={clauseForm.title}
                  onChange={(e) => setClauseForm({ ...clauseForm, title: e.target.value })}
                  placeholder="Contoh: Pembagian Iuran Kas 50% : 50%"
                  className="w-full px-3 py-2 border rounded-xl font-bold text-slate-900"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-600 mb-1">Nominal Sorotan (Opsional)</label>
                  <input
                    type="text"
                    value={clauseForm.amount || ''}
                    onChange={(e) => setClauseForm({ ...clauseForm, amount: e.target.value })}
                    placeholder="Misal: Rp 10.000 atau 50% : 50%"
                    className="w-full px-3 py-2 border rounded-xl"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-600 mb-1">Label Nominal</label>
                  <input
                    type="text"
                    value={clauseForm.amountLabel || ''}
                    onChange={(e) => setClauseForm({ ...clauseForm, amountLabel: e.target.value })}
                    placeholder="Misal: Per KK / Bulan"
                    className="w-full px-3 py-2 border rounded-xl"
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <label className="font-bold text-slate-600">Butir-Butir Aturan / Paragraf Pasal:</label>
                  <button
                    type="button"
                    onClick={() => setClauseForm({ ...clauseForm, items: [...clauseForm.items, ''] })}
                    className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded font-bold text-[10px]"
                  >
                    + Tambah Poin
                  </button>
                </div>

                <div className="space-y-2 max-h-48 overflow-y-auto p-1">
                  {clauseForm.items.map((itemStr, idx) => (
                    <div key={idx} className="flex items-start space-x-2">
                      <span className="text-slate-400 font-mono mt-2 text-[10px]">{idx + 1}.</span>
                      <textarea
                        rows={2}
                        value={typeof itemStr === 'string' ? itemStr : itemStr.text}
                        onChange={(e) => {
                          const updated = [...clauseForm.items];
                          updated[idx] = e.target.value;
                          setClauseForm({ ...clauseForm, items: updated });
                        }}
                        className="w-full p-2 border rounded-xl text-xs"
                      />
                      {clauseForm.items.length > 1 && (
                        <button
                          type="button"
                          onClick={() => setClauseForm({ ...clauseForm, items: clauseForm.items.filter((_, i) => i !== idx) })}
                          className="text-rose-500 hover:text-rose-700 p-1 mt-1"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-end space-x-2 pt-3 border-t">
                <button type="button" onClick={() => setShowEditModal(false)} className="px-4 py-2 border rounded-xl font-bold">Batal</button>
                <button type="submit" className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold shadow-md">Simpan Perubahan</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Footer Dokumen */}
      <div className="text-center pt-8 border-t border-slate-200 space-y-1">
        <p className="text-xs font-bold text-slate-700">
          Dokumen Pedoman Internal Paguyuban Warga Beryl • Edisi Penyempurnaan 2026
        </p>
        <p className="text-[11px] text-slate-400">
          Cluster Beryl Permata Mutiara Maja, Desa Curug Badak, Kecamatan Maja, Kabupaten Lebak, Banten
        </p>
      </div>
    </div>
  );
};

export const AdArt = AdArtPage;
export default AdArtPage;