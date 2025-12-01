-- Create notifications table for staff alerts
CREATE TABLE public.notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('urgent_task', 'missed_appointment', 'patient_message')),
  related_id UUID,
  is_read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Policy: Staff can view their own notifications
CREATE POLICY "Staff can view own notifications"
ON public.notifications
FOR SELECT
USING (user_id = auth.uid() AND has_role(auth.uid(), 'staff'::app_role));

-- Policy: Staff can update their own notifications (mark as read)
CREATE POLICY "Staff can update own notifications"
ON public.notifications
FOR UPDATE
USING (user_id = auth.uid() AND has_role(auth.uid(), 'staff'::app_role))
WITH CHECK (user_id = auth.uid() AND has_role(auth.uid(), 'staff'::app_role));

-- Policy: System can insert notifications for staff
CREATE POLICY "System can insert notifications"
ON public.notifications
FOR INSERT
WITH CHECK (true);

-- Create index for faster queries
CREATE INDEX idx_notifications_user_id_read ON public.notifications(user_id, is_read);
CREATE INDEX idx_notifications_created_at ON public.notifications(created_at DESC);

-- Enable realtime for notifications
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;