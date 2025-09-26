-- Add email column to profiles table if it doesn't exist
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS email text;

-- Update existing profiles with email from auth.users
UPDATE public.profiles 
SET email = auth.users.email
FROM auth.users 
WHERE profiles.id = auth.users.id 
AND profiles.email IS NULL;

-- Add constraint to ensure email is not empty when present
ALTER TABLE public.profiles 
ADD CONSTRAINT profiles_email_check 
CHECK (email IS NULL OR (email != '' AND email ~ '^[^@]+@[^@]+\.[^@]+$'));

-- Create index on email for better performance
CREATE INDEX IF NOT EXISTS idx_profiles_email 
ON public.profiles USING btree (email) 
TABLESPACE pg_default 
WHERE email IS NOT NULL;

-- Add comment to the email column
COMMENT ON COLUMN public.profiles.email IS 'User email address, synced from auth.users';

-- Update the trigger to handle email updates
CREATE OR REPLACE FUNCTION update_profiles_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Ensure the trigger exists
DROP TRIGGER IF EXISTS update_profiles_updated_at ON public.profiles;
CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_profiles_updated_at();
