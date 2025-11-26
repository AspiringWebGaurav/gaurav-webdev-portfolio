# API Quick Reference Guide

This is a condensed reference for all API endpoints. For detailed documentation, see [API_DOCUMENTATION.md](./API_DOCUMENTATION.md).

---

## API Endpoints Summary

| API | Endpoint | GET | POST | PUT | DELETE | Auth Required |
|-----|----------|-----|------|-----|--------|---------------|
| **Tech Stacks** | `/api/tech-stacks` | ✅ | ✅ | ✅ | ✅ | ❌ (should be ✅) |
| **Projects** | `/api/projects` | ✅ | ✅ | ✅ | ✅ | ❌ (should be ✅) |
| **Testimonials** | `/api/testimonials` | ✅ | ✅ | ✅ | ✅ | ❌ (should be ✅) |
| **Work Experience** | `/api/work-experience` | ✅ | ✅ | ✅ | ✅ | ❌ (should be ✅) |
| **Currently Working** | `/api/currently-working` | ✅ | ✅ | ✅ | ✅ | ❌ (should be ✅) |
| **Contact Submissions** | `/api/contact-submissions` | ✅ | ❌ | ❌ | ✅ | ❌ (should be ✅) |
| **Bug Reports** | `/api/bug-reports` | ✅ | ❌ | ✅ | ✅ | ❌ (should be ✅) |
| **Bubble Sessions** | `/api/bubble/sessions` | ✅ | ✅ | ✅ | ✅ | ❌ |
| **Bubble Messages** | `/api/bubble/messages` | ✅ | ✅ | ✅ | ✅ | ❌ |
| **Bubble Questions** | `/api/bubble/questions` | ✅ | ✅ | ✅ | ✅ | ❌ (should be ✅) |
| **Visitor Analytics** | `/api/visitor-analytics/visitors` | ✅ | ❌ | ❌ | ❌ | ❌ (should be ✅) |
| **Ban Visitor** | `/api/visitor-analytics/ban` | ❌ | ✅ | ❌ | ❌ | ❌ (should be ✅) |
| **Unban Visitor** | `/api/visitor-analytics/unban` | ❌ | ✅ | ❌ | ❌ | ❌ (should be ✅) |
| **Check Ban Status** | `/api/visitor-analytics/check-ban` | ✅ | ❌ | ❌ | ❌ | ❌ |
| **Ban Appeals** | `/api/ban-appeals` | ✅ | ✅ | ✅ | ❌ | Partial |

---

## 1. Tech Stacks API

**Collection:** `portfolio_techStacks`

### Required Fields for CREATE:
```json
{
  "name": "string (2-30 chars)"
}
```

### Optional Fields:
- `order`: number (auto-assigned)
- `isActive`: boolean (default: true)

### Constraints:
- Max 20 tech stacks
- Name must be unique

---

## 2. Projects API

**Collection:** `portfolio_projects`

### Required Fields for CREATE:
```json
{
  "title": "string (3-100 chars)",
  "des": "string (10-500 chars)",
  "img": "string (valid URL)",
  "iconLists": ["string (1-10 URLs)"],
  "link": "string (valid URL)"
}
```

### Optional Fields:
- `images`: string[] (for slideshow)
- `order`: number (1-10, auto-assigned)
- `isActive`: boolean (default: true)

### Constraints:
- Max 10 projects
- At least 1 icon required
- Max 10 icons

---

## 3. Testimonials API

**Collection:** `portfolio_testimonials`

### Required Fields for CREATE:
```json
{
  "quote": "string (20-500 chars)",
  "name": "string (2-50 chars)",
  "title": "string (2-100 chars)"
}
```

### Optional Fields:
- `img`: string (URL for person's photo)
- `order`: number (auto-assigned)
- `isActive`: boolean (default: true)

### Special Features:
- **Batch Create:** POST accepts array of testimonials
- Max 20 testimonials

---

## 4. Work Experience API

**Collection:** `portfolio_workExperience`

### Required Fields for CREATE:
```json
{
  "title": "string (3-150 chars)",
  "desc": "string (10-500 chars)",
  "thumbnail": "string (valid URL or data URI)"
}
```

### Optional Fields:
- `company`: string
- `duration`: string (e.g., "2020 - 2021")
- `location`: string
- `order`: number (1-10, auto-assigned)
- `isActive`: boolean (default: true)

### Constraints:
- Max 10 work experiences

---

## 5. Currently Working API

**Collection:** `portfolio_currentlyWorking`

### Required Fields for CREATE:
```json
{
  "headingTitle": "string (3-50 chars)",
  "title": "string (5-100 chars)",
  "description": "string (10-300 chars)",
  "iconLists": ["string (1-10 URLs)"]
}
```

### Optional Fields:
- `blogContent`: string (max 10,000 chars)
- `images`: string[] (max 5 URLs)
- `githubLink`: string (URL)
- `liveLink`: string (URL)
- `isActive`: boolean (default: false)
- `showBlogNotification`: boolean (default: false)

### Special Behavior:
- Only ONE active item shown on frontend
- Admin view shows all items

---

## 6. Contact Submissions API

**Collection:** `contactSubmissions`

### READ-ONLY for Admin
Visitors create submissions via contact form.

### Fields Returned:
- `id`, `name`, `email`, `message`, `phone`, `subject`
- `status`: new|read|replied|archived
- `isRead`, `replied`, `repliedAt`
- `adminNotes`, `ipAddress`, `fingerprint`, `spamScore`
- `createdAt`, `updatedAt`

### Rate Limits:
- 3 submissions per email per 24 hours
- 5 submissions per IP per hour

---

## 7. Bug Reports API

**Collection:** `bugReports`

### Fields Returned:
- Basic info: `id`, `reporterName`, `reporterEmail`, `title`
- Details: `severity`, `category`, `stepsToReproduce`, `actualBehavior`, `expectedBehavior`
- Context: `url`, `browserInfo`, `userAgent`, `ipAddress`, `fingerprint`
- Status: `status`, `assignedTo`, `resolvedAt`, `resolvedBy`, `duplicateOf`
- Data: `attachments[]`, `adminNotes[]`, `spamScore`

### Admin Operations:
- Update `status`: new|in-progress|resolved|duplicate|wont-fix
- Add `adminNotes`
- Assign to developer (`assignedTo`)
- Mark as duplicate (`duplicateOf`)

### Rate Limits:
- 3 reports per email per 24 hours
- 5 reports per IP per hour
- Max 5 attachments, 5MB each

---

## 8. Bubble Management APIs

### 8.1 Sessions API

**Collection:** `og_uuid_sessions`

#### Required for CREATE:
```json
{
  "mask": "string (visitor's session mask)"
}
```

#### Fields:
- `id`: UUID (document ID)
- `mask`: visitor's mask
- `deviceFingerprint`, `visitorEmail`
- `startedAt`, `lastActive`
- `messageCount`, `unreadAdminReplies`, `unreadVisitorMessages`
- `hasUnreadTooltip`, `visitorOnline`, `adminOnline`
- `visitorLastSeen`, `adminLastSeen`
- `status`: pending|active|closed

### 8.2 Messages API

**Collection:** `bubbleMessages`

#### Required for CREATE:
```json
{
  "sessionId": "string (UUID)",
  "role": "visitor|admin",
  "content": "string (non-empty)"
}
```

#### Fields:
- `id`: UUID (custom)
- `sessionId`: UUID
- `role`: visitor|admin
- `content`: message text
- `timestamp`, `read`, `delivered`
- `readAt`, `deliveredAt`
- `visitorEmail`

### 8.3 Questions API

**Collection:** `bubblePredefinedQuestions`

#### Required for CREATE:
```json
{
  "question": "string",
  "answer": "string"
}
```

#### Fields:
- `id`: UUID
- `question`, `answer`
- `order`: number
- `active`: boolean
- `createdAt`, `updatedAt`

---

## 9. Visitor Analytics APIs

### 9.1 List Visitors

**Endpoint:** `GET /api/visitor-analytics/visitors`

Returns all visitor profiles with:
- `id` (UUID), `mask`
- `firstSeen`, `lastSeen`, `visitCount`, `pageViews`
- `deviceFingerprint`, `ipAddress`, `userAgent`
- `isBanned`, `bannedReason`, `bannedAt`, `bannedBy`, `bannedUntil`
- `country`, `city`, `region`

### 9.2 Ban Visitor

**Endpoint:** `POST /api/visitor-analytics/ban`

```json
{
  "mask": "string (REQUIRED)",
  "reason": "string (optional)",
  "bannedBy": "string (optional, default: 'admin')",
  "duration": "permanent|1hour|1day|1week|1month (optional, default: 'permanent')"
}
```

### 9.3 Unban Visitor

**Endpoint:** `POST /api/visitor-analytics/unban`

```json
{
  "mask": "string (REQUIRED)"
}
```

### 9.4 Check Ban Status

**Endpoint:** `GET /api/visitor-analytics/check-ban?mask={mask}`

Returns:
```json
{
  "isBanned": "boolean",
  "reason": "string (optional)",
  "bannedUntil": "ISO date string (optional)",
  "message": "string (if banned)"
}
```

---

## 10. Ban Appeals API

**Collection:** `banAppeals`

### Required for CREATE:
```json
{
  "visitorMask": "string",
  "reason": "string (20-1000 chars)",
  "contactEmail": "string (valid email)"
}
```

### Admin Review (PUT):
```json
{
  "id": "string (REQUIRED)",
  "status": "approved|rejected (REQUIRED)",
  "adminNotes": "string (optional)",
  "reviewedBy": "string (optional)"
}
```

### Fields:
- `id`, `visitorMask`, `reason`, `contactEmail`
- `status`: pending|approved|rejected
- `adminNotes`, `reviewedBy`, `reviewedAt`
- `createdAt`, `updatedAt`

---

## Common Patterns

### Soft Delete
Most resources support soft delete via `?soft=true` query parameter:
- Moves item to `recycleBin` collection
- Sets 15-day expiry
- Preserves original data for recovery

### Active/Inactive Toggle
Resources with `isActive` field:
- `GET` with `?admin=true` returns all items
- `GET` without admin flag returns only `isActive: true` items

### Ordering
Resources with `order` field:
- Auto-assigned based on current count if not provided
- Can be explicitly set during CREATE or UPDATE
- Results sorted by `order` ASC

### Timestamps
All resources have:
- `createdAt`: Set on creation
- `updatedAt`: Updated on each modification

### UUID vs Mask
- **UUID:** Internal identifier (document ID in Firestore)
- **Mask:** Public-facing identifier for visitors
- Translation handled by `uuid-sync` system

---

## Rate Limiting Summary

| Endpoint Category | Limit |
|-------------------|-------|
| General API | 100 req/min |
| Chat Polling (GET messages) | 60 req/min |
| Chat Messages (POST) | 30 req/min |
| Bubble Sessions | 30 req/min |
| Contact Submissions | 3/email/day, 5/IP/hour |
| Bug Reports | 3/email/day, 5/IP/hour |

Rate limit headers:
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1635724800
```

---

## Testing Checklist

### For Each Resource:
- ✅ **CREATE:** Valid data, missing required fields, invalid formats
- ✅ **READ:** Fetch all, fetch by ID, admin vs. public view
- ✅ **UPDATE:** Valid data, non-existent ID, partial updates
- ✅ **DELETE:** Soft delete, hard delete, non-existent ID
- ✅ **Validation:** Field length limits, data types, required fields
- ✅ **Ordering:** Auto-assignment, explicit ordering, sorting
- ✅ **Max Limits:** Try exceeding maximum item count
- ✅ **Batch Ops:** Test batch creates (testimonials)
- ✅ **Error Handling:** Verify error response formats
- ✅ **Rate Limiting:** Test rate limit enforcement

---

## Quick Test Examples

### Create Tech Stack
```bash
curl -X POST http://localhost:3000/api/tech-stacks \
  -H "Content-Type: application/json" \
  -d '{"name": "TypeScript"}'
```

### Get All Projects
```bash
curl http://localhost:3000/api/projects
```

### Update Testimonial
```bash
curl -X PUT http://localhost:3000/api/testimonials \
  -H "Content-Type: application/json" \
  -d '{"id": "abc123", "isActive": false}'
```

### Delete Work Experience (Soft)
```bash
curl -X DELETE "http://localhost:3000/api/work-experience?soft=true" \
  -H "Content-Type: application/json" \
  -d '{"id": "xyz789"}'
```

### Ban Visitor
```bash
curl -X POST http://localhost:3000/api/visitor-analytics/ban \
  -H "Content-Type: application/json" \
  -d '{"mask": "visitor123", "reason": "Spam", "duration": "1day"}'
```

### Send Bubble Message
```bash
curl -X POST http://localhost:3000/api/bubble/messages \
  -H "Content-Type: application/json" \
  -d '{"sessionId": "uuid-here", "role": "admin", "content": "Hello!"}'
```

---

## Error Response Format

### 400 - Validation Error
```json
{
  "success": false,
  "error": "Validation failed",
  "validationErrors": [
    {"field": "name", "message": "Name is required"}
  ]
}
```

### 404 - Not Found
```json
{
  "success": false,
  "error": "Item not found"
}
```

### 429 - Rate Limit
```json
{
  "success": false,
  "error": "Rate limit exceeded. Please try again later.",
  "retryAfter": 60
}
```

### 500 - Server Error
```json
{
  "success": false,
  "error": "Failed to perform operation",
  "details": "Detailed error message"
}
```

---

## Collection Names Reference

| Resource | Firestore Collection |
|----------|---------------------|
| Tech Stacks | `portfolio_techStacks` |
| Projects | `portfolio_projects` |
| Testimonials | `portfolio_testimonials` |
| Work Experience | `portfolio_workExperience` |
| Currently Working | `portfolio_currentlyWorking` |
| Contact Submissions | `contactSubmissions` |
| Bug Reports | `bugReports` |
| Bubble Sessions | `og_uuid_sessions` |
| Bubble Messages | `bubbleMessages` |
| Bubble Questions | `bubblePredefinedQuestions` |
| Visitor Analytics | `og_uuid_visitorProfiles` |
| Ban Appeals | `banAppeals` |
| Recycle Bin | `recycleBin` |

---

## Next Steps for Testing

1. **Create Test Suite:** Use the testing checklist above
2. **Generate Test Data:** Create realistic sample data for each resource
3. **Test CRUD Operations:** Verify all create, read, update, delete operations
4. **Test Edge Cases:** Invalid data, missing fields, max limits
5. **Test Rate Limiting:** Verify rate limits are enforced
6. **Test Soft Deletes:** Verify recycle bin functionality
7. **Test Admin vs. Public:** Verify active/inactive filtering
8. **Performance Testing:** Load testing for concurrent requests
9. **Security Testing:** Attempt unauthorized access, SQL injection, XSS
10. **Integration Testing:** Test end-to-end workflows (e.g., visitor ban flow)

---

**Last Updated:** November 25, 2025
**Version:** 1.0.0
