import React, { useState } from 'react';
import {
  X,
  Sheet,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Link2,
  Clock,
  RotateCcw,
  Code2,
  Copy,
  Check,
  ExternalLink,
} from 'lucide-react';
import { SyncStatus } from '../types/pnbp';
import { extractSpreadsheetId, GOOGLE_APPS_SCRIPT_CODE } from '../services/sheetsApi';

interface GoogleSheetsModalProps {
  isOpen: boolean;
  syncStatus: SyncStatus;
  onClose: () => void;
  onSaveConfig: (spreadsheetId: string, sheetName: string, intervalSec: number) => Promise<void>;
  onResetToSeedData: () => void;
}

export const GoogleSheetsModal: React.FC<GoogleSheetsModalProps> = ({
  isOpen,
  syncStatus,
  onClose,
  onSaveConfig,
  onResetToSeedData,
}) => {
  const [activeTab, setActiveTab] = useState<'config' | 'code'>('config');
  const [sheetInput, setSheetInput] = useState(syncStatus.spreadsheetId);
  const [tabName, setTabName] = useState(syncStatus.sheetName || 'Row_Data_PNBP');
  const [interval, setInterval] = useState(syncStatus.syncIntervalSec || 30);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const quickTabs = ['Row_Data_PNBP', 'Capaian_NKO', 'Capaian_IK', 'Capaian_Bulanan', 'Target_Bulanan'];

  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(GOOGLE_APPS_SCRIPT_CODE);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch (err) {
      console.error('Failed to copy', err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setIsLoading(true);

    try {
      const cleanId = extractSpreadsheetId(sheetInput);
      await onSaveConfig(cleanId, tabName.trim(), interval);
      onClose();
    } catch (err: any) {
      setErrorMessage(err.message || 'Gagal menghubungkan ke Google Sheets');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm">
      <div className="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl p-6 sm:p-7 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-teal-500/10 text-teal-600 dark:text-teal-400 flex items-center justify-center">
              <Sheet className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Integrasi Google Sheets &amp; Apps Script
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Pilih metode koneksi via Google OAuth API atau Google Apps Script Web App
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Tutup modal"
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-2 mt-4 p-1 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-semibold">
          <button
            onClick={() => setActiveTab('config')}
            className={`flex-1 py-2 px-3 rounded-lg transition flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === 'config'
                ? 'bg-white dark:bg-slate-700 text-teal-700 dark:text-teal-300 shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            <Sheet className="w-4 h-4 text-teal-500" />
            <span>Pengaturan Koneksi</span>
          </button>
          <button
            onClick={() => setActiveTab('code')}
            className={`flex-1 py-2 px-3 rounded-lg transition flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === 'code'
                ? 'bg-white dark:bg-slate-700 text-teal-700 dark:text-teal-300 shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            <Code2 className="w-4 h-4 text-emerald-500" />
            <span>Kode Google Apps Script (.gs)</span>
          </button>
        </div>

        {/* TAB 1: Config */}
        {activeTab === 'config' && (
          <form onSubmit={handleSubmit} className="mt-4 space-y-4 overflow-y-auto pr-1">
            {errorMessage && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            <div>
              <label
                htmlFor="spreadsheet-id-input"
                className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5"
              >
                <Link2 className="w-3.5 h-3.5 text-teal-500" />
                ID Spreadsheet, URL Google Sheets, atau Web App Apps Script
              </label>
              <input
                id="spreadsheet-id-input"
                type="text"
                placeholder="Contoh: https://docs.google.com/spreadsheets/d/... atau https://script.google.com/macros/s/.../exec"
                value={sheetInput}
                onChange={(e) => setSheetInput(e.target.value)}
                className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500 font-mono"
              />
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                Dapat berupa URL spreadsheet Google Sheets Anda atau Web App URL dari Google Apps Script.
              </p>
            </div>

            <div>
              <label
                htmlFor="tab-name-input"
                className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5"
              >
                Nama Lembar Kerja (Sheet Tab)
              </label>
              <input
                id="tab-name-input"
                type="text"
                placeholder="Row_Data_PNBP"
                value={tabName}
                onChange={(e) => setTabName(e.target.value)}
                className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                required
              />
              <div className="flex flex-wrap items-center gap-1.5 mt-2">
                <span className="text-[11px] text-slate-400">Pilih tab dokumen:</span>
                {quickTabs.map((tab) => (
                  <button
                    key={tab}
                    type="button"
                    onClick={() => setTabName(tab)}
                    className={`text-[10px] px-2 py-0.5 rounded-lg border transition cursor-pointer ${
                      tabName === tab
                        ? 'bg-teal-500/20 text-teal-600 dark:text-teal-300 border-teal-500/40 font-semibold'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:border-slate-400'
                    }`}
                  >
                    {tab}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label
                htmlFor="sync-interval-select"
                className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5"
              >
                <Clock className="w-3.5 h-3.5 text-teal-500" />
                Interval Auto-Sync Real-time
              </label>
              <select
                id="sync-interval-select"
                value={interval}
                onChange={(e) => setInterval(Number(e.target.value))}
                className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500 cursor-pointer"
              >
                <option value={10}>Real-time Cepat (Setiap 10 Detik)</option>
                <option value={30}>Standar (Setiap 30 Detik)</option>
                <option value={60}>Setiap 1 Menit</option>
                <option value={300}>Setiap 5 Menit</option>
                <option value={0}>Nonaktif (Hanya Sinkronisasi Manual)</option>
              </select>
            </div>

            <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => {
                  onResetToSeedData();
                  onClose();
                }}
                className="text-xs text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 flex items-center gap-1.5 cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Reset ke Data Awal
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="px-4 py-2 text-xs font-semibold rounded-xl bg-teal-600 hover:bg-teal-500 text-white transition flex items-center gap-2 cursor-pointer shadow-md shadow-teal-600/20 disabled:opacity-50"
                >
                  {isLoading ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      Menghubungkan...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Simpan &amp; Sinkronkan
                    </>
                  )}
                </button>
              </div>
            </div>
          </form>
        )}

        {/* TAB 2: Google Apps Script (.gs) Code */}
        {activeTab === 'code' && (
          <div className="mt-4 space-y-4 overflow-y-auto pr-1 flex-1">
            <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-800 dark:text-emerald-300 text-xs">
              <div className="font-bold flex items-center justify-between">
                <span>Cara Menggunakan Kode Ini di Google Sheets:</span>
                <button
                  onClick={handleCopyCode}
                  className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-medium flex items-center gap-1.5 transition cursor-pointer shadow-sm text-xs"
                >
                  {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? 'Tersalin!' : 'Salin Kode .gs'}</span>
                </button>
              </div>
              <ol className="list-decimal list-inside space-y-1 mt-2 text-[11px] text-slate-700 dark:text-slate-300">
                <li>Buka Google Sheets dokumen Anda (<strong>Data_Capaian_Kinerja</strong>).</li>
                <li>Klik menu <strong>Extensions (Ekstensi)</strong> &gt; <strong>Apps Script</strong>.</li>
                <li>Hapus kode bawaan di file <code>Code.gs</code>, lalu paste kode di bawah ini.</li>
                <li>Klik <strong>Save (Simpan)</strong>.</li>
                <li>Klik tombol biru <strong>Deploy</strong> (kanan atas) &gt; <strong>New deployment</strong>.</li>
                <li>Pilih tipe <strong>Web app</strong>, atur <em>Who has access</em> ke <strong>Anyone (Siapa saja)</strong>, lalu klik <strong>Deploy</strong>.</li>
                <li>Salin <strong>Web app URL</strong> yang dihasilkan ke kolom URL di tab <em>Pengaturan Koneksi</em>!</li>
              </ol>
            </div>

            {/* Code Block Container */}
            <div className="relative">
              <pre className="p-4 rounded-2xl bg-slate-900 border border-slate-800 text-slate-200 font-mono text-[11px] overflow-x-auto max-h-[300px] leading-relaxed select-all">
                {GOOGLE_APPS_SCRIPT_CODE}
              </pre>
            </div>

            <div className="flex justify-end pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                onClick={handleCopyCode}
                className="px-4 py-2 text-xs font-semibold rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white transition flex items-center gap-2 cursor-pointer shadow-md shadow-emerald-600/20"
              >
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                <span>{copied ? 'Kode Berhasil Disalin!' : 'Salin Seluruh Kode .gs'}</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
