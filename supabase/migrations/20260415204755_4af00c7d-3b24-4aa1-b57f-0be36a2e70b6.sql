
-- Fix affiliate_config: drop permissive, recreate as restrictive
DROP POLICY IF EXISTS "No client delete on affiliate_config" ON public.affiliate_config;
CREATE POLICY "No client delete on affiliate_config"
  ON public.affiliate_config
  AS RESTRICTIVE
  FOR DELETE
  TO authenticated
  USING (false);

-- Fix affiliate_links: drop permissive, recreate as restrictive
DROP POLICY IF EXISTS "No client delete on affiliate_links" ON public.affiliate_links;
CREATE POLICY "No client delete on affiliate_links"
  ON public.affiliate_links
  AS RESTRICTIVE
  FOR DELETE
  TO authenticated
  USING (false);

-- Also fix affiliate_links update policy (same issue)
DROP POLICY IF EXISTS "No client update on affiliate_links" ON public.affiliate_links;
CREATE POLICY "No client update on affiliate_links"
  ON public.affiliate_links
  AS RESTRICTIVE
  FOR UPDATE
  TO authenticated
  USING (false);
