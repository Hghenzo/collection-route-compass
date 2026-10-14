import { supabase } from "@/integrations/supabase/client";

export const shifts = [
  { value: "manha", label: "Manhã" },
  { value: "tarde", label: "Tarde" },
  { value: "noite", label: "Noite" },
] as const;

export const statuses = [
  ["nao_planejada", "Não planejada"],
  ["planejada", "Planejada"],
  ["confirmada", "Confirmada"],
  ["em_andamento", "Em andamento"],
  ["concluida", "Concluída"],
  ["com_problema", "Com problema"],
] as const;

export const priorities = [
  ["baixa", "Baixa"], ["normal", "Normal"], ["alta", "Alta"], ["critica", "Crítica"],
] as const;

export function today() {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "America/Sao_Paulo" }).format(new Date());
}

export function formatDate(value: string) {
  if (!value) return "—";
  return new Intl.DateTimeFormat("pt-BR", { timeZone: "UTC" }).format(new Date(`${value}T00:00:00Z`));
}

export async function getOrCreatePlanning(collectionDate: string, shift: "manha" | "tarde" | "noite") {
  const existing = await supabase.from("plannings").select("id").eq("collection_date", collectionDate).eq("shift", shift).maybeSingle();
  if (existing.error) throw existing.error;
  if (existing.data) return existing.data.id;
  const created = await supabase.from("plannings").insert({ collection_date: collectionDate, shift }).select("id").single();
  if (created.error) throw created.error;
  return created.data.id;
}

export function csvDownload(filename: string, rows: Record<string, unknown>[]) {
  if (!rows.length) return;
  const headers = Object.keys(rows[0]);
  const encode = (value: unknown) => `"${String(value ?? "").replaceAll('"', '""')}"`;
  const csv = `\uFEFF${headers.map(encode).join(";")}\n${rows.map((row) => headers.map((key) => encode(row[key])).join(";")).join("\n")}`;
  const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}