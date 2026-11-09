import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  beforeLoad: () => {
    throw redirect({ to: "/dashboard" });
  },
  head: () => ({ meta: [
    { title: "First Mile Control | Lojas" },
    { name: "description", content: "Cadastro e importação de lojas por ID e nome." },
    { property: "og:title", content: "First Mile Control | Lojas" },
    { property: "og:description", content: "Cadastro e importação de lojas por ID e nome." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary" },
  ] }),
});
