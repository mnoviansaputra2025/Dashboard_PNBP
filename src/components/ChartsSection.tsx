import React, { useState, useMemo } from 'react';
import {
  BarChart3,
  PieChart,
  DollarSign,
  Package,
  LayoutGrid,
  AlignLeft,
  Filter,
} from 'lucide-react';
import { PNBPRecord } from '../types/pnbp';
import {
  getMonthlyTrend,
  getRevenueByAkunPie,
  getRevenueByCategoryPie,
  PieChartItem,
} from '../utils/analytics';
import { formatRupiah, formatNumber, JENIS_PENDAPATAN_INFO } from '../utils/formatters';

interface ChartsSectionProps {
  records: PNBPRecord[];
  allSalesNames: string[];
  onSelectMonth?: (bulan: string) => void;
  onSelectAkun?: (akun: string) => void;
  onSelectCategory?: (kategori: string) => void;
}

export const ChartsSection: React.FC<ChartsSectionProps> = ({
  records,
  allSalesNames,
  onSelectMonth,
  onSelectAkun,
  onSelectCategory,
}) => {
  // Metric state: Total Setoran (IDR) or Total Volume
  const [metricMode, setMetricMode] = useState<'setoran' | 'volume'>('setoran');

  // Chart layout mode: 'horizontal-months' (bulan memanjang horizontal di sumbu X) vs 'stacked-bars'
  const [chartLayout, setChartLayout] = useState<'horizontal-months' | 'stacked-bars'>('horizontal-months');

  // Chart-specific filters
  const [chartFilterNama, setChartFilterNama] = useState<string>('all');
  const [chartFilterAkun, setChartFilterAkun] = useState<string>('all');

  // Pie chart state
  const [pieChartMode, setPieChartMode] = useState<'akun' | 'category'>('akun');
  const [hoveredPieIndex, setHoveredPieIndex] = useState<number | null>(null);

  // Filtered monthly trend data
  const monthlyData = useMemo(() => {
    return getMonthlyTrend(records, chartFilterNama, chartFilterAkun);
  }, [records, chartFilterNama, chartFilterAkun]);

  const pieData: PieChartItem[] =
    pieChartMode === 'akun' ? getRevenueByAkunPie(records) : getRevenueByCategoryPie(records);

  const totalPieValue = pieData.reduce((sum, item) => sum + item.value, 0);

  const radius = 64;
  const strokeWidth = 24;
  const circumference = 2 * Math.PI * radius;
  let accumulatedAngle = 0;

  // Calculate max metric value for chart scaling
  const maxMetricVal = useMemo(() => {
    if (monthlyData.length === 0) return 1;
    return Math.max(
      ...monthlyData.map((d) => (metricMode === 'setoran' ? d.totalSetoran : d.totalVolume)),
      1
    );
  }, [monthlyData, metricMode]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      {/* LEFT: GRAFIK TREN PENERIMAAN BULANAN (PNBP) */}
      <div className="lg:col-span-7 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 p-5 sm:p-6 shadow-xs hover:shadow-sm transition-all duration-200 flex flex-col justify-between overflow-hidden">
        {/* Header & Switchers */}
        <div>
          <div className="flex flex-wrap items-center justify-between gap-3 pb-3.5 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 shrink-0">
                <BarChart3 className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <h2 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white truncate">
                  Tren Penerimaan Bulanan (PNBP)
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                  {chartLayout === 'horizontal-months'
                    ? 'Bulan memanjang horisontal (Sumbu X) | Sumbu Y: Nilai'
                    : 'Sumbu Y: Bulan | Sumbu X: Nilai'}
                </p>
              </div>
            </div>

            {/* Segmented Controls for Layout & Metric */}
            <div className="flex flex-wrap items-center gap-2">
              {/* Layout Switcher (Bulan Horisontal vs Daftar Bar) */}
              <div className="inline-flex p-1 rounded-xl bg-slate-100 dark:bg-slate-800/90 border border-slate-200/70 dark:border-slate-700/60 text-xs font-semibold">
                <button
                  onClick={() => setChartLayout('horizontal-months')}
                  title="Tampilan Bulan Horisontal (Sumbu X: Bulan)"
                  className={`px-2.5 py-1 sm:py-1.5 rounded-lg transition-all duration-150 flex items-center gap-1.5 cursor-pointer text-xs ${
                    chartLayout === 'horizontal-months'
                      ? 'bg-white dark:bg-slate-700 text-emerald-600 dark:text-emerald-400 shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                  }`}
                >
                  <LayoutGrid className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Bulan Horisontal</span>
                </button>
                <button
                  onClick={() => setChartLayout('stacked-bars')}
                  title="Tampilan Daftar Batang (Sumbu Y: Bulan)"
                  className={`px-2.5 py-1 sm:py-1.5 rounded-lg transition-all duration-150 flex items-center gap-1.5 cursor-pointer text-xs ${
                    chartLayout === 'stacked-bars'
                      ? 'bg-white dark:bg-slate-700 text-emerald-600 dark:text-emerald-400 shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                  }`}
                >
                  <AlignLeft className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Daftar Bar</span>
                </button>
              </div>

              {/* Metric Switcher (Setoran vs Volume) */}
              <div className="inline-flex p-1 rounded-xl bg-slate-100 dark:bg-slate-800/90 border border-slate-200/70 dark:border-slate-700/60 text-xs font-semibold">
                <button
                  onClick={() => setMetricMode('setoran')}
                  className={`px-2.5 py-1 sm:py-1.5 rounded-lg transition-all duration-150 flex items-center gap-1.5 cursor-pointer text-xs ${
                    metricMode === 'setoran'
                      ? 'bg-white dark:bg-slate-700 text-emerald-600 dark:text-emerald-400 shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                  }`}
                >
                  <DollarSign className="w-3.5 h-3.5" />
                  <span>Setoran (Rp)</span>
                </button>
                <button
                  onClick={() => setMetricMode('volume')}
                  className={`px-2.5 py-1 sm:py-1.5 rounded-lg transition-all duration-150 flex items-center gap-1.5 cursor-pointer text-xs ${
                    metricMode === 'volume'
                      ? 'bg-white dark:bg-slate-700 text-emerald-600 dark:text-emerald-400 shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                  }`}
                >
                  <Package className="w-3.5 h-3.5" />
                  <span>Volume</span>
                </button>
              </div>
            </div>
          </div>

          {/* In-Chart Filter Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3.5 p-3 rounded-xl bg-slate-50/80 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 text-xs">
            <div className="min-w-0">
              <label htmlFor="chart-nama-filter" className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-1 truncate">
                Filter Nama Penjualan:
              </label>
              <select
                id="chart-nama-filter"
                value={chartFilterNama}
                onChange={(e) => setChartFilterNama(e.target.value)}
                className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 cursor-pointer focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition truncate"
              >
                <option value="all">Semua Nama Penjualan</option>
                {allSalesNames.map((nama) => (
                  <option key={nama} value={nama}>
                    {nama}
                  </option>
                ))}
              </select>
            </div>

            <div className="min-w-0">
              <label htmlFor="chart-akun-filter" className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-1 truncate">
                Filter Jenis Pendapatan:
              </label>
              <select
                id="chart-akun-filter"
                value={chartFilterAkun}
                onChange={(e) => setChartFilterAkun(e.target.value)}
                className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 cursor-pointer focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition truncate"
              >
                <option value="all">Semua Jenis Pendapatan</option>
                {Object.entries(JENIS_PENDAPATAN_INFO).map(([code, info]) => (
                  <option key={code} value={code} title={info.desc}>
                    {info.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* CHART VISUALIZATION */}
        <div className="py-4 min-h-[290px] flex flex-col justify-center overflow-x-auto">
          {monthlyData.length === 0 ? (
            <div className="text-center py-12 text-slate-400 text-xs">
              Tidak ada data yang cocok dengan kombinasi filter grafik.
            </div>
          ) : chartLayout === 'horizontal-months' ? (
            /* TAMPILAN KHUSUS PC: BULAN MEMANJANG SECARA HORISONTAL */
            <div className="w-full min-w-[320px] pt-4 pb-2">
              <div className="grid grid-flow-col auto-cols-fr gap-3 sm:gap-6 items-end h-60 px-3 pb-2 border-b border-slate-200 dark:border-slate-700 relative">
                {/* Background dashed guideline */}
                <div className="absolute inset-x-0 top-1/2 border-b border-dashed border-slate-200/80 dark:border-slate-800 pointer-events-none" />
                <div className="absolute inset-x-0 top-1/4 border-b border-dashed border-slate-100 dark:border-slate-800/60 pointer-events-none" />

                {monthlyData.map((d) => {
                  const currentVal = metricMode === 'setoran' ? d.totalSetoran : d.totalVolume;
                  const heightPercent = Math.max(12, Math.round((currentVal / maxMetricVal) * 100));

                  return (
                    <div
                      key={d.bulan}
                      onClick={() => onSelectMonth && onSelectMonth(d.bulan)}
                      className="group flex flex-col items-center h-full justify-end cursor-pointer transition relative z-10"
                    >
                      {/* Metric Value Label on Top of Bar */}
                      <div className="mb-2 text-center transition-all duration-200">
                        <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block tabular-nums truncate max-w-[100px]">
                          {metricMode === 'setoran' ? formatRupiah(d.totalSetoran) : formatNumber(d.totalVolume)}
                        </span>
                        <span className="text-[10px] text-slate-400 font-medium">
                          {d.count} transaksi
                        </span>
                      </div>

                      {/* Vertical Bar */}
                      <div className="w-full max-w-[56px] bg-slate-100/80 dark:bg-slate-800/80 rounded-t-xl overflow-hidden flex items-end p-0.5 h-full">
                        <div
                          className="w-full bg-gradient-to-t from-emerald-600 via-emerald-500 to-teal-400 rounded-t-lg transition-all duration-500 group-hover:from-emerald-500 group-hover:to-teal-300 shadow-xs"
                          style={{ height: `${heightPercent}%` }}
                        />
                      </div>

                      {/* Month Label (X Axis) */}
                      <div className="mt-2.5 text-center">
                        <span className="text-xs font-bold text-slate-700 dark:text-slate-300 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition block truncate">
                          {d.bulan}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            /* TAMPILAN DAFTAR BAR HORISONTAL */
            <div className="space-y-3">
              {monthlyData.map((d) => {
                const currentVal = metricMode === 'setoran' ? d.totalSetoran : d.totalVolume;
                const widthPercent = Math.max(6, Math.round((currentVal / maxMetricVal) * 100));

                return (
                  <div
                    key={d.bulan}
                    onClick={() => onSelectMonth && onSelectMonth(d.bulan)}
                    className="group cursor-pointer p-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-all duration-150 overflow-hidden"
                  >
                    <div className="flex items-center justify-between text-xs mb-1.5 gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="font-bold text-slate-800 dark:text-slate-200 truncate">
                          {d.bulan}
                        </span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 shrink-0 font-medium">
                          {d.count} trx
                        </span>
                      </div>

                      <div className="flex items-center gap-2 font-bold text-emerald-600 dark:text-emerald-400 shrink-0 tabular-nums">
                        <span>
                          {metricMode === 'setoran'
                            ? formatRupiah(d.totalSetoran)
                            : `${formatNumber(d.totalVolume)} volume`}
                        </span>
                      </div>
                    </div>

                    <div className="w-full bg-slate-100 dark:bg-slate-800 h-3 rounded-full overflow-hidden p-0.5">
                      <div
                        className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full transition-all duration-500 group-hover:from-emerald-400 group-hover:to-teal-300 flex items-center justify-end pr-2 text-[9px] font-bold text-white"
                        style={{ width: `${widthPercent}%` }}
                      >
                        {widthPercent > 20 && <span>{widthPercent}%</span>}
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-slate-400 mt-1">
                      <span className="truncate">
                        {metricMode === 'setoran'
                          ? `Total Volume: ${formatNumber(d.totalVolume)}`
                          : `Total Setoran: ${formatRupiah(d.totalSetoran)}`}
                      </span>
                      <span className="group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition shrink-0 font-medium">
                        Klik untuk filter
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer info */}
        <div className="pt-3 text-xs text-slate-400 text-center border-t border-slate-100 dark:border-slate-800">
          💡 Klik kolom atau baris bulan untuk menyaring transaksi pada tabel secara instan.
        </div>
      </div>

      {/* RIGHT: GRAFIK PIE / DONUT */}
      <div className="lg:col-span-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 p-5 sm:p-6 shadow-xs hover:shadow-sm transition-all duration-200 flex flex-col justify-between overflow-hidden">
        <div>
          <div className="flex flex-wrap items-center justify-between gap-3 pb-3.5 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="p-2 rounded-xl bg-sky-500/10 text-sky-600 dark:text-sky-400 border border-sky-500/20 shrink-0">
                <PieChart className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <h2 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white truncate">
                  {pieChartMode === 'akun' ? 'Distribusi Akun PNBP' : 'Distribusi Kategori'}
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                  {pieChartMode === 'akun'
                    ? 'Porsi setoran per kode akun penerimaan'
                    : 'Porsi setoran per kelompok komoditas'}
                </p>
              </div>
            </div>

            <div className="inline-flex p-1 rounded-xl bg-slate-100 dark:bg-slate-800/90 border border-slate-200/70 dark:border-slate-700/60 text-xs font-semibold">
              <button
                onClick={() => {
                  setPieChartMode('akun');
                  setHoveredPieIndex(null);
                }}
                className={`px-2.5 py-1 sm:py-1.5 rounded-lg transition-all duration-150 cursor-pointer text-xs ${
                  pieChartMode === 'akun'
                    ? 'bg-white dark:bg-slate-700 text-sky-600 dark:text-sky-400 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                Akun PNBP
              </button>
              <button
                onClick={() => {
                  setPieChartMode('category');
                  setHoveredPieIndex(null);
                }}
                className={`px-2.5 py-1 sm:py-1.5 rounded-lg transition-all duration-150 cursor-pointer text-xs ${
                  pieChartMode === 'category'
                    ? 'bg-white dark:bg-slate-700 text-sky-600 dark:text-sky-400 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                Kategori
              </button>
            </div>
          </div>

          {/* Donut and Legend */}
          <div className="py-5 flex flex-col sm:flex-row items-center justify-around gap-5 sm:gap-6">
            <div className="relative w-40 h-40 sm:w-44 sm:h-44 flex items-center justify-center shrink-0">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 160 160">
                <circle
                  cx="80"
                  cy="80"
                  r={radius}
                  className="text-slate-100 dark:text-slate-800 stroke-current"
                  strokeWidth={strokeWidth}
                  fill="transparent"
                />
                {pieData.map((item, index) => {
                  const strokeDasharray = `${(item.percentage / 100) * circumference} ${circumference}`;
                  const strokeDashoffset = -accumulatedAngle;
                  accumulatedAngle += (item.percentage / 100) * circumference;

                  const isHovered = hoveredPieIndex === index;

                  return (
                    <circle
                      key={item.id}
                      cx="80"
                      cy="80"
                      r={radius}
                      fill="transparent"
                      stroke={item.color}
                      strokeWidth={isHovered ? strokeWidth + 4 : strokeWidth}
                      strokeDasharray={strokeDasharray}
                      strokeDashoffset={strokeDashoffset}
                      className="transition-all duration-300 cursor-pointer"
                      onMouseEnter={() => setHoveredPieIndex(index)}
                      onMouseLeave={() => setHoveredPieIndex(null)}
                      onClick={() => {
                        if (pieChartMode === 'akun' && onSelectAkun) {
                          onSelectAkun(item.id);
                        } else if (pieChartMode === 'category' && onSelectCategory) {
                          onSelectCategory(item.id);
                        }
                      }}
                    />
                  );
                })}
              </svg>

              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center px-3">
                {hoveredPieIndex !== null && pieData[hoveredPieIndex] ? (
                  <>
                    <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                      {pieData[hoveredPieIndex].percentage.toFixed(1)}%
                    </span>
                    <span className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white tabular-nums truncate max-w-[110px]">
                      {formatRupiah(pieData[hoveredPieIndex].value)}
                    </span>
                  </>
                ) : (
                  <>
                    <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                      Total Setor
                    </span>
                    <span className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white tabular-nums truncate max-w-[110px]">
                      {formatRupiah(totalPieValue)}
                    </span>
                  </>
                )}
              </div>
            </div>

            <div className="flex-1 w-full space-y-2 min-w-0">
              {pieData.map((item, index) => {
                const isHovered = hoveredPieIndex === index;
                return (
                  <div
                    key={item.id}
                    onMouseEnter={() => setHoveredPieIndex(index)}
                    onMouseLeave={() => setHoveredPieIndex(null)}
                    onClick={() => {
                      if (pieChartMode === 'akun' && onSelectAkun) {
                        onSelectAkun(item.id);
                      } else if (pieChartMode === 'category' && onSelectCategory) {
                        onSelectCategory(item.id);
                      }
                    }}
                    className={`p-2.5 rounded-xl text-xs transition-all duration-150 cursor-pointer flex items-center justify-between border overflow-hidden ${
                      isHovered
                        ? 'bg-slate-100/90 dark:bg-slate-800 border-slate-300/80 dark:border-slate-700 shadow-xs'
                        : 'border-transparent hover:bg-slate-50 dark:hover:bg-slate-800/40'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0 flex-1 mr-2">
                      <span
                        className="w-2.5 h-2.5 rounded-full shrink-0 shadow-xs"
                        style={{ backgroundColor: item.color }}
                      />
                      <span
                        className="font-medium text-slate-800 dark:text-slate-200 truncate text-xs"
                        title={item.fullLabel || item.desc || item.label}
                      >
                        {item.label}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 shrink-0 whitespace-nowrap">
                      <span className="font-bold text-slate-700 dark:text-slate-300 text-xs tabular-nums">
                        {item.percentage.toFixed(1)}%
                      </span>
                      <span className="text-xs text-slate-400 hidden xl:inline tabular-nums">
                        ({formatRupiah(item.value)})
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className="pt-3 text-xs text-slate-400 text-center border-t border-slate-100 dark:border-slate-800">
          Klik segmen pie untuk memfilter tabel secara instan.
        </div>
      </div>
    </div>
  );
};
