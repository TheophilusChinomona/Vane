#!/usr/bin/env bash
set -eu

# Provision the dedicated Vane PostgreSQL role and database.
# Required environment variables:
#   ADMIN_DATABASE_URL  PostgreSQL admin/maintenance connection URL
#   VANE_DB_PASSWORD    password for the Vane application role
# Optional:
#   VANE_DB_NAME        database name (default: vane)
#   VANE_DB_USER        application role name (default: vane_app)

: "${ADMIN_DATABASE_URL:?Set ADMIN_DATABASE_URL to an admin PostgreSQL connection URL}"
: "${VANE_DB_PASSWORD:?Set VANE_DB_PASSWORD without putting it in this file}"

VANE_DB_NAME=${VANE_DB_NAME:-vane}
VANE_DB_USER=${VANE_DB_USER:-vane_app}

case "$VANE_DB_NAME" in
  ''|*[!a-zA-Z0-9_]* ) printf '%s\n' 'VANE_DB_NAME must contain only letters, numbers, and underscores' >&2; exit 1 ;;
esac
case "$VANE_DB_USER" in
  ''|*[!a-zA-Z0-9_]* ) printf '%s\n' 'VANE_DB_USER must contain only letters, numbers, and underscores' >&2; exit 1 ;;
esac

command -v psql >/dev/null 2>&1 || {
  printf '%s\n' 'psql is required but was not found in PATH' >&2
  exit 1
}

# Keep the password in the environment-to-psql handoff; do not place it in
# command arguments, generated files, logs, or output.
psql "$ADMIN_DATABASE_URL" \
  --set=ON_ERROR_STOP=1 \
  --set="vane_db=$VANE_DB_NAME" \
  --set="vane_user=$VANE_DB_USER" <<'SQL'
\getenv vane_password VANE_DB_PASSWORD

SELECT format('CREATE ROLE %I LOGIN', :'vane_user')
WHERE NOT EXISTS (
  SELECT 1 FROM pg_catalog.pg_roles WHERE rolname = :'vane_user'
)\gexec

SELECT format('ALTER ROLE %I LOGIN PASSWORD %L', :'vane_user', :'vane_password')\gexec

SELECT format('CREATE DATABASE %I OWNER %I', :'vane_db', :'vane_user')
WHERE NOT EXISTS (
  SELECT 1 FROM pg_catalog.pg_database WHERE datname = :'vane_db'
)\gexec

DO $$
DECLARE
  current_owner text;
BEGIN
  SELECT pg_get_userbyid(datdba)
    INTO current_owner
    FROM pg_catalog.pg_database
   WHERE datname = :'vane_db';

  IF current_owner IS DISTINCT FROM :'vane_user' THEN
    RAISE EXCEPTION 'Database % is not owned by the dedicated role %',
      :'vane_db', :'vane_user';
  END IF;
END
$$;

SELECT format('GRANT CONNECT, TEMPORARY ON DATABASE %I TO %I', :'vane_db', :'vane_user')\gexec
SQL

printf 'Vane PostgreSQL database and role verified: database=%s role=%s\n' "$VANE_DB_NAME" "$VANE_DB_USER"
printf '%s\n' 'Set the application DATABASE_URL to this database using the role password; the password was not printed or stored.'
