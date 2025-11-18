-- Create payment_accounts table for storing user bank and mobile money accounts
CREATE TABLE IF NOT EXISTS payment_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES profile(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('bank', 'momo')),
  account_name TEXT,
  -- Bank account fields
  account_number TEXT,
  account_bank TEXT,
  -- Mobile money fields
  recipient_number TEXT,
  network TEXT CHECK (network IN ('MTN', 'VOD', 'ATL') OR network IS NULL),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Ensure either bank or momo fields are filled based on type
  CONSTRAINT check_bank_fields CHECK (
    (type = 'bank' AND account_number IS NOT NULL AND account_bank IS NOT NULL) OR
    (type = 'momo' AND recipient_number IS NOT NULL AND network IS NOT NULL) OR
    type IS NULL
  )
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_payment_accounts_profile_id ON payment_accounts(profile_id);
CREATE INDEX IF NOT EXISTS idx_payment_accounts_type ON payment_accounts(type);

-- Enable Row Level Security
ALTER TABLE payment_accounts ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
-- Users can only see their own accounts
CREATE POLICY "Users can view their own payment accounts"
  ON payment_accounts
  FOR SELECT
  USING (auth.uid() IN (SELECT user_id FROM profile WHERE id = payment_accounts.profile_id));

-- Users can insert their own accounts
CREATE POLICY "Users can insert their own payment accounts"
  ON payment_accounts
  FOR INSERT
  WITH CHECK (auth.uid() IN (SELECT user_id FROM profile WHERE id = payment_accounts.profile_id));

-- Users can update their own accounts
CREATE POLICY "Users can update their own payment accounts"
  ON payment_accounts
  FOR UPDATE
  USING (auth.uid() IN (SELECT user_id FROM profile WHERE id = payment_accounts.profile_id));

-- Users can delete their own accounts
CREATE POLICY "Users can delete their own payment accounts"
  ON payment_accounts
  FOR DELETE
  USING (auth.uid() IN (SELECT user_id FROM profile WHERE id = payment_accounts.profile_id));

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_payment_accounts_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_payment_accounts_timestamp
  BEFORE UPDATE ON payment_accounts
  FOR EACH ROW
  EXECUTE FUNCTION update_payment_accounts_updated_at();

