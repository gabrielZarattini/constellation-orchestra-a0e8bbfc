-- Block client-side INSERT on notifications (should only be done by service role / edge functions)
DROP POLICY IF EXISTS "Users can insert own notifications" ON public.notifications;

CREATE POLICY "No client insert on notifications"
  ON public.notifications
  AS RESTRICTIVE
  FOR INSERT
  TO authenticated
  WITH CHECK (false);