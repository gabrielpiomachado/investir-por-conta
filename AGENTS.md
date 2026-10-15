# Diretrizes do projeto

## Projeto e comandos

Aplicação web Next.js com App Router, TypeScript, Tailwind CSS, componentes shadcn/ui e Supabase Auth/Database. Use `pnpm` (versão definida no `package.json` e no lockfile).

Scripts disponíveis em `package.json`:

- `pnpm dev`: desenvolvimento.
- `pnpm lint`: ESLint.
- `pnpm typecheck`: TypeScript sem gerar arquivos.
- `pnpm check`: lint e typecheck.
- `pnpm build`: build de produção.
- `pnpm start`: servidor de produção após o build.
- `pnpm db:sync`: sincroniza schemas declarativos gerando nova migration (pg-delta).
- `pnpm db:types`: regenera as tipagens TypeScript do banco a partir do ambiente local.
- `pnpm db:reset`: reseta o banco de dados local executando todas as migrações e o seed.

Não há testes automatizados nem script `test`. Não invente resultados de testes nem instale ferramentas sem autorização. Há um `.prettierrc`, mas não há dependência ou script Prettier declarado; não presuma que exista um comando de formatação.

## Organização

- `src/app/`: rotas, layouts e arquivos especiais do Next.js. As rotas estão agrupadas em `(public)`, `(auth)` e `(dashboard)`; mantenha páginas focadas em composição e carregamento da rota.
- `src/features/`: código específico por domínio. Os domínios existentes são `auth` e `categories`; mantenha componentes e schemas específicos junto à feature.
- `src/components/layout/`: componentes compartilhados de layout; `src/components/ui/`: componentes-base shadcn/ui.
- `src/lib/`: utilitários, validação de ambiente e integrações compartilhadas. Em `src/lib/supabase/`, `client.ts` é para o navegador, `server.ts` para servidor e `proxy.ts` para atualização de sessão.
- `src/proxy.ts`: proxy do Next.js que conecta a atualização de sessão às requisições e aplica as regras de acesso.
- `src/types/`: tipos compartilhados, incluindo os tipos do banco em `database.types.ts`.
- `supabase/schemas/`: schemas SQL declarativos que representam o estado final desejado do banco (fonte da verdade).
- `supabase/migrations/`: migrations SQL versionadas; `supabase/seed.sql`: dados de seed local.
- `public/`: arquivos estáticos.

Antes de criar arquivos ou abstrações, confira exemplos existentes e amplie a estrutura somente quando a funcionalidade justificar.

## Padrões de implementação

- Use TypeScript estrito (`strict` no `tsconfig.json`) e o alias `@/*` para imports de `src/`.
- Prefira Server Components. Use `"use client"` quando houver estado, eventos ou APIs de navegador; escolha o cliente Supabase conforme o ambiente e não importe código de servidor no navegador.
- Valide entradas com Zod e mantenha schemas específicos junto à feature. Para dados de usuário, trate erros de validação e de operações explicitamente.
- Use `kebab-case` nos nomes de arquivos, `camelCase` em funções e variáveis e `PascalCase` em componentes e tipos. Respeite os nomes especiais exigidos pelo App Router e use `snake_case` para identificadores SQL conforme o schema existente.
- Reutilize Tailwind CSS e os componentes em `src/components/ui/`. Siga ESLint, `tsconfig.json` e as preferências de formatação em `.prettierrc`.
- Ao alterar o schema do banco de dados, utilize o fluxo de declarative schemas: atualize a definição desejada em `supabase/schemas/` e execute `pnpm db:sync --name <nome_da_migration>` para que o motor `pg-delta` gere a nova migration correspondente em `supabase/migrations/`.
- Nunca edite, exclua ou reescreva migrations existentes. Toda alteração necessária no schema deve ser registrada em uma nova migration gerada a partir dos schemas declarativos.
- Mantenha `src/types/database.types.ts` sempre sincronizado via `pnpm db:types`.
- Ao alterar o banco, avalie o impacto em RLS, políticas de acesso e isolamento dos dados de cada usuário. Não desative proteções para contornar erros.
- Não exponha credenciais privadas, chaves `service_role` ou outros segredos no cliente. Não altere arquivos de ambiente nem execute operações destrutivas ou em bancos remotos sem autorização explícita.
- Nunca instale, remova ou atualize dependências sem autorização explícita. Não altere manualmente o lockfile nem troque o gerenciador de pacotes.
- Não faça alterações fora do escopo solicitado sem necessidade justificada. Antes de criar abstrações ou reorganizar arquivos, verifique se a mudança é realmente necessária.

## Verificação

Execute `pnpm check` antes de concluir alterações e corrija problemas introduzidos por elas. Execute também `pnpm build` quando mudanças em rotas, layouts, integrações ou configurações puderem afetar o build. Informe as verificações executadas e seus resultados.
Se `pnpm check` falhar, analise os erros e corrija os que forem causados pelas alterações realizadas. Não esconda falhas preexistentes nem afirme que as verificações passaram sem executá-las. Se não for possível concluir uma verificação, informe o motivo.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
