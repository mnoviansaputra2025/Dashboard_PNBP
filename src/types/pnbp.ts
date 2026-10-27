export interface PNBPRecord {
  id: string;
  tanggalTransaksi: string; // e.g. "13/01/2026"
  bulan: string;            // e.g. "Januari 2026"
  tahun: string;            // e.g. "2026"
  namaPenjualan: string;    // e.g. "Sewa Gedung", "Benih Mas"
  totalVolume: number;      // e.g. 2500
  satuan: string;           // e.g. "ekor", "Rp", "Hari", "Kg", "unit"
  totalSetoran: number;     // in Rupiah numeric, e.g. 1575000
  jenisPendapatan: string;  // e.g. "425112", "425151", "425122"
  kategori?: string;        // "Perikanan & Benih", "Sewa Fasilitas", "Lelang Aset", "Pakan & Sarana"
}

export type SortField = 'tanggalTransaksi' | 'namaPenjualan' | 'totalVolume' | 'totalSetoran' | 'jenisPendapatan' | 'bulan' | 'tahun';
export type SortOrder = 'asc' | 'desc';

export interface FilterOptions {
  searchQuery: string;
  tanggalTransaksi: string; // 'all' or specific date
  bulan: string;            // 'all' or specific e.g. "Januari 2026"
  tahun: string;            // 'all' or specific e.g. "2026"
  namaPenjualan: string;    // 'all' or specific e.g. "Benih Lele"
  jenisPendapatan: string;  // 'all' or specific e.g. "425112"
  kategori: string;         // 'all' or specific category
}

export interface SetoranByJenis {
  kode: string;
  label: string;
  desc: string;
  totalSetoran: number;
  totalVolume: number;
  transaksiCount: number;
  percentage: number;
  badgeColor: string;
}

export interface TopSalesItem {
  nama: string;
  totalSetoran: number;
  totalVolume: number;
  transaksiCount: number;
  satuan: string;
  percentageOfMax: number;
  percentageOfTotal: number;
}

export interface SummaryKPI {
  totalSetoran: number;
  totalTransaksi: number;
  setoranByJenis: SetoranByJenis[];
  top5GroupedSales: TopSalesItem[];
}

export interface SyncStatus {
  isConnected: boolean;
  spreadsheetId: string;
  spreadsheetTitle: string;
  sheetName: string;
  lastSyncedAt: Date | null;
  isSyncing: boolean;
  syncIntervalSec: number; // 0 = off, 10, 30, 60
  error: string | null;
}
