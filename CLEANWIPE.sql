-- ⚠️ DANGER: THIS SCRIPT DELETES EVERYTHING ⚠️
-- This will wipe all tables, views, types, functions, and policies in the 'public' schema.
-- It effectively resets your database to a blank slate.

-- 1. Drop the entire public schema (cascades to all objects inside it)
DROP SCHEMA public CASCADE;

-- 2. Re-create the public schema
CREATE SCHEMA public;

-- 3. Restore default permissions
GRANT ALL ON SCHEMA public TO postgres;
GRANT ALL ON SCHEMA public TO public;

-- 4. Grant access to Supabase roles
GRANT USAGE ON SCHEMA public TO anon;
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT USAGE ON SCHEMA public TO service_role;

-- 5. (Optional) Wipe Auth Users
-- If you want to delete all registered users from Supabase Auth as well,
-- uncomment the following lines. DO NOT RUN THIS IN PRODUCTION.

-- TRUNCATE auth.users CASCADE;
