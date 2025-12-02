-- Add RLS policy to allow staff to delete follow-up tasks
CREATE POLICY "Staff can delete tasks"
ON public.follow_up_tasks
FOR DELETE
TO authenticated
USING (has_role(auth.uid(), 'staff'::app_role));