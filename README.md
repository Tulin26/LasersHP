# LaserHP

Site de encomendas e painel administrativo (mini ERP) para venda de
equipamentos de laser para estética.

O projeto é único: a vitrine pública e o painel vivem na mesma aplicação
Next.js, separados por grupos de rota.

## Stack

| Camada | Tecnologia |
| --- | --- |
| Front e back | Next.js 16 (App Router) + TypeScript |
| Interface | Tailwind CSS v4 + shadcn/ui |
| Banco, autenticação e imagens | Supabase (Postgres + Auth + Storage) |
| Lógica de servidor | Server Actions e Route Handlers |
| Validação | Zod (mesmo schema no cliente e no servidor) |
| Hospedagem | Vercel |

## Rodando na sua máquina

Requer Node.js 20 ou superior.

```bash
npm install
cp .env.example .env.local   # preencha com as chaves do seu projeto Supabase
npm run dev
```

A aplicação sobe em http://localhost:3000.

### Variáveis de ambiente

Estão documentadas em [`.env.example`](.env.example). A regra que importa:

- `NEXT_PUBLIC_*` é embutida no JavaScript enviado ao navegador — qualquer
  pessoa consegue ler.
- `SUPABASE_SERVICE_ROLE_KEY` **não** tem esse prefixo de propósito: ela ignora
  as regras de segurança do banco e só pode ser usada em código de servidor.

## Banco de dados

Os scripts ficam em [`supabase/migrations/`](supabase/migrations/) e são
aplicados pelo SQL Editor do Supabase, na ordem:

1. `0001_schema_inicial.sql` — tabelas, índices, funções, RLS e bucket de imagens.
2. `0002_criar_admin.sql` — cria o perfil de acesso ao painel. Rode depois de
   cadastrar o usuário em *Authentication > Users*.

Todas as tabelas têm Row Level Security ligado. A vitrine enxerga apenas
produtos ativos e as configurações do site; o restante exige login.

## Estrutura

```
app/                 rotas (vitrine pública, painel e route handlers)
components/          componentes de interface
lib/                 server actions, validações Zod e consultas
utils/supabase/      clientes do Supabase (navegador, servidor e admin)
supabase/migrations/ scripts SQL do banco
proxy.ts             renova a sessão e protege as rotas /admin
```

> No Next.js 16 o antigo `middleware.ts` foi descontinuado e renomeado para
> `proxy.ts`. A função exportada chama-se `proxy`.

## Scripts

| Comando | O que faz |
| --- | --- |
| `npm run dev` | Servidor de desenvolvimento com recarga automática |
| `npm run build` | Build de produção |
| `npm start` | Sobe o build de produção |
| `npm run lint` | ESLint |

## Deploy

O deploy é feito pela Vercel conectada a este repositório: todo push na branch
`main` publica automaticamente. As mesmas variáveis do `.env.local` precisam
estar cadastradas em *Project Settings > Environment Variables*.
