-- Vane PostgreSQL provisioning for Beekeeper Studio
--
-- Run STEP 1 while connected to the PostgreSQL maintenance database (usually
-- `postgres`) with an administrator role. Run STEP 2 after reconnecting to
-- the new `vane` database. Existing objects are not dropped.
--
-- This file intentionally does not contain a password. After STEP 1, set the
-- role password using Beekeeper's password prompt/secure workflow, or run:
--   ALTER ROLE vane_app PASSWORD '<value entered only in Beekeeper>';
-- Do not commit the password or paste it into chat.

-- ============================================================================
-- STEP 1: create the dedicated application role and database
-- ============================================================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
      FROM pg_catalog.pg_roles
     WHERE rolname = 'vane_app'
  ) THEN
    CREATE ROLE vane_app LOGIN;
  END IF;
END
$$;

-- Set the role password separately before starting Vane:
-- ALTER ROLE vane_app PASSWORD '<set this privately in Beekeeper>';

-- PostgreSQL has no CREATE DATABASE IF NOT EXISTS. Execute this statement
-- once, while connected to the maintenance database. If `vane` already exists,
-- skip this statement rather than dropping or recreating the database.
CREATE DATABASE vane OWNER vane_app;

-- ============================================================================
-- STEP 2: reconnect to database `vane`, then run these grants
-- ============================================================================

GRANT CONNECT, TEMPORARY ON DATABASE vane TO vane_app;
GRANT USAGE, CREATE ON SCHEMA public TO vane_app;

-- Vane creates the application and Better Auth tables through its checked-in
-- migration at drizzle/0000_thick_roulette.sql during application startup.
-- Do not run DROP DATABASE, DROP SCHEMA, or DROP TABLE as part of setup.
