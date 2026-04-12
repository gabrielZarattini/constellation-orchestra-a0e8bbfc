

# Plano: Fase 9 (Calendário) + CRUD de Agentes na Constelação

## Verificação de Isolamento
Dados já isolados: 3 usuários no banco, cada um com 6 agentes próprios. RLS `auth.uid() = user_id` está ativo em todas as tabelas. ✅ Confirmado.

## 1. Página de Calendário de Publicações

### O que será feito
- Criar `src/pages/CalendarPage.tsx` com visualização mensal e semanal dos `scheduled_posts`
- Hook `useScheduledPosts.ts` para CRUD de posts agendados via Supabase
- Visualização mensal: grid de dias com dots coloridos por plataforma
- Visualização semanal: timeline com cards de posts
- Dialog para criar/editar agendamento (selecionar conteúdo, plataforma, conta social, data/hora)
- Registrar rota `/dashboard/calendar` no `App.tsx`

### Arquivos
- `src/pages/CalendarPage.tsx` (novo)
- `src/hooks/useScheduledPosts.ts` (novo)
- `src/App.tsx` (adicionar rota)

## 2. CRUD de Agentes na Constelação

### O que será feito
- Adicionar botões de ação no `ConstellationPage`: "Adicionar Agente", "Remover Agente"
- Expandir o painel `AgentDetail` com botão "Editar" que abre um dialog para editar nome, role, avatar, provider, model, system prompt, priority
- Hook `useAgentMutations.ts` com mutations para INSERT, UPDATE, DELETE em `crew_agents` e `crew_edges`
- Ao adicionar agente: dialog com formulário, posição aleatória, persistência no banco
- Ao remover: confirmação + delete do agente e edges associadas
- Ao editar: update dos campos no banco
- Invalidar queries após mutations para sincronizar

### Arquivos
- `src/hooks/useAgentMutations.ts` (novo)
- `src/components/panels/AgentDetail.tsx` (expandir com edição/remoção)
- `src/components/panels/AddAgentDialog.tsx` (novo)
- `src/pages/ConstellationPage.tsx` (botão adicionar)

## Detalhes Técnicos

- Nenhuma migration necessária — tabelas `scheduled_posts`, `crew_agents`, `crew_edges` já existem com RLS correto
- Calendário usa `date-fns` (já disponível) e componente `Calendar` do shadcn
- Mutations usam `useMutation` do React Query com invalidação de cache
- Agentes novos recebem `agent_key` gerado como `agent-${Date.now()}`

## Ordem de Execução
1. Criar hook `useScheduledPosts` + página `CalendarPage` + registrar rota
2. Criar hook `useAgentMutations` + dialog de adicionar agente
3. Expandir `AgentDetail` com edição e remoção
4. Atualizar roadmap

