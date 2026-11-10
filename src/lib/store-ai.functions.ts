import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { parseAiStores, type AiStore } from "@/lib/cluster-colors";

const INSTRUCTIONS = `Você extrai lojas de um texto livre em português.
Para cada loja retorne: store_code (ID da loja), name (nome), full_address (endereço completo, "" se ausente) e cluster (número/nome do cluster, "" se ausente).
Quando o texto agrupar lojas sob um título de cluster (ex.: "Cluster 4"), aplique esse cluster a todas as lojas do grupo.
Não invente dados. Responda SOMENTE com JSON no formato {"stores":[{"store_code":"","name":"","full_address":"","cluster":""}]}.`;

export const extractStoresFromText = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { text: string }) => {
    const text = String(input.text ?? "").trim();
    if (!text) throw new Error("Cole o texto com as lojas.");
    if (text.length > 30000) throw new Error("Texto muito longo (máximo 30.000 caracteres).");
    return { text };
  })
  .handler(async ({ data }): Promise<{ stores: AiStore[] }> => {
    const key = process.env["LOVABLE_API_KEY"];
    if (!key) throw new Error("IA não configurada.");
    const { createOpenAI } = await import("@ai-sdk/openai");
    const { streamText } = await import("ai");
    const openai = createOpenAI({
      baseURL: "https://ai.gateway.lovable.dev/v1",
      apiKey: key,
      headers: { "Lovable-API-Key": key, "X-Lovable-AIG-SDK": "vercel-ai-sdk" },
    });
    try {
      const result = streamText({
        model: openai.responses("openai/gpt-6-astra"),
        system: INSTRUCTIONS,
        prompt: data.text,
        maxRetries: 0,
        providerOptions: {
          openai: { forceReasoning: true, reasoningEffort: "low", store: false },
        },
      });
      const text = await result.text;
      return { stores: parseAiStores(text) };
    } catch (e) {
      const status = (e as { statusCode?: number }).statusCode;
      console.error("store AI error", e);
      if (status === 429) throw new Error("Muitas solicitações. Aguarde um pouco e tente de novo.");
      if (status === 402 || status === 403) throw new Error("A IA está indisponível: créditos de IA esgotados ou bloqueados no workspace.");
      throw new Error("A IA não conseguiu separar o texto. Tente novamente.");
    }
  });
