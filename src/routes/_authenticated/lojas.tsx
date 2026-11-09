import { createFileRoute } from "@tanstack/react-router";
import { useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Pencil, Plus, Search, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { operationsQuery } from "@/lib/operations";
import { storeIdentityPayload } from "@/lib/registration-rules";
type StoreRow = {
  id: string;
  store_code: string;
  name: string;
};
const blank = { store_code: "", name: "" };
export const Route = createFileRoute("/_authenticated/lojas")({
  loader: ({ context }) => context.queryClient.ensureQueryData(operationsQuery),
  head: () => ({
    meta: [
      { title: "Cadastro de lojas | First Mile Control" },
      { name: "description", content: "Cadastro de lojas por ID e nome." },
      { property: "og:title", content: "Cadastro de lojas | First Mile Control" },
      { property: "og:description", content: "Cadastro de lojas por ID e nome." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Stores,
});
function Stores() {
  const qc = useQueryClient();
  const { data } = useSuspenseQuery(operationsQuery);
  const rows = data.stores.filter((row) => row.active);
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<string | null>(null);
  const [form, setForm] = useState(blank);
  const [busy, setBusy] = useState(false);
  async function load() {
    await qc.invalidateQueries({ queryKey: ["operations"] });
  }
  function edit(row: StoreRow) {
    setEditing(row.id);
    setForm({ store_code: row.store_code, name: row.name });
    setOpen(true);
  }
  async function save() {
    if (busy) return;
    setBusy(true);
    try {
      const payload = storeIdentityPayload(form);
      const result = editing
        ? await supabase.from("stores").update(payload).eq("id", editing).select("id").single()
        : await supabase.from("stores").insert(payload).select("id").single();
      if (result.error) {
        toast.error(
          result.error.code === "23505"
            ? "Já existe uma loja com este ID, inclusive entre as arquivadas."
            : "Não foi possível salvar a loja. Tente novamente.",
        );
        return;
      }
      toast.success("Loja salva");
      setOpen(false);
      setEditing(null);
      setForm(blank);
      await load();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Não foi possível salvar a loja.");
    } finally {
      setBusy(false);
    }
  }
  async function remove(id: string) {
    if (!confirm("Excluir esta loja? O histórico de planejamentos será preservado.")) return;
    const { error } = await supabase.from("stores").update({ active: false }).eq("id", id);
    if (error) toast.error(error.message);
    else {
      toast.success("Loja arquivada");
      await load();
    }
  }
  const filtered = rows.filter((r) =>
    `${r.store_code} ${r.name}`.toLowerCase().includes(search.toLowerCase()),
  );
  return (
    <>
      <PageHeader
        title="Cadastro de lojas"
        description=""
        actions={
          <Button
            onClick={() => {
              setEditing(null);
              setForm(blank);
              setOpen(true);
            }}
          >
            <Plus />
            Nova loja
          </Button>
        }
      />
      <div className="relative mb-4 max-w-md">
        <Search className="absolute left-3 top-2.5 size-4 text-muted-foreground" />
        <Input
          className="pl-9"
          placeholder="Buscar por ID ou nome"
          aria-label="Buscar lojas"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>
      <div className="overflow-x-auto rounded-md border bg-card">
        <table className="w-full text-sm">
          <thead className="bg-muted/60 text-left text-xs text-muted-foreground">
            <tr>
              <th className="p-3">ID</th>
              <th className="p-3">Loja</th>
              <th className="p-3 text-right">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {filtered.map((r) => (
              <tr key={r.id}>
                <td className="p-3 font-mono font-medium">{r.store_code}</td>
                <td className="p-3 font-medium">{r.name}</td>
                <td className="p-3">
                  <div className="flex justify-end gap-1">
                    <Button variant="ghost" size="icon" title="Editar" onClick={() => edit(r)}>
                      <Pencil />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      title="Arquivar"
                      onClick={() => remove(r.id)}
                    >
                      <Trash2 />
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
            {!filtered.length && (
              <tr>
                <td colSpan={3} className="p-12 text-center text-muted-foreground">
                  {rows.length
                    ? "Nenhuma loja encontrada para esta pesquisa."
                    : "Nenhuma loja cadastrada."}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <Dialog
        open={open}
        onOpenChange={(value) => {
          if (!busy) setOpen(value);
        }}
      >
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editing ? "Editar loja" : "Nova loja"}</DialogTitle>
          </DialogHeader>
          <form
            onSubmit={(event) => {
              event.preventDefault();
              void save();
            }}
          >
            <fieldset disabled={busy} className="grid gap-4">
              {(
                [
                  ["store_code", "ID da loja"],
                  ["name", "Nome"],
                ] as const
              ).map(([key, label]) => (
                <div key={key}>
                  <Label htmlFor={`store-${key}`}>{label}</Label>
                  <Input
                    id={`store-${key}`}
                    className="mt-1.5"
                    value={form[key]}
                    required={key === "store_code" || key === "name"}
                    onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                  />
                </div>
              ))}
            </fieldset>
            <DialogFooter className="mt-4">
              <Button
                type="button"
                disabled={busy}
                variant="outline"
                onClick={() => setOpen(false)}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={busy || !form.store_code.trim() || !form.name.trim()}>
                {busy ? "Salvando…" : "Salvar loja"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
