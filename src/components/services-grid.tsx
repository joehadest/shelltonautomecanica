"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { useDB, getServicosAtivos, useDBLoading } from "@/lib/store";
import { getServiceIcon } from "@/lib/icons";
import { Card } from "@/components/ui/card";

export function ServicesGrid() {
  const { servicos } = useDB();
  const loading = useDBLoading();
  const ativos = getServicosAtivos(servicos);

  if (loading) {
    return (
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 3xl:grid-cols-4">
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <div
            key={i}
            className="h-44 animate-pulse rounded-xl border border-border bg-card/60"
          />
        ))}
      </div>
    );
  }

  return (
    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 3xl:grid-cols-4">
      {ativos.map((s, i) => {
        const Icon = getServiceIcon(s.icone);
        return (
          <Card
            key={s.id}
            className="group relative flex flex-col overflow-hidden p-6 transition-all duration-300 hover:-translate-y-1.5 hover:border-primary/50 hover:shadow-[0_12px_40px_rgba(225,29,42,0.18)] animate-fade-in"
            style={{ animationDelay: `${i * 60}ms` }}
          >
            {/* glow de fundo */}
            <div className="absolute -right-8 -top-8 size-28 rounded-full bg-primary/5 blur-2xl transition-all duration-300 group-hover:bg-primary/20" />
            {/* barra de destaque inferior */}
            <div className="absolute inset-x-0 bottom-0 h-0.5 origin-left scale-x-0 bg-gradient-to-r from-primary to-primary/40 transition-transform duration-300 group-hover:scale-x-100" />

            <div className="relative flex flex-1 flex-col">
              <div className="mb-5 inline-flex size-14 items-center justify-center rounded-2xl bg-primary/10 text-primary ring-1 ring-primary/20 transition-all duration-300 group-hover:scale-105 group-hover:bg-primary group-hover:text-primary-foreground group-hover:ring-primary/40">
                <Icon className="size-7" />
              </div>
              <h3 className="mb-2 text-lg font-bold text-foreground">
                {s.titulo}
              </h3>
              <p className="flex-1 text-sm leading-relaxed text-muted-foreground">
                {s.descricao}
              </p>

              <Link
                href="/agendamento"
                className="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-primary opacity-0 transition-all duration-300 group-hover:opacity-100"
              >
                Agendar
                <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
              </Link>
            </div>
          </Card>
        );
      })}

      {ativos.length === 0 && (
        <p className="col-span-full text-center text-sm text-muted-foreground">
          Nenhum serviço cadastrado ainda.
        </p>
      )}
    </div>
  );
}
