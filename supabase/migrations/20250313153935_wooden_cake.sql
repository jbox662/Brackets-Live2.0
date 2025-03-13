/*
  # Update player profiles table structure

  1. Changes
    - Split name into first_name and last_name
    - Update existing table structure
    - Maintain existing RLS policies

  2. Security
    - No changes to existing security policies
*/

-- Update the player_profiles table structure
ALTER TABLE player_profiles
  DROP COLUMN IF EXISTS name,
  ADD COLUMN IF NOT EXISTS first_name text,
  ADD COLUMN IF NOT EXISTS last_name text;

-- Update the columns to be NOT NULL
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'player_profiles'
    AND column_name IN ('first_name', 'last_name')
  ) THEN
    ALTER TABLE player_profiles
      ALTER COLUMN first_name SET NOT NULL,
      ALTER COLUMN last_name SET NOT NULL;
  END IF;
END $$;