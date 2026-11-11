import { createFileRoute, ClientOnly } from "@tanstack/react-router";
import { useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { lazy, Suspense, useMemo, useState } from "react";
import { MapPin, Search } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { operationsQuery } from "@/lib/operations";
import { clusterStyle, storeMatches } from "@/lib/cluster-colors";
import { supabase } from "@/integrations/supabase/client";
import type { MapStore } from "@/components/store-map";

const StoreMap = lazy(() => import("@/components/store-map"));

export const Route = createFileRoute("/_authenticated/mapa")({
  loader: ({ context }) => context.queryClient.ensureQueryData(operationsQuery),
  head: () => ({
    meta: [
      { title: "Mapa | First Mile Control" },
      { name: "description", content: "Lojas no mapa, coloridas por cluster." },
      { property: "og:title", content: "Mapa | First Mile Control" },
      { property: "og:description", content: "Lojas no mapa, coloridas por cluster." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: MapPage,
});

const collator = new Intl.Collator("pt-BR", { numeric: true, sensitivity: "base" });
const fallback = <div className="h-[65vh] min-h-[360px] w-full animate-pulse rounded-md border bg-card" />;

function MapPage() {
  const { data } = useSuspenseQuery(operationsQuery);
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<string | null>(null);
  const [progress, setProgress] = useState<string | null>(null);
  const active = data.stores.filter((s) => s.active);
  const keys = [...new Set(active.map((s) => s.cluster?.trim() || ""))].sort((a, b) => (!a ? 1 : !b ? -1 : collator.compare(a, b)));
  const filtered = active.filter((s) => (selected === null || (s.cluster?.trim() || "") === selected) && storeMatches(s, search));
  const located = useMemo(() => filtered.filter((s) => s.latitude != null && s.longitude != null) as MapStore[], [JSON.stringify(filtered.map((s) => [s.id, s.latitude, s.longitude]))]);
  const missing = active.filter((s) => (s.latitude == null || s.longitude == null) && s.full_address.trim());

  async function locate() {
    let ok = 0;
    for (const [i, s] of missing.entries()) {
      setProgress(`Localizando ${i + 1} de ${missing.length}…`);
      try {
        const r = await fetch(`https://nominatim.openstreetmap.org/search?format=json&limit=1&countrycodes=br&q=${encodeURIComponent(s.full_address)}`);
        const [hit] = (await r.json()) as { lat: string; lon: string }[];
        if (hit) {
          const { error } = await supabase.from("stores").update({ latitude: Number(hit.lat), longitude: Number(hit.lon) }).eq("id", s.id);
          if (!error) ok++;
        }
      } catch { /* segue para a próxima */ }
      await new Promise((res) => setTimeout(res, 1100));
    }
    setProgress(null);
    await qc.invalidateQueries({ queryKey: ["operations"] });
    toast.success(`${ok} de ${missing.length} lojas localizadas no mapa`);
  }

  return (
    <>
      <PageHeader title="Mapa" description={`${located.length} lojas no mapa${missing.length ? ` · ${missing.length} sem localização` : ""}`}
        actions={missing.length ? <Button disabled={!!progress} onClick={() => void locate()}><MapPin />{progress ?? "Localizar lojas"}</Button> : undefined} />
      <div className="relative mb-4 max-w-md">
        <Search className="absolute left-3 top-2.5 size-4 text-muted-foreground" />
        <Input className="pl-9" placeholder="Buscar por ID, nome ou c1, c2…" aria-label="Buscar no mapa" value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>
      <div className="mb-4 flex flex-wrap gap-2">
        <button type="button" onClick={() => setSelected(null)} className={`rounded border px-3 py-1 text-sm font-semibold ${selected === null ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}>Todos</button>
        {keys.map((k) => (
          <button key={k || "none"} type="button" aria-pressed={selected === k} onClick={() => setSelected(selected === k ? null : k)} className={`rounded border px-3 py-1 text-sm font-semibold ${selected !== null && selected !== k ? "opacity-40" : ""}`} style={k ? clusterStyle(k) : undefined}>
            {k ? `Cluster ${k}` : "Sem cluster"}
          </button>
        ))}
      </div>
      <ClientOnly fallback={fallback}><Suspense fallback={fallback}><StoreMap stores={located} /></Suspense></ClientOnly>
    </>
  );
}
