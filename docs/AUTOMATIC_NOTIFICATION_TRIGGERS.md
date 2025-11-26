# Automatic Notification Triggers Guide

## Overview

Database triggers automatically send notifications when specific events occur in your database. This eliminates the need for manual back office intervention - notifications are sent automatically based on database changes.

## How It Works

1. **Database Event Occurs** (e.g., project stage changes, payout completes)
2. **Trigger Fires** (PostgreSQL trigger detects the change)
3. **Notification Function Called** (Uses `pg_net` to call the edge function)
4. **Notification Sent** (Email, SMS, In-App, or Push notification delivered)

## Available Triggers

### 1. Project Stage Change Notification

**Trigger:** `trigger_notify_project_stage_change`  
**Table:** `projects`  
**Event:** When `current_stage` column is updated

**What it does:**
- Automatically sends email to all project investors
- Includes project name, old stage, and new stage
- Provides link to view project details

**Example:**
```sql
-- When you update a project stage:
UPDATE projects 
SET current_stage = 'HARVESTING' 
WHERE id = 'project-uuid';

-- All investors automatically receive an email notification!
```

---

### 2. Payout Completed Notification

**Trigger:** `trigger_notify_payout_completed`  
**Table:** `payouts`  
**Event:** When `status` changes to `'Completed'`

**What it does:**
- Sends multi-channel notification (Email, SMS, In-App, Push)
- Includes payout amount, type, and currency
- Notifies user that funds are in their wallet

**Example:**
```sql
-- When payout is completed:
UPDATE payouts 
SET status = 'Completed' 
WHERE id = 'payout-uuid';

-- User automatically receives notification on all channels!
```

---

### 3. Transaction Completed Notification

**Trigger:** `trigger_notify_transaction_completed`  
**Table:** `transactions`  
**Event:** When transaction `status` changes to `'Complete'` for investment types

**What it does:**
- Sends in-app notification when investment is successful
- Includes investment amount and project name
- Confirms transaction completion

**Example:**
```sql
-- When investment transaction completes:
UPDATE transactions 
SET status = 'Complete' 
WHERE id = 'transaction-uuid' AND type = 'Payin';

-- Investor automatically receives success notification!
```

---

### 4. New Investment Welcome Notification

**Trigger:** `trigger_notify_new_investment`  
**Table:** `investments`  
**Event:** When a new investment is inserted

**What it does:**
- Sends welcome in-app notification
- Thanks user for their investment
- Includes project name if available

**Example:**
```sql
-- When new investment is created:
INSERT INTO investments (user_id, project_id, amount, status)
VALUES ('user-uuid', 'project-uuid', 1000, 'Complete');

-- User automatically receives welcome notification!
```

---

### 5. Approval Request Approved Notification

**Trigger:** `trigger_notify_approval_approved`  
**Table:** `approval_requests`  
**Event:** When `status` changes to `'Approved'`

**What it does:**
- Sends in-app notification to requester
- Confirms that their request has been approved
- Includes request type information

**Example:**
```sql
-- When approval request is approved:
UPDATE approval_requests 
SET status = 'Approved', reviewed_by = 'admin-uuid'
WHERE id = 'request-uuid';

-- Requester automatically receives approval notification!
```

---

### 6. Wallet Balance Change Notification

**Trigger:** `trigger_notify_wallet_balance_change`  
**Table:** `wallets`  
**Event:** When `balance` increases by more than 100 GHS

**What it does:**
- Sends in-app notification for significant balance increases
- Shows credit amount and new balance
- Only triggers for increases > 100 GHS (configurable)

**Example:**
```sql
-- When wallet balance increases significantly:
UPDATE wallets 
SET balance = balance + 500 
WHERE profile_id = 'user-uuid';

-- User automatically receives wallet credit notification!
```

---

## Configuration

### Setting the Edge Function URL

The triggers use a settings table to determine which edge function to call:

```sql
-- Update for preview/development
UPDATE notification_settings 
SET value = 'https://xiupdgdgsnkxkcpkftad.supabase.co/functions/v1/notifications'
WHERE key = 'edge_function_url';

-- Update for production
UPDATE notification_settings 
SET value = 'https://gbeqqboxlflpgehyqlld.supabase.co/functions/v1/notifications'
WHERE key = 'edge_function_url';
```

### Setting Service Role Key

For the triggers to authenticate with the edge function, you need to set the service role key:

```sql
-- Set via Supabase secrets (recommended)
-- Or set as a database setting:
ALTER DATABASE postgres SET app.settings.service_role_key = 'your-service-role-key';
```

**Note:** In production, use Supabase's secrets management feature for security.

---

## Managing Triggers

### Enable/Disable All Triggers

```sql
-- Disable all notification triggers
SELECT toggle_notification_triggers(false);

-- Enable all notification triggers
SELECT toggle_notification_triggers(true);
```

### Enable/Disable Individual Triggers

```sql
-- Disable specific trigger
ALTER TABLE projects DISABLE TRIGGER trigger_notify_project_stage_change;

-- Enable specific trigger
ALTER TABLE projects ENABLE TRIGGER trigger_notify_project_stage_change;
```

### Check Trigger Status

```sql
-- List all notification triggers and their status
SELECT 
  schemaname,
  tablename,
  triggername,
  tgenabled
FROM pg_trigger t
JOIN pg_class c ON t.tgrelid = c.oid
WHERE triggername LIKE 'trigger_notify%'
ORDER BY tablename, triggername;
```

---

## Customization

### Modify Notification Content

Edit the trigger functions to customize notification messages:

```sql
-- Example: Customize project stage notification
CREATE OR REPLACE FUNCTION notify_project_stage_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  -- Your custom variables
BEGIN
  -- Your custom notification logic
  -- ...
END;
$$;
```

### Add New Triggers

Create new trigger functions for additional events:

```sql
-- Example: Notify when support ticket is created
CREATE OR REPLACE FUNCTION notify_support_ticket_created()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  PERFORM call_notification_service(
    format('/inapp/user/%s', NEW.user_id),
    'POST',
    jsonb_build_object(
      'title', 'Support Ticket Created',
      'body', format('Your support ticket #%s has been created.', NEW.id)
    )
  );
  RETURN NEW;
END;
$$;

-- Create the trigger
CREATE TRIGGER trigger_notify_support_ticket_created
  AFTER INSERT ON support_tickets
  FOR EACH ROW
  EXECUTE FUNCTION notify_support_ticket_created();
```

---

## Testing

### Test Individual Triggers

```sql
-- Test project stage change
UPDATE projects 
SET current_stage = 'PLANTING' 
WHERE id = 'your-project-uuid';

-- Check if notification was sent (check users_notifications table)
SELECT * FROM users_notifications 
WHERE created_at > NOW() - INTERVAL '1 minute'
ORDER BY created_at DESC;
```

### Test Notification Service Call

```sql
-- Test the helper function directly
SELECT call_notification_service(
  '/inapp/user/your-user-uuid',
  'POST',
  jsonb_build_object(
    'title', 'Test Notification',
    'body', 'This is a test notification from the database trigger'
  )
);
```

---

## Monitoring

### Check Recent Notifications

```sql
-- View notifications sent in the last hour
SELECT 
  n.title,
  n.body,
  n.type,
  n.created_at,
  un.user_id,
  un.read_at
FROM notifications n
JOIN users_notifications un ON n.id = un.notifications_id
WHERE n.created_at > NOW() - INTERVAL '1 hour'
ORDER BY n.created_at DESC;
```

### Check Trigger Execution Logs

```sql
-- View pg_net request queue (if enabled)
SELECT * FROM net.http_request_queue
ORDER BY created_at DESC
LIMIT 20;
```

---

## Troubleshooting

### Triggers Not Firing

1. **Check if triggers are enabled:**
   ```sql
   SELECT toggle_notification_triggers(true);
   ```

2. **Check trigger function errors:**
   ```sql
   -- Enable detailed error logging
   SET client_min_messages TO 'warning';
   ```

3. **Test the notification service URL:**
   ```sql
   SELECT get_notification_service_url();
   ```

### Notifications Not Being Sent

1. **Check service role key:**
   - Ensure it's set correctly
   - Verify it has proper permissions

2. **Check edge function status:**
   - Verify edge function is deployed
   - Test health endpoint manually

3. **Check pg_net extension:**
   ```sql
   SELECT * FROM pg_extension WHERE extname = 'pg_net';
   ```

### Performance Considerations

- Triggers run synchronously and can slow down database operations
- For high-volume operations, consider:
  - Using `pgmq` for async processing
  - Batching notifications
  - Disabling triggers during bulk operations

---

## Best Practices

1. **Test in Preview First**
   - Always test triggers in the preview branch before production

2. **Monitor Performance**
   - Watch for slow queries caused by triggers
   - Use `EXPLAIN ANALYZE` to check trigger impact

3. **Error Handling**
   - Triggers use `EXCEPTION` blocks to prevent transaction failures
   - Errors are logged as warnings

4. **Disable During Migrations**
   - Disable triggers during bulk data migrations
   - Re-enable after migration completes

5. **Use Appropriate Notification Types**
   - Use Email for important updates
   - Use In-App for informational messages
   - Use Multi-channel for critical notifications

---

## Summary

With automatic notification triggers:

✅ **No Back Office Intervention Needed** - Notifications send automatically  
✅ **Real-time Updates** - Users notified immediately when events occur  
✅ **Consistent Messaging** - Standardized notification content  
✅ **Easy to Manage** - Enable/disable triggers as needed  
✅ **Fully Customizable** - Modify trigger functions for your needs  

The triggers handle all the complexity, so you can focus on your business logic!



