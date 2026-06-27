"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { CalendarCog, Save, Car, Clock, CalendarDays } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { useDB, agendaApi } from "@/lib/store";
import { resolveAgenda } from "@/lib/agenda-defaults";
import type { ConfiguracaoAgenda } from "@/lib/types";
import { cn } from "@/lib/utils";

type AgendaDraft = Omit<ConfiguracaoAgenda, "id" | "updated_at">;

const WEEKDAYS = [
  { value: 0, label: "Dom" },
  { value: 1, label: "Seg" },
  { value: 2, label: "Ter" },
  { value: 3, label: "Qua" },
  { value: 4, label: "Qui" },
  { value: 5, label: "Sex" },
  { value: 6, label: "Sáb" },
];

function toDraft(c: ConfiguracaoAgenda): AgendaDraft {
  return {
    capacidade: c.capacidade,
    entradas_por_periodo: c.entradas_por_periodo,
    manha_inicio: c.manha_inicio,
    manha_fim: c.manha_fim,
    tarde_inicio: c.tarde_inicio,
    tarde_fim: c.tarde_fim,
    semanas: c.semanas,
    dias_semana: [...c.dias_semana].sort((a, b) => a - b),
  };
}

function sameDraft(a: AgendaDraft, b: AgendaDraft) {
  return (
    a.capacidade === b.capacidade &&
    a.entradas_por_periodo === b.entradas_por_periodo &&
    a.manha_inicio === b.manha_inicio &&
    a.manha_fim === b.manha_fim &&
    a.tarde_inicio === b.tarde_inicio &&
    a.tarde_fim === b.tarde_fim &&
    a.semanas === b.semanas &&
    a.dias_semana.join(",") === b.dias_semana.join(",")
  );
}

export function AgendaPanel() {
  const { agendaConfig } = useDB();
  const resolved = resolveAgenda(agendaConfig);
  const [draft, setDraft] = useState<AgendaDraft>(() => toDraft(resolved));
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setDraft(toDraft(resolveAgenda(agendaConfig)));
  }, [agendaConfig]);

  function update<K extends keyof AgendaDraft>(key: K, value: AgendaDraft[K]) {
    setDraft((d) => ({ ...d, [key]: value }));
  }

  function toggleDia(value: number) {
    setDraft((d) => {
      const has = d.dias_semana.includes(value);
      const next = has
        ? d.dias_semana.filter((v) => v !== value)
        : [...d.dias_semana, value];
      return { ...d, dias_semana: next.sort((a, b) => a - b) };
    });
  }

  const current = toDraft(resolved);
  const hasChanges = !sameDraft(draft, current);

  async function salvar() {
    if (draft.capacidade < 1) {
      toast.error("A capacidade precisa ser de pelo menos 1 veículo.");
      return;
    }
    if (draft.dias_semana.length === 0) {
      toast.error("Selecione ao menos um dia de atendimento.");
      return;
    }
    setSaving(true);
    try {
      await agendaApi.update(draft);
      toast.success("Configuração da agenda salva!");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Erro ao salvar.";
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <CalendarCog className="size-5 text-primary" />
        <h2 className="text-lg font-semibold text-foreground">
          Agenda e vagas
        </h2>
      </div>
      <p className="text-sm text-muted-foreground">
        Controle quantos veículos a oficina atende por horário, os dias e os
        horários disponíveis para o cliente agendar.
      </p>

      {/* Capacidade */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Car className="size-4 text-primary" />
            Capacidade da oficina
          </CardTitle>
          <CardDescription>
            Os dois limites que controlam quantos carros entram e ficam.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="entradas">Entradas por período</Label>
              <Input
                id="entradas"
                type="number"
                min={1}
                max={10}
                value={draft.entradas_por_periodo}
                onChange={(e) =>
                  update(
                    "entradas_por_periodo",
                    parseInt(e.target.value, 10) || 0
                  )
                }
              />
              <p className="text-xs text-muted-foreground">
                Quantos carros novos podem entrar por manhã/tarde (o gargalo do
                elevador). Normalmente 1.
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="capacidade">Vagas no pátio</Label>
              <Input
                id="capacidade"
                type="number"
                min={1}
                max={20}
                value={draft.capacidade}
                onChange={(e) =>
                  update("capacidade", parseInt(e.target.value, 10) || 0)
                }
              />
              <p className="text-xs text-muted-foreground">
                Carros que podem ficar ao mesmo tempo na oficina. A vaga só
                libera quando o serviço é marcado como pronto na fila.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Dias e semanas */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <CalendarDays className="size-4 text-primary" />
            Dias de atendimento
          </CardTitle>
          <CardDescription>
            Selecione os dias da semana abertos para agendamento.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-2">
            {WEEKDAYS.map((d) => {
              const active = draft.dias_semana.includes(d.value);
              return (
                <button
                  key={d.value}
                  type="button"
                  onClick={() => toggleDia(d.value)}
                  className={cn(
                    "rounded-lg border px-4 py-2 text-sm font-medium transition-colors",
                    active
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border bg-card text-muted-foreground hover:border-primary/50 hover:text-foreground"
                  )}
                >
                  {d.label}
                </button>
              );
            })}
          </div>
          <div className="space-y-2 sm:max-w-xs">
            <Label htmlFor="semanas">Semanas abertas para agendar</Label>
            <Select
              id="semanas"
              value={String(draft.semanas)}
              onChange={(e) => update("semanas", parseInt(e.target.value, 10))}
            >
              <option value="1">1 semana</option>
              <option value="2">2 semanas</option>
              <option value="3">3 semanas</option>
              <option value="4">4 semanas</option>
            </Select>
            <p className="text-xs text-muted-foreground">
              O cliente só vê horários dentro desse período.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Horários */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Clock className="size-4 text-primary" />
            Períodos de atendimento
          </CardTitle>
          <CardDescription>
            Horário dos turnos da manhã e da tarde. O cliente escolhe deixar o
            carro pela manhã ou à tarde; o intervalo entre eles é a pausa.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <div>
            <p className="mb-2 text-sm font-medium text-foreground">Manhã</p>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="manha_inicio">Início</Label>
                <Input
                  id="manha_inicio"
                  type="time"
                  value={draft.manha_inicio}
                  onChange={(e) => update("manha_inicio", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="manha_fim">Fim</Label>
                <Input
                  id="manha_fim"
                  type="time"
                  value={draft.manha_fim}
                  onChange={(e) => update("manha_fim", e.target.value)}
                />
              </div>
            </div>
          </div>
          <div>
            <p className="mb-2 text-sm font-medium text-foreground">Tarde</p>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="tarde_inicio">Início</Label>
                <Input
                  id="tarde_inicio"
                  type="time"
                  value={draft.tarde_inicio}
                  onChange={(e) => update("tarde_inicio", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="tarde_fim">Fim</Label>
                <Input
                  id="tarde_fim"
                  type="time"
                  value={draft.tarde_fim}
                  onChange={(e) => update("tarde_fim", e.target.value)}
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Button onClick={salvar} disabled={saving || !hasChanges} size="lg">
        <Save />
        {saving ? "Salvando..." : "Salvar configuração"}
      </Button>
    </div>
  );
}
