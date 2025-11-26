# API Documentation Index

This directory contains comprehensive documentation for all API routes in the portfolio application.

---

## Documentation Files

### 1. [API_DOCUMENTATION.md](./API_DOCUMENTATION.md)
**Complete API Reference**

The most comprehensive documentation covering:
- Detailed endpoint descriptions
- Request/response schemas with examples
- Validation rules and constraints
- Error response formats
- Rate limiting details
- Authentication requirements
- Testing recommendations

**Use this when:** You need detailed information about a specific API, including exact field requirements, validation rules, and response formats.

---

### 2. [API_QUICK_REFERENCE.md](./API_QUICK_REFERENCE.md)
**Quick Reference & Cheat Sheet**

A condensed reference guide with:
- Summary table of all endpoints
- Required fields at a glance
- Quick curl examples
- Testing checklist
- Common patterns (soft delete, ordering, etc.)
- Collection names reference

**Use this when:** You need a quick lookup for required fields, endpoint URLs, or want to quickly test an endpoint with curl.

---

### 3. [API_SCHEMAS.json](./API_SCHEMAS.json)
**Machine-Readable API Schemas**

JSON schema definitions for all APIs:
- Field types and constraints
- Required vs. optional fields
- Validation rules in JSON format
- Response structures
- Rate limit specifications

**Use this when:** Building automated tests, generating API clients, or need programmatic access to API specifications.

---

## API Overview by Category

### Portfolio Content APIs
Manage the main content displayed on the portfolio website:

- **Tech Stacks** (`/api/tech-stacks`) - Technology logos/icons in "My tech stack" section
- **Projects** (`/api/projects`) - Portfolio projects showcase
- **Testimonials** (`/api/testimonials`) - Client testimonials
- **Work Experience** (`/api/work-experience`) - Professional experience timeline
- **Currently Working** (`/api/currently-working`) - "The Inside Scoop" section for current projects

### User Engagement APIs
Handle visitor interactions and feedback:

- **Contact Submissions** (`/api/contact-submissions`) - Contact form submissions
- **Bug Reports** (`/api/bug-reports`) - Bug report system with attachments

### Bubble Chat System
Real-time chat bubble functionality:

- **Sessions** (`/api/bubble/sessions`) - Chat session management
- **Messages** (`/api/bubble/messages`) - Chat message handling
- **Questions** (`/api/bubble/questions`) - Predefined quick responses

### Visitor Management
Track and manage visitor behavior:

- **Visitor Analytics** (`/api/visitor-analytics/*`) - Visitor tracking and analytics
- **Ban Management** (`/api/visitor-analytics/ban`, `/unban`) - Visitor banning system
- **Ban Appeals** (`/api/ban-appeals`) - Ban appeal submissions and reviews

---

## Quick Start

### 1. Read the Documentation
Start with [API_QUICK_REFERENCE.md](./API_QUICK_REFERENCE.md) for a quick overview, then dive into [API_DOCUMENTATION.md](./API_DOCUMENTATION.md) for details on specific endpoints.

### 2. Test with cURL
Use the curl examples in the quick reference to test endpoints:

```bash
# Create a tech stack
curl -X POST http://localhost:3000/api/tech-stacks \
  -H "Content-Type: application/json" \
  -d '{"name": "TypeScript"}'

# Get all projects
curl http://localhost:3000/api/projects

# Ban a visitor
curl -X POST http://localhost:3000/api/visitor-analytics/ban \
  -H "Content-Type: application/json" \
  -d '{"mask": "visitor123", "reason": "Spam", "duration": "1day"}'
```

### 3. Build Test Scripts
Use [API_SCHEMAS.json](./API_SCHEMAS.json) to generate automated tests or build API clients.

---

## Key Concepts

### Authentication
**Current State:** Most APIs are open (no authentication required)

**Production Recommendation:** Implement Bearer token authentication for all admin operations:
```
Authorization: Bearer <firebase-id-token>
```

### Rate Limiting
Different endpoints have different rate limits:
- General API: 100 req/min
- Chat polling: 60 req/min
- Chat messages: 30 req/min
- Contact/bug submissions: 3/email/day, 5/IP/hour

### Soft Delete
Many resources support soft delete via `?soft=true`:
- Item moved to `recycleBin` collection
- 15-day expiry for recovery
- Original data preserved

### UUID vs Mask
- **UUID:** Internal identifier (Firestore document ID)
- **Mask:** Public-facing identifier for visitors
- Automatic translation via UUID-sync system

### Active/Inactive Items
Resources with `isActive` field:
- Admin view (`?admin=true`): Returns all items
- Public view: Returns only active items

---

## API Testing Workflow

### 1. Manual Testing (Postman/cURL)
- Use examples from [API_QUICK_REFERENCE.md](./API_QUICK_REFERENCE.md)
- Test CRUD operations for each resource
- Verify validation rules
- Check error responses

### 2. Automated Testing
```javascript
// Example using Jest + Supertest
import request from 'supertest';
import { API_SCHEMAS } from './docs/API_SCHEMAS.json';

describe('Tech Stacks API', () => {
  it('should create a tech stack', async () => {
    const response = await request(app)
      .post('/api/tech-stacks')
      .send({ name: 'TypeScript' })
      .expect(201);
    
    expect(response.body.success).toBe(true);
    expect(response.body.item.name).toBe('TypeScript');
  });
});
```

### 3. Load Testing
- Use k6 or Artillery for load testing
- Verify rate limits are enforced
- Check concurrent request handling

---

## Common Validation Rules

### String Length Constraints
| Field Type | Min | Max |
|------------|-----|-----|
| Tech Stack Name | 2 | 30 |
| Project Title | 3 | 100 |
| Project Description | 10 | 500 |
| Testimonial Quote | 20 | 500 |
| Testimonial Name | 2 | 50 |
| Work Experience Title | 3 | 150 |
| Currently Working Title | 5 | 100 |
| Bug Report Title | 5 | 200 |

### Array Constraints
| Field | Min Items | Max Items |
|-------|-----------|-----------|
| Project Icons | 1 | 10 |
| Currently Working Icons | 1 | 10 |
| Currently Working Images | 0 | 5 |
| Bug Report Attachments | 0 | 5 |

### Maximum Items
| Resource | Max Count |
|----------|-----------|
| Tech Stacks | 20 |
| Projects | 10 |
| Testimonials | 20 |
| Work Experiences | 10 |

---

## Error Handling

### Standard Error Response
```json
{
  "success": false,
  "error": "Error message",
  "details": "Detailed error information"
}
```

### Validation Error Response
```json
{
  "success": false,
  "error": "Validation failed",
  "validationErrors": [
    {
      "field": "name",
      "message": "Name must be at least 2 characters"
    }
  ]
}
```

### Rate Limit Error
```json
{
  "success": false,
  "error": "Rate limit exceeded. Please try again later.",
  "retryAfter": 60
}
```

---

## Security Considerations

### Current State
- No authentication on most endpoints
- Rate limiting in place
- Spam detection for forms
- Turnstile captcha for sensitive operations

### Production Recommendations
1. **Add Authentication:** Implement Firebase Auth for admin endpoints
2. **Role-Based Access:** Separate admin and visitor permissions
3. **CSRF Protection:** Add CSRF tokens for state-changing operations
4. **Input Sanitization:** Sanitize all user inputs
5. **SQL Injection Prevention:** Use parameterized queries (Firestore handles this)
6. **XSS Prevention:** Escape output in responses
7. **Request Signing:** Sign sensitive operations

---

## Firestore Collections Reference

| Resource | Collection Name |
|----------|----------------|
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
| Visitor Profiles | `og_uuid_visitorProfiles` |
| Ban Appeals | `banAppeals` |
| Recycle Bin | `recycleBin` |

---

## Testing Checklist

Use this checklist when testing any API:

- [ ] **CREATE:** Valid data creates resource successfully
- [ ] **CREATE:** Missing required fields returns 400 error
- [ ] **CREATE:** Invalid data types return validation errors
- [ ] **CREATE:** Exceeding max items returns error
- [ ] **READ:** Fetch all returns array of resources
- [ ] **READ:** Fetch by ID returns single resource
- [ ] **READ:** Non-existent ID returns 404
- [ ] **READ:** Admin vs. public views work correctly
- [ ] **UPDATE:** Valid data updates resource
- [ ] **UPDATE:** Missing ID returns 400 error
- [ ] **UPDATE:** Non-existent ID returns 404
- [ ] **UPDATE:** Partial updates work (only provided fields change)
- [ ] **DELETE:** Soft delete moves to recycle bin
- [ ] **DELETE:** Hard delete removes permanently
- [ ] **DELETE:** Non-existent ID returns 404
- [ ] **VALIDATION:** Field length limits enforced
- [ ] **VALIDATION:** Required fields enforced
- [ ] **VALIDATION:** Data types validated
- [ ] **VALIDATION:** URL formats validated
- [ ] **ORDERING:** Auto-assignment works
- [ ] **ORDERING:** Explicit ordering works
- [ ] **RATE LIMIT:** Rate limits enforced
- [ ] **ERROR:** Error responses follow standard format

---

## Support & Contribution

### Found an Issue?
- Check existing documentation first
- Submit bug report via `/api/bug-reports`
- Include API endpoint, request body, and error response

### Want to Contribute?
- Update documentation when adding new endpoints
- Follow existing naming conventions
- Add validation rules to types
- Update all three documentation files

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | 2025-11-25 | Initial comprehensive documentation |

---

## Additional Resources

- **Firebase Documentation:** https://firebase.google.com/docs
- **Next.js API Routes:** https://nextjs.org/docs/api-routes/introduction
- **REST API Best Practices:** https://restfulapi.net/

---

**Last Updated:** November 25, 2025
**Maintainer:** Portfolio Admin Team
