"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import type { BookingInterval } from "@/lib/agenda";

/**
 * Retorna os intervalos ocupados (início e fim exclusivo) dos agendamentos
 * que se sobrepõem à janela informada. Usado para calcular a disponibilidade
 * por período, considerando a duração de cada serviço.
 *
 * Considera agendamentos pendentes e aprovados (recusados liberam a vaga).
 */
export async function getBookings(
  fromISO: string,
  toISO: string
): Promise<BookingInterval[]> {
  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("agendamentos")
      .select("data_hora, agenda_fim, status")
      .neq("status", "recusado")
      .lte("data_hora", toISO)
      .or(`agenda_fim.gt.${fromISO},agenda_fim.is.null`);

    if (error || !data) return [];

    return data
      .filter((r) => r.data_hora)
      .map((r) => {
        const start = new Date(r.data_hora).toISOString();
        const end = r.agenda_fim
          ? new Date(r.agenda_fim).toISOString()
          : new Date(new Date(r.data_hora).getTime() + 1).toISOString();
        return { start, end };
      });
  } catch {
    return [];
  }
}
