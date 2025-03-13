/*
  # Update player profiles RLS policies

  1. Changes
    - Add RLS policies for player profiles table to allow:
      - Users to manage their own profiles
      - Tournament organizers to create and manage player profiles
      - Public read access to player profiles

  2. Security
    - Enable RLS on player_profiles table
    - Add policies for CRUD operations
*/

-- First, ensure RLS is enabled
ALTER TABLE player_profiles ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Users can manage own profile" ON player_profiles;
DROP POLICY IF EXISTS "Tournament organizers can create player profiles" ON player_profiles;
DROP POLICY IF EXISTS "Anyone can view player profiles" ON player_profiles;

-- Create comprehensive RLS policies
CREATE POLICY "Users can manage own profile"
  ON player_profiles
  FOR ALL
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Tournament organizers can create and manage profiles"
  ON player_profiles
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM tournaments t
      WHERE t.organizer_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM tournaments t
      WHERE t.organizer_id = auth.uid()
    )
  );

CREATE POLICY "Anyone can view player profiles"
  ON player_profiles
  FOR SELECT
  TO public
  USING (true);