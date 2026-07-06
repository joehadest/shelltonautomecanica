"use client";

import { toast } from "sonner";
import {
  ChevronUp,
  ChevronDown,
  Clock,
  Phone,
  Car,
  Wrench,
  UserPlus,
  Trash2,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  useDB,
  agendamentosApi,
  getListaEspera,
  getFilaAtiva,
} from "@/lib/store";
import { resolveAgenda } from "@/lib/agenda-defaults";

export function WaitlistPanel() {
  const { agendamentos, fila, agendaConfig } = useDB();
  const lista = getListaEspera(agendamentos);
  const ativos = getFilaAtiva(fila);
  const config = resolveAgenda(agendaConfig);
  const vagasLivres = Math.max(0, config.capacidade - ativos.length);

  async function promover(id: string, nome: string) {
    try {
      await agendamentosApi.promoverEspera(id);
      toast.success(`${nome} entrou no atendimento ativo!`);
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Erro ao promover da espera."
      );
    }
  }

  async function mover(id: string, dir: "up" | "down") {
    try {
      await agendamentosApi.moveEspera(id, dir);
    } catch {
      toast.error("Erro ao reordenar lista de espera.");
    }
  }

  async function remover(id: string, nome: string) {
    if (!confirm(`Remover ${nome} da lista de espera?`)) return;
    try {
      await agendamentosApi.setStatus(id, "recusado");
      toast.success("Removido da lista de espera.");
    } catch {
      toast.error("Erro ao remover.");
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <h2 className="text-lg font-semibold text-foreground">Lista de espera</h2>
        <Badge variant="warning">{lista.length}</Badge>
        <span className="text-sm text-muted-foreground">
          Pátio: {ativos.length}/{config.capacidade} ocupado
          {vagasLivres > 0 && ` · ${vagasLivres} vaga${vagasLivres > 1 ? "s" : ""} livre${vagasLivres > 1 ? "s" : ""}`}
        </span>
      </div>

      <p className="text-sm text-muted-foreground">
        Clientes que entraram na espera quando o pátio estava lotado. Ao
        finalizar um serviço na fila ativa, o próximo da lista é promovido
        automaticamente.
      </p>

      {lista.length === 0 ? (
        <Card className="flex flex-col items-center gap-2 p-10 text-center">
          <Clock className="size-8 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            Ninguém na lista de espera no momento.
          </p>
        </Card>
      ) : (
        <div className="space-y-3">
          {lista.map((a, idx) => (
            <Card key={a.id} className="border-amber-500/25 p-4">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
                <div className="flex items-center gap-3">
                  <div className="flex flex-col">
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-6 w-6"
                      disabled={idx === 0}
                      onClick={() => mover(a.id, "up")}
                      aria-label="Subir na espera"
                    >
                      <ChevronUp />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-6 w-6"
                      disabled={idx === lista.length - 1}
                      onClick={() => mover(a.id, "down")}
                      aria-label="Descer na espera"
                    >
                      <ChevronDown />
                    </Button>
                  </div>
                  <span className="flex size-9 items-center justify-center rounded-lg bg-amber-500/15 text-sm font-bold text-amber-500">
                    {a.posicao_espera ?? idx + 1}
                  </span>
                </div>

                <div className="min-w-0 flex-1 space-y-1 text-sm">
                  <p className="font-semibold text-foreground">
                    {a.cliente_nome}
                  </p>
                  <p className="flex items-center gap-2 text-muted-foreground">
                    <Phone className="size-3.5 text-primary" />
                    {a.telefone}
                  </p>
                  <p className="flex items-center gap-2 text-muted-foreground">
                    <Car className="size-3.5 text-primary" />
                    {a.modelo}
                    {a.placa && (
                      <>
                        {" "}
                        · <span className="font-mono uppercase">{a.placa}</span>
                      </>
                    )}
                  </p>
                  <p className="flex items-center gap-2 text-muted-foreground">
                    <Wrench className="size-3.5 text-primary" />
                    {a.servico_nome}
                  </p>
                </div>

                <div className="flex flex-wrap gap-2">
                  <Button
                    size="sm"
                    disabled={vagasLivres <= 0}
                    onClick={() => promover(a.id, a.cliente_nome)}
                  >
                    <UserPlus />
                    Promover
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => remover(a.id, a.cliente_nome)}
                    aria-label="Remover da espera"
                  >
                    <Trash2 className="text-muted-foreground" />
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
