# Bubble Chat Live Integration Tests

## Overview

Comprehensive live testing suite for bubble chat management system that tests all user→admin and admin→user flows.

## Test Scenarios Covered

### User (Visitor) Side:
1. ✅ **Session Creation** - Generate fingerprint, create session with UUID-sync
2. ✅ **Send Messages** - Send multiple messages from visitor
3. ✅ **Typing Indicators** - Test visitor typing status updates
4. ✅ **Fetch Messages** - Retrieve message history
5. ✅ **Receive Admin Replies** - Get admin responses
6. ✅ **Mark as Read** - Mark messages as read/delivered
7. ✅ **Multiple Visitors** - Test concurrent visitor sessions

### Admin Side:
8. ✅ **Fetch All Sessions** - Get all chat sessions
9. ✅ **Send Replies** - Reply to visitor messages
10. ✅ **Session Deletion** - Delete single session
11. ✅ **Batch Deletion** - Delete multiple sessions at once
12. ✅ **Chat Statistics** - Get chat analytics

### Error Handling:
13. ✅ **Invalid Sessions** - Test error responses
14. ✅ **Network Failures** - Verify graceful degradation

## Running the Tests

### Prerequisites
```bash
# Ensure dev server is running
npm run dev

# IMPORTANT: For automated testing, disable Turnstile CAPTCHA
# Option 1: Use test site key in .env.local:
NEXT_PUBLIC_TURNSTILE_SITE_KEY=1x00000000000000000000AA

# Option 2: Temporarily disable Turnstile validation in the code
# Option 3: Use Turnstile's "always pass" test keys
```

### Run All Tests
```bash
npm run test:bubble-live
```

### With Custom URL
```bash
TEST_URL=http://localhost:3000 node tests/bubble-live-test.mjs
```

### Production Testing
```bash
TEST_URL=https://your-domain.com node tests/bubble-live-test.mjs
```

## Test Configuration

Environment variables:
- `TEST_URL` - Target URL (default: http://localhost:3000)
- `ADMIN_EMAIL` - Admin email for auth tests
- `ADMIN_PASSWORD` - Admin password for auth tests

## Expected Output

```
🚀 Starting Bubble Chat Live Integration Tests
🌐 Target: http://localhost:3000

============================================================
SCENARIO 1: Visitor Session Creation
============================================================

ℹ️ Generated fingerprint: abc123...
ℹ️ Generated mask: device_a1b2c3d4e5
✅ Session creation request successful
✅ Session creation response success
✅ Session ID returned
✅ Session mask matches
ℹ️ Session ID: xyz789...

============================================================
SCENARIO 2: Visitor Send Messages
============================================================

ℹ️ Sending message 1: "Hello, I need help with my portfolio"
✅ Message 1 sent successfully
✅ Message 1 response success
✅ Message 1 ID returned
...

============================================================
TEST RESULTS
============================================================

Test Duration: 8.45s

✅ Passed: 42
❌ Failed: 0
📊 Total Assertions: 42

Scenarios Tested:
  1. Visitor Session Creation
  2. Visitor Send Messages
  3. Visitor Typing Indicator
  4. Visitor Fetch Messages
  5. Admin Authentication
  6. Admin Fetch Sessions
  7. Admin Send Reply
  8. Visitor Receive Reply
  9. Mark Messages as Read
  10. Multiple Concurrent Visitors
  11. Session Deletion
  12. Batch Session Deletion
  13. Chat Statistics
  14. Error Handling

🎉 ALL TESTS PASSED! (100% success rate)
```

## Notes

### Firebase Authentication
Some tests require Firebase Admin authentication:
- Admin fetch sessions
- Admin send reply
- Session deletion
- Batch deletion

If Firebase Auth is not configured, these tests will show warnings but won't fail the entire suite.

### Session IDs
The script outputs test session IDs that you can use for manual verification in:
- Admin dashboard at `/admin`
- Firestore database
- Firebase console

### Cleanup
Test sessions are soft-deleted (have `deletedAt` timestamp). To permanently clean up:
```bash
# Via Firebase console
# Or implement a cleanup script
```

## Troubleshooting

### "Connection refused"
- Make sure dev server is running: `npm run dev`
- Check the port is correct (default: 3000)

### "401 Unauthorized" for admin tests
- This is expected if Firebase Auth is not set up
- Tests will continue with warnings

### "Session not found"
- Sessions may expire or be deleted
- Test creates fresh sessions each run

## Integration with CI/CD

```yaml
# .github/workflows/test.yml
- name: Run Bubble Chat Tests
  run: |
    npm run dev &
    sleep 5
    npm run test:bubble-live
  env:
    TEST_URL: http://localhost:3000
```

## Manual Verification

After running automated tests, you can manually verify:

1. **Admin Dashboard**: Go to `/admin` and check:
   - Sessions appear in bubble management
   - Message counts are correct
   - Unread badges show properly
   - Can reply and see messages

2. **Visitor Side**: Open homepage and:
   - Click chat bubble
   - Send messages
   - See admin replies
   - Check typing indicators

3. **Firestore**: Check database:
   - `bubbleSessions` collection has test sessions
   - `bubbleMessages` subcollection has messages
   - Timestamps and metadata are correct

## Test Data Cleanup

Test sessions have specific patterns:
- Masks: `device_*` (from fingerprint hash)
- Fingerprints: `visitor_1001`, `visitor_2002`, etc.

You can identify and clean them up in Firestore.
