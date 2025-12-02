-- Assign admin role to user a5dae1cf-0f76-4897-b73c-ef07aa8376f9
INSERT INTO public.user_roles (user_id, role)
VALUES ('a5dae1cf-0f76-4897-b73c-ef07aa8376f9', 'admin')
ON CONFLICT (user_id, role) DO NOTHING;