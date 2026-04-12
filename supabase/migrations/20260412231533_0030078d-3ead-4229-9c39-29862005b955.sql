-- Remove the overly permissive INSERT policy on audit_logs
DROP POLICY IF EXISTS "Users can insert own audit logs" ON public.audit_logs;