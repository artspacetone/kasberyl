// src/components/KuitansiModal.tsx
import React from 'react';
import { X, Printer, Share2, CheckCircle2, ShieldCheck, Download } from 'lucide-react';
import { formatRupiah } from '../types';
import { formatPhoneNumber62, getWhatsAppLink } from '../lib/utils';

export interface KuitansiData {
  noKuitansi: string;
  jenisTransaksi: 'Iuran Kas Warga (Rp 10.000)' | 'Cicilan Pinjaman Qardhul Hasan' | 'Donasi Kas Acara' | 'Infaq Majelis Al Barokah';
  namaWarga: string;
  idRumah: string;
  noHp?: string;
  tanggalBayar: string;
  nominal: number;
  periodeAtauKeperluan: string;
  sisaTagihan?: number;
  namaPenerima: string;
}

interface KuitansiModalProps {
  data: KuitansiData | null;
  onClose: () => void;
}

export const KuitansiModal: React.FC<KuitansiModalProps> = ({ data, onClose }) => {
  if (!data) return null;

  const handlePrint = () => {
    window.print();
  };

  // Generate teks format WhatsApp resmi
  const generateWhatsAppMessage = () => {
    const sisaText = data.sisaTagihan !== undefined ? `\n*Sisa Tagihan Saat Ini:* ${formatRupiah(data.sisaTagihan)}` : '';
    const text = 
`*========================================*
*TANDA TERIMA & KUITANSI RESMI DIGITAL*
*PAGUYUBAN WARGA BERYL & MAJELIS AL BAROKAH*
*========================================*

*No. Kuitansi:* ${data.noKuitansi}
*Status:* *LUNAS / DITERIMA (VERIFIED)*

*Telah Diterima Dari:*
*Nama Warga:* ${data.namaWarga}
*Unit / Blok:* ${data.idRumah}

*Rincian Pembayaran:*
*Peruntukan:* ${data.jenisTransaksi}
*Keterangan:* ${data.periodeAtauKeperluan}
*Nominal:* *${formatRupiah(data.nominal)}*
*Tanggal Bayar:* ${data.tanggalBayar}${sisaText}

*Penerima (Bendahara):* ${data.namaPenerima}

_Terima kasih atas partisipasi dan amanah Anda dalam memajukan lingkungan serta kegiatan sosial Paguyuban Cluster Beryl._

*Sistem Informasi Keuangan Warga Beryl*`;
    return encodeURIComponent(text);
  };

  const handleShareWhatsApp = () => {
    const msg = generateWhatsAppMessage();
    const cleanHp = formatPhoneNumber62(data.noHp);
    if (cleanHp && cleanHp !== '-') {
      const digits = cleanHp.replace(/\D/g, '');
      window.open(`https://wa.me/${digits}?text=${msg}`, '_blank');
    } else {
      window.open(`https://wa.me/?text=${msg}`, '_blank');
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/70 flex items-center justify-center p-4 z-[70] backdrop-blur-xs">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden border border-slate-200">
        {/* Header Kuitansi */}
        <div className="bg-slate-900 text-white p-4 flex justify-between items-center print:hidden">
          <div className="flex items-center space-x-2">
            <ShieldCheck className="w-5 h-5 text-emerald-400" />
            <h3 className="font-bold text-xs uppercase tracking-wider">Kuitansi Digital Resmi</h3>
          </div>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-white rounded-lg">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tampilan Struk Kuitansi Siap Cetak */}
        <div className="p-6 space-y-4 text-xs font-mono bg-slate-50 border-b border-dashed border-slate-300" id="print-kuitansi-area">
          {/* Logo & Judul Dokumen */}
          <div className="text-center space-y-1 pb-3 border-b border-dashed border-slate-300">
            <div className="w-10 h-10 bg-emerald-600 text-white font-black text-sm rounded-xl mx-auto flex items-center justify-center shadow-md">
              B
            </div>
            <h4 className="font-black text-slate-900 text-sm tracking-tight pt-1">PAGUYUBAN CLUSTER BERYL</h4>
            <p className="text-[10px] text-slate-500 font-sans">Majelis Taklim Al Barokah • Permata Mutiara Maja</p>
            <span className="inline-block px-2 py-0.5 bg-emerald-100 text-emerald-800 font-bold text-[9px] rounded-full mt-1">
              BUKTI PEMBAYARAN SAH (LUNAS)
            </span>
          </div>

          {/* Nomor Kuitansi & Tanggal */}
          <div className="space-y-1 text-slate-600 text-[11px] pb-2 border-b border-dashed border-slate-300">
            <div className="flex justify-between">
              <span>No. Kuitansi:</span>
              <span className="font-bold text-slate-900">{data.noKuitansi}</span>
            </div>
            <div className="flex justify-between">
              <span>Tanggal Bayar:</span>
              <span className="font-bold text-slate-900">{data.tanggalBayar}</span>
            </div>
          </div>

          {/* Data Warga */}
          <div className="space-y-1 text-slate-600 text-[11px] pb-2 border-b border-dashed border-slate-300">
            <div className="flex justify-between">
              <span>Nama Warga:</span>
              <strong className="text-slate-900 font-bold">{data.namaWarga}</strong>
            </div>
            <div className="flex justify-between">
              <span>Unit / Blok:</span>
              <span className="font-bold text-emerald-800 bg-emerald-50 px-1.5 py-0.5 rounded">{data.idRumah}</span>
            </div>
          </div>

          {/* Rincian Transaksi */}
          <div className="space-y-1.5 text-[11px] pb-2 border-b border-dashed border-slate-300">
            <div className="flex justify-between text-slate-500">
              <span>Peruntukan:</span>
              <span className="font-bold text-slate-800 text-right">{data.jenisTransaksi}</span>
            </div>
            <div className="flex justify-between text-slate-500">
              <span>Keterangan:</span>
              <span className="font-medium text-slate-800 text-right">{data.periodeAtauKeperluan}</span>
            </div>
            {data.sisaTagihan !== undefined && (
              <div className="flex justify-between text-amber-700 font-bold">
                <span>Sisa Tagihan:</span>
                <span>{formatRupiah(data.sisaTagihan)}</span>
              </div>
            )}
          </div>

          {/* Total Pembayaran */}
          <div className="flex justify-between items-center p-3 bg-emerald-100/70 rounded-2xl border border-emerald-200">
            <span className="font-bold text-emerald-950 text-xs">TOTAL DITERIMA:</span>
            <span className="font-black text-emerald-800 text-base">{formatRupiah(data.nominal)}</span>
          </div>

          {/* Cap & Tanda Tangan Digital */}
          <div className="pt-2 text-center text-[10px] text-slate-500 space-y-1 font-sans">
            <p>Diverifikasi & Diterima Oleh:</p>
            <p className="font-bold text-slate-900 text-xs">{data.namaPenerima} (Bendahara Paguyuban)</p>
            <p className="text-[9px] text-slate-400 italic">Dokumen ini merupakan tanda terima digital sah dari bendahara paguyuban.</p>
          </div>
        </div>

        {/* Action Buttons (WhatsApp & Cetak) */}
        <div className="p-4 bg-white space-y-2 print:hidden">
          <button
            onClick={handleShareWhatsApp}
            className="w-full flex items-center justify-center space-x-2 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl text-xs font-bold shadow-md shadow-emerald-700/20 transition-all uppercase tracking-wider"
          >
            <Share2 className="w-4 h-4" />
            <span>Kirim Kuitansi ke WhatsApp</span>
          </button>
          
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center justify-center space-x-1.5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold border border-slate-200 transition-colors"
            >
              <Printer className="w-4 h-4 text-slate-600" />
              <span>Cetak / Simpan PDF</span>
            </button>
            <button
              onClick={onClose}
              className="py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl text-xs font-bold transition-colors"
            >
              Tutup
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};