# Scheduler Quick Reference

## TL;DR - What Changed?

**Before:** Vercel Cron triggered `/api/auth/security-cron` every minute  
**Now:** Internal scheduler runs the same code on the same schedule  
**Impact:** Zero - same behavior, better reliability, platform-independent

---

## Quick Commands

```bash
# Check scheduler status
curl http://localhost:3000/api/scheduler-status

# Verify scheduler is working
node scripts/verify-scheduler.js

# Manual test (dev only)
curl -H "Authorization: Bearer cron_dev_key_2024" \
  http://localhost:3000/api/auth/security-cron
```

---

## Quick Checks

### ✅ Scheduler is Working If:
- Server logs show: `"✅ Registered task: security-monitor"`
- Status endpoint returns: `"isRunning": true`
- Console logs every 60s: `"🕐 Security Monitor: Starting..."`
- `/api/scheduler-status` shows recent `lastRun` timestamp

### ❌ Scheduler is NOT Working If:
- No initialization logs at startup
- Status endpoint returns 500 error
- No periodic console logs
- `lastRun` shows "Never" after 2 minutes

---

## File Structure

```
lib/
  ├── scheduler.ts           # Core scheduler engine
  ├── securityScheduler.ts   # Security task registration
  └── schedulerInit.ts       # Auto-init (imported in layout)

app/
  ├── layout.tsx             # Imports schedulerInit
  └── api/
      ├── scheduler-status/  # Health check endpoint
      └── auth/
          └── security-cron/ # Legacy endpoint (deprecated)

docs/
  ├── CRON_MIGRATION.md      # Detailed migration guide
  └── MIGRATION_SUMMARY.md   # Complete change summary

scripts/
  └── verify-scheduler.js    # Automated verification
```

---

## Add a New Scheduled Task

```typescript
// In any server-side file (e.g., lib/myScheduler.ts)
import scheduler from '@/lib/scheduler';

scheduler.register(
  'my-task',           // Unique ID
  60 * 1000,           // Interval (60s)
  async () => {
    // Your code here
    console.log('Task running');
  }
);

// Then import in lib/schedulerInit.ts
```

---

## Troubleshooting

| Problem | Solution |
|---------|----------|
| Scheduler not starting | Check import in `app/layout.tsx` |
| Task not executing | Check console for error logs |
| Multiple executions | Check overlap prevention (should never happen) |
| Status endpoint 404 | Ensure `app/api/scheduler-status/route.ts` exists |

---

## Monitoring in Production

```javascript
// Check health every 5 minutes
setInterval(async () => {
  const res = await fetch('/api/scheduler-status');
  const data = await res.json();
  
  if (!data.scheduler.isRunning) {
    alert('Scheduler down!');
  }
}, 5 * 60 * 1000);
```

---

## Key Differences from Vercel Cron

| Aspect | Vercel Cron | Internal Scheduler |
|--------|-------------|-------------------|
| **Trigger** | External HTTP call | In-process timer |
| **Startup** | After first request | Immediately |
| **Platform** | Vercel only | Any Node.js host |
| **Config** | vercel.json | Code only |
| **Auth** | CRON_SECRET required | N/A (internal) |
| **Overlap** | Not prevented | Prevented |
| **Shutdown** | Abrupt | Graceful |

---

## Environment Variables

```bash
# Optional - for status endpoint auth in production
STATUS_SECRET=your-secret-here

# Legacy - only for manual endpoint access (deprecated)
CRON_SECRET=cron_dev_key_2024
```

---

## Important Notes

⚠️ **The `/api/auth/security-cron` endpoint is DEPRECATED**
- It still works but returns scheduler status instead of executing
- Only execute directly in development mode
- Production uses internal scheduler automatically

⚠️ **Do NOT add cron config back to vercel.json**
- This will create duplicate executions
- Scheduler handles everything internally now

✅ **Safe to delete CRON_SECRET from .env**
- Only needed for manual endpoint access
- Not required for production operation

---

## Success Criteria

Your scheduler is working correctly if:
1. ✅ Server starts without errors
2. ✅ Logs show scheduler initialization
3. ✅ `/api/scheduler-status` returns healthy status
4. ✅ Security monitoring executes every 60 seconds
5. ✅ No Vercel cron warnings in deployment logs

---

## Need Help?

1. Check [CRON_MIGRATION.md](./CRON_MIGRATION.md) for details
2. Run `node scripts/verify-scheduler.js`
3. Review console logs for errors
4. Check `/api/scheduler-status` for task health

---

**Quick Reference Version:** 1.0  
**Last Updated:** January 2026
