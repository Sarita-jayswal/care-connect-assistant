-- Allow staff to delete appointments
CREATE POLICY "Staff can delete appointments"
ON public.appointments
FOR DELETE
USING (has_role(auth.uid(), 'staff'::app_role));

-- Allow staff to delete patients
CREATE POLICY "Staff can delete patients"
ON public.patients
FOR DELETE
USING (has_role(auth.uid(), 'staff'::app_role));