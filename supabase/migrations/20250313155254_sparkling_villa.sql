/*
  # Create tournaments table

  1. New Tables
    - `tournaments`
      - `id` (uuid, primary key)
      - `name` (text)
      - `date` (date)
      - `location` (text)
      - `max_players` (integer)
      - `entry_fee` (numeric)
      - `organizer_id` (uuid, references auth.users)
      - `status` (text)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS on `tournaments` table
    - Add policies for:
      - Anyone can read tournaments
      - Authenticated users can create tournaments
      - Organizers can update their own tournaments
*/

CREATE TABLE IF NOT EXISTS tournaments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  date date NOT NULL,
  location text NOT NULL,
  max_players integer NOT NULL CHECK (max_players >= 2),
  entry_fee numeric NOT NULL CHECK (entry_fee >= 0),
  organizer_id uuid REFERENCES auth.users NOT NULL,
  status text NOT NULL CHECK (status IN ('upcoming', 'in_progress', 'completed')) DEFAULT 'upcoming',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE tournaments ENABLE ROW LEVEL SECURITY;

-- Allow anyone to read tournaments
CREATE POLICY "Anyone can view tournaments"
  ON tournaments
  FOR SELECT
  TO public
  USING (true);

-- Allow authenticated users to create tournaments
CREATE POLICY "Authenticated users can create tournaments"
  ON tournaments
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = organizer_id);

-- Allow tournament organizers to update their tournaments
CREATE POLICY "Users can update own tournaments"
  ON tournaments
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = organizer_id)
  WITH CHECK (auth.uid() = organizer_id);

-- Trigger to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_tournaments_updated_at
  BEFORE UPDATE ON tournaments
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();