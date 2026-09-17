// src/components/TagihanModal.tsx
import React, { useState } from 'react';
import { 
  X, Send, Copy, Check, QrCode, CreditCard, 
  ExternalLink, ShieldCheck, HeartHandshake, AlertCircle 
} from 'lucide-react';
import { formatRupiah } from '../types';
import { formatPhoneNumber62 } from '../lib/utils';

export interface TagihanData {
  namaWarga: string;
  idRumah: string;
  noHp?: string;
  bulanMenunggak: string[];
  totalNominal: number;
  tahun: number;
}

interface TagihanModalProps {
  data: TagihanData | null;
  onClose: () => void;
}

const QRIS_IMAGE_URL = 'https://res.cloudinary.com/wumtpslg/image/upload/v1789634410/WhatsApp_Image_2026-09-17_at_15.38.09.jpg';
const REK_BCA = '8831257334';
const NAMA_BENDAHARA = 'Siti Hajar';

export const TagihanModal: React.FC<TagihanModalProps> = ({ data, onClose }) => {
  const [copiedRek, setCopiedRek] = useState(false);
  const [copiedPesan, setCopiedPesan] = useState(false);
  const [showQrisPreview, setShowQrisPreview] = useState(false);

  if (!data) return null;

  // Format Pesan WhatsApp yang Sangat Santun, Kekeluargaan & Transparan
  const generateWhatsAppMessage = () => {
    const listBulanStr = data.bulanMenunggak.map((b, i) => `   ${i + 1}. ${b}`).join('\n');

    return (
`*PEMBERITAHUAN IURAN KAS PAGUYUBAN CLUSTER BERYL*
*==========================================*

Assalamu'alaikum Warahmatullahi Wabarakatuh,
Salam sejahtera untuk Bapak/Ibu *${data.namaWarga}*
Warga Unit / Blok *${data.idRumah}*

Semoga Bapak/Ibu sekeluarga senantiasa berada dalam keadaan sehat wal'afiat, penuh berkah, dan dimudahkan segala urusannya. Aamiin.

Kami dari Pengurus Paguyuban Warga Cluster Beryl bermaksud menyampaikan informasi rekapitulasi Iuran Kas Warga (Rp 10.000/bulan per KK) untuk alokasi 50% Pos Operasional Lingkungan dan 50% Pos Dana Sosial Kemanusiaan (santunan warga sakit/musibah).

Berdasarkan pembukuan kas tahun ${data.tahun}, terdapat catatan iuran yang belum tertunaikan untuk periode:
${listBulanStr}
*(Total: ${data.bulanMenunggak.length} Bulan)*

*Jumlah yang Perlu Disetorkan:*
👉 *${formatRupiah(data.totalNominal)}*

Pembayaran dapat disalurkan melalui:
💳 *Bank BCA*
No. Rekening: *${REK_BCA}*
Atas Nama: *${NAMA_BENDAHARA}* (Bendahara Paguyuban)

Atau scan *QRIS Resmi Kas Paguyuban* pada tautan berikut:
📲 ${QRIS_IMAGE_URL}

Mohon konfirmasi atau kirimkan bukti transfer ke kontak ini setelah melakukan penyetoran agar dapat langsung kami bukukan ke sistem digital dan kami kirimkan tanda terima Kuitansi Resmi.

_Apabila Bapak/Ibu telah melakukan pembayaran sebelumnya atau terdapat kekeliruan dalam pencatatan kami, mohon berkenan mengonfirmasi kepada pengurus. Terima kasih atas partisipasi dan amanah Bapak/Ibu dalam menjaga kebersamaan dan kemajuan lingkungan Cluster Beryl._

Wassalamu'alaikum Warahmatullahi Wabarakatuh.
*Pengurus & Bendahara Paguyuban Cluster Beryl*`
    );
  };

  const handleCopyRekening = () => {
    navigator.clipboard.writeText(REK_BCA);
    setCopiedRek(true);
    setTimeout(() => setCopiedRek(false), 2000);
  };

  const handleCopyPesan = () => {
    navigator.clipboard.writeText(generateWhatsAppMessage());
    setCopiedPesan(true);
    setTimeout(() => setCopiedPesan(false), 2000);
  };

  const handleKirimWhatsApp = () => {
    const rawMsg = generateWhatsAppMessage();
    const encoded = encodeURIComponent(rawMsg);
    const cleanHp = formatPhoneNumber62(data.noHp);

    if (cleanHp && cleanHp !== '-') {
      const digits = cleanHp.replace(/\D/g, '');
      window.open(`https://wa.me/${digits}?text=${encoded}`, '_blank');
    } else {
      window.open(`https://wa.me/?text=${encoded}`, '_blank');
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-950/80 z-[90] flex items-center justify-center p-4 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl border border-slate-200 flex flex-col max-h-[92vh]">
        {/* Header Modal */}
        <div className="bg-gradient-to-r from-amber-600 to-rose-600 text-white px-5 py-4 flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-2">
            <HeartHandshake className="w-5 h-5 text-amber-200" />
            <div>
              <h3 className="font-bold text-xs uppercase tracking-wider">Kirim Pengingat Kas Santun</h3>
              <p className="text-[11px] text-amber-100">Pemberitahuan Iuran Kas Paguyuban via WhatsApp</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 text-white/80 hover:text-white rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Isi Modal Scrollable */}
        <div className="p-5 overflow-y-auto space-y-4 text-xs">
          {/* Info Warga & Total Tagihan */}
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 flex items-start justify-between">
            <div>
              <span className="px-2 py-0.5 rounded-md font-mono font-bold text-xs bg-emerald-100 text-emerald-800 border border-emerald-300">
                {data.idRumah}
              </span>
              <h4 className="font-bold text-slate-900 text-sm mt-1">{data.namaWarga}</h4>
              <p className="text-[11px] text-slate-500 font-mono">
                WhatsApp: {data.noHp ? formatPhoneNumber62(data.noHp) : 'Tidak Terdaftar'}
              </p>
            </div>
            <div className="text-right">
              <span className="text-[10px] text-slate-400 font-bold uppercase block">Total Kewajiban</span>
              <span className="font-black text-rose-600 text-base">{formatRupiah(data.totalNominal)}</span>
              <span className="text-[10px] text-rose-700 font-bold block">{data.bulanMenunggak.length} Bulan Iuran</span>
            </div>
          </div>

          {/* Rincian Bulan yang Belum Bayar */}
          <div>
            <label className="block font-bold text-slate-600 mb-1">Daftar Periode Bulan yang Belum Disetor:</label>
            <div className="bg-amber-50/60 border border-amber-200 rounded-xl p-3 flex flex-wrap gap-1.5 max-h-28 overflow-y-auto">
              {data.bulanMenunggak.map((b, idx) => (
                <span key={idx} className="px-2 py-0.5 bg-white text-amber-900 font-bold text-[10px] rounded-md border border-amber-300">
                  {b}
                </span>
              ))}
            </div>
          </div>

          {/* Info Rekening BCA & QRIS Resmi */}
          <div className="bg-emerald-50/80 p-4 rounded-2xl border border-emerald-200 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="font-bold text-xs text-emerald-950 flex items-center space-x-1.5">
                <CreditCard className="w-4 h-4 text-emerald-700" />
                <span>Rekening Tujuan Pembayaran Resmi:</span>
              </span>
              <button
                type="button"
                onClick={handleCopyRekening}
                className="inline-flex items-center space-x-1 px-2.5 py-1 bg-white hover:bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-lg text-[10px] font-bold transition-all shadow-2xs"
              >
                {copiedRek ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-emerald-600" />}
                <span>{copiedRek ? 'Tersalin!' : 'Salin Rekening'}</span>
              </button>
            </div>

            <div className="bg-white p-3 rounded-xl border border-emerald-200 flex justify-between items-center text-xs">
              <div>
                <p className="text-[10px] text-slate-400 font-bold uppercase">Bank BCA</p>
                <p className="font-mono font-black text-slate-900 text-sm tracking-wider">{REK_BCA}</p>
                <p className="text-[11px] text-slate-600 font-medium">a.n. <strong className="text-slate-900">{NAMA_BENDAHARA}</strong> (Bendahara)</p>
              </div>
              <button
                type="button"
                onClick={() => setShowQrisPreview(true)}
                className="flex flex-col items-center justify-center p-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 transition-colors"
                title="Lihat QRIS"
              >
                <QrCode className="w-6 h-6 text-emerald-700" />
                <span className="text-[9px] font-bold mt-0.5">Lihat QRIS</span>
              </button>
            </div>
          </div>

          {/* Pratinjau Teks Pesan WhatsApp */}
          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="font-bold text-slate-600">Pratinjau Teks Pesan Santun:</label>
              <button
                type="button"
                onClick={handleCopyPesan}
                className="text-[10px] text-blue-600 hover:underline font-bold flex items-center space-x-0.5"
              >
                {copiedPesan ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                <span>{copiedPesan ? 'Pesan Tersalin!' : 'Salin Teks'}</span>
              </button>
            </div>
            <textarea
              readOnly
              rows={4}
              value={generateWhatsAppMessage()}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono text-[10px] text-slate-700 leading-relaxed select-all"
            />
          </div>
        </div>

        {/* Footer Tombol Aksi */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-between items-center shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-white border border-slate-300 text-slate-700 hover:bg-slate-100 rounded-xl text-xs font-bold transition-colors"
          >
            Tutup
          </button>

          <button
            type="button"
            onClick={handleKirimWhatsApp}
            className="inline-flex items-center space-x-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black shadow-md shadow-emerald-700/20 transition-all uppercase tracking-wider"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Kirim ke WhatsApp Warga</span>
          </button>
        </div>
      </div>

      {/* Modal Pratinjau QRIS Kas Paguyuban */}
      {showQrisPreview && (
        <div className="fixed inset-0 bg-slate-950/90 z-[100] flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-sm w-full p-5 space-y-3 text-center border shadow-2xl">
            <div className="flex justify-between items-center border-b pb-2">
              <h4 className="font-bold text-xs text-slate-800">QRIS Resmi Kas Paguyuban Beryl</h4>
              <button onClick={() => setShowQrisPreview(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="bg-slate-50 p-2 rounded-2xl border flex items-center justify-center">
              <img 
                src={QRIS_IMAGE_URL} 
                alt="QRIS Pembayaran Kas Paguyuban Cluster Beryl"
                className="max-h-72 w-auto object-contain rounded-xl shadow-xs"
              />
            </div>
            <p className="text-[11px] text-slate-500">Bisa di-scan menggunakan seluruh aplikasi m-Banking & e-Wallet (BCA, Mandiri, BRI, GoPay, OVO, Dana).</p>
            <button
              type="button"
              onClick={() => setShowQrisPreview(false)}
              className="w-full py-2 bg-slate-900 text-white text-xs font-bold rounded-xl"
            >
              Tutup QRIS
            </button>
          </div>
        </div>
      )}
    </div>
  );
};