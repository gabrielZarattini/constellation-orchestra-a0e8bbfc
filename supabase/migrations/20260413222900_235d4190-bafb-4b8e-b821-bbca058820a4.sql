-- 1. Revoke column-level SELECT on token columns from client roles
REVOKE SELECT (access_token, refresh_token) ON public.social_accounts FROM anon, authenticated;

-- 2. Add explicit deny policies for campaign_metrics UPDATE/DELETE
CREATE POLICY "No client update on campaign_metrics"
  ON public.campaign_metrics
  AS RESTRICTIVE
  FOR UPDATE
  TO authenticated
  USING (false);

CREATE POLICY "No client delete on campaign_metrics"
  ON public.campaign_metrics
  AS RESTRICTIVE
  FOR DELETE
  TO authenticated
  USING (false);