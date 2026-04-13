-- Remove client-side INSERT policy on user_roles (role assignment should only happen via service role / triggers)
DROP POLICY IF EXISTS "Only admins can insert roles" ON public.user_roles;

-- Remove client-side UPDATE policy on user_roles (role changes should only happen via service role)
DROP POLICY IF EXISTS "Admins can update roles" ON public.user_roles;

-- Remove client-side DELETE policy on user_roles (role removal should only happen via service role)
DROP POLICY IF EXISTS "Admins can delete roles" ON public.user_roles;