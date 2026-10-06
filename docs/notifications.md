# Notification System

AgriPath delivers notifications across multiple channels with user-configurable preferences.

## Data model

### Categories (`notification_category`)
| Category | Purpose |
| --- | --- |
| `Investment` | Investment-related events |
| `System` | System-level events |
| `Marketing` | Promotions |
| `Announcement` | General announcements |
| `Alert` | Important alerts and warnings |

### Channels (`notification_type`)
`Email`, `SMS`, `InApp`, `Push`, `All`

### Status (`notification_status`)
`Draft`, `Scheduled`, `Published`, `Failed`

### Priority (`notification_priority`)
`Low`, `Medium` (default), `High`, `Urgent`

### Key fields
`id`, `title`, `body`, `type`, `category`, `status`, `priority`, `target_audience`, `tags`, `created_at`, `published_at`, `scheduled_for`, `read_count`, `click_count`

## User preferences (Settings page)

| UI toggle | Maps to | Preference key |
| --- | --- | --- |
| Investment Updates | `category = 'Investment'` | `investment_updates` |
| ROI & Payout Alerts | `category = 'Investment'` + high priority | `market_updates` |
| App Announcements | `category = 'Announcement'` | `email_notifications` |
| Security Alerts | `category = 'Alert'` | `security_alerts` |
| Offers & Promotions | `category = 'Marketing'` | `push_notifications` |

## Current implementation

`contexts/NotificationContext.tsx` fetches from the `notifications` table:

- Filters `status = 'Published'`, ordered by `published_at DESC`
- Joins `users_notifications` for per-user read state
- Returns `id`, `title`, `body`, `type`, read status, `created_at`, `read_at`, `clicked_at`
- Realtime subscription replaces polling (see [realtime.md](realtime.md))

## Roadmap

- Filter the notification feed by category, channel, priority, and tags
- Show category badges and priority indicators in the feed
- Per-channel preference toggles (Email / SMS / InApp / Push)
- Persist user preferences in a dedicated table and filter the fetch query accordingly

### Example filtered query

```typescript
const { data: notifications } = await supabase
  .from("notifications")
  .select("id, title, body, type, category, priority, status, created_at, published_at")
  .eq("status", "Published")
  .in("category", enabledCategories)
  .in("type", enabledChannels)
  .order("priority", { ascending: false })
  .order("published_at", { ascending: false })
  .limit(50);
```
