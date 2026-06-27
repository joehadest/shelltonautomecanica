"use client";

import { useState } from "react";
import { CalendarClock, ListOrdered, LayoutGrid, BarChart3, PanelBottom } from "lucide-react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { useDB, getFilaAtiva } from "@/lib/store";
import { AgendamentosPanel } from "@/components/admin/agendamentos-panel";
import { FilaPanel } from "@/components/admin/fila-panel";
import { PortfolioPanel } from "@/components/admin/portfolio-panel";
import { EstatisticasPanel } from "@/components/admin/estatisticas-panel";
import { FooterPanel } from "@/components/admin/footer-panel";

type Tab = "agendamentos" | "fila" | "portfolio" | "estatisticas" | "footer";

const TABS: { id: Tab; label: string; icon: typeof CalendarClock }[] = [
  { id: "agendamentos", label: "Agendamentos", icon: CalendarClock },
  { id: "fila", label: "Fila virtual", icon: ListOrdered },
  { id: "portfolio", label: "Portfólio", icon: LayoutGrid },
  { id: "estatisticas", label: "Números do site", icon: BarChart3 },
  { id: "footer", label: "Rodapé", icon: PanelBottom },
];

export default function DashboardPage() {
  const [tab, setTab] = useState<Tab>("agendamentos");
  const { agendamentos, fila, servicos } = useDB();

  const pendentes = agendamentos.filter((a) => a.status === "pendente").length;
  const ativa = getFilaAtiva(fila);
  const emManutencao = ativa.filter((f) => f.status === "em_manutencao").length;
  const servicosAtivos = servicos.filter((s) => s.ativo).length;

  const stats = [
    {
      label: "Pendentes de aprovação",
      value: pendentes,
      hint: "agendamentos novos",
      tone: "text-amber-400",
    },
    {
      label: "Veículos na fila",
      value: ativa.length,
      hint: `${emManutencao} em manutenção`,
      tone: "text-sky-400",
    },
    {
      label: "Serviços publicados",
      value: servicosAtivos,
      hint: "no portfólio",
      tone: "text-emerald-400",
    },
  ];

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

      {/* Stats */}
      <div className="mb-8 grid gap-4 sm:grid-cols-3">
        {stats.map((s) => (
          <Card key={s.label} className="p-5">
            <p className="text-sm text-muted-foreground">{s.label}</p>
            <p className={cn("mt-2 text-3xl font-extrabold", s.tone)}>
              {s.value}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">{s.hint}</p>
          </Card>
        ))}
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
              {t.label}
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
        {tab === "agendamentos" && <AgendamentosPanel />}
        {tab === "fila" && <FilaPanel />}
        {tab === "portfolio" && <PortfolioPanel />}
        {tab === "estatisticas" && <EstatisticasPanel />}
        {tab === "footer" && <FooterPanel />}
      </div>
    </div>
  );
}
