import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Search, X, Check, User, Home, Phone, ChevronDown } from 'lucide-react';
import { Warga } from '../types';
import { formatPhoneNumber62 } from '../lib/utils';

interface WargaSearchSelectProps {
  wargaList: Warga[];
  selectedId: number | string | null;
  onSelect: (warga: Warga | null) => void;
  label?: string;
  placeholder?: string;
  required?: boolean;
}

export const WargaSearchSelect: React.FC<WargaSearchSelectProps> = ({
  wargaList,
  selectedId,
  onSelect,
  label = "Pilih Warga / Unit",
  placeholder = "Ketik Nama, Blok (A1-01 / 01), No HP, atau No Urut...",
  required = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Cari objek warga terpilih
  const selectedWarga = useMemo(() => {
    if (!selectedId) return null;
    return wargaList.find(w => String(w.id_warga) === String(selectedId)) || null;
  }, [wargaList, selectedId]);

  // Tutup dropdown jika klik di luar komponen
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Filter pencarian multi-kriteria: Nama, Blok/Nomor, No HP, No Urut/ID
  const filteredList = useMemo(() => {
    const q = query.toLowerCase().trim().replace(/[#/\\-]/g, '');
    if (!q) return wargaList;

    return wargaList.filter((w, idx) => {
      const nama = (w.nama_lengkap || '').toLowerCase();
      const blok = (w.id_rumah || '').toLowerCase().replace(/[#/\\-]/g, '');
      const rawBlok = (w.id_rumah || '').toLowerCase();
      const hp = (w.no_hp || '').replace(/\D/g, '');
      const noUrut = String(idx + 1);
      const idWarga = String(w.id_warga);
      const status = (w.status_warga || '').toLowerCase();

      return (
        nama.includes(query.toLowerCase()) ||
        blok.includes(q) ||
        rawBlok.includes(query.toLowerCase()) ||
        hp.includes(q) ||
        noUrut === q ||
        idWarga === q ||
        status.includes(query.toLowerCase())
      );
    });
  }, [wargaList, query]);

  const handleSelectWarga = (w: Warga) => {
    onSelect(w);
    setIsOpen(false);
    setQuery('');
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onSelect(null);
    setQuery('');
  };

  return (
    <div className="space-y-1 relative" ref={containerRef}>
      {label && (
        <label className="block text-xs font-bold text-slate-600 mb-1 flex items-center justify-between">
          <span>{label} {required && <span className="text-rose-500">*</span>}</span>
          {selectedWarga && (
            <span className="text-[10px] text-emerald-600 font-bold uppercase tracking-wider">
              Terpilih: Unit {selectedWarga.id_rumah}
            </span>
          )}
        </label>
      )}

      {/* Trigger Box / Input Aktif */}
      <div
        onClick={() => {
          setIsOpen(!isOpen);
          setTimeout(() => inputRef.current?.focus(), 100);
        }}
        className={`w-full p-2.5 bg-white border rounded-xl flex items-center justify-between cursor-pointer transition-all ${
          isOpen 
            ? 'border-emerald-500 ring-2 ring-emerald-500/20 shadow-xs' 
            : 'border-slate-200 hover:border-slate-300 shadow-2xs'
        }`}
      >
        {selectedWarga ? (
          <div className="flex items-center space-x-2.5 overflow-hidden text-left flex-1 min-w-0 pr-2">
            <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 font-mono font-bold text-[11px] rounded-md shrink-0 border border-emerald-200">
              {selectedWarga.id_rumah || '-'}
            </span>
            <div className="truncate">
              <span className="font-bold text-slate-800 text-xs truncate block leading-tight">
                {selectedWarga.nama_lengkap}
              </span>
              <span className="text-[10px] text-slate-400 font-mono">
                WA: {formatPhoneNumber62(selectedWarga.no_hp)} • {selectedWarga.status_warga || 'Warga'}
              </span>
            </div>
          </div>
        ) : (
          <div className="flex items-center space-x-2 text-slate-400 text-xs">
            <Search className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span className="truncate">{placeholder}</span>
          </div>
        )}

        <div className="flex items-center space-x-1 shrink-0">
          {selectedWarga && (
            <button
              type="button"
              onClick={handleClear}
              className="p-1 hover:bg-slate-100 rounded-md text-slate-400 hover:text-slate-600"
              title="Hapus Pilihan"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
          <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${isOpen ? 'rotate-180 text-emerald-600' : ''}`} />
        </div>
      </div>

      {/* Dropdown Pencarian & Daftar Warga */}
      {isOpen && (
        <div className="absolute top-full left-0 right-0 z-50 mt-1.5 bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
          {/* Kolom Ketik Pencarian */}
          <div className="p-2.5 border-b border-slate-100 bg-slate-50/80">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="🔍 Ketik nomor blok (A1-01), nama, atau HP..."
                className="w-full pl-9 pr-8 py-2 bg-white border border-slate-200 rounded-xl text-xs outline-none focus:border-emerald-500 font-medium shadow-2xs"
                onClick={(e) => e.stopPropagation()}
              />
              {query && (
                <button
                  type="button"
                  onClick={() => setQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
            <div className="flex items-center justify-between text-[10px] text-slate-400 mt-1.5 px-1">
              <span>Ditemukan: <strong>{filteredList.length}</strong> warga</span>
              <span className="italic">Tips: Ketik "A1", "Adam", atau nomor urut</span>
            </div>
          </div>

          {/* List Scroll Hasil Pencarian */}
          <div className="max-h-56 overflow-y-auto divide-y divide-slate-100 p-1">
            {filteredList.length === 0 ? (
              <div className="p-6 text-center text-slate-400 text-xs">
                Tidak ada warga / unit yang cocok dengan pencarian "<strong>{query}</strong>".
              </div>
            ) : (
              filteredList.map((w, idx) => {
                const isSelected = selectedWarga?.id_warga === w.id_warga;
                return (
                  <div
                    key={w.id_warga}
                    onClick={() => handleSelectWarga(w)}
                    className={`p-2.5 rounded-xl flex items-center justify-between cursor-pointer transition-colors ${
                      isSelected 
                        ? 'bg-emerald-50 text-emerald-900 font-semibold' 
                        : 'hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <div className="flex items-center space-x-3 overflow-hidden min-w-0 pr-2">
                      <span className="w-5 text-[10px] font-mono text-slate-400 text-center shrink-0">
                        {idx + 1}.
                      </span>
                      <span className="px-2 py-1 bg-slate-100 text-slate-800 font-mono font-bold text-[11px] rounded-lg border border-slate-200 shrink-0">
                        {w.id_rumah || '-'}
                      </span>
                      <div className="truncate text-left">
                        <p className="font-bold text-xs text-slate-900 truncate leading-tight">
                          {w.nama_lengkap}
                        </p>
                        <p className="text-[10px] text-slate-400 font-mono">
                          {formatPhoneNumber62(w.no_hp)} • {w.status_warga || 'Warga'} ({w.peran_keluarga || 'KK'})
                        </p>
                      </div>
                    </div>

                    <div className="shrink-0 flex items-center space-x-1.5">
                      <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase ${
                        (w.status_warga || '').toLowerCase().includes('menetap') ? 'bg-emerald-100 text-emerald-700' :
                        (w.status_warga || '').toLowerCase().includes('sewa') ? 'bg-blue-100 text-blue-700' :
                        'bg-slate-100 text-slate-600'
                      }`}>
                        {w.status_warga || 'Menetap'}
                      </span>
                      {isSelected && (
                        <div className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center">
                          <Check className="w-3 h-3" />
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
};