-- Add missing RLS policies for staff to insert and update appointments
CREATE POLICY "Staff can insert appointments"
ON public.appointments
FOR INSERT
TO authenticated
WITH CHECK (has_role(auth.uid(), 'staff'::app_role));

CREATE POLICY "Staff can update appointments"
ON public.appointments
FOR UPDATE
TO authenticated
USING (has_role(auth.uid(), 'staff'::app_role));