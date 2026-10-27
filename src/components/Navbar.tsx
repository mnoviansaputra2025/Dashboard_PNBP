import React from 'react';
import { User } from 'firebase/auth';
import {
  RefreshCw,
  Sheet,
  PlusCircle,
  LogOut,
  Radio,
  FileSpreadsheet,
} from 'lucide-react';
import { SyncStatus } from '../types/pnbp';

interface NavbarProps {
  user: User | null;
  syncStatus: SyncStatus;
  isLoggingIn: boolean;
  onLogin: () => void;
  onLogout: () => void;
  onManualSync: () => void;
  onOpenSheetsModal: () => void;
  onOpenAddModal: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  user,
  syncStatus,
  isLoggingIn,
  onLogin,
  onLogout,
  onManualSync,
  onOpenSheetsModal,
  onOpenAddModal,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-slate-900/90 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-800 text-white shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20 gap-4">
          {/* Logo & Agency Title */}
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-700 flex items-center justify-center shadow-sm shadow-emerald-500/20 text-white shrink-0 border border-emerald-400/20">
              <FileSpreadsheet className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h1 className="text-base sm:text-lg font-bold text-slate-100 tracking-tight truncate">
                  Data Capaian Kinerja PNBP
                </h1>
                <span className="hidden md:inline text-xs text-emerald-400 font-medium">
                  · Tahun Anggaran 2026
                </span>
              </div>
              <p className="text-xs text-slate-400 hidden sm:block truncate">
                Monitoring Penerimaan Negara Bukan Pajak &amp; Sinkronisasi Google Sheets
              </p>
            </div>
          </div>

          {/* Right Action Items */}
          <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
            {/* Auto-Sync Status Indicator */}
            <div className="hidden lg:flex items-center gap-2.5 px-3 py-1.5 rounded-xl bg-slate-800/70 border border-slate-700/60 text-xs">
              <span className="relative flex h-2 w-2">
                <span
                  className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                    syncStatus.isSyncing ? 'bg-amber-400' : 'bg-emerald-400'
                  }`}
                />
                <span
                  className={`relative inline-flex rounded-full h-2 w-2 ${
                    syncStatus.isSyncing ? 'bg-amber-500' : 'bg-emerald-500'
                  }`}
                />
              </span>
              <div className="flex flex-col">
                <span className="text-[11px] font-medium text-slate-200 flex items-center gap-1.5">
                  {syncStatus.isSyncing ? (
                    <>
                      <RefreshCw className="w-3 h-3 animate-spin text-amber-400" />
                      <span>Sinkronisasi...</span>
                    </>
                  ) : (
                    <>
                      <Radio className="w-3 h-3 text-emerald-400" />
                      <span>Auto-Sync Aktif ({syncStatus.syncIntervalSec}d)</span>
                    </>
                  )}
                </span>
                <span className="text-[10px] text-slate-400 truncate max-w-[120px]">
                  Tab: {syncStatus.sheetName}
                </span>
              </div>
            </div>

            {/* Sync Now Button */}
            <button
              onClick={onManualSync}
              disabled={syncStatus.isSyncing}
              aria-label="Sinkronkan data sekarang"
              title="Perbarui data dari Google Sheets sekarang"
              className="px-3 py-2 text-xs font-semibold rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-200 border border-slate-700 hover:border-slate-600 transition flex items-center gap-1.5 disabled:opacity-60 cursor-pointer shadow-xs"
            >
              <RefreshCw
                className={`w-3.5 h-3.5 text-emerald-400 ${syncStatus.isSyncing ? 'animate-spin' : ''}`}
              />
              <span className="hidden sm:inline">Sync Data</span>
            </button>

            {/* Sheets Source Button */}
            <button
              onClick={onOpenSheetsModal}
              aria-label="Konfigurasi Google Sheets API"
              title="Hubungkan Google Sheets"
              className="px-3 py-2 text-xs font-semibold rounded-xl bg-teal-950/60 hover:bg-teal-900/70 text-teal-300 border border-teal-800/60 hover:border-teal-700 transition flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <Sheet className="w-3.5 h-3.5 text-teal-400" />
              <span className="hidden sm:inline">Sumber Sheets</span>
            </button>

            {/* Add Record Button */}
            <button
              onClick={onOpenAddModal}
              aria-label="Tambah transaksi PNBP baru"
              className="px-3 sm:px-3.5 py-2 text-xs font-semibold rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white transition flex items-center gap-1.5 cursor-pointer shadow-xs shadow-emerald-900/30"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Tambah Data</span>
            </button>

            {/* Google Authentication */}
            {user ? (
              <div className="flex items-center gap-2 pl-2 border-l border-slate-800">
                <div
                  className="w-8 h-8 rounded-full bg-emerald-700/80 border border-emerald-500/40 flex items-center justify-center text-xs font-bold text-white overflow-hidden shadow-xs"
                  title={user.email || user.displayName || 'Akun Google'}
                >
                  {user.photoURL ? (
                    <img src={user.photoURL} alt="User Avatar" className="w-full h-full object-cover" />
                  ) : (
                    (user.displayName?.[0] || user.email?.[0] || 'U').toUpperCase()
                  )}
                </div>
                <button
                  onClick={onLogout}
                  aria-label="Keluar dari akun Google"
                  title="Keluar akun"
                  className="p-2 rounded-xl text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition cursor-pointer"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                onClick={onLogin}
                disabled={isLoggingIn}
                aria-label="Sign in with Google"
                className="px-3 py-2 text-xs font-semibold rounded-xl bg-white text-slate-800 hover:bg-slate-100 transition shadow-xs flex items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                <svg className="w-3.5 h-3.5" viewBox="0 0 48 48">
                  <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
                  <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
                  <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
                  <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
                </svg>
                <span className="hidden sm:inline">Google Login</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
