import { useEffect, useRef } from "react";
import L from "leaflet";
import { clusterHue } from "@/lib/cluster-colors";

export type MapStore = { id: string; store_code: string; name: string; full_address: string; cluster: string | null; latitude: number; longitude: number };

const esc = (s: string) => s.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);

export default function StoreMap({ stores }: { stores: MapStore[] }) {
  const el = useRef<HTMLDivElement>(null);
  const map = useRef<L.Map | null>(null);
  const layer = useRef<L.LayerGroup | null>(null);
  useEffect(() => {
    if (!el.current || map.current) return;
    map.current = L.map(el.current).setView([-23.55, -46.63], 11);
    L.tileLayer("https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}", { attribution: "Tiles © Esri", maxZoom: 16 }).addTo(map.current);
    L.tileLayer("https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Reference/MapServer/tile/{z}/{y}/{x}", { maxZoom: 16 }).addTo(map.current);
    layer.current = L.layerGroup().addTo(map.current);
    return () => { map.current?.remove(); map.current = null; };
  }, []);
  useEffect(() => {
    const m = map.current, g = layer.current;
    if (!m || !g) return;
    g.clearLayers();
    for (const s of stores) {
      const hue = clusterHue(s.cluster);
      const color = hue === null ? "oklch(0.7 0 0)" : `oklch(0.72 0.17 ${hue})`;
      L.circleMarker([s.latitude, s.longitude], { radius: 8, color: "oklch(0.15 0 0)", weight: 1.5, fillColor: color, fillOpacity: 0.95 })
        .bindPopup(`<strong>${esc(s.store_code)} · ${esc(s.name)}</strong><br/>${s.cluster ? `Cluster ${esc(s.cluster)}<br/>` : ""}${esc(s.full_address)}`)
        .addTo(g);
    }
    if (stores.length) m.fitBounds(L.latLngBounds(stores.map((s) => [s.latitude, s.longitude])), { padding: [40, 40], maxZoom: 16 });
  }, [stores]);
  return <div ref={el} className="h-[65vh] min-h-[360px] w-full rounded-md border" />;
}
