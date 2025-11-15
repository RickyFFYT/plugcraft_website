-- Add ban-related columns to profiles table
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS banned_until timestamptz,
ADD COLUMN IF NOT EXISTS ban_reason text,
ADD COLUMN IF NOT EXISTS last_login timestamptz;

-- Update the updated_at trigger to include new columns
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Ensure the trigger exists
DROP TRIGGER IF EXISTS update_profiles_updated_at ON public.profiles;
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();