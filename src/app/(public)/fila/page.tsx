"use client";

import Link from "next/link";
import { Radio, Car, Clock, CalendarPlus } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { FilaStatusBadge } from "@/components/fila-status-badge";
import { useDB, getFilaAtiva, useDBLoading } from "@/lib/store";
import { maskName, maskPlate, cn } from "@/lib/utils";

export default function FilaPage() {
  const { fila } = useDB();
  const loading = useDBLoading();
  const ativa = getFilaAtiva(fila);

  const emAtendimento = ativa.filter((f) => f.status === "em_manutencao").length;
  const aguardando = ativa.filter((f) => f.status === "na_fila").length;
  const prontos = ativa.filter((f) => f.status === "pronto").length;

  return (
    <section className="mx-auto w-full max-w-3xl px-4 py-12 sm:py-16">
      <div className="mb-8 text-center">
        <span className="mb-4 inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-1.5 text-xs font-semibold text-primary">
          <span className="relative flex size-2">
            <span className="absolute inline-flex size-full animate-ping rounded-full bg-primary opacity-75" />
            <span className="relative inline-flex size-2 rounded-full bg-primary" />
          </span>
          Atualização em tempo real
        </span>
        <h1 className="flex items-center justify-center gap-2 text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
          <Radio className="size-7 text-primary" />
          Fila da oficina
        </h1>
        <p className="mt-3 text-muted-foreground">
          Acompanhe o andamento dos veículos. Por privacidade, exibimos apenas
          informações parciais.
        </p>
      </div>

      {/* Resumo */}
      <div className="mb-6 grid grid-cols-3 gap-3">
        <Card className="p-4 text-center">
          <p className="text-2xl font-extrabold text-sky-400">{aguardando}</p>
          <p className="mt-1 text-xs text-muted-foreground">Na fila</p>
        </Card>
        <Card className="p-4 text-center">
          <p className="text-2xl font-extrabold text-amber-400">
            {emAtendimento}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">Em manutenção</p>
        </Card>
        <Card className="p-4 text-center">
          <p className="text-2xl font-extrabold text-emerald-400">{prontos}</p>
          <p className="mt-1 text-xs text-muted-foreground">Prontos</p>
        </Card>
      </div>

      {/* Lista / timeline */}
      {loading ? (
        <div className="space-y-3">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="h-24 animate-pulse rounded-lg border border-border bg-card/60"
            />
          ))}
        </div>
      ) : ativa.length === 0 ? (
        <Card className="flex flex-col items-center gap-4 p-12 text-center">
          <div className="flex size-16 items-center justify-center rounded-full bg-secondary text-muted-foreground">
            <Car className="size-8" />
          </div>
          <div>
            <p className="text-lg font-semibold text-foreground">
              Nenhum veículo na fila
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              A oficina está com a fila vazia no momento. Que tal agendar?
            </p>
          </div>
          <Link
            href="/agendamento"
            className={cn(buttonVariants({ size: "lg" }))}
          >
            <CalendarPlus />
            Agendar serviço
          </Link>
        </Card>
      ) : (
        <ol className="relative space-y-4 before:absolute before:left-[27px] before:top-2 before:h-[calc(100%-1rem)] before:w-px before:bg-border">
          {ativa.map((item) => (
            <li key={item.id} className="relative">
              <Card
                className={cn(
                  "ml-0 p-4 pl-16 transition-colors sm:p-5 sm:pl-16",
                  item.status === "em_manutencao" && "border-amber-500/40",
                  item.status === "pronto" && "border-emerald-500/40"
                )}
              >
                <span
                  className={cn(
                    "absolute left-3.5 top-4 flex size-8 items-center justify-center rounded-full text-xs font-bold ring-4 ring-background",
                    item.status === "em_manutencao"
                      ? "bg-amber-500 text-black animate-pulse-ring"
                      : item.status === "pronto"
                        ? "bg-emerald-500 text-black"
                        : "bg-secondary text-foreground"
                  )}
                >
                  {item.posicao}
                </span>

                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <p className="font-semibold text-foreground">
                      {maskName(item.cliente_nome)}
                      <span className="text-muted-foreground"> · </span>
                      <span className="font-normal text-muted-foreground">
                        {item.modelo}
                      </span>
                    </p>
                    <p className="mt-0.5 flex items-center gap-2 text-sm text-muted-foreground">
                      <Badge variant="outline" className="font-mono">
                        {maskPlate(item.placa)}
                      </Badge>
                      <span>{item.servico_nome}</span>
                    </p>
                  </div>
                  <FilaStatusBadge status={item.status} />
                </div>
              </Card>
            </li>
          ))}
        </ol>
      )}

      <p className="mt-8 flex items-center justify-center gap-1.5 text-center text-xs text-muted-foreground">
        <Clock className="size-3.5" />
        A posição na fila pode mudar conforme a prioridade dos serviços.
      </p>
    </section>
  );
}
