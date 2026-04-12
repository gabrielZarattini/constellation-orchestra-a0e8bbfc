
-- 1. FIX CRITICAL: user_roles privilege escalation
-- Remove the overly permissive ALL policy
DROP POLICY IF EXISTS "Admins can manage roles" ON public.user_roles;

-- Add restricted admin policies (no INSERT for regular users)
CREATE POLICY "Admins can update roles"
ON public.user_roles
FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete roles"
ON public.user_roles
FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- 2. FIX: Remove user INSERT on subscriptions (only service_role/webhooks should manage)
DROP POLICY IF EXISTS "Users can insert own subscription" ON public.subscriptions;

-- 3. FIX: Remove user INSERT on usage_tracking (only service_role should track)
DROP POLICY IF EXISTS "Users can insert own usage" ON public.usage_tracking;
