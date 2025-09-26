-- KYC Schema Update for Profiles Table
-- This script updates the profiles table to support KYC verification

-- Add KYC-related columns to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS pin text,
ADD COLUMN IF NOT EXISTS kyc_status text,
ADD COLUMN IF NOT EXISTS kyc_documents jsonb;

-- Add check constraint for kyc_status
ALTER TABLE public.profiles 
ADD CONSTRAINT IF NOT EXISTS profiles_kyc_status_check 
CHECK (
  kyc_status IS NULL OR 
  kyc_status = ANY (ARRAY['pending'::text, 'verified'::text, 'rejected'::text])
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_profiles_kyc_status 
ON public.profiles USING btree (kyc_status) 
WHERE kyc_status IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_profiles_pin 
ON public.profiles USING btree (pin) 
WHERE pin IS NOT NULL;

-- Create storage bucket for KYC documents (if it doesn't exist)
INSERT INTO storage.buckets (id, name, public)
VALUES ('project-images', 'project-images', true)
ON CONFLICT (id) DO NOTHING;

-- Add RLS policies for the storage bucket
CREATE POLICY IF NOT EXISTS "Users can upload their own KYC documents" 
ON storage.objects FOR INSERT 
WITH CHECK (bucket_id = 'project-images' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY IF NOT EXISTS "Users can view their own KYC documents" 
ON storage.objects FOR SELECT 
USING (bucket_id = 'project-images' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY IF NOT EXISTS "Users can update their own KYC documents" 
ON storage.objects FOR UPDATE 
USING (bucket_id = 'project-images' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY IF NOT EXISTS "Users can delete their own KYC documents" 
ON storage.objects FOR DELETE 
USING (bucket_id = 'project-images' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Update the updated_at trigger if it doesn't exist
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for updated_at
DROP TRIGGER IF EXISTS update_profiles_updated_at ON public.profiles;
CREATE TRIGGER update_profiles_updated_at 
    BEFORE UPDATE ON public.profiles 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Add comments for documentation
COMMENT ON COLUMN public.profiles.pin IS 'User transaction PIN for secure operations';
COMMENT ON COLUMN public.profiles.kyc_status IS 'KYC verification status: pending, verified, or rejected';
COMMENT ON COLUMN public.profiles.kyc_documents IS 'JSON object containing URLs to uploaded KYC documents (id_front, id_back, selfie)';

