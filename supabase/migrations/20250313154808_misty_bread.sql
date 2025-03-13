/*
  # Fix user roles and profiles policies

  1. Changes
    - Remove recursive user roles policies
    - Add proper profile management policies
    - Fix profile creation flow

  2. Security
    - Enable RLS on both tables
    - Add proper policies for authenticated users
    - Allow public profile creation
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Superusers can manage all roles" ON user_roles;
DROP POLICY IF EXISTS "Users can read own role" ON user_roles;
DROP POLICY IF EXISTS "Anyone can create profiles" ON player_profiles;
DROP POLICY IF EXISTS "Users can read own profile" ON player_profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON player_profiles;

-- Fix user_roles policies
CREATE POLICY "Users can read own role"
  ON user_roles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Fix player_profiles policies
ALTER TABLE player_profiles ENABLE ROW LEVEL SECURITY;

-- Allow users to manage their own profiles
CREATE POLICY "Users can manage own profile"
  ON player_profiles
  FOR ALL
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Allow initial profile creation
CREATE POLICY "Users can create initial profile"
  ON player_profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);