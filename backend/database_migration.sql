-- Migration script to add relationships between observations, checkins, users, and stores
-- Run this script to update your database schema

-- Step 1: Add checkin_id column to observaciones table
ALTER TABLE observaciones 
ADD COLUMN IF NOT EXISTS checkin_id INTEGER;

-- Step 2: Add foreign key constraint to link observations with checkins
ALTER TABLE observaciones 
ADD CONSTRAINT fk_observaciones_checkin 
FOREIGN KEY (checkin_id) REFERENCES checkins(checkin_id) 
ON DELETE SET NULL ON UPDATE CASCADE;

-- Step 3: Add index for better query performance
CREATE INDEX IF NOT EXISTS idx_observaciones_checkin_id ON observaciones(checkin_id);
CREATE INDEX IF NOT EXISTS idx_observaciones_user_id ON observaciones(user_id);
CREATE INDEX IF NOT EXISTS idx_observaciones_created_at ON observaciones(created_at);

-- Step 4: Update existing observations to link with active checkins where possible
-- This is optional and should be reviewed based on your data
UPDATE observaciones 
SET checkin_id = (
    SELECT c.checkin_id 
    FROM checkins c 
    WHERE c.user_id = observaciones.user_id 
    AND c.created_at <= observaciones.created_at 
    AND (c.checkout IS NULL OR c.checkout >= observaciones.created_at)
    ORDER BY c.created_at DESC 
    LIMIT 1
)
WHERE checkin_id IS NULL 
AND EXISTS (
    SELECT 1 FROM checkins c 
    WHERE c.user_id = observaciones.user_id
);

-- Step 5: Verify the migration
SELECT 
    'observaciones' as table_name,
    COUNT(*) as total_records,
    COUNT(checkin_id) as records_with_checkin,
    COUNT(*) - COUNT(checkin_id) as records_without_checkin
FROM observaciones;

-- Step 6: Show sample data with relationships
SELECT 
    o.observation_id,
    o.observation_string,
    u.username,
    r.region_name,
    s.store_name,
    o.created_at
FROM observaciones o
LEFT JOIN usuarios u ON o.user_id = u.user_id
LEFT JOIN checkins c ON o.checkin_id = c.checkin_id
LEFT JOIN regiones r ON c.region_id = r.region_id
LEFT JOIN comercios s ON c.store_id = s.store_id
ORDER BY o.created_at DESC
LIMIT 10;

-- =============================================
-- MIGRATION: Make checkins.latitude/longitude nullable to allow optional geolocation
-- =============================================
DO $$ BEGIN
  -- Drop NOT NULL constraints if they exist
  BEGIN
    ALTER TABLE checkins ALTER COLUMN latitude DROP NOT NULL;
  EXCEPTION WHEN undefined_column THEN
    -- Column may not exist; ignore
    NULL;
  END;

  BEGIN
    ALTER TABLE checkins ALTER COLUMN longitude DROP NOT NULL;
  EXCEPTION WHEN undefined_column THEN
    NULL;
  END;
END $$;

-- Optionally, ensure data type is numeric with reasonable precision (uncomment if needed)
-- ALTER TABLE checkins ALTER COLUMN latitude TYPE numeric(9,6) USING latitude::numeric;
-- ALTER TABLE checkins ALTER COLUMN longitude TYPE numeric(9,6) USING longitude::numeric;

-- =============================================
-- ENFORCE: Make checkins.latitude/longitude NOT NULL again
-- NOTE: Run the PRECHECK first; if there are NULLs, clean them before SET NOT NULL
-- =============================================

-- PRECHECK (manual): review NULLs before enforcing
-- SELECT 
--   COUNT(*) FILTER (WHERE latitude IS NULL)  AS null_lat,
--   COUNT(*) FILTER (WHERE longitude IS NULL) AS null_lon
-- FROM checkins;

-- If there are no NULLs, enforce NOT NULL
ALTER TABLE checkins ALTER COLUMN latitude  SET NOT NULL;
ALTER TABLE checkins ALTER COLUMN longitude SET NOT NULL;

-- Optional: add range constraints for data integrity
-- Uncomment if you want to enforce valid geographic ranges
-- DO $$ BEGIN
--   BEGIN
--     ALTER TABLE checkins ADD CONSTRAINT chk_lat_range CHECK (latitude BETWEEN -90 AND 90);
--   EXCEPTION WHEN duplicate_object THEN NULL; END;
--   BEGIN
--     ALTER TABLE checkins ADD CONSTRAINT chk_lon_range CHECK (longitude BETWEEN -180 AND 180);
--   EXCEPTION WHEN duplicate_object THEN NULL; END;
-- END $$;
