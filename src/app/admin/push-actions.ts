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

/** Eventos de notificação enviados ao cliente. */
export type ClientNotifyEvent =
  | { kind: "pedido_recebido" }
  | { kind: "lista_espera_entrada"; posicao: number }
  | { kind: "lista_espera_avancou"; posicao: number }
  | { kind: "agendamento_aprovado" }
  | { kind: "promovido_da_espera" }
  | { kind: "agendamento_recusado"; fromEspera?: boolean }
  | { kind: "fila_em_manutencao" }
  | { kind: "fila_pronto" };

function clientPayload(event: ClientNotifyEvent): {
  title: string;
  body: string;
  url: string;
  tag: string;
} {
  switch (event.kind) {
    case "pedido_recebido":
      return {
        title: "Pedido recebido! 📋",
        body: "Registramos sua solicitação. Avisaremos assim que a equipe analisar.",
        url: "/fila",
        tag: "shellton-cliente",
      };
    case "lista_espera_entrada":
      return {
        title: "Você entrou na lista de espera ⏳",
        body: `Posição ${event.posicao} na fila. Avisaremos quando uma vaga no pátio liberar.`,
        url: "/fila",
        tag: "shellton-cliente-espera",
      };
    case "lista_espera_avancou":
      return {
        title: "Sua posição na espera mudou 📈",
        body: `Você agora está na posição ${event.posicao}. Estamos chegando na sua vez!`,
        url: "/fila",
        tag: "shellton-cliente-espera",
      };
    case "agendamento_aprovado":
      return {
        title: "Pedido aprovado! ✅",
        body: "Seu agendamento foi confirmado e seu veículo entrou na fila de atendimento.",
        url: "/fila",
        tag: "shellton-cliente",
      };
    case "promovido_da_espera":
      return {
        title: "Sua vaga foi liberada! 🎉",
        body: "Saiu da lista de espera e entrou no atendimento. Acompanhe o status por aqui.",
        url: "/fila",
        tag: "shellton-cliente",
      };
    case "agendamento_recusado":
      return event.fromEspera
        ? {
            title: "Removido da lista de espera",
            body: "Seu registro saiu da fila. Fale com a oficina se quiser reagendar.",
            url: "/agendamento",
            tag: "shellton-cliente",
          }
        : {
            title: "Sobre o seu agendamento",
            body: "Não foi possível confirmar seu pedido. Fale com a oficina para mais detalhes.",
            url: "/agendamento",
            tag: "shellton-cliente",
          };
    case "fila_em_manutencao":
      return {
        title: "Seu carro entrou em manutenção 🔧",
        body: "Nossa equipe já está cuidando do seu veículo.",
        url: "/fila",
        tag: "shellton-cliente",
      };
    case "fila_pronto":
      return {
        title: "Seu carro está pronto! 🎉",
        body: "O serviço foi concluído. Você já pode retirar na oficina.",
        url: "/fila",
        tag: "shellton-cliente",
      };
  }
}

/** Envia push ao cliente conforme o evento do fluxo de agendamento/fila. */
export async function notifyClient(
  agendamentoId: string,
  event: ClientNotifyEvent
) {
  if (!agendamentoId) return { success: false, error: "id ausente" };
  try {
    const sub = await getClientSubscription(agendamentoId);
    if (!sub) return { success: true, skipped: true };

    const ok = await sendPushToSubscription(sub, clientPayload(event));
    return { success: ok };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erro desconhecido";
    console.error("notifyClient:", message);
    return { success: false, error: message };
  }
}

/** Avisa quem ainda está na espera após uma promoção ou remoção. */
export async function notifyWaitlistAdvances() {
  try {
    const supabase = createAdminClient();
    const { data: lista, error } = await supabase
      .from("agendamentos")
      .select("id")
      .eq("status", "em_espera")
      .order("posicao_espera", { ascending: true })
      .order("created_at", { ascending: true });

    if (error || !lista?.length) return { success: true, notified: 0 };

    await Promise.all(
      lista.map((item, index) =>
        notifyClient(item.id, {
          kind: "lista_espera_avancou",
          posicao: index + 1,
        })
      )
    );
    return { success: true, notified: lista.length };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erro desconhecido";
    console.error("notifyWaitlistAdvances:", message);
    return { success: false, error: message };
  }
}

/**
 * Avisa o cliente quando o status do agendamento muda.
 * @deprecated Prefira notifyClient com o evento específico.
 */
export async function notifyClientAgendamentoStatus(
  agendamentoId: string,
  status: AgendamentoStatus,
  context?: { fromEspera?: boolean; posicao?: number }
) {
  if (status === "pendente") return { success: false, error: "sem aviso" };

  if (status === "aprovado") {
    return notifyClient(
      agendamentoId,
      context?.fromEspera
        ? { kind: "promovido_da_espera" }
        : { kind: "agendamento_aprovado" }
    );
  }
  if (status === "recusado") {
    return notifyClient(agendamentoId, {
      kind: "agendamento_recusado",
      fromEspera: context?.fromEspera,
    });
  }
  if (status === "em_espera") {
    return notifyClient(agendamentoId, {
      kind: "lista_espera_entrada",
      posicao: context?.posicao ?? 0,
    });
  }
  return { success: false, error: "status desconhecido" };
}

/**
 * Avisa o cliente quando o status do serviço dele na fila muda.
 */
export async function notifyClientFilaStatus(
  agendamentoId: string,
  status: FilaStatus
) {
  if (!agendamentoId) return { success: false, error: "id ausente" };
  if (status === "na_fila") return { success: false, error: "sem aviso" };

  return notifyClient(
    agendamentoId,
    status === "em_manutencao"
      ? { kind: "fila_em_manutencao" }
      : { kind: "fila_pronto" }
  );
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
