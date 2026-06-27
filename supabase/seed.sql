-- Dados iniciais da Shellton Auto Mecânica
-- Execute no SQL Editor do Supabase após rodar schema.sql

do $$
begin
  if not exists (select 1 from public.servicos limit 1) then
    insert into public.servicos (titulo, descricao, icone, ordem, ativo) values
      ('Avaliação', 'Não sabe qual o defeito? Fazemos uma avaliação completa do veículo para identificar o problema antes de qualquer reparo.', 'ClipboardCheck', 0, true),
      ('Troca de Óleo', 'Troca de óleo e filtros com produtos de alta performance e checklist completo.', 'Droplet', 1, true),
      ('Alinhamento e Balanceamento', 'Geometria computadorizada para mais segurança, conforto e economia de pneus.', 'Gauge', 2, true),
      ('Motor e Injeção', 'Diagnóstico eletrônico, revisão e retífica de motor com peças garantidas.', 'Cog', 3, true),
      ('Parte Elétrica', 'Reparo de injeção, baterias, alternadores e sistemas elétricos em geral.', 'Zap', 4, true),
      ('Freios', 'Pastilhas, discos, fluido e sistema ABS revisados para sua segurança.', 'Disc3', 5, true),
      ('Suspensão', 'Amortecedores, molas, bandejas e buchas para uma direção firme e estável.', 'CarFront', 6, true);
  end if;

  if not exists (select 1 from public.estatisticas_site limit 1) then
    insert into public.estatisticas_site (grupo, valor, rotulo, ordem) values
      ('hero', '+15', 'Anos de estrada', 1),
      ('hero', '+8 mil', 'Carros atendidos', 2),
      ('hero', '4.9★', 'Avaliação média', 3),
      ('hero', '100%', 'Garantia no serviço', 4),
      ('sobre', '+8.000', 'clientes satisfeitos', 1);
  end if;
end $$;

-- Rodapé do site
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

-- Realtime: habilite no painel (Database > Replication) ou execute:
-- alter publication supabase_realtime add table public.fila_usuarios;
-- alter publication supabase_realtime add table public.agendamentos;
-- alter publication supabase_realtime add table public.servicos;
-- alter publication supabase_realtime add table public.estatisticas_site;
