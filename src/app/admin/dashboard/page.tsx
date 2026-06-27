"use client";

import { useState } from "react";
import {
  LayoutDashboard,
  CalendarClock,
  ListOrdered,
  LayoutGrid,
  BarChart3,
  PanelBottom,
  Settings,
  CalendarCog,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useDB } from "@/lib/store";
import { OverviewPanel } from "@/components/admin/overview-panel";
import { AgendamentosPanel } from "@/components/admin/agendamentos-panel";
import { FilaPanel } from "@/components/admin/fila-panel";
import { PortfolioPanel } from "@/components/admin/portfolio-panel";
import { EstatisticasPanel } from "@/components/admin/estatisticas-panel";
import { FooterPanel } from "@/components/admin/footer-panel";
import { ConfigPanel } from "@/components/admin/config-panel";
import { AgendaPanel } from "@/components/admin/agenda-panel";

type Tab =
  | "visao"
  | "agendamentos"
  | "fila"
  | "agenda"
  | "portfolio"
  | "estatisticas"
  | "footer"
  | "config";

const TABS: { id: Tab; label: string; icon: typeof CalendarClock }[] = [
  { id: "visao", label: "Visão geral", icon: LayoutDashboard },
  { id: "agendamentos", label: "Agendamentos", icon: CalendarClock },
  { id: "fila", label: "Fila virtual", icon: ListOrdered },
  { id: "agenda", label: "Agenda e vagas", icon: CalendarCog },
  { id: "portfolio", label: "Portfólio", icon: LayoutGrid },
  { id: "estatisticas", label: "Números do site", icon: BarChart3 },
  { id: "footer", label: "Rodapé", icon: PanelBottom },
  { id: "config", label: "Configurações", icon: Settings },
];

export default function DashboardPage() {
  const [tab, setTab] = useState<Tab>("visao");
  const { agendamentos } = useDB();

  const pendentes = agendamentos.filter((a) => a.status === "pendente").length;

  return (
    <div className="mx-auto w-full max-w-7xl 3xl:max-w-[1920px] px-4 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          Painel de gerenciamento
        </h1>
        <p className="text-sm text-muted-foreground">
          Controle agendamentos, fila e portfólio em tempo real.
        </p>
      </div>

      {/* Tabs */}
      <div className="mb-6 flex gap-1 overflow-x-auto rounded-lg border border-border bg-card p-1">
        {TABS.map((t) => {
          const active = tab === t.id;
          const badge =
            t.id === "agendamentos" && pendentes > 0 ? pendentes : null;
          return (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={cn(
                "relative flex flex-1 items-center justify-center gap-2 whitespace-nowrap rounded-md px-4 py-2.5 text-sm font-medium transition-colors",
                active
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <t.icon className="size-4" />
              <span className="hidden sm:inline">{t.label}</span>
              {badge && (
                <span
                  className={cn(
                    "ml-0.5 inline-flex min-w-5 items-center justify-center rounded-full px-1.5 py-0.5 text-[10px] font-bold",
                    active
                      ? "bg-primary-foreground text-primary"
                      : "bg-primary text-primary-foreground"
                  )}
                >
                  {badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Conteúdo */}
      <div className="animate-fade-in">
        {tab === "visao" && <OverviewPanel />}
        {tab === "agendamentos" && <AgendamentosPanel />}
        {tab === "fila" && <FilaPanel />}
        {tab === "agenda" && <AgendaPanel />}
        {tab === "portfolio" && <PortfolioPanel />}
        {tab === "estatisticas" && <EstatisticasPanel />}
        {tab === "footer" && <FooterPanel />}
        {tab === "config" && <ConfigPanel />}
      </div>
    </div>
  );
}
