"use client";

import { toast } from "sonner";
import {
  ChevronUp,
  ChevronDown,
  Flag,
  Car,
  History,
  Trash2,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { FilaStatusBadge } from "@/components/fila-status-badge";
import { WaitlistPanel } from "@/components/admin/waitlist-panel";
import { useDB, filaApi, getFilaAtiva, getHistorico } from "@/lib/store";
import { resolveAgenda } from "@/lib/agenda-defaults";
import { formatDateTime } from "@/lib/utils";
import { FILA_STATUS_LABEL, type FilaStatus } from "@/lib/types";

export function FilaPanel() {
  const { fila, agendaConfig } = useDB();
  const ativa = getFilaAtiva(fila);
  const historico = getHistorico(fila);
  const config = resolveAgenda(agendaConfig);

  async function mudarStatus(id: string, status: FilaStatus) {
    try {
      await filaApi.setStatus(id, status);
      toast.success(`Status atualizado: ${FILA_STATUS_LABEL[status]}`);
    } catch {
      toast.error("Erro ao atualizar status.");
    }
  }

  async function mover(id: string, dir: "up" | "down") {
    try {
      await filaApi.move(id, dir);
    } catch {
      toast.error("Erro ao reordenar fila.");
    }
  }

  async function finalizar(nome: string, id: string) {
    if (!confirm(`Finalizar o serviço de ${nome}? Ele sairá da fila ativa.`))
      return;
    try {
      await filaApi.finalizar(id);
      toast.success("Serviço finalizado e movido para o histórico.");
    } catch {
      toast.error("Erro ao finalizar serviço.");
    }
  }

  async function remover(id: string) {
    if (!confirm("Remover este registro do histórico?")) return;
    try {
      await filaApi.remove(id);
      toast.success("Registro removido.");
    } catch {
      toast.error("Erro ao remover registro.");
    }
  }

  return (
    <div className="space-y-10">
      <WaitlistPanel />

      <div className="rounded-xl border border-border bg-card/40 px-4 py-3 text-sm text-muted-foreground">
        Capacidade do pátio:{" "}
        <strong className="text-foreground">
          {ativa.length}/{config.capacidade}
        </strong>{" "}
        veículos em atendimento
      </div>

      <div>
        <div className="mb-3 flex items-center gap-2">
          <h2 className="text-lg font-semibold text-foreground">
            Fila ativa
          </h2>
          <Badge>{ativa.length}</Badge>
        </div>

        {ativa.length === 0 ? (
          <Card className="flex flex-col items-center gap-2 p-10 text-center">
            <Car className="size-8 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              Nenhum veículo na fila. Aprove um agendamento para começar.
            </p>
          </Card>
        ) : (
          <div className="space-y-3">
            {ativa.map((item, idx) => (
              <Card key={item.id} className="p-4">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
                  <div className="flex items-center gap-3">
                    <div className="flex flex-col">
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-6 w-6"
                        disabled={idx === 0}
                        onClick={() => mover(item.id, "up")}
                        aria-label="Subir prioridade"
                      >
                        <ChevronUp />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-6 w-6"
                        disabled={idx === ativa.length - 1}
                        onClick={() => mover(item.id, "down")}
                        aria-label="Descer prioridade"
                      >
                        <ChevronDown />
                      </Button>
                    </div>
                    <span className="flex size-9 items-center justify-center rounded-lg bg-primary/10 text-sm font-bold text-primary">
                      {item.posicao}
                    </span>
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-foreground">
                      {item.cliente_nome}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {item.modelo} ·{" "}
                      <span className="font-mono uppercase">{item.placa}</span> ·{" "}
                      {item.servico_nome}
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <Select
                      value={item.status}
                      onChange={(e) =>
                        mudarStatus(item.id, e.target.value as FilaStatus)
                      }
                      className="h-9 w-auto min-w-[170px] text-xs"
                    >
                      <option value="na_fila">Na fila</option>
                      <option value="em_manutencao">Em manutenção</option>
                      <option value="pronto">Pronto para retirada</option>
                    </Select>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => finalizar(item.cliente_nome, item.id)}
                    >
                      <Flag />
                      Finalizar
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      <div>
        <div className="mb-3 flex items-center gap-2">
          <History className="size-5 text-muted-foreground" />
          <h2 className="text-lg font-semibold text-foreground">
            Histórico de serviços
          </h2>
          <Badge variant="secondary">{historico.length}</Badge>
        </div>

        {historico.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Nenhum serviço finalizado ainda.
          </p>
        ) : (
          <Card>
            <div className="divide-y divide-border">
              {historico.map((item) => (
                <div
                  key={item.id}
                  className="flex flex-wrap items-center justify-between gap-3 p-4"
                >
                  <div className="min-w-0">
                    <p className="truncate font-medium text-foreground">
                      {item.cliente_nome}
                    </p>
                    <p className="truncate text-xs text-muted-foreground">
                      {item.modelo} · {item.servico_nome} · finalizado em{" "}
                      {formatDateTime(item.finalizado_em)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <FilaStatusBadge status={item.status} />
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => remover(item.id)}
                      aria-label="Remover"
                    >
                      <Trash2 className="text-muted-foreground" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
