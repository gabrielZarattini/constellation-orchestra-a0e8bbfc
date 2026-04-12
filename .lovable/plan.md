

# Plano: Fase 19 — Polish + Enterprise

## Escopo

Quatro entregas: (A) Onboarding guiado para novos usuários, (B) Painel de administração, (C) Revisão de UX (lazy loading, breadcrumbs, empty states), (D) Otimização de performance (code splitting, lazy routes).

## 1. Onboarding Guiado

### Lógica
- `profiles.onboarding_completed` já existe (default `false`)
- Criar componente `OnboardingWizard.tsx` — modal/dialog com 4 steps:
  1. "Bem-vindo!" — nome/empresa (atualiza `profiles`)
  2. "Conecte uma rede social" — link para `/dashboard/social`
  3. "Crie sua primeira campanha" — link para `/dashboard/campaigns/new`
  4. "Explore a Constelação" — link para `/dashboard/constellation`
- Exibido no `DashboardHome` quando `onboarding_completed === false`
- Botão "Pular" marca `onboarding_completed = true`
- Ao completar o último step, marca automaticamente

### Arquivos
| Arquivo | Ação |
|---------|------|
| `src/components/dashboard/OnboardingWizard.tsx` | Criar |
| `src/pages/DashboardHome.tsx` | Editar (importar wizard, fetch profile) |

## 2. Painel de Administração

### Migration
- Nenhuma nova tabela — usa `user_roles` (role `admin`), `profiles`, `subscriptions`, `audit_logs`, `usage_tracking`

### Frontend
- Criar `src/pages/AdminPage.tsx` com tabs:
  - **Usuários**: lista de `profiles` + `user_roles` + `subscriptions` (somente leitura via RLS — precisa de RLS policy para admins)
  - **Auditoria**: lista de `audit_logs` com filtros
  - **Uso**: aggregação de `usage_tracking`
- Rota: `/dashboard/admin` (protegida por role check)
- Item no sidebar visível apenas para admins

### RLS Policies (migration)
- `profiles`: admin pode SELECT todos
- `audit_logs`: admin pode SELECT todos
- `usage_tracking`: admin pode SELECT todos
- `subscriptions`: admin pode SELECT todos

### Arquivos
| Arquivo | Ação |
|---------|------|
| `src/pages/AdminPage.tsx` | Criar |
| `src/hooks/useAdminData.ts` | Criar |
| `src/App.tsx` | Editar (rota admin) |
| `src/components/dashboard/DashboardSidebar.tsx` | Editar (item admin condicional) |

## 3. Revisão de UX

- **Empty states**: Adicionar ilustrações/mensagens amigáveis em `CampaignsPage`, `ContentLibraryPage`, `CalendarPage` quando sem dados (já podem ter, verificar e padronizar)
- **Breadcrumbs**: Adicionar breadcrumb no `DashboardLayout` header baseado no path atual
- **Feedback visual**: Garantir que todos os botões de ação têm loading states

### Arquivos
| Arquivo | Ação |
|---------|------|
| `src/components/dashboard/DashboardLayout.tsx` | Editar (breadcrumbs no header) |

## 4. Otimização de Performance

- **Lazy loading de rotas**: Converter todas as páginas para `React.lazy()` + `Suspense` no `App.tsx`
- Reduz bundle inicial significativamente

### Arquivos
| Arquivo | Ação |
|---------|------|
| `src/App.tsx` | Editar (lazy imports + Suspense) |

## Detalhes Técnicos

- Admin check usa `has_role(auth.uid(), 'admin')` já existente
- RLS policies para admin usam a mesma função `has_role`
- Onboarding lê/atualiza `profiles` via Supabase client
- Lazy loading usa `React.lazy` + `Suspense` nativo do React 18
- Migration necessária apenas para RLS policies de admin (SELECT em profiles, audit_logs, usage_tracking, subscriptions)

## Ordem de Execução
1. Migration: RLS policies para admin
2. Criar OnboardingWizard + integrar no DashboardHome
3. Criar AdminPage + hook + rota + sidebar
4. Breadcrumbs no DashboardLayout
5. Lazy loading de rotas no App.tsx
6. Atualizar roadmap (Fase 19 ✅)

