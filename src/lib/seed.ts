import type { Agendamento, EstatisticaSite, FilaItem, Servico } from "./types";

/** Dados iniciais de demonstração (substituídos pelo Supabase futuramente). */

export const SEED_ESTATISTICAS: EstatisticaSite[] = [
  {
    id: "stat-1",
    grupo: "hero",
    valor: "+15",
    rotulo: "Anos de estrada",
    ordem: 1,
  },
  {
    id: "stat-2",
    grupo: "hero",
    valor: "+8 mil",
    rotulo: "Carros atendidos",
    ordem: 2,
  },
  {
    id: "stat-3",
    grupo: "hero",
    valor: "4.9★",
    rotulo: "Avaliação média",
    ordem: 3,
  },
  {
    id: "stat-4",
    grupo: "hero",
    valor: "100%",
    rotulo: "Garantia no serviço",
    ordem: 4,
  },
  {
    id: "stat-5",
    grupo: "sobre",
    valor: "+8.000",
    rotulo: "clientes satisfeitos",
    ordem: 1,
  },
];

export const SEED_SERVICOS: Servico[] = [
  {
    id: "srv-0",
    titulo: "Avaliação",
    descricao:
      "Não sabe qual o defeito? Fazemos uma avaliação completa do veículo para identificar o problema antes de qualquer reparo.",
    icone: "ClipboardCheck",
    ordem: 0,
    ativo: true,
    duracao_periodos: 1,
    created_at: new Date().toISOString(),
  },
  {
    id: "srv-1",
    titulo: "Troca de Óleo",
    descricao:
      "Troca de óleo e filtros com produtos de alta performance e checklist completo.",
    icone: "Droplet",
    ordem: 1,
    ativo: true,
    duracao_periodos: 1,
    created_at: new Date().toISOString(),
  },
  {
    id: "srv-2",
    titulo: "Alinhamento e Balanceamento",
    descricao:
      "Geometria computadorizada para mais segurança, conforto e economia de pneus.",
    icone: "Gauge",
    ordem: 2,
    ativo: true,
    duracao_periodos: 1,
    created_at: new Date().toISOString(),
  },
  {
    id: "srv-3",
    titulo: "Motor e Injeção",
    descricao:
      "Diagnóstico eletrônico, revisão e retífica de motor com peças garantidas.",
    icone: "Cog",
    ordem: 3,
    ativo: true,
    duracao_periodos: 10,
    created_at: new Date().toISOString(),
  },
  {
    id: "srv-4",
    titulo: "Parte Elétrica",
    descricao:
      "Reparo de injeção, baterias, alternadores e sistemas elétricos em geral.",
    icone: "Zap",
    ordem: 4,
    ativo: true,
    duracao_periodos: 2,
    created_at: new Date().toISOString(),
  },
  {
    id: "srv-5",
    titulo: "Freios",
    descricao:
      "Pastilhas, discos, fluido e sistema ABS revisados para sua segurança.",
    icone: "Disc3",
    ordem: 5,
    ativo: true,
    duracao_periodos: 1,
    created_at: new Date().toISOString(),
  },
  {
    id: "srv-6",
    titulo: "Suspensão",
    descricao:
      "Amortecedores, molas, bandejas e buchas para uma direção firme e estável.",
    icone: "CarFront",
    ordem: 6,
    ativo: true,
    duracao_periodos: 2,
    created_at: new Date().toISOString(),
  },
];

export const SEED_AGENDAMENTOS: Agendamento[] = [
  {
    id: "agd-1",
    cliente_nome: "Carlos Eduardo Souza",
    telefone: "(11) 98888-1234",
    placa: "RTA4F21",
    modelo: "VW Golf GTI",
    servico_nome: "Motor e Injeção",
    data_hora: new Date(Date.now() + 86400000).toISOString(),
    observacoes: "Motor falhando em marcha lenta.",
    status: "pendente",
    created_at: new Date().toISOString(),
  },
  {
    id: "agd-2",
    cliente_nome: "Mariana Lopes",
    telefone: "(11) 97777-5678",
    placa: "FQX2B88",
    modelo: "Hyundai HB20",
    servico_nome: "Troca de Óleo",
    data_hora: new Date(Date.now() + 172800000).toISOString(),
    status: "pendente",
    created_at: new Date().toISOString(),
  },
];

export const SEED_FILA: FilaItem[] = [
  {
    id: "fila-1",
    cliente_nome: "João Marcos Pereira",
    telefone: "(11) 96666-0001",
    placa: "ABC1D23",
    modelo: "Toyota Corolla",
    servico_nome: "Alinhamento e Balanceamento",
    status: "em_manutencao",
    posicao: 1,
    created_at: new Date().toISOString(),
    arquivado: false,
  },
  {
    id: "fila-2",
    cliente_nome: "Fernanda Alves",
    telefone: "(11) 95555-0002",
    placa: "DEF4G56",
    modelo: "Fiat Uno",
    servico_nome: "Freios",
    status: "na_fila",
    posicao: 2,
    created_at: new Date().toISOString(),
    arquivado: false,
  },
  {
    id: "fila-3",
    cliente_nome: "Roberto Nunes",
    telefone: "(11) 94444-0003",
    placa: "GHI7J89",
    modelo: "Honda Civic",
    servico_nome: "Parte Elétrica",
    status: "pronto",
    posicao: 3,
    created_at: new Date().toISOString(),
    arquivado: false,
  },
];
