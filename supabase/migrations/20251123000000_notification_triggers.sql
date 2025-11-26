-- Notification Auto-Trigger Migration
-- This migration creates database triggers that automatically send notifications
-- when certain events occur, eliminating the need for manual back office intervention

-- Enable pg_net extension if not already enabled
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Configuration: Set the edge function URL
-- For preview/development: xiupdgdgsnkxkcpkftad
-- For production: gbeqqboxlflpgehyqlld
DO $$
DECLARE
  project_ref TEXT;
BEGIN
  -- Get current project ref from Supabase
  SELECT current_setting('app.settings.project_ref', true) INTO project_ref;
  
  -- Default to preview if not set
  IF project_ref IS NULL THEN
    project_ref := 'xiupdgdgsnkxkcpkftad';
  END IF;
  
  -- Store in a custom setting (we'll use a table for this)
  PERFORM set_config('app.notification_base_url', 
    format('https://%s.supabase.co/functions/v1/notifications', project_ref), 
    false);
END $$;

-- Create a settings table to store notification configuration
CREATE TABLE IF NOT EXISTS notification_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT UNIQUE NOT NULL,
  value TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert default notification base URL
INSERT INTO notification_settings (key, value, description)
VALUES (
  'edge_function_url',
  'https://xiupdgdgsnkxkcpkftad.supabase.co/functions/v1/notifications',
  'Base URL for the notification edge function'
)
ON CONFLICT (key) DO UPDATE SET 
  value = EXCLUDED.value,
  updated_at = NOW();

-- Helper function to get notification service URL
CREATE OR REPLACE FUNCTION get_notification_service_url()
RETURNS TEXT
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
  service_url TEXT;
BEGIN
  SELECT value INTO service_url
  FROM notification_settings
  WHERE key = 'edge_function_url';
  
  RETURN COALESCE(service_url, 'https://xiupdgdgsnkxkcpkftad.supabase.co/functions/v1/notifications');
END;
$$;

-- Helper function to call notification edge function
CREATE OR REPLACE FUNCTION call_notification_service(
  endpoint TEXT,
  method TEXT DEFAULT 'POST',
  payload JSONB DEFAULT '{}'::jsonb
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  service_url TEXT;
  full_url TEXT;
  service_role_key TEXT;
  response_id BIGINT;
BEGIN
  -- Get service URL
  service_url := get_notification_service_url();
  full_url := service_url || endpoint;
  
  -- Get service role key from secrets (Supabase provides this)
  -- Note: In production, use Supabase secrets management
  service_role_key := current_setting('app.settings.service_role_key', true);
  
  -- If service role key is not set, we'll use anon key or skip auth
  -- In production, this should be set via Supabase secrets
  
  -- Make async HTTP request using pg_net
  SELECT net.http_post(
    url := full_url,
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', COALESCE('Bearer ' || service_role_key, ''),
      'apikey', COALESCE(service_role_key, '')
    )::jsonb,
    body := payload::jsonb
  ) INTO response_id;
  
  -- Log the request (optional)
  -- You can check net.http_request_queue for status
  
EXCEPTION
  WHEN OTHERS THEN
    -- Log error but don't fail the transaction
    RAISE WARNING 'Failed to call notification service: %', SQLERRM;
END;
$$;

-- ============================================================================
-- TRIGGER FUNCTIONS FOR AUTOMATIC NOTIFICATIONS
-- ============================================================================

-- 1. Notify when project stage changes
CREATE OR REPLACE FUNCTION notify_project_stage_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  project_name TEXT;
  old_stage TEXT;
  new_stage TEXT;
  subject TEXT;
  html_content TEXT;
  text_content TEXT;
BEGIN
  -- Only trigger if stage actually changed
  IF OLD.current_stage IS DISTINCT FROM NEW.current_stage THEN
    -- Get project details
    SELECT project_name INTO project_name
    FROM projects
    WHERE id = NEW.id;
    
    old_stage := COALESCE(OLD.current_stage::TEXT, 'Unknown');
    new_stage := COALESCE(NEW.current_stage::TEXT, 'Unknown');
    
    -- Prepare notification content
    subject := format('%s - Stage Update', project_name);
    html_content := format(
      '<h2>Project Stage Update</h2>
      <p>Great news! The project <strong>%s</strong> has progressed from <strong>%s</strong> to <strong>%s</strong>.</p>
      <p>You can view more details in your dashboard.</p>
      <a href="https://app.agripath.co/projects/%s">View Project</a>',
      project_name, old_stage, new_stage, NEW.id
    );
    text_content := format(
      'Project %s has moved from %s to %s stage. View details: https://app.agripath.co/projects/%s',
      project_name, old_stage, new_stage, NEW.id
    );
    
    -- Send email to all project investors
    PERFORM call_notification_service(
      format('/email/project/%s', NEW.id),
      'POST',
      jsonb_build_object(
        'subject', subject,
        'text', text_content,
        'html', html_content
      )
    );
  END IF;
  
  RETURN NEW;
END;
$$;

-- 2. Notify when payout is completed
CREATE OR REPLACE FUNCTION notify_payout_completed()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  user_profile_id UUID;
  payout_amount NUMERIC;
  payout_type TEXT;
  currency TEXT;
  title TEXT;
  body TEXT;
BEGIN
  -- Only trigger when payout status changes to 'Completed'
  IF OLD.status IS DISTINCT FROM NEW.status AND NEW.status = 'Completed' THEN
    -- Get user profile ID from payout
    SELECT profile_id, amount, type, currency
    INTO user_profile_id, payout_amount, payout_type, currency
    FROM payouts
    WHERE id = NEW.id;
    
    IF user_profile_id IS NOT NULL THEN
      -- Prepare notification
      title := 'Payout Received';
      body := format(
        'You have received %s %s as %s. The funds have been added to your wallet.',
        currency,
        payout_amount::TEXT,
        payout_type
      );
      
      -- Send multi-channel notification (Email, SMS, In-App, Push)
      PERFORM call_notification_service(
        format('/all/user/%s', user_profile_id),
        'POST',
        jsonb_build_object(
          'title', title,
          'body', body
        )
      );
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

-- 3. Notify when transaction is completed (investment success)
CREATE OR REPLACE FUNCTION notify_transaction_completed()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  user_profile_id UUID;
  transaction_amount NUMERIC;
  project_name TEXT;
  title TEXT;
  body TEXT;
BEGIN
  -- Only trigger when transaction status changes to 'Complete'
  IF OLD.status IS DISTINCT FROM NEW.status 
     AND NEW.status = 'Complete' 
     AND NEW.type IN ('Payin', 'investment') THEN
    
    user_profile_id := NEW.profile_id;
    transaction_amount := NEW.amount;
    
    -- Get project name if available
    IF NEW.project_id IS NOT NULL THEN
      SELECT project_name INTO project_name
      FROM projects
      WHERE id = NEW.project_id;
    END IF;
    
    -- Prepare notification
    title := 'Investment Successful';
    body := format(
      'Your investment of GHS %s has been processed successfully.%s',
      transaction_amount::TEXT,
      CASE 
        WHEN project_name IS NOT NULL THEN format(' Project: %s', project_name)
        ELSE ''
      END
    );
    
    -- Send in-app notification
    PERFORM call_notification_service(
      format('/inapp/user/%s', user_profile_id),
      'POST',
      jsonb_build_object(
        'title', title,
        'body', body
      )
    );
  END IF;
  
  RETURN NEW;
END;
$$;

-- 4. Notify when investment is created (welcome notification)
CREATE OR REPLACE FUNCTION notify_new_investment()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  user_profile_id UUID;
  project_name TEXT;
  title TEXT;
  body TEXT;
BEGIN
  -- Get user profile ID
  user_profile_id := NEW.user_id;
  
  -- Get project name
  IF NEW.project_id IS NOT NULL THEN
    SELECT project_name INTO project_name
    FROM projects
    WHERE id = NEW.project_id;
  END IF;
  
  -- Prepare welcome notification
  title := 'Welcome to AgriPath!';
  body := format(
    'Thank you for your investment%s! We''re excited to have you on board.',
    CASE 
      WHEN project_name IS NOT NULL THEN format(' in %s', project_name)
      ELSE ''
    END
  );
  
  -- Send in-app notification
  PERFORM call_notification_service(
    format('/inapp/user/%s', user_profile_id),
    'POST',
    jsonb_build_object(
      'title', title,
      'body', body
    )
  );
  
  RETURN NEW;
END;
$$;

-- 5. Notify when user signs up (welcome email)
CREATE OR REPLACE FUNCTION notify_user_signup()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  user_email TEXT;
  user_name TEXT;
  subject TEXT;
  html_content TEXT;
  text_content TEXT;
BEGIN
  -- Get user details
  user_email := NEW.email;
  user_name := COALESCE(NEW.name, 'there');
  
  -- Prepare welcome email
  subject := 'Welcome to AgriPath!';
  html_content := format(
    '<h1>Welcome to AgriPath, %s!</h1>
    <p>Thank you for joining our platform. We''re excited to help you grow your wealth through agricultural investments.</p>
    <p>Get started by exploring our available projects and make your first investment today!</p>
    <a href="https://app.agripath.co/investments">Browse Projects</a>',
    user_name
  );
  text_content := format(
    'Welcome to AgriPath, %s! Thank you for joining. Get started: https://app.agripath.co/investments',
    user_name
  );
  
  -- Send welcome email
  -- Note: We need the user's profile ID, which might be created separately
  -- This is a simplified version - adjust based on your user creation flow
  IF NEW.id IS NOT NULL THEN
    PERFORM call_notification_service(
      format('/email/user/%s', NEW.id),
      'POST',
      jsonb_build_object(
        'subject', subject,
        'text', text_content,
        'html', html_content
      )
    );
  END IF;
  
  RETURN NEW;
END;
$$;

-- 6. Notify when approval request is approved
CREATE OR REPLACE FUNCTION notify_approval_approved()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  requester_id UUID;
  request_type TEXT;
  title TEXT;
  body TEXT;
BEGIN
  -- Only trigger when status changes to 'Approved'
  IF OLD.status IS DISTINCT FROM NEW.status AND NEW.status = 'Approved' THEN
    requester_id := NEW.requested_by;
    request_type := NEW.request_type;
    
    -- Prepare notification
    title := 'Request Approved';
    body := format(
      'Your %s request has been approved and is being processed.',
      request_type
    );
    
    -- Send in-app notification to requester
    IF requester_id IS NOT NULL THEN
      PERFORM call_notification_service(
        format('/inapp/user/%s', requester_id),
        'POST',
        jsonb_build_object(
          'title', title,
          'body', body
        )
      );
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

-- 7. Notify when wallet balance changes significantly
CREATE OR REPLACE FUNCTION notify_wallet_balance_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  user_profile_id UUID;
  balance_change NUMERIC;
  new_balance NUMERIC;
  title TEXT;
  body TEXT;
BEGIN
  -- Only notify on significant changes (e.g., > 100 GHS)
  balance_change := NEW.balance - OLD.balance;
  new_balance := NEW.balance;
  user_profile_id := NEW.profile_id;
  
  -- Only notify for significant increases
  IF balance_change > 100 AND user_profile_id IS NOT NULL THEN
    title := 'Wallet Credit';
    body := format(
      'Your wallet has been credited with GHS %s. New balance: GHS %s',
      balance_change::TEXT,
      new_balance::TEXT
    );
    
    -- Send in-app notification
    PERFORM call_notification_service(
      format('/inapp/user/%s', user_profile_id),
      'POST',
      jsonb_build_object(
        'title', title,
        'body', body
      )
    );
  END IF;
  
  RETURN NEW;
END;
$$;

-- ============================================================================
-- CREATE TRIGGERS
-- ============================================================================

-- Trigger: Project stage change
DROP TRIGGER IF EXISTS trigger_notify_project_stage_change ON projects;
CREATE TRIGGER trigger_notify_project_stage_change
  AFTER UPDATE OF current_stage ON projects
  FOR EACH ROW
  WHEN (OLD.current_stage IS DISTINCT FROM NEW.current_stage)
  EXECUTE FUNCTION notify_project_stage_change();

-- Trigger: Payout completed
DROP TRIGGER IF EXISTS trigger_notify_payout_completed ON payouts;
CREATE TRIGGER trigger_notify_payout_completed
  AFTER UPDATE OF status ON payouts
  FOR EACH ROW
  WHEN (OLD.status IS DISTINCT FROM NEW.status AND NEW.status = 'Completed')
  EXECUTE FUNCTION notify_payout_completed();

-- Trigger: Transaction completed
DROP TRIGGER IF EXISTS trigger_notify_transaction_completed ON transactions;
CREATE TRIGGER trigger_notify_transaction_completed
  AFTER UPDATE OF status ON transactions
  FOR EACH ROW
  WHEN (
    OLD.status IS DISTINCT FROM NEW.status 
    AND NEW.status = 'Complete' 
    AND NEW.type IN ('Payin', 'investment')
  )
  EXECUTE FUNCTION notify_transaction_completed();

-- Trigger: New investment
DROP TRIGGER IF EXISTS trigger_notify_new_investment ON investments;
CREATE TRIGGER trigger_notify_new_investment
  AFTER INSERT ON investments
  FOR EACH ROW
  EXECUTE FUNCTION notify_new_investment();

-- Trigger: Approval request approved
DROP TRIGGER IF EXISTS trigger_notify_approval_approved ON approval_requests;
CREATE TRIGGER trigger_notify_approval_approved
  AFTER UPDATE OF status ON approval_requests
  FOR EACH ROW
  WHEN (OLD.status IS DISTINCT FROM NEW.status AND NEW.status = 'Approved')
  EXECUTE FUNCTION notify_approval_approved();

-- Trigger: Wallet balance change (significant)
DROP TRIGGER IF EXISTS trigger_notify_wallet_balance_change ON wallets;
CREATE TRIGGER trigger_notify_wallet_balance_change
  AFTER UPDATE OF balance ON wallets
  FOR EACH ROW
  WHEN ((NEW.balance - OLD.balance) > 100)
  EXECUTE FUNCTION notify_wallet_balance_change();

-- ============================================================================
-- HELPER FUNCTION TO ENABLE/DISABLE TRIGGERS
-- ============================================================================

CREATE OR REPLACE FUNCTION toggle_notification_triggers(enable BOOLEAN)
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  IF enable THEN
    ALTER TABLE projects ENABLE TRIGGER trigger_notify_project_stage_change;
    ALTER TABLE payouts ENABLE TRIGGER trigger_notify_payout_completed;
    ALTER TABLE transactions ENABLE TRIGGER trigger_notify_transaction_completed;
    ALTER TABLE investments ENABLE TRIGGER trigger_notify_new_investment;
    ALTER TABLE approval_requests ENABLE TRIGGER trigger_notify_approval_approved;
    ALTER TABLE wallets ENABLE TRIGGER trigger_notify_wallet_balance_change;
  ELSE
    ALTER TABLE projects DISABLE TRIGGER trigger_notify_project_stage_change;
    ALTER TABLE payouts DISABLE TRIGGER trigger_notify_payout_completed;
    ALTER TABLE transactions DISABLE TRIGGER trigger_notify_transaction_completed;
    ALTER TABLE investments DISABLE TRIGGER trigger_notify_new_investment;
    ALTER TABLE approval_requests DISABLE TRIGGER trigger_notify_approval_approved;
    ALTER TABLE wallets DISABLE TRIGGER trigger_notify_wallet_balance_change;
  END IF;
END;
$$;

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON FUNCTION notify_project_stage_change() IS 
  'Automatically sends email notifications to all project investors when project stage changes';

COMMENT ON FUNCTION notify_payout_completed() IS 
  'Automatically sends multi-channel notifications when a payout is completed';

COMMENT ON FUNCTION notify_transaction_completed() IS 
  'Automatically sends in-app notifications when an investment transaction is completed';

COMMENT ON FUNCTION notify_new_investment() IS 
  'Automatically sends welcome notification when a new investment is created';

COMMENT ON FUNCTION notify_approval_approved() IS 
  'Automatically sends notification when an approval request is approved';

COMMENT ON FUNCTION notify_wallet_balance_change() IS 
  'Automatically sends notification when wallet balance increases significantly (>100 GHS)';

COMMENT ON FUNCTION toggle_notification_triggers(BOOLEAN) IS 
  'Enable or disable all notification triggers at once';



