
-- 1. Credits: explicitly block all client-side writes
CREATE POLICY "No client insert on credits"
  ON public.credits AS RESTRICTIVE
  FOR INSERT TO authenticated
  WITH CHECK (false);

CREATE POLICY "No client update on credits"
  ON public.credits AS RESTRICTIVE
  FOR UPDATE TO authenticated
  USING (false);

CREATE POLICY "No client delete on credits"
  ON public.credits AS RESTRICTIVE
  FOR DELETE TO authenticated
  USING (false);

-- 2. User roles: explicitly block all client-side writes
CREATE POLICY "No client insert on user_roles"
  ON public.user_roles AS RESTRICTIVE
  FOR INSERT TO authenticated
  WITH CHECK (false);

CREATE POLICY "No client update on user_roles"
  ON public.user_roles AS RESTRICTIVE
  FOR UPDATE TO authenticated
  USING (false);

CREATE POLICY "No client delete on user_roles"
  ON public.user_roles AS RESTRICTIVE
  FOR DELETE TO authenticated
  USING (false);

-- 3. Social accounts: remove broad client write policies and restrict writes to service role only
DROP POLICY IF EXISTS "Users can manage own social accounts" ON public.social_accounts;
DROP POLICY IF EXISTS "Users can update own social accounts" ON public.social_accounts;

-- Re-add restrictive write policies: block all client inserts/updates (only edge functions via service role should write tokens)
CREATE POLICY "No client insert on social_accounts"
  ON public.social_accounts AS RESTRICTIVE
  FOR INSERT TO authenticated
  WITH CHECK (false);

CREATE POLICY "No client update on social_accounts"
  ON public.social_accounts AS RESTRICTIVE
  FOR UPDATE TO authenticated
  USING (false);
