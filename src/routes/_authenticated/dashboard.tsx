import { createFileRoute, redirect } from "@tanstack/react-router";
import { pageHead } from "@/lib/operations";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => pageHead("Painel de lojas", "Cadastro e importação de lojas por ID e nome."),
  beforeLoad: () => {
    throw redirect({ to: "/lojas" });
  },
});
