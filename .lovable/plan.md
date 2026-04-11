

# Fase 6: Integração LinkedIn + Instagram + Bug Fix

## Bug encontrado nos testes

**Status não atualiza na página de detalhe da campanha** — o `updateCampaign` invalida `['campaigns']` mas a página de detalhe usa `useCampaign(id)` com query key `['campaign', id]`. Precisa invalidar ambas as queries.

## Resultados dos testes

- Wizard 5 steps: todos funcionando corretamente com templates
- Campanha criada e aparece na listagem com badges
- Detalhe carrega com informações corretas
- Sidebar colapsa ao entrar na Constelação e expande ao sair
- KPI "Campanhas" atualizado para 1

---

## Correção do bug

**Arquivo:** `src/hooks/useCampaigns.ts`
- No `updateCampaign.onSuccess`, invalidar também `['campaign']` para refrescar a página de detalhe

---

## Fase 6: LinkedIn + Instagram

### Arquitetura

```text
Usuário → Página "Redes Sociais" → Conectar LinkedIn/Instagram
  → Edge Function (oauth-callback) → Salva tokens em social_accounts
  → Publicar post → Edge Function (publish-social) → API da plataforma
```

### 6a. Página de Contas Sociais (`src/pages/SocialAccountsPage.tsx`)
- Listar contas conectadas (da tabela `social_accounts`)
- Botões "Conectar LinkedIn" e "Conectar Instagram"
- Status de cada conta (ativa, token expirado)
- Desconectar conta

### 6b. Edge Functions

1. **`social-auth-init`** — Gera URL de autorização OAuth 2.0
   - LinkedIn: `https://www.linkedin.com/oauth/v2/authorization`
   - Instagram (via Facebook): `https://www.facebook.com/v19.0/dialog/oauth`
   - Redireciona para callback URL

2. **`social-auth-callback`** — Recebe code do OAuth
   - Troca code por access_token + refresh_token
   - Salva em `social_accounts` (tokens criptografados)
   - Busca dados do perfil (username, ID)

3. **`publish-social`** — Publica conteúdo na plataforma
   - LinkedIn: API de Posts (v2)
   - Instagram: Graph API (via Facebook)
   - Verifica token válido, refresh se necessário
   - Atualiza `scheduled_posts` com status

4. **`refresh-social-token`** — Renova tokens expirados
   - Chamado automaticamente pelo `publish-social`

### 6c. Secrets necessários
- `LINKEDIN_CLIENT_ID` + `LINKEDIN_CLIENT_SECRET`
- `INSTAGRAM_APP_ID` + `INSTAGRAM_APP_SECRET`
- Callback URL: `{SUPABASE_URL}/functions/v1/social-auth-callback`

### 6d. Página de callback (`src/pages/SocialCallback.tsx`)
- Rota `/social/callback` que captura o `code` da URL
- Envia para edge function e redireciona de volta ao dashboard

### 6e. Hook de contas sociais (`src/hooks/useSocialAccounts.ts`)
- CRUD na tabela `social_accounts`
- Iniciar fluxo OAuth
- Verificar status dos tokens

### 6f. Integração no sidebar
- O link "Conteúdo" já existe — adicionar sub-link ou reutilizar a rota existente
- Ou usar a rota de Configurações para gerenciar contas sociais

---

## Arquivos a criar
- `supabase/functions/social-auth-init/index.ts`
- `supabase/functions/social-auth-callback/index.ts`
- `supabase/functions/publish-social/index.ts`
- `supabase/functions/refresh-social-token/index.ts`
- `src/pages/SocialAccountsPage.tsx`
- `src/pages/SocialCallback.tsx`
- `src/hooks/useSocialAccounts.ts`

## Arquivos a modificar
- `src/hooks/useCampaigns.ts` (bug fix: invalidar query do detalhe)
- `src/App.tsx` (novas rotas)
- `src/components/dashboard/DashboardSidebar.tsx` (link para redes sociais)
- `mem://features/roadmap` (atualizar status)

## Pré-requisito
O usuário precisará fornecer as credenciais OAuth do LinkedIn e Instagram (Client ID + Client Secret) obtidas nos respectivos developer portals.

