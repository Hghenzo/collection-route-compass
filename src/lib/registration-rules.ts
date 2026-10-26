export const emptyStore = {
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
export type StoreForm = typeof emptyStore;

export function storePayload(form: StoreForm) {
  const fields = { ...emptyStore };
  for (const key of Object.keys(fields) as (keyof StoreForm)[]) fields[key] = form[key].trim();
  if (!fields.store_code || !fields.name) throw new Error("Informe o ID e o nome da loja.");
  fields.full_address ||= [
    fields.street,
    fields.street_number,
    fields.complement,
    fields.region,
    fields.city,
  ]
    .filter(Boolean)
    .join(", ");
  return fields;
}

export function volumeLimits(low: string, medium: string) {
  if (!/^\d+$/.test(low.trim()) || !/^\d+$/.test(medium.trim())) return null;
  const lowMax = Number(low),
    mediumMax = Number(medium);
  if (
    !Number.isSafeInteger(lowMax) ||
    !Number.isSafeInteger(mediumMax) ||
    mediumMax > 2147483647 ||
    mediumMax <= lowMax
  )
    return null;
  return { low_volume_max: lowMax, medium_volume_max: mediumMax };
}

const sheetAliases: Record<keyof StoreForm, string[]> = {
  store_code: ["id", "id da loja", "codigo", "codigo da loja", "store code", "store_code"],
  name: ["loja", "nome", "nome da loja", "name"],
  full_address: ["endereco", "endereco completo", "full_address"],
  street: ["rua", "logradouro", "street"],
  street_number: ["numero", "n", "street_number"],
  complement: ["complemento", "complement"],
  region: ["regiao", "bairro", "region"],
  city: ["cidade", "city"],
  location_reference: ["referencia", "ponto de referencia", "location_reference"],
  fixed_notes: ["observacoes", "obs", "observacoes fixas", "fixed_notes"],
};
const norm = (v: string) =>
  v.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/_/g, " ").trim();

/** Converte linhas de planilha em cadastros de loja; ignora linhas sem ID/nome e IDs repetidos. */
export function storesFromSheet(raw: Record<string, string>[]) {
  const headers = Object.keys(raw[0] ?? {});
  const map = Object.fromEntries(
    (Object.keys(sheetAliases) as (keyof StoreForm)[]).map((k) => [
      k,
      headers.find((h) => sheetAliases[k].map(norm).includes(norm(h))),
    ]),
  ) as Record<keyof StoreForm, string | undefined>;
  const seen = new Set<string>();
  const stores: StoreForm[] = [];
  let skipped = 0;
  for (const row of raw) {
    const form = { ...emptyStore };
    for (const k of Object.keys(form) as (keyof StoreForm)[]) {
      const col = map[k];
      form[k] = col ? String(row[col] ?? "") : "";
    }
    try {
      const p = storePayload(form);
      if (seen.has(p.store_code)) { skipped++; continue; }
      seen.add(p.store_code);
      stores.push(p);
    } catch { skipped++; }
  }
  return { stores, skipped, missingColumns: !map.store_code || !map.name };
}
