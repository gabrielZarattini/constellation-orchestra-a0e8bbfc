CREATE POLICY "No client insert on audit_logs"
ON public.audit_logs
AS RESTRICTIVE
FOR INSERT
TO authenticated
WITH CHECK (false);