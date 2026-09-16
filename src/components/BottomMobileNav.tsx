// src/components/BottomMobileNav.tsx
import React from 'react';
import { 
  LayoutDashboard, Users, HeartHandshake, 
  Menu, Calendar, Landmark 
} from 'lucide-react';
import { Pengguna } from '../types';

interface BottomMobileNavProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onOpenMenu: () => void;
  currentUser: Pengguna;
}

export const BottomMobileNav: React.FC<BottomMobileNavProps> = ({
  activeTab,
  setActiveTab,
  onOpenMenu,
}) => {
  return (
    <nav 
      aria-label="Navigasi Bawah Ponsel"
      className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 shadow-2xl px-2 py-1.5 flex items-center justify-around"
    >
      <button
        onClick={() => setActiveTab('dashboard')}
        className={`flex flex-col items-center justify-center flex-1 py-1 text-[10px] font-bold transition-colors ${
          activeTab === 'dashboard' ? 'text-emerald-700' : 'text-slate-400 hover:text-slate-600'
        }`}
      >
        <LayoutDashboard className="w-5 h-5 mb-0.5" />
        <span>Balance</span>
      </button>

      <button
        onClick={() => setActiveTab('warga')}
        className={`flex flex-col items-center justify-center flex-1 py-1 text-[10px] font-bold transition-colors ${
          activeTab === 'warga' ? 'text-emerald-700' : 'text-slate-400 hover:text-slate-600'
        }`}
      >
        <Users className="w-5 h-5 mb-0.5" />
        <span>Warga</span>
      </button>

      <button
        onClick={() => setActiveTab('infaq_bulanan')}
        className={`flex flex-col items-center justify-center flex-1 py-1 text-[10px] font-bold transition-colors ${
          activeTab === 'infaq_bulanan' ? 'text-emerald-700' : 'text-slate-400 hover:text-slate-600'
        }`}
      >
        <HeartHandshake className="w-5 h-5 mb-0.5" />
        <span>Kas 10rb</span>
      </button>

      <button
        onClick={() => setActiveTab('dana_acara')}
        className={`flex flex-col items-center justify-center flex-1 py-1 text-[10px] font-bold transition-colors ${
          activeTab === 'dana_acara' ? 'text-purple-700' : 'text-slate-400 hover:text-slate-600'
        }`}
      >
        <Calendar className="w-5 h-5 mb-0.5" />
        <span>Acara</span>
      </button>

      <button
        onClick={() => setActiveTab('infaq_majelis')}
        className={`flex flex-col items-center justify-center flex-1 py-1 text-[10px] font-bold transition-colors ${
          activeTab === 'infaq_majelis' ? 'text-teal-700' : 'text-slate-400 hover:text-slate-600'
        }`}
      >
        <Landmark className="w-5 h-5 mb-0.5" />
        <span>Majelis</span>
      </button>

      <button
        onClick={onOpenMenu}
        className="flex flex-col items-center justify-center flex-1 py-1 text-[10px] font-bold text-slate-600 hover:text-emerald-700"
      >
        <Menu className="w-5 h-5 mb-0.5" />
        <span>Menu</span>
      </button>
    </nav>
  );
};