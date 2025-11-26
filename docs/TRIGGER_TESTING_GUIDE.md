# Notification Trigger Testing Guide

## Quick Test Commands

### Test 1: Direct Notification Service Call

```sql
-- Test the helper function directly
DO $$
DECLARE
  test_user_id UUID := 'YOUR_USER_ID_HERE';
BEGIN
  PERFORM call_notification_service(
    format('/inapp/user/%s', test_user_id),
    'POST',
    jsonb_build_object(
      'title', 'Test Notification',
      'body', 'This is a test!'
    )
  );
END $$;
```

### Test 2: Project Stage Change

```sql
-- Update a project stage to trigger notification
UPDATE projects 
SET project_stages = 'PLANTING'
WHERE id = 'YOUR_PROJECT_ID';

-- Check if notification was sent
SELECT * FROM notifications 
WHERE created_at > NOW() - INTERVAL '1 minute';
```

### Test 3: Transaction Completion

```sql
-- Create and complete a transaction
INSERT INTO transactions (
  profile_id, project_id, type, amount, status, transaction_id
) VALUES (
  'USER_ID', 'PROJECT_ID', 'Payin', 1000.00, 'Pending', 'TEST-' || gen_random_uuid()::TEXT
);

-- Update to Complete (triggers notification)
UPDATE transactions 
SET status = 'Complete'
WHERE transaction_id LIKE 'TEST-%';
```

### Test 4: Payout Completion

```sql
-- Create and complete a payout
INSERT INTO payouts (
  profile_id, project_id, amount, status, payout_type, payout_id
) VALUES (
  'USER_ID', 'PROJECT_ID', 500.00, 'Pending', 'Returns', 'PAYOUT-TEST-' || gen_random_uuid()::TEXT
);

-- Update to Complete (triggers notification)
UPDATE payouts 
SET status = 'Complete'
WHERE payout_id LIKE 'PAYOUT-TEST-%';
```

## Verification Queries

### Check Notifications Created

```sql
SELECT 
  id,
  title,
  body,
  type,
  status,
  created_at
FROM notifications
ORDER BY created_at DESC
LIMIT 10;
```

### Check User Notifications

```sql
SELECT 
  id,
  user_id,
  title,
  body,
  type,
  status,
  read_at,
  created_at
FROM users_notifications
ORDER BY created_at DESC
LIMIT 10;
```

### Check HTTP Requests

```sql
SELECT 
  id,
  url,
  method,
  status,
  error_msg,
  created_at
FROM net.http_request_queue
ORDER BY created_at DESC
LIMIT 10;
```

### Check Trigger Status

```sql
SELECT 
  t.tgname as trigger_name,
  c.relname as table_name,
  CASE t.tgenabled
    WHEN 'O' THEN 'Enabled'
    WHEN 'D' THEN 'Disabled'
    ELSE 'Unknown'
  END as status
FROM pg_trigger t
JOIN pg_class c ON t.tgrelid = c.oid
WHERE t.tgname LIKE 'trigger_notify%'
ORDER BY c.relname;
```

## Troubleshooting

### Triggers Not Firing

1. **Check if triggers are enabled:**
   ```sql
   SELECT toggle_notification_triggers(true);
   ```

2. **Check trigger function errors:**
   ```sql
   -- Enable detailed logging
   SET client_min_messages TO 'notice';
   ```

3. **Test the helper function:**
   ```sql
   SELECT get_notification_service_url();
   ```

### HTTP Requests Failing

1. **Check pg_net extension:**
   ```sql
   SELECT * FROM pg_extension WHERE extname = 'pg_net';
   ```

2. **Check request queue for errors:**
   ```sql
   SELECT * FROM net.http_request_queue 
   WHERE error_msg IS NOT NULL
   ORDER BY created_at DESC;
   ```

3. **Verify edge function URL:**
   ```sql
   SELECT * FROM notification_settings WHERE key = 'edge_function_url';
   ```

## Production Checklist

- [ ] Update edge function URL to production
- [ ] Set service role key via Supabase secrets
- [ ] Test all triggers with real data
- [ ] Monitor HTTP request queue
- [ ] Set up alerts for failed notifications
- [ ] Document any customizations



