-- Base schema migration
-- This migration creates essential tables and types that are referenced by later migrations
-- Version: 20251101000000 (before the first tracked migration: 20251107170731)
-- 
-- IMPORTANT: This migration must run before 20251107170731_fix_project_stock_trigger_to_only_reduce_on_success
-- because that migration tries to drop a trigger on the transactions table.

-- Create enum types if they don't exist
DO $$ BEGIN
  CREATE TYPE channel AS ENUM ('momo', 'bank', 'card', 'wallet');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE transaction_status AS ENUM ('Complete', 'Pending', 'Failed');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE transaction_type AS ENUM ('Payin', 'Payout', 'Refund', 'momo_topup', 'card_topup', 'momo_withdrawal', 'bank_withdrawal', 'payout_return', 'investment');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Create profile table first (no dependencies)
CREATE TABLE IF NOT EXISTS profile (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  first_name TEXT,
  last_name TEXT,
  email TEXT,
  country TEXT,
  phone_number TEXT,
  pin TEXT,
  kyc_status TEXT,
  kyc_documents JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  notifications_id UUID DEFAULT gen_random_uuid(),
  last_login TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  email_preferences TEXT[] DEFAULT ARRAY[]::TEXT[],
  push_preferences TEXT[] DEFAULT ARRAY[]::TEXT[],
  avatar_url TEXT
);

-- Create projects table (depends on profile for created_by, but not FK)
CREATE TABLE IF NOT EXISTS projects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_code VARCHAR,
  project_name VARCHAR NOT NULL,
  description TEXT,
  project_type TEXT NOT NULL DEFAULT 'CROP',
  farm_location VARCHAR,
  total_units INTEGER NOT NULL,
  unit_price NUMERIC NOT NULL,
  expected_return_rate NUMERIC NOT NULL,
  max_expected_return_rate DOUBLE PRECISION NOT NULL DEFAULT 0,
  duration_months INTEGER,
  status VARCHAR DEFAULT 'Active',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  image TEXT,
  cover_image_url VARCHAR,
  start_date DATE,
  end_date DATE,
  available_unit BIGINT DEFAULT 0,
  purchased_unit BIGINT DEFAULT 0,
  project_stages TEXT,
  is_high_ticket BOOLEAN DEFAULT false,
  min_investment_amount NUMERIC DEFAULT 0.00,
  max_investment_amount NUMERIC DEFAULT 0.00,
  payout_type TEXT,
  created_by TEXT,
  total_value NUMERIC,
  payout_completed BOOLEAN DEFAULT false,
  payout_completed_at TIMESTAMP WITH TIME ZONE,
  risk_level VARCHAR
);

-- Create wallets table (depends on profile)
CREATE TABLE IF NOT EXISTS wallets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID,
  balance NUMERIC DEFAULT 0.00,
  CONSTRAINT wallets_profile_id_fkey FOREIGN KEY (profile_id) REFERENCES profile(id)
);

-- Create transactions table (depends on profile, projects, wallets)
CREATE TABLE IF NOT EXISTS transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_id VARCHAR NOT NULL UNIQUE,
  profile_id UUID NOT NULL,
  project_id UUID,
  wallet_id UUID,
  type transaction_type NOT NULL,
  amount NUMERIC(15,2) NOT NULL,
  unit INTEGER,
  status transaction_status NOT NULL DEFAULT 'Pending',
  fees NUMERIC(15,2) DEFAULT 0.00,
  net_amount NUMERIC(15,2) NOT NULL,
  description TEXT,
  processed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  channel channel NOT NULL DEFAULT 'momo',
  external_id TEXT,
  network TEXT,
  account_number TEXT NOT NULL,
  failure_reason VARCHAR,
  metadata JSONB,
  CONSTRAINT transactions_profile_id_fkey FOREIGN KEY (profile_id) REFERENCES profile(id),
  CONSTRAINT transactions_project_id_fkey FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
  CONSTRAINT transactions_wallet_id_fkey FOREIGN KEY (wallet_id) REFERENCES wallets(id)
);

-- Create indexes if they don't exist
CREATE INDEX IF NOT EXISTS idx_transactions_project_id ON transactions(project_id);
CREATE INDEX IF NOT EXISTS idx_transactions_status ON transactions(status);
CREATE INDEX IF NOT EXISTS idx_transactions_created_at ON transactions(created_at);
CREATE INDEX IF NOT EXISTS idx_transactions_project_type_status ON transactions(project_id, type, status);
CREATE INDEX IF NOT EXISTS idx_transactions_type ON transactions(type);
CREATE INDEX IF NOT EXISTS idx_transactions_profile_id ON transactions(profile_id);

-- Enable Row Level Security on transactions (if not already enabled)
DO $$ BEGIN
  ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
EXCEPTION
  WHEN OTHERS THEN null;
END $$;
