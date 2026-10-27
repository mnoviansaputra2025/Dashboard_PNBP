/**
 * Utilities for formatting and parsing Indonesian currency, numbers, and dates
 */

export function parseIndonesianCurrency(val: string | number): number {
  if (typeof val === 'number') {
    return isNaN(val) ? 0 : val;
  }
  if (!val) return 0;

  // Clean string: remove "Rp", spaces, NBSP
  let str = String(val).trim().replace(/^Rp\.?\s*/i, '').replace(/\s+/g, '');

  const lastDot = str.lastIndexOf('.');
  const lastComma = str.lastIndexOf(',');

  if (lastDot !== -1 && lastComma !== -1) {
    if (lastComma > lastDot) {
      // Indonesian format: 42.791.000,00 -> comma is decimal
      str = str.replace(/\./g, '').replace(',', '.');
    } else {
      // US format: 42,791,000.00 -> dot is decimal, commas are thousand separators
      str = str.replace(/,/g, '');
    }
  } else if (lastComma !== -1) {
    // Only comma
    const parts = str.split(',');
    if (parts.length > 2) {
      // Multiple commas: e.g. 42,791,000
      str = str.replace(/,/g, '');
    } else if (parts[1]?.length === 3) {
      // Single comma followed by 3 digits: e.g. 140,000
      str = str.replace(/,/g, '');
    } else {
      // Decimal comma: e.g. 140,50
      str = str.replace(',', '.');
    }
  } else if (lastDot !== -1) {
    // Only dot
    const parts = str.split('.');
    if (parts.length > 2) {
      // Multiple dots: e.g. 42.791.000
      str = str.replace(/\./g, '');
    } else if (parts[1]?.length === 3) {
      // Single dot followed by 3 digits: e.g. 140.000
      str = str.replace(/\./g, '');
    }
  }

  const parsed = parseFloat(str);
  return isNaN(parsed) ? 0 : parsed;
}

export function formatRupiah(amount: number, includeDecimals = false): string {
  if (isNaN(amount) || amount === null || amount === undefined) return 'Rp 0';

  const formatted = new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: includeDecimals ? 2 : 0,
    maximumFractionDigits: includeDecimals ? 2 : 0,
  }).format(amount);

  return formatted;
}

export function formatNumber(val: number): string {
  if (isNaN(val) || val === null || val === undefined) return '0';
  return new Intl.NumberFormat('id-ID').format(val);
}

export const JENIS_PENDAPATAN_INFO: Record<
  string,
  { label: string; shortLabel: string; desc: string; badgeColor: string }
> = {
  '425112': {
    label: '425112 - Pendapatan Penjualan Hasil Pertanian, Perkebunan, Peternakan dan Budidaya',
    shortLabel: '425112 - Hasil Pertanian, Peternakan & Budidaya',
    desc: 'Pendapatan Penjualan Hasil Pertanian, Perkebunan, Peternakan dan Budidaya',
    badgeColor: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20 dark:bg-emerald-500/20 dark:text-emerald-300',
  },
  '425122': {
    label: '425122 - Pendapatan dari Penjualan Peralatan dan Mesin',
    shortLabel: '425122 - Penjualan Peralatan dan Mesin',
    desc: 'Pendapatan dari Penjualan Peralatan dan Mesin',
    badgeColor: 'bg-amber-500/10 text-amber-600 border-amber-500/20 dark:bg-amber-500/20 dark:text-amber-300',
  },
  '425151': {
    label: '425151 - Pendapatan Penggunaan Sarana dan Prasarana sesuai dengan Tusi',
    shortLabel: '425151 - Sarana dan Prasarana (Tusi)',
    desc: 'Pendapatan Penggunaan Sarana dan Prasarana sesuai dengan Tusi',
    badgeColor: 'bg-sky-500/10 text-sky-600 border-sky-500/20 dark:bg-sky-500/20 dark:text-sky-300',
  },
};

export function getJenisPendapatanBadge(kode: string) {
  return (
    JENIS_PENDAPATAN_INFO[kode] || {
      label: `${kode} - Pendapatan PNBP Lainnya`,
      shortLabel: `${kode} - Lainnya`,
      desc: `Akun Pendapatan PNBP Lainnya (${kode})`,
      badgeColor:
        'bg-purple-500/10 text-purple-600 border-purple-500/20 dark:bg-purple-500/20 dark:text-purple-300',
    }
  );
}

export function getKategoriFromItem(namaPenjualan: string, jenisPendapatan: string): string {
  const lower = namaPenjualan.toLowerCase();
  if (lower.includes('benih')) return 'Benih Ikan';
  if (lower.includes('calin')) return 'Calon Induk Ikan';
  if (lower.includes('induk')) return 'Induk Ikan';
  if (lower.includes('pakan')) return 'Pakan Mandiri';
  if (lower.includes('sewa')) {
    if (lower.includes('gedung')) return 'Sewa Gedung';
    if (lower.includes('asrama')) return 'Sewa Asrama';
    if (lower.includes('pick up') || lower.includes('kendaraan')) return 'Sewa Kendaraan';
    return 'Sewa Fasilitas';
  }
  if (lower.includes('lelang')) return 'Lelang Kendaraan';

  if (jenisPendapatan === '425112') return 'Produk Perikanan';
  if (jenisPendapatan === '425151') return 'Sewa Fasilitas';
  if (jenisPendapatan === '425122') return 'Lelang Aset';

  return 'Lainnya';
}
