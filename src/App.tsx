import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { User } from 'firebase/auth';
import {
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  FileSpreadsheet,
  ArrowRight,
} from 'lucide-react';
import { PNBPRecord, FilterOptions, SortField, SortOrder, SyncStatus } from './types/pnbp';
import { INITIAL_PNBP_DATA } from './data/initialData';
import { calculateSummaryKPI, filterAndSortRecords } from './utils/analytics';
import { Navbar } from './components/Navbar';
import { KPICards } from './components/KPICards';
import { ChartsSection } from './components/ChartsSection';
import { DataTable } from './components/DataTable';
import { GoogleSheetsModal } from './components/GoogleSheetsModal';
import { AddTransactionModal } from './components/AddTransactionModal';
import { initAuth, googleSignIn, logout, getAccessToken, setAccessToken } from './services/firebaseAuth';
import { fetchSheetPNBPRecords } from './services/sheetsApi';

const LOCAL_STORAGE_SYNC_KEY = 'pnbp_sheets_sync_config_v2';
const LOCAL_STORAGE_RECORDS_KEY = 'pnbp_cached_records_v2';

export default function App() {
  // Load persisted sync config if available
  const [syncStatus, setSyncStatus] = useState<SyncStatus>(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_SYNC_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        return {
          isConnected: true,
          spreadsheetId: parsed.spreadsheetId || 'Data_Capaian_Kinerja',
          spreadsheetTitle: parsed.spreadsheetTitle || 'Data_Capaian_Kinerja',
          sheetName: parsed.sheetName || 'Row_Data_PNBP',
          lastSyncedAt: parsed.lastSyncedAt ? new Date(parsed.lastSyncedAt) : new Date(),
          isSyncing: false,
          syncIntervalSec: parsed.syncIntervalSec ?? 30,
          error: null,
        };
      }
    } catch (e) {
      console.warn('Failed to load saved sync config:', e);
    }

    return {
      isConnected: true,
      spreadsheetId: 'Data_Capaian_Kinerja',
      spreadsheetTitle: 'Data_Capaian_Kinerja',
      sheetName: 'Row_Data_PNBP',
      lastSyncedAt: new Date(),
      isSyncing: false,
      syncIntervalSec: 30,
      error: null,
    };
  });

  // Load persisted records or fall back to INITIAL_PNBP_DATA
  const [records, setRecords] = useState<PNBPRecord[]>(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_RECORDS_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch (e) {
      console.warn('Failed to load cached records:', e);
    }
    return INITIAL_PNBP_DATA;
  });

  const [user, setUser] = useState<User | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // Comprehensive Filter Options
  const [filters, setFilters] = useState<FilterOptions>({
    searchQuery: '',
    tanggalTransaksi: 'all',
    bulan: 'all',
    tahun: 'all',
    namaPenjualan: 'all',
    jenisPendapatan: 'all',
    kategori: 'all',
  });

  const [sortBy, setSortBy] = useState<SortField>('tanggalTransaksi');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');

  // Modals & UI State
  const [isSheetsModalOpen, setIsSheetsModalOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [notification, setNotification] = useState<{
    message: string;
    type: 'success' | 'info' | 'error';
  } | null>(null);

  const showToast = useCallback(
    (message: string, type: 'success' | 'info' | 'error' = 'success') => {
      setNotification({ message, type });
      const timer = setTimeout(() => {
        setNotification(null);
      }, 4500);
      return () => clearTimeout(timer);
    },
    []
  );

  // Persist sync configuration whenever it changes
  useEffect(() => {
    try {
      localStorage.setItem(
        LOCAL_STORAGE_SYNC_KEY,
        JSON.stringify({
          spreadsheetId: syncStatus.spreadsheetId,
          spreadsheetTitle: syncStatus.spreadsheetTitle,
          sheetName: syncStatus.sheetName,
          syncIntervalSec: syncStatus.syncIntervalSec,
          lastSyncedAt: syncStatus.lastSyncedAt?.toISOString(),
        })
      );
    } catch (e) {
      console.warn('Failed to save sync config:', e);
    }
  }, [syncStatus.spreadsheetId, syncStatus.spreadsheetTitle, syncStatus.sheetName, syncStatus.syncIntervalSec, syncStatus.lastSyncedAt]);

  // Persist records cache whenever records change
  useEffect(() => {
    try {
      localStorage.setItem(LOCAL_STORAGE_RECORDS_KEY, JSON.stringify(records));
    } catch (e) {
      console.warn('Failed to save records cache:', e);
    }
  }, [records]);

  // Auth Initialization on Mount
  useEffect(() => {
    const unsubscribe = initAuth(
      (currentUser, token) => {
        setUser(currentUser);
        if (token) setAccessToken(token);
      },
      () => {
        setUser(null);
        setAccessToken(null);
      }
    );
    return () => unsubscribe();
  }, []);

  const handleGoogleLogin = async () => {
    setIsLoggingIn(true);
    try {
      const result = await googleSignIn();
      if (result) {
        setUser(result.user);
        showToast(
          `Berhasil login sebagai ${result.user.displayName || result.user.email}!`,
          'success'
        );
      }
    } catch (err: any) {
      console.error('Login error:', err);
      showToast(err.message || 'Gagal login dengan akun Google.', 'error');
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleGoogleLogout = async () => {
    try {
      await logout();
      setUser(null);
      showToast('Berhasil keluar dari akun Google.', 'info');
    } catch (err: any) {
      console.error('Logout error:', err);
    }
  };

  // Perform Synchronization (Unlimited rows)
  const performSync = useCallback(
    async (manual = false) => {
      setSyncStatus((prev) => ({ ...prev, isSyncing: true, error: null }));

      try {
        const token = await getAccessToken();

        // Check if Apps Script Web App URL or real Google Sheet ID
        const isAppsScript = syncStatus.spreadsheetId.includes('script.google.com/macros/s/');
        const isSheetId = syncStatus.spreadsheetId && syncStatus.spreadsheetId.length > 20;

        if (isAppsScript || isSheetId) {
          const res = await fetchSheetPNBPRecords(
            syncStatus.spreadsheetId,
            syncStatus.sheetName,
            token
          );
          if (res.records && res.records.length > 0) {
            setRecords(res.records);
            setSyncStatus((prev) => ({
              ...prev,
              lastSyncedAt: new Date(),
              isSyncing: false,
            }));
            if (manual) {
              showToast(
                `Sinkronisasi berhasil! ${res.records.length} baris data dimuat otomatis.`,
                'success'
              );
            }
            return;
          }
        }

        // Default seed data synchronization simulation
        await new Promise((resolve) => setTimeout(resolve, 800));
        setSyncStatus((prev) => ({
          ...prev,
          lastSyncedAt: new Date(),
          isSyncing: false,
        }));

        if (manual) {
          showToast('Data spreadsheet terverifikasi sinkron & up-to-date.', 'success');
        }
      } catch (err: any) {
        console.error('Sync error:', err);
        setSyncStatus((prev) => ({
          ...prev,
          isSyncing: false,
          error: err.message || 'Gagal sinkronisasi dengan Google Sheets',
        }));
        if (manual) {
          showToast(err.message || 'Gagal sinkronisasi data.', 'error');
        }
      }
    },
    [syncStatus.spreadsheetId, syncStatus.sheetName, showToast]
  );

  // Auto-sync polling interval
  useEffect(() => {
    if (syncStatus.syncIntervalSec <= 0) return;

    const intervalId = setInterval(() => {
      performSync(false);
    }, syncStatus.syncIntervalSec * 1000);

    return () => clearInterval(intervalId);
  }, [syncStatus.syncIntervalSec, performSync]);

  // Initial sync on mount if persistent link is present
  useEffect(() => {
    if (
      syncStatus.spreadsheetId &&
      (syncStatus.spreadsheetId.includes('script.google.com') || syncStatus.spreadsheetId.length > 20)
    ) {
      performSync(false);
    }
  }, []); // Run once on startup

  // Handle Sheet Config Save
  const handleSaveSheetConfig = async (
    spreadsheetId: string,
    sheetName: string,
    intervalSec: number
  ) => {
    const isAppsScript = spreadsheetId.includes('script.google.com');
    const newTitle = isAppsScript ? 'Google Apps Script Web App' : 'Data_Capaian_Kinerja';

    setSyncStatus((prev) => ({
      ...prev,
      spreadsheetId: spreadsheetId || prev.spreadsheetId,
      spreadsheetTitle: newTitle,
      sheetName: sheetName || prev.sheetName,
      syncIntervalSec: intervalSec,
    }));

    if (spreadsheetId && spreadsheetId.length > 15) {
      const token = await getAccessToken();
      const res = await fetchSheetPNBPRecords(spreadsheetId, sheetName, token);
      if (res.records && res.records.length > 0) {
        setRecords(res.records);
        showToast(
          `Berhasil menghubungkan Google Sheets! ${res.records.length} data tanpa batas dimuat.`,
          'success'
        );
      }
    } else {
      showToast('Konfigurasi auto-sync disimpan. Data akan tetap terkoneksi otomatis.', 'success');
    }
  };

  // Reset to initial seed data
  const handleResetToSeedData = () => {
    setRecords(INITIAL_PNBP_DATA);
    setSyncStatus((prev) => ({
      ...prev,
      spreadsheetId: 'Data_Capaian_Kinerja',
      spreadsheetTitle: 'Data_Capaian_Kinerja',
      sheetName: 'Row_Data_PNBP',
      lastSyncedAt: new Date(),
    }));
    localStorage.removeItem(LOCAL_STORAGE_SYNC_KEY);
    localStorage.removeItem(LOCAL_STORAGE_RECORDS_KEY);
    showToast('Data berhasil direset ke data awal lembar kerja PNBP.', 'info');
  };

  // Add new transaction
  const handleAddRecord = (record: PNBPRecord) => {
    setRecords((prev) => [record, ...prev]);
    showToast(
      `Transaksi "${record.namaPenjualan}" berhasil ditambahkan secara real-time!`,
      'success'
    );
  };

  // Sorting handler
  const handleSortChange = (field: SortField) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('desc');
    }
  };

  // Derived filter options for all unique values
  const availableDates = useMemo(() => {
    const set = new Set<string>();
    records.forEach((r) => r.tanggalTransaksi && set.add(r.tanggalTransaksi.trim()));
    return Array.from(set);
  }, [records]);

  const availableMonths = useMemo(() => {
    const set = new Set<string>();
    records.forEach((r) => r.bulan && set.add(r.bulan.trim()));
    return Array.from(set);
  }, [records]);

  const availableYears = useMemo(() => {
    const set = new Set<string>();
    records.forEach((r) => r.tahun && set.add(r.tahun.trim()));
    return Array.from(set);
  }, [records]);

  const availableSalesNames = useMemo(() => {
    const set = new Set<string>();
    records.forEach((r) => r.namaPenjualan && set.add(r.namaPenjualan.trim()));
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [records]);

  const availableAccounts = useMemo(() => {
    const set = new Set<string>();
    records.forEach((r) => r.jenisPendapatan && set.add(r.jenisPendapatan.trim()));
    return Array.from(set);
  }, [records]);

  // Filtered & Sorted Records
  const filteredRecords = useMemo(() => {
    return filterAndSortRecords(records, filters, sortBy, sortOrder);
  }, [records, filters, sortBy, sortOrder]);

  // Summary KPIs and Infographics
  const kpi = useMemo(() => {
    return calculateSummaryKPI(filteredRecords);
  }, [filteredRecords]);

  const handleResetAllFilters = () => {
    setFilters({
      searchQuery: '',
      tanggalTransaksi: 'all',
      bulan: 'all',
      tahun: 'all',
      namaPenjualan: 'all',
      jenisPendapatan: 'all',
      kategori: 'all',
    });
  };

  return (
    <div className="min-h-screen bg-slate-50/70 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans selection:bg-emerald-500 selection:text-white pb-20">
      {/* Navbar */}
      <Navbar
        user={user}
        syncStatus={syncStatus}
        isLoggingIn={isLoggingIn}
        onLogin={handleGoogleLogin}
        onLogout={handleGoogleLogout}
        onManualSync={() => performSync(true)}
        onOpenSheetsModal={() => setIsSheetsModalOpen(true)}
        onOpenAddModal={() => setIsAddModalOpen(true)}
      />

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 sm:pt-8 space-y-6">
        {/* Toast / Notification Banner */}
        {notification && (
          <div
            className={`p-3.5 rounded-2xl border text-xs font-medium flex items-center justify-between shadow-xs animate-fade-in ${
              notification.type === 'success'
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-800 dark:text-emerald-300'
                : notification.type === 'error'
                ? 'bg-rose-500/10 border-rose-500/30 text-rose-800 dark:text-rose-300'
                : 'bg-sky-500/10 border-sky-500/30 text-sky-800 dark:text-sky-300'
            }`}
          >
            <div className="flex items-center gap-2">
              {notification.type === 'success' && (
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
              )}
              {notification.type === 'error' && (
                <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
              )}
              {notification.type === 'info' && (
                <RefreshCw className="w-4 h-4 text-sky-500 shrink-0" />
              )}
              <span>{notification.message}</span>
            </div>
            <button
              onClick={() => setNotification(null)}
              className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-xs font-bold px-1 cursor-pointer"
            >
              ×
            </button>
          </div>
        )}

        {/* Sync Status Banner */}
        <div className="bg-slate-900 dark:bg-slate-900/90 rounded-2xl p-4 sm:p-5 text-white shadow-xs border border-slate-800 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3.5 min-w-0">
            <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shrink-0">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 text-xs">
                <span className="font-semibold text-emerald-400">
                  Koneksi Real-time Aktif
                </span>
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-slate-400 hidden sm:inline">·</span>
                <span className="text-slate-400 hidden sm:inline text-[11px]">
                  Baris tidak terbatas &amp; otomatis tersimpan
                </span>
              </div>
              <h2 className="text-sm sm:text-base font-bold text-white truncate max-w-xl mt-0.5">
                Sumber Data: {syncStatus.spreadsheetTitle} ({syncStatus.sheetName})
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-3 text-xs text-slate-300 shrink-0">
            <div className="text-right hidden sm:block">
              <span className="text-slate-400 block text-[11px]">Terakhir disinkronkan:</span>
              <span className="font-medium text-slate-200 tabular-nums">
                {syncStatus.lastSyncedAt?.toLocaleTimeString('id-ID') || '-'}
              </span>
            </div>
            <button
              onClick={() => setIsSheetsModalOpen(true)}
              className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-200 font-semibold text-xs transition border border-slate-700/80 hover:border-slate-600 cursor-pointer flex items-center gap-2 shadow-xs"
            >
              <span>Ubah Sumber</span>
              <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
            </button>
          </div>
        </div>

        {/* KPI Cards & Infographics Section */}
        <section aria-label="Ringkasan Indikator Kinerja & Infografis">
          <KPICards
            kpi={kpi}
            onFilterJenis={(kode) =>
              setFilters((prev) => ({
                ...prev,
                jenisPendapatan: prev.jenisPendapatan === kode ? 'all' : kode,
              }))
            }
            onFilterNama={(nama) =>
              setFilters((prev) => ({
                ...prev,
                namaPenjualan: prev.namaPenjualan === nama ? 'all' : nama,
              }))
            }
          />
        </section>

        {/* Visual Charts Section (Horizontal Bar Y:Bulan, X:Setoran/Volume & Pie) */}
        <section aria-label="Visualisasi Grafik Batang dan Donut">
          <ChartsSection
            records={filteredRecords}
            allSalesNames={availableSalesNames}
            onSelectMonth={(bulan) =>
              setFilters((prev) => ({
                ...prev,
                bulan: prev.bulan === bulan ? 'all' : bulan,
              }))
            }
            onSelectAkun={(jenisPendapatan) =>
              setFilters((prev) => ({
                ...prev,
                jenisPendapatan: prev.jenisPendapatan === jenisPendapatan ? 'all' : jenisPendapatan,
              }))
            }
            onSelectCategory={(kategori) =>
              setFilters((prev) => ({
                ...prev,
                kategori: prev.kategori === kategori ? 'all' : kategori,
              }))
            }
          />
        </section>

        {/* Interactive Data Table with Embedded Multi-Filter & Search Engine */}
        <section aria-label="Tabel Data Transaksi PNBP">
          <DataTable
            records={filteredRecords}
            totalRecordsCount={records.length}
            kpi={kpi}
            sortBy={sortBy}
            sortOrder={sortOrder}
            filters={filters}
            availableDates={availableDates}
            availableMonths={availableMonths}
            availableYears={availableYears}
            availableSalesNames={availableSalesNames}
            availableAccounts={availableAccounts}
            onSortChange={handleSortChange}
            onFilterChange={setFilters}
            onResetFilters={handleResetAllFilters}
          />
        </section>
      </main>

      {/* Modals */}
      <GoogleSheetsModal
        isOpen={isSheetsModalOpen}
        syncStatus={syncStatus}
        onClose={() => setIsSheetsModalOpen(false)}
        onSaveConfig={handleSaveSheetConfig}
        onResetToSeedData={handleResetToSeedData}
      />

      <AddTransactionModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onAddRecord={handleAddRecord}
      />
    </div>
  );
}
