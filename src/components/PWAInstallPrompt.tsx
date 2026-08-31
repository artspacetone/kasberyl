// src/components/PWAInstallPrompt.tsx
import React, { useState, useEffect } from 'react';
import { Download, X, Smartphone } from 'lucide-react';

export const PWAInstallPrompt: React.FC = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showPrompt, setShowPrompt] = useState(false);

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      // Tampilkan banner hanya jika belum pernah ditutup
      const dismissed = localStorage.getItem('beryl_pwa_dismissed');
      if (!dismissed) {
        setShowPrompt(true);
      }
    };

    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setShowPrompt(false);
    }
    setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    localStorage.setItem('beryl_pwa_dismissed', 'true');
  };

  if (!showPrompt) return null;

  return (
    <aside aria-label="Instalasi Aplikasi" className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:max-w-sm z-50 bg-slate-900 text-white p-4 rounded-3xl shadow-2xl border border-slate-700 flex items-start space-x-3 animate-in slide-in-from-bottom duration-300">
      <div className="w-10 h-10 rounded-2xl bg-emerald-600 flex items-center justify-center font-bold text-white shrink-0 shadow-lg shadow-emerald-900/40">
        <Smartphone className="w-5 h-5" />
      </div>
      <div className="flex-1 min-w-0">
        <h4 className="font-bold text-xs text-white">Pasang Aplikasi di HP</h4>
        <p className="text-[11px] text-slate-300 mt-0.5 leading-snug">
          Tambahkan Warga Beryl ke layar utama HP Anda untuk akses instan tanpa membuka browser.
        </p>
        <div className="flex items-center space-x-2 mt-2.5">
          <button
            onClick={handleInstallClick}
            className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center space-x-1"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Install Sekarang</span>
          </button>
          <button
            onClick={handleDismiss}
            className="px-3 py-1.5 text-slate-400 hover:text-white text-xs font-medium"
          >
            Nanti Saja
          </button>
        </div>
      </div>
      <button onClick={handleDismiss} aria-label="Tutup pemberitahuan instalasi" className="text-slate-400 hover:text-white p-1">
        <X className="w-4 h-4" />
      </button>
    </aside>
  );
};