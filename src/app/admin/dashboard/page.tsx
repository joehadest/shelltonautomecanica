"use client";

import { useState } from "react";
import { useDB, getListaEspera } from "@/lib/store";
import { AdminNavShell } from "@/components/admin/admin-nav-shell";
import type { AdminTab } from "@/components/admin/admin-nav";
import { OverviewPanel } from "@/components/admin/overview-panel";
import { AgendamentosPanel } from "@/components/admin/agendamentos-panel";
import { FilaPanel } from "@/components/admin/fila-panel";
import { PortfolioPanel } from "@/components/admin/portfolio-panel";
import { EstatisticasPanel } from "@/components/admin/estatisticas-panel";
import { FooterPanel } from "@/components/admin/footer-panel";
import { ConfigPanel } from "@/components/admin/config-panel";
import { AgendaPanel } from "@/components/admin/agenda-panel";
import { DocumentosPanel } from "@/components/admin/documentos-panel";

export default function DashboardPage() {
  const [tab, setTab] = useState<AdminTab>("visao");
  const { agendamentos } = useDB();

  const pendentes = agendamentos.filter((a) => a.status === "pendente").length;
  const listaEspera = getListaEspera(agendamentos).length;

  const badges = {
    agendamentos: pendentes,
    fila: listaEspera,
  };

  return (
    <AdminNavShell tab={tab} onTabChange={setTab} badges={badges}>
      {tab === "visao" && <OverviewPanel />}
      {tab === "agendamentos" && <AgendamentosPanel />}
      {tab === "fila" && <FilaPanel />}
      {tab === "agenda" && <AgendaPanel />}
      {tab === "portfolio" && <PortfolioPanel />}
      {tab === "documentos" && <DocumentosPanel />}
      {tab === "estatisticas" && <EstatisticasPanel />}
      {tab === "footer" && <FooterPanel />}
      {tab === "config" && <ConfigPanel />}
    </AdminNavShell>
  );
}
