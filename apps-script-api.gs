/**
 * ============================================================
 *  RDPT Insight — Google Apps Script REST API
 *  File: apps-script-api.gs
 *
 *  Cara deploy:
 *  1. Buka Google Sheets → Extensions → Apps Script
 *  2. Tempel seluruh kode ini
 *  3. Deploy → New Deployment → Web App
 *     - Execute as: Me
 *     - Who has access: Anyone
 *  4. Salin URL Web App dan tempel di Settings aplikasi
 * ============================================================
 */

// ─────────────────────────────────────────
// KONFIGURASI
// ─────────────────────────────────────────
const SPREADSHEET_ID = ""; // Isi dengan ID spreadsheet Anda, atau biarkan kosong agar otomatis pakai spreadsheet aktif
const SHEET_HARIAN   = "RDPT_Harian_v4_Real";   // Ganti sesuai nama sheet Anda
const SHEET_BULANAN  = "RDPT_Bulanan";           // Ganti sesuai nama sheet Anda
const SHEET_PREDIKSI = "RDPT_Prediksi";          // Ganti sesuai nama sheet Anda

// ─────────────────────────────────────────
// HELPER: CORS HEADERS
// ─────────────────────────────────────────
function buildCorsOutput(data) {
  var output = ContentService.createTextOutput(JSON.stringify(data));
  output.setMimeType(ContentService.MimeType.JSON);
  return output;
}

// ─────────────────────────────────────────
// HELPER: AMBIL SPREADSHEET
// ─────────────────────────────────────────
function getSpreadsheet() {
  if (SPREADSHEET_ID && SPREADSHEET_ID.length > 0) {
    return SpreadsheetApp.openById(SPREADSHEET_ID);
  }
  return SpreadsheetApp.getActiveSpreadsheet();
}

// ─────────────────────────────────────────
// HELPER: BACA SHEET KE JSON
// ─────────────────────────────────────────
function sheetToJson(sheetName) {
  var ss    = getSpreadsheet();
  var sheet = ss.getSheetByName(sheetName);

  if (!sheet) {
    return { status: "error", message: "Sheet '" + sheetName + "' tidak ditemukan." };
  }

  var lastRow = sheet.getLastRow();
  var lastCol = sheet.getLastColumn();

  if (lastRow < 2) {
    return { status: "ok", headers: [], rows: [] };
  }

  var headerRange = sheet.getRange(1, 1, 1, lastCol).getValues()[0];
  var dataRange   = sheet.getRange(2, 1, lastRow - 1, lastCol).getValues();

  var rows = dataRange.map(function(row) {
    var obj = {};
    headerRange.forEach(function(header, idx) {
      var val = row[idx];
      // Format tanggal menjadi string ISO
      if (val instanceof Date) {
        obj[header] = Utilities.formatDate(val, "Asia/Jakarta", "yyyy-MM-dd");
      } else {
        obj[header] = val;
      }
    });
    return obj;
  });

  return { status: "ok", headers: headerRange, rows: rows };
}

// ─────────────────────────────────────────
// doGet: Ambil data dari Google Sheets
// ─────────────────────────────────────────
function doGet(e) {
  try {
    var params = e && e.parameter ? e.parameter : {};
    var sheetParam = params.sheet || "";

    var sheetName;
    if (sheetParam === "bulanan") {
      sheetName = SHEET_BULANAN;
    } else if (sheetParam === "prediksi") {
      sheetName = SHEET_PREDIKSI;
    } else {
      // Default: sheet harian
      sheetName = SHEET_HARIAN;
    }

    var result = sheetToJson(sheetName);
    return buildCorsOutput(result);

  } catch (err) {
    return buildCorsOutput({ status: "error", message: err.toString() });
  }
}

// ─────────────────────────────────────────
// doPost: Tulis data ke Google Sheets
// ─────────────────────────────────────────
function doPost(e) {
  try {
    // Parse body JSON
    var payload;
    try {
      payload = JSON.parse(e.postData.contents);
    } catch (parseErr) {
      return buildCorsOutput({ success: false, message: "Format JSON tidak valid: " + parseErr.toString() });
    }

    var tanggal  = payload.tanggal  || "";
    var kategori = payload.kategori || "";
    var nominal  = Number(payload.nominal) || 0;
    var tipe     = payload.tipe     || "Tambah Modal";

    // Validasi input
    if (!tanggal || !kategori || nominal <= 0) {
      return buildCorsOutput({ success: false, message: "Data tidak lengkap. Pastikan tanggal, kategori, dan nominal terisi." });
    }

    var ss    = getSpreadsheet();
    var sheet = ss.getSheetByName(SHEET_HARIAN);

    if (!sheet) {
      return buildCorsOutput({ success: false, message: "Sheet '" + SHEET_HARIAN + "' tidak ditemukan." });
    }

    var lastCol     = sheet.getLastColumn();
    var lastRow     = sheet.getLastRow();
    var headerRow   = sheet.getRange(1, 1, 1, lastCol).getValues()[0];

    // Cari kolom yang cocok dengan kategori
    var kategoriColIdx = -1;
    for (var i = 0; i < headerRow.length; i++) {
      if (String(headerRow[i]).trim().toLowerCase() === kategori.trim().toLowerCase()) {
        kategoriColIdx = i;
        break;
      }
    }

    if (kategoriColIdx === -1) {
      // Jika kolom kategori tidak ditemukan, tambahkan baris baru dengan format umum
      var newRow = new Array(lastCol).fill("");
      newRow[0] = tanggal;

      // Cari kolom "Keterangan" atau "Tipe"
      var keteranganIdx = headerRow.findIndex(function(h) {
        return h.toLowerCase().includes("ket") || h.toLowerCase().includes("tipe");
      });
      if (keteranganIdx >= 0) newRow[keteranganIdx] = tipe + " - " + kategori;

      // Cari kolom "Nominal" atau "Jumlah"
      var nominalIdx = headerRow.findIndex(function(h) {
        return h.toLowerCase().includes("nominal") || h.toLowerCase().includes("jumlah") || h.toLowerCase().includes("amount");
      });
      if (nominalIdx >= 0) newRow[nominalIdx] = nominal;

      sheet.appendRow(newRow);
      return buildCorsOutput({
        success: true,
        message: "Data berhasil ditambahkan (kolom '" + kategori + "' tidak ditemukan, dicatat di kolom Nominal).",
        tipe: tipe
      });
    }

    // Cari baris berdasarkan tanggal atau tambahkan baris baru
    var tanggalColIdx = 0; // Asumsi kolom pertama adalah tanggal
    var targetRow = -1;

    for (var r = 2; r <= lastRow; r++) {
      var cellVal = sheet.getRange(r, tanggalColIdx + 1).getValue();
      var cellStr;
      if (cellVal instanceof Date) {
        cellStr = Utilities.formatDate(cellVal, "Asia/Jakarta", "yyyy-MM-dd");
      } else {
        cellStr = String(cellVal);
      }
      if (cellStr === tanggal) {
        targetRow = r;
        break;
      }
    }

    if (targetRow > 0) {
      // Baris tanggal sudah ada — update nilai di kolom kategori
      var existingVal = Number(sheet.getRange(targetRow, kategoriColIdx + 1).getValue()) || 0;
      var newVal;

      if (tipe === "Penarikan") {
        newVal = existingVal - nominal;
      } else {
        // Tambah Modal / Reinvestasi Dividen
        newVal = existingVal + nominal;
      }

      sheet.getRange(targetRow, kategoriColIdx + 1).setValue(newVal);
      return buildCorsOutput({
        success: true,
        message: "Data berhasil diperbarui pada baris tanggal " + tanggal + ".",
        tipe: tipe,
        nilai_sebelum: existingVal,
        nilai_sesudah: newVal
      });

    } else {
      // Tanggal belum ada — tambahkan baris baru
      var newRowData = new Array(lastCol).fill("");
      newRowData[tanggalColIdx] = tanggal;
      if (tipe === "Penarikan") {
        newRowData[kategoriColIdx] = -nominal;
      } else {
        newRowData[kategoriColIdx] = nominal;
      }

      sheet.appendRow(newRowData);
      return buildCorsOutput({
        success: true,
        message: "Baris baru berhasil ditambahkan untuk tanggal " + tanggal + ".",
        tipe: tipe
      });
    }

  } catch (err) {
    return buildCorsOutput({ success: false, message: "Terjadi kesalahan: " + err.toString() });
  }
}
