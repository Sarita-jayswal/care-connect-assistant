-- Update mycapstone07 from admin to staff role
UPDATE public.user_roles 
SET role = 'staff'
WHERE user_id = 'a5dae1cf-0f76-4897-b73c-ef07aa8376f9' 
AND role = 'admin';