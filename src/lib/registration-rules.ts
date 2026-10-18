export const emptyStore = {
  store_code: "", name: "", full_address: "", street: "", street_number: "",
  complement: "", region: "", city: "", location_reference: "", fixed_notes: "",
};
export type StoreForm = typeof emptyStore;

export function storePayload(form: StoreForm) {
  const fields = { ...emptyStore };
  for (const key of Object.keys(fields) as (keyof StoreForm)[]) fields[key] = form[key].trim();
  if (!fields.store_code || !fields.name) throw new Error("Informe o ID e o nome da loja.");
  fields.full_address ||= [fields.street, fields.street_number, fields.complement, fields.region, fields.city]
    .filter(Boolean).join(", ");
  return fields;
}

export function volumeLimits(low: string, medium: string) {
  if (!/^\d+$/.test(low.trim()) || !/^\d+$/.test(medium.trim())) return null;
  const lowMax = Number(low), mediumMax = Number(medium);
  if (!Number.isSafeInteger(lowMax) || !Number.isSafeInteger(mediumMax) || mediumMax > 2147483647 || mediumMax <= lowMax) return null;
  return { low_volume_max: lowMax, medium_volume_max: mediumMax };
}