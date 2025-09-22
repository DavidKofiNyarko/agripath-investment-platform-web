-- Function to handle new user signup and create users table record
CREATE OR REPLACE FUNCTION public.handle_new_user_signup()
RETURNS TRIGGER AS $$
DECLARE
  user_id_var VARCHAR(20);
  name_var VARCHAR(255);
  phone_var VARCHAR(20);
  country_var VARCHAR(100);
  country_flag_var VARCHAR(10);
BEGIN
  -- Generate user_id (you might want to customize this logic)
  user_id_var := 'USR' || LPAD(EXTRACT(EPOCH FROM NOW())::TEXT, 10, '0');
  
  -- Extract data from auth.users metadata
  name_var := COALESCE(NEW.raw_user_meta_data->>'first_name', '') || ' ' || COALESCE(NEW.raw_user_meta_data->>'last_name', '');
  phone_var := COALESCE(NEW.raw_user_meta_data->>'phone_number', '');
  country_var := COALESCE(NEW.raw_user_meta_data->>'country', 'Ghana');
  
  -- Set country flag based on country
  country_flag_var := CASE 
    WHEN country_var = 'Ghana' THEN '🇬🇭'
    WHEN country_var = 'Nigeria' THEN '🇳🇬'
    WHEN country_var = 'Kenya' THEN '🇰🇪'
    WHEN country_var = 'Uganda' THEN '🇺🇬'
    ELSE '🌍'
  END;
  
  -- Insert into your users table
  INSERT INTO public.users (
    user_id,
    name,
    email,
    phone,
    country,
    country_flag,
    gender,
    date_joined,
    created_at,
    updated_at
  ) VALUES (
    user_id_var,
    TRIM(name_var),
    NEW.email,
    phone_var,
    country_var,
    country_flag_var,
    'Other'::user_gender, -- Default gender, user can update later
    CURRENT_DATE,
    NOW(),
    NOW()
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_signup();
