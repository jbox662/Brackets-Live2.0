/*
  # Add tournament registrations

  1. New Tables
    - `tournament_registrations`
      - `id` (uuid, primary key)
      - `tournament_id` (uuid, references tournaments)
      - `player_id` (uuid, references player_profiles)
      - `registration_date` (timestamp)
      - `status` (text): 'registered' | 'checked_in' | 'eliminated'
      - `seed` (integer, nullable)
      
  2. Security
    - Enable RLS on tournament_registrations table
    - Add policies for tournament organizers and players
*/

-- Create tournament registrations table
CREATE TABLE IF NOT EXISTS tournament_registrations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tournament_id uuid REFERENCES tournaments(id) ON DELETE CASCADE,
  player_id uuid REFERENCES player_profiles(id) ON DELETE CASCADE,
  registration_date timestamptz DEFAULT now(),
  status text DEFAULT 'registered' CHECK (status IN ('registered', 'checked_in', 'eliminated')),
  seed integer,
  UNIQUE(tournament_id, player_id)
);

-- Enable RLS
ALTER TABLE tournament_registrations ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Tournament organizers can manage registrations"
  ON tournament_registrations
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM tournaments t
      WHERE t.id = tournament_id
      AND t.organizer_id = auth.uid()
    )
  );

CREATE POLICY "Players can view their own registrations"
  ON tournament_registrations
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM player_profiles p
      WHERE p.id = player_id
      AND p.user_id = auth.uid()
    )
  );

-- Add sample players to a tournament
DO $$
DECLARE
    tournament_id uuid;
    player_cursor CURSOR FOR 
        SELECT id FROM player_profiles 
        ORDER BY created_at 
        LIMIT 16;
    player_record RECORD;
    seed_number integer := 1;
BEGIN
    -- Get the most recently created tournament
    SELECT id INTO tournament_id 
    FROM tournaments 
    ORDER BY created_at DESC 
    LIMIT 1;

    -- Register players
    OPEN player_cursor;
    LOOP
        FETCH player_cursor INTO player_record;
        EXIT WHEN NOT FOUND;

        INSERT INTO tournament_registrations (
            tournament_id,
            player_id,
            status,
            seed
        ) VALUES (
            tournament_id,
            player_record.id,
            'registered',
            seed_number
        );

        seed_number := seed_number + 1;
    END LOOP;
    CLOSE player_cursor;
END $$;