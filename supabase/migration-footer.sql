-- Migração: adiciona tabela de configuração do rodapé
-- Execute no SQL Editor se o schema já foi criado antes desta atualização.

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

alter table public.configuracao_footer enable row level security;

do $$ begin
  create policy "footer_public_read"
    on public.configuracao_footer for select
    using (true);
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "footer_admin_all"
    on public.configuracao_footer for all
    using (auth.role() = 'authenticated')
    with check (auth.role() = 'authenticated');
exception when duplicate_object then null; end $$;

do $$
begin
  if not exists (select 1 from public.configuracao_footer limit 1) then
    insert into public.configuracao_footer (
      slogan, endereco, telefone, horario, instagram, instagram_url, tagline
    ) values (
      'Cuidando do seu carro com a precisão e a confiança que ele merece.',
      'Av. das Oficinas, 1234 — São Paulo, SP',
      '(11) 99999-0000',
      'Seg a Sex: 8h–18h · Sáb: 8h–12h',
      '@shelltonautomecanica',
      'https://instagram.com/shelltonautomecanica',
      'Feito com dedicação para quem ama dirigir.'
    );
  end if;
end $$;
