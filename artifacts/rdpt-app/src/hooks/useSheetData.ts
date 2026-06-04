import { useState, useEffect, useCallback } from "react";
import { useApp } from "@/contexts/AppContext";

export interface SheetRow {
  [key: string]: string | number;
}

export interface SheetData {
  headers: string[];
  rows: SheetRow[];
}

export function useSheetData(sheetParam?: string) {
  const { appsScriptUrl } = useApp();
  const [data, setData] = useState<SheetData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (!appsScriptUrl) {
      setError("URL Apps Script belum diatur. Buka Settings untuk mengaturnya.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const url = sheetParam
        ? `${appsScriptUrl}?sheet=${encodeURIComponent(sheetParam)}`
        : appsScriptUrl;

      const res = await fetch(url, { method: "GET" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();

      if (json.status === "error") {
        throw new Error(json.message || "Gagal mengambil data");
      }

      setData(json);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Terjadi kesalahan";
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [appsScriptUrl, sheetParam]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, loading, error, refetch: fetchData };
}

export async function submitTambahModal(
  appsScriptUrl: string,
  payload: {
    tanggal: string;
    kategori: string;
    nominal: number;
    tipe: string;
  }
): Promise<{ success: boolean; message: string }> {
  if (!appsScriptUrl) {
    return { success: false, message: "URL Apps Script belum diatur." };
  }

  const res = await fetch(appsScriptUrl, {
    method: "POST",
    headers: { "Content-Type": "text/plain" },
    body: JSON.stringify(payload),
  });

  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const json = await res.json();
  return json;
}
