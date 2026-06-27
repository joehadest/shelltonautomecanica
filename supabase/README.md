# Banco de dados — Supabase

Scripts SQL para configurar o Postgres do projeto **Shellton Auto Mecânica**.

## Ordem de execução

No [SQL Editor](https://supabase.com/dashboard) do seu projeto Supabase, execute **nesta ordem**:

| # | Arquivo | Quando usar |
|---|---------|-------------|
| 1 | `schema.sql` | Projeto novo — cria tabelas, enums, RLS e políticas |
| 2 | `seed.sql` | Dados iniciais (serviços, estatísticas, rodapé) |
| 3 | `migration-footer.sql` | Só se o banco já existia **antes** da tabela `configuracao_footer` |

## Tabelas

| Tabela | Descrição |
|--------|-----------|
| `servicos` | Portfólio de serviços exibido na home |
| `estatisticas_site` | Números do hero e da seção "Quem somos" |
| `configuracao_footer` | Textos e links do rodapé |
| `agendamentos` | Solicitações de agendamento dos clientes |
| `fila_usuarios` | Fila pública em tempo real |

## Realtime (recomendado)

Para atualizações ao vivo (fila, admin), habilite **Replication** no Supabase:

**Database → Replication** — ative para:

- `agendamentos`
- `fila_usuarios`
- `servicos`
- `estatisticas_site`
- `configuracao_footer`

## Autenticação admin

1. **Authentication → Users → Add user**
2. Crie um usuário com e-mail e senha
3. Acesse `/admin/login` com essas credenciais

## Ícones de serviços (`servicos.icone`)

Valores aceitos no campo `icone` (lucide-react): `ClipboardCheck`, `Droplets`, `Cog`, `Zap`, `Disc`, `Car`, `Wrench`, etc.
