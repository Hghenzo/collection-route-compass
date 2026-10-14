import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { BarChart3, Building2, ClipboardList, FileClock, FileUp, LogOut, Map, Route as RouteIcon, Settings } from "lucide-react";
import type { ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Sidebar, SidebarContent, SidebarFooter, SidebarHeader, SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { useQueryClient } from "@tanstack/react-query";

const nav = [
  ["/dashboard", "Visão geral", BarChart3],
  ["/planejamento", "Planejamento", ClipboardList],
  ["/rotas", "Rotas", RouteIcon],
  ["/lojas", "Cadastro de lojas", Building2],
  ["/importar", "Importar planilha", FileUp],
  ["/historico", "Histórico", FileClock],
  ["/configuracoes", "Configurações", Settings],
] as const;

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  async function signOut() {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    await navigate({ to: "/auth", replace: true });
  }
  return (
    <SidebarProvider>
      <Sidebar collapsible="icon" className="border-sidebar-border">
        <SidebarHeader className="h-16 justify-center border-b border-sidebar-border px-3">
          <div className="flex items-center gap-3 overflow-hidden">
            <span className="grid size-9 shrink-0 place-items-center rounded-md bg-sidebar-primary text-sidebar-primary-foreground"><Map className="size-5" /></span>
            <div className="min-w-0 group-data-[collapsible=icon]:hidden"><div className="truncate font-semibold">First Mile Control</div><div className="text-xs text-sidebar-foreground/60">Torre operacional</div></div>
          </div>
        </SidebarHeader>
        <SidebarContent className="px-2 py-4">
          <SidebarMenu>
            {nav.map(([to, label, Icon]) => <SidebarMenuItem key={to}><SidebarMenuButton asChild isActive={pathname === to} tooltip={label}><Link to={to}><Icon /><span>{label}</span></Link></SidebarMenuButton></SidebarMenuItem>)}
          </SidebarMenu>
        </SidebarContent>
        <SidebarFooter className="border-t border-sidebar-border p-2"><SidebarMenu><SidebarMenuItem><SidebarMenuButton tooltip="Sair" onClick={signOut}><LogOut /><span>Sair</span></SidebarMenuButton></SidebarMenuItem></SidebarMenu></SidebarFooter>
      </Sidebar>
      <div className="flex min-w-0 flex-1 flex-col bg-background">
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b bg-background/95 px-4 backdrop-blur md:px-6"><div className="flex items-center gap-3"><SidebarTrigger /><span className="text-sm text-muted-foreground">Operação First Mile</span></div><Button asChild size="sm"><Link to="/planejamento">Abrir planejamento</Link></Button></header>
        <main className="min-w-0 flex-1 p-4 md:p-6">{children}</main>
      </div>
    </SidebarProvider>
  );
}

export function PageHeader({ title, description, actions }: { title: string; description: string; actions?: ReactNode }) {
  return <div className="mb-5 flex flex-col gap-3 border-b pb-5 sm:flex-row sm:items-end sm:justify-between"><div><h1 className="text-2xl font-semibold text-foreground">{title}</h1><p className="mt-1 text-sm text-muted-foreground">{description}</p></div>{actions && <div className="flex flex-wrap gap-2">{actions}</div>}</div>;
}