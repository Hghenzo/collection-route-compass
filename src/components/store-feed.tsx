import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { FileUp, RefreshCw, Sheet } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { fetchSheetRows } from "@/lib/google-sheets.functions";
import { storesFromSheet, storeIdentityPayload } from "@/lib/registration-rules";
import { readSheet } from "@/lib/spreadsheets";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const KEY = "fmc-store-sheet-url";

export function StoreFeed() {
  const qc = useQueryClient();
  const readGoogle = useServerFn(fetchSheetRows);
  const [url, setUrl] = useState("");
  const [busy, setBusy] = useState(false);
  const [last, setLast] = useState<string | null>(null);
  useEffect(() => setUrl(localStorage.getItem(KEY) ?? ""), []);

  async function save(raw: Record<string, string>[]) {
    const { stores, skipped, missingColumns } = storesFromSheet(raw);
    if (missingColumns) throw new Error("A planilha precisa das colunas ID e Nome (ou Loja).");
    if (!stores.length) throw new Error("Nenhuma loja válida encontrada.");
    const { error, data } = await supabase
      .from("stores")
      .upsert(stores.map((s) => ({ ...storeIdentityPayload(s), active: true })), { onConflict: "store_code" })
      .select("id");
    if (error) throw error;
    await qc.invalidateQueries({ queryKey: ["operations"] });
    const msg = `${data.length} lojas adicionadas ou atualizadas${skipped ? ` · ${skipped} linhas ignoradas` : ""}`;
    setLast(`${msg} às ${new Date().toLocaleTimeString("pt-BR", { hour12: false })}`);
    toast.success(msg);
  }

  async function run(task: () => Promise<Record<string, string>[]>) {
    if (busy) return;
    setBusy(true);
    try {
      await save(await task());
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Não foi possível importar as lojas.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="mb-5 rounded-md border bg-card p-4">
      <h2 className="mb-1 font-semibold">Importar lojas</h2>
      <p className="mb-3 text-sm text-muted-foreground">
        ID e Nome. Lojas com o mesmo ID têm o nome atualizado; os demais dados são preservados.
      </p>
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex min-w-72 flex-1 items-center gap-2">
          <Sheet className="size-4 shrink-0 text-muted-foreground" />
          <Input
            aria-label="Link do Google Sheets"
            placeholder="Cole o link da planilha do Google Sheets"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
          />
        </div>
        <Button
          disabled={busy || !url.trim()}
          onClick={() => {
            localStorage.setItem(KEY, url.trim());
            void run(() => readGoogle({ data: { url: url.trim() } }));
          }}
        >
          <RefreshCw className={busy ? "animate-spin" : ""} />
          Sincronizar agora
        </Button>
        <Button variant="outline" disabled={busy} asChild>
          <label className="cursor-pointer">
            <FileUp />
            Enviar arquivo
            <input
              type="file"
              accept=".csv,.xlsx"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                e.target.value = "";
                if (f) void run(() => readSheet(f));
              }}
            />
          </label>
        </Button>
      </div>
      {last && <p className="mt-2 text-xs text-muted-foreground">Última atualização: {last}</p>}
    </section>
  );
}
