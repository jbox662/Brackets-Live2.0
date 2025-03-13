/*
  # Add superuser for specific email

  1. Changes
    - Adds superuser role for the specified email account
    - Uses email lookup to find the correct user ID
    - Maintains data integrity with proper checks

  2. Security
    - Only adds superuser if user exists
    - Preserves existing security policies
*/

DO $$
DECLARE
  target_user_id UUID;
BEGIN
  -- Get the user ID for the email
  SELECT id INTO target_user_id
  FROM auth.users
  WHERE email = 'jbox38821@gmail.com'
  LIMIT 1;

  -- If user exists, add superuser role
  IF target_user_id IS NOT NULL THEN
    PERFORM add_superuser_role(target_user_id);
  END IF;
END $$;