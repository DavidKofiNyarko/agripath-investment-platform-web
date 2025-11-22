-- Comprehensive migration: All remaining schema from main branch
-- This migration includes all tables, functions, triggers, and RLS policies
-- that exist in the main branch but were not in git
--
-- This file combines 62 individual migrations into one for easier management
-- All migrations are applied in chronological order
--
-- Generated: 2025-11-22
-- Total migrations: 62

CREATE TYPE "public"."PAYOUT_CHANNEL" AS ENUM (
    'MOMO',
    'BANK'
);


ALTER TYPE "public"."PAYOUT_CHANNEL" OWNER TO "postgres";


CREATE TYPE "public"."PROJECT_STAGE" AS ENUM (
    'LAND_PREPARATION',
    'PLANTING',
    'IRRIGATION',
    'TRANSPLANTING',
    'FERTILIZER_APPLICATION',
    'PEST_MANAGEMENT',
    'FRUITING',
    'HARVESTING',
    'SALES',
    'CROP_MANAGEMENT',
    'GROWTH_MONITORING',
    'PROCESSING_SALES',
    'PAYOUT_CLOSURE',
    'HOUSING_PEN_SETUP',
    'STOCKING_ANIMAL_PURCHASE',
    'FEEDING_HEALTH_MANAGEMENT',
    'GROWTH_MONITORING_LIVESTOCK',
    'PROCESSING_SALES_LIVESTOCK',
    'PAYOUT_CLOSURE_LIVESTOCK',
    'BROODING_SETUP',
    'CHICK_ARRIVAL_ONBOARDING',
    'FEEDING_GROWTH_MONITORING',
    'PRODUCTION_HARVEST_STAGE',
    'SALES_POULTRY',
    'PAYOUT_CLOSURE_POULTRY',
    'POND_TANK_SETUP',
    'FINGERLINGS_STOCKING',
    'FEEDING_WATER_MANAGEMENT',
    'GROWTH_PHASE',
    'HARVESTING_AQUACULTURE',
    'SALES_AQUACULTURE',
    'PAYOUT_CLOSURE_AQUACULTURE'
);


ALTER TYPE "public"."PROJECT_STAGE" OWNER TO "postgres";


COMMENT ON TYPE "public"."PROJECT_STAGE" IS 'Project stages based on official project timelines document - covers CROP, LIVESTOCK, POULTRY, and AQUACULTURE project types';



CREATE TYPE "public"."PROJECT_TYPES" AS ENUM (
    'CROP',
    'LIVESTOCK',
    'POULTRY'
);


ALTER TYPE "public"."PROJECT_TYPES" OWNER TO "postgres";


COMMENT ON TYPE "public"."PROJECT_TYPES" IS 'PROJECT TYPES';



CREATE TYPE "public"."account_status" AS ENUM (
    'Active',
    'Suspended',
    'Inactive'
);


ALTER TYPE "public"."account_status" OWNER TO "postgres";


CREATE TYPE "public"."admin_status" AS ENUM (
    'Active',
    'Inactive',
    'Suspended'
);


ALTER TYPE "public"."admin_status" OWNER TO "postgres";


CREATE TYPE "public"."admin_type_old" AS ENUM (
    'Supper Admin',
    'Farm Admin',
    'Investment Admin',
    'Finance Admin',
    'Support',
    'Regular User',
    'Super Admin',
    'Marketing',
    'IR Admin',
    'Investment Manager'
);


ALTER TYPE "public"."admin_type_old" OWNER TO "postgres";


CREATE TYPE "public"."audience_type" AS ENUM (
    'Users',
    'Investors',
    'All'
);


ALTER TYPE "public"."audience_type" OWNER TO "postgres";


COMMENT ON TYPE "public"."audience_type" IS 'notification audience types';





ALTER TYPE "public"."channel" OWNER TO "postgres";


COMMENT ON TYPE "public"."channel" IS 'payment channels';



CREATE TYPE "public"."kyc_status" AS ENUM (
    'completed',
    'pending',
    'failed',
    'verified'
);


ALTER TYPE "public"."kyc_status" OWNER TO "postgres";


CREATE TYPE "public"."notification_category" AS ENUM (
    'Investment',
    'System',
    'Marketing',
    'Announcement',
    'Alert'
);


ALTER TYPE "public"."notification_category" OWNER TO "postgres";


CREATE TYPE "public"."notification_channel" AS ENUM (
    'Email',
    'SMS',
    'InApp',
    'Push',
    'All'
);


ALTER TYPE "public"."notification_channel" OWNER TO "postgres";


CREATE TYPE "public"."notification_priority" AS ENUM (
    'Low',
    'Medium',
    'High',
    'Urgent'
);


ALTER TYPE "public"."notification_priority" OWNER TO "postgres";


CREATE TYPE "public"."notification_status" AS ENUM (
    'Scheduled',
    'Published',
    'Failed',
    'Draft'
);


ALTER TYPE "public"."notification_status" OWNER TO "postgres";


CREATE TYPE "public"."notification_type" AS ENUM (
    'InApp',
    'Push',
    'Email',
    'All',
    'SMS'
);


ALTER TYPE "public"."notification_type" OWNER TO "postgres";


COMMENT ON TYPE "public"."notification_type" IS 'type of notifications';



CREATE TYPE "public"."payout_types" AS ENUM (
    'Returns',
    'Principal',
    'Bonus',
    'Dividend',
    'Withdrawal'
);


ALTER TYPE "public"."payout_types" OWNER TO "postgres";


COMMENT ON TYPE "public"."payout_types" IS 'type of payouts';





ALTER TYPE "public"."transaction_status" OWNER TO "postgres";


COMMENT ON TYPE "public"."transaction_status" IS 'status of transactions';





ALTER TYPE "public"."transaction_type" OWNER TO "postgres";


COMMENT ON TYPE "public"."transaction_type" IS 'type of transactions';



CREATE TYPE "public"."user_gender" AS ENUM (
    'Male',
    'Female',
    'Other'
);


ALTER TYPE "public"."user_gender" OWNER TO "postgres";


CREATE TYPE "public"."user_notification_status" AS ENUM (
    'Unread',
    'Read',
    'Dismissed'
);


ALTER TYPE "public"."user_notification_status" OWNER TO "postgres";


COMMENT ON TYPE "public"."user_notification_status" IS 'status of user notification';



CREATE TYPE "public"."wallet_type" AS ENUM (
    'USER',
    'COMPANY'
);


ALTER TYPE "public"."wallet_type" OWNER TO "postgres";


COMMENT ON TYPE "public"."wallet_type" IS 'type of wallet ';



CREATE OR REPLACE FUNCTION "public"."approve_request"("p_request_id" "uuid", "p_reviewed_by" "uuid", "p_approval_notes" "text" DEFAULT NULL::"text") RETURNS boolean
    LANGUAGE "plpgsql"
    AS $$
DECLARE
  v_requested_by UUID;
  v_request_type VARCHAR(50);
  v_request_data JSONB;
  v_related_project_id UUID;
  v_related_payout_id UUID;
  v_reviewed_by_name VARCHAR(255);
  v_reviewed_by_role VARCHAR(100);
BEGIN
  -- Get reviewer details
  SELECT name, role INTO v_reviewed_by_name, v_reviewed_by_role
  FROM admins WHERE id = p_reviewed_by;
  
  -- Get request details
  SELECT requested_by, request_type, request_data, related_project_id, related_payout_id
  INTO v_requested_by, v_request_type, v_request_data, v_related_project_id, v_related_payout_id
  FROM approval_requests WHERE id = p_request_id;
  
  -- Update the request status
  UPDATE approval_requests SET
    status = 'Approved',
    reviewed_by = p_reviewed_by,
    reviewed_by_name = v_reviewed_by_name,
    reviewed_at = NOW(),
    approval_notes = p_approval_notes
  WHERE id = p_request_id;
  
  -- Log the approval
  INSERT INTO approval_audit_log (
    approval_request_id,
    action,
    performed_by,
    performed_by_name,
    performed_by_role
  ) VALUES (
    p_request_id,
    'Approved',
    p_reviewed_by,
    v_reviewed_by_name,
    v_reviewed_by_role
  );
  
  -- Process the approved request based on type
  IF v_request_type = 'Investment Creation' AND v_related_project_id IS NOT NULL THEN
    -- Activate the project
    UPDATE projects SET status = 'Active' WHERE id = v_related_project_id;
  ELSIF v_request_type = 'Payout Processing' AND v_related_payout_id IS NOT NULL THEN
    -- Process the payout (this would trigger the actual payout processing)
    UPDATE payouts SET status = 'Processing' WHERE id = v_related_payout_id;
  END IF;
  
  RETURN TRUE;
END;
$$;


ALTER FUNCTION "public"."approve_request"("p_request_id" "uuid", "p_reviewed_by" "uuid", "p_approval_notes" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."audit_wallet_changes"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
  change_action TEXT;
  amount_change NUMERIC;
BEGIN
  -- Determine change type based on pending_balance movement
  IF COALESCE(OLD.pending_balance, 0) < COALESCE(NEW.pending_balance, 0) THEN
    change_action := 'deposit';
    amount_change := COALESCE(NEW.pending_balance, 0) - COALESCE(OLD.pending_balance, 0);
  ELSIF COALESCE(OLD.pending_balance, 0) > COALESCE(NEW.pending_balance, 0) THEN
    change_action := 'withdrawal';
    amount_change := COALESCE(OLD.pending_balance, 0) - COALESCE(NEW.pending_balance, 0);
  ELSE
    change_action := 'update';
    amount_change := 0;
  END IF;

  INSERT INTO public.wallet_audit_log (
    wallet_id,
    action,
    old_balance,
    new_balance,
    amount,
    user_id,
    created_at
  )
  VALUES (
    NEW.id,
    change_action,
    COALESCE(OLD.pending_balance, 0),
    COALESCE(NEW.pending_balance, 0),
    amount_change,
    NEW.profile_id,
    NOW()
  );

  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."audit_wallet_changes"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."calc_full_months"("start_d" "date", "end_d" "date") RETURNS integer
    LANGUAGE "sql" IMMUTABLE STRICT
    AS $$
  -- age returns an interval; extract years and months, convert to total months
  SELECT (extract(year FROM age(end_d, start_d))::int * 12)
       + (extract(month FROM age(end_d, start_d))::int);
$$;


ALTER FUNCTION "public"."calc_full_months"("start_d" "date", "end_d" "date") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."calculate_investor_units"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    -- Calculate total units and amount for the investor
    SELECT 
        COALESCE(SUM(unit), 0), 
        COALESCE(SUM(amount), 0)
    INTO NEW.unit, NEW.amount
    FROM transactions 
    WHERE project_id = NEW.project_id 
      AND profile_id = NEW.profile_id  -- Changed from profile_id
      AND type = 'Payin' 
      AND status = 'Complete';
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."calculate_investor_units"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."calculate_payout_amount"("base_amount" numeric, "payment_method" character varying) RETURNS numeric
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    RETURN CASE 
        WHEN payment_method = 'BOTH' THEN base_amount
        WHEN payment_method = 'MOMO' THEN base_amount * 0.98 -- 2% fee for MoMo
        WHEN payment_method = 'BANK' THEN base_amount * 0.99 -- 1% fee for Bank
        ELSE base_amount
    END;
END;
$$;


ALTER FUNCTION "public"."calculate_payout_amount"("base_amount" numeric, "payment_method" character varying) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."calculate_project_duration_months"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
    calculated_duration INTEGER;
BEGIN
    -- Calculate duration based on project type and stages
    CASE NEW.project_type
        WHEN 'CROP' THEN
            calculated_duration := 7; -- CROP projects: ~213 days = ~7 months
        WHEN 'LIVESTOCK' THEN
            calculated_duration := 9; -- LIVESTOCK projects: ~259 days = ~9 months
        WHEN 'POULTRY' THEN
            calculated_duration := 4; -- POULTRY projects: ~108 days = ~4 months
        WHEN 'AQUACULTURE' THEN
            calculated_duration := 9; -- AQUACULTURE projects: ~280 days = ~9 months
        ELSE
            calculated_duration := 6; -- Default duration for other types
    END CASE;
    
    -- Update the duration_months field
    NEW.duration_months := calculated_duration;
    
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."calculate_project_duration_months"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."create_approval_request"("p_request_type" character varying, "p_title" character varying, "p_description" "text", "p_request_data" "jsonb", "p_requested_by" "uuid", "p_priority" character varying DEFAULT 'Medium'::character varying, "p_expires_hours" integer DEFAULT 72, "p_related_project_id" "uuid" DEFAULT NULL::"uuid", "p_related_payout_id" "uuid" DEFAULT NULL::"uuid", "p_related_user_id" "uuid" DEFAULT NULL::"uuid") RETURNS "uuid"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
  v_request_id UUID;
  v_requested_by_name VARCHAR(255);
  v_requested_by_role VARCHAR(100);
BEGIN
  -- Get requester details
  SELECT name, role INTO v_requested_by_name, v_requested_by_role
  FROM admins WHERE id = p_requested_by;
  
  -- Create the approval request
  INSERT INTO approval_requests (
    request_type,
    title,
    description,
    request_data,
    requested_by,
    requested_by_name,
    requested_by_role,
    priority,
    expires_at,
    related_project_id,
    related_payout_id,
    related_user_id
  ) VALUES (
    p_request_type,
    p_title,
    p_description,
    p_request_data,
    p_requested_by,
    v_requested_by_name,
    v_requested_by_role,
    p_priority,
    NOW() + (p_expires_hours || ' hours')::INTERVAL,
    p_related_project_id,
    p_related_payout_id,
    p_related_user_id
  ) RETURNING id INTO v_request_id;
  
  -- Log the creation
  INSERT INTO approval_audit_log (
    approval_request_id,
    action,
    performed_by,
    performed_by_name,
    performed_by_role
  ) VALUES (
    v_request_id,
    'Created',
    p_requested_by,
    v_requested_by_name,
    v_requested_by_role
  );
  
  RETURN v_request_id;
END;
$$;


ALTER FUNCTION "public"."create_approval_request"("p_request_type" character varying, "p_title" character varying, "p_description" "text", "p_request_data" "jsonb", "p_requested_by" "uuid", "p_priority" character varying, "p_expires_hours" integer, "p_related_project_id" "uuid", "p_related_payout_id" "uuid", "p_related_user_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."delete_project_safely"("p_project_id" "uuid") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  -- Step 1: Set related_project_id to NULL for all approval requests
  UPDATE approval_requests
  WHERE related_project_id = p_project_id;

  -- Step 2: Delete records with NO ACTION constraints
  DELETE FROM investments WHERE project_id = p_project_id;
  DELETE FROM project_stage WHERE project_id = p_project_id;

  -- Step 3: Delete records with CASCADE constraints (explicit for clarity)
  DELETE FROM transactions WHERE project_id = p_project_id;
  DELETE FROM payouts WHERE project_id = p_project_id;
  DELETE FROM project_reports WHERE project_id = p_project_id;
  DELETE FROM project_updates WHERE project_id = p_project_id;
  DELETE FROM high_ticket_investments WHERE project_id = p_project_id;

  -- Step 4: Finally, delete the project
  DELETE FROM projects WHERE id = p_project_id;
END;
$$;


ALTER FUNCTION "public"."delete_project_safely"("p_project_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."find_blocking_triggers"() RETURNS TABLE("trigger_name" "text", "table_name" "text", "trigger_timing" "text", "trigger_event" "text", "trigger_function" "text")
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    RETURN QUERY
    SELECT 
        t.tgname::TEXT AS trigger_name,
        t.tgrelid::regclass::TEXT AS table_name,
        CASE 
            WHEN t.tgtype & (1 << 0) <> 0 THEN 'BEFORE'
            WHEN t.tgtype & (1 << 6) <> 0 THEN 'AFTER'
            ELSE 'INSTEAD OF'
        END AS trigger_timing,
        CASE 
            WHEN t.tgtype & (1 << 1) <> 0 THEN 'INSERT'
            WHEN t.tgtype & (1 << 2) <> 0 THEN 'DELETE'
            WHEN t.tgtype & (1 << 3) <> 0 THEN 'UPDATE'
            WHEN t.tgtype & (1 << 4) <> 0 THEN 'TRUNCATE'
        END AS trigger_event,
        p.proname::TEXT AS trigger_function
    FROM pg_trigger t
    JOIN pg_proc p ON t.tgfoid = p.oid
    WHERE t.tgrelid = 'transactions'::regclass
       OR t.tgrelid = 'profiles'::regclass
    ORDER BY t.tgname;
END;
$$;


ALTER FUNCTION "public"."find_blocking_triggers"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."generate_approval_request_id"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  NEW.request_id := 'REQ' || UPPER(SUBSTRING(NEW.id::text, 1, 6)) || EXTRACT(EPOCH FROM NOW())::bigint;
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."generate_approval_request_id"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."generate_high_ticket_investment_id"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    IF NEW.investment_id IS NULL THEN
        NEW.investment_id := 'HTI' || LPAD(FLOOR(RANDOM() * 100000)::TEXT, 5, '0');
    END IF;
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."generate_high_ticket_investment_id"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."generate_project_report_id"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  NEW.report_id := 'PR' || LPAD(EXTRACT(YEAR FROM NOW())::TEXT, 2, '0') ||
                   LPAD(EXTRACT(MONTH FROM NOW())::TEXT, 2, '0') ||
                   LPAD(NEXTVAL('project_report_seq')::TEXT, 4, '0');
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."generate_project_report_id"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."generate_project_update_id"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  NEW.id := gen_random_uuid();
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."generate_project_update_id"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."generate_transaction_id"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    IF NEW.transaction_id IS NULL THEN
        NEW.transaction_id := 'txn' || nextval('transaction_id_seq'); -- Adjust based on actual logic
    END IF;
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."generate_transaction_id"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."generate_user_invitation_id"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    IF NEW.invitation_id IS NULL THEN
        NEW.invitation_id := 'INV' || LPAD(FLOOR(RANDOM() * 100000)::TEXT, 5, '0');
    END IF;
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."generate_user_invitation_id"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_current_user_email"() RETURNS "text"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  user_email text;
BEGIN
  SELECT email INTO user_email
  FROM auth.users
  WHERE id = auth.uid();
  
  RETURN user_email;
END;
$$;


ALTER FUNCTION "public"."get_current_user_email"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_dashboard_stats"() RETURNS json
    LANGUAGE "plpgsql"
    AS $$
DECLARE
    result JSON;
BEGIN
    SELECT json_build_object(
        'totalUsers', (SELECT COUNT(*) FROM users WHERE account_status = 'Active'),
        'activeUsers', (SELECT COUNT(*) FROM users WHERE account_status = 'Active' AND last_login > NOW() - INTERVAL '30 days'),
        'totalInvestments', (SELECT COALESCE(SUM(total_invested), 0) FROM users),
        'activeInvestments', (SELECT COUNT(DISTINCT project_id) FROM transactions WHERE status IN ('Complete', 'Pending')),
        'transactionVolume', (SELECT COALESCE(SUM(amount), 0) FROM transactions WHERE status = 'Complete'),
        'activeInvestors', (SELECT COUNT(DISTINCT user_id) FROM transactions WHERE status IN ('Complete', 'Pending'))
    ) INTO result;
    
    RETURN result;
END;
$$;


ALTER FUNCTION "public"."get_dashboard_stats"() OWNER TO "postgres";


COMMENT ON FUNCTION "public"."get_dashboard_stats"() IS 'Returns aggregated dashboard metrics';



CREATE OR REPLACE FUNCTION "public"."get_investor_summary"("p_project_id" "uuid") RETURNS TABLE("user_id" "uuid", "total_units" integer, "total_amount" numeric, "transaction_count" integer, "first_investment_date" timestamp with time zone, "last_investment_date" timestamp with time zone)
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    RETURN QUERY
    SELECT 
        t.user_id,
        COALESCE(SUM(t.unit), 0)::INTEGER as total_units,
        COALESCE(SUM(t.amount), 0) as total_amount,
        COUNT(*)::INTEGER as transaction_count,
        MIN(t.created_at) as first_investment_date,
        MAX(t.created_at) as last_investment_date
    FROM transactions t
    WHERE t.project_id = p_project_id 
    AND t.type = 'Payin' 
    AND t.status = 'Complete'
    GROUP BY t.user_id
    ORDER BY total_amount DESC;
END;
$$;


ALTER FUNCTION "public"."get_investor_summary"("p_project_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_transaction_analytics"() RETURNS json
    LANGUAGE "plpgsql"
    AS $$
DECLARE
    result JSON;
BEGIN
    SELECT json_build_object(
        'totalTransactions', (SELECT COUNT(*) FROM transactions),
        'completedTransactions', (SELECT COUNT(*) FROM transactions WHERE status = 'Complete'),
        'pendingTransactions', (SELECT COUNT(*) FROM transactions WHERE status = 'Pending'),
        'failedTransactions', (SELECT COUNT(*) FROM transactions WHERE status = 'Failed'),
        'totalAmount', (SELECT COALESCE(SUM(amount), 0) FROM transactions WHERE status = 'Complete'),
        'averageAmount', (SELECT COALESCE(AVG(amount), 0) FROM transactions WHERE status = 'Complete')
    ) INTO result;
    
    RETURN result;
END;
$$;


ALTER FUNCTION "public"."get_transaction_analytics"() OWNER TO "postgres";


COMMENT ON FUNCTION "public"."get_transaction_analytics"() IS 'Returns transaction analytics and statistics';



CREATE OR REPLACE FUNCTION "public"."get_user_analytics"() RETURNS json
    LANGUAGE "plpgsql"
    AS $$
DECLARE
    result JSON;
BEGIN
    SELECT json_build_object(
        'totalUsers', (SELECT COUNT(*) FROM users),
        'activeUsers', (SELECT COUNT(*) FROM users WHERE account_status = 'Active'),
        'suspendedUsers', (SELECT COUNT(*) FROM users WHERE account_status = 'Suspended'),
        'inactiveUsers', (SELECT COUNT(*) FROM users WHERE account_status = 'Inactive'),
        'kycComplete', (SELECT COUNT(*) FROM users WHERE kyc_status = 'Complete'),
        'kycPending', (SELECT COUNT(*) FROM users WHERE kyc_status = 'Pending'),
        'kycFailed', (SELECT COUNT(*) FROM users WHERE kyc_status = 'Failed')
    ) INTO result;
    
    RETURN result;
END;
$$;


ALTER FUNCTION "public"."get_user_analytics"() OWNER TO "postgres";


COMMENT ON FUNCTION "public"."get_user_analytics"() IS 'Returns user analytics and statistics';



CREATE OR REPLACE FUNCTION "public"."handle_new_user"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  -- Create profile
  INSERT INTO public.profiles (id, first_name, last_name, country, phone_number)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'first_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'last_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'country', ''),
    COALESCE(NEW.raw_user_meta_data->>'phone_number', '')
  );
  
  -- Create wallet
  INSERT INTO public.wallets (user_id, balance, currency)
  VALUES (NEW.id, 0.00, 'GHS');
  
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RAISE LOG 'Error creating profile/wallet: %', SQLERRM;
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."handle_new_user"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."handle_new_user_signup"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
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
$$;


ALTER FUNCTION "public"."handle_new_user_signup"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."is_admin"("user_id" "uuid") RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 
    FROM admins a
    JOIN auth.users au ON TRIM(au.email) = TRIM(a.email)
    WHERE au.id = user_id
    AND a.status = 'Active'::admin_status
  );
END;
$$;


ALTER FUNCTION "public"."is_admin"("user_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."is_finance_admin"("user_id" "uuid") RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  user_email text;
BEGIN
  -- Get the email of the authenticated user
  SELECT email INTO user_email
  FROM auth.users
  WHERE id = user_id;
  
  -- If no email found, return false
  IF user_email IS NULL THEN
    RETURN false;
  END IF;
  
  -- Check if the user is a Finance Admin by email
  RETURN EXISTS (
    SELECT 1 FROM admins
    WHERE admins.email = user_email
    AND admins.role::text = 'Finance Admin'
    AND admins.status = 'Active'::admin_status
  );
END;
$$;


ALTER FUNCTION "public"."is_finance_admin"("user_id" "uuid") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."is_finance_admin"("user_id" "uuid") IS 'Checks if a user is a Finance Admin';



CREATE OR REPLACE FUNCTION "public"."is_finance_or_super_admin"("user_id" "uuid") RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 
    FROM admins a
    JOIN auth.users au ON TRIM(au.email) = TRIM(a.email)
    WHERE au.id = user_id
    AND a.status = 'Active'::admin_status
    AND (a.role = 'Finance Admin' OR a.role = 'Super Admin')
  );
END;
$$;


ALTER FUNCTION "public"."is_finance_or_super_admin"("user_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."is_investment_admin"("user_id" "uuid") RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  user_email text;
BEGIN
  -- Get the email of the authenticated user
  SELECT email INTO user_email
  FROM auth.users
  WHERE id = user_id;
  
  -- If no email found, return false
  IF user_email IS NULL THEN
    RETURN false;
  END IF;
  
  -- Check if the user is an Investment Admin by email
  RETURN EXISTS (
    SELECT 1 FROM admins
    WHERE admins.email = user_email
    AND (
      admins.role::text = 'Investment Admin'
      OR admins.role::text = 'Investment Manager'
    )
    AND admins.status = 'Active'::admin_status
  );
END;
$$;


ALTER FUNCTION "public"."is_investment_admin"("user_id" "uuid") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."is_investment_admin"("user_id" "uuid") IS 'Checks if a user is an Investment Admin or Investment Manager';



CREATE OR REPLACE FUNCTION "public"."is_super_admin"("user_id" "uuid") RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  user_email text;
BEGIN
  -- Get the email of the authenticated user
  SELECT email INTO user_email
  FROM auth.users
  WHERE id = user_id;
  
  -- If no email found, return false
  IF user_email IS NULL THEN
    RETURN false;
  END IF;
  
  -- Check if the user is a super admin by email
  RETURN EXISTS (
    SELECT 1 FROM admins
    WHERE admins.email = user_email
    AND (
      admins.role::text = 'Super Admin'
      OR admins.role::text = 'Supper Admin'
      OR admins.admin_type::text = 'Super Admin'
      OR admins.admin_type::text = 'Supper Admin'
    )
    AND admins.status = 'Active'::admin_status
  );
END;
$$;


ALTER FUNCTION "public"."is_super_admin"("user_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."process_wallet_transaction"("p_wallet_id" "uuid", "p_amount" numeric, "p_type" character varying, "p_description" "text" DEFAULT NULL::"text") RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  current_balance DECIMAL(15,2);
  transaction_type transaction_type;
BEGIN
  -- Get current balance
  SELECT balance INTO current_balance 
  FROM public.wallets 
  WHERE id = p_wallet_id;
  
  -- Map string type to enum type
  IF p_type = 'deposit' OR p_type = 'topup' OR p_type = 'payin' THEN
    transaction_type := 'Payin';
  ELSIF p_type = 'withdrawal' OR p_type = 'payout' OR p_type = 'withdraw' THEN
    transaction_type := 'Payout';
  ELSIF p_type = 'refund' THEN
    transaction_type := 'Refund';
  ELSE
    -- Default to Payin for positive amounts, Payout for negative
    IF p_amount > 0 THEN
      transaction_type := 'Payin';
    ELSE
      transaction_type := 'Payout';
    END IF;
  END IF;
  
  -- Check if sufficient funds for withdrawal
  IF transaction_type = 'Payout' AND current_balance < ABS(p_amount) THEN
    RETURN FALSE;
  END IF;
  
  -- Update wallet balance
  UPDATE public.wallets 
      updated_at = NOW()
  WHERE id = p_wallet_id;
  
  -- Record transaction with correct enum type
  INSERT INTO public.transactions (
    wallet_id, amount, type, description, created_at
  ) VALUES (
    p_wallet_id, p_amount, transaction_type, p_description, NOW()
  );
  
  RETURN TRUE;
END;
$$;


ALTER FUNCTION "public"."process_wallet_transaction"("p_wallet_id" "uuid", "p_amount" numeric, "p_type" character varying, "p_description" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."projects_set_duration_months"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  -- If either date is null, set duration to null
  IF NEW.start_date IS NULL OR NEW.end_date IS NULL THEN
    NEW.duration_months := NULL;
    RETURN NEW;
  END IF;

  -- Guard against invalid range
  IF NEW.end_date < NEW.start_date THEN
    RAISE EXCEPTION 'end_date (%) cannot be earlier than start_date (%)', NEW.end_date, NEW.start_date
      USING ERRCODE = '22007'; -- invalid_datetime_format
  END IF;

  -- Compute full months between dates
  NEW.duration_months := public.calc_full_months(NEW.start_date, NEW.end_date);

  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."projects_set_duration_months"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."recalculate_all_project_units"() RETURNS TABLE("project_id" "uuid", "project_name" character varying, "total_units" integer, "old_purchased_units" bigint, "new_purchased_units" bigint, "old_available_units" bigint, "new_available_units" bigint, "status" "text")
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    v_project_record RECORD;
    v_calculated_purchased_units BIGINT;
    v_calculated_available_units BIGINT;
BEGIN
    FOR v_project_record IN 
        SELECT * FROM projects ORDER BY created_at
    LOOP
        -- Calculate purchased_unit from transactions
        SELECT COALESCE(SUM(unit), 0)
        INTO v_calculated_purchased_units
        FROM transactions
        WHERE project_id = v_project_record.id
          AND type IN ('investment', 'Payin')
          AND status = 'Complete'
          AND unit IS NOT NULL
          AND unit > 0;
        
        -- Calculate available_unit
        v_calculated_available_units := v_project_record.total_units - v_calculated_purchased_units;
        
        -- Ensure values are not negative
        IF v_calculated_available_units < 0 THEN
            v_calculated_available_units := 0;
        END IF;
        
        IF v_calculated_purchased_units < 0 THEN
            v_calculated_purchased_units := 0;
        END IF;
        
        -- Update the project
        UPDATE projects
            purchased_unit = v_calculated_purchased_units,
            available_unit = v_calculated_available_units,
            updated_at = NOW()
        WHERE id = v_project_record.id;
        
        -- Return the result
        RETURN QUERY
        SELECT 
            v_project_record.id,
            v_project_record.project_name,
            v_project_record.total_units,
            v_project_record.purchased_unit,
            v_calculated_purchased_units,
            v_project_record.available_unit,
            v_calculated_available_units,
            CASE 
                WHEN v_project_record.purchased_unit != v_calculated_purchased_units 
                     OR v_project_record.available_unit != v_calculated_available_units 
                THEN 'UPDATED'
                ELSE 'OK'
            END as status;
    END LOOP;
    
    RETURN;
END;
$$;


ALTER FUNCTION "public"."recalculate_all_project_units"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."recalculate_project_units"("p_project_id" "uuid") RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    v_project_record RECORD;
    v_calculated_purchased_units BIGINT;
    v_calculated_available_units BIGINT;
    v_result JSONB;
BEGIN
    -- Get the project with lock
    SELECT *
    INTO v_project_record
    FROM projects
    WHERE id = p_project_id
    FOR UPDATE;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Project not found: %', p_project_id
            USING ERRCODE = 'P0001';
    END IF;
    
    -- Calculate purchased_unit from transactions
    SELECT COALESCE(SUM(unit), 0)
    INTO v_calculated_purchased_units
    FROM transactions
    WHERE project_id = p_project_id
      AND type IN ('investment', 'Payin')
      AND status = 'Complete'
      AND unit IS NOT NULL
      AND unit > 0;
    
    -- Calculate available_unit
    v_calculated_available_units := v_project_record.total_units - v_calculated_purchased_units;
    
    -- Ensure values are not negative
    IF v_calculated_available_units < 0 THEN
        v_calculated_available_units := 0;
    END IF;
    
    IF v_calculated_purchased_units < 0 THEN
        v_calculated_purchased_units := 0;
    END IF;
    
    -- Update the project
    UPDATE projects
        purchased_unit = v_calculated_purchased_units,
        available_unit = v_calculated_available_units,
        updated_at = NOW()
    WHERE id = p_project_id;
    
    -- Build result
    v_result := jsonb_build_object(
        'success', true,
        'project_id', p_project_id,
        'project_name', v_project_record.project_name,
        'total_units', v_project_record.total_units,
        'purchased_units', v_calculated_purchased_units,
        'available_units', v_calculated_available_units,
        'message', format('Recalculated units for project %s. Purchased: %, Available: %', 
            v_project_record.project_name, 
            v_calculated_purchased_units, 
            v_calculated_available_units)
    );
    
    RETURN v_result;
END;
$$;


ALTER FUNCTION "public"."recalculate_project_units"("p_project_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."reject_request"("p_request_id" "uuid", "p_reviewed_by" "uuid", "p_rejection_reason" "text") RETURNS boolean
    LANGUAGE "plpgsql"
    AS $$
DECLARE
  v_request_type VARCHAR(50);
  v_related_project_id UUID;
  v_related_payout_id UUID;
  v_reviewed_by_name VARCHAR(255);
  v_reviewed_by_role VARCHAR(100);
BEGIN
  -- Get reviewer details
  SELECT name, role INTO v_reviewed_by_name, v_reviewed_by_role
  FROM admins WHERE id = p_reviewed_by;
  
  -- Get request details
  SELECT request_type, related_project_id, related_payout_id 
  INTO v_request_type, v_related_project_id, v_related_payout_id
  FROM approval_requests WHERE id = p_request_id;
  
  -- Update the request status
  UPDATE approval_requests SET
    status = 'Rejected',
    reviewed_by = p_reviewed_by,
    reviewed_by_name = v_reviewed_by_name,
    reviewed_at = NOW(),
    rejection_reason = p_rejection_reason
  WHERE id = p_request_id;
  
  -- Log the rejection
  INSERT INTO approval_audit_log (
    approval_request_id,
    action,
    performed_by,
    performed_by_name,
    performed_by_role,
    action_details
  ) VALUES (
    p_request_id,
    'Rejected',
    p_reviewed_by,
    v_reviewed_by_name,
    v_reviewed_by_role,
    jsonb_build_object('rejection_reason', p_rejection_reason)
  );
  
  -- Process rejected requests based on type
  IF v_request_type = 'Payout Processing' AND v_related_payout_id IS NOT NULL THEN
    -- Mark the payout as failed
    UPDATE payouts SET status = 'Failed' WHERE id = v_related_payout_id;
  END IF;
  
  -- If this is a project approval request, update the project status to REJECTED
  IF v_related_project_id IS NOT NULL THEN
    UPDATE projects 
    WHERE id = v_related_project_id;
  END IF;
  
  RETURN TRUE;
END;
$$;


ALTER FUNCTION "public"."reject_request"("p_request_id" "uuid", "p_reviewed_by" "uuid", "p_rejection_reason" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."sync_all_project_units"() RETURNS TABLE("project_id" "uuid", "project_code" character varying, "project_name" character varying, "total_units" integer, "purchased_units" integer, "available_units" integer, "unit_price" numeric, "total_investors" integer, "total_invested" numeric)
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    RETURN QUERY
    SELECT 
        p.id,
        p.project_code,
        p.project_name,
        p.total_units,
        COALESCE(SUM(CASE WHEN t.type = 'Payin' AND t.status = 'Complete' THEN t.unit ELSE 0 END), 0)::INTEGER as purchased_units,
        (p.total_units - COALESCE(SUM(CASE WHEN t.type = 'Payin' AND t.status = 'Complete' THEN t.unit ELSE 0 END), 0))::INTEGER as available_units,
        p.unit_price,
        COUNT(DISTINCT CASE WHEN t.type = 'Payin' AND t.status = 'Complete' THEN t.user_id END)::INTEGER as total_investors,
        COALESCE(SUM(CASE WHEN t.type = 'Payin' AND t.status = 'Complete' THEN t.amount ELSE 0 END), 0) as total_invested
    FROM projects p
    LEFT JOIN transactions t ON p.id = t.project_id
    GROUP BY p.id, p.project_code, p.project_name, p.total_units, p.unit_price
    ORDER BY p.created_at DESC;
END;
$$;


ALTER FUNCTION "public"."sync_all_project_units"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."sync_available_units"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    -- Recalculate available_unit based on total_units and purchased_unit
    -- This ensures available_unit is always correct when total_units or purchased_unit changes
    NEW.available_unit := GREATEST(
        COALESCE(NEW.total_units, 0) - COALESCE(NEW.purchased_unit, 0),
        0
    );
    
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."sync_available_units"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."sync_investor_from_auth"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
begin
  insert into public.users (
    id,
    user_id,
    name,
    email,
    phone,
    date_joined,
    country,
    created_at,
    updated_at
  )
  values (
    NEW.id,
    'USR-' || left(NEW.id::text, 8),
    coalesce(NEW.raw_user_meta_data ->> 'name', 'Unknown'),
    NEW.email,
    coalesce(NEW.raw_user_meta_data ->> 'phone', ''),
    current_date,
    coalesce(NEW.raw_user_meta_data ->> 'country', 'Ghana'),
    now(),
    now()
  )
  on conflict (id) do nothing;

  return NEW;
end;
$$;


ALTER FUNCTION "public"."sync_investor_from_auth"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."sync_project_units_comprehensive"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    v_calculated_purchased_units BIGINT;
    v_calculated_available_units BIGINT;
    v_total_units INTEGER;
BEGIN
    -- Skip if this is a DELETE operation (handled separately if needed)
    IF TG_OP = 'DELETE' THEN
        RETURN OLD;
    END IF;
    
    -- Ensure total_units is not NULL and is positive
    IF NEW.total_units IS NULL OR NEW.total_units < 0 THEN
        RAISE EXCEPTION 'total_units must be a positive integer. Got: %', NEW.total_units
            USING ERRCODE = '23514';
    END IF;
    
    v_total_units := NEW.total_units;
    
    -- Calculate purchased_unit from actual transactions (source of truth)
    -- For INSERT operations, NEW.id might not exist yet, so start with 0
    IF TG_OP = 'INSERT' THEN
        -- For new projects, start with 0 purchased units
        v_calculated_purchased_units := 0;
    ELSE
        -- For UPDATE operations, recalculate from transactions using NEW.id
        SELECT COALESCE(SUM(unit), 0)
        INTO v_calculated_purchased_units
        FROM transactions
        WHERE project_id = NEW.id
          AND type IN ('investment', 'Payin')
          AND status = 'Complete'
          AND unit IS NOT NULL
          AND unit > 0;
    END IF;
    
    -- Ensure purchased_unit is not negative
    IF v_calculated_purchased_units < 0 THEN
        v_calculated_purchased_units := 0;
    END IF;
    
    -- Validate that total_units is not less than purchased_units
    IF v_total_units < v_calculated_purchased_units THEN
        RAISE EXCEPTION 'total_units (%) cannot be less than purchased_units (%). Project: %', 
            v_total_units, v_calculated_purchased_units, COALESCE(NEW.project_name, NEW.id::text)
            USING ERRCODE = '23514';
    END IF;
    
    -- Calculate available_unit: total_units - purchased_unit
    v_calculated_available_units := v_total_units - v_calculated_purchased_units;
    
    -- Ensure available_unit is never negative (safety check)
    IF v_calculated_available_units < 0 THEN
        v_calculated_available_units := 0;
    END IF;
    
    -- Set the calculated values
    NEW.purchased_unit := v_calculated_purchased_units;
    NEW.available_unit := v_calculated_available_units;
    
    -- Ensure unit_price is not negative
    IF NEW.unit_price IS NOT NULL AND NEW.unit_price < 0 THEN
        RAISE EXCEPTION 'unit_price cannot be negative. Got: %', NEW.unit_price
            USING ERRCODE = '23514';
    END IF;
    
    -- Ensure expected_return_rate is not negative
    IF NEW.expected_return_rate IS NOT NULL AND NEW.expected_return_rate < 0 THEN
        RAISE EXCEPTION 'expected_return_rate cannot be negative. Got: %', NEW.expected_return_rate
            USING ERRCODE = '23514';
    END IF;
    
    -- Ensure max_expected_return_rate is not negative
    IF NEW.max_expected_return_rate IS NOT NULL AND NEW.max_expected_return_rate < 0 THEN
        NEW.max_expected_return_rate := 0;
    END IF;
    
    -- Ensure min_investment_amount is not negative
    IF NEW.min_investment_amount IS NOT NULL AND NEW.min_investment_amount < 0 THEN
        NEW.min_investment_amount := 0;
    END IF;
    
    -- Ensure max_investment_amount is not negative
    IF NEW.max_investment_amount IS NOT NULL AND NEW.max_investment_amount < 0 THEN
        NEW.max_investment_amount := 0;
    END IF;
    
    -- Validate min/max investment amounts relationship
    IF NEW.min_investment_amount IS NOT NULL 
       AND NEW.max_investment_amount IS NOT NULL 
       AND NEW.max_investment_amount > 0 
       AND NEW.min_investment_amount > NEW.max_investment_amount THEN
        RAISE EXCEPTION 'min_investment_amount (%) cannot be greater than max_investment_amount (%)', 
            NEW.min_investment_amount, NEW.max_investment_amount
            USING ERRCODE = '23514';
    END IF;
    
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."sync_project_units_comprehensive"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."sync_wallet_balances_for_payouts"() RETURNS TABLE("profile_id" "uuid", "wallet_id" "uuid", "old_balance" numeric, "new_balance" numeric, "total_payouts" numeric, "transactions_count" bigint)
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  profile_uuid uuid;
  wallet_rec RECORD;
  payout_sum NUMERIC;
  payout_count BIGINT;
  old_balance_val NUMERIC;
BEGIN
  -- Loop through all profiles with payout transactions
  FOR profile_uuid IN
    SELECT DISTINCT t.profile_id
    FROM transactions t
    WHERE t.type = 'Payout'
      AND t.status = 'Complete'
      AND t.profile_id IS NOT NULL
  LOOP
    -- Get wallet for this profile
    SELECT w.id, w.balance
    INTO wallet_rec
    FROM wallets w
    WHERE w.profile_id = profile_uuid
      AND w.wallet_type = 'user'
    LIMIT 1;
    
    -- If wallet exists, calculate total payouts
    IF FOUND THEN
      old_balance_val := COALESCE(wallet_rec.balance, 0);
      
      SELECT 
        COALESCE(SUM(t.amount), 0),
        COUNT(*)
      INTO payout_sum, payout_count
      FROM transactions t
      WHERE t.profile_id = profile_uuid
        AND t.type = 'Payout'
        AND t.status = 'Complete';
      
      -- Update wallet balance (add payouts)
      UPDATE wallets
          updated_at = NOW()
      WHERE id = wallet_rec.id;
      
      -- Return the result
      RETURN QUERY
      SELECT 
        profile_uuid,
        wallet_rec.id,
        old_balance_val,
        old_balance_val + payout_sum,
        payout_sum,
        payout_count;
    END IF;
  END LOOP;
  
  RETURN;
END;
$$;


ALTER FUNCTION "public"."sync_wallet_balances_for_payouts"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_approval_requests_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  NEW.updated_at := NOW();
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_approval_requests_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_available_units_on_project_change"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  IF (NEW.total_units IS DISTINCT FROM OLD.total_units)
     OR (NEW.purchased_unit IS DISTINCT FROM OLD.purchased_unit) THEN
    NEW.available_unit := GREATEST(NEW.total_units - COALESCE(NEW.purchased_unit, 0), 0);
  END IF;
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_available_units_on_project_change"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_available_units_on_total_units_change"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  -- Only update available_unit if total_units actually changes
  IF NEW.total_units IS DISTINCT FROM OLD.total_units THEN
    NEW.available_unit := GREATEST(NEW.total_units - COALESCE(NEW.purchased_unit, 0), 0);
  END IF;

  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_available_units_on_total_units_change"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_last_login"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  UPDATE public.users
      updated_at = NOW()
  WHERE id = NEW.id;
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_last_login"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_payment_accounts_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_payment_accounts_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_project_available_units"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  -- Always recalculate available units based on latest totals
  NEW.available_unit := COALESCE(NEW.total_units, 0) - COALESCE(NEW.purchased_unit, 0);

  -- Ensure it never goes below zero
  IF NEW.available_unit < 0 THEN
    NEW.available_unit := 0;
  END IF;

  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_project_available_units"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_project_stock_after_transaction"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    current_available INTEGER;
    project_exists BOOLEAN;
    new_available INTEGER;
    new_purchased INTEGER;
    project_total_units INTEGER;
BEGIN
    -- Process BOTH 'Payin' and 'investment' transaction types when they have a project_id
    -- Payin with project_id = investment in a project
    IF NEW.type NOT IN ('Payin', 'investment') THEN
        RETURN NEW;
    END IF;
    
    -- Only process transactions with status 'Complete'
    IF NEW.status != 'Complete' THEN
        RETURN NEW;
    END IF;
    
    -- Skip if project_id is NULL (not a project investment)
    IF NEW.project_id IS NULL THEN
        RETURN NEW;
    END IF;
    
    -- First check if project exists
    SELECT EXISTS(SELECT 1 FROM projects WHERE id = NEW.project_id)
    INTO project_exists;
    
    IF NOT project_exists THEN
        RAISE EXCEPTION 'Project not found: %', NEW.project_id
            USING ERRCODE = 'P0001';
    END IF;
    
    -- Get the current available units and total units with FOR UPDATE to prevent race conditions
    SELECT available_unit, purchased_unit, total_units
    INTO current_available, new_purchased, project_total_units
    FROM projects 
    WHERE id = NEW.project_id 
    FOR UPDATE;
    
    -- Calculate new values
    new_purchased := COALESCE(new_purchased, 0) + COALESCE(NEW.unit, 0);
    new_available := COALESCE(project_total_units, 0) - new_purchased;
    
    -- Double-check that we still have enough units
    IF NEW.unit IS NOT NULL AND NEW.unit > current_available THEN
        RAISE EXCEPTION 'Not enough units available. Requested: %, Available: %', 
            NEW.unit, current_available
            USING ERRCODE = 'P0003';
    END IF;

    -- Only update if unit is not NULL and greater than 0
    IF NEW.unit IS NOT NULL AND NEW.unit > 0 THEN
        -- Update the project stock and total_value in REAL-TIME
        UPDATE projects
            available_unit = GREATEST(0, new_available), -- Ensure it doesn't go negative
            purchased_unit = new_purchased,
            total_value = COALESCE(total_value, 0) + COALESCE(NEW.amount, 0), -- Increment total raised
            updated_at = NOW(),
            -- Update status to 'Fully Funded' if all units are purchased
            status = CASE 
                WHEN new_available <= 0 AND status != 'Complete' AND status != 'Fully Funded' THEN 'Fully Funded'
                ELSE status
            END
        WHERE id = NEW.project_id;
    END IF;

    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_project_stock_after_transaction"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_project_stock_on_status_change"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    current_available INTEGER;
    project_exists BOOLEAN;
    new_available INTEGER;
    new_purchased INTEGER;
    project_total_units INTEGER;
BEGIN
    -- Process BOTH 'Payin' and 'investment' transaction types when they have a project_id
    IF NEW.type NOT IN ('Payin', 'investment') OR NEW.project_id IS NULL THEN
        RETURN NEW;
    END IF;
    
    -- If status changed from non-Complete to Complete, reduce units and update total_value
    IF OLD.status != 'Complete' AND NEW.status = 'Complete' THEN
        -- Check if project exists
        SELECT EXISTS(SELECT 1 FROM projects WHERE id = NEW.project_id)
        INTO project_exists;
        
        IF NOT project_exists THEN
            RAISE EXCEPTION 'Project not found: %', NEW.project_id
                USING ERRCODE = 'P0001';
        END IF;
        
        -- Get current project state with FOR UPDATE
        SELECT available_unit, purchased_unit, total_units
        INTO current_available, new_purchased, project_total_units
        FROM projects 
        WHERE id = NEW.project_id 
        FOR UPDATE;
        
        -- Calculate new values
        new_purchased := COALESCE(new_purchased, 0) + COALESCE(NEW.unit, 0);
        new_available := COALESCE(project_total_units, 0) - new_purchased;
        
        -- Check if enough units available
        IF NEW.unit IS NOT NULL AND NEW.unit > 0 AND NEW.unit > current_available THEN
            RAISE EXCEPTION 'Not enough units available. Requested: %, Available: %', 
                NEW.unit, current_available
                USING ERRCODE = 'P0003';
        END IF;
        
        -- Update project if unit is valid (REAL-TIME update)
        IF NEW.unit IS NOT NULL AND NEW.unit > 0 THEN
            UPDATE projects
                available_unit = GREATEST(0, new_available),
                purchased_unit = new_purchased,
                total_value = COALESCE(total_value, 0) + COALESCE(NEW.amount, 0), -- Increment total raised
                updated_at = NOW(),
                -- Update status to 'Fully Funded' if all units are purchased
                status = CASE 
                    WHEN new_available <= 0 AND status != 'Complete' AND status != 'Fully Funded' THEN 'Fully Funded'
                    ELSE status
                END
            WHERE id = NEW.project_id;
        END IF;
    END IF;
    
    -- If status changed from Complete to non-Complete (Failed, Pending, etc.), reverse the changes
    IF OLD.status = 'Complete' AND NEW.status != 'Complete' THEN
        -- Check if project exists
        SELECT EXISTS(SELECT 1 FROM projects WHERE id = NEW.project_id)
        INTO project_exists;
        
        IF project_exists AND OLD.unit IS NOT NULL AND OLD.unit > 0 THEN
            -- Reverse the unit and amount changes (REAL-TIME reversal)
            UPDATE projects
                available_unit = available_unit + OLD.unit,
                purchased_unit = GREATEST(0, purchased_unit - OLD.unit),
                total_value = GREATEST(0, COALESCE(total_value, 0) - COALESCE(OLD.amount, 0)), -- Decrement total raised
                updated_at = NOW()
            WHERE id = NEW.project_id;
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_project_stock_on_status_change"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_project_total_units"("p_project_id" "uuid", "p_new_total_units" integer) RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    v_project_record RECORD;
    v_current_purchased_units INTEGER;
    v_new_available_units INTEGER;
    v_result JSONB;
BEGIN
    -- Get the project record with lock to prevent race conditions
    SELECT 
        id,
        project_code,
        project_name,
        total_units,
        purchased_unit,
        available_unit
    INTO v_project_record
    FROM projects
    WHERE id = p_project_id
    FOR UPDATE;
    
    -- Check if project exists
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Project not found: %', p_project_id
            USING ERRCODE = 'P0001';
    END IF;
    
    -- Validate new_total_units
    IF p_new_total_units IS NULL OR p_new_total_units < 0 THEN
        RAISE EXCEPTION 'Invalid total_units: %. Total units must be a positive integer.', p_new_total_units
            USING ERRCODE = 'P0002';
    END IF;
    
    -- Get current purchased units (from transactions to ensure accuracy)
    SELECT COALESCE(SUM(unit), 0)::INTEGER
    INTO v_current_purchased_units
    FROM transactions
    WHERE project_id = p_project_id
      AND type IN ('investment', 'Payin')
      AND status = 'Complete';
    
    -- Validate that new total_units is not less than purchased units
    IF p_new_total_units < v_current_purchased_units THEN
        RAISE EXCEPTION 'Cannot set total_units (%) less than purchased_units (%). Project: %', 
            p_new_total_units, v_current_purchased_units, v_project_record.project_name
            USING ERRCODE = 'P0003';
    END IF;
    
    -- Calculate new available units
    v_new_available_units := p_new_total_units - v_current_purchased_units;
    
    -- Ensure available units is not negative (shouldn't happen, but safety check)
    IF v_new_available_units < 0 THEN
        v_new_available_units := 0;
    END IF;
    
    -- Update the project
    UPDATE projects
        total_units = p_new_total_units,
        available_unit = v_new_available_units,
        purchased_unit = v_current_purchased_units,
        updated_at = NOW()
    WHERE id = p_project_id;
    
    -- Build result JSON
    v_result := jsonb_build_object(
        'success', true,
        'project_id', p_project_id,
        'project_code', v_project_record.project_code,
        'project_name', v_project_record.project_name,
        'old_total_units', v_project_record.total_units,
        'new_total_units', p_new_total_units,
        'purchased_units', v_current_purchased_units,
        'available_units', v_new_available_units,
        'message', format('Successfully updated total_units from %s to %s. Available units: %s', 
            v_project_record.total_units, p_new_total_units, v_new_available_units)
    );
    
    RETURN v_result;
END;
$$;


ALTER FUNCTION "public"."update_project_total_units"("p_project_id" "uuid", "p_new_total_units" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_project_units"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  -- Handle INSERT operations
  IF TG_OP = 'INSERT' THEN
    -- Only update for investment transactions with Complete status
    IF NEW.type = 'investment' AND NEW.status = 'Complete' THEN
      UPDATE projects 
        purchased_unit = purchased_unit + NEW.unit,
        available_unit = GREATEST(0, total_units - (purchased_unit + NEW.unit))
      WHERE id = NEW.project_id;
    END IF;
    RETURN NEW;
  END IF;

  -- Handle UPDATE operations
  IF TG_OP = 'UPDATE' THEN
    -- If status changed from Complete to something else, subtract the units
    IF OLD.status = 'Complete' AND NEW.status != 'Complete' AND OLD.type = 'investment' THEN
      UPDATE projects 
        purchased_unit = purchased_unit - OLD.unit,
        available_unit = GREATEST(0, total_units - (purchased_unit - OLD.unit))
      WHERE id = OLD.project_id;
    END IF;
    
    -- If status changed to Complete, add the units
    IF OLD.status != 'Complete' AND NEW.status = 'Complete' AND NEW.type = 'investment' THEN
      UPDATE projects 
        purchased_unit = purchased_unit + NEW.unit,
        available_unit = GREATEST(0, total_units - (purchased_unit + NEW.unit))
      WHERE id = NEW.project_id;
    END IF;
    
    -- If unit amount changed and status is Complete
    IF OLD.unit != NEW.unit AND NEW.status = 'Complete' AND NEW.type = 'investment' THEN
      UPDATE projects 
        purchased_unit = purchased_unit - OLD.unit + NEW.unit,
        available_unit = GREATEST(0, total_units - (purchased_unit - OLD.unit + NEW.unit))
      WHERE id = NEW.project_id;
    END IF;
    
    RETURN NEW;
  END IF;

  -- Handle DELETE operations
  IF TG_OP = 'DELETE' THEN
    -- Only update for investment transactions with Complete status
    IF OLD.type = 'investment' AND OLD.status = 'Complete' THEN
      UPDATE projects 
        purchased_unit = purchased_unit - OLD.unit,
        available_unit = GREATEST(0, total_units - (purchased_unit - OLD.unit))
      WHERE id = OLD.project_id;
    END IF;
    RETURN OLD;
  END IF;

  RETURN NULL;
END;
$$;


ALTER FUNCTION "public"."update_project_units"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_project_units_for_project"("p_project_id" "uuid") RETURNS "void"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
    project_record RECORD;
    total_purchased_units INTEGER;
    total_available_units INTEGER;
BEGIN
    -- Get the project record
    SELECT * INTO project_record 
    FROM projects 
    WHERE id = p_project_id;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Project not found: %', p_project_id;
    END IF;
    
    -- Calculate total purchased units for this project
    SELECT COALESCE(SUM(unit), 0) INTO total_purchased_units
    FROM transactions 
    WHERE project_id = p_project_id 
    AND type IN ('investment', 'Payin')
    AND status = 'Complete';
    
    -- Calculate available units
    total_available_units := project_record.total_units - total_purchased_units;
    
    -- Ensure available units is not negative
    IF total_available_units < 0 THEN
        total_available_units := 0;
    END IF;
    
    -- Update the project with new unit counts
    UPDATE projects 
        purchased_unit = total_purchased_units,
        available_unit = total_available_units,
        updated_at = NOW()
    WHERE id = p_project_id;
    
    RAISE NOTICE 'Updated project % units: purchased=%, available=%', 
        project_record.project_name, total_purchased_units, total_available_units;
END;
$$;


ALTER FUNCTION "public"."update_project_units_for_project"("p_project_id" "uuid") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."update_project_units_for_project"("p_project_id" "uuid") IS 'Recalculates unit counts for a specific project based on current transaction data';



CREATE OR REPLACE FUNCTION "public"."update_project_units_on_transaction_change"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  IF (TG_OP = 'INSERT') THEN
    UPDATE projects
      purchased_unit = COALESCE(purchased_unit, 0) + NEW.unit,
      available_unit = COALESCE(total_units, 0) - (COALESCE(purchased_unit, 0) + NEW.unit)
    WHERE id = NEW.project_id;

  ELSIF (TG_OP = 'DELETE') THEN
    UPDATE projects
      purchased_unit = COALESCE(purchased_unit, 0) - OLD.unit,
      available_unit = COALESCE(total_units, 0) - (COALESCE(purchased_unit, 0) - OLD.unit)
    WHERE id = OLD.project_id;
  END IF;

  RETURN NULL;
END;
$$;


ALTER FUNCTION "public"."update_project_units_on_transaction_change"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_updated_at_column"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_updated_at_column"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_user_investment_stats"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    UPDATE users 
        SELECT COALESCE(SUM(amount), 0)
        FROM transactions 
        WHERE profile_id = NEW.profile_id AND status = 'Complete'
    ),
    active_investments = (
        SELECT COUNT(DISTINCT project_id)
        FROM transactions 
        WHERE profile_id = NEW.profile_id AND status IN ('Complete', 'Pending')
    ),
    completed_investments = (
        SELECT COUNT(DISTINCT project_id)
        FROM transactions 
        WHERE profile_id = NEW.profile_id AND status = 'Complete'
    )
    WHERE id = NEW.profile_id;

    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_user_investment_stats"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_wallet_on_topup_complete"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  -- DISABLED: All wallet updates are now handled by the backend API
  -- This function does nothing to prevent any accidental wallet updates
  -- Even if called directly, it will not update any wallets
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_wallet_on_topup_complete"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."validate_unit_limits"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
    project_record RECORD;
    current_purchased_units INTEGER;
    new_total_units INTEGER;
BEGIN
    -- Get the project details
    SELECT * INTO project_record 
    FROM projects 
    WHERE id = NEW.project_id;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Project not found for project_id: %', NEW.project_id;
    END IF;
    
    -- Only validate for Payin transactions with Complete status
    IF NEW.type = 'Payin' AND NEW.status = 'Complete' THEN
        -- Calculate current purchased units (excluding this new transaction)
        SELECT COALESCE(SUM(unit), 0) INTO current_purchased_units
        FROM transactions 
        WHERE project_id = NEW.project_id 
        AND type = 'Payin' 
        AND status = 'Complete'
        AND (NEW.id IS NULL OR id != NEW.id); -- Corrected line
        
        -- Calculate what the new total would be
        new_total_units := current_purchased_units + COALESCE(NEW.unit, 0);
        
        -- Check if this would exceed the project's total units
        IF new_total_units > project_record.total_units THEN
            RAISE EXCEPTION 'Transaction would exceed project unit limit. Project: % units, Requested: % units, Available: % units', 
                project_record.total_units, NEW.unit, (project_record.total_units - current_purchased_units);
        END IF;
        
        -- Check minimum investment amount if specified
        IF project_record.min_investment_amount IS NOT NULL AND NEW.amount < project_record.min_investment_amount THEN
            RAISE EXCEPTION 'Investment amount % is below minimum required amount %', 
                NEW.amount, project_record.min_investment_amount;
        END IF;
        
        -- Check maximum investment amount if specified
        IF project_record.max_investment_amount IS NOT NULL AND NEW.amount > project_record.max_investment_amount THEN
            RAISE EXCEPTION 'Investment amount % exceeds maximum allowed amount %', 
                NEW.amount, project_record.max_investment_amount;
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."validate_unit_limits"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."validate_unit_limits_before_transaction"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  project_record RECORD;
BEGIN
  -- Ensure the project exists
  -- Use SECURITY DEFINER to bypass RLS when checking project existence
  SELECT available_unit, total_units, purchased_unit
  INTO project_record
  FROM projects
  WHERE id = NEW.project_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Invalid project_id: %', NEW.project_id
      USING ERRCODE = 'P0001';
  END IF;

  -- Check if project has enough units
  IF project_record.available_unit <= 0 THEN
    RAISE EXCEPTION 'No units available for this project (Available: %)', project_record.available_unit
      USING ERRCODE = 'P0002';
  END IF;

  IF NEW.unit > project_record.available_unit THEN
    RAISE EXCEPTION 'Insufficient units available. Requested: %, Available: %',
      NEW.unit, project_record.available_unit
      USING ERRCODE = 'P0003';
  END IF;

  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."validate_unit_limits_before_transaction"() OWNER TO "postgres";


COMMENT ON FUNCTION "public"."validate_unit_limits_before_transaction"() IS 'Validates that sufficient units are available before allowing a new investment transaction';





CREATE TABLE IF NOT EXISTS "public"."_prisma_migrations" (
    "id" character varying(36) NOT NULL,
    "checksum" character varying(64) NOT NULL,
    "finished_at" timestamp with time zone,
    "migration_name" character varying(255) NOT NULL,
    "logs" "text",
    "rolled_back_at" timestamp with time zone,
    "started_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "applied_steps_count" integer DEFAULT 0 NOT NULL
);


ALTER TABLE "public"."_prisma_migrations" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."admins" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "admin_id" character varying(20) NOT NULL,
    "name" character varying(255) NOT NULL,
    "email" character varying(255) NOT NULL,
    "phone" character varying(20) NOT NULL,
    "avatar" character varying(500),
    "avatar_initials" character varying(10),
    "admin_type" "public"."admin_type_old" NOT NULL,
    "role" "public"."admin_type_old" NOT NULL,
    "date_created" "date" DEFAULT CURRENT_DATE NOT NULL,
    "status" "public"."admin_status" DEFAULT 'Active'::"public"."admin_status",
    "permissions" "text"[] DEFAULT '{}'::"text"[],
    "last_login" timestamp with time zone,
    "department" character varying(100),
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."admins" OWNER TO "postgres";


COMMENT ON TABLE "public"."admins" IS 'Stores admin user accounts with different permission levels';



CREATE TABLE IF NOT EXISTS "public"."approval_audit_log" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "approval_request_id" "uuid" NOT NULL,
    "action" character varying(50) NOT NULL,
    "performed_by" "uuid" NOT NULL,
    "performed_by_name" character varying(255) NOT NULL,
    "performed_by_role" character varying(100) NOT NULL,
    "action_details" "jsonb",
    "timestamp" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "approval_audit_log_action_check" CHECK ((("action")::"text" = ANY ((ARRAY['Created'::character varying, 'Submitted'::character varying, 'Approved'::character varying, 'Rejected'::character varying, 'Modified'::character varying, 'Expired'::character varying, 'Cancelled'::character varying])::"text"[])))
);


ALTER TABLE "public"."approval_audit_log" OWNER TO "postgres";


COMMENT ON TABLE "public"."approval_audit_log" IS 'Maintains audit trail of all approval actions';



CREATE TABLE IF NOT EXISTS "public"."approval_notifications" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "approval_request_id" "uuid" NOT NULL,
    "notification_type" character varying(50) NOT NULL,
    "recipient_id" "uuid" NOT NULL,
    "recipient_name" character varying(255) NOT NULL,
    "message" "text" NOT NULL,
    "is_read" boolean DEFAULT false,
    "sent_at" timestamp with time zone DEFAULT "now"(),
    "read_at" timestamp with time zone,
    CONSTRAINT "approval_notifications_notification_type_check" CHECK ((("notification_type")::"text" = ANY ((ARRAY['Request Created'::character varying, 'Request Approved'::character varying, 'Request Rejected'::character varying, 'Request Expired'::character varying, 'Reminder'::character varying])::"text"[])))
);


ALTER TABLE "public"."approval_notifications" OWNER TO "postgres";


COMMENT ON TABLE "public"."approval_notifications" IS 'Tracks notifications sent to approvers and requesters';



CREATE TABLE IF NOT EXISTS "public"."approval_requests" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "request_id" character varying(20) NOT NULL,
    "request_type" character varying(50) NOT NULL,
    "status" character varying(20) DEFAULT 'Pending'::character varying,
    "priority" character varying(20) DEFAULT 'Medium'::character varying,
    "title" character varying(255) NOT NULL,
    "description" "text" NOT NULL,
    "request_data" "jsonb" NOT NULL,
    "requested_by" "uuid" NOT NULL,
    "requested_by_name" character varying(255) NOT NULL,
    "requested_by_role" character varying(100) NOT NULL,
    "reviewed_by" "uuid",
    "reviewed_by_name" character varying(255),
    "reviewed_at" timestamp with time zone,
    "approval_notes" "text",
    "rejection_reason" "text",
    "related_project_id" "uuid",
    "related_payout_id" "uuid",
    "related_user_id" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "expires_at" timestamp with time zone,
    CONSTRAINT "approval_requests_priority_check" CHECK ((("priority")::"text" = ANY ((ARRAY['Low'::character varying, 'Medium'::character varying, 'High'::character varying, 'Urgent'::character varying])::"text"[]))),
    CONSTRAINT "approval_requests_request_type_check" CHECK ((("request_type")::"text" = ANY ((ARRAY['Investment Creation'::character varying, 'Payout Processing'::character varying, 'Company Funds Withdrawal'::character varying, 'Project Update'::character varying, 'Project Deletion'::character varying, 'User Management'::character varying])::"text"[]))),
    CONSTRAINT "approval_requests_status_check" CHECK ((("status")::"text" = ANY ((ARRAY['Pending'::character varying, 'Approved'::character varying, 'Rejected'::character varying, 'Under Review'::character varying])::"text"[])))
);


ALTER TABLE "public"."approval_requests" OWNER TO "postgres";


COMMENT ON TABLE "public"."approval_requests" IS 'Stores all approval requests for investments, payouts, and other operations';



CREATE TABLE IF NOT EXISTS "public"."approval_workflow_steps" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "approval_request_id" "uuid" NOT NULL,
    "step_number" integer NOT NULL,
    "step_name" character varying(255) NOT NULL,
    "required_role" character varying(100) NOT NULL,
    "status" character varying(20) DEFAULT 'Pending'::character varying,
    "approved_by" "uuid",
    "approved_by_name" character varying(255),
    "approved_at" timestamp with time zone,
    "notes" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "approval_workflow_steps_status_check" CHECK ((("status")::"text" = ANY ((ARRAY['Pending'::character varying, 'Approved'::character varying, 'Rejected'::character varying, 'Skipped'::character varying])::"text"[])))
);


ALTER TABLE "public"."approval_workflow_steps" OWNER TO "postgres";


COMMENT ON TABLE "public"."approval_workflow_steps" IS 'Defines multi-step approval workflows for complex requests';



CREATE TABLE IF NOT EXISTS "public"."countries" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "name" character varying(100) NOT NULL,
    "flag" character varying(10) NOT NULL,
    "currency" character varying(10) NOT NULL,
    "currency_symbol" character varying(5) NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."countries" OWNER TO "postgres";


COMMENT ON TABLE "public"."countries" IS 'Stores country information for analytics';



CREATE TABLE IF NOT EXISTS "public"."users" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "user_id" character varying(20) NOT NULL,
    "name" character varying(255) NOT NULL,
    "email" character varying(255) NOT NULL,
    "phone" character varying(20) NOT NULL,
    "avatar" character varying(500),
    "avatar_initials" character varying(10),
    "date_joined" "date" DEFAULT CURRENT_DATE NOT NULL,
    "country" character varying(100) NOT NULL,
    "country_flag" character varying(10),
    "gender" "public"."user_gender",
    "date_of_birth" "date",
    "kyc_status" "public"."kyc_status" DEFAULT 'pending'::"public"."kyc_status",
    "account_status" "public"."account_status" DEFAULT 'Active'::"public"."account_status",
    "total_invested" numeric(15,2) DEFAULT 0.00,
    "active_investments" integer DEFAULT 0,
    "completed_investments" integer DEFAULT 0,
    "expected_returns" numeric(15,2) DEFAULT 0.00,
    "device" character varying(100),
    "os_version" character varying(50),
    "app_version" character varying(20),
    "ip_address" "inet",
    "approximate_location" character varying(255),
    "login_method" character varying(50),
    "last_login" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "preferred_network" character varying(50),
    "bank_account" character varying(50),
    "bank_name" character varying(100),
    "fcm_token" character varying,
    "email_preferences" "jsonb",
    "push_preferences" "jsonb",
    CONSTRAINT "users_fcm_token_check" CHECK (("length"(("fcm_token")::"text") <= 255)),
    CONSTRAINT "users_preferred_network_check" CHECK ((("preferred_network" IS NULL) OR (("preferred_network")::"text" = ANY ((ARRAY['MTN'::character varying, 'Vodafone'::character varying, 'AirtelTigo'::character varying, 'Telecel'::character varying])::"text"[]))))
);


ALTER TABLE "public"."users" OWNER TO "postgres";


COMMENT ON TABLE "public"."users" IS 'Stores user account information and investment statistics';



COMMENT ON COLUMN "public"."users"."preferred_network" IS 'User preferred mobile network (MTN, Vodafone, AirtelTigo)';



COMMENT ON COLUMN "public"."users"."bank_account" IS 'User bank account number for payouts';



COMMENT ON COLUMN "public"."users"."bank_name" IS 'User bank name for payouts';



COMMENT ON COLUMN "public"."users"."fcm_token" IS 'for push notifications';



COMMENT ON COLUMN "public"."users"."email_preferences" IS 'email preferences for marketing campaings';



COMMENT ON COLUMN "public"."users"."push_preferences" IS 'preferences to receive notifications';



CREATE OR REPLACE VIEW "public"."country_analytics" WITH ("security_invoker"='on') AS
 SELECT "c"."name",
    "c"."flag",
    "c"."currency",
    "count"("u"."id") AS "users",
    COALESCE("sum"("u"."total_invested"), (0)::numeric) AS "revenue"
   FROM ("public"."countries" "c"
     LEFT JOIN "public"."users" "u" ON ((("c"."name")::"text" = ("u"."country")::"text")))
  GROUP BY "c"."id", "c"."name", "c"."flag", "c"."currency"
  ORDER BY ("count"("u"."id")) DESC;


ALTER VIEW "public"."country_analytics" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."high_ticket_investments" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "investment_id" character varying(20) NOT NULL,
    "project_id" "uuid" NOT NULL,
    "user_id" character varying(20) NOT NULL,
    "roi_percentage" numeric(5,2) NOT NULL,
    "investment_amount" numeric(15,2) NOT NULL,
    "expected_return" numeric(15,2) NOT NULL,
    "status" character varying(20) DEFAULT 'Active'::character varying,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "high_ticket_investments_status_check" CHECK ((("status")::"text" = ANY ((ARRAY['Active'::character varying, 'Completed'::character varying, 'Failed'::character varying])::"text"[])))
);


ALTER TABLE "public"."high_ticket_investments" OWNER TO "postgres";




ALTER TABLE "public"."projects" OWNER TO "postgres";


COMMENT ON TABLE "public"."projects" IS 'Stores farming projects available for investment';



COMMENT ON COLUMN "public"."projects"."project_code" IS 'Project code - supports codes up to 50 characters';



COMMENT ON COLUMN "public"."projects"."duration_months" IS 'Project duration in months - nullable since agricultural projects have variable timelines';



COMMENT ON COLUMN "public"."projects"."start_date" IS 'Project start date - nullable since dates are dynamic in agricultural projects';



COMMENT ON COLUMN "public"."projects"."end_date" IS 'Project end date - nullable since dates are dynamic in agricultural projects';



COMMENT ON COLUMN "public"."projects"."available_unit" IS 'available units';



COMMENT ON COLUMN "public"."projects"."purchased_unit" IS 'purchased unit';



COMMENT ON COLUMN "public"."projects"."project_stages" IS 'Project stage - supports all stage names including long livestock stages (no length limit)';



COMMENT ON COLUMN "public"."projects"."payout_type" IS 'type of payouts';



COMMENT ON COLUMN "public"."projects"."risk_level" IS 'Risk level of the investment project: Low, Medium, or High';



CREATE OR REPLACE VIEW "public"."high_ticket_investment_analytics" AS
 SELECT "hti"."id",
    "hti"."investment_id",
    "p"."project_name",
    "u"."name" AS "investor_name",
    "hti"."roi_percentage",
    "hti"."investment_amount",
    "hti"."expected_return",
    "hti"."status",
    "hti"."created_at"
   FROM (("public"."high_ticket_investments" "hti"
     JOIN "public"."projects" "p" ON (("hti"."project_id" = "p"."id")))
     JOIN "public"."users" "u" ON ((("hti"."user_id")::"text" = ("u"."user_id")::"text")));


ALTER VIEW "public"."high_ticket_investment_analytics" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."high_ticket_investment_analytics_v2" AS
 SELECT "hti"."id",
    "hti"."investment_id",
    "p"."project_name",
    "p"."project_code",
    "u"."name" AS "investor_name",
    "hti"."roi_percentage",
    "hti"."investment_amount",
    "hti"."expected_return",
    "hti"."status",
    "hti"."created_at"
   FROM (("public"."high_ticket_investments" "hti"
     JOIN "public"."projects" "p" ON (("hti"."project_id" = "p"."id")))
     JOIN "public"."users" "u" ON ((("hti"."user_id")::"text" = ("u"."user_id")::"text")));


ALTER VIEW "public"."high_ticket_investment_analytics_v2" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."investments" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "investment_id" character varying,
    "project_id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid",
    "amount" double precision,
    "status" character varying,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone,
    "unit" bigint
);


ALTER TABLE "public"."investments" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."latest_updates" (
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "title" "text",
    "description" character varying DEFAULT ''::character varying,
    "cover_image" "text",
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL
);


ALTER TABLE "public"."latest_updates" OWNER TO "postgres";


COMMENT ON TABLE "public"."latest_updates" IS 'latest project updates';



CREATE TABLE IF NOT EXISTS "public"."notification_queue" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "notification_id" "uuid" NOT NULL,
    "user_id" "uuid",
    "type" "public"."notification_type" NOT NULL,
    "status" character varying(20) DEFAULT 'Pending'::character varying,
    "scheduled_for" timestamp(6) with time zone,
    "created_at" timestamp(6) with time zone DEFAULT "now"()
);


ALTER TABLE "public"."notification_queue" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."notification_targets" (
    "notification_id" "uuid" NOT NULL,
    "profile_id" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."notification_targets" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."notifications" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "title" character varying(255) NOT NULL,
    "body" "text" NOT NULL,
    "created_by" "uuid" NOT NULL,
    "status" "public"."notification_status" DEFAULT 'Draft'::"public"."notification_status",
    "priority" "public"."notification_priority" DEFAULT 'Medium'::"public"."notification_priority",
    "category" "public"."notification_category" DEFAULT 'Announcement'::"public"."notification_category",
    "target_audience" character varying(50) DEFAULT 'All Users'::character varying,
    "scheduled_for" timestamp with time zone,
    "published_at" timestamp with time zone,
    "read_count" integer DEFAULT 0,
    "click_count" integer DEFAULT 0,
    "tags" "text"[] DEFAULT '{}'::"text"[],
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "type" "public"."notification_type"
);


ALTER TABLE "public"."notifications" OWNER TO "postgres";


COMMENT ON TABLE "public"."notifications" IS 'Stores in-app notifications sent to users';



CREATE TABLE IF NOT EXISTS "public"."payment_accounts" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "profile_id" "uuid" NOT NULL,
    "type" "text" NOT NULL,
    "account_name" "text",
    "account_number" "text",
    "account_bank" "text",
    "recipient_number" "text",
    "network" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "is_preferred" boolean DEFAULT false,
    CONSTRAINT "check_bank_fields" CHECK (((("type" = 'bank'::"text") AND ("account_number" IS NOT NULL) AND ("account_bank" IS NOT NULL)) OR (("type" = 'momo'::"text") AND ("recipient_number" IS NOT NULL) AND ("network" IS NOT NULL)) OR ("type" IS NULL))),
    CONSTRAINT "payment_accounts_network_check" CHECK ((("network" = ANY (ARRAY['MTN'::"text", 'VOD'::"text", 'ATL'::"text"])) OR ("network" IS NULL))),
    CONSTRAINT "payment_accounts_type_check" CHECK (("type" = ANY (ARRAY['bank'::"text", 'momo'::"text"])))
);


ALTER TABLE "public"."payment_accounts" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."payouts" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "payout_id" character varying(20) NOT NULL,
    "user_id" "uuid",
    "project_id" "uuid",
    "amount" numeric(15,2) NOT NULL,
    "status" character varying(20) DEFAULT NULL::character varying,
    "payment_method" character varying(50),
    "processed_at" timestamp with time zone,
    "description" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "calculated_amount" numeric(15,2),
    "payout_type" "public"."payout_types",
    "profile_id" "uuid",
    "account_issuer" "text",
    "account_bank" "text",
    "external_ref" "text",
    "payout_category" "text",
    CONSTRAINT "payouts_status_check" CHECK ((("status")::"text" = ANY (ARRAY[('Pending'::character varying)::"text", ('Processing'::character varying)::"text", ('Complete'::character varying)::"text", ('Failed'::character varying)::"text"])))
);


ALTER TABLE "public"."payouts" OWNER TO "postgres";


COMMENT ON COLUMN "public"."payouts"."payout_type" IS 'type of payouts';



CREATE OR REPLACE VIEW "public"."payout_calculations" AS
 SELECT "p"."id",
    "p"."payout_id",
    "u"."name" AS "user_name",
    "pr"."project_name",
    "p"."amount" AS "base_amount",
    COALESCE("p"."payment_method", 'BANK'::character varying) AS "payment_method",
    COALESCE("p"."calculated_amount", "p"."amount") AS "calculated_amount",
    "p"."status"
   FROM (("public"."payouts" "p"
     JOIN "public"."users" "u" ON (("p"."user_id" = "u"."id")))
     JOIN "public"."projects" "pr" ON (("p"."project_id" = "pr"."id")));


ALTER VIEW "public"."payout_calculations" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."payout_calculations_v2" AS
 SELECT "p"."id",
    "p"."payout_id",
    "u"."name" AS "user_name",
    "pr"."project_name",
    "p"."amount" AS "base_amount",
    "p"."payment_method",
    COALESCE("p"."calculated_amount", "p"."amount") AS "calculated_amount",
    "p"."status"
   FROM (("public"."payouts" "p"
     JOIN "public"."users" "u" ON (("p"."user_id" = "u"."id")))
     JOIN "public"."projects" "pr" ON (("p"."project_id" = "pr"."id")));


ALTER VIEW "public"."payout_calculations_v2" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."pin_reset_tokens" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "profile_id" "uuid" NOT NULL,
    "token" "text" NOT NULL,
    "expires_at" timestamp with time zone NOT NULL,
    "used" boolean DEFAULT false,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."pin_reset_tokens" OWNER TO "postgres";




ALTER TABLE "public"."profile" OWNER TO "postgres";


COMMENT ON COLUMN "public"."profile"."pin" IS 'Encrypted 4-digit PIN for transaction authorization';



COMMENT ON COLUMN "public"."profile"."kyc_status" IS 'KYC verification status: pending, verified, or rejected';



COMMENT ON COLUMN "public"."profile"."kyc_documents" IS 'JSON object containing URLs to uploaded KYC documents (id_front, id_back, selfie)';



COMMENT ON COLUMN "public"."profile"."last_login" IS 'Tracks the user''s last login timestamp.';



CREATE SEQUENCE IF NOT EXISTS "public"."project_report_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."project_report_seq" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."project_reports" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "project_id" "uuid" NOT NULL,
    "report_text" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "created_by" "uuid",
    "report_id" character varying(20),
    "title" character varying(255) DEFAULT 'Project Report'::character varying NOT NULL,
    "content" "text" DEFAULT 'Project report content'::"text" NOT NULL,
    "report_type" character varying(50) DEFAULT 'Progress'::character varying,
    "status" character varying(20) DEFAULT 'Draft'::character varying,
    "attachments" "text"[] DEFAULT '{}'::"text"[],
    "reviewed_by" "uuid",
    "reviewed_at" timestamp with time zone,
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "project_reports_report_type_check" CHECK ((("report_type")::"text" = ANY ((ARRAY['Progress'::character varying, 'Financial'::character varying, 'Technical'::character varying, 'Risk Assessment'::character varying])::"text"[]))),
    CONSTRAINT "project_reports_status_check" CHECK ((("status")::"text" = ANY ((ARRAY['Draft'::character varying, 'Submitted'::character varying, 'Approved'::character varying, 'Rejected'::character varying])::"text"[])))
);


ALTER TABLE "public"."project_reports" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."project_reports_summary_v2" AS
 SELECT "pr"."id",
    "pr"."report_id",
    "pr"."title",
    "pr"."report_type",
    "pr"."status",
    "p"."project_name",
    "p"."project_code",
    "a"."name" AS "created_by_name",
    "pr"."created_at"
   FROM (("public"."project_reports" "pr"
     JOIN "public"."projects" "p" ON (("pr"."project_id" = "p"."id")))
     LEFT JOIN "public"."admins" "a" ON (("pr"."created_by" = "a"."id")));


ALTER VIEW "public"."project_reports_summary_v2" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."project_stage" (
    "id" bigint NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "stage" "public"."PROJECT_STAGE",
    "project_id" "uuid",
    "status" boolean DEFAULT false
);


ALTER TABLE "public"."project_stage" OWNER TO "postgres";


COMMENT ON TABLE "public"."project_stage" IS 'Tracks individual project stage progress and completion status';



CREATE SEQUENCE IF NOT EXISTS "public"."project_stage_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."project_stage_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."project_stage_id_seq" OWNED BY "public"."project_stage"."id";



CREATE TABLE IF NOT EXISTS "public"."project_updates" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "project_id" "uuid" NOT NULL,
    "update_text" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "created_by" "uuid",
    "title" character varying(255) DEFAULT 'Project Update'::character varying NOT NULL,
    "description" "text" DEFAULT 'Project update description'::"text" NOT NULL,
    "image_url" "text"[],
    "update_type" character varying(50) DEFAULT 'Progress'::character varying,
    "status" character varying(20) DEFAULT 'Published'::character varying,
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "project_updates_status_check" CHECK ((("status")::"text" = ANY ((ARRAY['Draft'::character varying, 'Published'::character varying, 'Archived'::character varying])::"text"[]))),
    CONSTRAINT "project_updates_update_type_check" CHECK ((("update_type")::"text" = ANY ((ARRAY['Progress'::character varying, 'Milestone'::character varying, 'Issue'::character varying, 'Completion'::character varying])::"text"[])))
);


ALTER TABLE "public"."project_updates" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."project_updates_summary_v2" AS
 SELECT "pu"."id",
    "pu"."title",
    "pu"."description",
    "pu"."image_url",
    "pu"."update_type",
    "pu"."status",
    "p"."project_name",
    "p"."project_code",
    "a"."name" AS "created_by_name",
    "pu"."created_at"
   FROM (("public"."project_updates" "pu"
     JOIN "public"."projects" "p" ON (("pu"."project_id" = "p"."id")))
     LEFT JOIN "public"."admins" "a" ON (("pu"."created_by" = "a"."id")));


ALTER VIEW "public"."project_updates_summary_v2" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."support_tickets" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "ticket_id" character varying(20) NOT NULL,
    "user_id" "uuid" NOT NULL,
    "user_name" character varying(255) NOT NULL,
    "user_email" character varying(255) NOT NULL,
    "subject" character varying(255) NOT NULL,
    "description" "text" NOT NULL,
    "status" character varying(20) DEFAULT 'Open'::character varying,
    "priority" character varying(20) DEFAULT 'Medium'::character varying,
    "category" character varying(20) DEFAULT 'General'::character varying,
    "assigned_to" "uuid",
    "assigned_name" character varying(255),
    "resolved_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "support_tickets_category_check" CHECK ((("category")::"text" = ANY ((ARRAY['Technical'::character varying, 'Billing'::character varying, 'Investment'::character varying, 'General'::character varying, 'Bug'::character varying])::"text"[]))),
    CONSTRAINT "support_tickets_priority_check" CHECK ((("priority")::"text" = ANY ((ARRAY['Low'::character varying, 'Medium'::character varying, 'High'::character varying, 'Urgent'::character varying])::"text"[]))),
    CONSTRAINT "support_tickets_status_check" CHECK ((("status")::"text" = ANY ((ARRAY['Open'::character varying, 'In Progress'::character varying, 'Resolved'::character varying, 'Closed'::character varying])::"text"[])))
);


ALTER TABLE "public"."support_tickets" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."system_settings" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "setting_key" character varying(100) NOT NULL,
    "setting_value" "text",
    "setting_type" character varying(20) DEFAULT 'string'::character varying,
    "category" character varying(50) DEFAULT 'general'::character varying,
    "description" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "system_settings_setting_type_check" CHECK ((("setting_type")::"text" = ANY ((ARRAY['string'::character varying, 'number'::character varying, 'boolean'::character varying, 'json'::character varying])::"text"[])))
);


ALTER TABLE "public"."system_settings" OWNER TO "postgres";




ALTER TABLE "public"."transactions" OWNER TO "postgres";


COMMENT ON TABLE "public"."transactions" IS 'Stores all investment transactions';



COMMENT ON COLUMN "public"."transactions"."channel" IS 'transaction channels';



COMMENT ON COLUMN "public"."transactions"."external_id" IS 'external id from payswitch';



COMMENT ON COLUMN "public"."transactions"."network" IS 'network for momo transaction';



COMMENT ON COLUMN "public"."transactions"."account_number" IS 'account number';



CREATE OR REPLACE VIEW "public"."transaction_analytics" WITH ("security_invoker"='on') AS
 SELECT "date_trunc"('month'::"text", "created_at") AS "month",
    "count"(*) AS "total_transactions",
    "count"(
        CASE
            WHEN ("status" = 'Complete'::"public"."transaction_status") THEN 1
            ELSE NULL::integer
        END) AS "completed_transactions",
    "count"(
        CASE
            WHEN ("status" = 'Pending'::"public"."transaction_status") THEN 1
            ELSE NULL::integer
        END) AS "pending_transactions",
    "count"(
        CASE
            WHEN ("status" = 'Failed'::"public"."transaction_status") THEN 1
            ELSE NULL::integer
        END) AS "failed_transactions",
    COALESCE("sum"(
        CASE
            WHEN ("status" = 'Complete'::"public"."transaction_status") THEN "amount"
            ELSE NULL::numeric
        END), (0)::numeric) AS "total_amount"
   FROM "public"."transactions" "t"
  GROUP BY ("date_trunc"('month'::"text", "created_at"))
  ORDER BY ("date_trunc"('month'::"text", "created_at")) DESC;


ALTER VIEW "public"."transaction_analytics" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."users_notifications" (
    "user_id" "uuid" DEFAULT "gen_random_uuid"(),
    "notifications_id" "uuid" DEFAULT "gen_random_uuid"(),
    "title" "text",
    "body" "text",
    "type" "public"."notification_type" NOT NULL,
    "status" "public"."notification_status",
    "read_at" timestamp with time zone,
    "clicked_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone,
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "sms_delivery_status" "text",
    "sms_delivery_id" "text"
);


ALTER TABLE "public"."users_notifications" OWNER TO "postgres";


COMMENT ON TABLE "public"."users_notifications" IS 'this is to track user specific notifications';



CREATE TABLE IF NOT EXISTS "public"."wallet_audit_log" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "wallet_id" "uuid",
    "action" character varying(50),
    "old_balance" numeric(15,2),
    "new_balance" numeric(15,2),
    "amount" numeric(15,2),
    "user_id" "uuid",
    "ip_address" "inet",
    "user_agent" "text",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."wallet_audit_log" OWNER TO "postgres";




ALTER TABLE "public"."wallets" OWNER TO "postgres";


ALTER TABLE ONLY "public"."project_stage" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."project_stage_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."_prisma_migrations"
    ADD CONSTRAINT "_prisma_migrations_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."admins"
    ADD CONSTRAINT "admins_admin_id_key" UNIQUE ("admin_id");



ALTER TABLE ONLY "public"."admins"
    ADD CONSTRAINT "admins_email_key" UNIQUE ("email");



ALTER TABLE ONLY "public"."admins"
    ADD CONSTRAINT "admins_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."approval_audit_log"
    ADD CONSTRAINT "approval_audit_log_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."approval_notifications"
    ADD CONSTRAINT "approval_notifications_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."approval_requests"
    ADD CONSTRAINT "approval_requests_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."approval_requests"
    ADD CONSTRAINT "approval_requests_request_id_key" UNIQUE ("request_id");



ALTER TABLE ONLY "public"."approval_workflow_steps"
    ADD CONSTRAINT "approval_workflow_steps_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."countries"
    ADD CONSTRAINT "countries_name_key" UNIQUE ("name");



ALTER TABLE ONLY "public"."countries"
    ADD CONSTRAINT "countries_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."high_ticket_investments"
    ADD CONSTRAINT "high_ticket_investments_investment_id_key" UNIQUE ("investment_id");



ALTER TABLE ONLY "public"."high_ticket_investments"
    ADD CONSTRAINT "high_ticket_investments_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."investments"
    ADD CONSTRAINT "investments_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."investments"
    ADD CONSTRAINT "investments_project_id_key" UNIQUE ("project_id");



ALTER TABLE ONLY "public"."latest_updates"
    ADD CONSTRAINT "latest_updates_id_key" UNIQUE ("id");



ALTER TABLE ONLY "public"."latest_updates"
    ADD CONSTRAINT "latest_updates_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."notification_queue"
    ADD CONSTRAINT "notification_queue_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."notification_targets"
    ADD CONSTRAINT "notification_targets_pkey" PRIMARY KEY ("notification_id", "profile_id");



ALTER TABLE ONLY "public"."notifications"
    ADD CONSTRAINT "notifications_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."payment_accounts"
    ADD CONSTRAINT "payment_accounts_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."payouts"
    ADD CONSTRAINT "payouts_payout_id_key" UNIQUE ("payout_id");



ALTER TABLE ONLY "public"."payouts"
    ADD CONSTRAINT "payouts_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."pin_reset_tokens"
    ADD CONSTRAINT "pin_reset_tokens_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."pin_reset_tokens"
    ADD CONSTRAINT "pin_reset_tokens_token_key" UNIQUE ("token");



ALTER TABLE ONLY "public"."profile"
    ADD CONSTRAINT "profiles_email_key" UNIQUE ("email");



ALTER TABLE ONLY "public"."profile"
    ADD CONSTRAINT "profiles_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."project_reports"
    ADD CONSTRAINT "project_reports_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."project_reports"
    ADD CONSTRAINT "project_reports_report_id_key" UNIQUE ("report_id");



ALTER TABLE ONLY "public"."project_stage"
    ADD CONSTRAINT "project_stage_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."project_updates"
    ADD CONSTRAINT "project_updates_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."projects"
    ADD CONSTRAINT "projects_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."projects"
    ADD CONSTRAINT "projects_project_code_key" UNIQUE ("project_code");



ALTER TABLE ONLY "public"."support_tickets"
    ADD CONSTRAINT "support_tickets_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."support_tickets"
    ADD CONSTRAINT "support_tickets_ticket_id_key" UNIQUE ("ticket_id");



ALTER TABLE ONLY "public"."system_settings"
    ADD CONSTRAINT "system_settings_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."system_settings"
    ADD CONSTRAINT "system_settings_setting_key_key" UNIQUE ("setting_key");



ALTER TABLE ONLY "public"."transactions"
    ADD CONSTRAINT "transactions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."transactions"
    ADD CONSTRAINT "transactions_transaction_id_key" UNIQUE ("transaction_id");



ALTER TABLE ONLY "public"."payment_accounts"
    ADD CONSTRAINT "unique_profile_account_type" UNIQUE ("profile_id", "type");



COMMENT ON CONSTRAINT "unique_profile_account_type" ON "public"."payment_accounts" IS 'Ensures each user can only have one bank account and one mobile money account';



ALTER TABLE ONLY "public"."users"
    ADD CONSTRAINT "users_email_key" UNIQUE ("email");



ALTER TABLE ONLY "public"."users_notifications"
    ADD CONSTRAINT "users_notifications_notifications_id_user_id_key" UNIQUE ("notifications_id", "user_id");



ALTER TABLE ONLY "public"."users_notifications"
    ADD CONSTRAINT "users_notifications_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."users"
    ADD CONSTRAINT "users_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."users"
    ADD CONSTRAINT "users_user_id_key" UNIQUE ("user_id");



ALTER TABLE ONLY "public"."wallet_audit_log"
    ADD CONSTRAINT "wallet_audit_log_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."wallets"
    ADD CONSTRAINT "wallets_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."wallets"
    ADD CONSTRAINT "wallets_user_id_key" UNIQUE ("profile_id");



CREATE INDEX "idx_admins_email" ON "public"."admins" USING "btree" ("email");



CREATE INDEX "idx_admins_status" ON "public"."admins" USING "btree" ("status");



CREATE INDEX "idx_admins_type" ON "public"."admins" USING "btree" ("admin_type");



CREATE INDEX "idx_approval_audit_log_performed_by" ON "public"."approval_audit_log" USING "btree" ("performed_by");



CREATE INDEX "idx_approval_audit_log_request" ON "public"."approval_audit_log" USING "btree" ("approval_request_id");



CREATE INDEX "idx_approval_audit_log_timestamp" ON "public"."approval_audit_log" USING "btree" ("timestamp");



CREATE INDEX "idx_approval_notifications_read" ON "public"."approval_notifications" USING "btree" ("is_read");



CREATE INDEX "idx_approval_notifications_recipient" ON "public"."approval_notifications" USING "btree" ("recipient_id");



CREATE INDEX "idx_approval_notifications_request" ON "public"."approval_notifications" USING "btree" ("approval_request_id");



CREATE INDEX "idx_approval_requests_created_at" ON "public"."approval_requests" USING "btree" ("created_at");



CREATE INDEX "idx_approval_requests_expires_at" ON "public"."approval_requests" USING "btree" ("expires_at");



CREATE INDEX "idx_approval_requests_related_payout" ON "public"."approval_requests" USING "btree" ("related_payout_id");



CREATE INDEX "idx_approval_requests_related_project" ON "public"."approval_requests" USING "btree" ("related_project_id");



CREATE INDEX "idx_approval_requests_requested_by" ON "public"."approval_requests" USING "btree" ("requested_by");



CREATE INDEX "idx_approval_requests_reviewed_by" ON "public"."approval_requests" USING "btree" ("reviewed_by");



CREATE INDEX "idx_approval_requests_status" ON "public"."approval_requests" USING "btree" ("status");



CREATE INDEX "idx_approval_requests_type" ON "public"."approval_requests" USING "btree" ("request_type");



CREATE INDEX "idx_approval_workflow_steps_request" ON "public"."approval_workflow_steps" USING "btree" ("approval_request_id");



CREATE INDEX "idx_approval_workflow_steps_status" ON "public"."approval_workflow_steps" USING "btree" ("status");



CREATE INDEX "idx_high_ticket_investments_project_id" ON "public"."high_ticket_investments" USING "btree" ("project_id");



CREATE INDEX "idx_high_ticket_investments_status" ON "public"."high_ticket_investments" USING "btree" ("status");



CREATE INDEX "idx_high_ticket_investments_user_id" ON "public"."high_ticket_investments" USING "btree" ("user_id");



CREATE INDEX "idx_notification_queue_notification_id" ON "public"."notification_queue" USING "btree" ("notification_id");



CREATE INDEX "idx_notification_queue_status" ON "public"."notification_queue" USING "btree" ("status");



CREATE INDEX "idx_notification_queue_user_id" ON "public"."notification_queue" USING "btree" ("user_id");



CREATE INDEX "idx_notifications_created_at" ON "public"."notifications" USING "btree" ("created_at");



CREATE INDEX "idx_notifications_created_by" ON "public"."notifications" USING "btree" ("created_by");



CREATE INDEX "idx_notifications_scheduled_for" ON "public"."notifications" USING "btree" ("scheduled_for");



CREATE INDEX "idx_notifications_status" ON "public"."notifications" USING "btree" ("status");



CREATE INDEX "idx_payment_accounts_is_preferred" ON "public"."payment_accounts" USING "btree" ("profile_id", "is_preferred") WHERE ("is_preferred" = true);



CREATE INDEX "idx_payment_accounts_profile_id" ON "public"."payment_accounts" USING "btree" ("profile_id");



CREATE INDEX "idx_payment_accounts_type" ON "public"."payment_accounts" USING "btree" ("type");



CREATE INDEX "idx_payouts_created_at" ON "public"."payouts" USING "btree" ("created_at");



CREATE INDEX "idx_payouts_project_id" ON "public"."payouts" USING "btree" ("project_id");



CREATE INDEX "idx_payouts_status" ON "public"."payouts" USING "btree" ("status");



CREATE INDEX "idx_payouts_user_id" ON "public"."payouts" USING "btree" ("user_id");



CREATE INDEX "idx_pin_reset_tokens_expires_at" ON "public"."pin_reset_tokens" USING "btree" ("expires_at");



CREATE INDEX "idx_pin_reset_tokens_profile_id" ON "public"."pin_reset_tokens" USING "btree" ("profile_id");



CREATE INDEX "idx_pin_reset_tokens_token" ON "public"."pin_reset_tokens" USING "btree" ("token");



CREATE INDEX "idx_profiles_kyc_status" ON "public"."profile" USING "btree" ("kyc_status");



CREATE INDEX "idx_profiles_pin" ON "public"."profile" USING "btree" ("pin") WHERE ("pin" IS NOT NULL);



CREATE INDEX "idx_projects_code" ON "public"."projects" USING "btree" ("project_code");



CREATE INDEX "idx_projects_created_at" ON "public"."projects" USING "btree" ("created_at");



CREATE INDEX "idx_projects_status" ON "public"."projects" USING "btree" ("status");



CREATE INDEX "idx_projects_units" ON "public"."projects" USING "btree" ("total_units", "purchased_unit", "available_unit");



CREATE INDEX "idx_support_tickets_assigned_to" ON "public"."support_tickets" USING "btree" ("assigned_to");



CREATE INDEX "idx_support_tickets_category" ON "public"."support_tickets" USING "btree" ("category");



CREATE INDEX "idx_support_tickets_created_at" ON "public"."support_tickets" USING "btree" ("created_at");



CREATE INDEX "idx_support_tickets_priority" ON "public"."support_tickets" USING "btree" ("priority");



CREATE INDEX "idx_support_tickets_status" ON "public"."support_tickets" USING "btree" ("status");



CREATE INDEX "idx_support_tickets_user_id" ON "public"."support_tickets" USING "btree" ("user_id");



CREATE INDEX "idx_system_settings_category" ON "public"."system_settings" USING "btree" ("category");



CREATE INDEX "idx_system_settings_key" ON "public"."system_settings" USING "btree" ("setting_key");



CREATE INDEX "idx_transactions_created_at" ON "public"."transactions" USING "btree" ("created_at");



CREATE INDEX "idx_transactions_profile_id" ON "public"."transactions" USING "btree" ("profile_id");



CREATE INDEX "idx_transactions_project_id" ON "public"."transactions" USING "btree" ("project_id");



CREATE INDEX "idx_transactions_project_type_status" ON "public"."transactions" USING "btree" ("project_id", "type", "status");



CREATE INDEX "idx_transactions_status" ON "public"."transactions" USING "btree" ("status");



CREATE INDEX "idx_transactions_type" ON "public"."transactions" USING "btree" ("type");



CREATE INDEX "idx_users_bank_name" ON "public"."users" USING "btree" ("bank_name");



CREATE INDEX "idx_users_country" ON "public"."users" USING "btree" ("country");



CREATE INDEX "idx_users_created_at" ON "public"."users" USING "btree" ("created_at");



CREATE INDEX "idx_users_email" ON "public"."users" USING "btree" ("email");



CREATE INDEX "idx_users_kyc_status" ON "public"."users" USING "btree" ("kyc_status");



CREATE INDEX "idx_users_preferred_network" ON "public"."users" USING "btree" ("preferred_network");



CREATE INDEX "idx_users_status" ON "public"."users" USING "btree" ("account_status");



CREATE OR REPLACE TRIGGER "generate_high_ticket_investment_id_trigger" BEFORE INSERT ON "public"."high_ticket_investments" FOR EACH ROW EXECUTE FUNCTION "public"."generate_high_ticket_investment_id"();



CREATE OR REPLACE TRIGGER "generate_project_report_id_trigger" BEFORE INSERT ON "public"."project_reports" FOR EACH ROW EXECUTE FUNCTION "public"."generate_project_report_id"();



CREATE OR REPLACE TRIGGER "generate_transaction_id_trigger" BEFORE INSERT ON "public"."transactions" FOR EACH ROW EXECUTE FUNCTION "public"."generate_transaction_id"();



CREATE OR REPLACE TRIGGER "trg_projects_set_duration_months" BEFORE INSERT OR UPDATE OF "start_date", "end_date" ON "public"."projects" FOR EACH ROW EXECUTE FUNCTION "public"."projects_set_duration_months"();



CREATE OR REPLACE TRIGGER "trigger_calculate_duration_on_insert" BEFORE INSERT ON "public"."projects" FOR EACH ROW EXECUTE FUNCTION "public"."calculate_project_duration_months"();



CREATE OR REPLACE TRIGGER "trigger_calculate_duration_on_update" BEFORE UPDATE ON "public"."projects" FOR EACH ROW WHEN ((("old"."project_type" IS DISTINCT FROM "new"."project_type") OR ("old"."project_stages" IS DISTINCT FROM "new"."project_stages"))) EXECUTE FUNCTION "public"."calculate_project_duration_months"();



CREATE OR REPLACE TRIGGER "trigger_generate_approval_request_id" BEFORE INSERT ON "public"."approval_requests" FOR EACH ROW EXECUTE FUNCTION "public"."generate_approval_request_id"();



CREATE OR REPLACE TRIGGER "trigger_sync_available_units" BEFORE INSERT OR UPDATE OF "total_units" ON "public"."projects" FOR EACH ROW EXECUTE FUNCTION "public"."sync_available_units"();



CREATE OR REPLACE TRIGGER "trigger_sync_project_units_comprehensive" BEFORE INSERT OR UPDATE ON "public"."projects" FOR EACH ROW EXECUTE FUNCTION "public"."sync_project_units_comprehensive"();



CREATE OR REPLACE TRIGGER "trigger_update_approval_requests_updated_at" BEFORE UPDATE ON "public"."approval_requests" FOR EACH ROW EXECUTE FUNCTION "public"."update_approval_requests_updated_at"();



CREATE OR REPLACE TRIGGER "trigger_validate_unit_limits" BEFORE INSERT ON "public"."transactions" FOR EACH ROW WHEN (("new"."type" = ANY (ARRAY['investment'::"public"."transaction_type", 'Payin'::"public"."transaction_type"]))) EXECUTE FUNCTION "public"."validate_unit_limits_before_transaction"();



CREATE OR REPLACE TRIGGER "update_admins_updated_at" BEFORE UPDATE ON "public"."admins" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_high_ticket_investments_updated_at" BEFORE UPDATE ON "public"."high_ticket_investments" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_notifications_updated_at" BEFORE UPDATE ON "public"."notifications" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_payment_accounts_timestamp" BEFORE UPDATE ON "public"."payment_accounts" FOR EACH ROW EXECUTE FUNCTION "public"."update_payment_accounts_updated_at"();



CREATE OR REPLACE TRIGGER "update_payouts_updated_at" BEFORE UPDATE ON "public"."payouts" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_profiles_updated_at" BEFORE UPDATE ON "public"."profile" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_project_reports_updated_at" BEFORE UPDATE ON "public"."project_reports" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_project_stock_on_status_change_trigger" AFTER UPDATE ON "public"."transactions" FOR EACH ROW WHEN ((("old"."status" IS DISTINCT FROM "new"."status") OR ("old"."unit" IS DISTINCT FROM "new"."unit"))) EXECUTE FUNCTION "public"."update_project_stock_on_status_change"();



CREATE OR REPLACE TRIGGER "update_project_stock_trigger" AFTER INSERT ON "public"."transactions" FOR EACH ROW WHEN ((("new"."project_id" IS NOT NULL) AND ("new"."type" = ANY (ARRAY['investment'::"public"."transaction_type", 'Payin'::"public"."transaction_type"])))) EXECUTE FUNCTION "public"."update_project_stock_after_transaction"();



CREATE OR REPLACE TRIGGER "update_project_updates_updated_at" BEFORE UPDATE ON "public"."project_updates" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_projects_updated_at" BEFORE UPDATE ON "public"."projects" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_support_tickets_updated_at" BEFORE UPDATE ON "public"."support_tickets" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_system_settings_updated_at" BEFORE UPDATE ON "public"."system_settings" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_transactions_updated_at" BEFORE UPDATE ON "public"."transactions" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_user_stats_on_transaction" AFTER INSERT OR DELETE OR UPDATE ON "public"."transactions" FOR EACH ROW EXECUTE FUNCTION "public"."update_user_investment_stats"();



CREATE OR REPLACE TRIGGER "update_users_updated_at" BEFORE UPDATE ON "public"."users" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_wallet_on_topup_complete_trigger" AFTER UPDATE ON "public"."transactions" FOR EACH ROW WHEN (("old"."status" IS DISTINCT FROM "new"."status")) EXECUTE FUNCTION "public"."update_wallet_on_topup_complete"();

ALTER TABLE "public"."transactions" DISABLE TRIGGER "update_wallet_on_topup_complete_trigger";



CREATE OR REPLACE TRIGGER "update_wallet_on_transaction_insert_trigger" AFTER INSERT ON "public"."transactions" FOR EACH ROW EXECUTE FUNCTION "public"."update_wallet_on_topup_complete"();

ALTER TABLE "public"."transactions" DISABLE TRIGGER "update_wallet_on_transaction_insert_trigger";



CREATE OR REPLACE TRIGGER "wallet_audit_trigger" AFTER UPDATE ON "public"."wallets" FOR EACH ROW EXECUTE FUNCTION "public"."audit_wallet_changes"();



ALTER TABLE ONLY "public"."approval_audit_log"
    ADD CONSTRAINT "approval_audit_log_approval_request_id_fkey" FOREIGN KEY ("approval_request_id") REFERENCES "public"."approval_requests"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."approval_audit_log"
    ADD CONSTRAINT "approval_audit_log_performed_by_fkey" FOREIGN KEY ("performed_by") REFERENCES "public"."admins"("id");



ALTER TABLE ONLY "public"."approval_notifications"
    ADD CONSTRAINT "approval_notifications_approval_request_id_fkey" FOREIGN KEY ("approval_request_id") REFERENCES "public"."approval_requests"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."approval_notifications"
    ADD CONSTRAINT "approval_notifications_recipient_id_fkey" FOREIGN KEY ("recipient_id") REFERENCES "public"."admins"("id");



ALTER TABLE ONLY "public"."approval_requests"
    ADD CONSTRAINT "approval_requests_related_payout_id_fkey" FOREIGN KEY ("related_payout_id") REFERENCES "public"."payouts"("id");



ALTER TABLE ONLY "public"."approval_requests"
    ADD CONSTRAINT "approval_requests_related_project_id_fkey" FOREIGN KEY ("related_project_id") REFERENCES "public"."projects"("id");



ALTER TABLE ONLY "public"."approval_requests"
    ADD CONSTRAINT "approval_requests_related_user_id_fkey" FOREIGN KEY ("related_user_id") REFERENCES "public"."users"("id");



ALTER TABLE ONLY "public"."approval_requests"
    ADD CONSTRAINT "approval_requests_requested_by_fkey" FOREIGN KEY ("requested_by") REFERENCES "public"."admins"("id");



ALTER TABLE ONLY "public"."approval_requests"
    ADD CONSTRAINT "approval_requests_reviewed_by_fkey" FOREIGN KEY ("reviewed_by") REFERENCES "public"."admins"("id");



ALTER TABLE ONLY "public"."approval_workflow_steps"
    ADD CONSTRAINT "approval_workflow_steps_approval_request_id_fkey" FOREIGN KEY ("approval_request_id") REFERENCES "public"."approval_requests"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."approval_workflow_steps"
    ADD CONSTRAINT "approval_workflow_steps_approved_by_fkey" FOREIGN KEY ("approved_by") REFERENCES "public"."admins"("id");



ALTER TABLE ONLY "public"."high_ticket_investments"
    ADD CONSTRAINT "high_ticket_investments_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."high_ticket_investments"
    ADD CONSTRAINT "high_ticket_investments_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("user_id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."investments"
    ADD CONSTRAINT "investments_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id");



ALTER TABLE ONLY "public"."investments"
    ADD CONSTRAINT "investments_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id");



ALTER TABLE ONLY "public"."notification_queue"
    ADD CONSTRAINT "notification_queue_notification_id_fkey" FOREIGN KEY ("notification_id") REFERENCES "public"."notifications"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."notification_queue"
    ADD CONSTRAINT "notification_queue_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."notification_targets"
    ADD CONSTRAINT "notification_targets_notification_id_fkey" FOREIGN KEY ("notification_id") REFERENCES "public"."notifications"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."notification_targets"
    ADD CONSTRAINT "notification_targets_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "public"."profile"("id");



ALTER TABLE ONLY "public"."notifications"
    ADD CONSTRAINT "notifications_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."admins"("id");



ALTER TABLE ONLY "public"."payment_accounts"
    ADD CONSTRAINT "payment_accounts_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "public"."profile"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."payouts"
    ADD CONSTRAINT "payouts_profiles_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "public"."profile"("id");



ALTER TABLE ONLY "public"."payouts"
    ADD CONSTRAINT "payouts_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."pin_reset_tokens"
    ADD CONSTRAINT "pin_reset_tokens_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "public"."profile"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."profile"
    ADD CONSTRAINT "profiles_id_fkey" FOREIGN KEY ("id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."project_reports"
    ADD CONSTRAINT "project_reports_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."project_reports"
    ADD CONSTRAINT "project_reports_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."project_reports"
    ADD CONSTRAINT "project_reports_reviewed_by_fkey" FOREIGN KEY ("reviewed_by") REFERENCES "public"."admins"("id");



ALTER TABLE ONLY "public"."project_stage"
    ADD CONSTRAINT "project_stage_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id");



ALTER TABLE ONLY "public"."project_updates"
    ADD CONSTRAINT "project_updates_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."project_updates"
    ADD CONSTRAINT "project_updates_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."support_tickets"
    ADD CONSTRAINT "support_tickets_assigned_to_fkey" FOREIGN KEY ("assigned_to") REFERENCES "public"."admins"("id");



ALTER TABLE ONLY "public"."support_tickets"
    ADD CONSTRAINT "support_tickets_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."transactions"
    ADD CONSTRAINT "transactions_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "public"."profile"("id");



ALTER TABLE ONLY "public"."transactions"
    ADD CONSTRAINT "transactions_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."transactions"
    ADD CONSTRAINT "transactions_wallet_id_fkey" FOREIGN KEY ("wallet_id") REFERENCES "public"."wallets"("id");



ALTER TABLE ONLY "public"."users_notifications"
    ADD CONSTRAINT "users_notifications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profile"("id") ON UPDATE CASCADE ON DELETE CASCADE;



ALTER TABLE ONLY "public"."wallet_audit_log"
    ADD CONSTRAINT "wallet_audit_log_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."wallet_audit_log"
    ADD CONSTRAINT "wallet_audit_log_wallet_id_fkey" FOREIGN KEY ("wallet_id") REFERENCES "public"."wallets"("id");



ALTER TABLE ONLY "public"."wallets"
    ADD CONSTRAINT "wallets_auth_user_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."wallets"
    ADD CONSTRAINT "wallets_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "public"."profile"("id") ON UPDATE CASCADE ON DELETE CASCADE;



ALTER TABLE ONLY "public"."wallets"
    ADD CONSTRAINT "wallets_user_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



CREATE POLICY "Admins can create approval audit log entries" ON "public"."approval_audit_log" FOR INSERT TO "authenticated" WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."admins"
  WHERE (("admins"."id" = "approval_audit_log"."performed_by") AND (("admins"."email")::"text" = ("auth"."jwt"() ->> 'email'::"text"))))));



CREATE POLICY "Admins can create approval requests" ON "public"."approval_requests" FOR INSERT TO "authenticated" WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."admins"
  WHERE (("admins"."id" = "approval_requests"."requested_by") AND (("admins"."email")::"text" = ("auth"."jwt"() ->> 'email'::"text"))))));



CREATE POLICY "Admins can insert payout transactions" ON "public"."transactions" FOR INSERT WITH CHECK (((EXISTS ( SELECT 1
   FROM "public"."profile" "p"
  WHERE (("p"."id" = "transactions"."profile_id") AND ("p"."user_id" = "auth"."uid"())))) OR ("profile_id" = "auth"."uid"()) OR ((EXISTS ( SELECT 1
   FROM "public"."admins"
  WHERE ((("admins"."email")::"text" = ("auth"."jwt"() ->> 'email'::"text")) AND ("admins"."role" = ANY (ARRAY['Super Admin'::"public"."admin_type_old", 'Finance Admin'::"public"."admin_type_old", 'Investment Admin'::"public"."admin_type_old"]))))) AND ("type" = ANY (ARRAY['Payout'::"public"."transaction_type", 'payout_return'::"public"."transaction_type"])))));



CREATE POLICY "Admins can insert payouts" ON "public"."payouts" FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."admins"
  WHERE ((("admins"."email")::"text" = ("auth"."jwt"() ->> 'email'::"text")) AND ("admins"."role" = ANY (ARRAY['Super Admin'::"public"."admin_type_old", 'Finance Admin'::"public"."admin_type_old", 'Investment Admin'::"public"."admin_type_old"]))))));



CREATE POLICY "Admins can manage all investments" ON "public"."investments" USING ("public"."is_admin"("auth"."uid"()));



CREATE POLICY "Admins can manage all notifications" ON "public"."users_notifications" USING ("public"."is_admin"("auth"."uid"()));



CREATE POLICY "Admins can manage all projects" ON "public"."projects" USING ("public"."is_admin"("auth"."uid"())) WITH CHECK ("public"."is_admin"("auth"."uid"()));



CREATE POLICY "Admins can manage all support tickets" ON "public"."support_tickets" USING ("public"."is_admin"("auth"."uid"()));



CREATE POLICY "Admins can manage notifications" ON "public"."notifications" USING ("public"."is_admin"("auth"."uid"()));



CREATE POLICY "Admins can update approval requests" ON "public"."approval_requests" FOR UPDATE TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."admins"
  WHERE ((("admins"."email")::"text" = ("auth"."jwt"() ->> 'email'::"text")) AND ("admins"."role" = ANY (ARRAY['Super Admin'::"public"."admin_type_old", 'Finance Admin'::"public"."admin_type_old", 'Investment Admin'::"public"."admin_type_old"])))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."admins"
  WHERE ((("admins"."email")::"text" = ("auth"."jwt"() ->> 'email'::"text")) AND ("admins"."role" = ANY (ARRAY['Super Admin'::"public"."admin_type_old", 'Finance Admin'::"public"."admin_type_old", 'Investment Admin'::"public"."admin_type_old"]))))));



CREATE POLICY "Admins can view all high ticket investments" ON "public"."high_ticket_investments" USING ("public"."is_admin"("auth"."uid"()));



CREATE POLICY "Admins can view all payment accounts" ON "public"."payment_accounts" FOR SELECT USING ((("auth"."uid"() IN ( SELECT "profile"."user_id"
   FROM "public"."profile"
  WHERE ("profile"."id" = "payment_accounts"."profile_id"))) OR (EXISTS ( SELECT 1
   FROM "public"."admins"
  WHERE ((("admins"."email")::"text" = ("auth"."jwt"() ->> 'email'::"text")) AND ("admins"."role" = ANY (ARRAY['Super Admin'::"public"."admin_type_old", 'Finance Admin'::"public"."admin_type_old", 'Investment Admin'::"public"."admin_type_old"])))))));



CREATE POLICY "Admins can view all payouts" ON "public"."payouts" FOR SELECT USING (((EXISTS ( SELECT 1
   FROM "public"."profile"
  WHERE (("profile"."id" = "payouts"."profile_id") AND ("profile"."user_id" = "auth"."uid"())))) OR (EXISTS ( SELECT 1
   FROM "public"."admins"
  WHERE ((("admins"."email")::"text" = ("auth"."jwt"() ->> 'email'::"text")) AND ("admins"."role" = ANY (ARRAY['Super Admin'::"public"."admin_type_old", 'Finance Admin'::"public"."admin_type_old", 'Investment Admin'::"public"."admin_type_old"])))))));



CREATE POLICY "Admins can view all users" ON "public"."users" USING ("public"."is_admin"("auth"."uid"()));



CREATE POLICY "Admins can view all wallet audit logs" ON "public"."wallet_audit_log" USING ("public"."is_admin"("auth"."uid"()));



CREATE POLICY "Admins can view their own data" ON "public"."admins" FOR SELECT USING (("auth"."uid"() = "id"));



CREATE POLICY "Admins can view their own data by email" ON "public"."admins" FOR SELECT USING ((TRIM(BOTH FROM "public"."get_current_user_email"()) = TRIM(BOTH FROM "email")));



CREATE POLICY "All authenticated users can view project updates" ON "public"."project_updates" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "Authenticated users can view active projects" ON "public"."projects" FOR SELECT TO "authenticated" USING ((("status")::"text" = 'Active'::"text"));



CREATE POLICY "Authenticated users can view approval audit log" ON "public"."approval_audit_log" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "Authenticated users can view approval workflow steps" ON "public"."approval_workflow_steps" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "Authenticated users can view notification queue" ON "public"."notification_queue" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "Authenticated users can view system settings" ON "public"."system_settings" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "Finance Admin can view finance transactions" ON "public"."transactions" FOR SELECT TO "authenticated" USING (("public"."is_finance_admin"("auth"."uid"()) AND ("type" = ANY (ARRAY['Payout'::"public"."transaction_type", 'Refund'::"public"."transaction_type", 'momo_topup'::"public"."transaction_type", 'card_topup'::"public"."transaction_type", 'momo_withdrawal'::"public"."transaction_type", 'bank_withdrawal'::"public"."transaction_type", 'payout_return'::"public"."transaction_type"]))));



COMMENT ON POLICY "Finance Admin can view finance transactions" ON "public"."transactions" IS 'Allows Finance Admins to only view finance-related transactions (Payout, Refund, topups, withdrawals, etc.)';



CREATE POLICY "Finance and Super Admins can view COMPANY wallets" ON "public"."wallets" FOR SELECT USING ((("auth"."uid"() = "profile_id") OR (("wallet_type" = 'COMPANY'::"text") AND "public"."is_finance_or_super_admin"("auth"."uid"()))));



CREATE POLICY "Investment Admin can view investment transactions" ON "public"."transactions" FOR SELECT TO "authenticated" USING (("public"."is_investment_admin"("auth"."uid"()) AND ("type" = ANY (ARRAY['Payin'::"public"."transaction_type", 'investment'::"public"."transaction_type"]))));



COMMENT ON POLICY "Investment Admin can view investment transactions" ON "public"."transactions" IS 'Allows Investment Admins to only view Payin and investment type transactions';



CREATE POLICY "Only admins can delete project updates" ON "public"."project_updates" FOR DELETE TO "authenticated" USING ("public"."is_admin"("auth"."uid"()));



CREATE POLICY "Only admins can insert project updates" ON "public"."project_updates" FOR INSERT TO "authenticated" WITH CHECK ("public"."is_admin"("auth"."uid"()));



CREATE POLICY "Only admins can update project updates" ON "public"."project_updates" FOR UPDATE TO "authenticated" USING ("public"."is_admin"("auth"."uid"())) WITH CHECK ("public"."is_admin"("auth"."uid"()));



CREATE POLICY "Public can view countries" ON "public"."countries" FOR SELECT USING (true);



CREATE POLICY "Public can view latest updates" ON "public"."latest_updates" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "Public can view project stages" ON "public"."project_stage" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "Public can view published notifications" ON "public"."notifications" FOR SELECT USING (("status" = 'Published'::"public"."notification_status"));



CREATE POLICY "Service role can manage reset tokens" ON "public"."pin_reset_tokens" USING (true);



CREATE POLICY "Super Admin can view all transactions" ON "public"."transactions" FOR SELECT TO "authenticated" USING ("public"."is_super_admin"("auth"."uid"()));



COMMENT ON POLICY "Super Admin can view all transactions" ON "public"."transactions" IS 'Allows Super Admins to view all transactions';



CREATE POLICY "Super admins can manage all admins" ON "public"."admins" USING ("public"."is_super_admin"("auth"."uid"()));



CREATE POLICY "Super admins can update all profiles" ON "public"."profile" FOR UPDATE USING ("public"."is_super_admin"("auth"."uid"()));



CREATE POLICY "Super admins can view all profiles" ON "public"."profile" FOR SELECT USING ("public"."is_super_admin"("auth"."uid"()));



CREATE POLICY "System can insert wallets" ON "public"."wallets" FOR INSERT TO "authenticated" WITH CHECK ((((( SELECT "auth"."uid"() AS "uid") IS NOT NULL) AND ("profile_id" = ( SELECT "auth"."uid"() AS "uid"))) OR (EXISTS ( SELECT 1
   FROM "public"."admins" "a"
  WHERE ((("a"."id" = ( SELECT "auth"."uid"() AS "uid")) OR (("a"."email")::"text" = ("auth"."jwt"() ->> 'email'::"text"))) AND ("a"."admin_type" = ANY (ARRAY['Super Admin'::"public"."admin_type_old", 'Finance Admin'::"public"."admin_type_old"])))))));



CREATE POLICY "Users can create their own support tickets" ON "public"."support_tickets" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can delete their own payment accounts" ON "public"."payment_accounts" FOR DELETE USING (("auth"."uid"() IN ( SELECT "profile"."user_id"
   FROM "public"."profile"
  WHERE ("profile"."id" = "payment_accounts"."profile_id"))));



CREATE POLICY "Users can insert own profile" ON "public"."profile" FOR INSERT WITH CHECK (("auth"."uid"() = "id"));



CREATE POLICY "Users can insert their own investments" ON "public"."investments" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can insert their own payment accounts" ON "public"."payment_accounts" FOR INSERT WITH CHECK (("auth"."uid"() IN ( SELECT "profile"."user_id"
   FROM "public"."profile"
  WHERE ("profile"."id" = "payment_accounts"."profile_id"))));



CREATE POLICY "Users can insert their own transactions" ON "public"."transactions" FOR INSERT TO "authenticated" WITH CHECK (((EXISTS ( SELECT 1
   FROM "public"."profile" "p"
  WHERE (("p"."id" = "transactions"."profile_id") AND ("p"."user_id" = "auth"."uid"())))) OR ("profile_id" = "auth"."uid"())));



CREATE POLICY "Users can update own profile" ON "public"."profile" FOR UPDATE USING (("auth"."uid"() = "id"));



CREATE POLICY "Users can update own wallet" ON "public"."wallets" FOR UPDATE USING (("auth"."uid"() = "profile_id"));



CREATE POLICY "Users can update their own notifications" ON "public"."users_notifications" FOR UPDATE USING (("auth"."uid"() = "user_id")) WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can update their own payment accounts" ON "public"."payment_accounts" FOR UPDATE USING (("auth"."uid"() IN ( SELECT "profile"."user_id"
   FROM "public"."profile"
  WHERE ("profile"."id" = "payment_accounts"."profile_id"))));



CREATE POLICY "Users can update their own pending transactions" ON "public"."transactions" FOR UPDATE TO "authenticated" USING (((EXISTS ( SELECT 1
   FROM "public"."profile" "p"
  WHERE (("p"."id" = "transactions"."profile_id") AND ("p"."user_id" = "auth"."uid"())))) AND ("status" = 'Pending'::"public"."transaction_status"))) WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."profile" "p"
  WHERE (("p"."id" = "transactions"."profile_id") AND ("p"."user_id" = "auth"."uid"())))));



CREATE POLICY "Users can update their own support tickets" ON "public"."support_tickets" FOR UPDATE USING ((("auth"."uid"() = "user_id") AND (("status" IS NULL) OR (("status")::"text" <> 'Resolved'::"text")))) WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can update their own user record" ON "public"."users" FOR UPDATE USING (("auth"."uid"() = "id")) WITH CHECK (("auth"."uid"() = "id"));



CREATE POLICY "Users can view completed projects they invested in" ON "public"."projects" FOR SELECT TO "authenticated" USING (((("status")::"text" = 'Active'::"text") OR (((("status")::"text" = 'Completed'::"text") OR (("status")::"text" = 'Complete'::"text") OR (("status")::"text" = 'Fully Funded'::"text") OR (("status")::"text" = 'Inactive'::"text")) AND (EXISTS ( SELECT 1
   FROM ("public"."transactions" "t"
     JOIN "public"."profile" "p" ON (("p"."id" = "t"."profile_id")))
  WHERE (("t"."project_id" = "projects"."id") AND ("p"."user_id" = "auth"."uid"()) AND ("t"."type" = ANY (ARRAY['Payin'::"public"."transaction_type", 'investment'::"public"."transaction_type"])) AND ("t"."status" = 'Complete'::"public"."transaction_status")))))));



CREATE POLICY "Users can view own approval notifications" ON "public"."approval_notifications" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."profile"
  WHERE (("profile"."id" = "approval_notifications"."recipient_id") AND ("profile"."user_id" = "auth"."uid"())))));



CREATE POLICY "Users can view own approval requests" ON "public"."approval_requests" FOR SELECT TO "authenticated" USING (((EXISTS ( SELECT 1
   FROM "public"."profile"
  WHERE (("profile"."id" = "approval_requests"."requested_by") AND ("profile"."user_id" = "auth"."uid"())))) OR (EXISTS ( SELECT 1
   FROM "public"."admins"
  WHERE (("admins"."id" = "approval_requests"."requested_by") AND (("admins"."email")::"text" = ("auth"."jwt"() ->> 'email'::"text"))))) OR (EXISTS ( SELECT 1
   FROM "public"."admins"
  WHERE ((("admins"."email")::"text" = ("auth"."jwt"() ->> 'email'::"text")) AND ("admins"."role" = ANY (ARRAY['Super Admin'::"public"."admin_type_old", 'Finance Admin'::"public"."admin_type_old", 'Investment Admin'::"public"."admin_type_old"])))))));



CREATE POLICY "Users can view own notification targets" ON "public"."notification_targets" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."profile"
  WHERE (("profile"."id" = "notification_targets"."profile_id") AND ("profile"."user_id" = "auth"."uid"())))));



CREATE POLICY "Users can view own payouts" ON "public"."payouts" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."profile"
  WHERE (("profile"."id" = "payouts"."profile_id") AND ("profile"."user_id" = "auth"."uid"())))));



CREATE POLICY "Users can view own profile" ON "public"."profile" FOR SELECT USING (("auth"."uid"() = "id"));



CREATE POLICY "Users can view own wallet" ON "public"."wallets" FOR SELECT USING (("auth"."uid"() = "profile_id"));



CREATE POLICY "Users can view reports for their invested projects" ON "public"."project_reports" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM ("public"."transactions"
     JOIN "public"."profile" ON (("transactions"."profile_id" = "profile"."id")))
  WHERE (("transactions"."project_id" = "project_reports"."project_id") AND ("profile"."user_id" = "auth"."uid"()) AND ("transactions"."type" = ANY (ARRAY['Payin'::"public"."transaction_type", 'investment'::"public"."transaction_type"])) AND ("transactions"."status" = 'Complete'::"public"."transaction_status")))));



CREATE POLICY "Users can view their own high ticket investments" ON "public"."high_ticket_investments" FOR SELECT USING ((("auth"."uid"())::"text" = ("user_id")::"text"));



CREATE POLICY "Users can view their own investments" ON "public"."investments" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view their own notifications" ON "public"."users_notifications" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view their own payment accounts" ON "public"."payment_accounts" FOR SELECT USING (("auth"."uid"() IN ( SELECT "profile"."user_id"
   FROM "public"."profile"
  WHERE ("profile"."id" = "payment_accounts"."profile_id"))));



CREATE POLICY "Users can view their own reset tokens" ON "public"."pin_reset_tokens" FOR SELECT USING (("profile_id" IN ( SELECT "profile"."id"
   FROM "public"."profile"
  WHERE ("profile"."user_id" = "auth"."uid"()))));



CREATE POLICY "Users can view their own support tickets" ON "public"."support_tickets" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view their own transactions" ON "public"."transactions" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."profile" "p"
  WHERE (("p"."id" = "transactions"."profile_id") AND ("p"."user_id" = "auth"."uid"())))));



CREATE POLICY "Users can view their own user record" ON "public"."users" FOR SELECT USING (("auth"."uid"() = "id"));



CREATE POLICY "Users can view their own wallet audit logs" ON "public"."wallet_audit_log" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."wallets"
  WHERE (("wallets"."id" = "wallet_audit_log"."wallet_id") AND ("wallets"."profile_id" = "auth"."uid"())))));



ALTER TABLE "public"."admins" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."approval_audit_log" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."approval_requests" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."approval_workflow_steps" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."countries" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."high_ticket_investments" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."investments" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."latest_updates" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."notification_queue" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."notification_targets" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."notifications" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."payment_accounts" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."payouts" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."pin_reset_tokens" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."profile" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."project_reports" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."project_stage" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."project_updates" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."projects" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."support_tickets" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."system_settings" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."transactions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."users" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."users_notifications" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."wallet_audit_log" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."wallets" ENABLE ROW LEVEL SECURITY;


GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";



GRANT ALL ON FUNCTION "public"."approve_request"("p_request_id" "uuid", "p_reviewed_by" "uuid", "p_approval_notes" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."approve_request"("p_request_id" "uuid", "p_reviewed_by" "uuid", "p_approval_notes" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."approve_request"("p_request_id" "uuid", "p_reviewed_by" "uuid", "p_approval_notes" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."audit_wallet_changes"() TO "anon";
GRANT ALL ON FUNCTION "public"."audit_wallet_changes"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."audit_wallet_changes"() TO "service_role";



GRANT ALL ON FUNCTION "public"."calc_full_months"("start_d" "date", "end_d" "date") TO "anon";
GRANT ALL ON FUNCTION "public"."calc_full_months"("start_d" "date", "end_d" "date") TO "authenticated";
GRANT ALL ON FUNCTION "public"."calc_full_months"("start_d" "date", "end_d" "date") TO "service_role";



GRANT ALL ON FUNCTION "public"."calculate_investor_units"() TO "anon";
GRANT ALL ON FUNCTION "public"."calculate_investor_units"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."calculate_investor_units"() TO "service_role";



GRANT ALL ON FUNCTION "public"."calculate_payout_amount"("base_amount" numeric, "payment_method" character varying) TO "anon";
GRANT ALL ON FUNCTION "public"."calculate_payout_amount"("base_amount" numeric, "payment_method" character varying) TO "authenticated";
GRANT ALL ON FUNCTION "public"."calculate_payout_amount"("base_amount" numeric, "payment_method" character varying) TO "service_role";



GRANT ALL ON FUNCTION "public"."calculate_project_duration_months"() TO "anon";
GRANT ALL ON FUNCTION "public"."calculate_project_duration_months"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."calculate_project_duration_months"() TO "service_role";



GRANT ALL ON FUNCTION "public"."create_approval_request"("p_request_type" character varying, "p_title" character varying, "p_description" "text", "p_request_data" "jsonb", "p_requested_by" "uuid", "p_priority" character varying, "p_expires_hours" integer, "p_related_project_id" "uuid", "p_related_payout_id" "uuid", "p_related_user_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."create_approval_request"("p_request_type" character varying, "p_title" character varying, "p_description" "text", "p_request_data" "jsonb", "p_requested_by" "uuid", "p_priority" character varying, "p_expires_hours" integer, "p_related_project_id" "uuid", "p_related_payout_id" "uuid", "p_related_user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."create_approval_request"("p_request_type" character varying, "p_title" character varying, "p_description" "text", "p_request_data" "jsonb", "p_requested_by" "uuid", "p_priority" character varying, "p_expires_hours" integer, "p_related_project_id" "uuid", "p_related_payout_id" "uuid", "p_related_user_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."delete_project_safely"("p_project_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."delete_project_safely"("p_project_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."delete_project_safely"("p_project_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."find_blocking_triggers"() TO "anon";
GRANT ALL ON FUNCTION "public"."find_blocking_triggers"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."find_blocking_triggers"() TO "service_role";



GRANT ALL ON FUNCTION "public"."generate_approval_request_id"() TO "anon";
GRANT ALL ON FUNCTION "public"."generate_approval_request_id"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."generate_approval_request_id"() TO "service_role";



GRANT ALL ON FUNCTION "public"."generate_high_ticket_investment_id"() TO "anon";
GRANT ALL ON FUNCTION "public"."generate_high_ticket_investment_id"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."generate_high_ticket_investment_id"() TO "service_role";



GRANT ALL ON FUNCTION "public"."generate_project_report_id"() TO "anon";
GRANT ALL ON FUNCTION "public"."generate_project_report_id"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."generate_project_report_id"() TO "service_role";



GRANT ALL ON FUNCTION "public"."generate_project_update_id"() TO "anon";
GRANT ALL ON FUNCTION "public"."generate_project_update_id"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."generate_project_update_id"() TO "service_role";



GRANT ALL ON FUNCTION "public"."generate_transaction_id"() TO "anon";
GRANT ALL ON FUNCTION "public"."generate_transaction_id"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."generate_transaction_id"() TO "service_role";



GRANT ALL ON FUNCTION "public"."generate_user_invitation_id"() TO "anon";
GRANT ALL ON FUNCTION "public"."generate_user_invitation_id"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."generate_user_invitation_id"() TO "service_role";



GRANT ALL ON FUNCTION "public"."get_current_user_email"() TO "anon";
GRANT ALL ON FUNCTION "public"."get_current_user_email"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_current_user_email"() TO "service_role";



GRANT ALL ON FUNCTION "public"."get_dashboard_stats"() TO "anon";
GRANT ALL ON FUNCTION "public"."get_dashboard_stats"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_dashboard_stats"() TO "service_role";



GRANT ALL ON FUNCTION "public"."get_investor_summary"("p_project_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_investor_summary"("p_project_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_investor_summary"("p_project_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_transaction_analytics"() TO "anon";
GRANT ALL ON FUNCTION "public"."get_transaction_analytics"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_transaction_analytics"() TO "service_role";



GRANT ALL ON FUNCTION "public"."get_user_analytics"() TO "anon";
GRANT ALL ON FUNCTION "public"."get_user_analytics"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_user_analytics"() TO "service_role";



GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "anon";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "service_role";



GRANT ALL ON FUNCTION "public"."handle_new_user_signup"() TO "anon";
GRANT ALL ON FUNCTION "public"."handle_new_user_signup"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_new_user_signup"() TO "service_role";



GRANT ALL ON FUNCTION "public"."is_admin"("user_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."is_admin"("user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."is_admin"("user_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."is_finance_admin"("user_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."is_finance_admin"("user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."is_finance_admin"("user_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."is_finance_or_super_admin"("user_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."is_finance_or_super_admin"("user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."is_finance_or_super_admin"("user_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."is_investment_admin"("user_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."is_investment_admin"("user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."is_investment_admin"("user_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."is_super_admin"("user_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."is_super_admin"("user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."is_super_admin"("user_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."process_wallet_transaction"("p_wallet_id" "uuid", "p_amount" numeric, "p_type" character varying, "p_description" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."process_wallet_transaction"("p_wallet_id" "uuid", "p_amount" numeric, "p_type" character varying, "p_description" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."process_wallet_transaction"("p_wallet_id" "uuid", "p_amount" numeric, "p_type" character varying, "p_description" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."projects_set_duration_months"() TO "anon";
GRANT ALL ON FUNCTION "public"."projects_set_duration_months"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."projects_set_duration_months"() TO "service_role";



GRANT ALL ON FUNCTION "public"."recalculate_all_project_units"() TO "anon";
GRANT ALL ON FUNCTION "public"."recalculate_all_project_units"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."recalculate_all_project_units"() TO "service_role";



GRANT ALL ON FUNCTION "public"."recalculate_project_units"("p_project_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."recalculate_project_units"("p_project_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."recalculate_project_units"("p_project_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."reject_request"("p_request_id" "uuid", "p_reviewed_by" "uuid", "p_rejection_reason" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."reject_request"("p_request_id" "uuid", "p_reviewed_by" "uuid", "p_rejection_reason" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."reject_request"("p_request_id" "uuid", "p_reviewed_by" "uuid", "p_rejection_reason" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."sync_all_project_units"() TO "anon";
GRANT ALL ON FUNCTION "public"."sync_all_project_units"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."sync_all_project_units"() TO "service_role";



GRANT ALL ON FUNCTION "public"."sync_available_units"() TO "anon";
GRANT ALL ON FUNCTION "public"."sync_available_units"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."sync_available_units"() TO "service_role";



GRANT ALL ON FUNCTION "public"."sync_investor_from_auth"() TO "anon";
GRANT ALL ON FUNCTION "public"."sync_investor_from_auth"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."sync_investor_from_auth"() TO "service_role";



GRANT ALL ON FUNCTION "public"."sync_project_units_comprehensive"() TO "anon";
GRANT ALL ON FUNCTION "public"."sync_project_units_comprehensive"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."sync_project_units_comprehensive"() TO "service_role";



GRANT ALL ON FUNCTION "public"."sync_wallet_balances_for_payouts"() TO "anon";
GRANT ALL ON FUNCTION "public"."sync_wallet_balances_for_payouts"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."sync_wallet_balances_for_payouts"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_approval_requests_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_approval_requests_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_approval_requests_updated_at"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_available_units_on_project_change"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_available_units_on_project_change"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_available_units_on_project_change"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_available_units_on_total_units_change"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_available_units_on_total_units_change"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_available_units_on_total_units_change"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_last_login"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_last_login"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_last_login"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_payment_accounts_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_payment_accounts_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_payment_accounts_updated_at"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_project_available_units"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_project_available_units"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_project_available_units"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_project_stock_after_transaction"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_project_stock_after_transaction"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_project_stock_after_transaction"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_project_stock_on_status_change"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_project_stock_on_status_change"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_project_stock_on_status_change"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_project_total_units"("p_project_id" "uuid", "p_new_total_units" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."update_project_total_units"("p_project_id" "uuid", "p_new_total_units" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_project_total_units"("p_project_id" "uuid", "p_new_total_units" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."update_project_units"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_project_units"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_project_units"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_project_units_for_project"("p_project_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."update_project_units_for_project"("p_project_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_project_units_for_project"("p_project_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."update_project_units_on_transaction_change"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_project_units_on_transaction_change"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_project_units_on_transaction_change"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_user_investment_stats"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_user_investment_stats"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_user_investment_stats"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_wallet_on_topup_complete"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_wallet_on_topup_complete"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_wallet_on_topup_complete"() TO "service_role";



GRANT ALL ON FUNCTION "public"."validate_unit_limits"() TO "anon";
GRANT ALL ON FUNCTION "public"."validate_unit_limits"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."validate_unit_limits"() TO "service_role";



GRANT ALL ON FUNCTION "public"."validate_unit_limits_before_transaction"() TO "anon";
GRANT ALL ON FUNCTION "public"."validate_unit_limits_before_transaction"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."validate_unit_limits_before_transaction"() TO "service_role";



GRANT ALL ON TABLE "public"."_prisma_migrations" TO "anon";
GRANT ALL ON TABLE "public"."_prisma_migrations" TO "authenticated";
GRANT ALL ON TABLE "public"."_prisma_migrations" TO "service_role";



GRANT ALL ON TABLE "public"."admins" TO "anon";
GRANT ALL ON TABLE "public"."admins" TO "authenticated";
GRANT ALL ON TABLE "public"."admins" TO "service_role";



GRANT ALL ON TABLE "public"."approval_audit_log" TO "anon";
GRANT ALL ON TABLE "public"."approval_audit_log" TO "authenticated";
GRANT ALL ON TABLE "public"."approval_audit_log" TO "service_role";



GRANT ALL ON TABLE "public"."approval_notifications" TO "anon";
GRANT ALL ON TABLE "public"."approval_notifications" TO "authenticated";
GRANT ALL ON TABLE "public"."approval_notifications" TO "service_role";



GRANT ALL ON TABLE "public"."approval_requests" TO "anon";
GRANT ALL ON TABLE "public"."approval_requests" TO "authenticated";
GRANT ALL ON TABLE "public"."approval_requests" TO "service_role";



GRANT ALL ON TABLE "public"."approval_workflow_steps" TO "anon";
GRANT ALL ON TABLE "public"."approval_workflow_steps" TO "authenticated";
GRANT ALL ON TABLE "public"."approval_workflow_steps" TO "service_role";



GRANT ALL ON TABLE "public"."countries" TO "anon";
GRANT ALL ON TABLE "public"."countries" TO "authenticated";
GRANT ALL ON TABLE "public"."countries" TO "service_role";



GRANT ALL ON TABLE "public"."users" TO "anon";
GRANT ALL ON TABLE "public"."users" TO "authenticated";
GRANT ALL ON TABLE "public"."users" TO "service_role";



GRANT ALL ON TABLE "public"."country_analytics" TO "anon";
GRANT ALL ON TABLE "public"."country_analytics" TO "authenticated";
GRANT ALL ON TABLE "public"."country_analytics" TO "service_role";



GRANT ALL ON TABLE "public"."high_ticket_investments" TO "anon";
GRANT ALL ON TABLE "public"."high_ticket_investments" TO "authenticated";
GRANT ALL ON TABLE "public"."high_ticket_investments" TO "service_role";



GRANT ALL ON TABLE "public"."projects" TO "anon";
GRANT ALL ON TABLE "public"."projects" TO "authenticated";
GRANT ALL ON TABLE "public"."projects" TO "service_role";



GRANT ALL ON TABLE "public"."high_ticket_investment_analytics" TO "anon";
GRANT ALL ON TABLE "public"."high_ticket_investment_analytics" TO "authenticated";
GRANT ALL ON TABLE "public"."high_ticket_investment_analytics" TO "service_role";



GRANT ALL ON TABLE "public"."high_ticket_investment_analytics_v2" TO "anon";
GRANT ALL ON TABLE "public"."high_ticket_investment_analytics_v2" TO "authenticated";
GRANT ALL ON TABLE "public"."high_ticket_investment_analytics_v2" TO "service_role";



GRANT ALL ON TABLE "public"."investments" TO "anon";
GRANT ALL ON TABLE "public"."investments" TO "authenticated";
GRANT ALL ON TABLE "public"."investments" TO "service_role";



GRANT ALL ON TABLE "public"."latest_updates" TO "anon";
GRANT ALL ON TABLE "public"."latest_updates" TO "authenticated";
GRANT ALL ON TABLE "public"."latest_updates" TO "service_role";



GRANT ALL ON TABLE "public"."notification_queue" TO "anon";
GRANT ALL ON TABLE "public"."notification_queue" TO "authenticated";
GRANT ALL ON TABLE "public"."notification_queue" TO "service_role";



GRANT ALL ON TABLE "public"."notification_targets" TO "anon";
GRANT ALL ON TABLE "public"."notification_targets" TO "authenticated";
GRANT ALL ON TABLE "public"."notification_targets" TO "service_role";



GRANT ALL ON TABLE "public"."notifications" TO "anon";
GRANT ALL ON TABLE "public"."notifications" TO "authenticated";
GRANT ALL ON TABLE "public"."notifications" TO "service_role";



GRANT ALL ON TABLE "public"."payment_accounts" TO "anon";
GRANT ALL ON TABLE "public"."payment_accounts" TO "authenticated";
GRANT ALL ON TABLE "public"."payment_accounts" TO "service_role";



GRANT ALL ON TABLE "public"."payouts" TO "anon";
GRANT ALL ON TABLE "public"."payouts" TO "authenticated";
GRANT ALL ON TABLE "public"."payouts" TO "service_role";



GRANT ALL ON TABLE "public"."payout_calculations" TO "anon";
GRANT ALL ON TABLE "public"."payout_calculations" TO "authenticated";
GRANT ALL ON TABLE "public"."payout_calculations" TO "service_role";



GRANT ALL ON TABLE "public"."payout_calculations_v2" TO "anon";
GRANT ALL ON TABLE "public"."payout_calculations_v2" TO "authenticated";
GRANT ALL ON TABLE "public"."payout_calculations_v2" TO "service_role";



GRANT ALL ON TABLE "public"."pin_reset_tokens" TO "anon";
GRANT ALL ON TABLE "public"."pin_reset_tokens" TO "authenticated";
GRANT ALL ON TABLE "public"."pin_reset_tokens" TO "service_role";



GRANT ALL ON TABLE "public"."profile" TO "anon";
GRANT ALL ON TABLE "public"."profile" TO "authenticated";
GRANT ALL ON TABLE "public"."profile" TO "service_role";



GRANT ALL ON SEQUENCE "public"."project_report_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."project_report_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."project_report_seq" TO "service_role";



GRANT ALL ON TABLE "public"."project_reports" TO "anon";
GRANT ALL ON TABLE "public"."project_reports" TO "authenticated";
GRANT ALL ON TABLE "public"."project_reports" TO "service_role";



GRANT ALL ON TABLE "public"."project_reports_summary_v2" TO "anon";
GRANT ALL ON TABLE "public"."project_reports_summary_v2" TO "authenticated";
GRANT ALL ON TABLE "public"."project_reports_summary_v2" TO "service_role";



GRANT ALL ON TABLE "public"."project_stage" TO "anon";
GRANT ALL ON TABLE "public"."project_stage" TO "authenticated";
GRANT ALL ON TABLE "public"."project_stage" TO "service_role";



GRANT ALL ON SEQUENCE "public"."project_stage_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."project_stage_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."project_stage_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."project_updates" TO "anon";
GRANT ALL ON TABLE "public"."project_updates" TO "authenticated";
GRANT ALL ON TABLE "public"."project_updates" TO "service_role";



GRANT ALL ON TABLE "public"."project_updates_summary_v2" TO "anon";
GRANT ALL ON TABLE "public"."project_updates_summary_v2" TO "authenticated";
GRANT ALL ON TABLE "public"."project_updates_summary_v2" TO "service_role";



GRANT ALL ON TABLE "public"."support_tickets" TO "anon";
GRANT ALL ON TABLE "public"."support_tickets" TO "authenticated";
GRANT ALL ON TABLE "public"."support_tickets" TO "service_role";



GRANT ALL ON TABLE "public"."system_settings" TO "anon";
GRANT ALL ON TABLE "public"."system_settings" TO "authenticated";
GRANT ALL ON TABLE "public"."system_settings" TO "service_role";



GRANT ALL ON TABLE "public"."transactions" TO "anon";
GRANT ALL ON TABLE "public"."transactions" TO "authenticated";
GRANT ALL ON TABLE "public"."transactions" TO "service_role";



GRANT ALL ON TABLE "public"."transaction_analytics" TO "anon";
GRANT ALL ON TABLE "public"."transaction_analytics" TO "authenticated";
GRANT ALL ON TABLE "public"."transaction_analytics" TO "service_role";



GRANT ALL ON TABLE "public"."users_notifications" TO "anon";
GRANT ALL ON TABLE "public"."users_notifications" TO "authenticated";
GRANT ALL ON TABLE "public"."users_notifications" TO "service_role";



GRANT ALL ON TABLE "public"."wallet_audit_log" TO "anon";
GRANT ALL ON TABLE "public"."wallet_audit_log" TO "authenticated";
GRANT ALL ON TABLE "public"."wallet_audit_log" TO "service_role";



GRANT ALL ON TABLE "public"."wallets" TO "anon";
GRANT ALL ON TABLE "public"."wallets" TO "authenticated";
GRANT ALL ON TABLE "public"."wallets" TO "service_role";



ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "service_role";






