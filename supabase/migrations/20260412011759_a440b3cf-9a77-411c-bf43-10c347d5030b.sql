-- Drop existing UPDATE policy and recreate with WITH CHECK
DROP POLICY IF EXISTS "Users can update own social accounts" ON public.social_accounts;

CREATE POLICY "Users can update own social accounts"
ON public.social_accounts
FOR UPDATE
TO public
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);
