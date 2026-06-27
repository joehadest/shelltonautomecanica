"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import type { BookingInterval } from "@/lib/agenda";

export interface AvailabilityData {
  /** Carros aprovados que ocupam vaga no pátio (até serem marcados prontos). */
  patio: BookingInterval[];
  /** Início de cada agendamento (pendente ou aprovado) — reserva entrada no elevador. */
  entryStarts: string[];
}

/**
 * Dados para calcular disponibilidade por período.
 *
 * - Entrada (elevador): pendente + aprovado reservam o período de chegada.
 * - Pátio: só aprovados ocupam vaga; a liberação ocorre quando `agenda_fim`
 *   é preenchido (admin marca o carro como pronto).
 */
export async function getAvailabilityData(
  fromISO: string,
  toISO: string
): Promise<AvailabilityData> {
  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("agendamentos")
      .select("data_hora, agenda_fim, status")
      .neq("status", "recusado");

    if (error || !data) return { patio: [], entryStarts: [] };

    const patio: BookingInterval[] = [];
    const entryStarts: string[] = [];
    const horizon = new Date(toISO);
    horizon.setFullYear(horizon.getFullYear() + 1);

    for (const row of data) {
      if (!row.data_hora) continue;
      const start = new Date(row.data_hora).toISOString();

      if (start >= fromISO && start <= toISO) {
        entryStarts.push(start);
      }

      if (row.status !== "aprovado") continue;

      const end = row.agenda_fim
        ? new Date(row.agenda_fim).toISOString()
        : horizon.toISOString();

      if (start < toISO && end > fromISO) {
        patio.push({ start, end });
      }
    }

    return { patio, entryStarts };
  } catch {
    return { patio: [], entryStarts: [] };
  }
}
