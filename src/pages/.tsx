import React, { useState } from 'react';
import { Book, Heart, Shield, Bell, Cat, Users, MessageSquare, Award, Gavel, FileCheck, ChevronDown, ChevronUp, CheckCircle2, AlertTriangle, Info } from 'lucide-react';

const adartData = [
  {
    id: "bab-1",
    title: "BAB I: NAMA, KEDUDUKAN, DAN SIFAT",
    subtitle: "2 Pasal",
    color: "bg-blue-600",
    icon: Book,
    clauses: [
      {
        id: "Pasal 1",
        title: "Nama dan Kedudukan",
        type: "primary",
        items: [
          "Organisasi ini bernama Paguyuban Cluster Beryl.",
          "Berkedudukan di Cluster Beryl Permata Mutiara Maja, Desa Curug Badak, Kecamatan Maja, Kabupaten Lebak, Provinsi Banten.",
          "Paguyuban ini merupakan wadah musyawarah dan kerja sama warga Cluster Beryl."
        ]
      },
      {
        id: "Pasal 2",
        title: "Sifat dan Jangka Waktu",
        type: "secondary",
        iconType: "alert",
        items: [
          "Bersifat SEMENTARA (TEMPORARY) sebagai masa transisi hingga terbentuknya RT definitif.",
          "Berfungsi sebagai forum komunikasi, koordinasi, dan pemberdayaan warga.",
          "Tidak berorientasi profit dan bersifat independen."
        ]
      }
    ]
  },
  {
    id: "bab-2",
    title: "BAB II: JAGA WARGA (DANA SOSIAL)",
    subtitle: "3 Pasal",
    color: "bg-rose-500",
    icon: Heart,
    clauses: [
      {
        id: "Pasal 3",
        title: "Iuran Wajib",
        type: "primary",
        amount: "Rp 10.000",
        amountLabel: "Nominal",
        items: [
          "Iuran Wajib: Rp 10.000 per KK / bulan.",
          "Batas pembayaran tanggal 15 setiap bulannya dimulai sejak Januari 2026.",
          "Iuran dapat dibayarkan melalui transfer atau tunai kepada Bendahara.",
          "Keterlambatan pembayaran lebih dari 30 hari akan mendapatkan teguran tertulis."
        ]
      },
      {
        id: "Pasal 4",
        title: "Penggunaan Dana Sosial",
        type: "secondary",
        iconType: "info",
        items: [
          "Tujuan Dana: Santunan kematian, bantuan rawat inap, dan darurat sosial warga.",
          "Mekanisme pencairan dana wajib diketahui dan disetujui oleh Ketua dan Bendahara.",
          "Penggunaan dana di luar tujuan sosial harus melalui musyawarah warga.",
          "Laporan keuangan akan disampaikan setiap 3 bulan secara transparan."
        ]
      },
      {
        id: "Pasal 5",
        title: "Penanggung Jawab Keuangan",
        type: "secondary",
        iconType: "alert",
        items: [
          "Bendahara bertanggung jawab atas pencatatan, penyimpanan, dan pelaporan dana.",
          "Setiap transaksi di atas Rp 500.000 harus diketahui oleh Ketua."
        ]
      }
    ]
  },
  {
    id: "bab-3",
    title: "BAB III: JAGA KEAMANAN INTERNAL",
    subtitle: "3 Pasal",
    color: "bg-slate-700",
    icon: Shield,
    clauses: [
      {
        id: "Pasal 6",
        title: "Sistem Keamanan Lingkungan",
        type: "primary",
        items: [
          "Pengawasan lingkungan dilakukan warga secara bergiliran (Siskamling Mandiri).",
          "Jadwal siskamling akan diatur oleh Sie. Keamanan dan disebarkan ke semua warga.",
          "Setiap warga wajib melaporkan kejadian mencurigakan kepada Sie. Keamanan."
        ]
      },
      {
        id: "Pasal 7",
        title: "Pengaturan Tamu",
        type: "secondary",
        iconType: "alert",
        items: [
          "Tamu Menginap 1x24 Jam: Wajib lapor pengurus dan menyerahkan fotokopi KTP.",
          "Tamu yang menginap lebih dari 3 hari wajib melapor secara tertulis.",
          "Pemilik rumah bertanggung jawab penuh atas tamunya."
        ]
      },
      {
        id: "Pasal 8",
        title: "Pengaturan Akses",
        type: "secondary",
        iconType: "info",
        items: [
          "Portal/Gerbang ditutup pukul 23.00 WIB (akses warga tetap dibuka dengan kunci/password).",
          "Setiap tamu yang masuk setelah pukul 22.00 WIB wajib dilaporkan.",
          "Parkir kendaraan tamu tidak boleh menghalangi akses darurat."
        ]
      }
    ]
  },
  {
    id: "bab-4",
    title: "BAB IV: KETERTIBAN UMUM",
    subtitle: "3 Pasal",
    color: "bg-orange-500",
    icon: Bell,
    clauses: [
      {
        id: "Pasal 9",
        title: "Jam Tenang",
        type: "primary",
        items: [
          "Jam Tenang: Pukul 22.00 - 06.00 WIB.",
          "Dilarang membuat kegaduhan, musik keras, atau aktivitas yang mengganggu ketenangan.",
          "Pengecualian untuk acara khusus dengan pemberitahuan minimal 3 hari sebelumnya."
        ]
      },
      {
        id: "Pasal 10",
        title: "Pengaturan Parkir",
        type: "secondary",
        iconType: "alert",
        items: [
          "Kendaraan wajib diparkir di carport masing-masing sebagai prioritas utama.",
          "Dalam kondisi khusus dimana tidak tersedia tempat parkir pribadi, pemilik kendaraan dapat memarkir di area umum dengan ketentuan:",
          "  • Tidak mengganggu akses jalan utama dan kendaraan lain;",
          "  • Tidak menghalangi pandangan atau akses darurat;",
          "  • Harus memperoleh izin terlebih dahulu dari Sie. Sosial/Humas;",
          "  • Bersifat sementara dan dapat dipindahkan sewaktu-waktu atas permintaan pengurus.",
          "Dilarang parkir permanen di jalan utama atau menghalangi akses tetangga.",
          "Kendaraan yang parkir lebih dari 7 hari tanpa pemberitahuan akan ditegur."
        ]
      },
      {
        id: "Pasal 11",
        title: "Kebersihan Lingkungan",
        type: "secondary",
        iconType: "info",
        items: [
          "Setiap warga bertanggung jawab atas kebersihan depan rumah masing-masing.",
          "Sampah rumah tangga hanya boleh dibuang pada tempat yang telah disediakan.",
          "Dilarang membuang sampah atau limbah ke saluran air umum."
        ]
      }
    ]
  },
  {
    id: "bab-5",
    title: "BAB V: KETERTIBAN & PEMELIHARAAN HEWAN",
    subtitle: "4 Pasal",
    color: "bg-purple-600",
    icon: Cat,
    clauses: [
      {
        id: "Pasal 12",
        title: "Ketentuan Umum Hewan Peliharaan",
        type: "primary",
        items: [
          { type: 'warning', text: "PERHATIAN KHUSUS: Bagian ini mengatur tentang Ayam, Unggas, Anjing, dan Kucing demi kenyamanan bertetangga." },
          "Pemilik hewan wajib memastikan peliharaannya tidak mengganggu tetangga (suara, bau, kotoran).",
          "Hewan peliharaan DILARANG dibiarkan berkeliaran bebas di luar pagar rumah tanpa pengawasan.",
          "Pemilik WAJIB membersihkan kotoran hewannya yang tercecer di area umum (jalan/taman) seketika itu juga.",
          "Setiap hewan peliharaan harus dalam kondisi sehat dan terawat."
        ]
      },
      {
        id: "Pasal 13",
        title: "Aturan Unggas (Ayam/Bebek)",
        type: "secondary",
        iconType: "alert",
        items: [
          "Larangan Ternak Komersil: Rumah tinggal dilarang dijadikan peternakan skala besar.",
          "Wajib Kandang: Ayam/Unggas wajib dikandangkan di dalam area rumah, tidak boleh dilepasliarkan di jalanan cluster.",
          "Kebersihan: Kandang wajib dibersihkan rutin agar tidak menimbulkan bau ke tetangga sebelah.",
          "Jumlah maksimal unggas yang dipelihara adalah 10 ekor per rumah."
        ]
      },
      {
        id: "Pasal 14",
        title: "Aturan Anjing & Kucing",
        type: "secondary",
        iconType: "info",
        items: [
          "Tali Penuntun (Leash): Saat membawa anjing berjalan di area umum, WAJIB menggunakan tali penuntun.",
          "Suara: Pemilik wajib mengendalikan gonggongan anjing terutama di jam istirahat (22.00 - 06.00).",
          "Anjing galak atau berukuran besar harus menggunakan muzzle saat di area umum.",
          "Kucing harus divaksinasi dan dikandangkan jika memiliki kebiasaan berkeliaran."
        ]
      },
      {
        id: "Pasal 15",
        title: "Sanksi Pelanggaran Aturan Hewan",
        type: "secondary",
        iconType: "alert",
        items: [
          "Pelanggaran pertama: Teguran lisan dari pengurus.",
          "Pelanggaran kedua: Teguran tertulis.",
          "Pelanggaran berulang: Akan dibahas dalam musyawarah warga untuk sanksi lebih lanjut."
        ]
      }
    ]
  },
  {
    id: "bab-6",
    title: "BAB VI: KEANGGOTAAN, HAK DAN KEWAJIBAN",
    subtitle: "3 Pasal",
    color: "bg-emerald-600",
    icon: Users,
    clauses: [
      {
        id: "Pasal 16",
        title: "Anggota Paguyuban",
        type: "primary",
        items: [
          "Anggota paguyuban adalah seluruh warga Cluster Beryl yang telah menempati rumah.",
          "Setiap kepala keluarga memiliki 1 (satu) hak suara dalam musyawarah.",
          "Keanggotaan aktif setelah membayar iuran pertama."
        ]
      },
      {
        id: "Pasal 17",
        title: "Hak Anggota",
        type: "secondary",
        iconType: "info",
        items: [
          "Mengikuti musyawarah dan menyampaikan pendapat.",
          "Mendapatkan perlindungan dan bantuan sosial sesuai ketentuan.",
          "Mengakses informasi keuangan paguyuban.",
          "Memilih dan dipilih sebagai pengurus."
        ]
      },
      {
        id: "Pasal 18",
        title: "Kewajiban Anggota",
        type: "secondary",
        iconType: "alert",
        items: [
          "Mematuhi AD/ART yang telah disahkan.",
          "Membayar iuran tepat waktu.",
          "Menjaga ketertiban, keamanan, dan kebersihan lingkungan.",
          "Menghormati hak dan kenyamanan tetangga."
        ]
      }
    ]
  },
  {
    id: "bab-7",
    title: "BAB VII: MUSYAWARAH DAN RAPAT",
    subtitle: "2 Pasal",
    color: "bg-blue-500",
    icon: MessageSquare,
    clauses: [
      {
        id: "Pasal 19",
        title: "Jenis Musyawarah",
        type: "primary",
        items: [
          "Musyawarah Tahunan: Dilaksanakan 2 x dalam 1 tahun untuk evaluasi dan penyusunan program kerja.",
          "Musyawarah Khusus: Dilaksanakan jika diperlukan untuk hal-hal mendesak.",
          "Rapat Pengurus: Dilaksanakan secara rutin minimal satu (1) bulan sekali, dengan waktu pelaksanaan setelah tanggal 15 setiap bulannya.",
          "Konsultasi Warga: Dilaksanakan berkala setiap 3 bulan sekali sebagai sarana komunikasi dan penyerapan aspirasi warga."
        ]
      },
      {
        id: "Pasal 20",
        title: "Kuorum dan Pengambilan Keputusan",
        type: "secondary",
        iconType: "info",
        items: [
          "Kuorum musyawarah warga adalah 60% dari total kepala keluarga.",
          "Keputusan diambil dengan musyawarah untuk mufakat.",
          "Jika musyawarah tidak mencapai mufakat, dapat dilakukan voting dengan suara terbanyak.",
          "Hasil musyawarah dicatat dalam notulen dan disahkan oleh peserta."
        ]
      }
    ]
  },
  {
    id: "bab-8",
    title: "BAB VIII: STRUKTUR PENGURUS DAN TUGAS",
    subtitle: "3 Pasal",
    color: "bg-orange-600",
    icon: Award,
    clauses: [
      {
        id: "Info",
        title: "Struktur Pengurus",
        type: "primary",
        items: [
          "Lihat struktur lengkap pada halaman Struktur Pengurus."
        ]
      },
      {
        id: "Pasal 22",
        title: "Masa Bakti Pengurus",
        type: "secondary",
        iconType: "info",
        items: [
          "Masa bakti pengurus Paguyuban Beryl sampai terbentuknya RT definitif.",
          "Pengurus dapat dipilih kembali maksimal untuk 2 (dua) periode berikutnya.",
          "Penggantian pengurus di luar musyawarah tahunan hanya dilakukan dalam kondisi khusus."
        ]
      },
      {
        id: "Pasal 23",
        title: "Tugas dan Wewenang",
        type: "secondary",
        iconType: "info",
        items: [
          "Ketua: Memimpin paguyuban, mewakili ke luar, dan mengkoordinasi pengurus.",
          "Sekretaris: Menangani administrasi, korespondensi, dan dokumentasi.",
          "Bendahara: Mengelola keuangan dan membuat laporan keuangan.",
          "Sie. Keamanan: Menjaga keamanan lingkungan dan mengatur siskamling.",
          "Sie. Sosial: Menangani kegiatan sosial dan kemasyarakatan.",
          "Sie. Komunikasi: Menjalin komunikasi antar warga dan media informasi."
        ]
      }
    ]
  },
  {
    id: "bab-9",
    title: "BAB IX: SANKSI DAN PENYELESAIAN PERSELISIHAN",
    subtitle: "2 Pasal",
    color: "bg-red-600",
    icon: Gavel,
    clauses: [
      {
        id: "Pasal 24",
        title: "Jenis Sanksi",
        type: "primary",
        items: [
          "Teguran Lisan: Untuk pelanggaran ringan pertama kali.",
          "Teguran Tertulis: Untuk pelanggaran berulang atau sedang.",
          "Pembatasan Hak: Untuk pelanggaran berat yang merugikan warga lain.",
          "Dibawa ke Musyawarah Khusus: Untuk penyelesaian masalah kompleks."
        ]
      },
      {
        id: "Pasal 25",
        title: "Penyelesaian Perselisihan",
        type: "secondary",
        iconType: "alert",
        items: [
          "Perselisihan antar warga diselesaikan secara kekeluargaan melalui pengurus.",
          "Jika tidak tercapai kesepakatan, dibawa ke musyawarah warga.",
          "Prinsip utama adalah musyawarah untuk mufakat dengan mengutamakan toleransi."
        ]
      }
    ]
  },
  {
    id: "bab-10",
    title: "BAB X: PERUBAHAN AD/ART DAN PENUTUP",
    subtitle: "3 Pasal",
    color: "bg-slate-600",
    icon: FileCheck,
    clauses: [
      {
        id: "Pasal 26",
        title: "Perubahan AD/ART",
        type: "secondary",
        iconType: "info",
        items: [
          "Perubahan AD/ART hanya dapat dilakukan melalui musyawarah warga.",
          "Usulan perubahan harus disampaikan secara tertulis minimal 7 hari sebelum musyawarah.",
          "Persetujuan perubahan memerlukan kuorum 60% dan disetujui 2/3 yang hadir."
        ]
      },
      {
        id: "Pasal 27",
        title: "Masa Berlaku dan Pembubaran",
        type: "secondary",
        iconType: "alert",
        items: [
          "AD/ART ini berlaku sejak tanggal disahkan hingga terbentuknya RT definitif.",
          "Pembubaran paguyuban hanya dapat dilakukan melalui musyawarah warga dengan kuorum 75%.",
          "Jika paguyuban dibubarkan, aset dan dana yang tersisa akan diserahkan kepada RT yang terbentuk."
        ]
      },
      {
        id: "Pasal 28",
        title: "Penutup",
        type: "primary",
        items: [
          "Hal-hal yang belum diatur dalam AD/ART ini akan ditetapkan kemudian melalui musyawarah warga.",
          "AD/ART ini dibuat dalam rangka menjaga keharmonisan, ketertiban, dan kenyamanan bersama."
        ]
      }
    ]
  }
];

export const AdArt = () => {
  const [openSections, setOpenSections] = useState<string[]>(['bab-1']);

  const toggleSection = (id: string) => {
    if (openSections.includes(id)) {
      setOpenSections(openSections.filter(s => s !== id));
    } else {
      setOpenSections([...openSections, id]);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-12">
      <div className="text-center space-y-2 mb-8">
        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">AD / ART Paguyuban</h1>
        <p className="text-slate-500">Anggaran Dasar dan Anggaran Rumah Tangga Cluster Beryl.</p>
      </div>

      <div className="space-y-6">
        {adartData.map((section) => {
          const isOpen = openSections.includes(section.id);
          const Icon = section.icon;

          return (
            <div key={section.id} className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
              <button 
                onClick={() => toggleSection(section.id)}
                className={`w-full flex items-center justify-between p-5 transition-colors ${section.color} text-white`}
              >
                <div className="flex items-center space-x-4">
                  <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center backdrop-blur-sm">
                    <Icon className="w-5 h-5 text-white" />
                  </div>
                  <div className="text-left">
                    <h2 className="text-lg font-bold tracking-tight">{section.title}</h2>
                    <p className="text-sm text-white/80">{section.subtitle}</p>
                  </div>
                </div>
                <div>
                  {isOpen ? <ChevronUp className="w-6 h-6 text-white/80" /> : <ChevronDown className="w-6 h-6 text-white/80" />}
                </div>
              </button>

              {isOpen && (
                <div className="p-6 space-y-6 bg-slate-50">
                  {section.clauses.map((clause, idx) => (
                    <div 
                      key={idx} 
                      className={`rounded-xl border p-5 ${
                        clause.type === 'primary' 
                          ? 'bg-emerald-50/50 border-emerald-200' 
                          : 'bg-white border-slate-200 shadow-sm'
                      }`}
                    >
                      <div className="flex justify-between items-start mb-4">
                        <div className="flex items-center space-x-3">
                          {clause.type === 'primary' ? (
                            <div className="w-8 h-8 rounded-full bg-emerald-600 flex items-center justify-center flex-shrink-0">
                              <CheckCircle2 className="w-5 h-5 text-white" />
                            </div>
                          ) : (
                            <div className="w-8 h-8 rounded-xl bg-slate-100 flex items-center justify-center flex-shrink-0 border border-slate-200">
                              {clause.iconType === 'alert' ? 
                                <AlertTriangle className="w-4 h-4 text-slate-500" /> : 
                                <Info className="w-4 h-4 text-slate-500" />
                              }
                            </div>
                          )}
                          <div>
                            <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-0.5">{clause.id}</div>
                            <h3 className="font-bold text-slate-900 leading-tight">{clause.title}</h3>
                          </div>
                        </div>

                        {clause.amount && (
                          <div className="text-right">
                             <div className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">{clause.amountLabel}</div>
                             <div className="text-lg font-bold text-emerald-600 tracking-tight">{clause.amount}</div>
                          </div>
                        )}
                      </div>

                      <div className="space-y-3 pl-11">
                        {clause.items.map((item: any, i) => {
                          if (typeof item === 'object' && item.type === 'warning') {
                            return (
                              <div key={i} className="flex items-start space-x-2 text-sm text-amber-700 bg-amber-50 p-3 rounded-lg border border-amber-200">
                                <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                                <span>{item.text}</span>
                              </div>
                            );
                          }
                          return (
                            <div key={i} className="flex items-start space-x-2">
                              <div className={`w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0 ${clause.type === 'primary' ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                              <p className="text-sm text-slate-600 leading-relaxed">{item}</p>
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
      
      <div className="text-center pt-8 border-t border-slate-200">
        <p className="text-xs font-medium text-slate-400">Dokumen Resmi Paguyuban Cluster Beryl • Disahkan pada 3 Januari 2026 • Versi Digital 2.0</p>
      </div>
    </div>
  );
};
