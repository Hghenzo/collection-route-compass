export type AiStore = { store_code: string; name: string; full_address: string; cluster: string };

/** Lê a resposta JSON da IA, descartando lojas sem ID/nome e IDs repetidos. */
export function parseAiStores(raw: string): AiStore[] {
  const match = raw.match(/\{[\s\S]*\}/);
  if (!match) return [];
  let list: unknown;
  try {
    list = (JSON.parse(match[0]) as { stores?: unknown }).stores;
  } catch {
    return [];
  }
  if (!Array.isArray(list)) return [];
  const seen = new Set<string>();
  const out: AiStore[] = [];
  for (const item of list as Record<string, unknown>[]) {
    const s = {
      store_code: String(item?.["store_code"] ?? "").trim(),
      name: String(item?.["name"] ?? "").trim(),
      full_address: String(item?.["full_address"] ?? "").trim(),
      cluster: String(item?.["cluster"] ?? "").replace(/^cluster\s*/i, "").trim(),
    };
    if (!s.store_code || !s.name || seen.has(s.store_code)) continue;
    seen.add(s.store_code);
    out.push(s);
  }
  return out;
}

const palette = [210, 145, 35, 0, 280, 175, 55, 320, 100, 245];

/** Cor fixa por cluster: o mesmo cluster sempre recebe a mesma cor. */
export function clusterHue(cluster: string | null | undefined): number | null {
  const c = (cluster ?? "").trim().toLowerCase();
  if (!c) return null;
  const n = Number(c);
  if (Number.isInteger(n) && n >= 0) return palette[n % palette.length]!;
  let h = 0;
  for (const ch of c) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return palette[h % palette.length]!;
}

export function clusterStyle(cluster: string | null | undefined) {
  const hue = clusterHue(cluster);
  if (hue === null) return undefined;
  return {
    backgroundColor: `oklch(0.32 0.08 ${hue})`,
    color: `oklch(0.9 0.1 ${hue})`,
    borderColor: `oklch(0.5 0.12 ${hue})`,
  };
}
