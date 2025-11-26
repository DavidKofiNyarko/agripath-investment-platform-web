# Back Office Notification Service Guide

## Overview

This guide provides complete instructions for using the AgriPath Notification Service via the Supabase Edge Function from the back office. The edge function acts as a proxy to the notification service API (`https://buzz.agripath.co`) and automatically stores all notification records in Supabase.

## Table of Contents

1. [Setup & Authentication](#setup--authentication)
2. [Base Configuration](#base-configuration)
3. [Sending Notifications](#sending-notifications)
4. [Querying Notification Data](#querying-notification-data)
5. [Tracking & Analytics](#tracking--analytics)
6. [Error Handling](#error-handling)
7. [Best Practices](#best-practices)
8. [Complete Examples](#complete-examples)

---

## Setup & Authentication

### Prerequisites

- Supabase project credentials (URL and service role key)
- Access to the back office application
- User IDs and Project IDs for targeting notifications

### Base URL

**Preview/Development:**
```
https://xiupdgdgsnkxkcpkftad.supabase.co/functions/v1/notifications
```

**Production (when deployed):**
```
https://gbeqqboxlflpgehyqlld.supabase.co/functions/v1/notifications
```

### Authentication

All requests require Supabase authentication. Use the service role key for back office operations:

```typescript
const SUPABASE_URL = process.env.SUPABASE_URL!;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// For authenticated requests
const headers = {
  "Content-Type": "application/json",
  "Authorization": `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
  "apikey": SUPABASE_SERVICE_ROLE_KEY,
};
```

---

## Base Configuration

### TypeScript/JavaScript Helper Function

```typescript
// lib/notificationService.ts

const NOTIFICATION_SERVICE_BASE_URL = 
  process.env.NODE_ENV === 'production'
    ? 'https://gbeqqboxlflpgehyqlld.supabase.co/functions/v1/notifications'
    : 'https://xiupdgdgsnkxkcpkftad.supabase.co/functions/v1/notifications';

const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

interface NotificationResponse {
  sent?: number | boolean;
  emailId?: string;
  sid?: string;
  type?: string;
  results?: Array<{
    type: string;
    status: string;
    sid?: string;
  }>;
  success?: boolean;
  updated?: number;
  redirectUrl?: string;
  error?: string;
}

async function callNotificationService(
  endpoint: string,
  method: 'GET' | 'POST' = 'GET',
  body?: any
): Promise<NotificationResponse> {
  const url = `${NOTIFICATION_SERVICE_BASE_URL}${endpoint}`;
  
  const response = await fetch(url, {
    method,
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
      "apikey": SUPABASE_SERVICE_ROLE_KEY,
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || `HTTP ${response.status}: ${response.statusText}`);
  }

  return await response.json();
}
```

---

## Sending Notifications

### 1. Send Email to All Users (Bulk)

Send an email notification to all users who have opted in for email notifications.

```typescript
async function sendBulkEmail(
  subject: string,
  textContent: string,
  htmlContent: string
) {
  try {
    const result = await callNotificationService(
      '/email/bulk/all',
      'POST',
      {
        subject,
        text: textContent,
        html: htmlContent,
      }
    );

    console.log(`✅ Sent to ${result.sent} users`);
    return result;
  } catch (error) {
    console.error('❌ Failed to send bulk email:', error);
    throw error;
  }
}

// Example Usage
await sendBulkEmail(
  'Important Platform Update',
  'We have exciting news about new features!',
  '<h1>Important Platform Update</h1><p>We have exciting news about new features!</p>'
);
```

**Response:**
```json
{
  "sent": 150
}
```

---

### 2. Send Email to Specific User

Send an email to a single user by their user ID.

```typescript
async function sendEmailToUser(
  userId: string,
  subject: string,
  textContent: string,
  htmlContent: string
) {
  try {
    const result = await callNotificationService(
      `/email/user/${userId}`,
      'POST',
      {
        subject,
        text: textContent,
        html: htmlContent,
      }
    );

    console.log(`✅ Email sent to user ${userId}`);
    return result;
  } catch (error) {
    console.error(`❌ Failed to send email to user ${userId}:`, error);
    throw error;
  }
}

// Example Usage
await sendEmailToUser(
  '123e4567-e89b-12d3-a456-426614174000',
  'Your Investment Update',
  'Your investment has been processed successfully.',
  '<h2>Investment Update</h2><p>Your investment has been processed successfully.</p>'
);
```

**Response:**
```json
{
  "sent": 1,
  "emailId": "resend-email-id-12345"
}
```

---

### 3. Send Email to Project Investors

Send an email to all users who have invested in a specific project.

```typescript
async function sendEmailToProjectInvestors(
  projectId: string,
  subject: string,
  textContent: string,
  htmlContent: string
) {
  try {
    const result = await callNotificationService(
      `/email/project/${projectId}`,
      'POST',
      {
        subject,
        text: textContent,
        html: htmlContent,
      }
    );

    console.log(`✅ Sent to ${result.sent} project investors`);
    return result;
  } catch (error) {
    console.error(`❌ Failed to send email to project ${projectId}:`, error);
    throw error;
  }
}

// Example Usage
await sendEmailToProjectInvestors(
  'project-uuid-123',
  'Project Stage Update',
  'Your project has moved to the next stage.',
  '<h2>Project Stage Update</h2><p>Your project has moved to the next stage.</p>'
);
```

**Response:**
```json
{
  "sent": 25
}
```

---

### 4. Send SMS to Specific User

Send an SMS notification to a specific user.

```typescript
async function sendSMSToUser(
  userId: string,
  message: string
) {
  try {
    const result = await callNotificationService(
      `/sms/user/${userId}`,
      'POST',
      {
        message,
      }
    );

    console.log(`✅ SMS sent to user ${userId}`);
    return result;
  } catch (error) {
    console.error(`❌ Failed to send SMS to user ${userId}:`, error);
    throw error;
  }
}

// Example Usage
await sendSMSToUser(
  '123e4567-e89b-12d3-a456-426614174000',
  'Your payout of GHS 1,000 has been processed. Check your wallet.'
);
```

**Response:**
```json
{
  "sent": true,
  "sid": "twilio-message-sid-12345"
}
```

---

### 5. Send In-App Notification

Send an in-app notification that appears in the user's notification center.

```typescript
async function sendInAppNotification(
  userId: string,
  title: string,
  body: string
) {
  try {
    const result = await callNotificationService(
      `/inapp/user/${userId}`,
      'POST',
      {
        title,
        body,
      }
    );

    console.log(`✅ In-app notification sent to user ${userId}`);
    return result;
  } catch (error) {
    console.error(`❌ Failed to send in-app notification:`, error);
    throw error;
  }
}

// Example Usage
await sendInAppNotification(
  '123e4567-e89b-12d3-a456-426614174000',
  'New Investment Opportunity',
  'Check out our latest project with 15% ROI!'
);
```

**Response:**
```json
{
  "sent": true,
  "type": "InApp"
}
```

---

### 6. Send Push Notification

Send a push notification to a user's device (mobile app).

```typescript
async function sendPushNotification(
  userId: string,
  title: string,
  body: string
) {
  try {
    const result = await callNotificationService(
      `/push/user/${userId}`,
      'POST',
      {
        title,
        body,
      }
    );

    console.log(`✅ Push notification sent to user ${userId}`);
    return result;
  } catch (error) {
    console.error(`❌ Failed to send push notification:`, error);
    throw error;
  }
}

// Example Usage
await sendPushNotification(
  '123e4567-e89b-12d3-a456-426614174000',
  'Payment Received',
  'You have received GHS 500 in your wallet'
);
```

**Response:**
```json
{
  "sent": true,
  "type": "Push"
}
```

---

### 7. Send All Notification Types

Send notifications across all channels (Email, SMS, In-App, Push) based on user preferences.

```typescript
async function sendMultiChannelNotification(
  userId: string,
  title: string,
  body: string
) {
  try {
    const result = await callNotificationService(
      `/all/user/${userId}`,
      'POST',
      {
        title,
        body,
      }
    );

    console.log(`✅ Multi-channel notification sent to ${result.sent} channels`);
    return result;
  } catch (error) {
    console.error(`❌ Failed to send multi-channel notification:`, error);
    throw error;
  }
}

// Example Usage
await sendMultiChannelNotification(
  '123e4567-e89b-12d3-a456-426614174000',
  'Important Security Alert',
  'Your account password was changed. If this was not you, please contact support immediately.'
);
```

**Response:**
```json
{
  "sent": 3,
  "results": [
    {
      "type": "Email",
      "status": "sent"
    },
    {
      "type": "SMS",
      "status": "sent",
      "sid": "twilio-sid-123"
    },
    {
      "type": "InApp",
      "status": "sent"
    }
  ]
}
```

---

## Querying Notification Data

### 8. Get User Notification Status

Retrieve notification statistics and history for a specific user.

```typescript
interface UserNotificationStatus {
  total: number;
  read: number;
  clicked: number;
  delivered: number;
  notifications: Array<{
    id: string;
    notifications_id: string;
    user_id: string;
    title: string;
    body: string;
    type: string;
    status: string;
    read_at: string | null;
    clicked_at: string | null;
    sms_delivery_status: string | null;
    created_at: string;
  }>;
}

async function getUserNotificationStatus(
  userId: string
): Promise<UserNotificationStatus> {
  try {
    const result = await callNotificationService(
      `/status/${userId}`,
      'GET'
    );

    return result as UserNotificationStatus;
  } catch (error) {
    console.error(`❌ Failed to get notification status:`, error);
    throw error;
  }
}

// Example Usage
const status = await getUserNotificationStatus('123e4567-e89b-12d3-a456-426614174000');
console.log(`Total: ${status.total}, Read: ${status.read}, Clicked: ${status.clicked}`);
```

**Response:**
```json
{
  "total": 10,
  "read": 7,
  "clicked": 3,
  "delivered": 8,
  "notifications": [
    {
      "id": "notification-uuid",
      "notifications_id": "notification-uuid",
      "user_id": "user-uuid",
      "title": "Notification Title",
      "body": "Content",
      "type": "Email",
      "status": "Published",
      "read_at": "2025-11-23T10:00:00.000Z",
      "clicked_at": null,
      "sms_delivery_status": null,
      "created_at": "2025-11-23T09:00:00.000Z"
    }
  ]
}
```

---

### 9. Get Notification Analytics

Get comprehensive analytics for notifications within a date range.

```typescript
interface NotificationAnalytics {
  period: {
    start: string;
    end: string;
  };
  totals: {
    total: number;
    read: number;
    clicked: number;
    smsDelivered: number;
    smsTotal: number;
  };
  rates: {
    readRate: number;
    clickRate: number;
    smsDeliveryRate: number;
  };
  breakdown: {
    SMS: number;
    Email: number;
    InApp: number;
    Push: number;
  };
}

async function getNotificationAnalytics(
  startDate?: string,
  endDate?: string
): Promise<NotificationAnalytics> {
  try {
    const params = new URLSearchParams();
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);

    const endpoint = `/analytics${params.toString() ? `?${params.toString()}` : ''}`;
    const result = await callNotificationService(endpoint, 'GET');

    return result as NotificationAnalytics;
  } catch (error) {
    console.error('❌ Failed to get analytics:', error);
    throw error;
  }
}

// Example Usage - Last 30 days (default)
const analytics = await getNotificationAnalytics();

// Example Usage - Custom date range
const customAnalytics = await getNotificationAnalytics(
  '2025-11-01T00:00:00.000Z',
  '2025-11-30T23:59:59.999Z'
);

console.log(`Read Rate: ${analytics.rates.readRate}%`);
console.log(`Click Rate: ${analytics.rates.clickRate}%`);
console.log(`SMS Delivery Rate: ${analytics.rates.smsDeliveryRate}%`);
```

**Response:**
```json
{
  "period": {
    "start": "2025-11-01T00:00:00.000Z",
    "end": "2025-11-23T12:15:17.841Z"
  },
  "totals": {
    "total": 150,
    "read": 120,
    "clicked": 45,
    "smsDelivered": 95,
    "smsTotal": 100
  },
  "rates": {
    "readRate": 80,
    "clickRate": 30,
    "smsDeliveryRate": 95
  },
  "breakdown": {
    "SMS": 50,
    "Email": 80,
    "InApp": 20,
    "Push": 0
  }
}
```

---

## Tracking & Analytics

### 10. Mark Notification as Read

Manually mark a notification as read for a user (usually handled automatically by frontend).

```typescript
async function markNotificationAsRead(
  notificationId: string,
  userId: string
) {
  try {
    const result = await callNotificationService(
      `/${notificationId}/read`,
      'POST',
      {
        userId,
      }
    );

    console.log(`✅ Notification marked as read`);
    return result;
  } catch (error) {
    console.error('❌ Failed to mark notification as read:', error);
    throw error;
  }
}

// Example Usage
await markNotificationAsRead(
  'notification-uuid-123',
  'user-uuid-456'
);
```

**Response:**
```json
{
  "success": true,
  "updated": 1
}
```

---

### 11. Track Notification Click

Track when a user clicks on a notification link.

```typescript
async function trackNotificationClick(
  notificationId: string,
  userId: string,
  redirectUrl?: string
) {
  try {
    const params = new URLSearchParams();
    params.append('userId', userId);
    if (redirectUrl) params.append('redirect', redirectUrl);

    const result = await callNotificationService(
      `/${notificationId}/click?${params.toString()}`,
      'GET'
    );

    return result;
  } catch (error) {
    console.error('❌ Failed to track click:', error);
    throw error;
  }
}

// Example Usage
const clickResult = await trackNotificationClick(
  'notification-uuid-123',
  'user-uuid-456',
  'https://app.agripath.co/investments'
);
// Returns redirectUrl for frontend to navigate
```

**Response:**
```json
{
  "redirectUrl": "https://app.agripath.co"
}
```

---

### 12. Twilio SMS Status Webhook

Handle Twilio webhook callbacks for SMS delivery status updates. This is typically configured in Twilio dashboard to call this endpoint automatically.

```typescript
// This endpoint is called by Twilio, not directly by back office
// But you can test it manually:

async function updateSMSDeliveryStatus(
  messageSid: string,
  messageStatus: string
) {
  try {
    const result = await callNotificationService(
      '/webhook/twilio',
      'POST',
      {
        MessageSid: messageSid,
        MessageStatus: messageStatus,
      }
    );

    return result;
  } catch (error) {
    console.error('❌ Failed to update SMS status:', error);
    throw error;
  }
}

// Example Usage (usually called by Twilio automatically)
await updateSMSDeliveryStatus(
  'SM1234567890abcdef',
  'delivered'
);
```

**Response:**
```json
{
  "success": true
}
```

---

## Error Handling

### Comprehensive Error Handling Example

```typescript
async function sendNotificationWithErrorHandling(
  userId: string,
  title: string,
  body: string
) {
  try {
    const result = await callNotificationService(
      `/inapp/user/${userId}`,
      'POST',
      { title, body }
    );

    return { success: true, data: result };
  } catch (error: any) {
    // Handle different error types
    if (error.message.includes('400')) {
      return {
        success: false,
        error: 'Invalid request. Please check user ID and notification content.',
      };
    } else if (error.message.includes('404')) {
      return {
        success: false,
        error: 'User not found or notification service unavailable.',
      };
    } else if (error.message.includes('500')) {
      return {
        success: false,
        error: 'Internal server error. Please try again later.',
      };
    } else {
      return {
        success: false,
        error: error.message || 'Unknown error occurred',
      };
    }
  }
}
```

---

## Best Practices

### 1. Batch Operations

When sending to multiple users, process in batches to avoid rate limiting:

```typescript
async function sendToMultipleUsers(
  userIds: string[],
  title: string,
  body: string,
  batchSize: number = 10
) {
  const results = [];
  
  for (let i = 0; i < userIds.length; i += batchSize) {
    const batch = userIds.slice(i, i + batchSize);
    
    const batchPromises = batch.map(userId =>
      sendInAppNotification(userId, title, body)
    );
    
    const batchResults = await Promise.allSettled(batchPromises);
    results.push(...batchResults);
    
    // Add delay between batches to avoid rate limiting
    if (i + batchSize < userIds.length) {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
  
  return results;
}
```

### 2. Retry Logic

Implement retry logic for failed notifications:

```typescript
async function sendWithRetry(
  userId: string,
  title: string,
  body: string,
  maxRetries: number = 3
) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await sendInAppNotification(userId, title, body);
    } catch (error) {
      if (attempt === maxRetries) {
        throw error;
      }
      
      // Exponential backoff
      await new Promise(resolve => 
        setTimeout(resolve, Math.pow(2, attempt) * 1000)
      );
    }
  }
}
```

### 3. Logging

Always log notification operations for audit trails:

```typescript
async function sendNotificationWithLogging(
  userId: string,
  title: string,
  body: string,
  adminId: string
) {
  const startTime = Date.now();
  
  try {
    const result = await sendInAppNotification(userId, title, body);
    
    // Log success
    console.log({
      event: 'notification_sent',
      userId,
      adminId,
      title,
      duration: Date.now() - startTime,
      success: true,
      timestamp: new Date().toISOString(),
    });
    
    return result;
  } catch (error) {
    // Log failure
    console.error({
      event: 'notification_failed',
      userId,
      adminId,
      title,
      duration: Date.now() - startTime,
      success: false,
      error: error.message,
      timestamp: new Date().toISOString(),
    });
    
    throw error;
  }
}
```

### 4. Validation

Validate inputs before sending:

```typescript
function validateNotificationInput(
  userId: string,
  title: string,
  body: string
): { valid: boolean; error?: string } {
  if (!userId || typeof userId !== 'string') {
    return { valid: false, error: 'Invalid user ID' };
  }
  
  if (!title || title.trim().length === 0) {
    return { valid: false, error: 'Title is required' };
  }
  
  if (title.length > 255) {
    return { valid: false, error: 'Title must be 255 characters or less' };
  }
  
  if (!body || body.trim().length === 0) {
    return { valid: false, error: 'Body is required' };
  }
  
  return { valid: true };
}

// Usage
const validation = validateNotificationInput(userId, title, body);
if (!validation.valid) {
  throw new Error(validation.error);
}
```

---

## Complete Examples

### Example 1: Project Stage Update Notification

Notify all investors when a project moves to a new stage:

```typescript
async function notifyProjectStageUpdate(
  projectId: string,
  stageName: string,
  projectName: string
) {
  const subject = `${projectName} - Stage Update`;
  const htmlContent = `
    <h2>Project Stage Update</h2>
    <p>Great news! The project <strong>${projectName}</strong> has progressed to the <strong>${stageName}</strong> stage.</p>
    <p>You can view more details in your dashboard.</p>
    <a href="https://app.agripath.co/projects/${projectId}">View Project</a>
  `;
  const textContent = `Project ${projectName} has moved to ${stageName} stage. View details: https://app.agripath.co/projects/${projectId}`;

  try {
    // Send email to all project investors
    const emailResult = await sendEmailToProjectInvestors(
      projectId,
      subject,
      textContent,
      htmlContent
    );

    console.log(`✅ Sent stage update to ${emailResult.sent} investors`);
    return emailResult;
  } catch (error) {
    console.error('❌ Failed to send project stage update:', error);
    throw error;
  }
}
```

### Example 2: Payout Notification

Notify a user when they receive a payout:

```typescript
async function notifyPayout(
  userId: string,
  amount: number,
  currency: string = 'GHS',
  payoutType: string
) {
  const title = 'Payout Received';
  const body = `You have received ${currency} ${amount.toLocaleString()} as ${payoutType}. The funds have been added to your wallet.`;

  try {
    // Send via all channels for important financial notifications
    const result = await sendMultiChannelNotification(userId, title, body);
    
    console.log(`✅ Payout notification sent via ${result.sent} channels`);
    return result;
  } catch (error) {
    console.error('❌ Failed to send payout notification:', error);
    throw error;
  }
}
```

### Example 3: Security Alert

Send urgent security notifications:

```typescript
async function sendSecurityAlert(
  userId: string,
  alertType: 'password_change' | 'login_new_device' | 'suspicious_activity',
  details: string
) {
  const alertMessages = {
    password_change: {
      title: 'Password Changed',
      body: `Your password was changed. ${details}`,
    },
    login_new_device: {
      title: 'New Device Login',
      body: `Your account was accessed from a new device. ${details}`,
    },
    suspicious_activity: {
      title: 'Suspicious Activity Detected',
      body: `We detected unusual activity on your account. ${details}`,
    },
  };

  const { title, body } = alertMessages[alertType];

  try {
    // Use all channels for security alerts
    const result = await sendMultiChannelNotification(userId, title, body);
    
    // Also log for security audit
    console.log({
      event: 'security_alert_sent',
      userId,
      alertType,
      timestamp: new Date().toISOString(),
    });
    
    return result;
  } catch (error) {
    console.error('❌ Failed to send security alert:', error);
    throw error;
  }
}
```

### Example 4: Marketing Campaign

Send marketing emails to all users:

```typescript
async function sendMarketingCampaign(
  subject: string,
  htmlContent: string,
  textContent: string
) {
  try {
    const result = await sendBulkEmail(subject, textContent, htmlContent);
    
    console.log(`✅ Marketing campaign sent to ${result.sent} users`);
    
    // Track campaign in analytics
    const analytics = await getNotificationAnalytics();
    console.log(`Campaign metrics:`, analytics);
    
    return result;
  } catch (error) {
    console.error('❌ Marketing campaign failed:', error);
    throw error;
  }
}
```

### Example 5: User Notification Dashboard Data

Get comprehensive user notification data for admin dashboard:

```typescript
async function getUserNotificationDashboard(userId: string) {
  try {
    // Get user status
    const status = await getUserNotificationStatus(userId);
    
    // Get recent analytics
    const analytics = await getNotificationAnalytics();
    
    return {
      user: {
        totalNotifications: status.total,
        readNotifications: status.read,
        unreadNotifications: status.total - status.read,
        clickedNotifications: status.clicked,
        readRate: status.total > 0 
          ? Math.round((status.read / status.total) * 100) 
          : 0,
        clickRate: status.total > 0
          ? Math.round((status.clicked / status.total) * 100)
          : 0,
      },
      platform: {
        totalNotifications: analytics.totals.total,
        readRate: analytics.rates.readRate,
        clickRate: analytics.rates.clickRate,
        channelBreakdown: analytics.breakdown,
      },
      recentNotifications: status.notifications.slice(0, 10),
    };
  } catch (error) {
    console.error('❌ Failed to get dashboard data:', error);
    throw error;
  }
}
```

---

## Environment Variables

Add these to your back office `.env` file:

```bash
# Supabase Configuration
SUPABASE_URL=https://xiupdgdgsnkxkcpkftad.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here

# Notification Service (optional - edge function has default)
NOTIFICATION_SERVICE_URL=https://buzz.agripath.co
```

---

## Testing

### Health Check

Always test connectivity first:

```typescript
async function testNotificationService() {
  try {
    const result = await callNotificationService('/health', 'GET');
    console.log('✅ Notification service is healthy:', result);
    return true;
  } catch (error) {
    console.error('❌ Notification service is unavailable:', error);
    return false;
  }
}

// Run on application startup
await testNotificationService();
```

---

## Support & Troubleshooting

### Common Issues

1. **401 Unauthorized**: Check that `SUPABASE_SERVICE_ROLE_KEY` is correct
2. **404 Not Found**: Verify the endpoint path and user/project IDs
3. **500 Internal Server Error**: Check notification service status at `https://buzz.agripath.co/health`
4. **Rate Limiting**: Implement batching and delays between requests

### Debug Mode

Enable detailed logging:

```typescript
const DEBUG = process.env.NODE_ENV === 'development';

async function callNotificationService(...args) {
  if (DEBUG) {
    console.log('📤 Sending request:', args);
  }
  
  const result = await callNotificationService(...args);
  
  if (DEBUG) {
    console.log('📥 Received response:', result);
  }
  
  return result;
}
```

---

## Summary

The notification edge function provides a unified interface for:

- ✅ Sending notifications via Email, SMS, In-App, and Push
- ✅ Automatic storage in Supabase for analytics
- ✅ Tracking read/click status
- ✅ Comprehensive analytics and reporting
- ✅ Webhook support for SMS delivery status

All operations are automatically logged in Supabase, making it easy to track notification performance and user engagement.



