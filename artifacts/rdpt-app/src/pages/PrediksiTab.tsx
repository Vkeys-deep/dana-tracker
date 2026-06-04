import { useSheetData } from "@/hooks/useSheetData";
import { useApp } from "@/contexts/AppContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { RefreshCw, AlertCircle, Settings2, LineChart as LineChartIcon, Info } from "lucide-react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine
} from "recharts";

function formatRupiah(val: number) {
  return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(val);
}

export default function PrediksiTab() {
  const { appsScriptUrl } = useApp();
  const { data, loading, error, refetch } = useSheetData("prediksi");

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
        <Skeleton className="h-28 w-full rounded-xl" />
        <Skeleton className="h-52 w-full rounded-xl" />
        <Skeleton className="h-28 w-full rounded-xl" />
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

  const chartData = rows.map((row) => ({
    periode: String(row[headers[0]] || ""),
    aktual: row[headers[1]] !== undefined && row[headers[1]] !== "" ? Number(row[headers[1]]) : null,
    prediksi: row[headers[2]] !== undefined && row[headers[2]] !== "" ? Number(row[headers[2]]) : null,
  }));

  const todayIdx = chartData.findIndex((d) => d.aktual !== null && (d.prediksi === null || d.prediksi === 0));
  const splitPeriode = todayIdx > 0 ? chartData[todayIdx - 1].periode : "";

  const latestPrediksi = chartData.filter((d) => d.prediksi !== null && d.prediksi !== 0).slice(-1)[0];
  const latestAktual = chartData.filter((d) => d.aktual !== null).slice(-1)[0];

  const roi =
    latestPrediksi && latestAktual && latestAktual.aktual
      ? (((latestPrediksi.prediksi! - latestAktual.aktual) / latestAktual.aktual) * 100).toFixed(2)
      : null;

  return (
    <div className="p-4 space-y-4 pb-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold" data-testid="text-prediksi-title">Prediksi NAV</h2>
        <Button size="icon" variant="ghost" onClick={refetch} data-testid="button-refresh-prediksi">
          <RefreshCw className="w-4 h-4" />
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Card data-testid="card-aktual-terkini">
          <CardHeader className="pb-1 pt-3 px-3">
            <CardTitle className="text-xs text-muted-foreground font-normal">NAV Aktual</CardTitle>
          </CardHeader>
          <CardContent className="px-3 pb-3">
            <p className="text-base font-bold">{latestAktual?.aktual ? formatRupiah(latestAktual.aktual) : "-"}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{latestAktual?.periode || "-"}</p>
          </CardContent>
        </Card>
        <Card data-testid="card-prediksi-target">
          <CardHeader className="pb-1 pt-3 px-3">
            <CardTitle className="text-xs text-muted-foreground font-normal">Target Prediksi</CardTitle>
          </CardHeader>
          <CardContent className="px-3 pb-3">
            <p className="text-base font-bold text-primary">{latestPrediksi?.prediksi ? formatRupiah(latestPrediksi.prediksi) : "-"}</p>
            {roi && (
              <Badge variant="secondary" className="text-xs mt-0.5">
                {Number(roi) > 0 ? "+" : ""}{roi}% estimasi
              </Badge>
            )}
          </CardContent>
        </Card>
      </div>

      {chartData.length > 0 && (
        <Card data-testid="card-chart-prediksi">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <LineChartIcon className="w-4 h-4" /> Aktual vs Prediksi
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0 pb-4">
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={chartData} margin={{ top: 8, right: 16, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                <XAxis dataKey="periode" tick={{ fontSize: 9 }} />
                <YAxis tick={{ fontSize: 9 }} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                <Tooltip formatter={(v: number) => v ? formatRupiah(v) : "-"} />
                {splitPeriode && (
                  <ReferenceLine x={splitPeriode} stroke="hsl(215 15% 52%)" strokeDasharray="4 4" label={{ value: "Hari ini", fontSize: 9 }} />
                )}
                <Line type="monotone" dataKey="aktual" stroke="hsl(168 84% 32%)" strokeWidth={2} dot={false} name="Aktual" connectNulls />
                <Line type="monotone" dataKey="prediksi" stroke="hsl(38 92% 50%)" strokeWidth={2} strokeDasharray="5 5" dot={false} name="Prediksi" connectNulls />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      <Card className="bg-accent/30 border-accent" data-testid="card-prediksi-info">
        <CardContent className="flex gap-3 pt-4 pb-4">
          <Info className="w-4 h-4 text-primary shrink-0 mt-0.5" />
          <p className="text-xs text-muted-foreground leading-relaxed">
            Data prediksi bersumber dari formula di Google Sheets Anda. Hasil prediksi bukan merupakan rekomendasi investasi.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
