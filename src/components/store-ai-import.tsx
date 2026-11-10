import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Sparkles, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { extractStoresFromText } from "@/lib/store-ai.functions";
import { clusterStyle, type AiStore } from "@/lib/cluster-colors";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

export function StoreAiImport({ onDone }: { onDone: () => void }) {
  const qc = useQueryClient();
  const extract = useServerFn(extractStoresFromText);
  const [text, setText] = useState("");
  const [rows, setRows] = useState<AiStore[]>([]);
  const [busy, setBusy] = useState(false);

  async function separate() {
    setBusy(true);
    try {
      const { stores } = await extract({ data: { text } });
      if (!stores.length) toast.error("Nenhuma loja com ID e nome encontrada no texto.");
      setRows(stores);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Não foi possível separar o texto.");
    } finally {
      setBusy(false);
    }
  }

  async function save() {
    const valid = rows.filter((r) => r.store_code.trim() && r.name.trim());
    if (!valid.length) return;
    setBusy(true);
    try {
      const { data, error } = await supabase
        .from("stores")
        .upsert(
          valid.map((r) => ({
            store_code: r.store_code.trim(),
            name: r.name.trim(),
            full_address: r.full_address.trim(),
            cluster: r.cluster.trim() || null,
            active: true,
          })),
          { onConflict: "store_code" },
        )
        .select("id");
      if (error) throw error;
      await qc.invalidateQueries({ queryKey: ["operations"] });
      toast.success(`${data.length} lojas salvas`);
      setRows([]);
      setText("");
      onDone();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Não foi possível salvar as lojas.");
    } finally {
      setBusy(false);
    }
  }

  const set = (i: number, k: keyof AiStore, v: string) =>
    setRows((old) => old.map((r, j) => (j === i ? { ...r, [k]: v } : r)));

  if (!rows.length)
    return (
      <div className="grid gap-3">
        <p className="text-sm text-muted-foreground">
          Cole o texto com as lojas. A IA separa ID, nome, endereço e cluster para você revisar.
        </p>
        <Textarea
          aria-label="Texto com as lojas"
          rows={10}
          placeholder={"Cluster 4\n1023 - Loja Centro - Rua A, 100, Centro\n1045 - Loja Norte - Av. B, 55"}
          value={text}
          onChange={(e) => setText(e.target.value)}
        />
        <Button disabled={busy || !text.trim()} onClick={() => void separate()}>
          <Sparkles className={busy ? "animate-pulse" : ""} />
          {busy ? "Separando…" : "Separar com IA"}
        </Button>
      </div>
    );

  return (
    <div className="grid gap-3">
      <p className="text-sm text-muted-foreground">
        {rows.length} lojas encontradas. Revise antes de salvar; lojas com o mesmo ID serão atualizadas.
      </p>
      <div className="max-h-[50vh] overflow-auto rounded-md border">
        <table className="w-full text-xs">
          <thead className="sticky top-0 bg-muted text-left text-muted-foreground">
            <tr>
              <th className="p-2">Cluster</th>
              <th className="p-2">ID</th>
              <th className="p-2">Nome</th>
              <th className="p-2">Endereço</th>
              <th />
            </tr>
          </thead>
          <tbody className="divide-y">
            {rows.map((r, i) => (
              <tr key={i}>
                <td className="p-1">
                  <Input aria-label={`Cluster linha ${i + 1}`} className="h-8 w-16 border text-xs" style={clusterStyle(r.cluster)} value={r.cluster} onChange={(e) => set(i, "cluster", e.target.value)} />
                </td>
                <td className="p-1">
                  <Input aria-label={`ID linha ${i + 1}`} className="h-8 w-24 font-mono text-xs" value={r.store_code} onChange={(e) => set(i, "store_code", e.target.value)} />
                </td>
                <td className="p-1">
                  <Input aria-label={`Nome linha ${i + 1}`} className="h-8 min-w-32 text-xs" value={r.name} onChange={(e) => set(i, "name", e.target.value)} />
                </td>
                <td className="p-1">
                  <Input aria-label={`Endereço linha ${i + 1}`} className="h-8 min-w-48 text-xs" value={r.full_address} onChange={(e) => set(i, "full_address", e.target.value)} />
                </td>
                <td>
                  <Button variant="ghost" size="icon" title="Remover" onClick={() => setRows((o) => o.filter((_, j) => j !== i))}>
                    <Trash2 />
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="flex justify-end gap-2">
        <Button variant="outline" disabled={busy} onClick={() => setRows([])}>Voltar</Button>
        <Button disabled={busy} onClick={() => void save()}>{busy ? "Salvando…" : "Salvar lojas"}</Button>
      </div>
    </div>
  );
}
