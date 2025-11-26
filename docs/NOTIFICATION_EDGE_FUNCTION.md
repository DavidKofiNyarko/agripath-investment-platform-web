# Notification Edge Function

## Overview

The notification edge function is deployed in Supabase and acts as a proxy between your frontend/back office and the notification service API (`https://buzz.agripath.co`). It handles all notification operations and automatically stores records in Supabase.

## Location

- **Preview Branch (develop-v2):** `https://xiupdgdgsnkxkcpkftad.supabase.co/functions/v1/notifications`
- **Production:** Will be deployed to main branch when ready

## Authentication

All requests require a Supabase JWT token in the Authorization header:

```bash
Authorization: Bearer <supabase_jwt_token>
```

For service-to-service calls, use the service role key.

## Available Endpoints

### 1. Health Check

```bash
GET /functions/v1/notifications/health
```

### 2. Send Email to All Users (Bulk)

```bash
POST /functions/v1/notifications/email/bulk/all
Content-Type: application/json

{
  "subject": "Important Update",
  "text": "Plain text content",
  "html": "<p>HTML content</p>"
}
```

### 3. Send Email to Specific User

```bash
POST /functions/v1/notifications/email/user/{userId}
Content-Type: application/json

{
  "subject": "Personal Message",
  "text": "Plain text content",
  "html": "<p>HTML content</p>"
}
```

### 4. Send Email to Project Investors

```bash
POST /functions/v1/notifications/email/project/{projectId}
Content-Type: application/json

{
  "subject": "Project Update",
  "text": "Plain text content",
  "html": "<p>HTML content</p>"
}
```

### 5. Send SMS to Specific User

```bash
POST /functions/v1/notifications/sms/user/{userId}
Content-Type: application/json

{
  "message": "Your SMS content here"
}
```

### 6. Send In-App Notification

```bash
POST /functions/v1/notifications/inapp/user/{userId}
Content-Type: application/json

{
  "title": "Notification Title",
  "body": "Notification content"
}
```

### 7. Send Push Notification

```bash
POST /functions/v1/notifications/push/user/{userId}
Content-Type: application/json

{
  "title": "Push Title",
  "body": "Push content"
}
```

### 8. Send All Notification Types

```bash
POST /functions/v1/notifications/all/user/{userId}
Content-Type: application/json

{
  "title": "Multi-channel Message",
  "body": "Content for all channels"
}
```

### 9. Get User Notification Status

```bash
GET /functions/v1/notifications/status/{userId}
```

### 10. Get Notification Analytics

```bash
GET /functions/v1/notifications/analytics?startDate=2025-11-01T00:00:00.000Z&endDate=2025-11-23T12:15:17.841Z
```

### 11. Mark Notification as Read

```bash
POST /functions/v1/notifications/{notificationId}/read
Content-Type: application/json

{
  "userId": "user-uuid"
}
```

### 12. Track Notification Click

```bash
GET /functions/v1/notifications/{notificationId}/click?userId={userId}&redirect=https://app.agripath.co
```

### 13. Twilio SMS Status Webhook

```bash
POST /functions/v1/notifications/webhook/twilio
Content-Type: application/json

{
  "MessageSid": "twilio-message-sid",
  "MessageStatus": "delivered"
}
```

## Usage from Frontend/Back Office

### Example: Send In-App Notification

```typescript
const supabase = createClient();
const {
  data: { session },
} = await supabase.auth.getSession();

const response = await fetch(
  `${SUPABASE_URL}/functions/v1/notifications/inapp/user/${userId}`,
  {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${session?.access_token}`,
      apikey: SUPABASE_ANON_KEY,
    },
    body: JSON.stringify({
      title: "New Investment Opportunity",
      body: "Check out our latest project!",
    }),
  }
);

const result = await response.json();
```

### Example: Get User Notification Status

```typescript
const response = await fetch(
  `${SUPABASE_URL}/functions/v1/notifications/status/${userId}`,
  {
    headers: {
      Authorization: `Bearer ${session?.access_token}`,
      apikey: SUPABASE_ANON_KEY,
    },
  }
);

const status = await response.json();
// Returns: { total, read, clicked, delivered, notifications: [...] }
```

## What Gets Stored in Supabase

The edge function automatically stores notification records in:

1. **`notifications` table** - Master notification records

   - `title`, `body`, `type`, `status`, `category`, `created_by`, `published_at`

2. **`users_notifications` table** - User-specific notification tracking
   - `user_id`, `notifications_id`, `read_at`, `clicked_at`, `sms_delivery_status`, `sms_delivery_id`

## Benefits

1. **Centralized Access** - Both frontend and back office use the same endpoint
2. **Automatic Storage** - All notifications are automatically stored in Supabase
3. **Analytics Ready** - Notification data is available for analytics queries
4. **Consistent API** - Same interface for all notification types
5. **Security** - Uses Supabase authentication and RLS policies

## Testing

Test the edge function using curl:

```bash
# Health check (requires auth)
curl -X GET "https://xiupdgdgsnkxkcpkftad.supabase.co/functions/v1/notifications/health" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "apikey: YOUR_ANON_KEY"
```

## Environment Variables

The edge function uses:

- `NOTIFICATION_SERVICE_URL` - Defaults to `https://buzz.agripath.co` if not set
- `SUPABASE_URL` - Automatically provided by Supabase
- `SUPABASE_SERVICE_ROLE_KEY` - Automatically provided by Supabase

## Notes

- All endpoints respect user notification preferences (handled by the notification service)
- UUID validation is performed on all ID parameters
- Bulk operations process in batches of 100 for performance
- SMS delivery status is tracked via Twilio webhooks
- All notifications are logged in the database for analytics
