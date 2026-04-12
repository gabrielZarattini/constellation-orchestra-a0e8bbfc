
-- Admin can SELECT all profiles
CREATE POLICY "Admins can view all profiles"
ON public.profiles
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Admin can SELECT all audit_logs
CREATE POLICY "Admins can view all audit logs"
ON public.audit_logs
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Admin can SELECT all usage_tracking
CREATE POLICY "Admins can view all usage tracking"
ON public.usage_tracking
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Admin can SELECT all subscriptions
CREATE POLICY "Admins can view all subscriptions"
ON public.subscriptions
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Admin can view all user_roles
CREATE POLICY "Admins can view all roles"
ON public.user_roles
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));
