

# Plano: Sidebar auto-collapse na Constelação + Fase 5 (CRUD Campanhas) + Atualizar Roadmap

## Resumo

Três entregas: (1) colapsar sidebar automaticamente ao entrar na Constelação, (2) implementar CRUD de Campanhas com wizard multi-step, (3) atualizar roadmap na memória.

---

## 1. Sidebar auto-collapse na Constelação

**Problema:** Quando o usuário clica em "Maximizar" no widget ou navega para `/dashboard/constellation`, a sidebar continua expandida, ocupando espaço.

**Solução:**
- No `DashboardLayout.tsx`, controlar o estado `open` do `SidebarProvider` externamente via props (`open` + `onOpenChange`)
- Detectar a rota atual com `useLocation()` — quando o path inclui `/constellation`, forçar `open = false`
- No `ConstellationPage.tsx`, o botão "Minimizar" navega de volta para `/dashboard` e a sidebar volta ao estado normal
- No `ConstellationWidget.tsx`, ao clicar em Maximizar, apenas navega — o layout detecta a rota e colapsa

**Arquivos modificados:** `src/components/dashboard/DashboardLayout.tsx`

---

## 2. Fase 5: CRUD de Campanhas

**Arquitetura:**

```text
/dashboard/campaigns          → Lista de campanhas (cards/tabela)
/dashboard/campaigns/new      → Wizard de criação (5 steps)
/dashboard/campaigns/:id      → Detalhe/edição da campanha
```

### 2a. Página de listagem (`src/pages/CampaignsPage.tsx`)
- Tabela/cards com campanhas do usuário (fetch da tabela `campaigns`)
- Filtros por status (draft, active, paused, completed, archived)
- Botão "Nova Campanha" e "Duplicar"
- Badge de status com cores distintas
- Ações: editar, pausar/ativar, arquivar, duplicar

### 2b. Wizard multi-step (`src/pages/CampaignWizard.tsx`)
- 5 steps com stepper visual:
  1. **Objetivo** — nome, descrição, tipo (lançamento, promoção, awareness, engajamento)
  2. **Público-alvo** — idade, localização, interesses (salvo como JSON em `target_audience`)
  3. **Canais** — seleção de plataformas (checkboxes das `social_platform` do enum)
  4. **Orçamento** — valor em centavos (`budget_cents`), período
  5. **Cronograma** — datas de início/fim (`starts_at`, `ends_at`), revisão final
- Templates pré-definidos que pré-preenchem os campos (lançamento de produto, promoção sazonal, brand awareness, engajamento)
- Salva como `draft` por padrão, botão para ativar

### 2c. Página de detalhe (`src/pages/CampaignDetail.tsx`)
- Visualização e edição inline dos dados da campanha
- Status machine com botões de transição: draft→active, active→paused, paused→active, active→completed, *→archived
- Métricas da campanha (futuro: conectar com `campaign_metrics`)

### 2d. Hooks e utilitários
- `src/hooks/useCampaigns.ts` — CRUD com React Query (`useQuery`, `useMutation`) na tabela `campaigns`
- Templates de campanha como constante exportada

### 2e. Rotas e navegação
- Adicionar rotas em `App.tsx`: `campaigns`, `campaigns/new`, `campaigns/:id`
- Sidebar já tem link para Campanhas (`/dashboard/campaigns`)

**Nenhuma migração necessária** — a tabela `campaigns` já existe com todos os campos necessários (name, description, objective, target_audience, platforms, budget_cents, status, starts_at, ends_at, metadata). RLS já configurada para CRUD completo.

---

## 3. Atualizar Roadmap na Memória

- Marcar Fases 1-4 como ✅ completas no `mem://features/roadmap`
- Marcar Fase 5 como 🔄 em andamento

---

## Arquivos a criar
- `src/pages/CampaignsPage.tsx`
- `src/pages/CampaignWizard.tsx`
- `src/pages/CampaignDetail.tsx`
- `src/hooks/useCampaigns.ts`

## Arquivos a modificar
- `src/components/dashboard/DashboardLayout.tsx` (sidebar auto-collapse)
- `src/App.tsx` (novas rotas)
- `mem://features/roadmap` (status update)
- `mem://index.md` (se necessário)

