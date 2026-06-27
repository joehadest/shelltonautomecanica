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

export interface ConfiguracaoAgenda {
  id: string;
  /** Vagas no pátio: carros que podem ficar ao mesmo tempo na oficina. */
  capacidade: number;
  /** Entradas por período (gargalo do elevador): novos carros por manhã/tarde. */
  entradas_por_periodo: number;
  manha_inicio: string; // "07:30"
  manha_fim: string; // "11:00"
  tarde_inicio: string; // "13:30"
  tarde_fim: string; // "17:00"
  /** Quantas semanas à frente ficam abertas para agendar. */
  semanas: number;
  /** Dias da semana abertos (0=domingo ... 6=sábado). */
  dias_semana: number[];
  updated_at: string;
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
  /** Quantos períodos (manhã/tarde) o serviço ocupa uma vaga. */
  duracao_periodos: number;
  created_at: string;
}

export interface Agendamento {
  id: string;
  cliente_nome: string;
  telefone: string;
  placa: string;
  modelo: string;
  servico_nome: string;
  data_hora: string; // ISO — início do período reservado (manhã/tarde)
  /** Horário informado pelo cliente para deixar o carro (ex.: "08:30"). */
  horario_chegada?: string | null;
  observacoes?: string;
  status: AgendamentoStatus;
  created_at: string;
  /** Duração reservada, em períodos, e fim (exclusivo) da ocupação da vaga. */
  periodos?: number | null;
  agenda_fim?: string | null;
  /** Inscrição push do cliente (preenchida só se ele ativar avisos). */
  push_endpoint?: string | null;
  push_p256dh?: string | null;
  push_auth?: string | null;
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
