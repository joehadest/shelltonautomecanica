"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Calendar,
  Loader2,
  Sun,
  Sunset,
  Check,
  Clock,
  Info,
} from "lucide-react";
import { getBookings } from "@/app/(public)/agendamento/availability";
import { useDB } from "@/lib/store";
import { resolveAgenda } from "@/lib/agenda-defaults";
import {
  enumeratePeriods,
  spanRemaining,
  duracaoLabel,
  type BookingInterval,
  type PeriodSlot,
} from "@/lib/agenda";
import { cn } from "@/lib/utils";

const WEEKDAYS_SHORT = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
const MONTHS_SHORT = [
  "jan",
  "fev",
  "mar",
  "abr",
  "mai",
  "jun",
  "jul",
  "ago",
  "set",
  "out",
  "nov",
  "dez",
];

function pad(n: number) {
  return n.toString().padStart(2, "0");
}

function dayKey(d: Date) {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

interface DayGroup {
  key: string;
  date: Date;
  periods: PeriodSlot[];
}

interface WeekGroup {
  label: string;
  days: DayGroup[];
}

interface SchedulePickerProps {
  value: string;
  onChange: (iso: string) => void;
  durationPeriods: number;
  serviceSelected: boolean;
}

export function SchedulePicker({
  value,
  onChange,
  durationPeriods,
  serviceSelected,
}: SchedulePickerProps) {
  const { agendaConfig } = useDB();
  const config = useMemo(() => resolveAgenda(agendaConfig), [agendaConfig]);
  const capacity = config.capacidade;

  const [bookings, setBookings] = useState<BookingInterval[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDay, setSelectedDay] = useState<string | null>(null);

  // Períodos visíveis (próximas N semanas), agrupados por semana e dia.
  const weeks = useMemo<WeekGroup[]>(() => {
    const openCount = config.dias_semana.length || 1;
    const total = config.semanas * openCount * 2 + 4;
    const periods = enumeratePeriods(config, new Date(), total);

    const byDay = new Map<string, DayGroup>();
    for (const p of periods) {
      const k = dayKey(p.date);
      if (!byDay.has(k)) byDay.set(k, { key: k, date: p.date, periods: [] });
      byDay.get(k)!.periods.push(p);
    }

    const weekMap = new Map<string, DayGroup[]>();
    for (const day of byDay.values()) {
      const dow = day.date.getDay();
      const monday = new Date(day.date);
      monday.setDate(day.date.getDate() - ((dow + 6) % 7));
      const wk = dayKey(monday);
      if (!weekMap.has(wk)) weekMap.set(wk, []);
      weekMap.get(wk)!.push(day);
    }

    const result: WeekGroup[] = [];
    const sorted = [...weekMap.keys()].sort();
    for (let i = 0; i < sorted.length && i < config.semanas; i++) {
      const days = weekMap.get(sorted[i])!.sort((a, b) =>
        a.key.localeCompare(b.key)
      );
      const first = days[0].date;
      const last = days[days.length - 1].date;
      result.push({
        label: `${first.getDate()} ${MONTHS_SHORT[first.getMonth()]} – ${last.getDate()} ${MONTHS_SHORT[last.getMonth()]}`,
        days,
      });
    }
    return result;
  }, [config]);

  // Disponibilidade (intervalos ocupados) em uma consulta só.
  useEffect(() => {
    const allDays = weeks.flatMap((w) => w.days);
    if (allDays.length === 0) {
      setLoading(false);
      return;
    }
    const from = new Date();
    from.setHours(0, 0, 0, 0);
    const to = new Date(allDays[allDays.length - 1].date);
    to.setHours(23, 59, 59, 999);

    let active = true;
    setLoading(true);
    getBookings(from.toISOString(), to.toISOString())
      .then((res) => {
        if (active) setBookings(res);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [weeks]);

  const dur = Math.max(1, durationPeriods);

  function periodRemaining(p: PeriodSlot) {
    return spanRemaining(config, p.date, dur, bookings, capacity);
  }

  function dayHasVaga(day: DayGroup) {
    return day.periods.some((p) => periodRemaining(p) > 0);
  }

  const activeDay =
    weeks.flatMap((w) => w.days).find((d) => d.key === selectedDay) ?? null;

  if (!serviceSelected) {
    return (
      <div className="flex items-center gap-2 rounded-xl border border-dashed border-border bg-card/30 p-4 text-sm text-muted-foreground">
        <Info className="size-4 shrink-0 text-primary" />
        Selecione primeiro o serviço desejado para ver os dias e horários
        disponíveis.
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center gap-2 rounded-xl border border-border bg-card/40 py-10 text-sm text-muted-foreground">
        <Loader2 className="size-4 animate-spin" />
        Carregando disponibilidade...
      </div>
    );
  }

  if (weeks.length === 0) {
    return (
      <div className="rounded-xl border border-border bg-card/40 p-5 text-sm text-muted-foreground">
        Nenhum dia disponível no momento. Fale com a oficina pelo WhatsApp.
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Aviso de duração */}
      <div className="flex items-start gap-2 rounded-lg border border-primary/20 bg-primary/5 p-3 text-xs text-muted-foreground">
        <Clock className="mt-0.5 size-3.5 shrink-0 text-primary" />
        <span>
          Este serviço ocupa a vaga por{" "}
          <strong className="text-foreground">{duracaoLabel(dur)}</strong>.
          Escolha quando deixar o veículo — a vaga fica reservada até a
          conclusão.
        </span>
      </div>

      {/* Dias por semana */}
      <div className="space-y-4">
        {weeks.map((week, wi) => (
          <div key={week.label}>
            <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              <Calendar className="size-3.5 text-primary" />
              {wi === 0 ? "Esta semana" : "Próxima semana"}
              <span className="font-normal normal-case text-muted-foreground/70">
                · {week.label}
              </span>
            </p>
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
              {week.days.map((d) => {
                const full = !dayHasVaga(d);
                const isSelected = selectedDay === d.key;
                return (
                  <button
                    key={d.key}
                    type="button"
                    disabled={full}
                    onClick={() => setSelectedDay(d.key)}
                    className={cn(
                      "flex flex-col items-center rounded-lg border p-2 text-center transition-colors",
                      isSelected
                        ? "border-primary bg-primary text-primary-foreground"
                        : full
                          ? "cursor-not-allowed border-border/50 bg-muted/20 text-muted-foreground/40"
                          : "border-border bg-card/60 text-foreground hover:border-primary/50 hover:bg-primary/5"
                    )}
                  >
                    <span className="text-[11px] font-medium uppercase">
                      {WEEKDAYS_SHORT[d.date.getDay()]}
                    </span>
                    <span className="text-lg font-bold leading-tight">
                      {d.date.getDate()}
                    </span>
                    <span
                      className={cn(
                        "text-[10px]",
                        isSelected
                          ? "text-primary-foreground/80"
                          : full
                            ? "text-muted-foreground/40"
                            : "text-muted-foreground"
                      )}
                    >
                      {full ? "Lotado" : "Disponível"}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Períodos do dia selecionado */}
      {activeDay ? (
        <div className="rounded-xl border border-border bg-card/40 p-4">
          <p className="mb-3 flex items-center gap-1.5 text-sm font-semibold text-foreground">
            <Clock className="size-4 text-primary" />
            {WEEKDAYS_SHORT[activeDay.date.getDay()]},{" "}
            {activeDay.date.getDate()} de {MONTHS_SHORT[activeDay.date.getMonth()]}
          </p>

          <div className="grid grid-cols-2 gap-3">
            {activeDay.periods.map((p) => {
              const left = periodRemaining(p);
              const full = left <= 0;
              const isSelected = value === p.iso;
              const PeriodIcon = p.periodKey === "manha" ? Sun : Sunset;
              return (
                <button
                  key={p.iso}
                  type="button"
                  disabled={full}
                  onClick={() => onChange(p.iso)}
                  className={cn(
                    "relative flex flex-col items-center gap-1 rounded-lg border px-3 py-4 transition-colors",
                    isSelected
                      ? "border-primary bg-primary text-primary-foreground"
                      : full
                        ? "cursor-not-allowed border-border/50 bg-muted/20 text-muted-foreground/40"
                        : "border-border bg-background text-foreground hover:border-primary/50 hover:bg-primary/5"
                  )}
                >
                  {isSelected && (
                    <Check className="absolute right-2 top-2 size-3.5" />
                  )}
                  <PeriodIcon className="size-5" />
                  <span className="text-sm font-semibold">{p.label}</span>
                  <span
                    className={cn(
                      "text-[10px]",
                      isSelected
                        ? "text-primary-foreground/80"
                        : full
                          ? "text-muted-foreground/40"
                          : left === 1
                            ? "text-amber-500"
                            : "text-muted-foreground"
                    )}
                  >
                    {full
                      ? "Sem vaga"
                      : `${left} vaga${left > 1 ? "s" : ""} livre${left > 1 ? "s" : ""}`}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      ) : (
        <p className="rounded-xl border border-dashed border-border bg-card/30 p-4 text-center text-xs text-muted-foreground">
          Selecione um dia acima para escolher manhã ou tarde.
        </p>
      )}

      <p className="text-center text-[11px] text-muted-foreground/80">
        Atende até {capacity} veículo{capacity > 1 ? "s" : ""} por período ·
        horários definidos pela oficina.
      </p>
    </div>
  );
}
