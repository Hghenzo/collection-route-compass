import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Search } from "lucide-react";
import { PageHeader } from "@/components/app-shell";
import { CopyId, byStoreCode } from "@/components/copy-id";
import { Input } from "@/components/ui/input";
import { operationsQuery } from "@/lib/operations";
import { clusterStyle } from "@/lib/cluster-colors";

export const Route = createFileRoute("/_authenticated/clusters")({
  loader: ({ context }) => context.queryClient.ensureQueryData(operationsQuery),
  head: () => ({
    meta: [
      { title: "Clusters | First Mile Control" },
      { name: "description", content: "Lojas agrupadas por cluster." },
      { property: "og:title", content: "Clusters | First Mile Control" },
      { property: "og:description", content: "Lojas agrupadas por cluster." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Clusters,
});

const collator = new Intl.Collator("pt-BR", { numeric: true, sensitivity: "base" });

function Clusters() {
  const { data } = useSuspenseQuery(operationsQuery);
  const [search, setSearch] = useState("");
  const q = search.toLowerCase();
  const stores = data.stores
    .filter((s) => s.active)
    .filter((s) => `${s.store_code} ${s.name} ${s.full_address ?? ""} ${s.cluster ?? ""}`.toLowerCase().includes(q))
    .sort(byStoreCode);
  const groups = new Map<string, typeof stores>();
  for (const s of stores) {
    const k = s.cluster?.trim() || "";
    groups.set(k, [...(groups.get(k) ?? []), s]);
  }
  const keys = [...groups.keys()].sort((a, b) => (!a ? 1 : !b ? -1 : collator.compare(a, b)));

  return (
    <>
      <PageHeader title="Clusters" description="" />
      <div className="relative mb-4 max-w-md">
        <Search className="absolute left-3 top-2.5 size-4 text-muted-foreground" />
        <Input className="pl-9" placeholder="Buscar por ID, nome ou cluster" aria-label="Buscar nos clusters" value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>
      {!keys.length && <p className="rounded-md border p-12 text-center text-muted-foreground">Nenhuma loja encontrada.</p>}
      <div className="grid gap-4">
        {keys.map((k) => (
          <section key={k || "none"} className="overflow-hidden rounded-md border bg-card">
            <header className="flex items-center gap-3 border-b px-3 py-2">
              {k ? (
                <span className="rounded border px-2 py-0.5 text-sm font-semibold" style={clusterStyle(k)}>Cluster {k}</span>
              ) : (
                <span className="text-sm font-semibold text-muted-foreground">Sem cluster</span>
              )}
              <span className="text-xs text-muted-foreground">{groups.get(k)!.length} lojas</span>
            </header>
            <table className="w-full text-sm">
              <tbody className="divide-y">
                {groups.get(k)!.map((s) => (
                  <tr key={s.id}>
                    <td className="w-32 p-2 font-mono font-medium"><span className="inline-flex items-center gap-1">{s.store_code}<CopyId value={s.store_code} /></span></td>
                    <td className="p-2 font-medium">{s.name}</td>
                    <td className="p-2 text-muted-foreground">{s.full_address || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        ))}
      </div>
    </>
  );
}
