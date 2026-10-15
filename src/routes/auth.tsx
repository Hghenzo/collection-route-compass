import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowRight, Boxes, CheckCircle2, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/auth")({
  validateSearch: (search: Record<string, unknown>) => ({ redirect: typeof search["redirect"] === "string" ? search["redirect"] : "/dashboard" }),
  head: () => ({ meta: [{ title: "Acesso | First Mile Control" }, { name: "description", content: "Acesso seguro ao planejamento de coletas First Mile." }, { property: "og:title", content: "Acesso | First Mile Control" }, { property: "og:description", content: "Acesso seguro ao planejamento de coletas First Mile." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }] }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const { redirect } = Route.useSearch();
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState(""); const [password, setPassword] = useState(""); const [name, setName] = useState("");
  const [loading, setLoading] = useState(false); const [message, setMessage] = useState("");
  async function submit(event: React.FormEvent) {
    event.preventDefault(); setLoading(true); setMessage("");
    if (mode === "signup") {
      const { data, error } = await supabase.auth.signUp({ email, password, options: { data: { display_name: name }, emailRedirectTo: window.location.origin } });
      setLoading(false); if (error) return setMessage(error.message); if (!data.session) return setMessage("Conta criada. Confirme seu e-mail para entrar.");
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password }); setLoading(false); if (error) return setMessage("E-mail ou senha inválidos.");
    }
    await navigate({ to: redirect.startsWith("/") ? redirect : "/dashboard" });
  }
  async function google() { setLoading(true); const result = await lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin }); setLoading(false); if (result.error) setMessage(result.error.message); else if (!result.redirected) await navigate({ to: "/dashboard" }); }
  return <main className="grid min-h-screen lg:grid-cols-[1fr_0.9fr]">
    <section className="hidden flex-col justify-between bg-primary p-12 text-primary-foreground lg:flex"><div className="flex items-center gap-3 text-lg font-semibold"><span className="grid size-10 place-items-center rounded-md bg-primary-foreground/10"><Boxes /></span>First Mile Control</div><div className="max-w-xl"><p className="mb-4 text-sm font-medium text-primary-foreground/70">TORRE DE CONTROLE OPERACIONAL</p><h1 className="text-5xl font-semibold leading-tight">Planejamento de coletas com clareza e controle.</h1><div className="mt-10 grid gap-4 text-sm text-primary-foreground/80"><span className="flex gap-3"><CheckCircle2 className="text-warning" />Organize lojas e rotas em uma única visão</span><span className="flex gap-3"><CheckCircle2 className="text-warning" />Antecipe sobrecargas e pendências</span><span className="flex gap-3"><CheckCircle2 className="text-warning" />Mantenha o histórico operacional protegido</span></div></div><p className="text-xs text-primary-foreground/50">Dados internos protegidos pelo Lovable Cloud</p></section>
    <section className="flex items-center justify-center p-6"><div className="w-full max-w-sm"><div className="mb-8 lg:hidden"><div className="flex items-center gap-2 font-semibold"><Boxes className="text-primary" />First Mile Control</div></div><h2 className="text-2xl font-semibold">{mode === "login" ? "Acessar operação" : "Criar acesso"}</h2><p className="mt-2 text-sm text-muted-foreground">{mode === "login" ? "Entre para abrir seus planejamentos." : "Cadastre seu perfil de planejador."}</p>
      <form className="mt-7 space-y-4" onSubmit={submit}>{mode === "signup" && <div><Label htmlFor="name">Nome</Label><Input id="name" required value={name} onChange={e => setName(e.target.value)} className="mt-1.5" /></div>}<div><Label htmlFor="email">E-mail</Label><Input id="email" type="email" required value={email} onChange={e => setEmail(e.target.value)} className="mt-1.5" /></div><div><Label htmlFor="password">Senha</Label><Input id="password" type="password" minLength={6} required value={password} onChange={e => setPassword(e.target.value)} className="mt-1.5" /></div>{message && <p className="rounded-md bg-muted p-3 text-sm">{message}</p>}<Button className="w-full" disabled={loading}>{loading ? <Loader2 className="animate-spin" /> : <ArrowRight />}{mode === "login" ? "Entrar" : "Criar conta"}</Button></form>
      <div className="my-5 flex items-center gap-3 text-xs text-muted-foreground"><span className="h-px flex-1 bg-border" />ou<span className="h-px flex-1 bg-border" /></div><Button variant="outline" className="w-full" onClick={google} disabled={loading}>Continuar com Google</Button><button className="mt-6 w-full text-sm text-primary" onClick={() => { setMode(mode === "login" ? "signup" : "login"); setMessage(""); }}>{mode === "login" ? "Ainda não tem acesso? Criar conta" : "Já tem acesso? Entrar"}</button>
    </div></section>
  </main>;
}