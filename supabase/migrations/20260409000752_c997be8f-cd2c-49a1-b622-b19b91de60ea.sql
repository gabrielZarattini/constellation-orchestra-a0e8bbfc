
-- Allow service role to update subscriptions (webhook needs this)
-- The existing RLS policies only allow SELECT and INSERT for authenticated users
-- We need UPDATE policy for the service role operations
-- Service role bypasses RLS, so no policy change needed for that

-- However, let's also add a policy so users can see updated subscription data
-- (already covered by existing SELECT policy)

-- Add update trigger for subscriptions
CREATE TRIGGER update_subscriptions_updated_at
BEFORE UPDATE ON public.subscriptions
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();

-- Add update trigger for credits
CREATE TRIGGER update_credits_updated_at
BEFORE UPDATE ON public.credits
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();
