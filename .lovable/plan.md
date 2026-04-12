

# Plano: Fase 12 (Vídeo com IA) + Player TTS + Correção Auth + Testes

## Problemas Encontrados

### Auth nas Edge Functions
As chamadas de geração de áudio e imagem usam `VITE_SUPABASE_PUBLISHABLE_KEY` como Bearer token, mas as edge functions validam via `supabase.auth.getUser()`. Isso funciona **apenas quando o usuário está logado** e o token de sessão é passado. O código atual passa a anon key em vez do token do usuário logado.

**Correção**: Usar `supabase.functions.invoke()` (que passa automaticamente o token de sessão) ou obter o token via `supabase.auth.getSession()` e passá-lo no header Authorization.

### Thumbnails de Imagem
Já implementados corretamente (linhas 807-818 do ContentLibraryPage). ✅

## 1. Corrigir Autenticação nas Chamadas de Edge Functions

Alterar `ContentLibraryPage.tsx` para usar o token de sessão do usuário em vez da anon key nas chamadas de:
- `generate-content`
- `generate-image`
- `generate-audio-script`
- Nova function `generate-video-script`

Usar `supabase.auth.getSession()` para obter o token correto.

## 2. Fase 12: Geração de Roteiro de Vídeo com IA

### Edge Function
- Criar `supabase/functions/generate-video-script/index.ts`
- Modelo: `google/gemini-3-flash-preview` via Lovable AI Gateway
- Receber `prompt`, `format` (reels, youtube, tutorial, storytelling), `duration`
- Gerar roteiro com marcações de cenas, cortes, texto em tela, narração

### Frontend
- Adicionar botão "Gerar Vídeo" na `ContentLibraryPage`
- Dialog com prompt, formato de vídeo, duração
- Resultado salvo como tipo `video` com body contendo o roteiro
- Ícone: `Video` do lucide

## 3. Player TTS na Biblioteca

- Adicionar botão "Ouvir" nos cards de conteúdo tipo `audio`
- Usar `window.speechSynthesis` (Web Speech API) para reproduzir o texto do body
- Controles: play/pause/stop
- Seletor de voz (vozes pt-BR disponíveis no navegador)
- Estado de reprodução visual no card (ícone animado)

## Arquivos

| Arquivo | Ação |
|---------|------|
| `supabase/functions/generate-video-script/index.ts` | Criar |
| `src/pages/ContentLibraryPage.tsx` | Editar (corrigir auth, adicionar dialog vídeo, player TTS) |

## Detalhes Técnicos

- Nenhuma migration necessária — `content_type` já inclui `video`
- TTS usa API nativa do navegador (sem custo, sem API key)
- Edge function segue mesmo padrão das existentes (auth + streaming SSE)
- Corrigir auth: `const { data: { session } } = await supabase.auth.getSession(); fetch(..., { headers: { Authorization: \`Bearer \${session.access_token}\` } })`

## Ordem de Execução
1. Corrigir autenticação em todas as chamadas de edge functions
2. Criar edge function `generate-video-script`
3. Adicionar dialog de geração de vídeo na ContentLibraryPage
4. Implementar player TTS nos cards de áudio
5. Atualizar roadmap (Fase 12 ✅)

