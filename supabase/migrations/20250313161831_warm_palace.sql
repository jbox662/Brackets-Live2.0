/*
  # Register sample players to tournament

  This migration ensures all sample players are properly registered to the most recent tournament
  with correct seeding and registration status.

  1. Changes:
    - Registers all sample players to the most recent tournament
    - Assigns sequential seed numbers
    - Sets registration status
*/

-- First, clear existing registrations for the most recent tournament
DO $$
DECLARE
    v_tournament_id uuid;
BEGIN
    -- Get the most recently created tournament
    SELECT id INTO v_tournament_id 
    FROM tournaments 
    ORDER BY created_at DESC 
    LIMIT 1;

    -- Clear existing registrations
    DELETE FROM tournament_registrations
    WHERE tournament_id = v_tournament_id;

    -- Insert all player profiles as registrations
    INSERT INTO tournament_registrations (
        tournament_id,
        player_id,
        status,
        seed,
        registration_date
    )
    SELECT 
        v_tournament_id,
        p.id,
        'registered',
        ROW_NUMBER() OVER (ORDER BY p.created_at),
        now() - (random() * interval '2 days')
    FROM player_profiles p
    ORDER BY p.created_at
    LIMIT 16;
END $$;