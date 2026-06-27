"use client";

import { toast } from "sonner";
import {
  Check,
  X,
  Phone,
  Car,
  Wrench,
  Clock,
  Inbox,
  Trash2,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useDB, agendamentosApi } from "@/lib/store";
import { formatDateTime } from "@/lib/utils";
import {
  AGENDAMENTO_STATUS_LABEL,
  type Agendamento,
} from "@/lib/types";

function StatusBadge({ status }: { status: Agendamento["status"] }) {
  const map = {
    pendente: "warning",
    aprovado: "success",
    recusado: "danger",
  } as const;
  return <Badge variant={map[status]}>{AGENDAMENTO_STATUS_LABEL[status]}</Badge>;
}

export function AgendamentosPanel() {
  const { agendamentos } = useDB();
  const pendentes = agendamentos.filter((a) => a.status === "pendente");
  const resolvidos = agendamentos.filter((a) => a.status !== "pendente");

  async function aprovar(a: Agendamento) {
    try {
      await agendamentosApi.aprovar(a.id);
      toast.success(`${a.cliente_nome} aprovado!`, {
        description: "Veículo adicionado ao fim da fila.",
      });
    } catch {
      toast.error("Erro ao aprovar agendamento.");
    }
  }

  async function recusar(a: Agendamento) {
    try {
      await agendamentosApi.setStatus(a.id, "recusado");
      toast.info(`Agendamento de ${a.cliente_nome} recusado.`);
    } catch {
      toast.error("Erro ao recusar agendamento.");
    }
  }

  async function remover(a: Agendamento) {
    if (!confirm("Remover este agendamento do histórico?")) return;
    try {
      await agendamentosApi.remove(a.id);
      toast.success("Agendamento removido.");
    } catch {
      toast.error("Erro ao remover agendamento.");
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <div className="mb-3 flex items-center gap-2">
          <h2 className="text-lg font-semibold text-foreground">
            Solicitações pendentes
          </h2>
          <Badge variant="warning">{pendentes.length}</Badge>
        </div>

        {pendentes.length === 0 ? (
          <Card className="flex flex-col items-center gap-2 p-10 text-center">
            <Inbox className="size-8 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              Nenhuma solicitação pendente no momento.
            </p>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 3xl:grid-cols-3">
            {pendentes.map((a) => (
              <Card key={a.id} className="border-amber-500/30">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-2">
                    <CardTitle className="text-base">
                      {a.cliente_nome}
                    </CardTitle>
                    <StatusBadge status={a.status} />
                  </div>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <p className="flex items-center gap-2 text-muted-foreground">
                    <Phone className="size-4 text-primary" />
                    {a.telefone}
                  </p>
                  <p className="flex items-center gap-2 text-muted-foreground">
                    <Car className="size-4 text-primary" />
                    {a.modelo} ·{" "}
                    <span className="font-mono uppercase">{a.placa}</span>
                  </p>
                  <p className="flex items-center gap-2 text-muted-foreground">
                    <Wrench className="size-4 text-primary" />
                    {a.servico_nome}
                  </p>
                  <p className="flex items-center gap-2 text-muted-foreground">
                    <Clock className="size-4 shrink-0 text-primary" />
                    <span>
                      {formatDateTime(a.data_hora)}
                      {a.horario_chegada && (
                        <>
                          {" "}
                          · Deixa o carro às{" "}
                          <strong className="text-foreground">
                            {a.horario_chegada}
                          </strong>
                        </>
                      )}
                    </span>
                  </p>
                  {a.observacoes && (
                    <p className="rounded-md bg-secondary/50 p-2 text-xs text-muted-foreground">
                      “{a.observacoes}”
                    </p>
                  )}
                  <div className="flex gap-2 pt-2">
                    <Button
                      size="sm"
                      className="flex-1"
                      onClick={() => aprovar(a)}
                    >
                      <Check />
                      Aprovar
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex-1"
                      onClick={() => recusar(a)}
                    >
                      <X />
                      Recusar
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {resolvidos.length > 0 && (
        <div>
          <h2 className="mb-3 text-lg font-semibold text-foreground">
            Histórico de solicitações
          </h2>
          <Card>
            <div className="divide-y divide-border">
              {resolvidos.map((a) => (
                <div
                  key={a.id}
                  className="flex flex-wrap items-center justify-between gap-3 p-4"
                >
                  <div className="min-w-0">
                    <p className="truncate font-medium text-foreground">
                      {a.cliente_nome}
                    </p>
                    <p className="truncate text-xs text-muted-foreground">
                      {a.modelo} · {a.servico_nome} ·{" "}
                      {formatDateTime(a.data_hora)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <StatusBadge status={a.status} />
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => remover(a)}
                      aria-label="Remover"
                    >
                      <Trash2 className="text-muted-foreground" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
