import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowRight, Boxes, Eye, EyeOff, Loader2, LockKeyhole, ShieldCheck } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import logisticsNight from "@/assets/logistics-night.jpg";

export const Route = createFileRoute("/auth")({
  validateSearch: (search: Record<string, unknown>) => ({
    redirect: typeof search["redirect"] === "string" ? search["redirect"] : "/dashboard",
  }),
  head: () => ({
    meta: [
      { title: "Acesso | First Mile Control" },
      { name: "description", content: "Acesso seguro ao planejamento de coletas First Mile." },
      { property: "og:title", content: "Acesso | First Mile Control" },
      {
        property: "og:description",
        content: "Acesso seguro ao planejamento de coletas First Mile.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const { redirect } = Route.useSearch();
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    setMessage("");
    if (mode === "signup") {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { display_name: name }, emailRedirectTo: window.location.origin },
      });
      setLoading(false);
      if (error) return setMessage(error.message);
      if (!data.session) return setMessage("Conta criada. Confirme seu e-mail para entrar.");
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      setLoading(false);
      if (error) return setMessage("E-mail ou senha inválidos.");
    }
    await navigate({ to: redirect.startsWith("/") ? redirect : "/dashboard" });
  }
  async function google() {
    setLoading(true);
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin,
    });
    setLoading(false);
    if (result.error) setMessage(result.error.message);
    else if (!result.redirected) await navigate({ to: "/dashboard" });
  }
  return (
    <main className="relative flex min-h-screen flex-col bg-background">
      <img
        src={logisticsNight}
        alt="Centro logístico de coleta ao anoitecer"
        width={1536}
        height={1024}
        className="absolute inset-0 h-full w-full object-cover"
      />
      <div className="absolute inset-0 bg-auth-scrim" />
      <header className="relative flex items-center justify-between border-b border-border/60 px-6 py-5 md:px-10">
        <div className="flex items-center gap-3">
          <span className="grid size-10 place-items-center rounded-md border border-primary/30 bg-background/70 text-primary">
            <Boxes className="size-5" />
          </span>
          <span className="text-base font-semibold">First Mile Control</span>
        </div>
        <span className="hidden items-center gap-2 text-xs text-muted-foreground sm:flex">
          <ShieldCheck className="size-4 text-success" /> Acesso seguro
        </span>
      </header>
      <section className="relative flex flex-1 items-center justify-center px-6 py-10 md:justify-end md:px-16 lg:px-24">
        <div className="absolute left-12 top-16 hidden max-w-lg lg:block">
          <p className="mb-4 flex items-center gap-2 text-xs font-medium uppercase text-primary">
            <span className="size-1.5 bg-primary" /> Torre de controle operacional
          </p>
          <h1 className="text-5xl font-semibold leading-tight">
            First Mile
            <br />
            Control<span className="text-primary">.</span>
          </h1>
          <p className="mt-5 max-w-xs text-base leading-relaxed text-muted-foreground">
            Cada coleta no lugar certo.
          </p>
        </div>
        <div className="w-full max-w-[400px] rounded-md border border-border bg-background/95 p-6 backdrop-blur-md md:p-8">
          <div className="mb-6 flex size-10 items-center justify-center rounded-md border border-border bg-card text-primary">
            <LockKeyhole className="size-5" />
          </div>
          <h2 className="text-2xl font-semibold">
            {mode === "login" ? "Acessar operação" : "Criar acesso"}
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            {mode === "login"
              ? "Bem-vindo. Entre na sua torre de controle."
              : "Cadastre seu perfil de planejador."}
          </p>
          <form className="mt-7 space-y-5" onSubmit={submit}>
            {mode === "signup" && (
              <div>
                <Label htmlFor="name">Nome</Label>
                <Input
                  id="name"
                  required
                  autoComplete="name"
                  placeholder="Seu nome"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="mt-2 h-11 bg-card"
                />
              </div>
            )}
            <div>
              <Label htmlFor="email">E-mail</Label>
              <Input
                id="email"
                type="email"
                required
                autoComplete="email"
                placeholder="seu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-2 h-11 bg-card"
              />
            </div>
            <div>
              <Label htmlFor="password">Senha</Label>
              <div className="relative mt-2">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  minLength={6}
                  required
                  autoComplete={mode === "login" ? "current-password" : "new-password"}
                  placeholder="Sua senha"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="h-11 bg-card pr-11"
                />
                <Button
                  type="button"
                  size="icon"
                  variant="ghost"
                  className="absolute right-1 top-1 size-9 text-muted-foreground"
                  title={showPassword ? "Ocultar senha" : "Mostrar senha"}
                  aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </Button>
              </div>
            </div>
            {message && (
              <p role="status" className="rounded-md border border-border bg-muted p-3 text-sm">
                {message}
              </p>
            )}
            <Button className="h-11 w-full justify-between" disabled={loading} type="submit">
              <span>{mode === "login" ? "Entrar" : "Criar conta"}</span>
              {loading ? <Loader2 className="animate-spin" /> : <ArrowRight className="size-4" />}
            </Button>
          </form>
          <div className="my-5 flex items-center gap-3 text-xs text-muted-foreground">
            <span className="h-px flex-1 bg-border" />
            ou
            <span className="h-px flex-1 bg-border" />
          </div>
          <Button
            variant="outline"
            className="h-11 w-full bg-card"
            onClick={google}
            disabled={loading}
          >
            <svg viewBox="0 0 24 24" className="size-4" aria-hidden="true">
              <path
                fill="currentColor"
                d="M21.6 12.2c0-.7-.1-1.4-.2-2.2H12v4.2h5.4a4.6 4.6 0 0 1-2 3v2.6h3.3c1.9-1.8 2.9-4.4 2.9-7.6ZM12 22c2.7 0 5-.9 6.7-2.4l-3.3-2.6c-.9.6-2 .9-3.4.9-2.6 0-4.8-1.8-5.6-4.1H3v2.7A10 10 0 0 0 12 22ZM6.4 13.8a6 6 0 0 1 0-3.6V7.5H3a10 10 0 0 0 0 9l3.4-2.7ZM12 6.1c1.5 0 2.9.5 4 1.6l3-3A9.7 9.7 0 0 0 12 2a10 10 0 0 0-9 5.5l3.4 2.7A6 6 0 0 1 12 6.1Z"
              />
            </svg>
            Continuar com Google
          </Button>
          <Button
            variant="link"
            className="mt-5 h-auto w-full whitespace-normal p-0 text-sm text-muted-foreground"
            onClick={() => {
              setMode(mode === "login" ? "signup" : "login");
              setMessage("");
            }}
          >
            {mode === "login" ? "Ainda não tem acesso? Criar conta" : "Já tem acesso? Entrar"}
          </Button>
        </div>
      </section>
      <footer className="relative flex justify-between gap-3 border-t border-border/60 px-6 py-4 text-[11px] text-muted-foreground md:px-10">
        <span>First Mile · Controle operacional</span>
        <span className="flex items-center gap-1.5">
          <ShieldCheck className="size-3.5" /> Dados protegidos
        </span>
      </footer>
    </main>
  );
}
