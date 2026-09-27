"use client";

import { motion, useReducedMotion } from "motion/react";
import {
  CalendarClock,
  ListOrdered,
  Wrench,
  CheckCircle2,
  Clock,
  Inbox,
  TrendingUp,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useDB, getFilaAtiva, getListaEspera } from "@/lib/store";
import { resolveAgenda } from "@/lib/agenda-defaults";
import { formatDateTime } from "@/lib/utils";
import { FILA_STATUS_LABEL, AGENDAMENTO_STATUS_LABEL } from "@/lib/types";
import { cn } from "@/lib/utils";

export function OverviewPanel() {
  const { agendamentos, fila, agendaConfig } = useDB();
  const reduceMotion = useReducedMotion();

  const pendentes = agendamentos.filter((a) => a.status === "pendente");
  const aprovados = agendamentos.filter((a) => a.status === "aprovado");
  const listaEspera = getListaEspera(agendamentos);
  const ativa = getFilaAtiva(fila);
  const config = resolveAgenda(agendaConfig);
  const vagasLivres = Math.max(0, config.capacidade - ativa.length);
  const prontos = ativa.filter((f) => f.status === "pronto");

  const hoje = new Date().toDateString();
  const novosHoje = agendamentos.filter(
    (a) => new Date(a.created_at).toDateString() === hoje
  ).length;

  const kpis = [
    {
      label: "Pendentes",
      value: pendentes.length,
      hint: "aguardando aprovação",
      icon: Inbox,
      tone: "text-amber-400",
      bg: "bg-amber-400/10",
      border: "border-amber-400/15",
    },
    {
      label: "Na fila",
      value: ativa.length,
      hint: `${ativa.length}/${config.capacidade} vagas · ${vagasLivres} livre${vagasLivres !== 1 ? "s" : ""}`,
      icon: ListOrdered,
      tone: "text-sky-400",
      bg: "bg-sky-400/10",
      border: "border-sky-400/15",
    },
    {
      label: "Lista de espera",
      value: listaEspera.length,
      hint: "aguardando vaga no pátio",
      icon: Clock,
      tone: "text-amber-400",
      bg: "bg-amber-400/10",
      border: "border-amber-400/15",
    },
    {
      label: "Prontos",
      value: prontos.length,
      hint: "para retirada",
      icon: CheckCircle2,
      tone: "text-emerald-400",
      bg: "bg-emerald-400/10",
      border: "border-emerald-400/15",
    },
    {
      label: "Novos hoje",
      value: novosHoje,
      hint: "agendamentos recebidos",
      icon: TrendingUp,
      tone: "text-primary",
      bg: "bg-primary/10",
      border: "border-primary/20",
    },
  ];

  const recentes = [...agendamentos]
    .sort(
      (a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    )
    .slice(0, 6);

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        {kpis.map((k, i) => (
          <motion.div
            key={k.label}
            initial={reduceMotion ? false : { opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: reduceMotion ? 0 : i * 0.05, duration: 0.3 }}
          >
            <Card className={cn("border p-5", k.border)}>
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{k.label}</p>
                  <p className={cn("mt-2 text-3xl font-extrabold tracking-tight", k.tone)}>
                    {k.value}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">{k.hint}</p>
                </div>
                <span
                  className={cn(
                    "flex size-11 items-center justify-center rounded-xl border border-white/[0.04]",
                    k.bg,
                    k.tone
                  )}
                >
                  <k.icon className="size-5" />
                </span>
              </div>
            </Card>
          </motion.div>
        ))}
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        <Card className="p-5">
          <div className="mb-4 flex items-center gap-2">
            <CalendarClock className="size-5 text-primary" />
            <h3 className="font-semibold text-foreground">Atividade recente</h3>
          </div>
          {recentes.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              Nenhum agendamento ainda.
            </p>
          ) : (
            <div className="space-y-1">
              {recentes.map((a) => (
                <div
                  key={a.id}
                  className="flex items-center justify-between gap-3 rounded-xl px-2.5 py-2.5 transition-colors hover:bg-white/[0.04]"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-foreground">
                      {a.cliente_nome}
                    </p>
                    <p className="truncate text-xs text-muted-foreground">
                      {a.servico_nome} · {formatDateTime(a.created_at)}
                    </p>
                  </div>
                  <Badge
                    variant={
                      a.status === "pendente"
                        ? "warning"
                        : a.status === "aprovado"
                          ? "success"
                          : a.status === "em_espera"
                            ? "warning"
                            : "danger"
                    }
                  >
                    {AGENDAMENTO_STATUS_LABEL[a.status] ?? a.status}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card className="p-5">
          <div className="mb-4 flex items-center gap-2">
            <Wrench className="size-5 text-primary" />
            <h3 className="font-semibold text-foreground">Fila no momento</h3>
          </div>
          {ativa.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              Nenhum veículo na fila.
            </p>
          ) : (
            <div className="space-y-1">
              {ativa.slice(0, 6).map((f, i) => (
                <div
                  key={f.id}
                  className="flex items-center gap-3 rounded-xl px-2.5 py-2.5 transition-colors hover:bg-white/[0.04]"
                >
                  <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-xs font-bold text-primary">
                    {i + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-foreground">
                      {f.cliente_nome}
                    </p>
                    <p className="truncate text-xs text-muted-foreground">
                      {f.modelo} · {f.servico_nome}
                    </p>
                  </div>
                  <span
                    className={cn(
                      "flex items-center gap-1 text-xs",
                      f.status === "em_manutencao"
                        ? "text-sky-400"
                        : f.status === "pronto"
                          ? "text-emerald-400"
                          : "text-muted-foreground"
                    )}
                  >
                    <Clock className="size-3" />
                    {FILA_STATUS_LABEL[f.status]}
                  </span>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      <Card className="flex items-center justify-between border-emerald-500/15 bg-gradient-to-r from-emerald-500/[0.06] to-transparent p-5">
        <div className="flex items-center gap-3">
          <span className="flex size-11 items-center justify-center rounded-xl bg-emerald-400/10 text-emerald-400">
            <CheckCircle2 className="size-5" />
          </span>
          <div>
            <p className="text-sm font-medium text-foreground">
              Total de aprovados
            </p>
            <p className="text-xs text-muted-foreground">
              agendamentos confirmados até agora
            </p>
          </div>
        </div>
        <p className="text-2xl font-extrabold tracking-tight text-foreground">
          {aprovados.length}
        </p>
      </Card>
    </div>
  );
}
