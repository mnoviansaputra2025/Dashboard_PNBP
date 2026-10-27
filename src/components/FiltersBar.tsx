import React from 'react';
import { Search, Filter, RotateCcw, Calendar, Layers, Tag } from 'lucide-react';
import { FilterOptions } from '../types/pnbp';
import { JENIS_PENDAPATAN_INFO } from '../utils/formatters';

interface FiltersBarProps {
  filters: FilterOptions;
  availableMonths: string[];
  availableCategories: string[];
  totalRecords: number;
  filteredCount: number;
  onFilterChange: (newFilters: FilterOptions) => void;
  onResetFilters: () => void;
}

export const FiltersBar: React.FC<FiltersBarProps> = ({
  filters,
  availableMonths,
  availableCategories,
  totalRecords,
  filteredCount,
  onFilterChange,
  onResetFilters,
}) => {
  const isFiltered =
    filters.bulan !== 'all' ||
    filters.jenisPendapatan !== 'all' ||
    filters.kategori !== 'all' ||
    filters.searchQuery.trim() !== '';

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-4 sm:p-5 shadow-sm space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
            <Filter className="w-4 h-4" />
          </div>
          <h2 className="text-sm font-bold text-slate-800 dark:text-slate-100">
            Filter &amp; Pencarian Interaktif
          </h2>
          <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-medium">
            Menampilkan {filteredCount} dari {totalRecords} transaksi
          </span>
        </div>

        {isFiltered && (
          <button
            onClick={onResetFilters}
            aria-label="Reset semua filter"
            className="text-xs font-semibold text-rose-500 hover:text-rose-600 flex items-center gap-1.5 transition cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Reset Filter
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="relative">
          <label htmlFor="search-input" className="block text-[11px] font-medium text-slate-500 dark:text-slate-400 mb-1">
            Pencarian Cepat
          </label>
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 pointer-events-none" />
            <input
              id="search-input"
              type="text"
              placeholder="Cari transaksi, komoditas..."
              value={filters.searchQuery}
              onChange={(e) => onFilterChange({ ...filters, searchQuery: e.target.value })}
              className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition"
            />
          </div>
        </div>

        <div>
          <label htmlFor="month-select" className="block text-[11px] font-medium text-slate-500 dark:text-slate-400 mb-1 flex items-center gap-1">
            <Calendar className="w-3 h-3" />
            Periode Bulan
          </label>
          <select
            id="month-select"
            value={filters.bulan}
            onChange={(e) => onFilterChange({ ...filters, bulan: e.target.value })}
            className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition cursor-pointer"
          >
            <option value="all">Semua Bulan</option>
            {availableMonths.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="akun-select" className="block text-[11px] font-medium text-slate-500 dark:text-slate-400 mb-1 flex items-center gap-1">
            <Layers className="w-3 h-3" />
            Akun Pendapatan (PNBP)
          </label>
          <select
            id="akun-select"
            value={filters.jenisPendapatan}
            onChange={(e) => onFilterChange({ ...filters, jenisPendapatan: e.target.value })}
            className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition cursor-pointer"
          >
            <option value="all">Semua Akun PNBP</option>
            {Object.entries(JENIS_PENDAPATAN_INFO).map(([code, info]) => (
              <option key={code} value={code}>
                {info.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="kategori-select" className="block text-[11px] font-medium text-slate-500 dark:text-slate-400 mb-1 flex items-center gap-1">
            <Tag className="w-3 h-3" />
            Kategori Komoditas/Layanan
          </label>
          <select
            id="kategori-select"
            value={filters.kategori}
            onChange={(e) => onFilterChange({ ...filters, kategori: e.target.value })}
            className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition cursor-pointer"
          >
            <option value="all">Semua Kategori</option>
            {availableCategories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
};
