import { useState } from "react";
import { useApp } from "@/contexts/AppContext";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Link2, CheckCircle2, Moon, Sun, Trash2, Info, ExternalLink, AlertCircle
} from "lucide-react";

export default function SettingsTab() {
  const { appsScriptUrl, setAppsScriptUrl, isDark, toggleDark } = useApp();
  const [inputUrl, setInputUrl] = useState(appsScriptUrl);
  const [saved, setSaved] = useState(false);
  const [testStatus, setTestStatus] = useState<"idle" | "loading" | "ok" | "error">("idle");
  const [testMsg, setTestMsg] = useState("");

  function handleSave() {
    const trimmed = inputUrl.trim();
    setAppsScriptUrl(trimmed);
    setSaved(true);
    setTestStatus("idle");
    setTimeout(() => setSaved(false), 2500);
  }

  function handleClear() {
    setInputUrl("");
    setAppsScriptUrl("");
    setTestStatus("idle");
  }

  async function handleTest() {
    const url = inputUrl.trim();
    if (!url) {
      setTestStatus("error");
      setTestMsg("URL tidak boleh kosong.");
      return;
    }
    setTestStatus("loading");
    setTestMsg("");
    try {
      const res = await fetch(url, { method: "GET" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      if (json && (json.status || json.headers || json.rows)) {
        setTestStatus("ok");
        setTestMsg("Koneksi berhasil! Data berhasil dibaca dari Google Sheets.");
      } else {
        setTestStatus("ok");
        setTestMsg("URL merespons, tapi format data mungkin berbeda. Periksa struktur JSON.");
      }
    } catch (err: unknown) {
      setTestStatus("error");
      setTestMsg(err instanceof Error ? err.message : "Gagal terhubung. Cek kembali URL dan pastikan Apps Script sudah di-deploy.");
    }
  }

  return (
    <div className="p-4 space-y-4 pb-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold" data-testid="text-settings-title">Pengaturan</h2>
        <Badge variant={appsScriptUrl ? "default" : "secondary"} className="text-xs" data-testid="badge-url-status">
          {appsScriptUrl ? "Terhubung" : "Belum diatur"}
        </Badge>
      </div>

      <Card data-testid="card-url-config">
        <CardHeader className="pb-4">
          <CardTitle className="text-base flex items-center gap-2">
            <Link2 className="w-4 h-4 text-primary" />
            URL Google Apps Script
          </CardTitle>
          <CardDescription className="text-xs leading-relaxed">
            Tempel URL Web App dari Google Apps Script Anda di sini. URL akan disimpan di perangkat dan tidak dikirim ke server manapun.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-2">
            <Label htmlFor="apps-script-url" className="text-sm">Web App URL</Label>
            <Input
              id="apps-script-url"
              type="url"
              placeholder="https://script.google.com/macros/s/..."
              value={inputUrl}
              onChange={(e) => setInputUrl(e.target.value)}
              className="h-11 font-mono text-xs"
              data-testid="input-apps-script-url"
            />
          </div>

          {testStatus === "ok" && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30" data-testid="alert-test-ok">
              <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
              <p className="text-xs text-emerald-700 dark:text-emerald-400">{testMsg}</p>
            </div>
          )}

          {testStatus === "error" && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 border border-destructive/30" data-testid="alert-test-error">
              <AlertCircle className="w-4 h-4 text-destructive shrink-0" />
              <p className="text-xs text-destructive">{testMsg}</p>
            </div>
          )}

          {saved && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-primary/10 border border-primary/30 animate-in slide-in-from-top-1" data-testid="alert-saved">
              <CheckCircle2 className="w-4 h-4 text-primary shrink-0" />
              <p className="text-xs text-primary">URL berhasil disimpan!</p>
            </div>
          )}

          <div className="flex gap-2">
            <Button onClick={handleSave} className="flex-1 h-10" data-testid="button-save-url">
              Simpan URL
            </Button>
            <Button
              onClick={handleTest}
              variant="outline"
              className="flex-1 h-10"
              disabled={testStatus === "loading"}
              data-testid="button-test-url"
            >
              {testStatus === "loading" ? "Mengetes..." : "Tes Koneksi"}
            </Button>
          </div>

          {appsScriptUrl && (
            <Button
              onClick={handleClear}
              variant="ghost"
              size="sm"
              className="w-full text-destructive hover:text-destructive hover:bg-destructive/10 h-9"
              data-testid="button-clear-url"
            >
              <Trash2 className="w-3.5 h-3.5 mr-2" /> Hapus URL Tersimpan
            </Button>
          )}
        </CardContent>
      </Card>

      <Card data-testid="card-tampilan">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Tampilan</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {isDark ? <Moon className="w-4 h-4 text-primary" /> : <Sun className="w-4 h-4 text-amber-500" />}
              <div>
                <p className="text-sm font-medium">Mode Gelap</p>
                <p className="text-xs text-muted-foreground">Sesuaikan tampilan dengan preferensi Anda</p>
              </div>
            </div>
            <Switch checked={isDark} onCheckedChange={toggleDark} data-testid="switch-dark-mode" />
          </div>
        </CardContent>
      </Card>

      <Card className="bg-accent/20 border-accent" data-testid="card-panduan">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <Info className="w-4 h-4 text-primary" /> Panduan Penggunaan
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="text-xs text-muted-foreground space-y-2 leading-relaxed">
            <p><strong className="text-foreground">1.</strong> Buka Google Sheets Anda dan klik <strong className="text-foreground">Extensions &rarr; Apps Script</strong></p>
            <p><strong className="text-foreground">2.</strong> Tempel kode dari file <code className="bg-muted px-1 rounded">apps-script-api.gs</code></p>
            <p><strong className="text-foreground">3.</strong> Deploy sebagai <strong className="text-foreground">Web App</strong> dengan akses <em>Anyone</em></p>
            <p><strong className="text-foreground">4.</strong> Salin URL Web App dan tempel di kolom URL di atas</p>
            <p><strong className="text-foreground">5.</strong> Klik <strong className="text-foreground">Tes Koneksi</strong> untuk memverifikasi</p>
          </div>
        </CardContent>
      </Card>

      <Card data-testid="card-about">
        <CardContent className="pt-4 pb-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold">RDPT Insight</p>
              <p className="text-xs text-muted-foreground">v1.0.0 — Tracker Reksa Dana Pribadi</p>
            </div>
            <ExternalLink className="w-4 h-4 text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
