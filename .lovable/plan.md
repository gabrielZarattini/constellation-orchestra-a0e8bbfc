

# Plano: Super Prompt de Orquestração — Magic Constellation v1.0

## Visão Geral

Implementar o sistema de orquestração de conteúdo com 3 entregas principais: (A) Edge function de orquestração que gera artigo WordPress + posts LinkedIn/X em cadeia, (B) Sistema de UTM auto-tagging em todos os posts, (C) Dashboard de ROI/Conversão no painel.

## Entrega A — Orquestração de Conteúdo (Edge Function)

Criar `supabase/functions/orchestrate-content/index.ts` que:
1. Recebe um `topic` e `campaign_id`
2. Chama `generate-content` internamente (via Lovable AI) para gerar o artigo WordPress (1200+ palavras, SEO otimizado com meta tags)
3. Chama `generate-content` para gerar post LinkedIn (storytelling B2B)
4. Chama `generate-content` para gerar thread X/Twitter (5 tweets)
5. Chama `generate-image` para gerar imagem da campanha
6. Publica no WordPress via `publish-wordpress`
7. Salva tudo na `content_library` com UTM tags
8. Agenda posts sociais na `scheduled_posts` com UTMs embutidos
9. Retorna resumo da orquestração

### UTM Auto-Tagging
- Todo link gerado inclui `?utm_source={platform}&utm_medium=social&utm_campaign=magic_constellation_v1`
- Aplicado automaticamente no corpo do artigo e nos posts sociais

## Entrega B — Página de Orquestração (Frontend)

Criar `src/pages/OrchestrationPage.tsx`:
- Input de tópico/tema
- Seleção de plataformas alvo (WordPress, LinkedIn, X)
- Botão "Orquestrar Campanha" que chama a edge function
- Progresso em tempo real (steps: Pesquisando → Escrevendo Artigo → Gerando Posts → Publicando)
- Preview dos conteúdos gerados antes de publicar
- Adicionar rota `/dashboard/orchestration` e item no sidebar

## Entrega C — Dashboard de ROI

Criar `src/components/dashboard/ROIWidget.tsx` no DashboardHome:
- Card mostrando: Cliques totais (das redes sociais), Taxa de conversão estimada, Custo de API vs Receita estimada
- Dados de `campaign_metrics` + `usage_tracking` (créditos consumidos = custo API)
- Cálculo: Receita estimada = conversões × valor médio por plano (Starter $29, Pro $79, Enterprise $199)

## Entrega D — Salvar Plano na Memória

Criar `mem://features/orchestration-strategy` com as diretrizes de ROI positivo, prova social e escalabilidade.

## Arquivos

| Arquivo | Ação |
|---------|------|
| `supabase/functions/orchestrate-content/index.ts` | Criar — edge function principal |
| `src/pages/OrchestrationPage.tsx` | Criar — UI de orquestração |
| `src/components/dashboard/ROIWidget.tsx` | Criar — widget de ROI |
| `src/App.tsx` | Editar — rota orchestration |
| `src/components/dashboard/DashboardSidebar.tsx` | Editar — item sidebar |
| `src/pages/DashboardHome.tsx` | Editar — incluir ROIWidget |
| `mem://features/orchestration-strategy` | Criar — memória do plano |
| `mem://index.md` | Atualizar — referência à estratégia |

## Ordem de Execução
1. Salvar plano na memória
2. Criar edge function `orchestrate-content`
3. Criar `OrchestrationPage` + rota + sidebar
4. Criar `ROIWidget` + integrar no DashboardHome
5. Testar fluxo completo

## Nota Importante
A publicação real no LinkedIn/X depende das APIs sociais já conectadas (`social_accounts`). O sistema de self-healing existente já cobre retries com backoff para falhas de API/token. A edge function `orchestrate-content` vai gerar e salvar o conteúdo, e agendar a publicação via `scheduled_posts` — o fluxo de publicação existente (`auto-publish` + `publish-social`) cuidará da entrega.

