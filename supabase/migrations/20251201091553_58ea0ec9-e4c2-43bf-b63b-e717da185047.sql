-- Fix security issues from linter

-- Enable RLS on audit_log table
ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;

-- Enable RLS on message_templates table
ALTER TABLE public.message_templates ENABLE ROW LEVEL SECURITY;

-- RLS Policies for audit_log (staff only)
CREATE POLICY "Staff can view audit logs"
  ON public.audit_log FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'staff'));

CREATE POLICY "Staff can insert audit logs"
  ON public.audit_log FOR INSERT
  TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'staff'));

-- RLS Policies for message_templates (staff only)
CREATE POLICY "Staff can view message templates"
  ON public.message_templates FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'staff'));

CREATE POLICY "Staff can manage message templates"
  ON public.message_templates FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'staff'));

-- Fix get_follow_up_tasks function search path
CREATE OR REPLACE FUNCTION public.get_follow_up_tasks()
RETURNS TABLE(
  task_id uuid, 
  task_type text, 
  priority text, 
  task_status text, 
  risk_score numeric, 
  task_created_at timestamp with time zone, 
  completed_at timestamp with time zone, 
  patient_id uuid, 
  first_name text, 
  last_name text, 
  patient_phone text, 
  appointment_id uuid, 
  scheduled_start timestamp with time zone, 
  scheduled_end timestamp with time zone, 
  appointment_status text, 
  provider_name text, 
  location text
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    t.id AS task_id,
    t.type AS task_type,
    t.priority,
    t.status AS task_status,
    t.risk_score,
    t.created_at AS task_created_at,
    t.completed_at,
    p.id AS patient_id,
    p.first_name,
    p.last_name,
    p.phone AS patient_phone,
    a.id AS appointment_id,
    a.scheduled_start,
    a.scheduled_end,
    a.status AS appointment_status,
    a.provider_name,
    a.location
  FROM public.follow_up_tasks t
  JOIN public.patients p ON p.id = t.patient_id
  LEFT JOIN public.appointments a ON a.id = t.appointment_id
  ORDER BY t.created_at DESC;
$$;