// src/pages/DataImport.tsx
import React, { useState } from 'react';
import { 
  FileSpreadsheet, CheckCircle2, AlertCircle, Loader2, 
  Zap, Download, RefreshCw, Database, Upload, FileJson, ArrowDownToLine 
} from 'lucide-react';
import { processMasterExcelImport } from '../utils/masterImporter';
import { downloadMasterTemplateExcel } from '../utils/templateGenerator';
import { downloadJSONBackupFile, restoreFromJSONFile } from '../utils/backupRestore';
import { Pengguna } from '../types';

export const DataImport: React.FC<{ user: Pengguna; onImportSuccess?: () => void }> = ({ user, onImportSuccess }) => {
  const [file, setFile] = useState<File | null>(null);
  const [importing, setImporting] = useState(false);
  const [progressMsg, setProgressMsg] = useState('');
  const [progressPct, setProgressPct] = useState(0);
  const [result, setResult] = useState<any>(null);
  const [errorMsg, setErrorMsg] = useState('');

  const [restoreFile, setRestoreFile] = useState<File | null>(null);
  const [restoring, setRestoring] = useState(false);
  const [restoreSuccess, setRestoreSuccess] = useState(false);

  const isGuest = user.id_pengguna === 0 || user.peran === 'Warga';

  const handleStartImport = async () => {
    if (isGuest || !file) return;
    setImporting(true);
    setErrorMsg('');
    try {
      const res = await processMasterExcelImport(file, user.id_pengguna, (msg, pct) => {
        setProgressMsg(msg);
        setProgressPct(pct);
      });
      setResult(res);
      if (onImportSuccess) {
        setTimeout(() => onImportSuccess(), 1500);
      }
    } catch (err: any) {
      setErrorMsg('Gagal impor Excel: ' + err.message);
    } finally {
      setImporting(false);
    }
  };

  const handleRestoreJSON = async () => {
    if (isGuest || !restoreFile) return;
    if (!confirm('PERHATIAN: Restore akan menggantikan seluruh database aktif dengan data file JSON ini. Lanjutkan?')) return;

    setRestoring(true);
    setErrorMsg('');
    try {
      await restoreFromJSONFile(restoreFile);
      setRestoreSuccess(true);
      if (onImportSuccess) {
        setTimeout(() => onImportSuccess(), 1500);
      }
    } catch (err: any) {
      setErrorMsg('Gagal restore JSON: ' + err.message);
    } finally {
      setRestoring(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Master Data Import & Backup Restore</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Kelola data massal: 1x Import Excel (5 Sheet), Unduh Template, Cadangkan (*Backup*), dan Pulihkan (*Restore*).
          </p>
        </div>
        <button
          onClick={downloadMasterTemplateExcel}
          className="flex items-center space-x-2 px-4 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold shadow-sm transition-all"
        >
          <Download className="w-4 h-4" />
          <span>Unduh Template Excel 5 Sheet (.xlsx)</span>
        </button>
      </div>

      {isGuest && (
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl text-xs font-medium text-amber-800">
          🔒 <strong>Mode Tamu Aktif:</strong> Fitur import, restore, dan modifikasi data dinonaktifkan. Anda tetap dapat mengunduh Template Excel dan Laporan.
        </div>
      )}

      {/* Bagian 1: 1x Master Import Excel */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 md:p-8 shadow-xs space-y-6">
        <div className="flex items-center space-x-2 border-b pb-3">
          <Zap className="w-5 h-5 text-emerald-600" />
          <h3 className="font-bold text-sm text-slate-900">1x Import Master Excel (Auto Reset & Clean Slate)</h3>
        </div>

        <div className="bg-emerald-50/60 border border-emerald-200 rounded-2xl p-4 flex items-start space-x-3 text-xs text-emerald-900">
          <RefreshCw className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
          <div>
            <strong>Pembersihan Otomatis:</strong> Setiap 1x upload akan membersihkan database lama agar tidak terjadi duplikasi data. Sistem otomatis mengisi Data Warga, Kas Rp 10rb (Jan–Des), Kas Acara (termasuk Sponsor PMM & Warga), Infaq Majelis, dan Pengeluaran.
          </div>
        </div>

        <label className={`border-2 border-dashed rounded-2xl p-8 flex flex-col items-center justify-center transition-all ${
          isGuest ? 'opacity-50 cursor-not-allowed bg-slate-50 border-slate-200' : 'border-emerald-300 hover:border-emerald-500 bg-emerald-50/30 cursor-pointer'
        }`}>
          <FileSpreadsheet className="w-12 h-12 text-emerald-600 mb-3" />
          <span className="text-sm font-bold text-slate-800">{file ? file.name : 'Pilih File Master Excel Anda (.xlsx / .xls)'}</span>
          <span className="text-xs text-slate-400 mt-1">Otomatis membaca sheet: DATABASE, KAS ACARA, INFAQ MAJELIS, PENGELUARAN, & PINJAMAN</span>
          <input type="file" accept=".xlsx,.xls" onChange={(e) => setFile(e.target.files?.[0] || null)} disabled={importing || isGuest} className="hidden" />
        </label>

        {importing && (
          <div className="space-y-2">
            <div className="flex justify-between text-xs font-bold text-slate-600">
              <span>{progressMsg}</span>
              <span>{progressPct}%</span>
            </div>
            <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
              <div className="h-full bg-emerald-600 transition-all duration-300" style={{ width: `${progressPct}%` }} />
            </div>
          </div>
        )}

        {errorMsg && (
          <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl text-xs text-rose-700 flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {result && (
          <div className="p-5 bg-emerald-50 border border-emerald-200 rounded-2xl space-y-3">
            <div className="flex items-center space-x-2 text-emerald-800 font-bold text-sm">
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              <span>Import Master Selesai! Data Masuk ke Seluruh Modul:</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-center text-xs">
              <div className="bg-white p-3 rounded-xl border border-emerald-100">
                <p className="font-black text-lg text-slate-800">{result.totalWarga}</p>
                <p className="text-slate-500">Warga Beryl</p>
              </div>
              <div className="bg-white p-3 rounded-xl border border-emerald-100">
                <p className="font-black text-lg text-emerald-600">{result.totalKas}</p>
                <p className="text-slate-500">Kas Rp 10rb</p>
              </div>
              <div className="bg-white p-3 rounded-xl border border-emerald-100">
                <p className="font-black text-lg text-purple-600">{result.totalAcara || 0}</p>
                <p className="text-slate-500">Dana Acara</p>
              </div>
              <div className="bg-white p-3 rounded-xl border border-emerald-100">
                <p className="font-black text-lg text-teal-600">{result.totalMajelis}</p>
                <p className="text-slate-500">Infaq Majelis</p>
              </div>
              <div className="bg-white p-3 rounded-xl border border-emerald-100">
                <p className="font-black text-lg text-rose-600">{result.totalPengeluaran}</p>
                <p className="text-slate-500">Pengeluaran</p>
              </div>
            </div>
          </div>
        )}

        {!isGuest && (
          <div className="flex justify-end">
            <button 
              onClick={handleStartImport} 
              disabled={!file || importing} 
              className="flex items-center space-x-2 px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-md disabled:opacity-50 transition-all"
            >
              {importing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
              <span>{importing ? 'Sedang Memproses...' : 'Mulai 1x Import Bersih ke Database'}</span>
            </button>
          </div>
        )}
      </div>

      {/* Bagian 2: Backup & Restore JSON Database */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Backup Card */}
        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-4">
          <div className="flex items-center space-x-2.5">
            <div className="w-9 h-9 bg-blue-100 text-blue-700 rounded-xl flex items-center justify-center">
              <ArrowDownToLine className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-bold text-sm text-slate-900">Backup Database (JSON)</h4>
              <p className="text-[11px] text-slate-400">Unduh seluruh snapshot data sistem.</p>
            </div>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed">
            Menyimpan cadangan instan seluruh data warga, transaksi kas, dana acara, pengeluaran, dan pinjaman ke file JSON.
          </p>
          <button
            onClick={downloadJSONBackupFile}
            className="w-full flex items-center justify-center space-x-2 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-xs transition-all"
          >
            <FileJson className="w-4 h-4" />
            <span>Unduh File Cadangan JSON</span>
          </button>
        </div>

        {/* Restore Card */}
        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-4">
          <div className="flex items-center space-x-2.5">
            <div className="w-9 h-9 bg-amber-100 text-amber-700 rounded-xl flex items-center justify-center">
              <Upload className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-bold text-sm text-slate-900">Restore Database (JSON)</h4>
              <p className="text-[11px] text-slate-400">Pulihkan data dari file cadangan JSON.</p>
            </div>
          </div>
          
          <input
            type="file"
            accept=".json"
            onChange={(e) => setRestoreFile(e.target.files?.[0] || null)}
            disabled={isGuest || restoring}
            className="w-full text-xs text-slate-500 file:mr-2 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-slate-100 file:text-slate-700 hover:file:bg-slate-200 cursor-pointer"
          />

          {restoreSuccess && (
            <p className="text-xs text-emerald-600 font-bold flex items-center space-x-1">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Database berhasil dipulihkan secara penuh!</span>
            </p>
          )}

          <button
            onClick={handleRestoreJSON}
            disabled={!restoreFile || restoring || isGuest}
            className="w-full flex items-center justify-center space-x-2 py-2.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold shadow-xs disabled:opacity-50 transition-all"
          >
            {restoring ? <Loader2 className="w-4 h-4 animate-spin" /> : <Database className="w-4 h-4" />}
            <span>{restoring ? 'Memulihkan Data...' : 'Pulihkan Database'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default DataImport;