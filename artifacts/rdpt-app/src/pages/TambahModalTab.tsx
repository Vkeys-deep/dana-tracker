import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useApp } from "@/contexts/AppContext";
import { submitTambahModal } from "@/hooks/useSheetData";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Settings2, CheckCircle2, Loader2, PlusCircle, AlertCircle } from "lucide-react";

const schema = z.object({
  tanggal: z.string().min(1, "Tanggal wajib diisi"),
  kategori: z.string().min(1, "Pilih kategori reksa dana"),
  nominal: z.string().min(1, "Nominal wajib diisi").refine(
    (v) => !isNaN(Number(v.replace(/\./g, "").replace(",", "."))) && Number(v.replace(/\./g, "").replace(",", ".")) > 0,
    "Nominal harus lebih dari 0"
  ),
  tipe: z.string().min(1, "Pilih tipe transaksi"),
});

type FormValues = z.infer<typeof schema>;

function formatRupiahInput(raw: string): string {
  const digits = raw.replace(/\D/g, "");
  return digits.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}

const TIPE_OPTIONS = ["Tambah Modal", "Penarikan", "Reinvestasi Dividen"];

export default function TambahModalTab() {
  const { appsScriptUrl, kategoriList } = useApp();
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [statusMsg, setStatusMsg] = useState("");

  const today = new Date().toISOString().slice(0, 10);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      tanggal: today,
      kategori: "",
      nominal: "",
      tipe: "Tambah Modal",
    },
  });

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

  async function onSubmit(values: FormValues) {
    setStatus("loading");
    setStatusMsg("");
    try {
      const nominalNum = Number(values.nominal.replace(/\./g, ""));
      const result = await submitTambahModal(appsScriptUrl, {
        tanggal: values.tanggal,
        kategori: values.kategori,
        nominal: nominalNum,
        tipe: values.tipe,
      });
      if (result.success) {
        setStatus("success");
        setStatusMsg(result.message || "Data berhasil disimpan ke Google Sheets!");
        form.reset({ tanggal: today, kategori: "", nominal: "", tipe: "Tambah Modal" });
      } else {
        setStatus("error");
        setStatusMsg(result.message || "Gagal menyimpan data.");
      }
    } catch (err: unknown) {
      setStatus("error");
      setStatusMsg(err instanceof Error ? err.message : "Terjadi kesalahan saat mengirim data.");
    }
  }

  return (
    <div className="p-4 space-y-4 pb-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold" data-testid="text-tambah-modal-title">Tambah Modal</h2>
        <Badge variant="secondary" className="text-xs">Reksa Dana</Badge>
      </div>

      {status === "success" && (
        <div className="flex items-center gap-3 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 animate-in slide-in-from-top-2" data-testid="alert-success">
          <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
          <p className="text-sm text-emerald-700 dark:text-emerald-400">{statusMsg}</p>
        </div>
      )}

      {status === "error" && (
        <div className="flex items-center gap-3 p-4 rounded-xl bg-destructive/10 border border-destructive/30 animate-in slide-in-from-top-2" data-testid="alert-error">
          <AlertCircle className="w-5 h-5 text-destructive shrink-0" />
          <p className="text-sm text-destructive">{statusMsg}</p>
        </div>
      )}

      <Card data-testid="card-tambah-modal-form">
        <CardHeader className="pb-4">
          <CardTitle className="text-base flex items-center gap-2">
            <PlusCircle className="w-4 h-4 text-primary" />
            Form Input Transaksi
          </CardTitle>
          <CardDescription className="text-xs">
            Data akan langsung tersimpan ke Google Sheets Anda
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
              <FormField
                control={form.control}
                name="tanggal"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm">Tanggal</FormLabel>
                    <FormControl>
                      <Input
                        type="date"
                        {...field}
                        className="h-11"
                        data-testid="input-tanggal"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="kategori"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm">Kategori Reksa Dana</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger className="h-11" data-testid="select-kategori">
                          <SelectValue placeholder="Pilih jenis reksa dana..." />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {kategoriList.map((k) => (
                          <SelectItem key={k} value={k} data-testid={`option-kategori-${k}`}>
                            {k}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="nominal"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm">Nominal (Rp)</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">Rp</span>
                        <Input
                          {...field}
                          type="text"
                          inputMode="numeric"
                          placeholder="0"
                          className="pl-10 h-11 text-right font-medium text-base"
                          data-testid="input-nominal"
                          onChange={(e) => {
                            const formatted = formatRupiahInput(e.target.value);
                            field.onChange(formatted);
                          }}
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="tipe"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm">Tipe Transaksi</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger className="h-11" data-testid="select-tipe">
                          <SelectValue placeholder="Pilih tipe..." />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {TIPE_OPTIONS.map((t) => (
                          <SelectItem key={t} value={t} data-testid={`option-tipe-${t}`}>
                            {t}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button
                type="submit"
                className="w-full h-12 text-base font-semibold"
                disabled={status === "loading"}
                data-testid="button-submit-tambah-modal"
              >
                {status === "loading" ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Menyimpan...
                  </>
                ) : (
                  <>
                    <PlusCircle className="w-4 h-4 mr-2" />
                    Simpan ke Google Sheets
                  </>
                )}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
