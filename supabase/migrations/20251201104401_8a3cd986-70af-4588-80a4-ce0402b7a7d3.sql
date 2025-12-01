-- Create table for storing patient invitation tokens
CREATE TABLE IF NOT EXISTS public.patient_invitations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id uuid NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  token text NOT NULL UNIQUE,
  expires_at timestamp with time zone NOT NULL,
  used_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.patient_invitations ENABLE ROW LEVEL SECURITY;

-- Allow staff to view all invitations
CREATE POLICY "Staff can view all invitations"
ON public.patient_invitations
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'staff'::app_role));

-- Allow staff to insert invitations
CREATE POLICY "Staff can create invitations"
ON public.patient_invitations
FOR INSERT
TO authenticated
WITH CHECK (has_role(auth.uid(), 'staff'::app_role));

-- Allow anyone to update invitations (for activation)
CREATE POLICY "Anyone can mark invitation as used"
ON public.patient_invitations
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

-- Update patients table RLS to allow staff to insert
CREATE POLICY "Staff can insert patients"
ON public.patients
FOR INSERT
TO authenticated
WITH CHECK (has_role(auth.uid(), 'staff'::app_role));

-- Update patients table RLS to allow staff to update
CREATE POLICY "Staff can update patients"
ON public.patients
FOR UPDATE
TO authenticated
USING (has_role(auth.uid(), 'staff'::app_role))
WITH CHECK (has_role(auth.uid(), 'staff'::app_role));

-- Create index for faster token lookups
CREATE INDEX idx_patient_invitations_token ON public.patient_invitations(token);
CREATE INDEX idx_patient_invitations_patient_id ON public.patient_invitations(patient_id);