# Notification System - Available Options & Display Mapping

## Database Structure (Supabase)

### Notification Categories (enum: `notification_category`)
Available categories for organizing notifications:
- **Investment** - Investment-related notifications
- **System** - System-level notifications
- **Marketing** - Marketing and promotional content
- **Announcement** - General announcements
- **Alert** - Important alerts and warnings

### Notification Types/Channels (enum: `notification_type`)
Delivery channels for notifications:
- **Email** - Email notifications
- **SMS** - SMS/text message notifications
- **InApp** - In-app notifications
- **Push** - Push notifications
- **All** - All channels combined

### Notification Status (enum: `notification_status`)
Status of notifications:
- **Draft** - Not yet published
- **Scheduled** - Scheduled for future publication
- **Published** - Currently published and visible
- **Failed** - Failed to publish

### Notification Priority (enum: `notification_priority`)
Priority levels:
- **Low** - Low priority
- **Medium** - Medium priority (default)
- **High** - High priority
- **Urgent** - Urgent priority

### Target Audience
Currently in database:
- **All Users** - Broadcast to all users

### Notification Fields Available
- `id` - UUID
- `title` - Notification title
- `body` - Notification content
- `type` - Delivery channel (Email, SMS, InApp, Push, All)
- `category` - Category (Investment, System, Marketing, Announcement, Alert)
- `status` - Status (Draft, Scheduled, Published, Failed)
- `priority` - Priority level (Low, Medium, High, Urgent)
- `target_audience` - Target audience (e.g., "All Users")
- `tags` - Array of tags for filtering
- `created_at` - Creation timestamp
- `published_at` - Publication timestamp
- `scheduled_for` - Scheduled publication time
- `read_count` - Number of reads
- `click_count` - Number of clicks

---

## Current UI Display (Settings Page)

### Investment & Portfolio Section
1. **Investment Updates**
   - Maps to: `category = 'Investment'`
   - Description: "Get updates when your crops/livestock are started, growth stages, or harvested."
   - Preference key: `investment_updates`

2. **ROI & Payout Alerts**
   - Maps to: `category = 'Investment'` (with priority/type filtering)
   - Description: "Be notified when your returns are ready or payouts are sent."
   - Preference key: `market_updates`

### App & System Section
3. **App Announcements**
   - Maps to: `category = 'Announcement'`
   - Description: "Stay informed about new features and updates."
   - Preference key: `email_notifications`

4. **Security Alerts**
   - Maps to: `category = 'Alert'`
   - Description: "Get notified if there's a login from a new device or account changes."
   - Preference key: `security_alerts`

### Promotions & Marketing Section
5. **Offers & Promotions**
   - Maps to: `category = 'Marketing'`
   - Description: "Occasional offers, bonuses, and news from AgriPath."
   - Preference key: `push_notifications`

---

## Recommended Display Options

### Option 1: Filter by Category (Current Approach)
Display notifications grouped by category:
- **Investment** → Investment Updates, ROI & Payout Alerts
- **Announcement** → App Announcements
- **Alert** → Security Alerts
- **Marketing** → Offers & Promotions
- **System** → (Not currently displayed, could add)

### Option 2: Filter by Type/Channel
Display notifications by delivery method:
- **Email** → Email notifications
- **SMS** → SMS notifications
- **InApp** → In-app notifications
- **Push** → Push notifications

### Option 3: Filter by Priority
Display notifications by priority level:
- **Urgent** → Critical notifications
- **High** → Important notifications
- **Medium** → Standard notifications
- **Low** → Low-priority notifications

### Option 4: Combined Filtering
Allow users to filter by:
- Category (Investment, System, Marketing, Announcement, Alert)
- Type (Email, SMS, InApp, Push)
- Priority (Urgent, High, Medium, Low)
- Status (Read, Unread)

---

## Current NotificationContext Implementation

### What's Currently Fetched
- Fetches from `notifications` table
- Filters by `status = 'Published'`
- Orders by `published_at DESC`
- Joins with `users_notifications` to get read status
- Returns: `id`, `title`, `body`, `type`, `status` (read/unread), `created_at`, `read_at`, `clicked_at`

### What Could Be Added
1. **Category filtering** - Filter notifications by category based on user preferences
2. **Priority display** - Show priority badges (Urgent, High, etc.)
3. **Type filtering** - Filter by Email, SMS, InApp, Push
4. **Tags support** - Use tags for additional filtering
5. **Target audience filtering** - Filter by target audience if more options are added

---

## Recommendations

### For Notification Display (List/Feed)
1. **Show category badges** - Display category (Investment, Alert, etc.) as badges
2. **Show priority indicators** - Use color coding for Urgent/High priority
3. **Filter by category** - Allow users to filter by their preference categories
4. **Group by date** - Group notifications by "Today", "This Week", "Older"

### For Notification Preferences (Settings)
1. **Map to database categories**:
   - Investment Updates → `category = 'Investment'`
   - ROI & Payout Alerts → `category = 'Investment'` + `priority = 'High'`
   - App Announcements → `category = 'Announcement'`
   - Security Alerts → `category = 'Alert'`
   - Offers & Promotions → `category = 'Marketing'`

2. **Add System notifications** - Add toggle for System category notifications

3. **Add channel preferences** - Allow users to choose Email, SMS, InApp, Push preferences separately

### For Notification Fetching
Update `NotificationContext.fetchNotifications()` to:
1. Filter by user's enabled categories
2. Filter by user's enabled channels (Email, SMS, etc.)
3. Include priority and category in the response
4. Support tag-based filtering

---

## Example Query for Filtered Notifications

```typescript
// Fetch notifications filtered by user preferences
const { data: notifications } = await supabase
  .from("notifications")
  .select("id, title, body, type, category, priority, status, created_at, published_at")
  .eq("status", "Published")
  .in("category", enabledCategories) // Filter by user's enabled categories
  .in("type", enabledChannels) // Filter by user's enabled channels
  .order("priority", { ascending: false }) // Urgent first
  .order("published_at", { ascending: false })
  .limit(50);
```

---

## Next Steps

1. **Update NotificationContext** to include category and priority in the response
2. **Update NotificationPreferences** to map to database categories
3. **Add filtering** in the notification list/feed by category, type, priority
4. **Create notification preferences table** in database to store user preferences
5. **Implement preference-based filtering** when fetching notifications

