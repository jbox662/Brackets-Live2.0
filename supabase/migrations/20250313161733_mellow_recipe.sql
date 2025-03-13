/*
  # Add sample players to tournament

  This migration adds the sample players to the most recently created tournament
  with proper seeding and registration status.

  1. Changes:
    - Registers all sample players to the most recent tournament
    - Assigns sequential seed numbers
    - Sets initial registration status
*/

DO $$
DECLARE
    v_tournament_id uuid;
    player_cursor CURSOR FOR 
        SELECT id FROM player_profiles 
        ORDER BY RANDOM() 
        LIMIT 16;
    player_record RECORD;
    seed_number integer := 1;
BEGIN
    -- Get the most recently created tournament
    SELECT id INTO v_tournament_id 
    FROM tournaments 
    ORDER BY created_at DESC 
    LIMIT 1;

    -- Clear any existing registrations for this tournament
    DELETE FROM tournament_registrations
    WHERE tournament_id = v_tournament_id;

    -- Register players with random seeding
    OPEN player_cursor;
    LOOP
        FETCH player_cursor INTO player_record;
        EXIT WHEN NOT FOUND;

        -- Insert with proper error handling
        BEGIN
            INSERT INTO tournament_registrations (
                tournament_id,
                player_id,
                status,
                seed,
                registration_date
            ) VALUES (
                v_tournament_id,
                player_record.id,
                'registered',
                seed_number,
                now() - (random() * interval '2 days')  -- Random registration dates within last 2 days
            );
        EXCEPTION 
            WHEN unique_violation THEN
                -- Skip duplicates silently
                NULL;
        END;

        seed_number := seed_number + 1;
    END LOOP;
    CLOSE player_cursor;
END $$;