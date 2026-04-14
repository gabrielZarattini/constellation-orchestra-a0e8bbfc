-- Block UPDATE/DELETE on optimization_policy from clients
CREATE POLICY "No client update on optimization_policy"
ON public.optimization_policy AS RESTRICTIVE
FOR UPDATE TO authenticated
USING (false);

CREATE POLICY "No client delete on optimization_policy"
ON public.optimization_policy AS RESTRICTIVE
FOR DELETE TO authenticated
USING (false);

-- Hide Stripe IDs from client: revoke full SELECT, re-grant safe columns
REVOKE SELECT ON public.subscriptions FROM authenticated, anon;
GRANT SELECT (id, user_id, plan, status, trial_ends_at, current_period_start, current_period_end, cancel_at_period_end, created_at, updated_at) ON public.subscriptions TO authenticated, anon;