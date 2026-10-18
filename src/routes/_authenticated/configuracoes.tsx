import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Save } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { operationsQuery, pageHead, timestamp } from "@/lib/operations";
import { PageHeader } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { volumeLimits } from "@/lib/registration-rules";
export const Route = createFileRoute("/_authenticated/configuracoes")({
  head: () => pageHead("Configurações", "Limites operacionais de volume e perfil do planejador."),
  loader: ({ context }) => context.queryClient.ensureQueryData(operationsQuery),
  component: Settings,
});
function Settings() {
  const { data } = useSuspenseQuery(operationsQuery);
  const qc = useQueryClient();
  const [low, setLow] = useState(data.settings?.low_volume_max?.toString() ?? "");
  const [medium, setMedium] = useState(data.settings?.medium_volume_max?.toString() ?? "");
  const [name, setName] = useState(
    data.profiles.find((p) => p.id === data.userId)?.display_name ?? "",
  );
  const [busy, setBusy] = useState(false);
  const [profileBusy, setProfileBusy] = useState(false);
  const limits = volumeLimits(low, medium);
  const valid = limits !== null;
  async function save() {
    if (!limits || busy || !data.userId) return;
    setBusy(true);
    try {
    const result = await supabase
      .from("operational_settings")
      .upsert(
        { singleton: true, ...limits, updated_by: data.userId },
        { onConflict: "singleton" },
      ).select("id").single();
    if (result.error) toast.error("Não foi possível salvar os limites. Tente novamente.");
    else {
      await qc.invalidateQueries({ queryKey: ["operations"] });
      toast.success("Limites salvos; novos volumes usarão esta classificação");
    }
    } catch {
      toast.error("Não foi possível salvar os limites. Verifique sua conexão.");
    } finally { setBusy(false); }
  }
  async function profile() {
    if (!name.trim() || profileBusy || !data.userId) return;
    setProfileBusy(true);
    try {
    const result = await supabase
      .from("profiles")
      .update({ display_name: name.trim() })
      .eq("id", data.userId).select("id").single();
    if (result.error) toast.error("Não foi possível atualizar seu perfil. Tente novamente.");
    else {
      await qc.invalidateQueries({ queryKey: ["operations"] });
      toast.success("Perfil atualizado");
    }
    } catch {
      toast.error("Não foi possível atualizar seu perfil. Verifique sua conexão.");
    } finally { setProfileBusy(false); }
  }
  return (
    <>
      <PageHeader title="Configurações" description="Parâmetros operacionais" />
      <section className="max-w-2xl border-b pb-6">
        <h2 className="mb-4 font-semibold">Classificação de volume</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="low">Volume baixo — até (pacotes)</Label>
            <Input
              id="low"
              type="number"
              min={0}
              step={1}
              max={2147483647}
              disabled={busy}
              value={low}
              onChange={(e) => setLow(e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="medium">Volume médio — até (pacotes)</Label>
            <Input
              id="medium"
              type="number"
              min={0}
              step={1}
              max={2147483647}
              disabled={busy}
              value={medium}
              onChange={(e) => setMedium(e.target.value)}
            />
          </div>
        </div>
        <p className="my-4 text-sm text-muted-foreground">
          {valid
            ? `Baixo: 0–${low} · Médio: ${Number(low) + 1}–${medium} · Alto: acima de ${medium}`
            : "Limites não definidos. Informe dois limites inteiros em ordem crescente."}
        </p>
        {data.settings && (
          <p className="mb-4 text-xs text-muted-foreground">
            Última atualização: {timestamp(data.settings.updated_at)}
          </p>
        )}
        <Button disabled={!valid || busy} onClick={() => void save()}>
          <Save />
          {busy ? "Salvando…" : "Salvar limites"}
        </Button>
      </section>
      <section className="mt-6 max-w-2xl">
        <h2 className="mb-4 font-semibold">Meu perfil</h2>
        <Label htmlFor="display-name">Nome</Label>
        <Input
          id="display-name"
          className="mb-4"
          value={name}
          disabled={profileBusy}
          onChange={(e) => setName(e.target.value)}
        />
        <p className="mb-3 text-sm text-muted-foreground">
          {data.profiles.find((p) => p.id === data.userId)?.email} ·{" "}
          {data.roles.some((r) => r.user_id === data.userId && r.role === "admin")
            ? "Administrador"
            : "Planejador"}
        </p>
        <Button variant="outline" disabled={!name.trim() || profileBusy} onClick={() => void profile()}>
          {profileBusy ? "Salvando…" : "Salvar perfil"}
        </Button>
      </section>
    </>
  );
}
