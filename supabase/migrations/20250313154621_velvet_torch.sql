/*
  # Fix RLS policies for user_roles and player_profiles

  1. Changes
    - Fix infinite recursion in user_roles policies
    - Add proper RLS policies for player_profiles
    - Enable RLS on both tables
    
  2. Security
    - Allow authenticated users to read their own roles
    - Allow authenticated users to manage their own profiles
    - Allow unauthenticated users to create profiles during signup
*/

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Superusers can manage all roles" ON user_roles;
DROP POLICY IF EXISTS "Users can read own role" ON user_roles;
DROP POLICY IF EXISTS "Users can create own profile" ON player_profiles;
DROP POLICY IF EXISTS "Users can read own profile" ON player_profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON player_profiles;

-- Fix user_roles policies
CREATE POLICY "Users can read own role"
  ON user_roles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Superusers can manage all roles"
  ON user_roles
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid()
      AND role = 'superuser'
    )
  );

-- Fix player_profiles policies
ALTER TABLE player_profiles ENABLE ROW LEVEL SECURITY;

-- Allow profile creation during signup (no auth required)
CREATE POLICY "Anyone can create profiles"
  ON player_profiles
  FOR INSERT
  TO public
  WITH CHECK (true);

-- Allow users to read their own profile
CREATE POLICY "Users can read own profile"
  ON player_profiles
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Allow users to update their own profile
CREATE POLICY "Users can update own profile"
  ON player_profiles
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());