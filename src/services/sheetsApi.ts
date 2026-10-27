import { PNBPRecord } from '../types/pnbp';
import { parseIndonesianCurrency, getKategoriFromItem } from '../utils/formatters';

export interface SheetMetadata {
  id: string;
  title: string;
  sheets: Array<{
    sheetId: number;
    title: string;
    rowCount: number;
    columnCount: number;
  }>;
}

export function extractSpreadsheetId(input: string): string {
  if (!input) return '';
  const trimmed = input.trim();
  const match = trimmed.match(/\/d\/([a-zA-Z0-9-_]+)/);
  if (match && match[1]) {
    return match[1];
  }
  return trimmed;
}

export async function fetchSpreadsheetMetadata(
  spreadsheetId: string,
  accessToken: string
): Promise<SheetMetadata> {
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}?fields=properties.title,sheets.properties`;
  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Google Sheets API Error (${res.status}): ${errorText}`);
  }

  const data = await res.json();
  const sheets = (data.sheets || []).map((s: any) => ({
    sheetId: s.properties?.sheetId,
    title: s.properties?.title || 'Sheet1',
    rowCount: s.properties?.gridProperties?.rowCount || 0,
    columnCount: s.properties?.gridProperties?.columnCount || 0,
  }));

  return {
    id: spreadsheetId,
    title: data.properties?.title || 'Data Capaian Kinerja',
    sheets,
  };
}

export const GOOGLE_APPS_SCRIPT_CODE = `/**
 * ==============================================================================
 * GOOGLE APPS SCRIPT: API PENGHUBUNG GOOGLE SHEETS & DASHBOARD PNBP
 * ==============================================================================
 * Petunjuk Pemasangan:
 * 1. Di Google Sheets Anda (Data_Capaian_Kinerja), klik menu "Extensions" > "Apps Script".
 * 2. Hapus semua kode default di Code.gs, lalu tempelkan (paste) seluruh kode di bawah ini.
 * 3. Klik tombol "Save" (ikon disket).
 * 4. Klik "Deploy" (di kanan atas) > "New deployment".
 * 5. Klik ikon gerigi (Select type) > pilih "Web app".
 * 6. Isi konfigurasi:
 *    - Description: "PNBP Realtime API"
 *    - Execute as: "Me" (email akun Google Anda)
 *    - Who has access: "Anyone" (Siapa saja - agar dashboard dapat membaca data via API)
 * 7. Klik "Deploy", lalu berikan izin akses (Authorize access).
 * 8. Salin URL "Web app URL" (berakhir dengan /exec) dan tempelkan ke aplikasi Dashboard PNBP!
 * ==============================================================================
 */

function doGet(e) {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheetName = (e && e.parameter && e.parameter.sheet) ? e.parameter.sheet : "Row_Data_PNBP";
    var action = (e && e.parameter && e.parameter.action) ? e.parameter.action : "getData";
    
    // Action 1: Ambil daftar nama tab lembar kerja
    if (action === "getSheets") {
      var sheets = ss.getSheets().map(function(s) {
        return {
          name: s.getName(),
          rowCount: s.getLastRow(),
          colCount: s.getLastColumn()
        };
      });
      return createJsonResponse({ status: "success", sheets: sheets });
    }
    
    // Action 2: Ambil data tabel PNBP
    var sheet = ss.getSheetByName(sheetName);
    if (!sheet) {
      // Jika tab spesifik tidak ditemukan, gunakan tab pertama
      sheet = ss.getSheets()[0];
      sheetName = sheet.getName();
    }
    
    var lastRow = sheet.getLastRow();
    var lastCol = Math.max(sheet.getLastColumn(), 8);
    
    if (lastRow < 2) {
      return createJsonResponse({
        status: "success",
        sheetName: sheetName,
        totalRows: 0,
        data: []
      });
    }
    
    // Ambil data nilai numerik dan format tampilan
    var range = sheet.getRange(1, 1, lastRow, lastCol);
    var rawValues = range.getValues(); // Angka murni dari spreadsheet
    var displayValues = range.getDisplayValues(); // Format tanggal & teks
    
    var finalData = [];
    finalData.push(displayValues[0]); // Header kolom
    
    for (var r = 1; r < rawValues.length; r++) {
      var row = [];
      for (var c = 0; c < lastCol; c++) {
        var rawVal = rawValues[r][c];
        var dispVal = displayValues[r][c];
        if (typeof rawVal === 'number' && !isNaN(rawVal)) {
          row.push(rawVal);
        } else {
          row.push(dispVal);
        }
      }
      finalData.push(row);
    }
    
    return createJsonResponse({
      status: "success",
      sheetName: sheetName,
      totalRows: finalData.length - 1,
      lastUpdated: new Date().toISOString(),
      data: finalData
    });
    
  } catch (error) {
    return createJsonResponse({
      status: "error",
      message: error.toString()
    });
  }
}

/**
 * Endpoint POST untuk menambahkan transaksi baru dari Dashboard langsung ke Google Sheets
 */
function doPost(e) {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheetName = "Row_Data_PNBP";
    var sheet = ss.getSheetByName(sheetName) || ss.getSheets()[0];
    
    var requestData = JSON.parse(e.postData.contents);
    
    // Kolom: Tanggal, Bulan, Tahun, Nama_Penjualan, Total Volume, Satuan, Total_setoran, Jenis_Pendapatan
    sheet.appendRow([
      requestData.tanggalTransaksi || "",
      requestData.bulan || "",
      requestData.tahun || "2026",
      requestData.namaPenjualan || "",
      requestData.totalVolume || 1,
      requestData.satuan || "ekor",
      requestData.totalSetoran || 0,
      requestData.jenisPendapatan || "425112"
    ]);
    
    return createJsonResponse({
      status: "success",
      message: "Data transaksi berhasil ditambahkan ke Google Sheets"
    });
  } catch (err) {
    return createJsonResponse({
      status: "error",
      message: err.toString()
    });
  }
}

/**
 * Trigger otomatis ketika spreadsheet diedit
 */
function onEdit(e) {
  // Opsional: Memperbarui timestamp perubahan di PropertiesService
  PropertiesService.getScriptProperties().setProperty("LAST_EDIT", new Date().toISOString());
}

function createJsonResponse(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
`;

export async function fetchSheetPNBPRecords(
  spreadsheetId: string,
  sheetName: string,
  accessToken?: string | null
): Promise<{ records: PNBPRecord[]; sheetTitle: string }> {
  // If input is a Google Apps Script Web App URL
  if (spreadsheetId.includes('script.google.com/macros/s/')) {
    const separator = spreadsheetId.includes('?') ? '&' : '?';
    const scriptUrl = `${spreadsheetId}${separator}sheet=${encodeURIComponent(sheetName)}&action=getData`;
    const res = await fetch(scriptUrl);
    if (!res.ok) {
      throw new Error(`Google Apps Script API Error: ${res.statusText}`);
    }
    const json = await res.json();
    if (json.status === 'success' && Array.isArray(json.data)) {
      const records = parseSheetRows(json.data);
      return { records, sheetTitle: json.sheetName || sheetName };
    }
    if (Array.isArray(json)) {
      const records = parseSheetRows(json);
      return { records, sheetTitle: sheetName };
    }
    throw new Error(json.message || 'Gagal memproses respons dari Google Apps Script');
  }

  // If we have an access token, use Google Sheets API v4
  if (accessToken) {
    // A:Z queries all rows in the sheet without any row limits
    const range = encodeURIComponent(`${sheetName}!A:Z`);
    const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${range}?valueRenderOption=UNFORMATTED_VALUE&dateTimeRenderOption=FORMATTED_STRING`;
    const res = await fetch(url, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!res.ok) {
      const err = await res.text();
      throw new Error(`Gagal mengambil data dari Google Sheets (${res.status}): ${err}`);
    }

    const data = await res.json();
    const rows: any[][] = data.values || [];
    if (rows.length <= 1) {
      return { records: [], sheetTitle: sheetName };
    }

    const records = parseSheetRows(rows);
    return { records, sheetTitle: sheetName };
  }

  // Fallback: If public sheet or published CSV
  try {
    const csvUrl = `https://docs.google.com/spreadsheets/d/${spreadsheetId}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(sheetName)}`;
    const res = await fetch(csvUrl);
    if (res.ok) {
      const csvText = await res.text();
      const rows = parseCSV(csvText);
      const records = parseSheetRows(rows);
      return { records, sheetTitle: sheetName };
    }
  } catch (err) {
    console.warn('Public CSV fetch fallback failed:', err);
  }

  throw new Error('Memerlukan login Google atau izin akses Google Sheets.');
}

export function parseSheetRows(rows: any[][]): PNBPRecord[] {
  if (rows.length < 2) return [];

  const headerRow = rows[0].map((h: any) => String(h || '').trim().toLowerCase());

  // 1. Column for Transaction Date
  let colTanggal = headerRow.findIndex((h) => h.includes('tanggal') || h.includes('tgl') || h.includes('date'));

  // 2. Column for Month
  let colBulan = headerRow.findIndex((h) => h.includes('bulan') || h.includes('month'));

  // 3. Column for Year
  let colTahun = headerRow.findIndex((h) => h.includes('tahun') || h.includes('year'));

  // 4. Column for Sales Name / Description
  let colNama = headerRow.findIndex((h) =>
    h.includes('nama') || h.includes('penjualan') || h.includes('uraian') || h.includes('komoditas') || h.includes('item')
  );

  // 5. Column for Volume - MUST prioritize 'vol' and avoid 'setor'
  let colVolume = headerRow.findIndex((h) => (h.includes('vol') || h.includes('kuantum')) && !h.includes('setor'));
  if (colVolume === -1) {
    colVolume = headerRow.findIndex((h) => h.includes('jumlah') && !h.includes('setor') && !h.includes('nilai'));
  }

  // 6. Column for Unit
  let colSatuan = headerRow.findIndex((h) => h.includes('satuan') || h.includes('unit'));

  // 7. Column for Total Setoran - MUST prioritize 'setor' and strictly avoid 'vol'
  let colSetoran = headerRow.findIndex((h) => h.includes('setor'));
  if (colSetoran === -1) {
    colSetoran = headerRow.findIndex((h) =>
      (h.includes('nilai') || h.includes('nominal') || h.includes('penerimaan') || h.includes('total')) &&
      !h.includes('vol') &&
      !h.includes('kuantum')
    );
  }

  // 8. Column for PNBP Account Code
  let colAkun = headerRow.findIndex((h) => h.includes('jenis') || h.includes('akun') || h.includes('kode'));

  // Fallbacks based on standard PNBP spreadsheet layout
  if (colTanggal === -1) colTanggal = 0;
  if (colBulan === -1) colBulan = 1;
  if (colTahun === -1) colTahun = 2;
  if (colNama === -1) colNama = 3;
  if (colVolume === -1) colVolume = 4;
  if (colSatuan === -1) colSatuan = 5;
  if (colSetoran === -1) colSetoran = 6;
  if (colAkun === -1) colAkun = 7;

  const records: PNBPRecord[] = [];

  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    if (!row || row.length === 0) continue;

    const nama = String(row[colNama] || '').trim();
    if (!nama) continue;

    // Filter out footer summary rows like "TOTAL", "JUMLAH", "SUM", etc.
    const namaLower = nama.toLowerCase();
    if (
      namaLower === 'total' ||
      namaLower === 'jumlah' ||
      namaLower === 'grand total' ||
      namaLower === 'total setoran' ||
      namaLower === 'total volume' ||
      namaLower === 'sum' ||
      namaLower.startsWith('total ') ||
      namaLower.startsWith('jumlah ')
    ) {
      continue;
    }

    const tanggal = String(row[colTanggal] || '').trim();
    const bulan = String(row[colBulan] || '').trim();
    const tahun = String(row[colTahun] || '2026').trim();

    // Parse volume
    let volRaw = row[colVolume];
    let volNum = typeof volRaw === 'number' ? volRaw : parseIndonesianCurrency(volRaw);
    if (isNaN(volNum) || volNum === null || volNum === undefined) volNum = 1;

    const satuan = String(row[colSatuan] || '').trim();
    
    // Parse setoran - handles raw numbers and formatted strings
    const setoranRaw = row[colSetoran];
    const setoranNum = parseIndonesianCurrency(setoranRaw);

    const akun = String(row[colAkun] || '425112').trim();

    records.push({
      id: `sheet-rec-${i}`,
      tanggalTransaksi: tanggal || '13/01/2026',
      bulan: bulan || 'Januari 2026',
      tahun: tahun || '2026',
      namaPenjualan: nama,
      totalVolume: volNum,
      satuan: satuan || 'ekor',
      totalSetoran: setoranNum,
      jenisPendapatan: akun,
      kategori: getKategoriFromItem(nama, akun),
    });
  }

  return records;
}

function parseCSV(text: string): string[][] {
  const lines = text.split(/\r?\n/);
  return lines
    .filter((l) => l.trim().length > 0)
    .map((line) => {
      const row: string[] = [];
      let inQuotes = false;
      let current = '';

      for (let i = 0; i < line.length; i++) {
        const char = line[i];
        if (char === '"') {
          inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
          row.push(current.replace(/^"|"$/g, '').trim());
          current = '';
        } else {
          current += char;
        }
      }
      row.push(current.replace(/^"|"$/g, '').trim());
      return row;
    });
}
