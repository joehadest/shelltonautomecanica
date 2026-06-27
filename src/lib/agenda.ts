import type { ConfiguracaoAgenda } from "./types";

/** Intervalo de tempo ocupado por um agendamento (ISO, fim exclusivo). */
export interface BookingInterval {
  start: string;
  end: string;
}

export interface PeriodSlot {
  date: Date;
  iso: string;
  periodKey: "manha" | "tarde";
  label: string;
}

/** Opções amigáveis de duração (1 período = meio dia). */
export const DURACAO_OPCOES: { periodos: number; label: string }[] = [
  { periodos: 1, label: "Meio período" },
  { periodos: 2, label: "1 dia" },
  { periodos: 4, label: "2 dias" },
  { periodos: 6, label: "3 dias" },
  { periodos: 8, label: "4 dias" },
  { periodos: 10, label: "1 semana" },
  { periodos: 20, label: "2 semanas" },
  { periodos: 30, label: "3 semanas" },
  { periodos: 40, label: "4 semanas" },
];

export function duracaoLabel(periodos: number): string {
  const exact = DURACAO_OPCOES.find((o) => o.periodos === periodos);
  if (exact) return exact.label;
  if (periodos <= 1) return "Meio período";
  if (periodos % 2 === 0) {
    const dias = periodos / 2;
    return `${dias} dia${dias > 1 ? "s" : ""}`;
  }
  return `${periodos} períodos`;
}

function parseTime(t: string): [number, number] {
  const [h, m] = t.split(":").map((n) => parseInt(n, 10));
  return [h || 0, m || 0];
}

interface PeriodDef {
  key: "manha" | "tarde";
  time: [number, number];
  label: string;
}

/** Períodos de um dia, ordenados por horário. */
export function activePeriods(config: ConfiguracaoAgenda): PeriodDef[] {
  const periods: PeriodDef[] = [
    { key: "manha", time: parseTime(config.manha_inicio), label: "Manhã" },
    { key: "tarde", time: parseTime(config.tarde_inicio), label: "Tarde" },
  ];
  return periods.sort(
    (a, b) => a.time[0] * 60 + a.time[1] - (b.time[0] * 60 + b.time[1])
  );
}

/**
 * Enumera os próximos `count` períodos de trabalho a partir de `start`
 * (inclusive), respeitando os dias abertos e os horários da config.
 */
export function enumeratePeriods(
  config: ConfiguracaoAgenda,
  start: Date,
  count: number
): PeriodSlot[] {
  const periods = activePeriods(config);
  const openDays = new Set(config.dias_semana);
  const res: PeriodSlot[] = [];
  const startMs = start.getTime();

  const cursor = new Date(start);
  cursor.setHours(0, 0, 0, 0);

  let guard = 0;
  while (res.length < count && guard < 4000) {
    guard++;
    if (openDays.has(cursor.getDay())) {
      for (const p of periods) {
        const d = new Date(cursor);
        d.setHours(p.time[0], p.time[1], 0, 0);
        if (d.getTime() >= startMs) {
          res.push({
            date: d,
            iso: d.toISOString(),
            periodKey: p.key,
            label: p.label,
          });
          if (res.length >= count) break;
        }
      }
    }
    cursor.setDate(cursor.getDate() + 1);
  }
  return res;
}

/** Fim (exclusivo) da ocupação para um serviço que começa em `startISO`. */
export function computeAgendaFim(
  config: ConfiguracaoAgenda,
  startISO: string,
  durationPeriods: number
): string {
  const start = new Date(startISO);
  const d = Math.max(1, durationPeriods);
  const seq = enumeratePeriods(config, start, d + 1);
  if (seq.length > d) return seq[d].iso;
  if (seq.length > 0) return seq[seq.length - 1].iso;
  return new Date(start.getTime() + 1).toISOString();
}

/** Janela de horário permitida para chegada, conforme o período escolhido. */
export function periodWindowForSlot(
  config: ConfiguracaoAgenda,
  periodISO: string
): { min: string; max: string; label: string } | null {
  if (!periodISO) return null;
  const d = new Date(periodISO);
  const slot = `${pad(d.getHours())}:${pad(d.getMinutes())}`;
  if (slot === config.manha_inicio) {
    return {
      min: config.manha_inicio,
      max: config.manha_fim,
      label: "Manhã",
    };
  }
  if (slot === config.tarde_inicio) {
    return {
      min: config.tarde_inicio,
      max: config.tarde_fim,
      label: "Tarde",
    };
  }
  const [mh] = parseTime(config.manha_inicio);
  if (d.getHours() * 60 + d.getMinutes() < mh * 60 + 60) {
    return {
      min: config.manha_inicio,
      max: config.manha_fim,
      label: "Manhã",
    };
  }
  return {
    min: config.tarde_inicio,
    max: config.tarde_fim,
    label: "Tarde",
  };
}

function pad(n: number) {
  return n.toString().padStart(2, "0");
}

/** Quantos veículos ocupam uma vaga no período informado. */
export function occupancyAt(
  periodISO: string,
  bookings: BookingInterval[]
): number {
  let n = 0;
  for (const b of bookings) {
    if (b.start <= periodISO && periodISO < b.end) n++;
  }
  return n;
}

/**
 * Vagas realmente disponíveis para começar um serviço no período `startISO`.
 * Combina entradas (elevador) e vagas no pátio naquele momento.
 * A ocupação do pátio só termina quando o admin marca o carro como pronto.
 */
export function startAvailability(
  config: ConfiguracaoAgenda,
  startISO: string,
  patioBookings: BookingInterval[],
  entryStarts: string[]
): number {
  const entradasUsadas = entryStarts.filter((s) => s === startISO).length;
  const entradasLivres =
    Math.max(1, config.entradas_por_periodo) - entradasUsadas;
  if (entradasLivres <= 0) return 0;
  const patioLivre =
    config.capacidade - occupancyAt(startISO, patioBookings);
  return Math.max(0, Math.min(entradasLivres, patioLivre));
}

/** Libera a vaga no pátio (fim exclusivo = agora). */
export function computeReleaseAt(fromDate: Date = new Date()): string {
  return fromDate.toISOString();
}
