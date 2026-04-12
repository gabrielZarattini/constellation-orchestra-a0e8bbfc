

# Plano: Fase 13 (Agendador Inteligente) + Editor Visual de Roteiros de Vídeo

## Verificação das Features Existentes
- Geração de Vídeo: ✅ Edge function `generate-video-script` implementada. Auth corrigida com `getAuthToken()`. Dialog funcional.
- Player TTS: ✅ Botão "Ouvir" nos cards de áudio com `speechSynthesis`.
- Thumbnails de Imagem: ✅ Implementados nos cards.

## 1. Fase 13: Agendador e Orquestrador Inteligente

### Edge Function — Otimização de Horários por IA
- Criar `supabase/functions/optimize-schedule/index.ts`
- Usa `google/gemini-3-flash-preview` para analisar métricas do usuário e sugerir melhores horários
- Recebe: `platform`, `content_type`, `target_audience` (opcional)
- Retorna: lista de horários sugeridos com score de engajamento previsto

### Sistema de Auto-Publicação
- Criar `supabase/functions/auto-publish/index.ts`
- Verifica posts com status `queued` e `scheduled_at <= now()`
- Para cada post: chama `publish-social` para publicar
- Configurar cron job via `pg_cron` + `pg_net` para executar a cada minuto

### Frontend — Dashboard de Agendamento Inteligente
- Adicionar seção "Agendamento Inteligente" na `CalendarPage.tsx`
- Botão "Sugerir Melhor Horário" ao criar/editar post
- Mostra horários sugeridos com indicadores visuais de engajamento
- Auto-preenchimento do `scheduled_at` com horário sugerido

### Painel de Orquestração
- Widget na `DashboardHome.tsx` mostrando próximos posts agendados e status de publicação
- Indicadores: posts na fila, publicados hoje, falhas de publicação

### Arquivos
| Arquivo | Ação |
|---------|------|
| `supabase/functions/optimize-schedule/index.ts` | Criar |
| `supabase/functions/auto-publish/index.ts` | Criar |
| `src/pages/CalendarPage.tsx` | Editar (botão sugerir horário) |
| `src/pages/DashboardHome.tsx` | Editar (widget próximos posts) |

### Migrations
- Habilitar extensões `pg_cron` e `pg_net`
- Criar cron job para auto-publicação a cada minuto

## 2. Editor Visual de Roteiros de Vídeo

### Nova Página
- Criar `src/pages/VideoEditorPage.tsx`
- Acessível via rota `/dashboard/content/video-editor/:id`
- Botão "Editar Roteiro" nos cards de vídeo na biblioteca

### Funcionalidades
- **Timeline visual**: Divide o roteiro em cenas baseado nas marcações `[CENA]`, `[INTRO]`, etc.
- **Cards de cena**: Cada cena é um card editável com campos para narração, texto em tela, duração estimada
- **Preview de cenas**: Renderiza cada cena como card visual com ícones e cores por tipo
- **Drag-and-drop de cenas**: Reordenar cenas arrastando (reutiliza `@dnd-kit`)
- **Exportação em PDF**: Gera PDF do roteiro formatado usando `window.print()` com CSS otimizado

### Arquivos
| Arquivo | Ação |
|---------|------|
| `src/pages/VideoEditorPage.tsx` | Criar |
| `src/App.tsx` | Editar (adicionar rota) |
| `src/pages/ContentLibraryPage.tsx` | Editar (adicionar botão "Editar Roteiro") |

## Detalhes Técnicos

- `optimize-schedule` usa Lovable AI com tool calling para retornar JSON estruturado de horários
- `auto-publish` usa service role key para acessar posts de todos os usuários (cron job)
- Cron job inserido via `supabase insert tool` (não migration) pois contém dados específicos do projeto
- Editor de vídeo parseia marcações `[CENA]`, `[INTRO]`, `[HOOK]`, etc. com regex
- PDF via `@media print` CSS — sem dependência externa
- Nenhuma migration de tabela necessária

## Ordem de Execução
1. Criar edge function `optimize-schedule`
2. Criar edge function `auto-publish`
3. Configurar cron job de auto-publicação
4. Integrar sugestão de horários na CalendarPage
5. Adicionar widget de próximos posts no Dashboard
6. Criar página VideoEditorPage com timeline e editor de cenas
7. Adicionar exportação PDF
8. Registrar rota e botão de acesso
9. Atualizar roadmap (Fase 13 ✅)

