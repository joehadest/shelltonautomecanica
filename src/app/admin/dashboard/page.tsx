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
  { id: "documentos", label: "Orçamentos", shortLabel: "Orçamentos", icon: FileText },
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
    <div className="mx-auto w-full max-w-7xl 3xl:max-w-[1920px] px-4 py-6 sm:py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          Painel de gerenciamento
        </h1>
        <p className="text-sm text-muted-foreground">
          Controle agendamentos, fila e portfólio em tempo real.
        </p>
      </div>

      {/* Tabs — rolagem horizontal, botões grandes (ideal ~720px) */}
      <div className="mb-6 -mx-1 overflow-x-auto px-1 pb-1">
        <div className="inline-flex min-w-full gap-2 rounded-xl border border-border bg-card p-2">
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
                  "relative flex h-12 min-w-[7.5rem] shrink-0 cursor-pointer items-center justify-center gap-2 rounded-lg px-4 text-sm font-semibold transition-colors",
                  active
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "bg-secondary/40 text-muted-foreground hover:bg-secondary hover:text-foreground"
                )}
              >
                <t.icon className="size-5 shrink-0" />
                <span>{t.shortLabel}</span>
                {badge != null && (
                  <span
                    className={cn(
                      "inline-flex min-w-5 items-center justify-center rounded-full px-1.5 py-0.5 text-[11px] font-bold leading-none",
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

      {/* Conteúdo */}
      <div className="animate-fade-in">
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
