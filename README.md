<p align="center">
  <img src="https://img.shields.io/badge/status-production-brightgreen?style=for-the-badge" alt="Status" />
  <img src="https://img.shields.io/badge/version-1.0.0-blue?style=for-the-badge" alt="Version" />
  <img src="https://img.shields.io/badge/license-proprietary-red?style=for-the-badge" alt="License" />
  <img src="https://img.shields.io/badge/typescript-strict-blue?style=for-the-badge&logo=typescript" alt="TypeScript" />
</p>

# ✨ Constellation Orchestra

> **Enterprise-grade Autonomous Digital Business Intelligence Platform**
> Orquestração omnichannel de marketing com IA, monetização autônoma e self-healing integrado.

---

## 📋 Table of Contents

- [Overview](#-overview)
- [Architecture](#-architecture)
- [Tech Stack](#-tech-stack)
- [Core Modules](#-core-modules)
- [Database Schema](#-database-schema)
- [Edge Functions](#-edge-functions)
- [Security](#-security)
- [Development Roadmap](#-development-roadmap)
- [Getting Started](#-getting-started)
- [Project Structure](#-project-structure)
- [Contributing](#-contributing)

---

## 🎯 Overview

**Constellation Orchestra** is a SaaS platform that transforms simple topics into fully monetized, multi-platform marketing campaigns. It acts as a **Harness** — a control mesh that orchestrates AI content generation, affiliate monetization (Mercado Livre), social media publishing, SEO optimization, and real-time ROI tracking.

### Core Value Proposition

```
1 Topic → 1 SEO Article (WordPress) + 1 B2B Post (LinkedIn) + 1 Thread (X/Twitter)
         + Affiliate Links (Mercado Livre) + UTM Auto-Tagging + ROI Dashboard
```

### Key Principles

| Principle | Description |
|-----------|-------------|
| **Set-and-Forget** | Autonomic computing — self-healing, self-optimization, self-configuration |
| **Zero-Trust Frontend** | All sensitive logic lives in Edge Functions; UI is a command panel only |
| **Cost-Aware Engineering** | Optimized API calls, aggressive caching, batch processing |
| **Mandatory Monetization** | Every piece of content includes affiliate links + UTM tracking |

---

## 🏗 Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                     FRONTEND (React + Vite)                     │
│  Landing │ Dashboard │ Constellation 3D │ Orchestration │ Admin │
└────────────────────────────┬────────────────────────────────────┘
                             │ Supabase SDK (anon key)
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                    CONTROL PLANE (Supabase)                      │
│                                                                   │
│  ┌──────────────┐  ┌──────────────┐  ┌────────────────────────┐ │
│  │  PostgreSQL   │  │  Edge Funcs   │  │   Storage (Private)    │ │
│  │  + RLS        │  │  (Deno)       │  │   Signed URLs only     │ │
│  └──────────────┘  └──────────────┘  └────────────────────────┘ │
│                                                                   │
│  ┌──────────────┐  ┌──────────────┐  ┌────────────────────────┐ │
│  │  Auth         │  │  Realtime     │  │   Secrets Vault        │ │
│  │  (JWT + RLS)  │  │  (WebSocket)  │  │   (API Keys)           │ │
│  └──────────────┘  └──────────────┘  └────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
                             │
              ┌──────────────┼──────────────┐
              ▼              ▼              ▼
        ┌──────────┐  ┌──────────┐  ┌──────────────┐
        │ Mercado   │  │ Social   │  │  WordPress   │
        │ Livre API │  │ APIs     │  │  REST API    │
        └──────────┘  └──────────┘  └──────────────┘
```

### Design Patterns

- **Harness Engineering (HE):** Strict separation of visual interface and operational intelligence via custom hooks
- **Single Responsibility Principle (SRP):** No monolithic files; every module has one job
- **Exponential Backoff + Idempotency:** All external API calls are retry-safe
- **Fallback-First:** If affiliate API fails → publish with organic link and log error; never break the pipeline

---

## 🛠 Tech Stack

### Frontend
| Technology | Purpose |
|------------|---------|
| React 18 | UI framework |
| TypeScript (Strict) | Type safety |
| Vite 5 | Build tooling |
| Tailwind CSS v3 | Utility-first styling |
| shadcn/ui + Radix | Component library |
| React Three Fiber | 3D constellation graph |
| Framer Motion | Animations |
| TanStack Query | Server state management |
| Zustand | Client state (crew store) |
| React Hook Form + Zod | Form validation |
| Recharts | Data visualization |

### Backend
| Technology | Purpose |
|------------|---------|
| Supabase (PostgreSQL) | Database + Auth + RLS |
| Edge Functions (Deno) | Serverless business logic |
| Supabase Storage | Private file storage (signed URLs) |
| Supabase Realtime | WebSocket subscriptions |

### External Integrations
| Service | Purpose |
|---------|---------|
| Stripe | Payments & subscriptions |
| Mercado Livre | Affiliate monetization |
| LinkedIn API | Social publishing |
| Twitter/X API | Social publishing |
| WordPress REST | Blog/article publishing |

---

## 📦 Core Modules

### 1. Content Orchestration Engine
The heart of the platform. Transforms a topic into a full omnichannel campaign.

```
orchestrate-content → generate-content (article) 
                    → generate-content (LinkedIn post)
                    → generate-content (X thread)
                    → generate-image (campaign visual)
                    → publish-wordpress
                    → schedule social posts
                    → attach affiliate links + UTMs
```

### 2. Affiliate Monetization (Mercado Livre)
- **`affiliate_config`** — Stores API credentials per user (app_id, client_secret, tokens)
- **`affiliate_links`** — Tracks original_url, short_url, clicks, conversions, revenue
- **`process-affiliate-link`** — Edge function for link generation (skeleton; CLI-ready)
- **Rule:** All content MUST include monetized links when config is active; fallback to organic

### 3. UTM Auto-Tagging
Every generated link is automatically tagged:
```
?utm_source={platform}&utm_medium=social&utm_campaign=magic_constellation_v1&utm_term={keyword}
```

### 4. 3D Agent Constellation
Interactive React Three Fiber visualization of the AI agent crew — nodes represent agents, edges represent data flows.

### 5. Self-Healing & Self-Optimization
- **Self-Healing:** Automatic retry with exponential backoff, token refresh, error logging to `healing_actions`
- **Self-Optimization:** Reallocates budget/credits to highest-performing platforms via `optimization_policy`

### 6. ROI Dashboard
Real-time metrics combining `campaign_metrics`, `usage_tracking`, and `affiliate_links`:
- Total clicks, CTR, conversions
- API cost vs. estimated revenue
- Per-platform performance breakdown

### 7. Campaign Management
Full CRUD lifecycle: draft → active → paused → completed → archived, with multi-platform targeting and budget tracking.

### 8. Content Library
AI-generated assets (text, image, audio, music, video, carousel) with versioning, favorites, and campaign association.

### 9. Social Publishing Pipeline
```
scheduled_posts (queued) → auto-publish (cron) → publish-social (API call)
                         → retry on failure → self-heal on token expiry
```

### 10. Admin Panel
Role-based access (admin/editor/viewer) with user management, audit logs, and usage tracking dashboards.

---

## 🗄 Database Schema

### Core Tables

| Table | Purpose | RLS |
|-------|---------|-----|
| `profiles` | User profile data | Owner + Admin read |
| `user_roles` | Role-based access (admin/editor/viewer) | Owner read; no client write |
| `subscriptions` | Stripe subscription state | Owner + Admin read; no client write |
| `credits` | Credit balance & lifetime tracking | Owner read; no client write |
| `campaigns` | Campaign lifecycle management | Owner CRUD |
| `campaign_metrics` | Performance metrics per campaign | Owner read/insert; no client update/delete |
| `content_library` | AI-generated content assets | Owner CRUD |
| `scheduled_posts` | Publication queue with retry logic | Owner CRUD |
| `social_accounts` | OAuth tokens (column-restricted) | Owner read/delete; no client insert/update |
| `affiliate_config` | Mercado Livre API credentials | Owner read/insert/update; RESTRICTIVE no delete |
| `affiliate_links` | Affiliate tracking & revenue | Owner read/insert; RESTRICTIVE no update/delete |
| `audit_logs` | Security audit trail | Owner + Admin read; no client insert |
| `usage_tracking` | API credit consumption | Owner + Admin read; no client write |
| `notifications` | In-app notification system | Owner read/update/delete; no client insert |
| `optimization_policy` | Self-optimization decisions | Owner read/insert; no client update/delete |
| `healing_actions` | Self-healing event log | Owner read/insert; no client update/delete |
| `crew_agents` | AI agent definitions | Owner CRUD |
| `crew_edges` | Agent-to-agent connections | Owner CRUD |

### Security Model
- **RLS enabled on ALL tables** — default deny
- **Sensitive columns** (`access_token`, `refresh_token`, `stripe_*`) restricted at column-level
- **Storage buckets** are private; files served via short-lived signed URLs
- **RESTRICTIVE policies** used for hard-deny rules (e.g., preventing client-side deletes on financial data)

---

## ⚡ Edge Functions

| Function | Purpose | Auth |
|----------|---------|------|
| `orchestrate-content` | Full campaign generation pipeline | JWT required |
| `generate-content` | AI text generation (article, post, thread) | JWT required |
| `generate-image` | AI image generation → private storage | JWT required |
| `generate-audio-script` | Audio/TTS script generation | JWT required |
| `generate-video-script` | Video script generation | JWT required |
| `publish-wordpress` | WordPress article publishing | JWT required |
| `publish-social` | Social media post publishing | JWT required |
| `auto-publish` | Cron-triggered scheduled post publisher | Service role |
| `process-affiliate-link` | Mercado Livre affiliate link processing (skeleton) | JWT required |
| `create-checkout` | Stripe checkout session creation | JWT required |
| `create-portal` | Stripe customer portal | JWT required |
| `stripe-webhook` | Stripe event handler | Webhook signature |
| `check-subscription` | Subscription status validation | JWT required |
| `social-auth-init` | OAuth flow initiation (LinkedIn/X) | JWT required |
| `social-auth-callback` | OAuth callback handler | Public (state validation) |
| `refresh-social-token` | Token refresh for social accounts | Service role |
| `analyze-seo` | SEO analysis engine | JWT required |
| `analyze-sem` | SEM/paid search analysis | JWT required |
| `optimize-schedule` | AI-powered schedule optimization | JWT required |
| `self-heal` | Automatic error recovery | Service role |
| `self-optimize` | Performance-based auto-optimization | Service role |

---

## 🔒 Security

- **Row Level Security (RLS)** on every table with owner-scoped policies
- **Column-level restrictions** on sensitive fields (tokens, Stripe IDs)
- **RESTRICTIVE policies** for hard-deny rules on financial/affiliate data
- **Private storage buckets** with signed URL access only
- **Edge Functions** for all sensitive operations (no secrets in client code)
- **SECURITY DEFINER** function `has_role()` for recursive-safe admin checks
- **Audit logging** for admin actions
- **Self-healing** token refresh and retry mechanisms

---

## 🗺 Development Roadmap

| Phase | Description | Status |
|-------|-------------|--------|
| 1 | Backend Foundation (Supabase + RLS + Auth) | ✅ Complete |
| 2 | Landing Page + Branding | ✅ Complete |
| 3 | Stripe + Monetization | ✅ Complete |
| 4 | Dashboard Principal | ✅ Complete |
| 5 | Campaign CRUD | ✅ Complete |
| 6 | LinkedIn + Instagram Integration | ✅ Complete |
| 7 | Content Library + AI Generation | ✅ Complete |
| 8 | Facebook + Twitter/X Integration | ✅ Complete |
| 9 | Publication Calendar + Agent CRUD | ✅ Complete |
| 10 | Image Generation + DnD Calendar + Constellation Edges | ✅ Complete |
| 11 | Audio & Music Generation | ✅ Complete |
| 12 | Video Generation + TTS Player | ✅ Complete |
| 13 | Smart Scheduler + Orchestrator + Video Editor | ✅ Complete |
| 14 | SEO Engine + Analytics Dashboard | ✅ Complete |
| 15 | SEM Engine + Demo Metrics | ✅ Complete |
| 16 | Self-Optimization + Campaign Comparison | ✅ Complete |
| 17 | Self-Healing + Optimization History | ✅ Complete |
| 18 | WordPress + Blog Engine + Cron Self-Heal | ✅ Complete |
| 19 | Polish + Enterprise (Onboarding, Admin, Breadcrumbs, Code Splitting) | ✅ Complete |
| 20 | Final Deploy (SEO, Security, Domain) | ✅ Complete |
| 21 | Affiliate Monetization Module (Mercado Livre) | ✅ Complete |

---

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ or Bun
- Supabase project (managed via Lovable Cloud)

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd constellation-orchestra

# Install dependencies
bun install   # or npm install

# Start development server
bun dev       # or npm run dev
```

### Environment Variables

Managed automatically by Lovable Cloud:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_PUBLISHABLE_KEY`
- `VITE_SUPABASE_PROJECT_ID`

### Edge Function Secrets (configured in Lovable Cloud)

| Secret | Purpose |
|--------|---------|
| `STRIPE_SECRET_KEY` | Payment processing |
| `TWITTER_CLIENT_ID` / `TWITTER_CLIENT_SECRET` | X/Twitter OAuth |
| `LINKEDIN_CLIENT_ID` / `LINKEDIN_CLIENT_SECRET` | LinkedIn OAuth |
| `LOVABLE_API_KEY` | AI content generation |

---

## 📁 Project Structure

```
constellation-orchestra/
├── src/
│   ├── components/
│   │   ├── dashboard/       # Dashboard widgets (ROI, Constellation, Sidebar)
│   │   ├── graph/           # 3D constellation (AgentNode, AgentEdge, CrewGraph)
│   │   ├── gestures/        # Hand tracking & gesture controls
│   │   ├── landing/         # Landing page sections
│   │   ├── panels/          # Config, logs, agent detail panels
│   │   └── ui/              # shadcn/ui component library
│   ├── hooks/               # Custom hooks (Harness Engineering pattern)
│   │   ├── useAuth.ts
│   │   ├── useCrewData.ts
│   │   ├── useCampaigns.ts
│   │   ├── useAffiliateConfig.ts
│   │   ├── useSubscription.ts
│   │   └── ...
│   ├── pages/               # Route pages (lazy-loaded)
│   ├── store/               # Zustand stores
│   ├── integrations/        # Auto-generated Supabase client & types
│   └── lib/                 # Utilities
├── supabase/
│   ├── functions/           # Edge Functions (Deno)
│   │   ├── orchestrate-content/
│   │   ├── generate-content/
│   │   ├── generate-image/
│   │   ├── process-affiliate-link/
│   │   ├── publish-wordpress/
│   │   ├── publish-social/
│   │   ├── self-heal/
│   │   ├── self-optimize/
│   │   └── ...
│   ├── migrations/          # SQL migrations (auto-managed)
│   └── config.toml          # Supabase project configuration
├── public/                  # Static assets
└── package.json
```

---

## 🤝 Contributing

### Code Standards

- **Language:** Code, variables, comments, logs → **English only**
- **UI:** Interface, validation messages, toasts → **Portuguese (Brazil) only**
- **TypeScript:** Strict mode; explicit types for all props, API responses, and payloads
- **Architecture:** Harness Engineering — hooks for logic, components for display
- **Modularity:** SRP enforced; no monolithic files
- **Naming:** `PascalCase` (components/interfaces), `camelCase` (functions/variables), `UPPER_SNAKE_CASE` (constants/env vars)

### Commit Convention

```
feat: add affiliate link processing
fix: resolve RLS policy on campaign_metrics
refactor: extract useAffiliateConfig hook
chore: update dependencies
```

---

<p align="center">
  Built with <a href="https://lovable.dev">Lovable</a> · Powered by Supabase · Designed for Scale
</p>
