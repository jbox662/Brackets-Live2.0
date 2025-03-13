/*
  # Add pre-registration to tournaments

  1. Changes
    - Add `pre_registration` boolean column to tournaments table
    - Set default value to false
    - Update existing tournaments to have pre_registration false
*/

ALTER TABLE tournaments 
ADD COLUMN IF NOT EXISTS pre_registration boolean NOT NULL DEFAULT false;