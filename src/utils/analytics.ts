import {
  PNBPRecord,
  FilterOptions,
  SortField,
  SortOrder,
  SummaryKPI,
  SetoranByJenis,
  TopSalesItem,
} from '../types/pnbp';
import { JENIS_PENDAPATAN_INFO } from './formatters';

export function getSetoranByJenis(records: PNBPRecord[]): SetoranByJenis[] {
  const map: Record<string, { totalSetoran: number; totalVolume: number; count: number }> = {};
  let grandTotal = 0;

  records.forEach((rec) => {
    grandTotal += rec.totalSetoran;
    const key = rec.jenisPendapatan || 'Lainnya';
    if (!map[key]) {
      map[key] = { totalSetoran: 0, totalVolume: 0, count: 0 };
    }
    map[key].totalSetoran += rec.totalSetoran;
    map[key].totalVolume += rec.totalVolume;
    map[key].count += 1;
  });

  return Object.entries(map)
    .sort((a, b) => b[1].totalSetoran - a[1].totalSetoran)
    .map(([kode, data]) => {
      const info = JENIS_PENDAPATAN_INFO[kode] || {
        label: `${kode} - Lainnya`,
        desc: 'Akun Pendapatan PNBP Lainnya',
        badgeColor: 'bg-purple-500/10 text-purple-600 border-purple-500/20 dark:bg-purple-500/20 dark:text-purple-300',
      };

      return {
        kode,
        label: info.label,
        desc: info.desc,
        totalSetoran: data.totalSetoran,
        totalVolume: data.totalVolume,
        transaksiCount: data.count,
        percentage: grandTotal > 0 ? (data.totalSetoran / grandTotal) * 100 : 0,
        badgeColor: info.badgeColor,
      };
    });
}

export function getTopGroupedSales(records: PNBPRecord[], limit = 5): TopSalesItem[] {
  const map: Record<string, { totalSetoran: number; totalVolume: number; count: number; satuan: string }> = {};
  let grandTotal = 0;

  records.forEach((rec) => {
    grandTotal += rec.totalSetoran;
    const key = rec.namaPenjualan;
    if (!map[key]) {
      map[key] = {
        totalSetoran: 0,
        totalVolume: 0,
        count: 0,
        satuan: rec.satuan,
      };
    }
    map[key].totalSetoran += rec.totalSetoran;
    map[key].totalVolume += rec.totalVolume;
    map[key].count += 1;
  });

  const sorted = Object.entries(map)
    .map(([nama, data]) => ({
      nama,
      totalSetoran: data.totalSetoran,
      totalVolume: data.totalVolume,
      transaksiCount: data.count,
      satuan: data.satuan,
      percentageOfMax: 0,
      percentageOfTotal: grandTotal > 0 ? (data.totalSetoran / grandTotal) * 100 : 0,
    }))
    .sort((a, b) => b.totalSetoran - a.totalSetoran)
    .slice(0, limit);

  const maxVal = sorted.length > 0 ? sorted[0].totalSetoran : 1;
  return sorted.map((item) => ({
    ...item,
    percentageOfMax: maxVal > 0 ? (item.totalSetoran / maxVal) * 100 : 0,
  }));
}

export function calculateSummaryKPI(records: PNBPRecord[]): SummaryKPI {
  let totalSetoran = 0;
  records.forEach((rec) => {
    totalSetoran += rec.totalSetoran;
  });

  const totalTransaksi = records.length;
  const setoranByJenis = getSetoranByJenis(records);
  const top5GroupedSales = getTopGroupedSales(records, 5);

  return {
    totalSetoran,
    totalTransaksi,
    setoranByJenis,
    top5GroupedSales,
  };
}

export interface MonthlyTrendData {
  bulan: string;
  totalSetoran: number;
  totalVolume: number;
  count: number;
}

export function getMonthlyTrend(
  records: PNBPRecord[],
  filterNama = 'all',
  filterAkun = 'all'
): MonthlyTrendData[] {
  let filtered = records;
  if (filterNama && filterNama !== 'all') {
    filtered = filtered.filter((r) => r.namaPenjualan.toLowerCase() === filterNama.toLowerCase());
  }
  if (filterAkun && filterAkun !== 'all') {
    filtered = filtered.filter((r) => r.jenisPendapatan === filterAkun);
  }

  const map: Record<string, MonthlyTrendData> = {};

  filtered.forEach((rec) => {
    if (!map[rec.bulan]) {
      map[rec.bulan] = {
        bulan: rec.bulan,
        totalSetoran: 0,
        totalVolume: 0,
        count: 0,
      };
    }
    map[rec.bulan].totalSetoran += rec.totalSetoran;
    map[rec.bulan].totalVolume += rec.totalVolume;
    map[rec.bulan].count += 1;
  });

  return Object.values(map);
}

export interface PieChartItem {
  id: string;
  label: string;
  fullLabel?: string;
  desc?: string;
  value: number;
  percentage: number;
  color: string;
}

const PALETTE = [
  '#10B981', // emerald-500
  '#0EA5E9', // sky-500
  '#F59E0B', // amber-500
  '#8B5CF6', // purple-500
  '#EC4899', // pink-500
  '#14B8A6', // teal-500
  '#F97316', // orange-500
  '#6366F1', // indigo-500
];

export function getRevenueByAkunPie(records: PNBPRecord[]): PieChartItem[] {
  const map: Record<string, number> = {};
  let total = 0;

  records.forEach((rec) => {
    map[rec.jenisPendapatan] = (map[rec.jenisPendapatan] || 0) + rec.totalSetoran;
    total += rec.totalSetoran;
  });

  return Object.entries(map).map(([code, value], index) => {
    const info = JENIS_PENDAPATAN_INFO[code];
    return {
      id: code,
      label: info ? info.shortLabel : `Akun ${code}`,
      fullLabel: info ? info.label : `Akun ${code}`,
      desc: info ? info.desc : `Akun ${code}`,
      value,
      percentage: total > 0 ? (value / total) * 100 : 0,
      color: PALETTE[index % PALETTE.length],
    };
  });
}

export function getRevenueByCategoryPie(records: PNBPRecord[]): PieChartItem[] {
  const map: Record<string, number> = {};
  let total = 0;

  records.forEach((rec) => {
    const cat = rec.kategori || 'Lainnya';
    map[cat] = (map[cat] || 0) + rec.totalSetoran;
    total += rec.totalSetoran;
  });

  return Object.entries(map)
    .sort((a, b) => b[1] - a[1])
    .map(([cat, value], index) => ({
      id: cat,
      label: cat,
      value,
      percentage: total > 0 ? (value / total) * 100 : 0,
      color: PALETTE[index % PALETTE.length],
    }));
}

export function filterAndSortRecords(
  records: PNBPRecord[],
  filters: FilterOptions,
  sortBy: SortField,
  sortOrder: SortOrder
): PNBPRecord[] {
  let filtered = [...records];

  // 1. Tanggal Transaksi filter
  if (filters.tanggalTransaksi && filters.tanggalTransaksi !== 'all') {
    filtered = filtered.filter(
      (r) => r.tanggalTransaksi.trim() === filters.tanggalTransaksi.trim()
    );
  }

  // 2. Bulan filter
  if (filters.bulan && filters.bulan !== 'all') {
    filtered = filtered.filter(
      (r) => r.bulan.toLowerCase() === filters.bulan.toLowerCase()
    );
  }

  // 3. Tahun filter
  if (filters.tahun && filters.tahun !== 'all') {
    filtered = filtered.filter((r) => r.tahun.trim() === filters.tahun.trim());
  }

  // 4. Nama Penjualan filter
  if (filters.namaPenjualan && filters.namaPenjualan !== 'all') {
    filtered = filtered.filter(
      (r) => r.namaPenjualan.toLowerCase() === filters.namaPenjualan.toLowerCase()
    );
  }

  // 5. Jenis Pendapatan filter
  if (filters.jenisPendapatan && filters.jenisPendapatan !== 'all') {
    filtered = filtered.filter((r) => r.jenisPendapatan === filters.jenisPendapatan);
  }

  // 6. Kategori filter
  if (filters.kategori && filters.kategori !== 'all') {
    filtered = filtered.filter((r) => r.kategori === filters.kategori);
  }

  // 7. Search Query engine
  if (filters.searchQuery.trim()) {
    const q = filters.searchQuery.toLowerCase().trim();
    filtered = filtered.filter(
      (r) =>
        r.namaPenjualan.toLowerCase().includes(q) ||
        r.tanggalTransaksi.toLowerCase().includes(q) ||
        r.bulan.toLowerCase().includes(q) ||
        r.tahun.toLowerCase().includes(q) ||
        r.jenisPendapatan.toLowerCase().includes(q) ||
        r.satuan.toLowerCase().includes(q) ||
        (r.kategori && r.kategori.toLowerCase().includes(q))
    );
  }

  // Sorting
  filtered.sort((a, b) => {
    let comparison = 0;
    switch (sortBy) {
      case 'totalSetoran':
        comparison = a.totalSetoran - b.totalSetoran;
        break;
      case 'totalVolume':
        comparison = a.totalVolume - b.totalVolume;
        break;
      case 'namaPenjualan':
        comparison = a.namaPenjualan.localeCompare(b.namaPenjualan);
        break;
      case 'bulan':
        comparison = a.bulan.localeCompare(b.bulan);
        break;
      case 'tahun':
        comparison = a.tahun.localeCompare(b.tahun);
        break;
      case 'jenisPendapatan':
        comparison = a.jenisPendapatan.localeCompare(b.jenisPendapatan);
        break;
      case 'tanggalTransaksi': {
        const [d1, m1, y1] = a.tanggalTransaksi.split('/').map(Number);
        const [d2, m2, y2] = b.tanggalTransaksi.split('/').map(Number);
        const date1 = new Date(y1 || 2026, (m1 || 1) - 1, d1 || 1).getTime();
        const date2 = new Date(y2 || 2026, (m2 || 1) - 1, d2 || 1).getTime();
        comparison = date1 - date2;
        break;
      }
      default:
        comparison = 0;
    }
    return sortOrder === 'asc' ? comparison : -comparison;
  });

  return filtered;
}
