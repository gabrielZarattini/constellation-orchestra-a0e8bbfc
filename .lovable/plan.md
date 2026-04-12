

# Plano: Fase 18 (WordPress + Blog Engine) + Cron Self-Heal

## 1. Cron Job — Self-Heal Automático a Cada 5 Minutos

### Pré-requisitos
- Habilitar extensões `pg_cron` e `pg_net` via migration
- Criar cron job via SQL insert (não migration) que chama `self-heal` a cada 5 min com service role key

### Implementação
- Migration: `CREATE EXTENSION IF NOT EXISTS pg_cron; CREATE EXTENSION IF NOT EXISTS pg_net;`
- SQL insert: `cron.schedule('self-heal-every-5min', '*/5 * * * *', ...)` chamando `/functions/v1/self-heal` com Authorization Bearer do anon key
- O self-heal precisa funcionar sem user context para o cron — ajustar a edge function para aceitar chamadas com service role key e processar TODOS os usuários (não apenas um)

### Ajuste na Edge Function `self-heal`
- Se chamado com service role (sem user específico): buscar todos os usuários com posts/contas ativas e processar cada um
- Se chamado com user token: manter comportamento atual (apenas aquele usuário)

## 2. Fase 18: WordPress + Blog Engine

### Conector WordPress.com
- Usar `standard_connectors--connect` para conectar WordPress.com
- Edge function usa gateway `connector-gateway.lovable.dev/wordpress_com/`

### Edge Function — `publish-wordpress`
- Criar `supabase/functions/publish-wordpress/index.ts`
- Recebe: `title`, `content` (HTML), `tags`, `categories`, `status` (draft/publish), `site_id`
- Publica via gateway: `POST /rest/v1.1/sites/{site}/posts/new`
- Retorna URL do post publicado

### Frontend — Página Blog Engine
- Criar `src/pages/BlogEditorPage.tsx`
- Editor WYSIWYG simples com `contentEditable` div + toolbar (bold, italic, heading, link, image, list)
- Templates de artigos SEO: "How-to", "Listicle", "Case Study", "Tutorial"
- Ao selecionar template, preenche estrutura base do artigo
- Botão "Publicar no WordPress" que chama a edge function
- Botão "Gerar com IA" que chama `generate-content` com tipo blog e insere no editor
- Rota: `/dashboard/blog`

### Sidebar
- Adicionar item "Blog" no menu principal com ícone `BookOpen`

### Arquivos
| Arquivo | Ação |
|---------|------|
| `supabase/functions/self-heal/index.ts` | Editar (modo cron sem user) |
| `supabase/functions/publish-wordpress/index.ts` | Criar |
| `src/pages/BlogEditorPage.tsx` | Criar |
| `src/App.tsx` | Editar (rota blog) |
| `src/components/dashboard/DashboardSidebar.tsx` | Editar (item Blog) |

## Detalhes Técnicos

- WordPress.com connector usa gateway com `LOVABLE_API_KEY` + `WORDPRESS_COM_API_KEY`
- Editor WYSIWYG usa `contentEditable` nativo — sem dependência extra
- Templates SEO são constantes estáticas com estrutura HTML
- Cron job usa `pg_cron` + `pg_net` para HTTP POST automático
- Migration para extensões, SQL insert para o cron schedule

## Ordem de Execução
1. Habilitar extensões pg_cron e pg_net (migration)
2. Ajustar self-heal para modo cron (todos os usuários)
3. Criar cron job via SQL insert
4. Conectar WordPress.com connector
5. Criar edge function publish-wordpress
6. Criar BlogEditorPage com editor WYSIWYG + templates
7. Registrar rota e sidebar
8. Atualizar roadmap (Fase 18 ✅)

