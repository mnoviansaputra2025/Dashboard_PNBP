import React, { useState } from 'react';
import {
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Download,
  FileText,
  ChevronLeft,
  ChevronRight,
  Database,
  Search,
  Filter,
  RotateCcw,
  Calendar,
  Layers,
  Tag,
  X,
} from 'lucide-react';
import { PNBPRecord, SortField, SortOrder, SummaryKPI, FilterOptions } from '../types/pnbp';
import { formatRupiah, formatNumber, getJenisPendapatanBadge, JENIS_PENDAPATAN_INFO } from '../utils/formatters';
import { exportToCSV, exportToPDF } from '../utils/export';

interface DataTableProps {
  records: PNBPRecord[];
  totalRecordsCount: number;
  kpi: SummaryKPI;
  sortBy: SortField;
  sortOrder: SortOrder;
  filters: FilterOptions;
  availableDates: string[];
  availableMonths: string[];
  availableYears: string[];
  availableSalesNames: string[];
  availableAccounts: string[];
  onSortChange: (field: SortField) => void;
  onFilterChange: (filters: FilterOptions) => void;
  onResetFilters: () => void;
}

export const DataTable: React.FC<DataTableProps> = ({
  records,
  totalRecordsCount,
  kpi,
  sortBy,
  sortOrder,
  filters,
  availableDates,
  availableMonths,
  availableYears,
  availableSalesNames,
  availableAccounts,
  onSortChange,
  onFilterChange,
  onResetFilters,
}) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState<number>(15);

  const totalPages = pageSize > 0 ? Math.ceil(records.length / pageSize) : 1;
  const paginatedRecords =
    pageSize > 0
      ? records.slice((currentPage - 1) * pageSize, currentPage * pageSize)
      : records;

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const isFiltered =
    filters.searchQuery.trim() !== '' ||
    filters.tanggalTransaksi !== 'all' ||
    filters.bulan !== 'all' ||
    filters.tahun !== 'all' ||
    filters.namaPenjualan !== 'all' ||
    filters.jenisPendapatan !== 'all';

  const renderSortIcon = (field: SortField) => {
    if (sortBy !== field) {
      return <ArrowUpDown className="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-600 transition" />;
    }
    return sortOrder === 'asc' ? (
      <ArrowUp className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
    ) : (
      <ArrowDown className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
    );
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 shadow-xs hover:shadow-sm transition-all duration-200 overflow-hidden flex flex-col">
      {/* Table Header & Export Actions */}
      <div className="p-5 sm:p-6 border-b border-slate-200/80 dark:border-slate-800 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
              <Database className="w-4 h-4" />
            </div>
            <span>Tabel Data Transaksi PNBP</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Daftar lengkap bukti setoran penerimaan negara bukan pajak (klik header kolom untuk mengurutkan)
          </p>
        </div>

        {/* Export Buttons */}
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => exportToCSV(records)}
            aria-label="Ekspor data ke file CSV"
            title="Download CSV spreadsheet"
            className="px-3.5 py-2 text-xs font-semibold rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-750 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 transition flex items-center gap-2 cursor-pointer shadow-xs"
          >
            <Download className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>Ekspor CSV</span>
          </button>

          <button
            onClick={() => exportToPDF(records, kpi)}
            aria-label="Ekspor data ke laporan PDF"
            title="Download Laporan PDF Resmi"
            className="px-3.5 py-2 text-xs font-semibold rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white transition flex items-center gap-2 cursor-pointer shadow-xs shadow-emerald-900/30"
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Ekspor PDF</span>
          </button>
        </div>
      </div>

      {/* FILTER & SEARCH ENGINE BAR */}
      <div className="p-4 sm:p-5 bg-slate-50/70 dark:bg-slate-800/40 border-b border-slate-200/80 dark:border-slate-800 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2.5 text-xs text-slate-600 dark:text-slate-300">
            <Filter className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span className="font-semibold text-slate-800 dark:text-slate-200">
              Filter Data Transaksi
            </span>
            <span className="text-slate-400">·</span>
            <span className="text-slate-500 dark:text-slate-400">
              Menampilkan <strong className="text-slate-800 dark:text-slate-200 font-semibold">{records.length}</strong> dari {totalRecordsCount} data
            </span>
          </div>

          {isFiltered && (
            <button
              onClick={onResetFilters}
              className="text-xs font-semibold text-rose-600 dark:text-rose-400 hover:text-rose-700 dark:hover:text-rose-300 flex items-center gap-1.5 cursor-pointer transition"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset Semua Filter</span>
            </button>
          )}
        </div>

        {/* Filter Inputs Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2.5">
          {/* 1. Search Engine */}
          <div className="relative">
            <label htmlFor="search-input" className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-1">
              Pencarian
            </label>
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 pointer-events-none" />
              <input
                id="search-input"
                type="text"
                placeholder="Cari semua data..."
                value={filters.searchQuery}
                onChange={(e) => {
                  onFilterChange({ ...filters, searchQuery: e.target.value });
                  setCurrentPage(1);
                }}
                className="w-full pl-8 pr-7 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition shadow-xs"
              />
              {filters.searchQuery && (
                <button
                  onClick={() => onFilterChange({ ...filters, searchQuery: '' })}
                  className="absolute right-2.5 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* 2. Filter Tanggal_Transaksi */}
          <div>
            <label htmlFor="filter-tanggal" className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-1 flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              <span>Tanggal</span>
            </label>
            <select
              id="filter-tanggal"
              value={filters.tanggalTransaksi}
              onChange={(e) => {
                onFilterChange({ ...filters, tanggalTransaksi: e.target.value });
                setCurrentPage(1);
              }}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 cursor-pointer transition shadow-xs truncate"
            >
              <option value="all">Semua Tanggal</option>
              {availableDates.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </div>

          {/* 3. Filter Bulan */}
          <div>
            <label htmlFor="filter-bulan" className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-1">
              Bulan
            </label>
            <select
              id="filter-bulan"
              value={filters.bulan}
              onChange={(e) => {
                onFilterChange({ ...filters, bulan: e.target.value });
                setCurrentPage(1);
              }}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 cursor-pointer transition shadow-xs truncate"
            >
              <option value="all">Semua Bulan</option>
              {availableMonths.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </div>

          {/* 4. Filter Tahun */}
          <div>
            <label htmlFor="filter-tahun" className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-1">
              Tahun
            </label>
            <select
              id="filter-tahun"
              value={filters.tahun}
              onChange={(e) => {
                onFilterChange({ ...filters, tahun: e.target.value });
                setCurrentPage(1);
              }}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 cursor-pointer transition shadow-xs"
            >
              <option value="all">Semua Tahun</option>
              {availableYears.map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
          </div>

          {/* 5. Filter Nama_Penjualan */}
          <div>
            <label htmlFor="filter-nama" className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-1 flex items-center gap-1">
              <Tag className="w-3 h-3" />
              <span>Nama Penjualan</span>
            </label>
            <select
              id="filter-nama"
              value={filters.namaPenjualan}
              onChange={(e) => {
                onFilterChange({ ...filters, namaPenjualan: e.target.value });
                setCurrentPage(1);
              }}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 cursor-pointer transition shadow-xs truncate"
            >
              <option value="all">Semua Penjualan</option>
              {availableSalesNames.map((nama) => (
                <option key={nama} value={nama}>
                  {nama}
                </option>
              ))}
            </select>
          </div>

          {/* 6. Filter Jenis_Pendapatan */}
          <div className="min-w-0">
            <label htmlFor="filter-akun" className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-1 flex items-center gap-1 truncate">
              <Layers className="w-3 h-3 shrink-0" />
              <span>Jenis Pendapatan</span>
            </label>
            <select
              id="filter-akun"
              value={filters.jenisPendapatan}
              onChange={(e) => {
                onFilterChange({ ...filters, jenisPendapatan: e.target.value });
                setCurrentPage(1);
              }}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 cursor-pointer transition shadow-xs truncate"
            >
              <option value="all">Semua Akun</option>
              {availableAccounts.map((code) => {
                const info = JENIS_PENDAPATAN_INFO[code];
                return (
                  <option key={code} value={code} title={info ? info.desc : code}>
                    {info ? info.label : code}
                  </option>
                );
              })}
            </select>
          </div>
        </div>
      </div>

      {/* Responsive Table Container */}
      <div className="overflow-x-auto w-full">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-slate-50/90 dark:bg-slate-800/80 border-b border-slate-200/80 dark:border-slate-800 text-slate-600 dark:text-slate-300 font-semibold uppercase tracking-wider text-[11px]">
              <th className="py-3.5 px-4 text-center w-12">No</th>
              <th
                onClick={() => onSortChange('tanggalTransaksi')}
                className="py-3.5 px-4 cursor-pointer group hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              >
                <div className="flex items-center gap-1.5">
                  <span>Tanggal</span>
                  {renderSortIcon('tanggalTransaksi')}
                </div>
              </th>
              <th
                onClick={() => onSortChange('bulan')}
                className="py-3.5 px-4 cursor-pointer group hover:bg-slate-100 dark:hover:bg-slate-800 transition hidden sm:table-cell"
              >
                <div className="flex items-center gap-1.5">
                  <span>Bulan</span>
                  {renderSortIcon('bulan')}
                </div>
              </th>
              <th
                onClick={() => onSortChange('tahun')}
                className="py-3.5 px-4 cursor-pointer group hover:bg-slate-100 dark:hover:bg-slate-800 transition hidden md:table-cell text-center w-16"
              >
                <div className="flex items-center justify-center gap-1">
                  <span>Tahun</span>
                  {renderSortIcon('tahun')}
                </div>
              </th>
              <th
                onClick={() => onSortChange('namaPenjualan')}
                className="py-3.5 px-4 cursor-pointer group hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              >
                <div className="flex items-center gap-1.5">
                  <span>Nama Penjualan / Uraian</span>
                  {renderSortIcon('namaPenjualan')}
                </div>
              </th>
              <th className="py-3.5 px-4 hidden lg:table-cell">Kategori</th>
              <th
                onClick={() => onSortChange('totalVolume')}
                className="py-3.5 px-4 text-right cursor-pointer group hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              >
                <div className="flex items-center justify-end gap-1.5">
                  <span>Volume</span>
                  {renderSortIcon('totalVolume')}
                </div>
              </th>
              <th
                onClick={() => onSortChange('totalSetoran')}
                className="py-3.5 px-4 text-right cursor-pointer group hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              >
                <div className="flex items-center justify-end gap-1.5">
                  <span>Total Setoran (Rp)</span>
                  {renderSortIcon('totalSetoran')}
                </div>
              </th>
              <th
                onClick={() => onSortChange('jenisPendapatan')}
                className="py-3.5 px-4 text-center cursor-pointer group hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              >
                <div className="flex items-center justify-center gap-1.5">
                  <span>Akun PNBP</span>
                  {renderSortIcon('jenisPendapatan')}
                </div>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-800 dark:text-slate-200">
            {paginatedRecords.length === 0 ? (
              <tr>
                <td colSpan={9} className="py-12 text-center text-slate-400">
                  <p className="text-sm font-medium">Tidak ada data yang sesuai dengan filter.</p>
                  <p className="text-xs mt-1">Coba sesuaikan kata kunci pencarian atau reset filter Anda.</p>
                </td>
              </tr>
            ) : (
              paginatedRecords.map((rec, idx) => {
                const rowIndex = pageSize > 0 ? (currentPage - 1) * pageSize + idx + 1 : idx + 1;
                const badgeInfo = getJenisPendapatanBadge(rec.jenisPendapatan);

                return (
                  <tr
                    key={rec.id}
                    className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors"
                  >
                    <td className="py-3 px-4 text-center text-slate-400 font-mono text-[11px]">
                      {rowIndex}
                    </td>
                    <td className="py-3 px-4 font-medium whitespace-nowrap">
                      {rec.tanggalTransaksi}
                    </td>
                    <td className="py-3 px-4 text-slate-500 dark:text-slate-400 whitespace-nowrap hidden sm:table-cell">
                      {rec.bulan}
                    </td>
                    <td className="py-3 px-4 text-slate-500 dark:text-slate-400 whitespace-nowrap hidden md:table-cell text-center font-mono text-[11px]">
                      {rec.tahun}
                    </td>
                    <td className="py-3 px-4 font-semibold text-slate-900 dark:text-white">
                      {rec.namaPenjualan}
                    </td>
                    <td className="py-3 px-4 text-slate-500 dark:text-slate-400 hidden lg:table-cell">
                      <span className="text-slate-600 dark:text-slate-300 text-xs">
                        {rec.kategori || '-'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right font-medium whitespace-nowrap tabular-nums">
                      {formatNumber(rec.totalVolume)}{' '}
                      <span className="text-[11px] text-slate-400 font-normal">{rec.satuan}</span>
                    </td>
                    <td className="py-3 px-4 text-right font-bold text-slate-900 dark:text-emerald-400 whitespace-nowrap tabular-nums font-mono">
                      {formatRupiah(rec.totalSetoran)}
                    </td>
                    <td className="py-3 px-4 text-center whitespace-nowrap">
                      <span
                        className={`inline-block px-2 py-0.5 rounded-md text-[11px] font-semibold border ${badgeInfo.badgeColor}`}
                        title={badgeInfo.desc}
                      >
                        {rec.jenisPendapatan}
                      </span>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      <div className="p-4 sm:p-5 border-t border-slate-200/80 dark:border-slate-800 flex flex-wrap items-center justify-between gap-4 bg-slate-50/50 dark:bg-slate-800/30 text-xs">
        {/* Page size selector */}
        <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
          <span>Baris per halaman:</span>
          <select
            value={pageSize}
            onChange={(e) => {
              setPageSize(Number(e.target.value));
              setCurrentPage(1);
            }}
            className="px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 cursor-pointer focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
          >
            <option value={10}>10</option>
            <option value={15}>15</option>
            <option value={25}>25</option>
            <option value={50}>50</option>
            <option value={100}>100</option>
            <option value={0}>Semua</option>
          </select>
          <span className="ml-2 font-medium text-slate-700 dark:text-slate-300">
            Total {records.length} Baris
          </span>
        </div>

        {/* Prev / Next controls */}
        {pageSize > 0 && totalPages > 1 && (
          <div className="flex items-center gap-2.5">
            <span className="text-slate-500 dark:text-slate-400">
              Halaman <strong className="text-slate-800 dark:text-slate-200">{currentPage}</strong> dari {totalPages}
            </span>
            <div className="flex items-center gap-1">
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                aria-label="Halaman sebelumnya"
                className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed transition cursor-pointer shadow-xs"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                aria-label="Halaman selanjutnya"
                className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed transition cursor-pointer shadow-xs"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
