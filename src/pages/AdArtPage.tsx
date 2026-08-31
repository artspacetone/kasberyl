// src/pages/AdArtPage.tsx
import React, { useState, useMemo } from 'react';
import { 
  Book, Heart, Building, Shield, Bell, Cat, 
  Users, Award, Gavel, ChevronDown, ChevronUp, 
  CheckCircle2, AlertTriangle, Info, Printer, 
  Search, FileText
} from 'lucide-react';

interface ClauseItemObject {
  type: 'warning' | 'info';
  text: string;
}

type ClauseItem技巧 = string | ClauseItemObject;

interface Clause {
  id: string;
  title: string;
  type: 'primary' | 'secondary';
  iconType?: 'alert' | 'info';
  amount?: string;
  amountLabel?: string;
  items: ClauseItem技巧[];
}

interface Chapter {
  id: string;
  title: string;
  subtitle: string;
  color: string;
  icon: React.ElementType;
  clauses: Clause[];
}

const adartData: Chapter[] = [
  {
    id: "bab-1",
    title: "BAB I: NAMA, KEDUDUKAN, DAN ASAS",
    subtitle: "2 Pasal",
    color: "bg-emerald-800",
    icon: Book,
    clauses: [
      {
        id: "Pasal 1",
        title: "Nama dan Domisili",
        type: "primary",
        items: [
          "Organisasi paguyuban warga ini bernama Paguyuban Warga Beryl.",
          "Berkedudukan di Cluster Beryl Permata Mutiara Maja, Desa Curug Badak, Kecamatan Maja, Kabupaten Lebak, Provinsi Banten.",
          "Paguyuban ini merupakan wadah musyawarah, silaturahmi, dan tolong-menolong seluruh warga Cluster Beryl."
        ]
      },
      {
        id: "Pasal 2",
        title: "Sifat, Asas, dan Jangka Waktu",
        type: "secondary",
        iconType: "info",
        items: [
          "Berasaskan Pancasila, UUD 1945, serta semangat kekeluargaan, kegotongroyongan, dan syariat Islam.",
          "Bersifat SEMENTARA (masa transisi) sebagai forum koordinasi warga perintis hingga terbentuknya struktur Rukun Tetangga (RT) definitif dari pemerintah desa setempat.",
          "Bersifat nirlaba (non-profit), independen, dan mengutamakan kerukunan antarwarga."
        ]
      }
    ]
  },
  {
    id: "bab-2",
    title: "BAB II: KAS IURAN WARGA (DANA SOSIAL PAGUYUBAN)",
    subtitle: "3 Pasal",
    color: "bg-emerald-600",
    icon: Heart,
    clauses: [
      {
        id: "Pasal 3",
        title: "Iuran Wajib Bulanan Rp 10.000",
        type: "primary",
        amount: "Rp 10.000",
        amountLabel: "Nominal Wajib / KK / Bulan",
        items: [
          "Setiap Kepala Keluarga (KK) yang menempati unit rumah (baik pemilik maupun penyewa) wajib menyisihkan Iuran Kas Warga sebesar Rp 10.000 setiap bulan kepada Paguyuban.",
          "Batas waktu penyetoran selambat-lambatnya tanggal 15 setiap bulannya yang dimulai sejak Januari 2026.",
          "Iuran disetorkan kepada Bendahara Paguyuban dan dialokasikan untuk Pos Dana Sosial Warga dan Pos Operasional Lingkungan ringan."
        ]
      },
      {
        id: "Pasal 4",
        title: "Akad Tabarru' & Penyaluran Dana Sosial",
        type: "secondary",
        iconType: "info",
        items: [
          { type: 'info', text: "Pengelolaan dana sosial didasarkan pada AKAD TABARRU' (niat ikhlas tolong-menolong/hibah) antarwarga, bukan bersifat transaksional layaknya klaim asuransi komersial." },
          "Besaran santunan (kematian, sakit rawat inap, atau musibah) bersifat Tali Kasih. Nominal tidak diikat secara kaku, melainkan disesuaikan dengan ketersediaan dan kemampuan kas paguyuban saat kejadian berdasarkan keputusan pengurus.",
          "Sebagai bentuk keadilan, prioritas penyaluran tali kasih diberikan kepada warga yang berpartisipasi aktif menunaikan iuran kas minimal 3 bulan terakhir sebelum kejadian."
        ]
      },
      {
        id: "Pasal 5",
        title: "Tanggung Jawab Pembukuan Keuangan",
        type: "secondary",
        iconType: "alert",
        items: [
          "Bendahara bertanggung jawab penuh atas penerimaan, penyimpanan, pembukuan digital, dan pelaporan keuangan.",
          "Laporan neraca keuangan kas warga disampaikan secara transparan melalui sistem digital kepada seluruh warga."
        ]
      }
    ]
  },
  {
    id: "bab-3",
    title: "BAB III: IURAN PEMELIHARAAN LINGKUNGAN (IPL) PENGEMBANG",
    subtitle: "3 Pasal",
    color: "bg-teal-700",
    icon: Building,
    clauses: [
      {
        id: "Pasal 6",
        title: "Kondisi Lingkungan & Warga Perintis",
        type: "primary",
        items: [
          "Cluster Beryl merupakan kawasan berskala besar seluas 17 Hektar. Saat dokumen ini disahkan, klaster baru berusia 6 bulan dan masih dalam tahap progres pembangunan masif oleh pihak Pengembang (Developer).",
          "Dari total rencana 1.700 unit rumah, baru terealisasi sekitar 800 unit, terjual sekitar 500 unit, dan saat ini baru dihuni oleh warga perintis berjumlah kisaran 80 hingga 90 Kepala Keluarga.",
          "Menyadari luasnya area dan masih berjalannya proyek pembangunan, warga diimbau untuk saling memaklumi kondisi fasilitas yang belum 100% sempurna, serta terus bersinergi dengan pihak Pengembang."
        ]
      },
      {
        id: "Pasal 7",
        title: "Kewajiban IPL ke Pengembang",
        type: "primary",
        amount: "Rp 75.000",
        amountLabel: "Wajib Ke Developer / Bulan",
        items: [
          "Selain Kas Paguyuban (Rp 10.000), setiap warga yang telah serah terima kunci / menghuni unit diwajibkan membayar Iuran Pemeliharaan Lingkungan (IPL) secara langsung kepada pihak Pengembang sebesar Rp 75.000 per bulan.",
          "Dana IPL ini sepenuhnya dikelola oleh Pengembang untuk memastikan berjalannya operasional keamanan berlapis, kebersihan jalan utama, pengangkutan sampah, dan perawatan fasilitas klaster seluas 17 Hektar tersebut."
        ]
      },
      {
        id: "Pasal 8",
        title: "Kedisiplinan & Sanksi IPL Pengembang",
        type: "secondary",
        iconType: "alert",
        items: [
          "Warga dihimbau dengan sangat hormat dan bijaksana untuk senantiasa tertib membayar IPL demi kenyamanan bersama dan kelancaran pembangunan fasilitas lingkungan.",
          "Sanksi atas keterlambatan atau penunggakan IPL (seperti penghentian pengangkutan sampah unit atau pembatasan akses tertentu) sepenuhnya merupakan hak dan wewenang mutlak pihak Pengembang, bukan wewenang Paguyuban.",
          "Meskipun demikian, pengurus Paguyuban akan selalu bersedia menjembatani komunikasi yang santun antara warga dan Pengembang apabila terdapat kendala yang mendesak."
        ]
      }
    ]
  },
  {
    id: "bab-4",
    title: "BAB IV: ADMINISTRASI, KEAMANAN & AKSES",
    subtitle: "3 Pasal",
    color: "bg-slate-700",
    icon: Shield,
    clauses: [
      {
        id: "Pasal 9",
        title: "Sistem Keamanan Lingkungan",
        type: "primary",
        items: [
          "Keamanan lingkungan Cluster Beryl diselenggarakan secara kolaboratif antara petugas keamanan Pengembang dan swadaya gotong royong warga.",
          "Warga wajib saling peduli dan segera melaporkan orang asing/aktivitas mencurigakan kepada Petugas Keamanan / Pengurus."
        ]
      },
      {
        id: "Pasal 10",
        title: "Wajib Lapor Penghuni Baru, Penyewa & Tamu",
        type: "secondary",
        iconType: "alert",
        items: [
          { type: 'warning', text: "Warga yang baru pindah menempati rumah atau pemilik yang mengontrakkan/menyewakan rumahnya WAJIB melapor kepada Pengurus selambat-lambatnya 1x24 jam." },
          "PENYEWA/KONTRAKAN: Wajib menyerahkan salinan dokumen identitas berupa KTP dan Kartu Keluarga (KK) yang sah kepada Pengurus Paguyuban demi tertib administrasi kependudukan.",
          "TAMU MENGINAP: Tamu yang menginap lebih dari 3 (tiga) hari wajib melaporkan keberadaannya dan menyerahkan identitas/salinan KTP kepada pihak keamanan/pengurus. Tuan rumah bertanggung jawab penuh atas tamu yang diundangnya."
        ]
      },
      {
        id: "Pasal 11",
        title: "Pengaturan Akses Portal Malam",
        type: "secondary",
        iconType: "info",
        items: [
          "Portal/gerbang utama ditutup pada pukul 23.00 WIB demi keamanan lingkungan (warga tetap dapat mengakses secara mandiri).",
          "Tamu yang keluar/masuk di atas pukul 23.00 WIB wajib melapor secara santun kepada petugas/warga yang bertugas."
        ]
      }
    ]
  },
  {
    id: "bab-5",
    title: "BAB V: KETERTIBAN UMUM, FASUM & USAHA",
    subtitle: "6 Pasal",
    color: "bg-orange-600",
    icon: Bell,
    clauses: [
      {
        id: "Pasal 12",
        title: "Jam Tenang Lingkungan",
        type: "primary",
        items: [
          "Jam Tenang berlaku setiap hari pada pukul 22.00 WIB s.d. 06.00 WIB.",
          "Warga dilarang membuat suara bising/kegaduhan musik, knalpot brong, atau aktivitas pertukangan berat yang mengganggu waktu istirahat tetangga pada jam tenang.",
          "Kegiatan acara khusus yang melampaui jam 22.00 WIB wajib mengonfirmasi tetangga sekitar minimal 2 hari sebelumnya."
        ]
      },
      {
        id: "Pasal 13",
        title: "Tata Tertib Parkir Kendaraan",
        type: "secondary",
        iconType: "alert",
        items: [
          "Kendaraan (mobil/motor) wajib diparkir di dalam carport unit rumah masing-masing sebagai prioritas utama.",
          "Dalam kondisi darurat, kendaraan diparkir di tepi jalan umum tidak boleh memakan badan jalan utama yang menyulitkan akses darurat, dan harus siap dipindahkan sewaktu-waktu.",
          "Dilarang keras memarkir kendaraan rusak/mati secara permanen di bahu jalan umum cluster."
        ]
      },
      {
        id: "Pasal 14",
        title: "Kebersihan & Pengelolaan Sampah",
        type: "secondary",
        iconType: "info",
        items: [
          "Setiap warga bertanggung jawab atas kebersihan halaman dan selokan depan unit rumah masing-masing.",
          "Sampah rumah tangga wajib diletakkan pada tong sampah tertutup sebelum diangkut petugas.",
          "Dilarang membakar sampah di area jalan cluster yang dapat menimbulkan polusi asap dan bahaya kebakaran."
        ]
      },
      {
        id: "Pasal 15",
        title: "Penggunaan Fasilitas Umum untuk Acara",
        type: "secondary",
        iconType: "info",
        items: [
          "Mendirikan tenda acara pribadi di badan jalan wajib mendapat izin pengurus dan persetujuan tetangga sekitar.",
          "Wajib memastikan minimal tersisa 1 (satu) lajur jalan untuk akses darurat ambulans/pemadam kebakaran.",
          "Wajib mengembalikan kebersihan dan kelayakan jalan selambat-lambatnya 1x24 jam setelah acara selesai."
        ]
      },
      {
        id: "Pasal 16",
        title: "Aturan Renovasi Bangunan & Deposit",
        type: "primary",
        amount: "Rp 2 Juta",
        amountLabel: "Deposit Renovasi Ke Developer",
        items: [
          "Warga yang akan melakukan renovasi besar (seperti penambahan fasad, dapur, atau pemasangan kanopi) WAJIB melapor kepada Pengurus dan pihak Pengembang.",
          "Wajib membayarkan uang jaminan (deposit) perbaikan lingkungan sebesar Rp 2.000.000 kepada pihak Pengembang sesuai aturan operasional, yang akan dikembalikan apabila fasum terbukti aman pasca renovasi.",
          { type: 'warning', text: "Warga WAJIB memperhatikan secara sangat ketat batas ukur tanah (kiri, kanan, dan belakang). Dilarang keras menyerobot, merusak, atau membangun melewati batas hak milik tanah orang lain/tetangga." }
        ]
      },
      {
        id: "Pasal 17",
        title: "Etika Wirausaha & Kerukunan Berniaga",
        type: "secondary",
        iconType: "alert",
        items: [
          "Demi menjaga kerukunan bertetangga dan menghindari persaingan ekonomi yang tidak sehat, warga dihimbau sangat menjunjung tinggi etika berwirausaha.",
          { type: 'warning', text: "Apabila telah ada warga perintis yang sejak awal membangun dan memiliki jenis usaha warung/toko spesifik, DILARANG KERAS / SANGAT TIDAK DIANJURKAN bagi warga lain untuk membuka jenis usaha warung yang sama persis di area klaster yang berdekatan." },
          "Aturan ini ditegakkan murni sebagai bentuk penghargaan antarwarga dan saling merawat pintu rezeki tetangga."
        ]
      }
    ]
  },
  {
    id: "bab-6",
    title: "BAB VI: KETERTIBAN PEMELIHARAAN HEWAN",
    subtitle: "3 Pasal",
    color: "bg-purple-700",
    icon: Cat,
    clauses: [
      {
        id: "Pasal 18",
        title: "Ketentuan Umum Hewan Peliharaan",
        type: "primary",
        items: [
          "Pemilik hewan peliharaan wajib memastikan hewannya tidak menimbulkan bau menyengat, suara bising, atau mengotori area fasilitas umum/jalan.",
          "Pemilik hewan WAJIB bertanggung jawab penuh membersihkan kotoran peliharaannya yang tercecer di jalanan seketika itu juga."
        ]
      },
      {
        id: "Pasal 19",
        title: "Aturan Unggas (Ayam / Bebek / Burung)",
        type: "secondary",
        iconType: "alert",
        items: [
          "Dilarang keras mendirikan peternakan unggas skala komersial di area rumah tinggal.",
          "Unggas peliharaan wajib dikandangkan di dalam area tertutup rumah dan kandang wajib dibersihkan secara rutin agar tidak menimbulkan lalat dan bau ke tetangga sekitar."
        ]
      },
      {
        id: "Pasal 20",
        title: "Aturan Kucing & Anjing",
        type: "secondary",
        iconType: "info",
        items: [
          "Anjing yang diajak berjalan di area umum wajib menggunakan tali penuntun (leash) dan dikendalikan suaranya di malam hari.",
          "Kucing peliharaan wajib dikontrol agar tidak membuang kotoran di teras/halaman rumah tetangga."
        ]
      }
    ]
  },
  {
    id: "bab-7",
    title: "BAB VII: KEANGGOTAAN, HAK, DAN KEWAJIBAN",
    subtitle: "3 Pasal",
    color: "bg-blue-700",
    icon: Users,
    clauses: [
      {
        id: "Pasal 21",
        title: "Status Keanggotaan Warga",
        type: "primary",
        items: [
          "Anggota Paguyuban adalah seluruh warga yang berdomisili di Cluster Beryl, baik pemilik maupun penyewa.",
          "Setiap Kepala Keluarga (KK) yang telah menetap memiliki 1 (satu) hak suara dalam musyawarah warga."
        ]
      },
      {
        id: "Pasal 22",
        title: "Hak Anggota Paguyuban",
        type: "secondary",
        iconType: "info",
        items: [
          "Mendapatkan hak perlindungan keamanan, ketenteraman, dan penyaluran dana sosial sesuai asas Tabarru'.",
          { type: 'warning', text: "Hak untuk dipilih menjadi Ketua Paguyuban, Bendahara, atau Ketua RT kelak HANYA berlaku bagi warga yang berstatus sebagai Pemilik Rumah (bukan penyewa sementara) demi jaminan pertanggungjawaban." }
        ]
      },
      {
        id: "Pasal 23",
        title: "Kewajiban Anggota Paguyuban",
        type: "secondary",
        iconType: "alert",
        items: [
          "Menjunjung tinggi kerukunan dan mematuhi AD/ART yang telah disahkan.",
          "Menunaikan iuran kas Paguyuban (Rp 10.000) dan IPL Pengembang (Rp 75.000) secara tertib.",
          "Berpartisipasi aktif dalam kegiatan kerja bakti dan gotong royong."
        ]
      }
    ]
  },
  {
    id: "bab-8",
    title: "BAB VIII: MUSYAWARAH, PENGURUS & TRANSISI RT",
    subtitle: "5 Pasal",
    color: "bg-amber-700",
    icon: Award,
    clauses: [
      {
        id: "Pasal 24",
        title: "Jenis Musyawarah & Rapat",
        type: "primary",
        items: [
          "Musyawarah Warga: Dilaksanakan minimal 1 kali dalam 6 bulan untuk laporan pertanggungjawaban.",
          "Musyawarah Khusus: Diadakan sewaktu-waktu untuk mufakat hal mendesak.",
          "Rapat Rutin Pengurus: Dilaksanakan berkala sekurang-kurangnya 1 bulan sekali."
        ]
      },
      {
        id: "Pasal 25",
        title: "Kuorum & Pengambilan Keputusan",
        type: "secondary",
        iconType: "info",
        items: [
          "Musyawarah sah apabila dihadiri sekurang-kurangnya 50% + 1 dari total KK warga menetap.",
          "Keputusan diutamakan melalui mufakat. Jika gagal, dilakukan pemungutan suara (voting)."
        ]
      },
      {
        id: "Pasal 26",
        title: "Masa Bakti & Pembagian Tugas",
        type: "secondary",
        iconType: "info",
        items: [
          "Masa bakti pengurus paguyuban berlaku selama masa transisi sampai terbentuknya perangkat RT definitif.",
          "Ketua mewakili warga, Sekretaris mengelola data, Bendahara mengelola uang, dan Sie Umum mengelola kegiatan sosial/keamanan."
        ]
      },
      {
        id: "Pasal 27",
        title: "Pergantian Pengurus Antar Waktu (PAW)",
        type: "secondary",
        iconType: "alert",
        items: [
          "Apabila pengurus inti (Ketua/Bendahara) berhalangan tetap atau pindah domisili, akan segera ditunjuk Pelaksana Tugas (Plt) melalui Rapat Pengurus Khusus tanpa menunggu Musyawarah Warga agar roda organisasi tidak vakum."
        ]
      },
      {
        id: "Pasal 28",
        title: "Syarat Transisi Pembentukan RT Definitif",
        type: "primary",
        items: [
          { type: 'warning', text: "Sesuai regulasi pemerintah setempat, pengajuan pembentukan Rukun Tetangga (RT) definitif murni mensyaratkan berdirinya populasi minimal 60 Kepala Keluarga menetap." },
          "Ke-60 KK tersebut WAJIB telah mengurus dan memegang Surat Keterangan Domisili (SKD) dari pihak kelurahan/desa setempat.",
          "Kandidat yang akan dicalonkan dan dipilih menjadi Ketua RT Definitif, diwajibkan telah merubah dan memiliki KTP resmi dengan alamat terdaftar di Kelurahan Curug Badak."
        ]
      }
    ]
  },
  {
    id: "bab-9",
    title: "BAB IX: SANKSI, PERUBAHAN AD/ART, & PENUTUP",
    subtitle: "3 Pasal",
    color: "bg-slate-800",
    icon: Gavel,
    clauses: [
      {
        id: "Pasal 29",
        title: "Tingkatan Sanksi Paguyuban",
        type: "primary",
        items: [
          "Teguran Lisan secara kekeluargaan untuk pelanggaran pertama.",
          "Teguran Tertulis (Surat Pemberitahuan) apabila tidak diindahkan secara berulang.",
          { type: 'warning', text: "SANKSI ADMINISTRATIF: Warga yang sengaja menunggak iuran kas Paguyuban lebih dari 3 bulan tanpa uzur syar'i akan GUGUR HAK PRIORITASNYA dari penerima manfaat/tali kasih dana sosial." }
        ]
      },
      {
        id: "Pasal 30",
        title: "Mekanisme Perubahan AD / ART",
        type: "secondary",
        iconType: "alert",
        items: [
          "Perubahan isi AD/ART hanya dapat dilakukan melalui Musyawarah Warga yang dihadiri sekurang-kurangnya 60% perwakilan Kepala Keluarga menetap.",
          "Usulan perubahan diajukan secara tertulis minimal 7 hari sebelum pelaksanaan musyawarah."
        ]
      },
      {
        id: "Pasal 31",
        title: "Penutup",
        type: "primary",
        items: [
          "Hal-hal yang belum cukup diatur dalam dokumen ini akan dibahas dan ditetapkan melalui forum musyawarah mufakat warga.",
          "Dokumen AD/ART ini disusun dan disahkan dengan niat tulus guna menjaga keharmonisan, keamanan, keadilan, dan keberkahan hidup bertetangga di Cluster Beryl."
        ]
      }
    ]
  }
];

export const AdArtPage: React.FC = () => {
  const [openSections, setOpenSections] = useState<string[]>([
    'bab-1', 'bab-2', 'bab-3', 'bab-4', 'bab-5', 'bab-6', 'bab-7', 'bab-8', 'bab-9'
  ]);
  const [search, setSearch] = useState('');

  const toggleSection整形 = (id: string) => {
    if (openSections.includes(id)) {
      setOpenSections(openSections.filter(s => s !== id));
    } else {
      setOpenSections([...openSections, id]);
    }
  };

  const handleExpandAll = () => {
    setOpenSections(adartData.map(d => d.id));
  };

  const handleCollapseAll = () => {
    setOpenSections([]);
  };

  const handlePrint = () => {
    window.print();
  };

  // Filter pencarian pasal & rincian isi
  const filteredData = useMemo(() => {
    if (!search.trim()) return adartData;
    const q = search.toLowerCase();
    return adartData.filter(chapter => {
      const matchChapter = chapter.title.toLowerCase().includes(q) || chapter.subtitle.toLowerCase().includes(q);
      const matchClauses旗 = chapter.clauses.some(c => 
        c.id.toLowerCase().includes(q) || 
        c.title.toLowerCase().includes(q) ||
        (c.amount && c.amount.toLowerCase().includes(q)) ||
        c.items.some(item => typeof item === 'string' ? item.toLowerCase().includes(q) : item.text.toLowerCase().includes(q))
      );
      return matchChapter || matchClauses旗;
    });
  }, [search]);

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      {/* Header Halaman Resmi */}
      <div className="bg-gradient-to-r from-emerald-900 via-emerald-800 to-teal-900 rounded-3xl p-6 md:p-8 text-white shadow-xl">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <div className="inline-flex items-center space-x-2 px-3 py-1 bg-white/20 backdrop-blur-md rounded-full text-xs font-bold uppercase tracking-wider text-emerald-100 mb-2">
              <FileText className="w-3.5 h-3.5 text-emerald-300" />
              <span>Dokumen Resmi Paguyuban Warga Beryl</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-black tracking-tight">
              AD / ART Warga Beryl
            </h1>
            <p className="text-xs md:text-sm text-emerald-100 mt-1 max-w-2xl leading-relaxed">
              Anggaran Dasar & Anggaran Rumah Tangga pedoman kas paguyuban, kewajiban IPL Developer, aturan renovasi, administrasi warga, dan syarat pembentukan RT.
            </p>
          </div>
          <div className="flex items-center space-x-2 shrink-0">
            <button
              onClick={handlePrint}
              className="flex items-center space-x-2 px-4 py-2.5 bg-white text-slate-900 hover:bg-slate-100 rounded-xl text-xs font-black shadow-md transition-all"
              title="Cetak atau simpan dokumen sebagai PDF"
            >
              <Printer className="w-4 h-4 text-emerald-700" />
              <span>Cetak Dokumen / PDF</span>
            </button>
          </div>
        </div>
      </div>

      {/* Bar Pencarian & Tombol Buka/Tutup */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Cari pasal (misal: iuran, IPL, renovasi, warung, KTP)..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs outline-none focus:border-emerald-500 shadow-2xs font-medium"
          />
        </div>
        <div className="flex items-center space-x-2 shrink-0 w-full sm:w-auto justify-end">
          <button
            onClick={handleExpandAll}
            className="px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors shadow-2xs"
          >
            Buka Semua
          </button>
          <button
            onClick={handleCollapseAll}
            className="px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors shadow-2xs"
          >
            Tutup Semua
          </button>
        </div>
      </div>

      {/* Daftar Bab AD/ART (Accordion) */}
      <div className="space-y-4">
        {filteredData.map((section) => {
          const isOpen = openSections.includes(section.id);
          const Icon = section.icon;

          return (
            <div key={section.id} className="bg-white rounded-2xl shadow-xs border border-slate-200 overflow-hidden">
              <button 
                onClick={() => toggleSection整形(section.id)}
                className={`w-full flex items-center justify-between p-4 md:p-5 transition-colors ${section.color} text-white`}
              >
                <div className="flex items-center space-x-3.5 text-left">
                  <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center backdrop-blur-xs shrink-0">
                    <Icon className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h2 className="text-sm md:text-base font-black tracking-tight leading-snug">{section.title}</h2>
                    <p className="text-[11px] text-white/80 font-medium">{section.subtitle}</p>
                  </div>
                </div>
                <div>
                  {isOpen ? <ChevronUp className="w-5 h-5 text-white/90" /> : <ChevronDown className="w-5 h-5 text-white/90" />}
                </div>
              </button>

              {isOpen && (
                <div className="p-4 md:p-6 space-y-4 bg-slate-50/60">
                  {section.clauses.map((clause, idx) => (
                    <div 
                      key={idx} 
                      className={`rounded-2xl border p-4 md:p-5 transition-all ${
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

                        {clause.amount && (
                          <div className="text-right shrink-0 bg-white/80 px-3 py-1.5 rounded-xl border border-slate-200/80">
                            <span className="text-[9px] text-slate-400 uppercase font-bold tracking-wider block">{clause.amountLabel}</span>
                            <p className="text-sm md:text-base font-black text-emerald-700 tracking-tight">{clause.amount}</p>
                          </div>
                        )}
                      </div>

                      <div className="space-y-2.5 pl-11">
                        {clause.items.map((item, i) => {
                          if (typeof item === 'object') {
                            if (item.type === 'warning') {
                              return (
                                <div key={i} className="flex items-start space-x-2 text-xs text-amber-900 bg-amber-50/90 p-3.5 rounded-xl border border-amber-200/80 leading-relaxed font-medium">
                                  <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0 text-amber-600" />
                                  <span>{item.text}</span>
                                </div>
                              );
                            }
                            if (item.type === 'info') {
                              return (
                                <div key={i} className="flex items-start space-x-2 text-xs text-teal-900 bg-teal-50/90 p-3.5 rounded-xl border border-teal-200/80 leading-relaxed font-medium">
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

        {filteredData.length === 0 && (
          <div className="p-12 text-center bg-white rounded-2xl border border-slate-200 text-slate-400 text-xs space-y-1">
            <p className="font-bold text-slate-600">Tidak Ditemukan Pasal</p>
            <p>Tidak ada pasal atau tata tertib dengan kata kunci &quot;<strong>{search}</strong>&quot;.</p>
          </div>
        )}
      </div>
      
      {/* Footer Dokumen */}
      <div className="text-center pt-8 border-t border-slate-200 space-y-1">
        <p className="text-xs font-bold text-slate-700">
          Dokumen Resmi Paguyuban Warga Beryl • Disahkan Januari 2026 • Versi 2.6
        </p>
        <p className="text-[11px] text-slate-400">
          Cluster Beryl Permata Mutiara Maja, Desa Curug Badak, Kecamatan Maja, Kabupaten Lebak, Banten
        </p>
      </div>
    </div>
  );
};

// Aliases ekspor agar seluruh import aplikasi selalu cocok
export const AdArt = AdArtPage;
export default AdArtPage;