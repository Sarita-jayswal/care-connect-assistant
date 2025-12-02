-- Allow staff to delete audit logs
CREATE POLICY "Staff can delete audit logs"
ON public.audit_log
FOR DELETE
TO authenticated
USING (has_role(auth.uid(), 'staff'::app_role));