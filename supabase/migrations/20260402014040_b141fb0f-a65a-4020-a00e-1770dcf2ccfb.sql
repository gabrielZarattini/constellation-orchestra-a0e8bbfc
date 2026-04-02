
-- =============================================
-- FASE 1: MAGIC CREW — ALL TABLES + RLS + AUTH
-- =============================================

-- 1. ENUM TYPES
CREATE TYPE public.app_role AS ENUM ('admin', 'editor', 'viewer');
CREATE TYPE public.campaign_status AS ENUM ('draft', 'active', 'paused', 'completed', 'archived');
CREATE TYPE public.content_type AS ENUM ('text', 'image', 'audio', 'music', 'video', 'carousel');
CREATE TYPE public.content_status AS ENUM ('draft', 'approved', 'published', 'archived');
CREATE TYPE public.post_status AS ENUM ('queued', 'publishing', 'published', 'failed', 'cancelled');
CREATE TYPE public.social_platform AS ENUM ('linkedin', 'instagram', 'facebook', 'twitter', 'tiktok', 'youtube', 'pinterest', 'wordpress');
CREATE TYPE public.notification_type AS ENUM ('info', 'warning', 'error', 'success');
CREATE TYPE public.subscription_status AS ENUM ('trialing', 'active', 'past_due', 'canceled', 'unpaid');

-- 2. PROFILES
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  avatar_url TEXT,
  company TEXT,
  website TEXT,
  timezone TEXT DEFAULT 'America/Sao_Paulo',
  language TEXT DEFAULT 'pt-BR',
  onboarding_completed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 3. USER ROLES (separate table per security guidelines)
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL DEFAULT 'viewer',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, role)
);
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- 4. SUBSCRIPTIONS
CREATE TABLE public.subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  plan TEXT NOT NULL DEFAULT 'free',
  status subscription_status NOT NULL DEFAULT 'trialing',
  trial_ends_at TIMESTAMPTZ,
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  cancel_at_period_end BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

-- 5. CREDITS
CREATE TABLE public.credits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  balance INTEGER NOT NULL DEFAULT 100,
  lifetime_earned INTEGER NOT NULL DEFAULT 100,
  lifetime_spent INTEGER NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.credits ENABLE ROW LEVEL SECURITY;

-- 6. USAGE TRACKING
CREATE TABLE public.usage_tracking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  resource_type TEXT NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  credits_consumed INTEGER NOT NULL DEFAULT 0,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.usage_tracking ENABLE ROW LEVEL SECURITY;

-- 7. SOCIAL ACCOUNTS
CREATE TABLE public.social_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  platform social_platform NOT NULL,
  platform_user_id TEXT,
  platform_username TEXT,
  access_token TEXT,
  refresh_token TEXT,
  token_expires_at TIMESTAMPTZ,
  scopes TEXT[],
  is_active BOOLEAN DEFAULT TRUE,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.social_accounts ENABLE ROW LEVEL SECURITY;

-- 8. CAMPAIGNS
CREATE TABLE public.campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  objective TEXT,
  target_audience JSONB DEFAULT '{}',
  platforms social_platform[] DEFAULT '{}',
  budget_cents INTEGER DEFAULT 0,
  status campaign_status NOT NULL DEFAULT 'draft',
  starts_at TIMESTAMPTZ,
  ends_at TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.campaigns ENABLE ROW LEVEL SECURITY;

-- 9. CAMPAIGN METRICS
CREATE TABLE public.campaign_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID NOT NULL REFERENCES public.campaigns(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  platform social_platform,
  impressions INTEGER DEFAULT 0,
  clicks INTEGER DEFAULT 0,
  engagements INTEGER DEFAULT 0,
  conversions INTEGER DEFAULT 0,
  spend_cents INTEGER DEFAULT 0,
  ctr NUMERIC(5,4) DEFAULT 0,
  measured_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.campaign_metrics ENABLE ROW LEVEL SECURITY;

-- 10. CONTENT LIBRARY
CREATE TABLE public.content_library (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  campaign_id UUID REFERENCES public.campaigns(id) ON DELETE SET NULL,
  type content_type NOT NULL,
  title TEXT,
  body TEXT,
  media_url TEXT,
  thumbnail_url TEXT,
  status content_status NOT NULL DEFAULT 'draft',
  tags TEXT[] DEFAULT '{}',
  ai_model TEXT,
  ai_prompt TEXT,
  metadata JSONB DEFAULT '{}',
  version INTEGER DEFAULT 1,
  is_favorite BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.content_library ENABLE ROW LEVEL SECURITY;

-- 11. SCHEDULED POSTS
CREATE TABLE public.scheduled_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content_id UUID REFERENCES public.content_library(id) ON DELETE SET NULL,
  campaign_id UUID REFERENCES public.campaigns(id) ON DELETE SET NULL,
  social_account_id UUID REFERENCES public.social_accounts(id) ON DELETE SET NULL,
  platform social_platform NOT NULL,
  scheduled_at TIMESTAMPTZ NOT NULL,
  published_at TIMESTAMPTZ,
  status post_status NOT NULL DEFAULT 'queued',
  platform_post_id TEXT,
  error_message TEXT,
  retry_count INTEGER DEFAULT 0,
  max_retries INTEGER DEFAULT 3,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.scheduled_posts ENABLE ROW LEVEL SECURITY;

-- 12. OPTIMIZATION POLICY
CREATE TABLE public.optimization_policy (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  campaign_id UUID REFERENCES public.campaigns(id) ON DELETE SET NULL,
  action_type TEXT NOT NULL,
  action_details JSONB NOT NULL DEFAULT '{}',
  reward NUMERIC(8,4) DEFAULT 0,
  context JSONB DEFAULT '{}',
  applied BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.optimization_policy ENABLE ROW LEVEL SECURITY;

-- 13. HEALING ACTIONS
CREATE TABLE public.healing_actions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  issue_type TEXT NOT NULL,
  issue_details TEXT,
  action_taken TEXT NOT NULL,
  success BOOLEAN DEFAULT FALSE,
  related_resource_type TEXT,
  related_resource_id UUID,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.healing_actions ENABLE ROW LEVEL SECURITY;

-- 14. AUDIT LOGS
CREATE TABLE public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  resource_type TEXT NOT NULL,
  resource_id UUID,
  details JSONB DEFAULT '{}',
  ip_address TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- 15. NOTIFICATIONS
CREATE TABLE public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type notification_type NOT NULL DEFAULT 'info',
  title TEXT NOT NULL,
  message TEXT,
  read BOOLEAN DEFAULT FALSE,
  action_url TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- =============================================
-- SECURITY DEFINER FUNCTION FOR ROLE CHECKS
-- =============================================
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- =============================================
-- RLS POLICIES
-- =============================================

-- PROFILES
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- USER ROLES
CREATE POLICY "Users can view own roles" ON public.user_roles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins can manage roles" ON public.user_roles FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- SUBSCRIPTIONS
CREATE POLICY "Users can view own subscription" ON public.subscriptions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own subscription" ON public.subscriptions FOR INSERT WITH CHECK (auth.uid() = user_id);

-- CREDITS
CREATE POLICY "Users can view own credits" ON public.credits FOR SELECT USING (auth.uid() = user_id);

-- USAGE TRACKING
CREATE POLICY "Users can view own usage" ON public.usage_tracking FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own usage" ON public.usage_tracking FOR INSERT WITH CHECK (auth.uid() = user_id);

-- SOCIAL ACCOUNTS
CREATE POLICY "Users can view own social accounts" ON public.social_accounts FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own social accounts" ON public.social_accounts FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own social accounts" ON public.social_accounts FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own social accounts" ON public.social_accounts FOR DELETE USING (auth.uid() = user_id);

-- CAMPAIGNS
CREATE POLICY "Users can view own campaigns" ON public.campaigns FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create campaigns" ON public.campaigns FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own campaigns" ON public.campaigns FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own campaigns" ON public.campaigns FOR DELETE USING (auth.uid() = user_id);

-- CAMPAIGN METRICS
CREATE POLICY "Users can view own metrics" ON public.campaign_metrics FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own metrics" ON public.campaign_metrics FOR INSERT WITH CHECK (auth.uid() = user_id);

-- CONTENT LIBRARY
CREATE POLICY "Users can view own content" ON public.content_library FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create content" ON public.content_library FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own content" ON public.content_library FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own content" ON public.content_library FOR DELETE USING (auth.uid() = user_id);

-- SCHEDULED POSTS
CREATE POLICY "Users can view own posts" ON public.scheduled_posts FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create posts" ON public.scheduled_posts FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own posts" ON public.scheduled_posts FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own posts" ON public.scheduled_posts FOR DELETE USING (auth.uid() = user_id);

-- OPTIMIZATION POLICY
CREATE POLICY "Users can view own policies" ON public.optimization_policy FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own policies" ON public.optimization_policy FOR INSERT WITH CHECK (auth.uid() = user_id);

-- HEALING ACTIONS
CREATE POLICY "Users can view own healing actions" ON public.healing_actions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own healing actions" ON public.healing_actions FOR INSERT WITH CHECK (auth.uid() = user_id);

-- AUDIT LOGS
CREATE POLICY "Users can view own audit logs" ON public.audit_logs FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own audit logs" ON public.audit_logs FOR INSERT WITH CHECK (auth.uid() = user_id);

-- NOTIFICATIONS
CREATE POLICY "Users can view own notifications" ON public.notifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own notifications" ON public.notifications FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own notifications" ON public.notifications FOR UPDATE USING (auth.uid() = user_id);

-- =============================================
-- TRIGGERS: auto updated_at
-- =============================================
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.subscriptions FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.social_accounts FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.campaigns FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.content_library FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.scheduled_posts FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- =============================================
-- TRIGGER: auto-create profile + credits on signup
-- =============================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', ''),
    COALESCE(NEW.raw_user_meta_data->>'avatar_url', '')
  );
  
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'viewer');
  
  INSERT INTO public.credits (user_id, balance, lifetime_earned)
  VALUES (NEW.id, 100, 100);
  
  INSERT INTO public.subscriptions (user_id, plan, status, trial_ends_at)
  VALUES (NEW.id, 'free', 'trialing', now() + INTERVAL '14 days');
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
