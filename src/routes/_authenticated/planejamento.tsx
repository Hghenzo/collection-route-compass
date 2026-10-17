import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { CheckCheck, Copy, Download, Plus, Search, Trash2, Undo2 } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { duplicateReason } from "@/lib/planning-rules";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { planningExportRows, sheetDownload } from "@/lib/spreadsheets";
import type { Tables } from "@/integrations/supabase/types";
import { getOrCreatePlanning, priorities, shifts, statuses, today } from "@/lib/first-mile";
type Store = { id: string; store_code: string; name: string; full_address: string; region: string };
type RouteRow = { id: string; code: string };
type PlanRow = Tables<"planning_stores">;
export const Route = createFileRoute("/_authenticated/planejamento")({
  head: () => ({
    meta: [
      { title: "Planejamento de rotas | First Mile Control" },
      { name: "description", content: "Tabela operacional de lojas, volumes e rotas." },
      { property: "og:title", content: "Planejamento de rotas | First Mile Control" },
      { property: "og:description", content: "Tabela operacional de lojas, volumes e rotas." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Planning,
});
function Planning() {
  const queryClient = useQueryClient();
  const [date, setDate] = useState(today());
  const [shift, setShift] = useState<"manha" | "tarde" | "noite">("manha");
  const [rows, setRows] = useState<PlanRow[]>([]);
  const [routes, setRoutes] = useState<RouteRow[]>([]);
  const [stores, setStores] = useState<Store[]>([]);
  const [search, setSearch] = useState("");
  const [adding, setAdding] = useState(false);
  const [selected, setSelected] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [undo, setUndo] = useState<{ id: string; patch: Partial<PlanRow> } | null>(null);
  const [planningId, setPlanningId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState("");
  const [routeFilter, setRouteFilter] = useState("");
  const [regionFilter, setRegionFilter] = useState("");
  const [volumeFilter, setVolumeFilter] = useState("");
  const [supportFilter, setSupportFilter] = useState("");
  const [extraFilter, setExtraFilter] = useState("");
  const [sort, setSort] = useState<{ key: keyof PlanRow; ascending: boolean }>({
    key: "created_at",
    ascending: true,
  });
  async function load() {
    const p = await supabase
      .from("plannings")
      .select("id")
      .eq("collection_date", date)
      .eq("shift", shift)
      .maybeSingle();
    if (!p.data) {
      setPlanningId(null);
      setRows([]);
      setRoutes([]);
      return;
    }
    setPlanningId(p.data.id);
    const [a, b] = await Promise.all([
      supabase.from("planning_stores").select("*").eq("planning_id", p.data.id).order("created_at"),
      supabase.from("routes").select("id,code").eq("planning_id", p.data.id).eq("archived", false),
    ]);
    setRows((a.data ?? []) as PlanRow[]);
    setRoutes(b.data ?? []);
    setSelected([]);
    await queryClient.invalidateQueries({ queryKey: ["operations"] });
  }
  useEffect(() => {
    void load();
  }, [date, shift]);
  async function openAdd() {
    const { data } = await supabase
      .from("stores")
      .select("id,store_code,name,full_address,region")
      .eq("active", true)
      .order("name");
    setStores(data ?? []);
    setAdding(true);
  }
  async function add(store: Store) {
    try {
      const planning_id = await getOrCreatePlanning(date, shift);
      const { error } = await supabase.from("planning_stores").insert({
        planning_id,
        store_id: store.id,
        store_code_snapshot: store.store_code,
        store_name_snapshot: store.name,
        full_address_snapshot: store.full_address,
        region_snapshot: store.region,
      });
      if (error) throw error;
      setAdding(false);
      await load();
      toast.success("Loja adicionada");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Não foi possível adicionar");
    }
  }
  async function patch(row: PlanRow, next: Partial<PlanRow>) {
    setUndo({
      id: row.id,
      patch: Object.fromEntries(Object.keys(next).map((k) => [k, row[k as keyof PlanRow]])),
    });
    setRows((old) => old.map((x) => (x.id === row.id ? { ...x, ...next } : x)));
    setSaving(true);
    const { error } = await supabase.from("planning_stores").update(next).eq("id", row.id);
    setSaving(false);
    if (error) {
      toast.error(error.message);
      await load();
    } else {
      await load();
      toast.success("Alterações salvas", { duration: 1200 });
    }
  }
  async function remove(id: string) {
    if (!confirm("Excluir esta loja do planejamento?")) return;
    const { error } = await supabase.from("planning_stores").delete().eq("id", id);
    if (error) toast.error(error.message);
    else await load();
  }
  async function duplicate(row: PlanRow) {
    const reason = duplicateReason(
      window.prompt("Informe a justificativa operacional para repetir esta loja:"),
    );
    if (!reason) return;
    const planning_id = await getOrCreatePlanning(date, shift);
    const { id, ...copy } = row;
    const { error } = await supabase
      .from("planning_stores")
      .insert({ ...copy, planning_id, duplicate_justification: reason });
    if (error) toast.error(error.message);
    else await load();
  }
  async function confirmPlanning() {
    if (
      !planningId ||
      !rows.length ||
      !window.confirm("Confirmar este planejamento e as rotas atribuídas?")
    )
      return;
    setSaving(true);
    const { error } = await supabase.rpc("confirm_planning", { _id: planningId });
    setSaving(false);
    if (error) toast.error(error.message);
    else {
      await load();
      toast.success("Planejamento confirmado");
    }
  }
  async function bulk(field: "route_id" | "priority" | "status", value: string) {
    if (!selected.length) return;
    const next: Partial<PlanRow> = {};
    if (field === "route_id") next.route_id = value || null;
    else if (field === "priority") {
      const priority = priorities.find(([key]) => key === value)?.[0];
      if (!priority) return;
      next.priority = priority;
    } else {
      const status = statuses.find(([key]) => key === value)?.[0];
      if (!status) return;
      next.status = status;
    }
    setSaving(true);
    const { error } = await supabase.from("planning_stores").update(next).in("id", selected);
    setSaving(false);
    if (error) toast.error(error.message);
    else {
      toast.success(`${selected.length} lojas atualizadas`);
      setSelected([]);
      await load();
    }
  }
  const filtered = useMemo(
    () =>
      rows
        .filter(
          (r) =>
            `${r.store_code_snapshot} ${r.store_name_snapshot} ${r.full_address_snapshot} ${routes.find((x) => x.id === r.route_id)?.code ?? ""}`
              .toLowerCase()
              .includes(search.toLowerCase()) &&
            (!statusFilter || r.status === statusFilter) &&
            (!routeFilter || (routeFilter === "none" ? !r.route_id : r.route_id === routeFilter)) &&
            (!regionFilter || r.region_snapshot === regionFilter) &&
            (!volumeFilter || r.volume_class === volumeFilter) &&
            (!supportFilter || r.needs_support === (supportFilter === "yes")) &&
            (!extraFilter || r.needs_extra_route === (extraFilter === "yes")),
        )
        .sort((a, b) => {
          const left = a[sort.key];
          const right = b[sort.key];
          const result =
            typeof left === "number" && typeof right === "number"
              ? left - right
              : String(left ?? "").localeCompare(String(right ?? ""), "pt-BR", { numeric: true });
          return sort.ascending ? result : -result;
        }),
    [
      rows,
      routes,
      search,
      statusFilter,
      routeFilter,
      regionFilter,
      volumeFilter,
      supportFilter,
      extraFilter,
      sort,
    ],
  );
  const selectClass = "h-8 min-w-28 rounded border bg-background px-2 text-xs";
  return (
    <>
      <PageHeader
        title="Planejamento de rotas"
        description="Edição rápida por loja com salvamento automático."
        actions={
          <>
            <span className="self-center text-xs text-muted-foreground">
              {saving ? "Salvando…" : "Tudo salvo"}
            </span>
            <Button
              variant="outline"
              size="icon"
              title="Desfazer"
              disabled={!undo}
              onClick={() => {
                if (undo) {
                  const row = rows.find((r) => r.id === undo.id);
                  if (row) void patch(row, undo.patch);
                  setUndo(null);
                }
              }}
            >
              <Undo2 />
            </Button>
            <Button
              variant="outline"
              onClick={() =>
                sheetDownload(
                  `planejamento-${date}`,
                  planningExportRows(filtered, { collection_date: date, shift }, routes),
                  "csv",
                )
              }
            >
              <Download />
              Exportar CSV
            </Button>
            <Button
              variant="outline"
              onClick={() =>
                sheetDownload(
                  `planejamento-${date}`,
                  planningExportRows(filtered, { collection_date: date, shift }, routes),
                )
              }
            >
              <Download />
              Exportar Excel
            </Button>
            <Button onClick={openAdd}>
              <Plus />
              Adicionar loja
            </Button>
            <Button
              variant="secondary"
              disabled={saving || !rows.length}
              onClick={() => void confirmPlanning()}
            >
              <CheckCheck />
              Confirmar planejamento
            </Button>
          </>
        }
      />
      <div className="mb-3 grid gap-2 md:grid-cols-[150px_140px_1fr]">
        <Input
          aria-label="Data do planejamento"
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
        />
        <select
          aria-label="Turno do planejamento"
          className="h-9 rounded-md border bg-background px-3 text-sm"
          value={shift}
          onChange={(e) => setShift(e.target.value as typeof shift)}
        >
          {shifts.map((s) => (
            <option value={s.value} key={s.value}>
              {s.label}
            </option>
          ))}
        </select>
        <div className="relative">
          <Search className="absolute left-3 top-2.5 size-4 text-muted-foreground" />
          <Input
            className="pl-9"
            placeholder="Nome, ID, endereço ou rota"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>
      <div className="mb-4 flex flex-wrap gap-2">
        <select
          aria-label="Filtrar status"
          className={selectClass}
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="">Todos os status</option>
          {statuses.map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
        <select
          aria-label="Filtrar rota"
          className={selectClass}
          value={routeFilter}
          onChange={(e) => setRouteFilter(e.target.value)}
        >
          <option value="">Todas as rotas</option>
          <option value="none">Sem rota</option>
          {routes.map((r) => (
            <option key={r.id} value={r.id}>
              {r.code}
            </option>
          ))}
        </select>
        <select
          aria-label="Filtrar região"
          className={selectClass}
          value={regionFilter}
          onChange={(e) => setRegionFilter(e.target.value)}
        >
          <option value="">Todas as regiões</option>
          {[...new Set(rows.map((r) => r.region_snapshot).filter(Boolean))].map((region) => (
            <option key={region} value={region}>
              {region}
            </option>
          ))}
        </select>
        <select
          aria-label="Filtrar volume"
          className={selectClass}
          value={volumeFilter}
          onChange={(e) => setVolumeFilter(e.target.value)}
        >
          <option value="">Todos os volumes</option>
          <option value="baixo">Baixo</option>
          <option value="medio">Médio</option>
          <option value="alto">Alto</option>
        </select>
        <select
          aria-label="Filtrar apoio"
          className={selectClass}
          value={supportFilter}
          onChange={(e) => setSupportFilter(e.target.value)}
        >
          <option value="">Apoio: todos</option>
          <option value="yes">Com apoio</option>
          <option value="no">Sem apoio</option>
        </select>
        <select
          aria-label="Filtrar avulsa"
          className={selectClass}
          value={extraFilter}
          onChange={(e) => setExtraFilter(e.target.value)}
        >
          <option value="">Avulsa: todas</option>
          <option value="yes">Precisa avulsa</option>
          <option value="no">Sem avulsa</option>
        </select>
        <span className="ml-auto self-center text-xs text-muted-foreground">
          {filtered.length} de {rows.length} lojas
        </span>
      </div>
      {selected.length > 0 && (
        <div className="mb-3 flex flex-wrap items-center gap-2 rounded-md border border-primary/20 bg-primary/5 p-2 text-xs">
          <strong>{selected.length} selecionadas</strong>
          <select
            className={selectClass}
            onChange={(e) => void bulk("route_id", e.target.value)}
            defaultValue=""
          >
            <option value="" disabled>
              Atribuir rota
            </option>
            {routes.map((r) => (
              <option key={r.id} value={r.id}>
                {r.code}
              </option>
            ))}
          </select>
          <select
            className={selectClass}
            onChange={(e) => void bulk("priority", e.target.value)}
            defaultValue=""
          >
            <option value="" disabled>
              Alterar prioridade
            </option>
            {priorities.map((p) => (
              <option key={p[0]} value={p[0]}>
                {p[1]}
              </option>
            ))}
          </select>
          <select
            className={selectClass}
            onChange={(e) => void bulk("status", e.target.value)}
            defaultValue=""
          >
            <option value="" disabled>
              Alterar status
            </option>
            {statuses.map((s) => (
              <option key={s[0]} value={s[0]}>
                {s[1]}
              </option>
            ))}
          </select>
        </div>
      )}
      <div className="max-h-[calc(100vh-270px)] overflow-auto rounded-md border bg-card">
        <table className="min-w-[1750px] border-collapse text-xs">
          <thead className="sticky top-0 z-20 bg-muted">
            <tr>
              {[
                "",
                "ID",
                "Loja",
                "Endereço",
                "Região",
                "Rota",
                "Volume",
                "Classe",
                "Avulsa",
                "Apoio",
                "Tipo de apoio",
                "Prioridade",
                "Status",
                "Observações",
                "",
              ].map((h, i) => (
                <th
                  key={i}
                  className={`border-b p-2 text-left font-medium ${i === 1 ? "sticky left-0 z-30 bg-muted" : ""} ${i === 2 ? "sticky left-24 z-30 bg-muted" : ""}`}
                >
                  {h ? (
                    <Button
                      variant="ghost"
                      className="h-auto justify-start p-0 text-xs"
                      onClick={() => {
                        const keys: (keyof PlanRow)[] = [
                          "id",
                          "store_code_snapshot",
                          "store_name_snapshot",
                          "full_address_snapshot",
                          "region_snapshot",
                          "route_id",
                          "predicted_volume",
                          "volume_class",
                          "needs_extra_route",
                          "needs_support",
                          "support_type",
                          "priority",
                          "status",
                          "notes",
                          "id",
                        ];
                        const key = keys[i];
                        if (key)
                          setSort((old) => ({
                            key,
                            ascending: old.key === key ? !old.ascending : true,
                          }));
                      }}
                    >
                      {h}
                      {sort.key ===
                      [
                        "id",
                        "store_code_snapshot",
                        "store_name_snapshot",
                        "full_address_snapshot",
                        "region_snapshot",
                        "route_id",
                        "predicted_volume",
                        "volume_class",
                        "needs_extra_route",
                        "needs_support",
                        "support_type",
                        "priority",
                        "status",
                        "notes",
                      ][i]
                        ? sort.ascending
                          ? " ↑"
                          : " ↓"
                        : ""}
                    </Button>
                  ) : (
                    h
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((row) => (
              <tr key={row.id} className="group hover:bg-muted/30">
                <td className="p-2">
                  <input
                    type="checkbox"
                    checked={selected.includes(row.id)}
                    onChange={(e) =>
                      setSelected((s) =>
                        e.target.checked ? [...s, row.id] : s.filter((x) => x !== row.id),
                      )
                    }
                  />
                </td>
                <td className="sticky left-0 z-10 w-24 bg-card p-2 font-mono group-hover:bg-muted">
                  {row.store_code_snapshot}
                </td>
                <td className="sticky left-24 z-10 w-52 bg-card p-2 font-medium group-hover:bg-muted">
                  {row.store_name_snapshot}
                </td>
                <td className="max-w-64 truncate p-2">
                  {row.full_address_snapshot || (
                    <span className="text-destructive">Incompleto</span>
                  )}
                </td>
                <td className="p-2">{row.region_snapshot || "—"}</td>
                <td className="p-1">
                  <select
                    className={selectClass}
                    value={row.route_id ?? ""}
                    onChange={(e) => void patch(row, { route_id: e.target.value || null })}
                  >
                    <option value="">Sem rota</option>
                    {routes.map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.code}
                      </option>
                    ))}
                  </select>
                </td>
                <td className="p-1">
                  <Input
                    className="h-8 w-20"
                    type="number"
                    min={0}
                    step={1}
                    value={row.predicted_volume}
                    onChange={(e) => void patch(row, { predicted_volume: Number(e.target.value) })}
                  />
                </td>
                <td className="p-1">
                  <select
                    className={selectClass}
                    value={row.volume_class ?? ""}
                    onChange={(e) =>
                      void patch(row, {
                        volume_class: (e.target.value || null) as PlanRow["volume_class"],
                      })
                    }
                  >
                    <option value="">Definir</option>
                    <option value="baixo">Baixo</option>
                    <option value="medio">Médio</option>
                    <option value="alto">Alto</option>
                  </select>
                </td>
                {(["needs_extra_route", "needs_support"] as const).map((k) => (
                  <td key={k} className="p-1">
                    <select
                      className={selectClass}
                      value={row[k] ? "true" : "false"}
                      onChange={(e) => void patch(row, { [k]: e.target.value === "true" })}
                    >
                      <option value="false">Não</option>
                      <option value="true">Sim</option>
                    </select>
                  </td>
                ))}
                <td className="p-1">
                  <select
                    className={selectClass}
                    value={row.support_type ?? ""}
                    onChange={(e) => {
                      const value = e.target.value;
                      if (
                        value === "" ||
                        value === "veiculo_extra" ||
                        value === "outra_rota" ||
                        value === "equipe_adicional" ||
                        value === "outro"
                      ) {
                        void patch(row, { support_type: value || null });
                      }
                    }}
                  >
                    <option value="">—</option>
                    <option value="veiculo_extra">Veículo extra</option>
                    <option value="outra_rota">Outra rota</option>
                    <option value="equipe_adicional">Equipe adicional</option>
                    <option value="outro">Outro</option>
                  </select>
                </td>
                <td className="p-1">
                  <select
                    className={selectClass}
                    value={row.priority}
                    onChange={(e) => {
                      const priority = priorities.find(([key]) => key === e.target.value)?.[0];
                      if (priority) void patch(row, { priority });
                    }}
                  >
                    {priorities.map((p) => (
                      <option key={p[0]} value={p[0]}>
                        {p[1]}
                      </option>
                    ))}
                  </select>
                </td>
                <td className="p-1">
                  <select
                    className={selectClass}
                    value={row.status}
                    onChange={(e) => {
                      const status = statuses.find(([key]) => key === e.target.value)?.[0];
                      if (status) void patch(row, { status });
                    }}
                  >
                    {statuses.map((s) => (
                      <option key={s[0]} value={s[0]}>
                        {s[1]}
                      </option>
                    ))}
                  </select>
                </td>
                <td className="p-1">
                  <Input
                    className="h-8 w-52"
                    value={row.notes}
                    onBlur={(e) => void patch(row, { notes: e.target.value })}
                    onChange={(e) =>
                      setRows((old) =>
                        old.map((x) => (x.id === row.id ? { ...x, notes: e.target.value } : x)),
                      )
                    }
                  />
                </td>
                <td className="p-1">
                  <div className="flex">
                    <Button
                      size="icon"
                      variant="ghost"
                      title="Duplicar"
                      onClick={() => void duplicate(row)}
                    >
                      <Copy />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      title="Excluir"
                      onClick={() => void remove(row.id)}
                    >
                      <Trash2 />
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
            {!filtered.length && (
              <tr>
                <td colSpan={15} className="p-14 text-center text-muted-foreground">
                  Nenhuma loja neste planejamento. Adicione uma loja ou importe uma planilha.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <Dialog open={adding} onOpenChange={setAdding}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Adicionar loja ao planejamento</DialogTitle>
          </DialogHeader>
          <div className="max-h-96 divide-y overflow-auto">
            {stores.map((s) => (
              <button
                key={s.id}
                onClick={() => void add(s)}
                className="flex w-full items-center justify-between p-3 text-left hover:bg-muted"
              >
                <span>
                  <strong className="block text-sm">{s.name}</strong>
                  <span className="text-xs text-muted-foreground">
                    {s.store_code} · {s.full_address || "Sem endereço"}
                  </span>
                </span>
                <Plus className="size-4" />
              </button>
            ))}
            {!stores.length && (
              <p className="p-8 text-center text-sm text-muted-foreground">
                Cadastre lojas primeiro.
              </p>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
