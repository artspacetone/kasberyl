// src/components/ImageViewerModal.tsx
import React from 'react';
import { X, ExternalLink, Image as ImageIcon } from 'lucide-react';

interface ImageViewerModalProps {
  url: string | null;
  title?: string;
  onClose: () => void;
}

export const ImageViewerModal: React.FC<ImageViewerModalProps> = ({ url, title = 'Bukti Transaksi / Nota', onClose }) => {
  if (!url) return null;

  const isDirectImage = /\.(jpg|jpeg|png|webp|avif|gif)($|\?)/i.test(url) || url.includes('supabase.co/storage') || url.includes('cloudinary');

  return (
    <div className="fixed inset-0 bg-slate-950/80 z-[80] flex items-center justify-center p-4 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl border border-slate-200">
        <div className="bg-slate-900 text-white px-5 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <ImageIcon className="w-4 h-4 text-emerald-400" />
            <h3 className="font-bold text-xs uppercase tracking-wider">{title}</h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 bg-slate-100 flex flex-col items-center justify-center min-h-[260px] max-h-[70vh] overflow-auto">
          {isDirectImage ? (
            <img 
              src={url} 
              alt={title} 
              className="max-h-[60vh] max-w-full rounded-xl object-contain shadow-xs"
              onError={(e) => {
                // Fallback jika bukan direct image link
                (e.target as HTMLElement).style.display = 'none';
              }}
            />
          ) : (
            <div className="text-center p-6 space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto">
                <ExternalLink className="w-6 h-6" />
              </div>
              <p className="font-bold text-xs text-slate-800">Tautan Berkas Eksternal</p>
              <p className="text-[11px] text-slate-500 max-w-xs break-all font-mono">{url}</p>
            </div>
          )}
        </div>

        <div className="p-4 bg-white border-t border-slate-200 flex items-center justify-between">
          <a
            href={url}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center space-x-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span>Buka di Tab Baru</span>
          </a>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};