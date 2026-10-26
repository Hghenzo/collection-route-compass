import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const GATEWAY_URL = "https://connector-gateway.lovable.dev/google_sheets/v4";

export const fetchSheetRows = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { url: string }) => {
    const id = /\/spreadsheets\/d\/([a-zA-Z0-9_-]+)/.exec(input.url)?.[1] ?? (/^[a-zA-Z0-9_-]{20,}$/.test(input.url.trim()) ? input.url.trim() : null);
    if (!id) throw new Error("Link do Google Sheets inválido.");
    return { id };
  })
  .handler(async ({ data }) => {
    const lovableKey = process.env["LOVABLE_API_KEY"];
    const sheetsKey = process.env["GOOGLE_SHEETS_API_KEY"];
    if (!lovableKey || !sheetsKey) throw new Error("Conexão com Google Sheets não configurada.");
    const headers = { Authorization: `Bearer ${lovableKey}`, "X-Connection-Api-Key": sheetsKey };
    const meta = await fetch(`${GATEWAY_URL}/spreadsheets/${data.id}?fields=sheets.properties.title`, { headers });
    if (!meta.ok) {
      const body = await meta.text();
      console.error(`Sheets meta failed [${meta.status}]: ${body}`);
      throw new Error(meta.status === 404 || meta.status === 403 ? "Planilha não encontrada ou sem acesso para a conta conectada." : `Falha ao abrir a planilha (${meta.status}).`);
    }
    const info = (await meta.json()) as { sheets?: { properties?: { title?: string } }[] };
    const title = info.sheets?.[0]?.properties?.title;
    if (!title) throw new Error("Planilha sem abas.");
    const res = await fetch(`${GATEWAY_URL}/spreadsheets/${data.id}/values/'${title.replace(/'/g, "''")}'`, { headers });
    if (!res.ok) {
      const body = await res.text();
      console.error(`Sheets values failed [${res.status}]: ${body}`);
      throw new Error(`Falha ao ler a planilha (${res.status}).`);
    }
    const values = ((await res.json()) as { values?: string[][] }).values ?? [];
    const [head = [], ...body] = values;
    const cols = head.map((h) => String(h).trim());
    return body
      .filter((r) => r.some((c) => String(c).trim()))
      .slice(0, 5000)
      .map((r) => Object.fromEntries(cols.map((h, i) => [h, String(r[i] ?? "").trim()])) as Record<string, string>);
  });
