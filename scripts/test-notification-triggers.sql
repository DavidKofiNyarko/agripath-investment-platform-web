-- Test Script for Notification Triggers
-- Run this to test the automatic notification triggers

-- ============================================================================
-- TEST 1: Test the notification service call function directly
-- ============================================================================

-- First, let's test if the helper function works
DO $$
DECLARE
  test_user_id UUID;
BEGIN
  -- Get a test user profile ID (or create one for testing)
  SELECT id INTO test_user_id FROM profile LIMIT 1;
  
  IF test_user_id IS NULL THEN
    RAISE NOTICE 'No users found. Creating test user...';
    -- You would create a test user here if needed
  ELSE
    RAISE NOTICE 'Testing notification service with user: %', test_user_id;
    
    -- Test calling the notification service
    PERFORM call_notification_service(
      format('/inapp/user/%s', test_user_id),
      'POST',
      jsonb_build_object(
        'title', 'Test Notification from Trigger',
        'body', 'This is a test notification sent from a database trigger!'
      )
    );
    
    RAISE NOTICE '✅ Test notification sent!';
  END IF;
END $$;

-- ============================================================================
-- TEST 2: Test Project Stage Change Trigger
-- ============================================================================

-- Create or update a test project
DO $$
DECLARE
  test_project_id UUID;
BEGIN
  -- Get existing project or create one
  SELECT id INTO test_project_id FROM projects LIMIT 1;
  
  IF test_project_id IS NULL THEN
    -- Create a test project
    INSERT INTO projects (
      project_name,
      project_type,
      total_units,
      unit_price,
      expected_return_rate,
      project_stages
    ) VALUES (
      'Test Project for Notifications',
      'CROP',
      1000,
      100.00,
      15.00,
      'LAND_PREPARATION'
    ) RETURNING id INTO test_project_id;
    
    RAISE NOTICE 'Created test project: %', test_project_id;
  ELSE
    RAISE NOTICE 'Using existing project: %', test_project_id;
  END IF;
  
  -- Update project stage to trigger notification
  UPDATE projects 
  SET project_stages = 'PLANTING'
  WHERE id = test_project_id;
  
  RAISE NOTICE '✅ Project stage updated - trigger should fire!';
END $$;

-- ============================================================================
-- TEST 3: Test Transaction Completion Trigger
-- ============================================================================

DO $$
DECLARE
  test_profile_id UUID;
  test_project_id UUID;
  test_transaction_id UUID;
BEGIN
  -- Get test profile
  SELECT id INTO test_profile_id FROM profile LIMIT 1;
  
  -- Get test project
  SELECT id INTO test_project_id FROM projects LIMIT 1;
  
  IF test_profile_id IS NOT NULL AND test_project_id IS NOT NULL THEN
    -- Create a test transaction
    INSERT INTO transactions (
      profile_id,
      project_id,
      type,
      amount,
      status,
      transaction_id
    ) VALUES (
      test_profile_id,
      test_project_id,
      'Payin',
      1000.00,
      'Pending',
      'TEST-' || gen_random_uuid()::TEXT
    ) RETURNING id INTO test_transaction_id;
    
    RAISE NOTICE 'Created test transaction: %', test_transaction_id;
    
    -- Update transaction status to Complete to trigger notification
    UPDATE transactions 
    SET status = 'Complete'
    WHERE id = test_transaction_id;
    
    RAISE NOTICE '✅ Transaction status updated - trigger should fire!';
  ELSE
    RAISE NOTICE '⚠️  Missing test data (profile or project)';
  END IF;
END $$;

-- ============================================================================
-- TEST 4: Test Payout Completion Trigger
-- ============================================================================

DO $$
DECLARE
  test_profile_id UUID;
  test_project_id UUID;
  test_payout_id UUID;
BEGIN
  -- Get test profile
  SELECT id INTO test_profile_id FROM profile LIMIT 1;
  
  -- Get test project
  SELECT id INTO test_project_id FROM projects LIMIT 1;
  
  IF test_profile_id IS NOT NULL AND test_project_id IS NOT NULL THEN
    -- Create a test payout
    INSERT INTO payouts (
      profile_id,
      project_id,
      amount,
      status,
      payout_type,
      payout_id
    ) VALUES (
      test_profile_id,
      test_project_id,
      500.00,
      'Pending',
      'Returns',
      'PAYOUT-TEST-' || gen_random_uuid()::TEXT
    ) RETURNING id INTO test_payout_id;
    
    RAISE NOTICE 'Created test payout: %', test_payout_id;
    
    -- Update payout status to Complete to trigger notification
    UPDATE payouts 
    SET status = 'Complete'
    WHERE id = test_payout_id;
    
    RAISE NOTICE '✅ Payout status updated - trigger should fire!';
  ELSE
    RAISE NOTICE '⚠️  Missing test data (profile or project)';
  END IF;
END $$;

-- ============================================================================
-- CHECK RESULTS
-- ============================================================================

-- Check if notifications were created
SELECT 
  'Notifications Created' as check_type,
  COUNT(*) as count,
  MAX(created_at) as latest
FROM notifications
WHERE created_at > NOW() - INTERVAL '5 minutes';

-- Check user notifications
SELECT 
  'User Notifications Created' as check_type,
  COUNT(*) as count,
  MAX(created_at) as latest
FROM users_notifications
WHERE created_at > NOW() - INTERVAL '5 minutes';

-- Check pg_net request queue (if available)
SELECT 
  'HTTP Requests Sent' as check_type,
  COUNT(*) as count,
  MAX(created_at) as latest
FROM net.http_request_queue
WHERE created_at > NOW() - INTERVAL '5 minutes';



