"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { sendPushToAll } from "@/lib/push-server";

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
