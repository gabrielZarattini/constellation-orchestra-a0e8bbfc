

# Plano: Resolver Security Findings + Configurar Credenciais LinkedIn

## 1. Corrigir Security Findings

### 1a. social_accounts — UPDATE sem WITH CHECK
- Adicionar `WITH CHECK (auth.uid() = user_id)` na policy de UPDATE para evitar que um usuário reatribua a conta social para outro user_id

### 1b. subscriptions — INSERT não autorizado
- O scan diz que usuários podem inserir subscriptions, mas olhando as policies atuais, já foi removido o INSERT. Vou verificar e marcar como fixed se já estiver correto.

## 2. Configurar LinkedIn OAuth

### Passo a passo para o usuário:
1. Acesse [LinkedIn Developer Portal](https://developer.linkedin.com/)
2. Crie um novo App (ou use um existente)
3. Em "Auth" → copie o **Client ID** e **Client Secret**
4. Em "Auth" → adicione a Redirect URL: `https://vcytifmwlmvhnlwzkbbf.supabase.co/functions/v1/social-auth-callback`
5. Em "Products" → solicite acesso a "Share on LinkedIn" e "Sign In with LinkedIn using OpenID Connect"

### Secrets a adicionar:
- `LINKEDIN_CLIENT_ID`
- `LINKEDIN_CLIENT_SECRET`

## 3. Fix no Edge Function social-auth-init

O edge function usa `supabase.auth.getClaims()` que não existe no SDK. Precisa trocar por `supabase.auth.getUser()` para validar o token corretamente.

## Arquivos a modificar
- Migration SQL: adicionar WITH CHECK na policy de UPDATE do social_accounts
- `supabase/functions/social-auth-init/index.ts`: fix auth validation
- `supabase/functions/social-auth-callback/index.ts`: fix auth validation  
- `supabase/functions/publish-social/index.ts`: fix auth validation

## Ordem de execução
1. Criar migration para fix de segurança
2. Corrigir edge functions (auth validation)
3. Deploy edge functions
4. Solicitar as credenciais do LinkedIn ao usuário
5. Testar o fluxo OAuth

