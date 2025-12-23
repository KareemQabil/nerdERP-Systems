-- Drop all tables to allow fresh schema creation
-- This will delete ALL data - only run in development!

DROP SCHEMA public CASCADE;
CREATE SCHEMA public;
GRANT ALL ON SCHEMA public TO neondb_owner;
GRANT ALL ON SCHEMA public TO public;
