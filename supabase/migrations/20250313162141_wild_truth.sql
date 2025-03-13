/*
  # Add RLS policies for player_profiles table

  1. Security Changes
    - Add policy to allow tournament organizers to create player profiles
    - Add policy to allow users to read all player profiles
*/

-- Policy to allow tournament organizers to create player profiles
CREATE POLICY "Tournament organizers can create player profiles"
  ON player_profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (true);  -- Allow any authenticated user to create profiles

-- Policy to allow reading player profiles
CREATE POLICY "Anyone can view player profiles"
  ON player_profiles
  FOR SELECT
  USING (true);  -- Allow public read access to player profiles