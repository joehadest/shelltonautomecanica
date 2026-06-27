"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import {
  sendPushToAll,
  sendPushToSubscription,
  type RawSubscription,
} from "@/lib/push-server";
import type { AgendamentoStatus, FilaStatus } from "@/lib/types";

export interface SerializedSubscription {
  endpoint: string;
  keys: { p256dh: string; auth: string };
}

export async function subscribeUser(
  sub: SerializedSubscription,
  userAgent?: string
) {
  if (!sub?.endpoint || !sub.keys?.p256dh || !sub.keys?.auth) {
    return { success: false, error: "Inscrição inválida." };
  }
  const supabase = createAdminClient();
  const { error } = await supabase.from("push_subscriptions").upsert(
    {
      endpoint: sub.endpoint,
      p256dh: sub.keys.p256dh,
      auth: sub.keys.auth,
      user_agent: userAgent ?? null,
    },
    { onConflict: "endpoint" }
  );
  if (error) {
    console.error("subscribeUser:", error.message);
    return { success: false, error: error.message };
  }
  return { success: true };
}

export async function unsubscribeUser(endpoint: string) {
  if (!endpoint) return { success: false, error: "endpoint ausente" };
  const supabase = createAdminClient();
  const { error } = await supabase
    .from("push_subscriptions")
    .delete()
    .eq("endpoint", endpoint);
  if (error) return { success: false, error: error.message };
  return { success: true };
}

/**
 * Dispara o push de "novo agendamento" verificando antes que o registro
 * realmente existe no banco (evita spam). Chamado logo após a criação.
 */
export async function notifyNewAgendamento(agendamentoId: string) {
  if (!agendamentoId) return { success: false, error: "id ausente" };
  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("agendamentos")
      .select("cliente_nome, modelo, servico_nome")
      .eq("id", agendamentoId)
      .maybeSingle();

    if (error || !data) {
      return { success: false, error: error?.message ?? "não encontrado" };
    }

    const nome = data.cliente_nome ?? "Cliente";
    const modelo = data.modelo ? ` (${data.modelo})` : "";
    const servico = data.servico_nome ? ` · ${data.servico_nome}` : "";

    const result = await sendPushToAll({
      title: "Novo agendamento recebido",
      body: `${nome}${modelo}${servico}`,
      url: "/admin/dashboard",
      tag: "shellton-agendamento",
    });
    return { success: true, ...result };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erro desconhecido";
    console.error("notifyNewAgendamento:", message);
    return { success: false, error: message };
  }
}

/** Lê a inscrição push do cliente de um agendamento (ou null). */
async function getClientSubscription(
  agendamentoId: string
): Promise<RawSubscription | null> {
  const supabase = createAdminClient();
  const { data } = await supabase
    .from("agendamentos")
    .select("push_endpoint, push_p256dh, push_auth")
    .eq("id", agendamentoId)
    .maybeSingle();
  if (!data?.push_endpoint || !data.push_p256dh || !data.push_auth) return null;
  return {
    endpoint: data.push_endpoint,
    p256dh: data.push_p256dh,
    auth: data.push_auth,
  };
}

/**
 * Avisa o cliente quando o status do agendamento muda (aprovado/recusado).
 */
export async function notifyClientAgendamentoStatus(
  agendamentoId: string,
  status: AgendamentoStatus
) {
  if (!agendamentoId) return { success: false, error: "id ausente" };
  if (status === "pendente") return { success: false, error: "sem aviso" };
  try {
    const sub = await getClientSubscription(agendamentoId);
    if (!sub) return { success: true, skipped: true };

    const payload =
      status === "aprovado"
        ? {
            title: "Pedido aprovado! ✅",
            body: "Seu agendamento foi aceito e entrou na fila. Acompanhe por aqui.",
            url: "/fila",
            tag: "shellton-cliente",
          }
        : {
            title: "Sobre o seu agendamento",
            body: "Não foi possível confirmar seu pedido. Fale com a oficina para mais detalhes.",
            url: "/fila",
            tag: "shellton-cliente",
          };

    const ok = await sendPushToSubscription(sub, payload);
    return { success: ok };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erro desconhecido";
    console.error("notifyClientAgendamentoStatus:", message);
    return { success: false, error: message };
  }
}

/**
 * Avisa o cliente quando o status do serviço dele na fila muda
 * (em manutenção / pronto para retirada).
 */
export async function notifyClientFilaStatus(
  agendamentoId: string,
  status: FilaStatus
) {
  if (!agendamentoId) return { success: false, error: "id ausente" };
  if (status === "na_fila") return { success: false, error: "sem aviso" };
  try {
    const sub = await getClientSubscription(agendamentoId);
    if (!sub) return { success: true, skipped: true };

    const payload =
      status === "em_manutencao"
        ? {
            title: "Seu carro entrou em manutenção 🔧",
            body: "Nossa equipe já está cuidando do seu veículo.",
            url: "/fila",
            tag: "shellton-cliente",
          }
        : {
            title: "Seu carro está pronto! 🎉",
            body: "O serviço foi concluído. Você já pode retirar na oficina.",
            url: "/fila",
            tag: "shellton-cliente",
          };

    const ok = await sendPushToSubscription(sub, payload);
    return { success: ok };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erro desconhecido";
    console.error("notifyClientFilaStatus:", message);
    return { success: false, error: message };
  }
}

export async function sendTestNotification() {
  try {
    const result = await sendPushToAll({
      title: "Shellton Auto Mecânica",
      body: "Notificação de teste — está tudo funcionando! 🔧",
      url: "/admin/dashboard",
      tag: "shellton-test",
    });
    return { success: true, ...result };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erro desconhecido";
    return { success: false, error: message };
  }
}
