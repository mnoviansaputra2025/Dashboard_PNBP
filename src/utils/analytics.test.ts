import test from 'node:test';
import assert from 'node:assert/strict';
import { parseIndonesianCurrency, formatRupiah, getKategoriFromItem } from './formatters';
import {
  calculateSummaryKPI,
  filterAndSortRecords,
  getSetoranByJenis,
  getTopGroupedSales,
  getMonthlyTrend,
} from './analytics';
import { PNBPRecord, FilterOptions } from '../types/pnbp';

test('parseIndonesianCurrency handles Indonesian dot/comma correctly', () => {
  assert.equal(parseIndonesianCurrency('42.791.000,00'), 42791000);
  assert.equal(parseIndonesianCurrency('140.000,00'), 140000);
  assert.equal(parseIndonesianCurrency('1.575.000,00'), 1575000);
  assert.equal(parseIndonesianCurrency('42,791,000.00'), 42791000);
  assert.equal(parseIndonesianCurrency('140,000.00'), 140000);
  assert.equal(parseIndonesianCurrency('140.000'), 140000);
  assert.equal(parseIndonesianCurrency('140,000'), 140000);
  assert.equal(parseIndonesianCurrency('Rp 500.000'), 500000);
  assert.equal(parseIndonesianCurrency('Rp 42.791.000,00'), 42791000);
  assert.equal(parseIndonesianCurrency(250000), 250000);
  assert.equal(parseIndonesianCurrency(''), 0);
});

test('formatRupiah formats valid IDR values', () => {
  const formatted = formatRupiah(140000);
  assert.ok(formatted.includes('140.000'));
});

test('getKategoriFromItem detects category based on name and account', () => {
  assert.equal(getKategoriFromItem('Benih Mas', '425112'), 'Benih Ikan');
  assert.equal(getKategoriFromItem('Sewa Gedung', '425151'), 'Sewa Gedung');
  assert.equal(getKategoriFromItem('Lelang kendaraan roda dua', '425122'), 'Lelang Kendaraan');
  assert.equal(getKategoriFromItem('Pakan Mandiri', '425112'), 'Pakan Mandiri');
});

test('calculateSummaryKPI aggregates setoranByJenis and top5GroupedSales accurately', () => {
  const sampleRecords: PNBPRecord[] = [
    {
      id: '1',
      tanggalTransaksi: '13/01/2026',
      bulan: 'Januari 2026',
      tahun: '2026',
      namaPenjualan: 'sewa asrama',
      totalVolume: 35,
      satuan: 'Rp',
      totalSetoran: 700000,
      jenisPendapatan: '425151',
      kategori: 'Sewa Fasilitas',
    },
    {
      id: '2',
      tanggalTransaksi: '26/01/2026',
      bulan: 'Januari 2026',
      tahun: '2026',
      namaPenjualan: 'sewa asrama',
      totalVolume: 40,
      satuan: 'Rp',
      totalSetoran: 800000,
      jenisPendapatan: '425151',
      kategori: 'Sewa Fasilitas',
    },
    {
      id: '3',
      tanggalTransaksi: '12/02/2026',
      bulan: 'Februari 2026',
      tahun: '2026',
      namaPenjualan: 'Benih Mas',
      totalVolume: 2500,
      satuan: 'ekor',
      totalSetoran: 450000,
      jenisPendapatan: '425112',
      kategori: 'Benih Ikan',
    },
  ];

  const kpi = calculateSummaryKPI(sampleRecords);
  assert.equal(kpi.totalSetoran, 1950000);
  assert.equal(kpi.totalTransaksi, 3);
  assert.equal(kpi.setoranByJenis.length, 2);

  // Grouped sales for "sewa asrama" should merge the two rows: 700000 + 800000 = 1500000
  const topSales = kpi.top5GroupedSales;
  assert.equal(topSales[0].nama, 'sewa asrama');
  assert.equal(topSales[0].totalSetoran, 1500000);
  assert.equal(topSales[0].transaksiCount, 2);
  assert.equal(topSales[0].totalVolume, 75);
});

test('filterAndSortRecords filters across Tanggal, Bulan, Tahun, Nama, and Akun', () => {
  const sampleRecords: PNBPRecord[] = [
    {
      id: '1',
      tanggalTransaksi: '13/01/2026',
      bulan: 'Januari 2026',
      tahun: '2026',
      namaPenjualan: 'Sewa Gedung',
      totalVolume: 1,
      satuan: 'Hari',
      totalSetoran: 500000,
      jenisPendapatan: '425151',
      kategori: 'Sewa Gedung',
    },
    {
      id: '2',
      tanggalTransaksi: '12/02/2026',
      bulan: 'Februari 2026',
      tahun: '2026',
      namaPenjualan: 'Benih Mas',
      totalVolume: 2500,
      satuan: 'ekor',
      totalSetoran: 450000,
      jenisPendapatan: '425112',
      kategori: 'Benih Ikan',
    },
  ];

  const defaultFilter: FilterOptions = {
    searchQuery: '',
    tanggalTransaksi: 'all',
    bulan: 'all',
    tahun: 'all',
    namaPenjualan: 'all',
    jenisPendapatan: 'all',
    kategori: 'all',
  };

  // Filter by Tanggal
  const byDate = filterAndSortRecords(
    sampleRecords,
    { ...defaultFilter, tanggalTransaksi: '13/01/2026' },
    'totalSetoran',
    'desc'
  );
  assert.equal(byDate.length, 1);
  assert.equal(byDate[0].namaPenjualan, 'Sewa Gedung');

  // Filter by Nama Penjualan
  const byNama = filterAndSortRecords(
    sampleRecords,
    { ...defaultFilter, namaPenjualan: 'Benih Mas' },
    'totalSetoran',
    'desc'
  );
  assert.equal(byNama.length, 1);
  assert.equal(byNama[0].namaPenjualan, 'Benih Mas');

  // Filter by Akun
  const byAkun = filterAndSortRecords(
    sampleRecords,
    { ...defaultFilter, jenisPendapatan: '425151' },
    'totalSetoran',
    'desc'
  );
  assert.equal(byAkun.length, 1);
  assert.equal(byAkun[0].jenisPendapatan, '425151');
});
