import { createAdminClient } from "@/lib/supabase/admin";
import { notifyClient, notifyWaitlistAdvances } from "@/app/admin/push-actions";
import { DEFAULT_AGENDA } from "@/lib/agenda-defaults";
import type { ConfiguracaoAgenda } from "@/lib/types";

export interface CapacityStatus {
  capacidade: number;
  ativos: number;
  vagasLivres: number;
  lotado: boolean;
  listaEspera: number;
}

async function loadAgendaConfig(
  supabase: ReturnType<typeof createAdminClient>
): Promise<ConfiguracaoAgenda> {
  const { data } = await supabase
    .from("configuracao_agenda")
    .select("*")
    .limit(1)
    .maybeSingle();
  if (data) return data as ConfiguracaoAgenda;
  return {
    id: "default",
    ...DEFAULT_AGENDA,
    updated_at: new Date().toISOString(),
  };
}

/** Carros atualmente na oficina (fila ativa, não arquivada). */
export async function countActiveVehicles(
  supabase: ReturnType<typeof createAdminClient>
): Promise<number> {
  const { count, error } = await supabase
    .from("fila_usuarios")
    .select("id", { count: "exact", head: true })
    .eq("arquivado", false);
  if (error) {
    console.error("countActiveVehicles:", error.message);
    return 0;
  }
  return count ?? 0;
}

export async function getCapacityStatus(): Promise<CapacityStatus> {
  const supabase = createAdminClient();
  const config = await loadAgendaConfig(supabase);
  const ativos = await countActiveVehicles(supabase);

  const { count: listaEspera } = await supabase
    .from("agendamentos")
    .select("id", { count: "exact", head: true })
    .eq("status", "em_espera");

  const capacidade = Math.max(1, config.capacidade);
  const vagasLivres = Math.max(0, capacidade - ativos);

  return {
    capacidade,
    ativos,
    vagasLivres,
    lotado: vagasLivres <= 0,
    listaEspera: listaEspera ?? 0,
  };
}

async function nextEsperaPosition(
  supabase: ReturnType<typeof createAdminClient>
): Promise<number> {
  const { data } = await supabase
    .from("agendamentos")
    .select("posicao_espera")
    .eq("status", "em_espera")
    .order("posicao_espera", { ascending: false })
    .limit(1)
    .maybeSingle();
  return (data?.posicao_espera ?? 0) + 1;
}

/**
 * Promove o próximo da lista de espera para atendimento ativo,
 * enquanto houver vaga no pátio. Retorna quantos foram promovidos.
 */
export async function promoteNextFromWaitlist(): Promise<number> {
  const supabase = createAdminClient();
  const config = await loadAgendaConfig(supabase);
  const capacidade = Math.max(1, config.capacidade);
  let promoted = 0;

  while ((await countActiveVehicles(supabase)) < capacidade) {
    const { data: next, error } = await supabase
      .from("agendamentos")
      .select("*")
      .eq("status", "em_espera")
      .order("posicao_espera", { ascending: true })
      .limit(1)
      .maybeSingle();

    if (error || !next) break;

    const now = new Date().toISOString();

    const { error: errAgd } = await supabase
      .from("agendamentos")
      .update({
        status: "aprovado",
        data_hora: now,
        agenda_fim: null,
        posicao_espera: null,
      })
      .eq("id", next.id);
    if (errAgd) {
      console.error("promoteNextFromWaitlist update:", errAgd.message);
      break;
    }

    const { count: filaCount } = await supabase
      .from("fila_usuarios")
      .select("id", { count: "exact", head: true })
      .eq("arquivado", false);

    const { error: errFila } = await supabase.from("fila_usuarios").insert({
      cliente_nome: next.cliente_nome,
      telefone: next.telefone,
      placa: next.placa ?? "",
      modelo: next.modelo,
      servico_nome: next.servico_nome,
      status: "na_fila",
      posicao: (filaCount ?? 0) + 1,
      agendamento_id: next.id,
      arquivado: false,
    });
    if (errFila) {
      console.error("promoteNextFromWaitlist fila:", errFila.message);
      break;
    }

    void notifyClient(next.id, { kind: "promovido_da_espera" }).catch(() => {});
    promoted++;
  }

  if (promoted > 0) {
    void notifyWaitlistAdvances().catch(() => {});
  }

  return promoted;
}

export { nextEsperaPosition };
