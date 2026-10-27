/**
 * Admin Service: Authentication, Session, and Google Sheets Password Storage
 * Initial default admin password: "admin123"
 */

const LOCAL_STORAGE_ADMIN_PW_KEY = "pnbp_admin_password_v1";
const LOCAL_STORAGE_ADMIN_SESSION_KEY = "pnbp_admin_is_logged_in_v1";
export const DEFAULT_ADMIN_PASSWORD = "admin123";

export function getAdminPassword(): string {
  try {
    const saved = localStorage.getItem(LOCAL_STORAGE_ADMIN_PW_KEY);
    if (saved && saved.trim().length > 0) {
      return saved.trim();
    }
  } catch (e) {
    console.warn("Failed to read admin password from localStorage:", e);
  }
  return DEFAULT_ADMIN_PASSWORD;
}

export function verifyAdminPassword(input: string): boolean {
  const current = getAdminPassword();
  return input.trim() === current;
}

export function isAdminLoggedIn(): boolean {
  try {
    return localStorage.getItem(LOCAL_STORAGE_ADMIN_SESSION_KEY) === "true";
  } catch {
    return false;
  }
}

export function setAdminLoggedIn(loggedIn: boolean): void {
  try {
    if (loggedIn) {
      localStorage.setItem(LOCAL_STORAGE_ADMIN_SESSION_KEY, "true");
    } else {
      localStorage.removeItem(LOCAL_STORAGE_ADMIN_SESSION_KEY);
    }
  } catch (e) {
    console.warn("Failed to update admin session in localStorage:", e);
  }
}

export async function updateAdminPassword(
  newPassword: string,
  spreadsheetId?: string,
  accessToken?: string | null
): Promise<{ success: boolean; message: string; syncedToSheets: boolean }> {
  const trimmed = newPassword.trim();
  if (!trimmed || trimmed.length < 4) {
    return {
      success: false,
      message: "Password baru minimal harus 4 karakter.",
      syncedToSheets: false,
    };
  }

  try {
    localStorage.setItem(LOCAL_STORAGE_ADMIN_PW_KEY, trimmed);
  } catch (e) {
    return {
      success: false,
      message: "Gagal menyimpan password ke penyimpanan lokal.",
      syncedToSheets: false,
    };
  }

  let syncedToSheets = false;

  if (spreadsheetId && spreadsheetId.includes("script.google.com/macros/s/")) {
    try {
      const res = await fetch(spreadsheetId, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "setPassword",
          password: trimmed,
        }),
      });
      if (res.ok) {
        syncedToSheets = true;
      }
    } catch (err) {
      console.warn("Syncing password to Google Apps Script failed:", err);
    }
  }

  if (accessToken && spreadsheetId && !spreadsheetId.includes("script.google.com")) {
    try {
      const range = encodeURIComponent("Config!A1:B2");
      const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${range}?valueInputOption=USER_ENTERED`;
      const res = await fetch(url, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          range: "Config!A1:B2",
          majorDimension: "ROWS",
          values: [
            ["KEY", "VALUE"],
            ["ADMIN_PASSWORD", trimmed],
          ],
        }),
      });
      if (res.ok) {
        syncedToSheets = true;
      }
    } catch (err) {
      console.warn("Syncing password to Google Sheets API failed:", err);
    }
  }

  return {
    success: true,
    message: syncedToSheets
      ? "Password admin berhasil diubah dan disinkronkan ke Google Sheets."
      : "Password admin berhasil diubah (tersimpan lokal).",
    syncedToSheets,
  };
}

export async function fetchPasswordFromSheets(
  spreadsheetId: string,
  accessToken?: string | null
): Promise<string | null> {
  if (spreadsheetId && spreadsheetId.includes("script.google.com/macros/s/")) {
    try {
      const separator = spreadsheetId.includes("?") ? "&" : "?";
      const res = await fetch(`${spreadsheetId}${separator}action=getPassword`);
      if (res.ok) {
        const data = await res.json();
        if (data && data.password) {
          localStorage.setItem(LOCAL_STORAGE_ADMIN_PW_KEY, data.password);
          return data.password;
        }
      }
    } catch (e) {
      console.warn("Could not fetch password from Apps Script:", e);
    }
  }

  if (accessToken && spreadsheetId && !spreadsheetId.includes("script.google.com")) {
    try {
      const range = encodeURIComponent("Config!A1:B5");
      const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${range}`;
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (res.ok) {
        const data = await res.json();
        const rows: any[][] = data.values || [];
        for (const row of rows) {
          if (row && String(row[0]).trim().toUpperCase() === "ADMIN_PASSWORD" && row[1]) {
            const pw = String(row[1]).trim();
            localStorage.setItem(LOCAL_STORAGE_ADMIN_PW_KEY, pw);
            return pw;
          }
        }
      }
    } catch (e) {
      // ignore
    }
  }

  return null;
}
