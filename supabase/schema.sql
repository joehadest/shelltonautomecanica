-- ============================================================
-- Shellton Auto Mecânica — Schema do banco (Supabase / Postgres)
-- Execute no SQL Editor do Supabase quando for configurar o banco.
-- ============================================================

-- Extensão para gen_random_uuid()
create extension if not exists "pgcrypto";

-- ----------------------------- ENUMS -----------------------------
do $$ begin
  create type agendamento_status as enum ('pendente', 'aprovado', 'recusado');
exception when duplicate_object then null; end $$;

do $$ begin
  create type fila_status as enum ('na_fila', 'em_manutencao', 'pronto');
exception when duplicate_object then null; end $$;

-- ---------------------------- SERVIÇOS ---------------------------
create table if not exists public.servicos (
  id          uuid primary key default gen_random_uuid(),
  titulo      text not null,
  descricao   text not null,
  icone       text not null default 'Wrench',
  ordem       integer not null default 1,
  ativo       boolean not null default true,
  created_at  timestamptz not null default now()
);

-- ------------------------ ESTATÍSTICAS SITE ----------------------
do $$ begin
  create type estatistica_grupo as enum ('hero', 'sobre');
exception when duplicate_object then null; end $$;

create table if not exists public.estatisticas_site (
  id      uuid primary key default gen_random_uuid(),
  grupo   estatistica_grupo not null,
  valor   text not null,
  rotulo  text not null,
  ordem   integer not null default 1
);

-- ------------------------ CONFIGURAÇÃO RODAPÉ --------------------
create table if not exists public.configuracao_footer (
  id             uuid primary key default gen_random_uuid(),
  slogan         text not null,
  endereco       text not null,
  telefone       text not null,
  horario        text not null,
  instagram      text not null,
  instagram_url  text not null default '',
  tagline        text not null,
  updated_at     timestamptz not null default now()
);

-- -------------------------- AGENDAMENTOS -------------------------
create table if not exists public.agendamentos (
  id            uuid primary key default gen_random_uuid(),
  cliente_nome  text not null,
  telefone      text not null,
  placa         text not null,
  modelo        text not null,
  servico_nome  text not null,
  data_hora     timestamptz not null,
  observacoes   text,
  status        agendamento_status not null default 'pendente',
  created_at    timestamptz not null default now()
);

-- ------------------------------ FILA -----------------------------
create table if not exists public.fila_usuarios (
  id              uuid primary key default gen_random_uuid(),
  cliente_nome    text not null,
  telefone        text not null,
  placa           text not null,
  modelo          text not null,
  servico_nome    text not null,
  status          fila_status not null default 'na_fila',
  posicao         integer not null default 1,
  agendamento_id  uuid references public.agendamentos(id) on delete set null,
  arquivado       boolean not null default false,
  finalizado_em   timestamptz,
  created_at      timestamptz not null default now()
);

-- --------------------------- ÍNDICES -----------------------------
create index if not exists idx_fila_posicao on public.fila_usuarios (posicao);
create index if not exists idx_fila_arquivado on public.fila_usuarios (arquivado);
create index if not exists idx_agendamentos_status on public.agendamentos (status);
create index if not exists idx_servicos_ordem on public.servicos (ordem);
create index if not exists idx_estatisticas_grupo on public.estatisticas_site (grupo, ordem);

-- ============================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================
alter table public.servicos           enable row level security;
alter table public.agendamentos       enable row level security;
alter table public.fila_usuarios      enable row level security;
alter table public.estatisticas_site  enable row level security;
alter table public.configuracao_footer enable row level security;

-- Leitura pública (site): serviços ativos e fila são visíveis a todos.
create policy "servicos_public_read"
  on public.servicos for select
  using (true);

create policy "fila_public_read"
  on public.fila_usuarios for select
  using (true);

create policy "estatisticas_public_read"
  on public.estatisticas_site for select
  using (true);

create policy "footer_public_read"
  on public.configuracao_footer for select
  using (true);

-- Qualquer visitante pode criar um agendamento (status sempre 'pendente').
create policy "agendamentos_public_insert"
  on public.agendamentos for insert
  with check (status = 'pendente');

-- Administrador autenticado tem acesso total.
create policy "servicos_admin_all"
  on public.servicos for all
  using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');

create policy "agendamentos_admin_all"
  on public.agendamentos for all
  using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');

create policy "fila_admin_all"
  on public.fila_usuarios for all
  using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');

create policy "estatisticas_admin_all"
  on public.estatisticas_site for all
  using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');

create policy "footer_admin_all"
  on public.configuracao_footer for all
  using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');

-- ============================================================
-- REALTIME: habilite as tabelas em Database > Replication no painel,
-- ou via:
-- alter publication supabase_realtime add table public.fila_usuarios;
-- alter publication supabase_realtime add table public.agendamentos;
-- ============================================================
