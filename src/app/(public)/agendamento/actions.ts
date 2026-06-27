"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { notifyNewAgendamento } from "@/app/admin/push-actions";

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

const OPTIONAL_COLS = [
  "periodos",
  "agenda_fim",
  "horario_chegada",
  "push_endpoint",
  "push_p256dh",
  "push_auth",
] as const;

/**
 * Salva agendamento pelo servidor (service_role), para funcionar no celular
 * sem login — o cliente anônimo não tem permissão de SELECT após INSERT via RLS.
 */
export async function submitAgendamento(input: SubmitAgendamentoInput) {
  try {
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
      console.error("submitAgendamento:", error?.message);
      return {
        success: false as const,
        error: error?.message ?? "Não foi possível salvar o agendamento.",
      };
    }

    void notifyNewAgendamento(data.id).catch(() => {});

    return { success: true as const, id: data.id as string };
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Erro desconhecido no servidor.";
    console.error("submitAgendamento:", message);
    return { success: false as const, error: message };
  }
}
