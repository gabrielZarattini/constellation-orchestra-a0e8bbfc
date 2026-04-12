

# Plano: Fase 11 (Áudio/Música com IA) + Thumbnails de Imagem na Biblioteca

## Verificação das Features Existentes
- Calendário: ✅ Posts agendados criam e aparecem no grid. Drag-and-drop e duplicar estão implementados.
- Geração de Imagem: ✅ Edge function retorna 200, imagem é gerada e salva no storage.
- Constelação: ✅ Modo Conectar e + Agente visíveis e funcionais.

## 1. Thumbnails de Imagem na Grid de Conteúdo

### O que será feito
- No card de conteúdo (`ContentLibraryPage.tsx`), quando `item.type === 'image'` e `item.media_url` existir, mostrar thumbnail da imagem acima do texto
- Thumbnail com `aspect-ratio: 16/9`, `object-cover`, `rounded-t-lg`
- Fallback com ícone de imagem caso a URL falhe

### Arquivo
- `src/pages/ContentLibraryPage.tsx` (editar seção do card, ~linhas 615-710)

## 2. Fase 11: Geração de Áudio/Música com IA

### Abordagem
- Usar Lovable AI Gateway com modelo de texto para gerar **scripts de áudio** (roteiros para podcasts, narração, jingles)
- Para geração de áudio real (TTS/música), seria necessário ElevenLabs API key
- Implementar geração de scripts de áudio como conteúdo tipo `audio` na biblioteca

### Edge Function
- Criar `supabase/functions/generate-audio-script/index.ts`
- Usar modelo `google/gemini-3-flash-preview` para gerar roteiros de áudio/podcast/jingle
- Receber `prompt`, `format` (podcast, narração, jingle, música), `duration` (curto, médio, longo)

### Frontend
- Adicionar botão "Gerar Áudio" na `ContentLibraryPage.tsx`
- Dialog com campo de prompt, seletor de formato (podcast, narração, jingle, música de fundo)
- Resultado salvo como conteúdo tipo `audio` com body contendo o roteiro

### Arquivos
- `supabase/functions/generate-audio-script/index.ts` (novo)
- `src/pages/ContentLibraryPage.tsx` (adicionar dialog + botão + thumbnails)

## Detalhes Técnicos

- Nenhuma migration de banco necessária — `content_library` já suporta type `audio`
- Thumbnails usam `media_url` existente nos registros de imagem
- Edge function usa Lovable AI Gateway (sem API key extra)
- Para TTS real no futuro, perguntaremos sobre ElevenLabs API key

## Ordem de Execução
1. Adicionar thumbnails de imagem nos cards da biblioteca
2. Criar edge function `generate-audio-script`
3. Integrar dialog de geração de áudio na ContentLibraryPage
4. Atualizar roadmap

