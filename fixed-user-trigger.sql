-- Drop existing trigger and function if they exist
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user_signup();

-- Create a safer function that handles errors gracefully
CREATE OR REPLACE FUNCTION public.handle_new_user_signup()
RETURNS TRIGGER AS $$
DECLARE
  user_id_var VARCHAR(20);
  name_var VARCHAR(255);
  phone_var VARCHAR(20);
  country_var VARCHAR(100);
  country_flag_var VARCHAR(10);
  first_name_var VARCHAR(255);
  last_name_var VARCHAR(255);
BEGIN
  -- Generate user_id safely
  user_id_var := 'USR' || LPAD(EXTRACT(EPOCH FROM NOW())::TEXT, 10, '0');
  
  -- Safely extract data from auth.users metadata
  -- Use COALESCE to handle null values and provide defaults
  first_name_var := COALESCE(NEW.raw_user_meta_data->>'first_name', '');
  last_name_var := COALESCE(NEW.raw_user_meta_data->>'last_name', '');
  name_var := TRIM(CONCAT(first_name_var, ' ', last_name_var));
  
  -- If name is empty, use email prefix
  IF name_var = '' OR name_var = ' ' THEN
    name_var := SPLIT_PART(NEW.email, '@', 1);
  END IF;
  
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
  
  -- Insert into your users table with error handling
  BEGIN
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
      name_var,
      NEW.email,
      phone_var,
      country_var,
      country_flag_var,
      'Other'::user_gender, -- Default gender
      CURRENT_DATE,
      NOW(),
      NOW()
    );
  EXCEPTION WHEN OTHERS THEN
    -- Log the error but don't fail the user creation
    RAISE LOG 'Error creating user record: %', SQLERRM;
    -- Return NEW to allow auth.users insertion to succeed
    RETURN NEW;
  END;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create the trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_signup();
