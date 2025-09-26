import { createBrowserClient } from "@supabase/ssr";


const NEXT_PUBLIC_SUPABASE_URL="https://gbeqqboxlflpgehyqlld.supabase.co"
const NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdiZXFxYm94bGZscGdlaHlxbGxkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE3NjI1MDEsImV4cCI6MjA2NzMzODUwMX0.QTrnoXO8DkBBEql69HBrHId1F1hYhvRl8MWUwkdqIVE"

const supabaseUrl = NEXT_PUBLIC_SUPABASE_URL ?? "";
const supabaseKey = NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? "";

export const createClient = () =>
  createBrowserClient(
    supabaseUrl!,
    supabaseKey!,
  );