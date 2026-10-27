import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { PNBPRecord, SummaryKPI } from '../types/pnbp';
import { formatRupiah, formatNumber, JENIS_PENDAPATAN_INFO } from './formatters';

export function exportToCSV(records: PNBPRecord[], filenamePrefix = 'Laporan_Capaian_PNBP') {
  const headers = [
    'No',
    'Tanggal Transaksi',
    'Bulan',
    'Tahun',
    'Nama Penjualan / Uraian',
    'Kategori',
    'Total Volume',
    'Satuan',
    'Total Setoran (Rp)',
    'Kode Akun Pendapatan',
    'Uraian Akun',
  ];

  const rows = records.map((r, idx) => [
    idx + 1,
    `"${r.tanggalTransaksi}"`,
    `"${r.bulan}"`,
    `"${r.tahun}"`,
    `"${r.namaPenjualan.replace(/"/g, '""')}"`,
    `"${r.kategori || '-'}"`,
    r.totalVolume,
    `"${r.satuan}"`,
    r.totalSetoran,
    `"${r.jenisPendapatan}"`,
    `"${(JENIS_PENDAPATAN_INFO[r.jenisPendapatan]?.desc || '').replace(/"/g, '""')}"`,
  ]);

  const csvContent = '\uFEFF' + [headers.join(';'), ...rows.map((row) => row.join(';'))].join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  const dateStr = new Date().toISOString().slice(0, 10);
  a.href = url;
  a.download = `${filenamePrefix}_${dateStr}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function exportToPDF(
  records: PNBPRecord[],
  kpi: SummaryKPI,
  subtitle = 'Data Capaian Kinerja PNBP'
) {
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();

  // Document Title
  doc.setFontSize(15);
  doc.setTextColor(15, 23, 42); // slate-900
  doc.setFont('helvetica', 'bold');
  doc.text('LAPORAN CAPAIAN KINERJA PENERIMAAN NEGARA BUKAN PAJAK (PNBP)', pageWidth / 2, 16, {
    align: 'center',
  });

  doc.setFontSize(9.5);
  doc.setTextColor(71, 85, 105); // slate-600
  doc.setFont('helvetica', 'normal');
  const dateStr = new Date().toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
  doc.text(`Sumber: Google Sheets API Sync  |  Dicetak pada: ${dateStr}  |  ${subtitle}`, pageWidth / 2, 23, {
    align: 'center',
  });

  // KPI Summary Bar
  doc.setDrawColor(226, 232, 240);
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(14, 27, pageWidth - 28, 16, 2, 2, 'FD');

  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(30, 41, 59);

  const kpiY = 36;
  const colW = (pageWidth - 28) / 3;
  doc.text(`Total Setoran: ${formatRupiah(kpi.totalSetoran)}`, 18, kpiY);
  doc.text(`Total Transaksi: ${formatNumber(kpi.totalTransaksi)}`, 18 + colW, kpiY);
  const akunDominan = kpi.setoranByJenis[0] ? `${kpi.setoranByJenis[0].kode} (${formatRupiah(kpi.setoranByJenis[0].totalSetoran)})` : '-';
  doc.text(`Akun Terbesar: ${akunDominan}`, 18 + colW * 2, kpiY);

  // Table Body
  const tableRows = records.map((r, index) => [
    index + 1,
    r.tanggalTransaksi,
    r.bulan,
    r.tahun,
    r.namaPenjualan,
    r.kategori || '-',
    `${formatNumber(r.totalVolume)} ${r.satuan}`,
    formatRupiah(r.totalSetoran),
    r.jenisPendapatan,
  ]);

  autoTable(doc, {
    head: [
      [
        'No',
        'Tanggal',
        'Bulan',
        'Tahun',
        'Nama Penjualan / Uraian',
        'Kategori',
        'Volume',
        'Total Setoran',
        'Akun PNBP',
      ],
    ],
    body: tableRows,
    startY: 47,
    theme: 'striped',
    headStyles: {
      fillColor: [15, 23, 42],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 8.5,
      halign: 'center',
    },
    bodyStyles: {
      fontSize: 8,
      textColor: [30, 41, 59],
    },
    columnStyles: {
      0: { halign: 'center', cellWidth: 10 },
      1: { halign: 'center', cellWidth: 22 },
      2: { halign: 'center', cellWidth: 24 },
      3: { halign: 'center', cellWidth: 16 },
      4: { halign: 'left' },
      5: { halign: 'left', cellWidth: 30 },
      6: { halign: 'right', cellWidth: 28 },
      7: { halign: 'right', cellWidth: 34 },
      8: { halign: 'center', cellWidth: 22 },
    },
    foot: [
      [
        '',
        '',
        '',
        '',
        'TOTAL KESELURUHAN',
        '',
        '',
        formatRupiah(kpi.totalSetoran),
        '',
      ],
    ],
    footStyles: {
      fillColor: [241, 245, 249],
      textColor: [15, 23, 42],
      fontStyle: 'bold',
      fontSize: 8.5,
      halign: 'right',
    },
    didDrawPage: (data) => {
      const str = `Halaman ${data.pageNumber}`;
      doc.setFontSize(8);
      doc.setTextColor(148, 163, 184);
      doc.text(str, pageWidth - 20, doc.internal.pageSize.getHeight() - 10, { align: 'right' });
    },
  });

  const fileDate = new Date().toISOString().slice(0, 10);
  doc.save(`Laporan_Capaian_PNBP_${fileDate}.pdf`);
}
