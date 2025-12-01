-- Create trigger to automatically assign roles when users sign up
-- This trigger will fire AFTER a user is inserted into auth.users
-- and will create the appropriate role in user_roles table based on user metadata

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW 
  EXECUTE FUNCTION public.handle_new_user();
