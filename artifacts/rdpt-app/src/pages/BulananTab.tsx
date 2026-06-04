import { useSheetData } from "@/hooks/useSheetData";
import { useApp } from "@/contexts/AppContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { RefreshCw, AlertCircle, Settings2, BarChart3 } from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from "recharts";

function formatRupiah(val: number) {
  return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(val);
}

export default function BulananTab() {
  const { appsScriptUrl } = useApp();
  const { data, loading, error, refetch } = useSheetData("bulanan");

  if (!appsScriptUrl) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4 p-6 text-center">
        <Settings2 className="w-12 h-12 text-muted-foreground" />
        <p className="text-muted-foreground text-sm leading-relaxed">
          URL Apps Script belum diatur.<br />Buka tab <strong>Settings</strong> untuk memasukkan URL.
        </p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="p-4 space-y-4">
        <Skeleton className="h-32 w-full rounded-xl" />
        <Skeleton className="h-56 w-full rounded-xl" />
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

  const numericHeaders = headers.filter((h) => {
    const val = rows[0]?.[h];
    return val !== undefined && !isNaN(Number(val));
  });

  const chartData = rows.slice(-12).map((row) => {
    const entry: Record<string, string | number> = { bulan: String(row[headers[0]] || "").slice(0, 7) };
    numericHeaders.slice(0, 3).forEach((h) => {
      entry[h] = Number(row[h] || 0);
    });
    return entry;
  });

  const totalKeseluruhan = numericHeaders.reduce((acc, h) => {
    return acc + rows.reduce((s, r) => s + Number(r[h] || 0), 0);
  }, 0);

  const COLORS = ["hsl(168 84% 32%)", "hsl(199 89% 48%)", "hsl(262 83% 58%)", "hsl(38 92% 50%)"];

  return (
    <div className="p-4 space-y-4 pb-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold" data-testid="text-bulanan-title">Data Bulanan</h2>
        <Button size="icon" variant="ghost" onClick={refetch} data-testid="button-refresh-bulanan">
          <RefreshCw className="w-4 h-4" />
        </Button>
      </div>

      <Card data-testid="card-total-keseluruhan">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm text-muted-foreground font-normal">Total Akumulasi</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-3xl font-bold tracking-tight">{formatRupiah(totalKeseluruhan)}</p>
          <p className="text-xs text-muted-foreground mt-1">{rows.length} bulan tercatat</p>
        </CardContent>
      </Card>

      {chartData.length > 0 && numericHeaders.length > 0 && (
        <Card data-testid="card-chart-bulanan">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <BarChart3 className="w-4 h-4" /> Performa Bulanan
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0 pb-4">
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={chartData} margin={{ top: 8, right: 16, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                <XAxis dataKey="bulan" tick={{ fontSize: 9 }} />
                <YAxis tick={{ fontSize: 9 }} tickFormatter={(v) => `${(v / 1e6).toFixed(1)}M`} />
                <Tooltip formatter={(v: number) => formatRupiah(v)} />
                <Legend iconSize={8} wrapperStyle={{ fontSize: 10 }} />
                {numericHeaders.slice(0, 3).map((h, i) => (
                  <Bar key={h} dataKey={h} fill={COLORS[i % COLORS.length]} radius={[3, 3, 0, 0]} />
                ))}
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {rows.length > 0 && (
        <Card data-testid="card-table-bulanan">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Rekap Bulanan</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-border">
                    {headers.slice(0, 5).map((h) => (
                      <th key={h} className="text-left p-3 text-muted-foreground font-medium whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rows.slice(-12).reverse().map((row, i) => (
                    <tr key={i} className="border-b border-border last:border-0 hover:bg-muted/40 transition-colors" data-testid={`row-bulanan-${i}`}>
                      {headers.slice(0, 5).map((h) => (
                        <td key={h} className="p-3 whitespace-nowrap">{String(row[h] || "-")}</td>
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
