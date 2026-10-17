import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import {
  AlertTriangle,
  ArrowRight,
  ArrowUpRight,
  CalendarDays,
  CheckCircle2,
  CircleAlert,
  FileUp,
  Route as RouteIcon,
  Search,
  Store,
  Truck,
} from "lucide-react";
import { PageHeader } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { shifts, today } from "@/lib/first-mile";
import { operationsQuery, operationalAlerts, pageHead, type Shift } from "@/lib/operations";
import { routeIndicators } from "@/lib/planning-rules";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => pageHead("Visão geral", "Indicadores e alertas do planejamento de coletas."),
  loader: ({ context }) => context.queryClient.ensureQueryData(operationsQuery),
  component: Dashboard,
});
function Dashboard() {
  const { data } = useSuspenseQuery(operationsQuery);
  const [date, setDate] = useState(today());
  const [shift, setShift] = useState<Shift>("manha");
  const [query, setQuery] = useState("");
  const [criticalOnly, setCriticalOnly] = useState(false);
  const planning = data.plannings.find((p) => p.collection_date === date && p.shift === shift);
  const rows = useMemo(
    () => data.items.filter((r) => r.planning_id === planning?.id),
    [data.items, planning?.id],
  );
  const routes = useMemo(
    () => data.routes.filter((r) => r.planning_id === planning?.id && !r.archived),
    [data.routes, planning?.id],
  );
  const allAlerts = operationalAlerts(rows, routes);
  const alerts = allAlerts.filter(
    (a) =>
      (!criticalOnly || a.critical) &&
      `${a.label} ${a.detail}`.toLowerCase().includes(query.toLowerCase()),
  );
  const indicators = routeIndicators(rows, routes);
  const cards = [
    ["Lojas planejadas", rows.length, Store, "text-primary"],
    [
      "Alto volume",
      rows.filter((r) => r.volume_class === "alto").length,
      CircleAlert,
      "text-warning",
    ],
    ["Rotas planejadas", routes.length, RouteIcon, "text-primary"],
    ["Rotas com apoio", indicators.support, Truck, "text-success"],
    ["Rotas avulsas", indicators.extra, Truck, "text-primary"],
    ["Sem rota", rows.filter((r) => !r.route_id).length, AlertTriangle, "text-destructive"],
    [
      "Pendentes",
      rows.filter((r) => r.status === "nao_planejada").length,
      CalendarDays,
      "text-warning",
    ],
  ] as const;
  return (
    <>
      <PageHeader
        title="Visão geral"
        description="Sua operação, em tempo real."
        actions={
          <>
            <Button variant="outline" asChild>
              <Link to="/importar">
                <FileUp />
                Importar planilha
              </Link>
            </Button>
            <Button asChild>
              <Link to="/planejamento">
                Planejar rotas
                <ArrowUpRight />
              </Link>
            </Button>
          </>
        }
      />
      <div className="mb-6 flex flex-wrap items-center gap-3 border-y py-4">
        <CalendarDays className="size-4 text-muted-foreground" />
        <Input
          aria-label="Data da visão geral"
          className="w-40 bg-card"
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
        />
        <select
          aria-label="Turno da visão geral"
          className="h-9 rounded-md border bg-card px-3 text-sm"
          value={shift}
          onChange={(e) => {
            const value = shifts.find((s) => s.value === e.target.value)?.value;
            if (value) setShift(value);
          }}
        >
          {shifts.map((s) => (
            <option key={s.value} value={s.value}>
              {s.label}
            </option>
          ))}
        </select>
        <span className="ml-auto flex items-center gap-2 text-xs text-muted-foreground">
          <span
            className={`size-1.5 rounded-full ${planning?.status === "confirmada" ? "bg-success" : "bg-warning"}`}
          />
          {planning?.status === "confirmada"
            ? "Planejamento confirmado"
            : planning
              ? "Planejamento em aberto"
              : "Sem planejamento"}
        </span>
      </div>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4 xl:grid-cols-7">
        {cards.map(([label, value, Icon, color]) => (
          <article key={label} className="rounded-md border bg-card p-4">
            <div className="mb-6 flex items-center justify-between">
              <Icon className={`size-4 ${color}`} />
              <span className="text-[10px] text-muted-foreground">FIRST MILE</span>
            </div>
            <div className="font-mono text-3xl font-medium tabular-nums">
              {String(value).padStart(2, "0")}
            </div>
            <div className="mt-2 text-xs text-muted-foreground">{label}</div>
          </article>
        ))}
      </div>
      <div className="mt-8 grid gap-8 xl:grid-cols-[1.5fr_1fr]">
        <section>
          <div className="mb-4 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <h2 className="text-base font-semibold">Atenção operacional</h2>
              <span className="rounded border border-warning/20 bg-warning/10 px-2 py-0.5 font-mono text-xs text-warning">
                {allAlerts.length}
              </span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              aria-pressed={criticalOnly}
              className={
                criticalOnly ? "text-destructive bg-destructive/10" : "text-muted-foreground"
              }
              onClick={() => setCriticalOnly(!criticalOnly)}
            >
              <CircleAlert className="size-3.5" />
              Críticos
            </Button>
          </div>
          <div className="relative mb-3">
            <Search className="absolute left-3 top-2.5 size-4 text-muted-foreground" />
            <Input
              className="bg-card pl-9"
              placeholder="Pesquisar pendências"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
          <div className="divide-y border-y">
            {alerts.length ? (
              alerts.map((a) => (
                <div key={a.key} className="flex items-start gap-3 py-4">
                  <span
                    className={`mt-0.5 grid size-8 shrink-0 place-items-center rounded-md ${a.critical ? "bg-destructive/10 text-destructive" : "bg-warning/10 text-warning"}`}
                  >
                    <AlertTriangle className="size-4" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium">{a.label}</p>
                    <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{a.detail}</p>
                  </div>
                  <Button asChild variant="ghost" size="icon" title="Revisar planejamento">
                    <Link to="/planejamento">
                      <ArrowUpRight className="size-4" />
                    </Link>
                  </Button>
                </div>
              ))
            ) : (
              <div className="flex flex-col items-center px-4 py-14 text-center">
                <CheckCircle2 className="mb-4 size-8 text-success" />
                <p className="text-sm font-medium">
                  {rows.length ? "Nenhuma pendência neste recorte" : "Pronto para a próxima coleta"}
                </p>
                <p className="mt-2 max-w-xs text-xs leading-relaxed text-muted-foreground">
                  {rows.length
                    ? "Os alertas aparecem aqui quando precisam de atenção."
                    : "Importe sua planilha ou adicione lojas ao planejamento."}
                </p>
                {!rows.length && (
                  <Button variant="link" asChild className="mt-3">
                    <Link to="/importar">
                      Importar lojas
                      <ArrowRight className="size-4" />
                    </Link>
                  </Button>
                )}
              </div>
            )}
          </div>
        </section>
        <section>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-base font-semibold">Resumo das rotas</h2>
            <Button variant="ghost" size="sm" asChild>
              <Link to="/rotas">
                Ver rotas
                <ArrowUpRight className="size-4" />
              </Link>
            </Button>
          </div>
          <div className="divide-y border-y">
            {routes.length ? (
              routes.map((r) => {
                const items = rows.filter((i) => i.route_id === r.id);
                const total = items.reduce((sum, i) => sum + i.predicted_volume, 0);
                const percent = r.capacity_packages
                  ? Math.min(100, (total / r.capacity_packages) * 100)
                  : 0;
                return (
                  <div key={r.id} className="py-4">
                    <div className="flex justify-between gap-3">
                      <span className="flex items-center gap-2 text-sm font-medium">
                        <RouteIcon className="size-4 text-primary" />
                        {r.code}
                      </span>
                      <span className="font-mono text-xs text-muted-foreground">
                        {total} pacotes
                      </span>
                    </div>
                    <p className="mt-2 text-xs text-muted-foreground">
                      {items.length} lojas · {r.responsible || "Sem responsável"}
                    </p>
                    {r.capacity_packages !== null && (
                      <div className="mt-3 flex h-1 overflow-hidden bg-muted">
                        <div
                          className={`${total > r.capacity_packages ? "bg-destructive" : "bg-primary"}`}
                          style={{ width: `${percent}%` }}
                        />
                      </div>
                    )}
                  </div>
                );
              })
            ) : (
              <div className="flex flex-col items-center py-14 text-center">
                <RouteIcon className="mb-4 size-8 text-muted-foreground" />
                <p className="text-sm font-medium">Nenhuma rota criada</p>
                <p className="mt-2 text-xs text-muted-foreground">
                  As rotas do turno aparecerão aqui.
                </p>
                <Button asChild variant="link" className="mt-3">
                  <Link to="/rotas">
                    Criar primeira rota
                    <ArrowRight className="size-4" />
                  </Link>
                </Button>
              </div>
            )}
          </div>
        </section>
      </div>
    </>
  );
}
