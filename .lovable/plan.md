

# Plano: Fase 15 (SEM Engine) + Métricas Demo no Analytics

## Verificação das Features Existentes
- SEO Engine: ✅ Edge function `analyze-seo` + botão "Analisar SEO" nos cards de texto
- Analytics: ✅ Página funcional com gráficos de `campaign_metrics` e `scheduled_posts`
- Tabela `campaign_metrics` já tem colunas `spend_cents`, `conversions`, `ctr` — prontas para SEM

## 1. Fase 15: SEM Engine — Análise de Anúncios Pagos com IA

### Edge Function
- Criar `supabase/functions/analyze-sem/index.ts`
- Modelo: `google/gemini-3-flash-preview` via Lovable AI Gateway
- Recebe: `campaign_name`, `objective`, `target_audience`, `platforms`, `budget_cents`
- Retorna via tool calling: sugestões de copy para ads (título + descrição), CPC estimado por plataforma, keywords negativas, score de qualidade previsto, otimizações sugeridas

### Frontend — Painel SEM nas Campanhas
- Adicionar botão "Analisar SEM" no `CampaignDetail.tsx` para campanhas com budget
- Dialog com resultado: copy sugerido para ads, CPC estimado, keywords, otimizações
- Card de métricas pagas no `AnalyticsPage.tsx`: spend total, CPA, ROAS estimado

### Arquivos
| Arquivo | Ação |
|---------|------|
| `supabase/functions/analyze-sem/index.ts` | Criar |
| `src/pages/CampaignDetail.tsx` | Editar (botão + dialog SEM) |
| `src/pages/AnalyticsPage.tsx` | Editar (métricas pagas + dados demo) |

## 2. Métricas Demo no Analytics

Quando o usuário não tem dados reais (`metrics.length === 0` e `posts.length === 0`), exibir dados demo com banner informativo "Dados de demonstração — publique conteúdo para ver métricas reais".

Dados demo incluem:
- 5 plataformas com impressões/cliques/engajamentos fictícios
- Timeline de 7 dias com posts simulados
- KPIs calculados a partir dos dados demo
- Badge "Demo" nos gráficos

## Detalhes Técnicos

- `analyze-sem` usa tool calling para JSON estruturado (copy, CPC, keywords)
- Dados demo são constantes estáticas no `AnalyticsPage.tsx` (sem persistência)
- Nenhuma migration necessária — `campaign_metrics` já tem `spend_cents` e `conversions`
- Métricas pagas (spend, CPA) derivadas dos campos existentes

## Ordem de Execução
1. Criar edge function `analyze-sem`
2. Integrar botão + dialog SEM no CampaignDetail
3. Adicionar métricas pagas ao AnalyticsPage
4. Adicionar dados demo com banner no Analytics
5. Atualizar roadmap (Fase 15 ✅)

