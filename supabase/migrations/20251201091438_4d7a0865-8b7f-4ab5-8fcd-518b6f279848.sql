-- Add user_id column to users table (for staff)
ALTER TABLE public.users ADD COLUMN user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE;

-- Add user_id column to patients table
ALTER TABLE public.patients ADD COLUMN user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE;

-- Create enum for user roles
CREATE TYPE public.app_role AS ENUM ('staff', 'patient');

-- Create user_roles table for role-based access control
CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  UNIQUE (user_id, role)
);

-- Enable RLS on user_roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Create security definer function to check user role
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Enable RLS on all main tables
ALTER TABLE public.patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.follow_up_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- RLS Policies for patients table
-- Staff can see all patients
CREATE POLICY "Staff can view all patients"
  ON public.patients FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'staff'));

-- Patients can only see their own record
CREATE POLICY "Patients can view own record"
  ON public.patients FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- RLS Policies for appointments table
-- Staff can see all appointments
CREATE POLICY "Staff can view all appointments"
  ON public.appointments FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'staff'));

-- Patients can only see their own appointments
CREATE POLICY "Patients can view own appointments"
  ON public.appointments FOR SELECT
  TO authenticated
  USING (
    patient_id IN (
      SELECT id FROM public.patients WHERE user_id = auth.uid()
    )
  );

-- RLS Policies for follow_up_tasks table
-- Staff can view and update all tasks
CREATE POLICY "Staff can view all tasks"
  ON public.follow_up_tasks FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'staff'));

CREATE POLICY "Staff can update all tasks"
  ON public.follow_up_tasks FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'staff'));

-- Patients can only view their own tasks
CREATE POLICY "Patients can view own tasks"
  ON public.follow_up_tasks FOR SELECT
  TO authenticated
  USING (
    patient_id IN (
      SELECT id FROM public.patients WHERE user_id = auth.uid()
    )
  );

-- RLS Policies for messages table
-- Staff can view all messages
CREATE POLICY "Staff can view all messages"
  ON public.messages FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'staff'));

-- Patients can only view their own messages
CREATE POLICY "Patients can view own messages"
  ON public.messages FOR SELECT
  TO authenticated
  USING (
    patient_id IN (
      SELECT id FROM public.patients WHERE user_id = auth.uid()
    )
  );

-- RLS Policies for users table (staff only)
CREATE POLICY "Staff can view all staff users"
  ON public.users FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'staff'));

-- Create trigger function to automatically create user_roles entry
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Role will be assigned based on metadata passed during signup
  IF NEW.raw_user_meta_data->>'role' IS NOT NULL THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, (NEW.raw_user_meta_data->>'role')::app_role);
  END IF;
  RETURN NEW;
END;
$$;

-- Trigger to auto-create user_roles on auth user creation
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();