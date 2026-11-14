#!/usr/bin/env bash
# Applies the migrations to a throw-away database on a local PostgreSQL 15+
# server (with stubbed Supabase auth/storage schemas) and runs the RLS tests.
# Uses standard libpq variables: PGHOST, PGPORT, PGUSER, PGPASSWORD.
set -euo pipefail
DIR="$(cd "$(dirname "$0")" && pwd)"
DB="${CAMPUSFLOW_VERIFY_DB:-campusflow_verify}"

psql -q -v ON_ERROR_STOP=1 -d postgres -c "drop database if exists $DB" -c "create database $DB"
psql -q -v ON_ERROR_STOP=1 -d "$DB" < "$DIR/platform_stubs.sql"
for migration in "$DIR"/../migrations/*.sql; do
  echo "applying $(basename "$migration")"
  psql -q -v ON_ERROR_STOP=1 -d "$DB" < "$migration"
done
psql -q -v ON_ERROR_STOP=1 -d "$DB" < "$DIR/rls_test.sql" 2>&1 | grep -E "PASS|FAIL|ERROR|ALL_RLS"
psql -q -d postgres -c "drop database if exists $DB"
