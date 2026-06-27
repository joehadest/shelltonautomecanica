/**
 * Tipos de domínio da Shellton Auto Mecânica.
 * Espelham os schemas previstos no Supabase (ver supabase/schema.sql).
 */

export type AgendamentoStatus = "pendente" | "aprovado" | "recusado";

export type FilaStatus = "na_fila" | "em_manutencao" | "pronto";

export type EstatisticaGrupo = "hero" | "sobre";

/** Números e destaques exibidos na página inicial (editáveis pelo admin). */
export interface EstatisticaSite {
  id: string;
  grupo: EstatisticaGrupo;
  valor: string;
  rotulo: string;
  ordem: number;
}

export interface FooterConfig {
  id: string;
  slogan: string;
  endereco: string;
  telefone: string;
  horario: string;
  instagram: string;
  instagram_url: string;
  tagline: string;
  updated_at: string;
}

export interface Servico {
  id: string;
  titulo: string;
  descricao: string;
  /** Nome do ícone da biblioteca lucide-react (ex.: "Wrench"). */
  icone: string;
  ordem: number;
  ativo: boolean;
  created_at: string;
}

export interface Agendamento {
  id: string;
  cliente_nome: string;
  telefone: string;
  placa: string;
  modelo: string;
  servico_nome: string;
  data_hora: string; // ISO
  observacoes?: string;
  status: AgendamentoStatus;
  created_at: string;
}

export interface FilaItem {
  id: string;
  cliente_nome: string;
  telefone: string;
  placa: string;
  modelo: string;
  servico_nome: string;
  status: FilaStatus;
  posicao: number;
  agendamento_id?: string;
  created_at: string;
  finalizado_em?: string | null;
  /** true quando removido da fila ativa (histórico). */
  arquivado: boolean;
}

export const FILA_STATUS_LABEL: Record<FilaStatus, string> = {
  na_fila: "Na fila",
  em_manutencao: "Em manutenção",
  pronto: "Pronto para retirada",
};

export const AGENDAMENTO_STATUS_LABEL: Record<AgendamentoStatus, string> = {
  pendente: "Pendente",
  aprovado: "Aprovado",
  recusado: "Recusado",
};
