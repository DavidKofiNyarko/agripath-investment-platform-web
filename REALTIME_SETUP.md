# Real-Time Updates Setup for Agripath

## Problem
When multiple users invest in the same project simultaneously, the `available_unit` field doesn't update in real-time across all users. Users need to refresh the page to see updated availability.

## Solution Implemented

### 1. Frontend Real-Time Subscription
✅ **COMPLETED** - Added real-time subscription in `contexts/ProjectsContext.tsx`:

- Listens to all changes on the `projects` table (INSERT, UPDATE, DELETE)
- Automatically updates project data when changes occur
- Includes error handling and fallback mechanisms
- Added periodic refresh every 30 seconds as backup

### 2. Manual Refresh After Investment
✅ **COMPLETED** - Added `refreshProjects()` calls in `app/investments/page.tsx`:

- Refreshes project data immediately after successful investment
- Ensures immediate UI updates for the investing user
- Works for all payment methods (Mobile Money, Card, Agripath Wallet)

## Required Database Configuration

### Enable Real-Time for Projects Table
To complete the setup, you need to enable real-time for the `projects` table in Supabase:

```sql
-- Enable real-time for the projects table
ALTER PUBLICATION supabase_realtime ADD TABLE projects;
```

### Alternative: Enable Real-Time for All Tables
If you want real-time for all tables:

```sql
-- Enable real-time for all tables
ALTER PUBLICATION supabase_realtime ADD TABLE ALL TABLES IN SCHEMA public;
```

## How to Enable Real-Time

### Option 1: Supabase Dashboard
1. Go to your Supabase project dashboard
2. Navigate to **Database** → **Replication**
3. Find the `projects` table
4. Toggle **Enable Realtime** to ON

### Option 2: SQL Editor
1. Go to **SQL Editor** in Supabase dashboard
2. Run the SQL command above
3. Click **Run** to execute

### Option 3: Supabase CLI
```bash
# If you have Supabase CLI installed
supabase db reset
# Then run the migration
```

## Testing the Implementation

### Test Scenario
1. Open the investments page in two different browser windows/tabs
2. In Tab 1: Start an investment process (don't complete)
3. In Tab 2: Complete an investment in the same project
4. Tab 1 should automatically show updated `available_unit` without refresh

### Console Logs to Monitor
- `"Successfully subscribed to projects table changes"` - Real-time is working
- `"Projects table changed:"` - Shows when updates are received
- `"Periodic projects refresh..."` - Fallback mechanism working

## Fallback Mechanisms

### 1. Periodic Refresh
- Automatically refreshes project data every 30 seconds
- Ensures data stays current even if real-time fails
- Can be adjusted by changing the interval in `ProjectsContext.tsx`

### 2. Manual Refresh After Investment
- Immediately refreshes data after successful investment
- Provides instant feedback to the investing user
- Works regardless of real-time status

### 3. Error Handling
- Gracefully handles real-time subscription failures
- Logs warnings when real-time is not available
- Continues to work with periodic refresh

## Performance Considerations

### Real-Time Subscription
- Only subscribes to `projects` table changes
- Minimal overhead on database
- Automatically cleans up on component unmount

### Periodic Refresh
- 30-second interval balances freshness vs performance
- Can be increased to 60 seconds for better performance
- Can be disabled if real-time is working reliably

## Monitoring

### Success Indicators
- Console shows "Successfully subscribed to projects table changes"
- Available units update immediately when other users invest
- No need for manual page refresh

### Troubleshooting
- Check console for subscription status messages
- Verify real-time is enabled in Supabase dashboard
- Ensure projects table is added to supabase_realtime publication

## Next Steps

1. **Enable Real-Time**: Run the SQL command to enable real-time for projects table
2. **Test**: Verify real-time updates work across multiple browser sessions
3. **Monitor**: Check console logs to ensure subscription is working
4. **Optimize**: Adjust refresh intervals based on usage patterns

The frontend implementation is complete and ready. Once real-time is enabled in Supabase, users will see immediate updates to project availability without needing to refresh the page.
