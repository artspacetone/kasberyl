// src/components/Sidebar.tsx
import React from 'react';
import { 
  LayoutDashboard, Users, HeartHandshake, Calendar, Landmark, 
  ArrowDownCircle, HandCoins, Scale, BookOpen, FileSpreadsheet, 
  X, Shield, Network, UserCog 
} from 'lucide-react';
import { cn } from '../lib/utils';
import { Pengguna } from '../types';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  mobileOpen: boolean;
  setMobileOpen: (open: boolean) => void;
  currentUser: Pengguna;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  mobileOpen,
  setMobileOpen,
  currentUser
}) => {
  const isSuperAdmin = currentUser.peran === 'Super_Admin';

  // SEMUA MODUL TERBUKA UNTUK DILIHAT (VIEW-ONLY PADA MODE WARGA)
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard Balance', icon: LayoutDashboard, show: true },
    { id: 'warga', label: 'Data Warga Beryl', icon: Users, show: true },
    { id: 'infaq_bulanan', label: 'Kas Warga (Rp 10rb)', icon: HeartHandshake, show: true },
    { id: 'dana_acara', label: 'Dana Acara Warga', icon: Calendar, show: true },
    { id: 'infaq_majelis', label: 'Majelis Al Barokah', icon: Landmark, show: true },
    { id: 'pengeluaran', label: 'Pengeluaran Terpadu', icon: ArrowDownCircle, show: true },
    { id: 'pinjaman', label: 'Pinjaman (Qardh)', icon: HandCoins, show: true },
    { id: 'laporan', label: 'Laporan & Balance', icon: Scale, show: true },
    { id: 'keamanan', label: 'Log Keamanan Satpam', icon: Shield, show: true },
    { id: 'organisasi', label: 'Struktur Organisasi', icon: Network, show: true },
    { id: 'pengguna', label: 'Manajemen Akun', icon: UserCog, show: isSuperAdmin },
    { id: 'adart', label: 'AD / ART Paguyuban', icon: BookOpen, show: true },
    { id: 'import', label: '1x Import & Backup', icon: FileSpreadsheet, show: true },
  ];

  return (
    <>
      {mobileOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/70 z-50 lg:hidden backdrop-blur-xs"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <aside className={cn(
        "fixed lg:static top-0 bottom-0 left-0 z-50 w-64 bg-slate-900 text-white flex flex-col transition-transform duration-300 ease-in-out shadow-2xl shrink-0",
        mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
      )}>
        <div className="p-5 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-emerald-600 rounded-2xl flex items-center justify-center font-black text-white text-base shadow-lg shadow-emerald-900/40">
              B
            </div>
            <div>
              <h1 className="font-bold text-sm tracking-tight text-white leading-none">Warga Beryl</h1>
              <p className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider mt-1">Majelis Al Barokah</p>
            </div>
          </div>
          <button 
            onClick={() => setMobileOpen(false)}
            className="lg:hidden p-1 text-slate-400 hover:text-white rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="px-4 py-2.5 bg-slate-950/60 border-b border-slate-800 text-[10px] flex items-center justify-between">
          <span className="text-slate-400 uppercase font-bold">Hak Akses:</span>
          <span className={cn(
            "px-2 py-0.5 rounded-full font-bold uppercase",
            currentUser.peran === 'Super_Admin' ? 'bg-purple-900/60 text-purple-300 border border-purple-700' :
            currentUser.peran === 'Admin_Keuangan' ? 'bg-emerald-900/60 text-emerald-300 border border-emerald-700' :
            currentUser.peran === 'Admin_Kependudukan' ? 'bg-blue-900/60 text-blue-300 border border-blue-700' :
            currentUser.peran === 'Satpam' ? 'bg-amber-900/60 text-amber-300 border border-amber-700' :
            'bg-emerald-900/60 text-emerald-300 border border-emerald-700'
          )}>
            {currentUser.peran === 'Warga' ? 'Warga (View Only)' : currentUser.peran.replace('_', ' ')}
          </span>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {menuItems.filter(item => item.show).map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  setActiveTab(item.id);
                  setMobileOpen(false);
                }}
                className={cn(
                  "w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all text-left",
                  isActive 
                    ? "bg-emerald-600 text-white shadow-lg shadow-emerald-950/40 translate-x-1" 
                    : "text-slate-300 hover:bg-slate-800/80 hover:text-white"
                )}
              >
                <div className="flex items-center space-x-3">
                  <Icon className={cn("w-4 h-4 shrink-0", isActive ? "text-white" : "text-slate-400")} />
                  <span>{item.label}</span>
                </div>
              </button>
            );
          })}
        </nav>

        <div className="p-4 border-t border-slate-800 text-[10px] text-slate-500 text-center font-medium">
          Cluster Beryl Maja • Transparansi Terbuka
        </div>
      </aside>
    </>
  );
};