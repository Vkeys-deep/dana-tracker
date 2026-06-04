import { useSheetData } from "@/hooks/useSheetData";
import { useApp } from "@/contexts/AppContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { RefreshCw, TrendingUp, TrendingDown, AlertCircle, Settings2 } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

function formatRupiah(val: number) {
  return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(val);
}

function formatPct(val: number) {
  return `${val > 0 ? "+" : ""}${val.toFixed(2)}%`;
}

export default function HarianTab() {
  const { appsScriptUrl } = useApp();
  const { data, loading, error, refetch } = useSheetData("harian");

  if (!appsScriptUrl) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4 p-6 text-center">
        <Settings2 className="w-12 h-12 text-muted-foreground" />
        <p className="text-muted-foreground text-sm leading-relaxed">
          URL Apps Script belum diatur.<br />Buka tab <strong>Settings</strong> untuk memasukkan URL terlebih dahulu.
        </p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="p-4 space-y-4">
        <Skeleton className="h-32 w-full rounded-xl" />
        <Skeleton className="h-48 w-full rounded-xl" />
        <Skeleton className="h-24 w-full rounded-xl" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4 p-6 text-center">
        <AlertCircle className="w-10 h-10 text-destructive" />
        <p className="text-destructive text-sm">{error}</p>
        <Button size="sm" variant="outline" onClick={refetch}>
          <RefreshCw className="w-4 h-4 mr-2" /> Coba Lagi
        </Button>
      </div>
    );
  }

  const rows = data?.rows || [];
  const headers = data?.headers || [];

  const chartData = rows.slice(-14).map((row) => ({
    tanggal: String(row[headers[0]] || "").slice(5),
    nav: Number(row[headers[1]] || 0),
  }));

  const latestRow = rows[rows.length - 1];
  const prevRow = rows[rows.length - 2];
  const latestNav = latestRow ? Number(latestRow[headers[1]] || 0) : 0;
  const prevNav = prevRow ? Number(prevRow[headers[1]] || 0) : 0;
  const navChange = latestNav - prevNav;
  const navChangePct = prevNav > 0 ? (navChange / prevNav) * 100 : 0;
  const isUp = navChange >= 0;

  return (
    <div className="p-4 space-y-4 pb-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold" data-testid="text-harian-title">Data Harian</h2>
        <Button size="icon" variant="ghost" onClick={refetch} data-testid="button-refresh-harian">
          <RefreshCw className="w-4 h-4" />
        </Button>
      </div>

      <Card data-testid="card-nav-latest">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm text-muted-foreground font-normal">NAV Terakhir</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-3xl font-bold tracking-tight">{formatRupiah(latestNav)}</p>
          <div className="flex items-center gap-2 mt-1">
            {isUp ? (
              <TrendingUp className="w-4 h-4 text-emerald-500" />
            ) : (
              <TrendingDown className="w-4 h-4 text-destructive" />
            )}
            <span className={`text-sm font-medium ${isUp ? "text-emerald-500" : "text-destructive"}`}>
              {formatRupiah(Math.abs(navChange))} ({formatPct(navChangePct)})
            </span>
            <Badge variant="secondary" className="text-xs">vs kemarin</Badge>
          </div>
        </CardContent>
      </Card>

      {chartData.length > 0 && (
        <Card data-testid="card-chart-nav">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Grafik NAV 14 Hari</CardTitle>
          </CardHeader>
          <CardContent className="p-0 pb-4">
            <ResponsiveContainer width="100%" height={180}>
              <AreaChart data={chartData} margin={{ top: 8, right: 16, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="navGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(168 84% 32%)" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="hsl(168 84% 32%)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                <XAxis dataKey="tanggal" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                <Tooltip formatter={(v: number) => formatRupiah(v)} />
                <Area type="monotone" dataKey="nav" stroke="hsl(168 84% 32%)" fill="url(#navGrad)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {rows.length > 0 && (
        <Card data-testid="card-table-harian">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Riwayat Terbaru</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-border">
                    {headers.slice(0, 4).map((h) => (
                      <th key={h} className="text-left p-3 text-muted-foreground font-medium">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rows.slice(-10).reverse().map((row, i) => (
                    <tr key={i} className="border-b border-border last:border-0 hover:bg-muted/40 transition-colors" data-testid={`row-harian-${i}`}>
                      {headers.slice(0, 4).map((h) => (
                        <td key={h} className="p-3">{String(row[h] || "-")}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
