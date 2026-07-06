"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { notifyNewAgendamento, notifyClient } from "@/app/admin/push-actions";
import {
  getCapacityStatus,
  nextEsperaPosition,
  promoteNextFromWaitlist,
} from "@/lib/capacity-server";

export { getCapacityStatus, promoteNextFromWaitlist };

export interface SubmitAgendamentoInput {
  cliente_nome: string;
  telefone: string;
  placa: string;
  modelo: string;
  servico_nome: string;
  data_hora: string;
  horario_chegada: string;
  observacoes?: string;
  periodos: number;
  clientPush?: {
    endpoint: string;
    p256dh: string;
    auth: string;
  } | null;
}

export interface SubmitListaEsperaInput {
  cliente_nome: string;
  telefone: string;
  placa: string;
  modelo: string;
  servico_nome: string;
  observacoes?: string;
  periodos: number;
  clientPush?: {
    endpoint: string;
    p256dh: string;
    auth: string;
  } | null;
}

const OPTIONAL_COLS = [
  "periodos",
  "agenda_fim",
  "horario_chegada",
  "posicao_espera",
  "push_endpoint",
  "push_p256dh",
  "push_auth",
] as const;

async function insertAgendamento(payload: Record<string, unknown>) {
  const supabase = createAdminClient();
  let { data, error } = await supabase
    .from("agendamentos")
    .insert(payload)
    .select("id")
    .single();

  if (error) {
    const fallback = { ...payload };
    for (const col of OPTIONAL_COLS) delete fallback[col];
    const retry = await supabase
      .from("agendamentos")
      .insert(fallback)
      .select("id")
      .single();
    data = retry.data;
    error = retry.error;
  }

  if (error || !data?.id) {
    return { success: false as const, error: error?.message ?? "Erro ao salvar." };
  }
  return { success: true as const, id: data.id as string };
}

/**
 * Agendamento com horário — só se houver vaga no pátio.
 */
export async function submitAgendamento(input: SubmitAgendamentoInput) {
  try {
    const cap = await getCapacityStatus();
    if (cap.lotado) {
      return {
        success: false as const,
        error:
          "Todas as vagas estão ocupadas. Entre na lista de espera abaixo.",
        lotado: true,
      };
    }

    const supabase = createAdminClient();
    const payload: Record<string, unknown> = {
      cliente_nome: input.cliente_nome,
      telefone: input.telefone,
      placa: input.placa,
      modelo: input.modelo,
      servico_nome: input.servico_nome,
      data_hora: input.data_hora,
      horario_chegada: input.horario_chegada,
      observacoes: input.observacoes ?? null,
      periodos: input.periodos,
      agenda_fim: null,
      status: "pendente",
    };

    if (input.clientPush) {
      payload.push_endpoint = input.clientPush.endpoint;
      payload.push_p256dh = input.clientPush.p256dh;
      payload.push_auth = input.clientPush.auth;
    }

    const result = await insertAgendamento(payload);
    if (!result.success) {
      console.error("submitAgendamento:", result.error);
      return result;
    }

    void notifyNewAgendamento(result.id).catch(() => {});
    void notifyClient(result.id, { kind: "pedido_recebido" }).catch(() => {});
    return { success: true as const, id: result.id, modo: "agendamento" as const };
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Erro desconhecido no servidor.";
    console.error("submitAgendamento:", message);
    return { success: false as const, error: message };
  }
}

/**
 * Lista de espera — quando o pátio está lotado.
 */
export async function submitListaEspera(input: SubmitListaEsperaInput) {
  try {
    const supabase = createAdminClient();
    const posicao = await nextEsperaPosition(supabase);

    const payload: Record<string, unknown> = {
      cliente_nome: input.cliente_nome,
      telefone: input.telefone,
      placa: input.placa,
      modelo: input.modelo,
      servico_nome: input.servico_nome,
      observacoes: input.observacoes ?? null,
      periodos: input.periodos,
      data_hora: new Date().toISOString(),
      horario_chegada: null,
      agenda_fim: null,
      status: "em_espera",
      posicao_espera: posicao,
    };

    if (input.clientPush) {
      payload.push_endpoint = input.clientPush.endpoint;
      payload.push_p256dh = input.clientPush.p256dh;
      payload.push_auth = input.clientPush.auth;
    }

    const result = await insertAgendamento(payload);
    if (!result.success) {
      console.error("submitListaEspera:", result.error);
      return result;
    }

    void notifyNewAgendamento(result.id).catch(() => {});
    void notifyClient(result.id, {
      kind: "lista_espera_entrada",
      posicao,
    }).catch(() => {});
    return {
      success: true as const,
      id: result.id,
      modo: "espera" as const,
      posicao,
    };
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Erro desconhecido no servidor.";
    console.error("submitListaEspera:", message);
    return { success: false as const, error: message };
  }
}

/** Chamado após liberar vaga — promove o próximo da lista de espera. */
export async function processarVagaLiberada() {
  const promoted = await promoteNextFromWaitlist();
  return { promoted };
}
