import { useState } from "react";
import { AppProvider } from "@/contexts/AppContext";
import HarianTab from "@/pages/HarianTab";
import BulananTab from "@/pages/BulananTab";
import PrediksiTab from "@/pages/PrediksiTab";
import TambahModalTab from "@/pages/TambahModalTab";
import SettingsTab from "@/pages/SettingsTab";
import {
  CalendarDays,
  BarChart2,
  TrendingUp,
  PlusCircle,
  Settings,
} from "lucide-react";

type Tab = "harian" | "bulanan" | "prediksi" | "tambah" | "settings";

const TABS: { id: Tab; label: string; icon: typeof CalendarDays }[] = [
  { id: "harian", label: "Harian", icon: CalendarDays },
  { id: "bulanan", label: "Bulanan", icon: BarChart2 },
  { id: "prediksi", label: "Prediksi", icon: TrendingUp },
  { id: "tambah", label: "Tambah", icon: PlusCircle },
  { id: "settings", label: "Settings", icon: Settings },
];

function AppContent() {
  const [activeTab, setActiveTab] = useState<Tab>("harian");

  return (
    <div className="flex flex-col h-screen max-h-screen overflow-hidden bg-background">
      <header className="safe-area-top bg-background border-b border-border px-4 py-3 shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center">
            <TrendingUp className="w-4 h-4 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-base font-bold leading-tight tracking-tight">RDPT Insight</h1>
            <p className="text-[10px] text-muted-foreground leading-tight">Tracker Reksa Dana Pribadi</p>
          </div>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto min-h-0">
        {activeTab === "harian" && <HarianTab />}
        {activeTab === "bulanan" && <BulananTab />}
        {activeTab === "prediksi" && <PrediksiTab />}
        {activeTab === "tambah" && <TambahModalTab />}
        {activeTab === "settings" && <SettingsTab />}
      </main>

      <nav
        className="safe-area-bottom border-t border-border bg-background shrink-0"
        data-testid="nav-bottom"
      >
        <div className="flex">
          {TABS.map(({ id, label, icon: Icon }) => {
            const isActive = activeTab === id;
            const isAddBtn = id === "tambah";
            return (
              <button
                key={id}
                onClick={() => setActiveTab(id)}
                data-testid={`nav-tab-${id}`}
                className={[
                  "flex-1 flex flex-col items-center justify-center gap-0.5 py-2 px-1 transition-colors relative",
                  isActive
                    ? "text-primary"
                    : "text-muted-foreground hover:text-foreground",
                ].join(" ")}
              >
                {isAddBtn ? (
                  <div
                    className={[
                      "w-10 h-10 rounded-full flex items-center justify-center transition-all",
                      isActive
                        ? "bg-primary text-primary-foreground shadow-md scale-110"
                        : "bg-primary/15 text-primary",
                    ].join(" ")}
                  >
                    <Icon className="w-5 h-5" />
                  </div>
                ) : (
                  <>
                    <Icon className="w-5 h-5" strokeWidth={isActive ? 2.5 : 1.75} />
                    {isActive && (
                      <span className="absolute top-1 w-1 h-1 rounded-full bg-primary" />
                    )}
                  </>
                )}
                {!isAddBtn && (
                  <span className="text-[9px] font-medium leading-tight">{label}</span>
                )}
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}
