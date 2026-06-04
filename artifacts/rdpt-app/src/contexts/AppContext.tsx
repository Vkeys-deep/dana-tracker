import { createContext, useContext, useState, useEffect, ReactNode } from "react";

interface AppContextType {
  appsScriptUrl: string;
  setAppsScriptUrl: (url: string) => void;
  isDark: boolean;
  toggleDark: () => void;
  kategoriList: string[];
}

const AppContext = createContext<AppContextType | null>(null);

const STORAGE_KEY_URL = "rdpt_apps_script_url";
const STORAGE_KEY_DARK = "rdpt_dark_mode";

const DEFAULT_KATEGORI = [
  "Reksa Dana Saham",
  "Reksa Dana Campuran",
  "Reksa Dana Pendapatan Tetap",
  "Reksa Dana Pasar Uang",
  "Reksa Dana Indeks",
  "Reksa Dana Syariah",
];

export function AppProvider({ children }: { children: ReactNode }) {
  const [appsScriptUrl, setAppsScriptUrlState] = useState(() => {
    return localStorage.getItem(STORAGE_KEY_URL) || "";
  });

  const [isDark, setIsDark] = useState(() => {
    const stored = localStorage.getItem(STORAGE_KEY_DARK);
    if (stored !== null) return stored === "true";
    return window.matchMedia("(prefers-color-scheme: dark)").matches;
  });

  const kategoriList = DEFAULT_KATEGORI;

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
    localStorage.setItem(STORAGE_KEY_DARK, String(isDark));
  }, [isDark]);

  const setAppsScriptUrl = (url: string) => {
    setAppsScriptUrlState(url);
    localStorage.setItem(STORAGE_KEY_URL, url);
  };

  const toggleDark = () => setIsDark((prev) => !prev);

  return (
    <AppContext.Provider value={{ appsScriptUrl, setAppsScriptUrl, isDark, toggleDark, kategoriList }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used inside AppProvider");
  return ctx;
}
