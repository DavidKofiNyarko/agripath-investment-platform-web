#!/usr/bin/env python3
"""
Extract all 62 migrations from Supabase and create the comprehensive migration file.
Run this script to regenerate 20251122061211_sync_all_remaining_schema.sql with the actual migration SQL.
"""

# This script needs to be run with Supabase MCP access
# Or you can run this SQL query directly in Supabase and copy the result:

SQL_QUERY = """
SELECT 
  string_agg(
    E'-- Migration: ' || version || ' - ' || name || E'\\n' ||
    array_to_string(statements, E'\\n\\n') || E'\\n\\n',
    E'\\n\\n-- ============================================\\n\\n'
    ORDER BY version
  ) as all_migrations_sql
FROM supabase_migrations.schema_migrations 
WHERE version NOT IN ('20251101000000', '20251122055658', '20251122060145', '20251122060257', '20251122061211');
"""

print("""
To fix the migration file:

1. Run this SQL query in your Supabase main branch database:
""")
print(SQL_QUERY)
print("""
2. Copy the result from the 'all_migrations_sql' column

3. Create the migration file with this header + the SQL result:

-- Comprehensive migration: All remaining schema from main branch
-- This migration includes all tables, functions, triggers, and RLS policies
-- that exist in the main branch but were not in git
--
-- This file combines 62 individual migrations into one for easier management
-- All migrations are applied in chronological order
--
-- Generated: 2025-11-22
-- Total migrations: 62
--
-- NOTE: This contains the ACTUAL migration SQL from supabase_migrations.schema_migrations

[PASTE SQL RESULT HERE]
""")
