
-- ============================================
-- Affiliate Config (API credentials per user)
-- ============================================
CREATE TABLE public.affiliate_config (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  platform TEXT NOT NULL DEFAULT 'mercadolivre',
  app_id TEXT,
  client_secret TEXT,
  redirect_uri TEXT,
  access_token TEXT,
  refresh_token TEXT,
  token_expires_at TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN NOT NULL DEFAULT false,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (user_id, platform)
);

ALTER TABLE public.affiliate_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own affiliate config"
  ON public.affiliate_config FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own affiliate config"
  ON public.affiliate_config FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own affiliate config"
  ON public.affiliate_config FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "No client delete on affiliate_config"
  ON public.affiliate_config FOR DELETE TO authenticated
  USING (false);

CREATE TRIGGER update_affiliate_config_updated_at
  BEFORE UPDATE ON public.affiliate_config
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- ============================================
-- Affiliate Links (tracking)
-- ============================================
CREATE TABLE public.affiliate_links (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  original_url TEXT NOT NULL,
  short_url TEXT,
  product_id TEXT,
  platform TEXT NOT NULL DEFAULT 'mercadolivre',
  clicks INTEGER NOT NULL DEFAULT 0,
  conversions INTEGER NOT NULL DEFAULT 0,
  revenue_cents INTEGER NOT NULL DEFAULT 0,
  campaign_id UUID,
  content_id UUID,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.affiliate_links ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own affiliate links"
  ON public.affiliate_links FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own affiliate links"
  ON public.affiliate_links FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "No client update on affiliate_links"
  ON public.affiliate_links FOR UPDATE TO authenticated
  USING (false);

CREATE POLICY "No client delete on affiliate_links"
  ON public.affiliate_links FOR DELETE TO authenticated
  USING (false);

CREATE TRIGGER update_affiliate_links_updated_at
  BEFORE UPDATE ON public.affiliate_links
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

CREATE INDEX idx_affiliate_links_user_id ON public.affiliate_links (user_id);
CREATE INDEX idx_affiliate_links_product_id ON public.affiliate_links (product_id);
CREATE INDEX idx_affiliate_links_campaign_id ON public.affiliate_links (campaign_id);
