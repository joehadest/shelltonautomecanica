"use client";

import { useSyncExternalStore } from "react";
import type { RealtimeChannel } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";
import { notifyNewAgendamento } from "@/app/admin/push-actions";
import type {
  Agendamento,
  AgendamentoStatus,
  EstatisticaGrupo,
  EstatisticaSite,
  FilaItem,
  FilaStatus,
  FooterConfig,
  Servico,
} from "./types";

const supabase = createClient();

interface DBState {
  servicos: Servico[];
  agendamentos: Agendamento[];
  fila: FilaItem[];
  estatisticas: EstatisticaSite[];
  footer: FooterConfig | null;
}

const EMPTY: DBState = {
  servicos: [],
  agendamentos: [],
  fila: [],
  estatisticas: [],
  footer: null,
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

function logQueryError(label: string, error: { message?: string } | null) {
  if (!error || isMissingTableError(error)) return;
  console.error(`${label}:`, error.message);
}

async function fetchAll() {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  const isAuth = !!session;

  const [servicosRes, filaRes, estatisticasRes, footerRes, agendamentosRes] =
    await Promise.all([
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

  state = {
    servicos: (servicosRes.data as Servico[]) ?? [],
    fila: (filaRes.data as FilaItem[]) ?? [],
    estatisticas: (estatisticasRes.data as EstatisticaSite[]) ?? [],
    footer: isMissingTableError(footerRes.error)
      ? null
      : ((footerRes.data as FooterConfig | null) ?? null),
    agendamentos: (agendamentosRes.data as Agendamento[]) ?? [],
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
      const { data: row, error } = await supabase
        .from("servicos")
        .insert(data)
        .select()
        .single();
      if (error) throw error;
      return row as Servico;
    });
  },
  async update(id: string, patch: Partial<Servico>) {
    return mutate(async () => {
      const { error } = await supabase
        .from("servicos")
        .update(patch)
        .eq("id", id);
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
    data: Omit<Agendamento, "id" | "created_at" | "status">
  ): Promise<Agendamento> {
    return mutate(async () => {
      const { data: row, error } = await supabase
        .from("agendamentos")
        .insert({ ...data, status: "pendente" })
        .select()
        .single();
      if (error) throw error;
      const created = row as Agendamento;
      // Dispara o push para os admins (sem bloquear o cliente).
      void notifyNewAgendamento(created.id).catch(() => {});
      return created;
    });
  },
  async setStatus(id: string, status: AgendamentoStatus) {
    return mutate(async () => {
      const { error } = await supabase
        .from("agendamentos")
        .update({ status })
        .eq("id", id);
      if (error) throw error;
    });
  },
  async aprovar(id: string) {
    return mutate(async () => {
      const agd = state.agendamentos.find((a) => a.id === id);
      if (!agd) throw new Error("Agendamento não encontrado");

      const ativos = getFilaAtiva(state.fila);
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
};

/* ------------------------------- Fila ------------------------------ */

export const filaApi = {
  async setStatus(id: string, status: FilaStatus) {
    return mutate(async () => {
      const { error } = await supabase
        .from("fila_usuarios")
        .update({ status })
        .eq("id", id);
      if (error) throw error;
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
      const { error } = await supabase
        .from("fila_usuarios")
        .update({
          arquivado: true,
          status: "pronto",
          finalizado_em: new Date().toISOString(),
        })
        .eq("id", id);
      if (error) throw error;
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
