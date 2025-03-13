/*
  # Add sample players

  1. Changes
    - Create sample users in auth.users
    - Insert corresponding player profiles
    - Add user roles for each player
    
  2. Notes
    - Creates 16 sample players for testing
    - Uses proper UUID generation and references
    - Maintains referential integrity
*/

-- Create users in auth.users and store their IDs
DO $$
DECLARE
    user_ids uuid[] := ARRAY[]::uuid[];
    current_user_id uuid;
    i integer;
BEGIN
    -- Create 16 users and store their IDs
    FOR i IN 1..16 LOOP
        INSERT INTO auth.users (
            instance_id,
            id,
            email,
            encrypted_password,
            email_confirmed_at,
            created_at,
            updated_at,
            raw_app_meta_data,
            raw_user_meta_data
        )
        VALUES (
            '00000000-0000-0000-0000-000000000000',
            gen_random_uuid(),
            'player' || i || '@example.com',
            '$2a$10$abcdefghijklmnopqrstuvwxyzABCDEF',  -- Dummy hashed password
            now(),
            now(),
            now(),
            '{"provider":"email","providers":["email"]}',
            '{}'
        )
        RETURNING id INTO current_user_id;
        
        user_ids := array_append(user_ids, current_user_id);
    END LOOP;

    -- Insert player profiles
    INSERT INTO player_profiles (id, user_id, first_name, last_name, email, created_at, updated_at)
    SELECT 
        gen_random_uuid(),
        user_ids[idx],
        first_name,
        last_name,
        'player' || idx || '@example.com',
        now(),
        now()
    FROM (
        VALUES 
            (1, 'Michael', 'Chen'),
            (2, 'Sarah', 'Johnson'),
            (3, 'James', 'Wilson'),
            (4, 'Emma', 'Garcia'),
            (5, 'David', 'Martinez'),
            (6, 'Lisa', 'Anderson'),
            (7, 'John', 'Taylor'),
            (8, 'Maria', 'Rodriguez'),
            (9, 'Robert', 'Brown'),
            (10, 'Jennifer', 'Lee'),
            (11, 'William', 'Davis'),
            (12, 'Sofia', 'Lopez'),
            (13, 'Daniel', 'Miller'),
            (14, 'Emily', 'Wilson'),
            (15, 'Thomas', 'White'),
            (16, 'Jessica', 'Clark')
    ) AS names(idx, first_name, last_name);

    -- Insert user roles
    INSERT INTO user_roles (id, user_id, role, created_at)
    SELECT 
        gen_random_uuid(),
        unnest(user_ids),
        'user',
        now();
END $$;