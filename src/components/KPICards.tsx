import React from 'react';
import {
  Wallet,
  Receipt,
  Award,
  TrendingUp,
  ChevronRight,
} from 'lucide-react';
import { SummaryKPI } from '../types/pnbp';
import { formatRupiah, formatNumber } from '../utils/formatters';

interface KPICardsProps {
  kpi: SummaryKPI;
  onFilterJenis?: (kode: string) => void;
  onFilterNama?: (nama: string) => void;
}

export const KPICards: React.FC<KPICardsProps> = ({
  kpi,
  onFilterNama,
}) => {
  return (
    <div className="space-y-4">
      {/* TOP SUMMARY ROW: Total Setoran & Total Transaksi */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* 1. Total Setoran PNBP */}
        <div className="p-5 sm:p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 shadow-xs hover:shadow-sm transition-all duration-200 flex items-center justify-between gap-4 overflow-hidden">
          <div className="min-w-0 flex-1">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
              Total Setoran PNBP
            </span>
            <div className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight mt-1.5 tabular-nums truncate">
              {formatRupiah(kpi.totalSetoran)}
            </div>
            <div className="text-xs text-emerald-600 dark:text-emerald-400 mt-1.5 flex items-center gap-1.5 font-medium">
              <TrendingUp className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">Akumulasi Penerimaan Negara Bukan Pajak (100% Real-time)</span>
            </div>
          </div>
          <div className="w-13 h-13 sm:w-14 sm:h-14 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 flex items-center justify-center shrink-0">
            <Wallet className="w-6 h-6 sm:w-7 sm:h-7" />
          </div>
        </div>

        {/* 2. Total Transaksi */}
        <div className="p-5 sm:p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 shadow-xs hover:shadow-sm transition-all duration-200 flex items-center justify-between gap-4 overflow-hidden">
          <div className="min-w-0 flex-1">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
              Total Transaksi
            </span>
            <div className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight mt-1.5 tabular-nums truncate">
              {formatNumber(kpi.totalTransaksi)}
              <span className="text-sm sm:text-base font-normal text-slate-500 dark:text-slate-400 ml-2">transaksi</span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5 truncate">
              Data terverifikasi aktif dari Google Sheets
            </p>
          </div>
          <div className="w-13 h-13 sm:w-14 sm:h-14 rounded-2xl bg-sky-500/10 text-sky-600 dark:text-sky-400 border border-sky-500/20 flex items-center justify-center shrink-0">
            <Receipt className="w-6 h-6 sm:w-7 sm:h-7" />
          </div>
        </div>
      </div>

      {/* INFOGRAFIS: Top 5 Jumlah Setoran Berdasarkan Nama Penjualan yang Sama */}
      <div className="p-5 sm:p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 shadow-xs hover:shadow-sm transition-all duration-200 overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-2 pb-3.5 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 shrink-0">
              <Award className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white truncate">
                Top 5 Setoran Akumulatif (Nama Penjualan yang Sama)
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Peringkat penerimaan terbesar berdasarkan konsolidasi nama penjualan
              </p>
            </div>
          </div>
          <span className="text-xs text-slate-400 font-medium">Peringkat 1 - 5</span>
        </div>

        <div className="mt-4 space-y-2.5">
          {kpi.top5GroupedSales.map((item, idx) => (
            <div
              key={item.nama}
              onClick={() => onFilterNama && onFilterNama(item.nama)}
              className="p-3 sm:p-3.5 rounded-xl border border-slate-100 dark:border-slate-800/80 hover:border-amber-400/50 bg-slate-50/60 dark:bg-slate-800/30 hover:bg-amber-50/20 dark:hover:bg-amber-950/20 transition-all duration-150 cursor-pointer group"
            >
              <div className="flex items-center justify-between gap-3 text-xs mb-1.5">
                <div className="flex items-center gap-2.5 min-w-0 flex-1">
                  <span className="w-6 h-6 rounded-lg bg-amber-500/15 text-amber-800 dark:text-amber-300 font-bold text-xs flex items-center justify-center shrink-0 border border-amber-500/20">
                    {idx + 1}
                  </span>
                  <span
                    className="font-semibold text-slate-900 dark:text-slate-100 text-xs sm:text-sm truncate"
                    title={item.nama}
                  >
                    {item.nama}
                  </span>
                  <span className="text-[11px] px-1.5 py-0.5 rounded bg-slate-200/70 dark:bg-slate-700/60 text-slate-600 dark:text-slate-300 font-medium shrink-0">
                    {item.transaksiCount} transaksi
                  </span>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <span className="font-bold text-slate-900 dark:text-white text-xs sm:text-sm tabular-nums whitespace-nowrap">
                    {formatRupiah(item.totalSetoran)}
                  </span>
                  <span className="text-xs font-semibold text-amber-600 dark:text-amber-400 tabular-nums whitespace-nowrap">
                    ({item.percentageOfTotal.toFixed(1)}%)
                  </span>
                </div>
              </div>

              {/* Progress bar */}
              <div className="w-full bg-slate-200/70 dark:bg-slate-700/60 h-2 rounded-full overflow-hidden mt-2">
                <div
                  className="h-full bg-gradient-to-r from-amber-500 to-orange-400 rounded-full transition-all duration-500 group-hover:from-amber-400 group-hover:to-orange-300"
                  style={{ width: `${Math.max(4, item.percentageOfMax)}%` }}
                />
              </div>

              <div className="flex items-center justify-between gap-2 text-[11px] text-slate-500 dark:text-slate-400 mt-2">
                <span className="truncate">
                  Total Volume: <strong className="text-slate-700 dark:text-slate-200 font-semibold">{formatNumber(item.totalVolume)} {item.satuan}</strong>
                </span>
                <span className="group-hover:text-amber-600 dark:group-hover:text-amber-400 transition flex items-center gap-1 shrink-0 font-medium text-slate-400">
                  <span>Filter data ini</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
