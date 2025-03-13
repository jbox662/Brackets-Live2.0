/*
  # Add initial superuser role

  1. Changes
    - Creates a function to safely add a superuser role
    - Function can be called later with specific user IDs
    - Maintains data integrity with proper checks

  2. Security
    - Maintains existing RLS policies
    - Only adds superuser role if it doesn't exist for the user
*/

-- Create a function to add a superuser role
CREATE OR REPLACE FUNCTION add_superuser_role(user_id_param UUID)
RETURNS void AS $$
BEGIN
  -- Only insert if the role doesn't already exist for the user
  IF NOT EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = user_id_param
    AND role = 'superuser'
  ) THEN
    INSERT INTO user_roles (user_id, role)
    VALUES (user_id_param, 'superuser');
  END IF;
END;
$$ LANGUAGE plpgsql;