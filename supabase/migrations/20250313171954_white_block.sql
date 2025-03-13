/*
  # Tournament Bracket System Schema

  1. New Tables
    - tournament_brackets
      - Stores bracket configuration and status
      - Unique constraint ensures only one active bracket per tournament
    - tournament_matches
      - Stores individual match data and results
      - Tracks player assignments, scores, and winners

  2. Security
    - RLS enabled on both tables
    - Policies for tournament organizers and public viewing

  3. Triggers
    - Automatic updated_at timestamp management
*/

-- Check and create tournament brackets table if not exists
DO $$ BEGIN
  CREATE TABLE IF NOT EXISTS tournament_brackets (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tournament_id uuid REFERENCES tournaments(id) ON DELETE CASCADE,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    bracket_type text NOT NULL CHECK (bracket_type IN ('single', 'split')),
    format text NOT NULL CHECK (format IN ('Single Elimination', 'Double Elimination')),
    seeding text NOT NULL,
    tables_per_bracket integer NOT NULL CHECK (tables_per_bracket > 0),
    weighted_matchups boolean DEFAULT false,
    bracket_size integer NOT NULL CHECK (bracket_size > 1),
    uppers_race_to integer NOT NULL CHECK (uppers_race_to > 0),
    lowers_race_to integer NOT NULL CHECK (lowers_race_to > 0),
    championship_format text NOT NULL,
    best_of text CHECK (best_of IN ('Disabled', '3', '5', '7')),
    status text DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'completed'))
  );
END $$;

-- Create unique partial index for active brackets if not exists
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE indexname = 'tournament_brackets_active_idx'
  ) THEN
    CREATE UNIQUE INDEX tournament_brackets_active_idx ON tournament_brackets (tournament_id) WHERE status = 'active';
  END IF;
END $$;

-- Check and create tournament matches table if not exists
DO $$ BEGIN
  CREATE TABLE IF NOT EXISTS tournament_matches (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    bracket_id uuid REFERENCES tournament_brackets(id) ON DELETE CASCADE,
    round integer NOT NULL,
    match_number integer NOT NULL,
    player1_id uuid REFERENCES player_profiles(id),
    player2_id uuid REFERENCES player_profiles(id),
    player1_score integer DEFAULT 0,
    player2_score integer DEFAULT 0,
    winner_id uuid REFERENCES player_profiles(id),
    table_number integer,
    status text DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed')),
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    UNIQUE(bracket_id, round, match_number)
  );
END $$;

-- Enable RLS
ALTER TABLE tournament_brackets ENABLE ROW LEVEL SECURITY;
ALTER TABLE tournament_matches ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist and recreate them
DO $$ BEGIN
  DROP POLICY IF EXISTS "Tournament organizers can manage brackets" ON tournament_brackets;
  DROP POLICY IF EXISTS "Anyone can view brackets" ON tournament_brackets;
  DROP POLICY IF EXISTS "Tournament organizers can manage matches" ON tournament_matches;
  DROP POLICY IF EXISTS "Anyone can view matches" ON tournament_matches;
END $$;

-- Bracket policies
CREATE POLICY "Tournament organizers can manage brackets"
  ON tournament_brackets
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM tournaments t
      WHERE t.id = tournament_id
      AND t.organizer_id = auth.uid()
    )
  );

CREATE POLICY "Anyone can view brackets"
  ON tournament_brackets
  FOR SELECT
  TO public
  USING (true);

-- Match policies
CREATE POLICY "Tournament organizers can manage matches"
  ON tournament_matches
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM tournament_brackets b
      JOIN tournaments t ON t.id = b.tournament_id
      WHERE b.id = bracket_id
      AND t.organizer_id = auth.uid()
    )
  );

CREATE POLICY "Anyone can view matches"
  ON tournament_matches
  FOR SELECT
  TO public
  USING (true);

-- Update trigger for brackets
CREATE OR REPLACE FUNCTION update_tournament_brackets_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_tournament_brackets_updated_at ON tournament_brackets;
CREATE TRIGGER update_tournament_brackets_updated_at
  BEFORE UPDATE ON tournament_brackets
  FOR EACH ROW
  EXECUTE FUNCTION update_tournament_brackets_updated_at();

-- Update trigger for matches
CREATE OR REPLACE FUNCTION update_tournament_matches_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_tournament_matches_updated_at ON tournament_matches;
CREATE TRIGGER update_tournament_matches_updated_at
  BEFORE UPDATE ON tournament_matches
  FOR EACH ROW
  EXECUTE FUNCTION update_tournament_matches_updated_at();