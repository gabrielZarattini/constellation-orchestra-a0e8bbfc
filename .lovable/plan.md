

# Plano: Fase 16 (Self-Optimization) + Comparativo de Campanhas

## 1. Fase 16: Self-Optimization — Auto-otimização com IA

### Edge Function — `self-optimize`
- Criar `supabase/functions/self-optimize/index.ts`
- Modelo: `google/gemini-3-flash-preview` via Lovable AI Gateway
- Recebe: `user_id` (do token auth)
- Coleta dados de `campaign_metrics`, `scheduled_posts` e `content_library` do usuário
- Analisa padrões: melhores horários, plataformas com mais engajamento, tipos de conteúdo que performam melhor
- Retorna via tool calling: recomendações de horários otimizados, plataformas prioritárias, tipos de conteúdo recomendados, score de otimização atual
- Salva recomendações na tabela `optimization_policy` (já existe)

### Frontend — Painel de Auto-otimização no Dashboard
- Adicionar widget "Auto-otimização IA" no `DashboardHome.tsx`
- Botão "Analisar e Otimizar" que chama a edge function
- Exibe: score de otimização, lista de recomendações com ações sugeridas, histórico de otimizações aplicadas (da tabela `optimization_policy`)
- Cada recomendação tem botão "Aplicar" que atualiza configurações relevantes

### Arquivos
| Arquivo | Ação |
|---------|------|
| `supabase/functions/self-optimize/index.ts` | Criar |
| `src/pages/DashboardHome.tsx` | Editar (widget otimização) |

## 2. Comparativo de Campanhas no Analytics

### Nova aba/seção no AnalyticsPage
- Adicionar aba "Comparativo" no `AnalyticsPage.tsx`
- Selector para escolher 2 campanhas para comparar
- Gráficos lado a lado: impressões, cliques, engajamentos, CTR, spend, conversões
- Tabela comparativa com métricas resumidas
- Dados reais de `campaign_metrics` filtrados por `campaign_id`
- Modo demo com campanhas fictícias quando sem dados

### Ajustes no fetch
- Buscar também `campaign_id` e nome da campanha (join com `campaigns`) para popular o comparativo

### Arquivos
| Arquivo | Ação |
|---------|------|
| `src/pages/AnalyticsPage.tsx` | Editar (aba comparativo + fetch campaign_id) |

## Detalhes Técnicos

- `self-optimize` usa service role para ler métricas completas do usuário autenticado
- Tabela `optimization_policy` já existe com campos `action_type`, `action_details`, `context`, `reward`, `applied`
- Comparativo usa `campaign_metrics.campaign_id` (já existe) + join com `campaigns.name`
- Nenhuma migration necessária

## Ordem de Execução
1. Criar edge function `self-optimize`
2. Integrar widget de otimização no DashboardHome
3. Adicionar aba de comparativo no AnalyticsPage
4. Atualizar roadmap (Fase 16 ✅)

