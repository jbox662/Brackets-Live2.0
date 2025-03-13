/*
  # Add delete policy for tournaments

  1. Changes
    - Add policy to allow tournament organizers to delete their own tournaments

  2. Security
    - Only tournament organizers can delete their own tournaments
    - Requires authentication
*/

-- Allow tournament organizers to delete their tournaments
CREATE POLICY "Users can delete own tournaments"
  ON tournaments
  FOR DELETE
  TO authenticated
  USING (auth.uid() = organizer_id);