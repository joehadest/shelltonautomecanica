"use client";

import { useSyncExternalStore } from "react";
import type { RealtimeChannel } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";
import { computeReleaseAt } from "@/lib/agenda";
import {
  notifyNewAgendamento,
  notifyClientAgendamentoStatus,
  notifyClientFilaStatus,
  notifyClient,
  notifyWaitlistAdvances,
} from "@/app/admin/push-actions";
import { processarVagaLiberada } from "@/app/(public)/agendamento/actions";
import { resolveAgenda } from "@/lib/agenda-defaults";
import type { ClientPushSubscription } from "@/lib/push-client";
import type {
  Agendamento,
  AgendamentoStatus,
  ConfiguracaoAgenda,
  EstatisticaGrupo,
  EstatisticaSite,
  FilaItem,
  FilaStatus,
  FooterConfig,
  Servico,
} from "./types";

const supabase = createClient();

/** Libera a vaga no pátio quando o serviço é marcado como pronto. */
async function releaseAgendaVaga(agendamentoId: string) {
  const { error } = await supabase
    .from("agendamentos")
    .update({ agenda_fim: computeReleaseAt() })
    .eq("id", agendamentoId);
  if (error && !isMissingColumnError(error)) {
    console.error("releaseAgendaVaga:", error.message);
  }
}

/** Libera vaga e puxa o próximo da lista de espera, se houver. */
async function liberarVagaEPromover(agendamentoId?: string | null) {
  if (agendamentoId) await releaseAgendaVaga(agendamentoId);
  void processarVagaLiberada().catch(() => {});
}

interface DBState {
  servicos: Servico[];
  agendamentos: Agendamento[];
  fila: FilaItem[];
  estatisticas: EstatisticaSite[];
  footer: FooterConfig | null;
  agendaConfig: ConfiguracaoAgenda | null;
}

const EMPTY: DBState = {
  servicos: [],
  agendamentos: [],
  fila: [],
  estatisticas: [],
  footer: null,
  agendaConfig: null,
};

let state: DBState = EMPTY;
let loading = true;
let initialized = false;
let realtimeChannel: RealtimeChannel | null = null;
const listeners = new Set<() => void>();

function emitChange() {
  for (const l of listeners) l();
}

let fetchPromise: Promise<void> | null = null;
let refreshTimer: ReturnType<typeof setTimeout> | undefined;
let footerTableMissingWarned = false;

/** Tabela ainda não criada no Supabase (migração pendente). */
function isMissingTableError(error: { message?: string } | null): boolean {
  const msg = error?.message ?? "";
  return (
    msg.includes("Could not find the table") ||
    msg.includes("schema cache")
  );
}

/** Coluna ainda não criada no Supabase (migração pendente). */
function isMissingColumnError(error: { message?: string } | null): boolean {
  const msg = error?.message ?? "";
  return (
    msg.includes("Could not find the") ||
    msg.includes("column") ||
    msg.includes("schema cache")
  );
}

function logQueryError(label: string, error: { message?: string } | null) {
  if (!error || isMissingTableError(error)) return;
  console.error(`${label}:`, error.message);
}

async function fetchAll() {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  const isAuth = !!session;

  const [
    servicosRes,
    filaRes,
    estatisticasRes,
    footerRes,
    agendamentosRes,
    agendaRes,
  ] = await Promise.all([
    supabase.from("servicos").select("*").order("ordem"),
    supabase.from("fila_usuarios").select("*").order("posicao"),
    supabase.from("estatisticas_site").select("*").order("ordem"),
    supabase.from("configuracao_footer").select("*").limit(1).maybeSingle(),
    isAuth
      ? supabase
          .from("agendamentos")
          .select("*")
          .order("created_at", { ascending: false })
      : Promise.resolve({ data: [], error: null }),
    supabase.from("configuracao_agenda").select("*").limit(1).maybeSingle(),
  ]);

  if (servicosRes.error) logQueryError("servicos", servicosRes.error);
  if (filaRes.error) logQueryError("fila", filaRes.error);
  if (estatisticasRes.error) logQueryError("estatisticas", estatisticasRes.error);
  if (footerRes.error) {
    if (
      isMissingTableError(footerRes.error) &&
      !footerTableMissingWarned &&
      process.env.NODE_ENV === "development"
    ) {
      footerTableMissingWarned = true;
      console.warn(
        "[Shellton] Tabela configuracao_footer não encontrada. Execute supabase/migration-footer.sql no SQL Editor do Supabase. Usando valores padrão do rodapé."
      );
    } else {
      logQueryError("footer", footerRes.error);
    }
  }
  if (agendamentosRes.error)
    logQueryError("agendamentos", agendamentosRes.error);
  if (agendaRes.error && !isMissingTableError(agendaRes.error))
    logQueryError("agenda", agendaRes.error);

  state = {
    servicos: (servicosRes.data as Servico[]) ?? [],
    fila: (filaRes.data as FilaItem[]) ?? [],
    estatisticas: (estatisticasRes.data as EstatisticaSite[]) ?? [],
    footer: isMissingTableError(footerRes.error)
      ? null
      : ((footerRes.data as FooterConfig | null) ?? null),
    agendamentos: (agendamentosRes.data as Agendamento[]) ?? [],
    agendaConfig: isMissingTableError(agendaRes.error)
      ? null
      : ((agendaRes.data as ConfiguracaoAgenda | null) ?? null),
  };
  loading = false;
  emitChange();
}

/** Recarrega os dados do banco (deduplica chamadas simultâneas). */
async function refresh(): Promise<void> {
  if (fetchPromise) return fetchPromise;
  fetchPromise = fetchAll().finally(() => {
    fetchPromise = null;
  });
  return fetchPromise;
}

/** Atualiza a UI após mutações, sem depender só do Realtime. */
async function mutate<T>(operation: () => Promise<T>): Promise<T> {
  const result = await operation();
  await refresh();
  return result;
}

function scheduleRefresh() {
  clearTimeout(refreshTimer);
  refreshTimer = setTimeout(() => void refresh(), 150);
}

function setupRealtime() {
  if (realtimeChannel) return;

  realtimeChannel = supabase
    .channel("shellton-db")
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "servicos" },
      scheduleRefresh
    )
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "fila_usuarios" },
      scheduleRefresh
    )
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "estatisticas_site" },
      scheduleRefresh
    )
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "agendamentos" },
      scheduleRefresh
    )
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "configuracao_footer" },
      scheduleRefresh
    )
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "configuracao_agenda" },
      scheduleRefresh
    )
    .subscribe();

  supabase.auth.onAuthStateChange(() => {
    void refresh();
  });
}

function init() {
  if (initialized || typeof window === "undefined") return;
  initialized = true;
  void fetchAll();
  setupRealtime();
}

function subscribe(listener: () => void) {
  init();
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function getSnapshot(): DBState {
  return state;
}

function getServerSnapshot(): DBState {
  return EMPTY;
}

/* ------------------------------ Hooks ------------------------------ */

export function useDB(): DBState {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

export function useDBLoading(): boolean {
  return useSyncExternalStore(
    subscribe,
    () => loading,
    () => true
  );
}

/* ----------------------------- Serviços ---------------------------- */

export const servicosApi = {
  async create(data: Omit<Servico, "id" | "created_at">) {
    return mutate(async () => {
      let { data: row, error } = await supabase
        .from("servicos")
        .insert(data)
        .select()
        .single();
      if (error && isMissingColumnError(error)) {
        const fallback: Record<string, unknown> = { ...data };
        delete fallback.duracao_periodos;
        ({ data: row, error } = await supabase
          .from("servicos")
          .insert(fallback)
          .select()
          .single());
      }
      if (error) throw error;
      return row as Servico;
    });
  },
  async update(id: string, patch: Partial<Servico>) {
    return mutate(async () => {
      let { error } = await supabase
        .from("servicos")
        .update(patch)
        .eq("id", id);
      if (error && isMissingColumnError(error)) {
        const fallback: Record<string, unknown> = { ...patch };
        delete fallback.duracao_periodos;
        ({ error } = await supabase
          .from("servicos")
          .update(fallback)
          .eq("id", id));
      }
      if (error) throw error;
    });
  },
  async remove(id: string) {
    return mutate(async () => {
      const { error } = await supabase.from("servicos").delete().eq("id", id);
      if (error) throw error;
    });
  },
};

/* --------------------------- Agendamentos -------------------------- */

export const agendamentosApi = {
  async create(
    data: Omit<Agendamento, "id" | "created_at" | "status">,
    clientPush?: ClientPushSubscription | null
  ): Promise<Agendamento> {
    return mutate(async () => {
      const payload: Record<string, unknown> = { ...data, status: "pendente" };
      if (clientPush) {
        payload.push_endpoint = clientPush.endpoint;
        payload.push_p256dh = clientPush.p256dh;
        payload.push_auth = clientPush.auth;
      }

      let { data: row, error } = await supabase
        .from("agendamentos")
        .insert(payload)
        .select()
        .single();

      // Fallback: se falhar (ex.: colunas opcionais ainda não migradas no
      // banco), tenta de novo apenas com os campos essenciais para não
      // bloquear o cliente.
      if (error) {
        const fallback = { ...payload };
        for (const col of [
          "periodos",
          "agenda_fim",
          "horario_chegada",
          "push_endpoint",
          "push_p256dh",
          "push_auth",
        ]) {
          delete fallback[col];
        }
        const retry = await supabase
          .from("agendamentos")
          .insert(fallback)
          .select()
          .single();
        row = retry.data;
        error = retry.error;
      }

      if (error) throw error;
      const created = row as Agendamento;
      // Dispara o push para os admins (sem bloquear o cliente).
      void notifyNewAgendamento(created.id).catch(() => {});
      return created;
    });
  },
  async setStatus(id: string, status: AgendamentoStatus) {
    return mutate(async () => {
      const prev = state.agendamentos.find((a) => a.id === id);
      const { error } = await supabase
        .from("agendamentos")
        .update({ status })
        .eq("id", id);
      if (error) throw error;

      if (status === "recusado" && prev?.status === "em_espera") {
        void notifyClient(id, {
          kind: "agendamento_recusado",
          fromEspera: true,
        }).catch(() => {});
        void notifyWaitlistAdvances().catch(() => {});
      } else {
        void notifyClientAgendamentoStatus(id, status, {
          fromEspera: prev?.status === "em_espera",
          posicao: prev?.posicao_espera ?? undefined,
        }).catch(() => {});
      }
    });
  },
  async aprovar(id: string) {
    return mutate(async () => {
      const agd = state.agendamentos.find((a) => a.id === id);
      if (!agd) throw new Error("Agendamento não encontrado");

      const ativos = getFilaAtiva(state.fila);
      const capacidade = resolveAgenda(state.agendaConfig).capacidade;
      if (ativos.length >= capacidade) {
        throw new Error(
          `Pátio lotado (${capacidade} vagas). Finalize um serviço ou promova da lista de espera.`
        );
      }

      const posicao = ativos.length + 1;

      const { error: errAgd } = await supabase
        .from("agendamentos")
        .update({ status: "aprovado" })
        .eq("id", id);
      if (errAgd) throw errAgd;

      const { error: errFila } = await supabase.from("fila_usuarios").insert({
        cliente_nome: agd.cliente_nome,
        telefone: agd.telefone,
        placa: agd.placa,
        modelo: agd.modelo,
        servico_nome: agd.servico_nome,
        status: "na_fila",
        posicao,
        agendamento_id: agd.id,
        arquivado: false,
      });
      if (errFila) throw errFila;
      void notifyClient(agd.id, { kind: "agendamento_aprovado" }).catch(() => {});
    });
  },
  async remove(id: string) {
    return mutate(async () => {
      const { error } = await supabase
        .from("agendamentos")
        .delete()
        .eq("id", id);
      if (error) throw error;
    });
  },
  async moveEspera(id: string, direction: "up" | "down") {
    return mutate(async () => {
      const lista = getListaEspera(state.agendamentos);
      const idx = lista.findIndex((a) => a.id === id);
      if (idx === -1) return;
      const swapWith = direction === "up" ? idx - 1 : idx + 1;
      if (swapWith < 0 || swapWith >= lista.length) return;

      const a = lista[idx];
      const b = lista[swapWith];
      const posA = a.posicao_espera ?? idx + 1;
      const posB = b.posicao_espera ?? swapWith + 1;

      const [resA, resB] = await Promise.all([
        supabase
          .from("agendamentos")
          .update({ posicao_espera: posB })
          .eq("id", a.id),
        supabase
          .from("agendamentos")
          .update({ posicao_espera: posA })
          .eq("id", b.id),
      ]);
      if (resA.error) throw resA.error;
      if (resB.error) throw resB.error;
    });
  },
  async promoverEspera(id: string) {
    return mutate(async () => {
      const ativos = getFilaAtiva(state.fila);
      const capacidade = resolveAgenda(state.agendaConfig).capacidade;
      if (ativos.length >= capacidade) {
        throw new Error("Não há vaga livre no pátio.");
      }
      const agd = state.agendamentos.find((a) => a.id === id);
      if (!agd || agd.status !== "em_espera") {
        throw new Error("Registro não está na lista de espera.");
      }

      const now = new Date().toISOString();
      const { error: errAgd } = await supabase
        .from("agendamentos")
        .update({
          status: "aprovado",
          data_hora: now,
          agenda_fim: null,
          posicao_espera: null,
        })
        .eq("id", id);
      if (errAgd) throw errAgd;

      const { error: errFila } = await supabase.from("fila_usuarios").insert({
        cliente_nome: agd.cliente_nome,
        telefone: agd.telefone,
        placa: agd.placa,
        modelo: agd.modelo,
        servico_nome: agd.servico_nome,
        status: "na_fila",
        posicao: ativos.length + 1,
        agendamento_id: agd.id,
        arquivado: false,
      });
      if (errFila) throw errFila;
      void notifyClient(agd.id, { kind: "promovido_da_espera" }).catch(() => {});
      void notifyWaitlistAdvances().catch(() => {});
    });
  },
};

export const filaApi = {
  async setStatus(id: string, status: FilaStatus) {
    return mutate(async () => {
      const item = state.fila.find((f) => f.id === id);
      const { error } = await supabase
        .from("fila_usuarios")
        .update({ status })
        .eq("id", id);
      if (error) throw error;
      if (item?.agendamento_id && status === "pronto") {
        void notifyClientFilaStatus(item.agendamento_id, status).catch(() => {});
        await liberarVagaEPromover(item.agendamento_id);
      } else if (item?.agendamento_id) {
        void notifyClientFilaStatus(item.agendamento_id, status).catch(() => {});
      }
    });
  },
  async move(id: string, direction: "up" | "down") {
    return mutate(async () => {
      const ativos = getFilaAtiva(state.fila);
      const idx = ativos.findIndex((f) => f.id === id);
      if (idx === -1) return;
      const swapWith = direction === "up" ? idx - 1 : idx + 1;
      if (swapWith < 0 || swapWith >= ativos.length) return;

      const a = ativos[idx];
      const b = ativos[swapWith];

      const [resA, resB] = await Promise.all([
        supabase
          .from("fila_usuarios")
          .update({ posicao: b.posicao })
          .eq("id", a.id),
        supabase
          .from("fila_usuarios")
          .update({ posicao: a.posicao })
          .eq("id", b.id),
      ]);
      if (resA.error) throw resA.error;
      if (resB.error) throw resB.error;
    });
  },
  async finalizar(id: string) {
    return mutate(async () => {
      const item = state.fila.find((f) => f.id === id);
      const { error } = await supabase
        .from("fila_usuarios")
        .update({
          arquivado: true,
          status: "pronto",
          finalizado_em: new Date().toISOString(),
        })
        .eq("id", id);
      if (error) throw error;
      if (item?.agendamento_id) {
        void notifyClientFilaStatus(item.agendamento_id, "pronto").catch(() => {});
        await liberarVagaEPromover(item.agendamento_id);
      }
    });
  },
  async remove(id: string) {
    return mutate(async () => {
      const { error } = await supabase
        .from("fila_usuarios")
        .delete()
        .eq("id", id);
      if (error) throw error;
    });
  },
  async add(
    data: Omit<FilaItem, "id" | "created_at" | "posicao" | "arquivado">
  ) {
    return mutate(async () => {
      const ativos = getFilaAtiva(state.fila);
      const { error } = await supabase.from("fila_usuarios").insert({
        ...data,
        posicao: ativos.length + 1,
        arquivado: false,
      });
      if (error) throw error;
    });
  },
};

/* ----------------------------- Seletores --------------------------- */

export function getFilaAtiva(fila: FilaItem[]): FilaItem[] {
  return fila
    .filter((f) => !f.arquivado)
    .sort((a, b) => a.posicao - b.posicao);
}

export function getHistorico(fila: FilaItem[]): FilaItem[] {
  return fila
    .filter((f) => f.arquivado)
    .sort(
      (a, b) =>
        new Date(b.finalizado_em ?? 0).getTime() -
        new Date(a.finalizado_em ?? 0).getTime()
    );
}

export function getListaEspera(agendamentos: Agendamento[]): Agendamento[] {
  return agendamentos
    .filter((a) => a.status === "em_espera")
    .sort(
      (a, b) =>
        (a.posicao_espera ?? 999) - (b.posicao_espera ?? 999) ||
        new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    );
}

export function getServicosAtivos(servicos: Servico[]): Servico[] {
  return [...servicos]
    .filter((s) => s.ativo)
    .sort((a, b) => a.ordem - b.ordem);
}

export function getEstatisticasPorGrupo(
  estatisticas: EstatisticaSite[],
  grupo: EstatisticaGrupo
): EstatisticaSite[] {
  return [...estatisticas]
    .filter((e) => e.grupo === grupo)
    .sort((a, b) => a.ordem - b.ordem);
}

/* --------------------------- Estatísticas -------------------------- */

export const estatisticasApi = {
  async update(
    id: string,
    patch: Partial<Pick<EstatisticaSite, "valor" | "rotulo">>
  ) {
    return mutate(async () => {
      const { error } = await supabase
        .from("estatisticas_site")
        .update(patch)
        .eq("id", id);
      if (error) throw error;
    });
  },
};

/* ----------------------------- Agenda ------------------------------ */

export const agendaApi = {
  async update(
    patch: Partial<Omit<ConfiguracaoAgenda, "id" | "updated_at">>
  ) {
    return mutate(async () => {
      const current = state.agendaConfig;
      if (current) {
        const { error } = await supabase
          .from("configuracao_agenda")
          .update({ ...patch, updated_at: new Date().toISOString() })
          .eq("id", current.id);
        if (isMissingTableError(error)) {
          throw new Error(
            "Execute o arquivo supabase/agenda-config.sql no SQL Editor do Supabase."
          );
        }
        if (error) throw error;
        return;
      }
      const { error } = await supabase
        .from("configuracao_agenda")
        .insert({ ...patch });
      if (isMissingTableError(error)) {
        throw new Error(
          "Execute o arquivo supabase/agenda-config.sql no SQL Editor do Supabase."
        );
      }
      if (error) throw error;
    });
  },
};

/* ----------------------------- Rodapé ------------------------------ */

export const footerApi = {
  async update(
    patch: Partial<
      Pick<
        FooterConfig,
        | "slogan"
        | "endereco"
        | "telefone"
        | "horario"
        | "instagram"
        | "instagram_url"
        | "tagline"
      >
    >
  ) {
    return mutate(async () => {
      const current = state.footer;
      if (current) {
        const { error } = await supabase
          .from("configuracao_footer")
          .update({ ...patch, updated_at: new Date().toISOString() })
          .eq("id", current.id);
        if (isMissingTableError(error)) {
          throw new Error(
            "Execute o arquivo supabase/migration-footer.sql no SQL Editor do Supabase."
          );
        }
        if (error) throw error;
        return;
      }
      const { error } = await supabase.from("configuracao_footer").insert({
        ...patch,
      });
      if (isMissingTableError(error)) {
        throw new Error(
          "Execute o arquivo supabase/migration-footer.sql no SQL Editor do Supabase."
        );
      }
      if (error) throw error;
    });
  },
};
