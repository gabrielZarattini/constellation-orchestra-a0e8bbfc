

# Plano: Fase 14 (SEO Engine) + Dashboard de Analytics

## 1. Fase 14: SEO Engine — Análise com IA

### Edge Function
- Criar `supabase/functions/analyze-seo/index.ts`
- Modelo: `google/gemini-3-flash-preview` via Lovable AI Gateway
- Recebe: `content_id` ou `text` + `platform`
- Retorna JSON estruturado via tool calling com: score SEO (0-100), palavras-chave sugeridas, meta description otimizada, melhorias de estrutura, densidade de palavras-chave, legibilidade

### Frontend — Painel SEO na Biblioteca de Conteúdo
- Adicionar botão "Analisar SEO" nos cards de conteúdo (texto/blog)
- Dialog com resultado da análise: score visual (gauge), lista de sugestões, keywords recomendadas, meta description gerada
- Botão "Aplicar Sugestões" que atualiza o conteúdo com as melhorias

### Arquivos
| Arquivo | Ação |
|---------|------|
| `supabase/functions/analyze-seo/index.ts` | Criar |
| `src/pages/ContentLibraryPage.tsx` | Editar (botão + dialog SEO) |

## 2. Dashboard de Analytics

### Nova Página
- Criar `src/pages/AnalyticsPage.tsx`
- Rota: `/dashboard/analytics` (sidebar já tem o link)

### Funcionalidades
- **Métricas por plataforma**: Gráfico de barras com impressões, cliques, engajamentos por plataforma (dados de `campaign_metrics`)
- **Métricas por horário**: Heatmap ou gráfico mostrando melhor desempenho por hora/dia da semana
- **Timeline de publicações**: Gráfico de área com volume de posts publicados ao longo do tempo (dados de `scheduled_posts` com status `published`)
- **KPIs**: Total impressões, total cliques, CTR médio, total engajamentos
- **Filtros**: Por período (7d, 30d, 90d) e por plataforma

### Arquivos
| Arquivo | Ação |
|---------|------|
| `src/pages/AnalyticsPage.tsx` | Criar |
| `src/App.tsx` | Editar (registrar rota) |

## Detalhes Técnicos

- SEO Engine usa tool calling para retornar JSON estruturado (sem parsing manual)
- Analytics usa dados reais de `campaign_metrics` e `scheduled_posts`
- Gráficos com `recharts` (já instalado)
- Nenhuma migration necessária — tabelas `campaign_metrics` e `scheduled_posts` já existem

## Ordem de Execução
1. Criar edge function `analyze-seo`
2. Integrar botão + dialog SEO na ContentLibraryPage
3. Criar página AnalyticsPage com gráficos e KPIs
4. Registrar rota no App.tsx
5. Atualizar roadmap (Fase 14 ✅)

