import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  beforeLoad: () => {
    throw redirect({ to: "/dashboard" });
  },
  head: () => ({ meta: [
    { title: "First Mile Control | Planejamento de coletas" },
    { name: "description", content: "Controle operacional de lojas e rotas de coleta First Mile." },
    { property: "og:title", content: "First Mile Control | Planejamento de coletas" },
    { property: "og:description", content: "Controle operacional de lojas e rotas de coleta First Mile." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary" },
  ] }),
});
