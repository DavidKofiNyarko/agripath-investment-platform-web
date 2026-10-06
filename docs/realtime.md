# Real-Time Updates

AgriPath uses **Supabase Realtime** to push live changes to the UI without page refreshes.

## What updates in real time

| Data | Table | Where it's used |
| --- | --- | --- |
| Project availability (`available_unit`) | `projects` | Investments page — units update as others invest |
| Wallet balance | `wallets` | Wallet & dashboard |
| Transaction status | `transactions` | Transactions page, payment callbacks |
| Notifications | `notifications`, `users_notifications` | Notification bell (replaced 30s polling) |
| Profile changes | `profile` | Profile context |

## Implementation

- **Frontend subscriptions** live in the React contexts (e.g. `contexts/ProjectsContext.tsx` listens for `INSERT`, `UPDATE`, `DELETE` on `projects` and updates local state immediately)
- **Post-investment refresh** — `app/investments/page.tsx` and the dashboard refresh project data immediately after a successful investment, for all payment methods (mobile money, card, wallet)
- **Fallback polling** — projects refresh every 30 seconds as a safety net if the realtime socket drops; the interval is configurable in `ProjectsContext.tsx`
- Subscriptions are cleaned up on unmount to avoid leaks

## Database configuration

Realtime must be enabled per table. In the Supabase dashboard: **Database → Replication → toggle Realtime** for each table, or run in the SQL editor:

```sql
-- Enable realtime for a single table
ALTER PUBLICATION supabase_realtime ADD TABLE projects;

-- Or enable for all tables in the public schema
ALTER PUBLICATION supabase_realtime ADD TABLE ALL TABLES IN SCHEMA public;
```

## Testing

1. Open the investments page in two browser windows
2. In window A, start (but don't complete) an investment
3. In window B, complete an investment in the same project
4. Window A should show the updated available units without refreshing

### Monitoring

Console messages to expect when working:

- `Successfully subscribed to projects table changes` — realtime is live
- `Projects table changed:` — updates received
- `Periodic projects refresh...` — fallback polling active

## Troubleshooting

| Symptom | Check |
| --- | --- |
| No live updates | Realtime enabled for the table in Dashboard → Database → Replication |
| Stale data | Fallback polling interval in `ProjectsContext.tsx` (default 30s) |
| Console errors on subscribe | Supabase URL/key correct in `.env.local`; network allows WSS connections |
