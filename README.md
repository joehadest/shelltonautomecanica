# Shellton Auto Mecânica

Site e painel administrativo para oficina mecânica: portfólio de serviços, agendamento online, fila pública em tempo real e dashboard admin.

## Stack

- **Next.js 16** (App Router) + **React 19** + **TypeScript**
- **Tailwind CSS v4** + componentes estilo shadcn/ui
- **Supabase** (Postgres, Auth, Realtime)

## Rotas

| Rota | Descrição |
|------|-----------|
| `/` | Home — hero, sobre, diferenciais, serviços |
| `/agendamento` | Formulário de agendamento |
| `/fila` | Fila pública (nomes e placas mascarados) |
| `/admin/login` | Login do administrador |
| `/admin/dashboard` | Painel: agendamentos, fila, portfólio, estatísticas, rodapé |

## Pré-requisitos

- Node.js 20+
- Conta no [Supabase](https://supabase.com)

## Instalação

```bash
# 1. Clonar e instalar dependências
git clone <url-do-repositorio>
cd shelltonautomecanica
npm install

# 2. Variáveis de ambiente
cp .env.example .env
# Edite .env com URL e chave do Supabase

# 3. Banco de dados (ver supabase/README.md)
# Execute schema.sql e seed.sql no SQL Editor do Supabase

# 4. Desenvolvimento
npm run dev
```

Abra [http://localhost:3000](http://localhost:3000).

## Scripts

| Comando | Descrição |
|---------|-----------|
| `npm run dev` | Servidor de desenvolvimento |
| `npm run build` | Build de produção |
| `npm run start` | Servidor após o build |
| `npm run lint` | ESLint |

## Variáveis de ambiente

| Variável | Obrigatória | Descrição |
|----------|-------------|-----------|
| `NEXT_PUBLIC_SUPABASE_URL` | Sim | URL do projeto Supabase |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Sim* | Chave pública (publishable ou anon) |

\* Também aceita `NEXT_PUBLIC_SUPABASE_ANON_KEY`.

**Nunca commite o arquivo `.env`** — ele está no `.gitignore`. Use `.env.example` como referência.

## Estrutura do projeto

```
src/
  app/
    (public)/          # Páginas públicas
    admin/             # Login e dashboard
  components/          # UI e blocos do site
  lib/
    store.ts           # Camada de dados + Realtime
    supabase/          # Cliente Supabase
supabase/
  schema.sql           # Schema completo
  seed.sql             # Dados iniciais
  migration-footer.sql # Migração opcional
public/                # Imagens e assets estáticos
```

## Deploy

Compatível com **Vercel**, **Netlify** ou qualquer host Node.js.

Configure as mesmas variáveis de ambiente do `.env` no painel do provedor.

## Documentação para agentes

- `AGENTS.md` — regras para assistentes de IA no projeto
- `CLAUDE.md` — referência ao AGENTS.md

## Licença

Projeto privado — Shellton Auto Mecânica.
