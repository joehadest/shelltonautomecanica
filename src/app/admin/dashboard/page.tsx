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
  FileText,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useDB, getListaEspera } from "@/lib/store";
import { OverviewPanel } from "@/components/admin/overview-panel";
import { AgendamentosPanel } from "@/components/admin/agendamentos-panel";
import { FilaPanel } from "@/components/admin/fila-panel";
import { PortfolioPanel } from "@/components/admin/portfolio-panel";
import { EstatisticasPanel } from "@/components/admin/estatisticas-panel";
import { FooterPanel } from "@/components/admin/footer-panel";
import { ConfigPanel } from "@/components/admin/config-panel";
import { AgendaPanel } from "@/components/admin/agenda-panel";
import { DocumentosPanel } from "@/components/admin/documentos-panel";

type Tab =
  | "visao"
  | "agendamentos"
  | "fila"
  | "agenda"
  | "portfolio"
  | "estatisticas"
  | "footer"
  | "config"
  | "documentos";

const TABS: {
  id: Tab;
  label: string;
  shortLabel: string;
  icon: typeof CalendarClock;
}[] = [
  { id: "visao", label: "Visão geral", shortLabel: "Visão", icon: LayoutDashboard },
  {
    id: "agendamentos",
    label: "Agendamentos",
    shortLabel: "Agenda",
    icon: CalendarClock,
  },
  { id: "fila", label: "Fila virtual", shortLabel: "Fila", icon: ListOrdered },
  { id: "agenda", label: "Agenda e vagas", shortLabel: "Vagas", icon: CalendarCog },
  { id: "portfolio", label: "Portfólio", shortLabel: "Serviços", icon: LayoutGrid },
  { id: "documentos", label: "Orçamentos", shortLabel: "Orçam.", icon: FileText },
  {
    id: "estatisticas",
    label: "Números do site",
    shortLabel: "Números",
    icon: BarChart3,
  },
  { id: "footer", label: "Rodapé", shortLabel: "Rodapé", icon: PanelBottom },
  { id: "config", label: "Configurações", shortLabel: "Config", icon: Settings },
];

export default function DashboardPage() {
  const [tab, setTab] = useState<Tab>("visao");
  const { agendamentos } = useDB();

  const pendentes = agendamentos.filter((a) => a.status === "pendente").length;
  const listaEspera = getListaEspera(agendamentos).length;

  return (
    <div className="mx-auto w-full min-w-0 max-w-7xl overflow-x-hidden px-3 py-5 sm:px-4 sm:py-8 3xl:max-w-[1920px]">
      <div className="mb-5 min-w-0 sm:mb-6">
        <h1 className="text-xl font-bold tracking-tight text-foreground sm:text-2xl">
          Painel de gerenciamento
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Controle agendamentos, fila e portfólio em tempo real.
        </p>
      </div>

      {/* Tabs — scroll horizontal contido (não amplia a página) */}
      <div className="mb-5 min-w-0 max-w-full sm:mb-6">
        <div className="overflow-x-auto overscroll-x-contain [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <div className="flex w-max gap-1.5 rounded-xl border border-border bg-card p-1.5 sm:gap-2 sm:p-2">
            {TABS.map((t) => {
              const active = tab === t.id;
              const badge =
                t.id === "agendamentos" && pendentes > 0
                  ? pendentes
                  : t.id === "fila" && listaEspera > 0
                    ? listaEspera
                    : null;
              return (
                <button
                  key={t.id}
                  type="button"
                  title={t.label}
                  onClick={() => setTab(t.id)}
                  className={cn(
                    "relative flex h-11 min-w-[3.75rem] shrink-0 cursor-pointer flex-col items-center justify-center gap-0.5 rounded-lg px-2 text-[11px] font-semibold transition-colors sm:h-12 sm:min-w-[7rem] sm:flex-row sm:gap-2 sm:px-4 sm:text-sm",
                    active
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "bg-secondary/40 text-muted-foreground hover:bg-secondary hover:text-foreground"
                  )}
                >
                  <t.icon className="size-4 shrink-0 sm:size-5" />
                  <span className="leading-none">{t.shortLabel}</span>
                  {badge != null && (
                    <span
                      className={cn(
                        "absolute right-0.5 top-0.5 inline-flex min-w-4 items-center justify-center rounded-full px-1 py-0.5 text-[10px] font-bold leading-none sm:static sm:min-w-5 sm:px-1.5 sm:text-[11px]",
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
        </div>
      </div>

      {/* Conteúdo */}
      <div className="min-w-0 max-w-full animate-fade-in">
        {tab === "visao" && <OverviewPanel />}
        {tab === "agendamentos" && <AgendamentosPanel />}
        {tab === "fila" && <FilaPanel />}
        {tab === "agenda" && <AgendaPanel />}
        {tab === "portfolio" && <PortfolioPanel />}
        {tab === "documentos" && <DocumentosPanel />}
        {tab === "estatisticas" && <EstatisticasPanel />}
        {tab === "footer" && <FooterPanel />}
        {tab === "config" && <ConfigPanel />}
      </div>
    </div>
  );
}
