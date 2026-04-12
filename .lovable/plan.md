

# Plano: Fase 10 (Imagens IA) + Drag-and-Drop Calendário + Edges na Constelação + UI/UX Polish

## 1. UI/UX Polish — Calendário e Constelação

### Calendário
- Melhorar responsividade da view semanal (cards mais compactos em telas menores)
- Adicionar tooltips nos dots de plataforma na view mensal
- Highlight visual ao arrastar posts (drag-and-drop)
- Botão de duplicar post no card semanal e no grid mensal

### Constelação
- Melhorar visual do painel AgentDetail (glassmorphism mais suave, animações)
- Melhorar AddAgentDialog com preview do avatar selecionado
- Feedback visual ao criar/editar/remover agentes

## 2. Drag-and-Drop no Calendário

- Instalar dependência: `@dnd-kit/core` + `@dnd-kit/sortable`
- Tornar cada post arrastável (Draggable) na view mensal e semanal
- Cada dia é um Droppable
- Ao soltar: chamar `useUpdateScheduledPost` para atualizar `scheduled_at` mantendo o horário original
- Adicionar botão "Duplicar" nos cards de post que cria uma cópia com `useCreateScheduledPost`

### Arquivos
- `src/pages/CalendarPage.tsx` (refatorar com dnd-kit)

## 3. Fase 10: Geração de Imagens com IA

### Edge Function
- Criar `supabase/functions/generate-image/index.ts`
- Usar Lovable AI com modelo `google/gemini-3-pro-image-preview` (melhor qualidade de imagem)
- Receber `prompt`, `style` (opcional), retornar base64 da imagem
- Salvar imagem gerada em storage bucket (criar bucket `generated-images`, público)

### Storage
- Migration SQL para criar bucket `generated-images` com RLS para upload/leitura pelo dono

### Frontend
- Adicionar aba/botão "Gerar Imagem" na `ContentLibraryPage`
- Dialog com campo de prompt, seletor de estilo (fotográfico, ilustração, 3D, minimalista)
- Preview da imagem gerada antes de salvar
- Ao salvar: upload para storage + criar registro em `content_library` com `type: 'image'` e `media_url`

### Arquivos
- `supabase/functions/generate-image/index.ts` (novo)
- Migration SQL para bucket de storage
- `src/pages/ContentLibraryPage.tsx` (adicionar dialog de geração de imagem)

## 4. Criar Conexões (Edges) entre Agentes via Drag

### Lógica
- Adicionar hook `useCreateEdge` e `useDeleteEdge` em `useAgentMutations.ts`
- No `CrewGraph`, adicionar modo "conectar": ao clicar e arrastar de um nó para outro, criar edge
- Usar estado no store: `connectingFrom: string | null`
- Ao clicar num nó em modo conectar → setar `connectingFrom`; ao clicar em outro → criar edge no banco
- Botão toggle "Modo Conexão" no canto superior do ConstellationPage
- Dialog para definir label e status da nova edge

### Arquivos
- `src/hooks/useAgentMutations.ts` (adicionar mutations de edge)
- `src/store/useCrewStore.ts` (adicionar `connectingFrom` state)
- `src/components/graph/AgentNode.tsx` (visual de conexão)
- `src/components/graph/CrewGraph.tsx` (lógica de criação de edge)
- `src/pages/ConstellationPage.tsx` (botão modo conexão)

## Detalhes Técnicos

- Imagens usam modelo `google/gemini-3-pro-image-preview` via Lovable AI Gateway (não precisa de API key extra)
- Drag-and-drop com `@dnd-kit` (leve, acessível)
- Edges persistidos em `crew_edges` (tabela já existe com RLS correto)
- Nenhuma migration de tabela necessária para edges; apenas migration para bucket de storage

## Ordem de Execução
1. Instalar `@dnd-kit/core` + `@dnd-kit/sortable`
2. Refatorar CalendarPage com drag-and-drop + duplicar
3. Criar bucket de storage via migration
4. Criar edge function `generate-image`
5. Integrar geração de imagem na ContentLibraryPage
6. Adicionar mutations de edge + modo conexão na Constelação
7. UI/UX polish geral
8. Atualizar roadmap

