import { createFileRoute } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
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
import { Textarea } from "@/components/ui/textarea";
type StoreRow = {
  id: string;
  store_code: string;
  name: string;
  full_address: string;
  street: string;
  street_number: string;
  complement: string;
  region: string;
  city: string;
  location_reference: string;
  fixed_notes: string;
};
const blank = {
  store_code: "",
  name: "",
  full_address: "",
  street: "",
  street_number: "",
  complement: "",
  region: "",
  city: "",
  location_reference: "",
  fixed_notes: "",
};
export const Route = createFileRoute("/_authenticated/lojas")({
  head: () => ({
    meta: [
      { title: "Cadastro de lojas | First Mile Control" },
      { name: "description", content: "Cadastro permanente de lojas e endereços." },
      { property: "og:title", content: "Cadastro de lojas | First Mile Control" },
      { property: "og:description", content: "Cadastro permanente de lojas e endereços." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Stores,
});
function Stores() {
  const qc = useQueryClient();
  const [rows, setRows] = useState<StoreRow[]>([]);
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<string | null>(null);
  const [form, setForm] = useState(blank);
  async function load() {
    const { data } = await supabase
      .from("stores")
      .select(
        "id,store_code,name,full_address,street,street_number,complement,region,city,location_reference,fixed_notes",
      )
      .eq("active", true)
      .order("name");
    setRows(data ?? []);
    await qc.invalidateQueries({ queryKey: ["operations"] });
  }
  useEffect(() => {
    void load();
  }, []);
  function edit(row: StoreRow) {
    setEditing(row.id);
    setForm({ ...row });
    setOpen(true);
  }
  async function save() {
    const payload = {
      ...form,
      full_address:
        form.full_address ||
        [form.street, form.street_number, form.complement, form.region, form.city]
          .filter(Boolean)
          .join(", "),
    };
    const result = editing
      ? await supabase.from("stores").update(payload).eq("id", editing)
      : await supabase.from("stores").insert(payload);
    if (result.error) {
      toast.error(
        result.error.code === "23505" ? "Já existe uma loja com este ID." : result.error.message,
      );
      return;
    }
    toast.success("Loja salva");
    setOpen(false);
    setEditing(null);
    setForm(blank);
    await load();
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
    `${r.store_code} ${r.name} ${r.full_address}`.toLowerCase().includes(search.toLowerCase()),
  );
  return (
    <>
      <PageHeader
        title="Cadastro de lojas"
        description="Base permanente usada para preencher novos planejamentos."
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
          placeholder="Buscar por ID, nome ou endereço"
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
              <th className="p-3">Endereço</th>
              <th className="p-3">Região</th>
              <th className="p-3 text-right">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {filtered.map((r) => (
              <tr key={r.id}>
                <td className="p-3 font-mono font-medium">{r.store_code}</td>
                <td className="p-3 font-medium">{r.name}</td>
                <td className="max-w-md p-3 text-muted-foreground">
                  {r.full_address || "Endereço incompleto"}
                </td>
                <td className="p-3">{r.region || "—"}</td>
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
                <td colSpan={5} className="p-12 text-center text-muted-foreground">
                  Nenhuma loja cadastrada. Adicione uma loja ou importe uma planilha.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editing ? "Editar loja" : "Nova loja"}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 sm:grid-cols-2">
            {(
              [
                ["store_code", "ID da loja"],
                ["name", "Nome"],
                ["street", "Rua"],
                ["street_number", "Número"],
                ["complement", "Complemento"],
                ["region", "Bairro ou região"],
                ["city", "Cidade"],
                ["location_reference", "Referência"],
              ] as const
            ).map(([key, label]) => (
              <div key={key}>
                <Label htmlFor={`store-${key}`}>{label}</Label>
                <Input
                  id={`store-${key}`}
                  className="mt-1.5"
                  value={form[key]}
                  onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                />
              </div>
            ))}
            <div className="sm:col-span-2">
              <Label htmlFor="store-address">Endereço completo</Label>
              <Input
                id="store-address"
                className="mt-1.5"
                value={form.full_address}
                onChange={(e) => setForm({ ...form, full_address: e.target.value })}
              />
            </div>
            <div className="sm:col-span-2">
              <Label htmlFor="store-notes">Observações fixas</Label>
              <Textarea
                id="store-notes"
                className="mt-1.5"
                value={form.fixed_notes}
                onChange={(e) => setForm({ ...form, fixed_notes: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={save} disabled={!form.store_code || !form.name}>
              Salvar loja
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
