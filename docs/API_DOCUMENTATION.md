# Complete API Documentation for Portfolio Admin Panel

This document provides comprehensive details for all API routes in the application, including request/response schemas, required fields, validation rules, and authentication requirements.

---

## 1. Tech Stacks API (`/api/tech-stacks`)

### GET - Fetch all tech stacks
**Endpoint:** `GET /api/tech-stacks`
**Auth Required:** No
**Query Parameters:**
- `admin` (optional): `"true"` to fetch all items including inactive ones

**Response:**
```json
{
  "success": true,
  "items": [
    {
      "id": "string",
      "name": "string",
      "order": "number",
      "isActive": "boolean",
      "createdAt": "ISO date string",
      "updatedAt": "ISO date string"
    }
  ],
  "count": "number"
}
```

### POST - Create new tech stack
**Endpoint:** `POST /api/tech-stacks`
**Auth Required:** No (should be protected in production)

**Request Body:**
```json
{
  "name": "string (REQUIRED, 2-30 chars)",
  "order": "number (optional, auto-assigned if omitted)",
  "isActive": "boolean (optional, defaults to true)"
}
```

**Validation Rules:**
- `name`: Required, 2-30 characters
- `order`: Optional, auto-assigned based on current count
- `isActive`: Optional, defaults to `true`
- Max limit: 20 tech stacks total

**Response (201):**
```json
{
  "success": true,
  "item": { /* TechStack object */ },
  "message": "Tech stack created successfully"
}
```

### PUT - Update tech stack
**Endpoint:** `PUT /api/tech-stacks`
**Auth Required:** No (should be protected in production)

**Request Body:**
```json
{
  "id": "string (REQUIRED)",
  "name": "string (optional, 2-30 chars)",
  "order": "number (optional)",
  "isActive": "boolean (optional)"
}
```

**Response (200):**
```json
{
  "success": true,
  "item": { /* Updated TechStack object */ },
  "message": "Tech stack updated successfully"
}
```

### DELETE - Delete tech stack
**Endpoint:** `DELETE /api/tech-stacks?id={id}&soft={true|false}`
**Auth Required:** No (should be protected in production)

**Query Parameters:**
- `id` (required): Tech stack ID
- `soft` (optional): `"true"` for soft delete (move to recycle bin), `"false"` for hard delete

**Response (200):**
```json
{
  "success": true,
  "message": "Tech stack moved to recycle bin" // or "Tech stack deleted successfully"
}
```

---

## 2. Projects API (`/api/projects`)

### GET - Fetch all projects
**Endpoint:** `GET /api/projects`
**Auth Required:** No

**Response:**
```json
{
  "success": true,
  "projects": [
    {
      "id": "string",
      "title": "string",
      "des": "string",
      "img": "string (URL)",
      "images": ["string (URLs)"] || [],
      "iconLists": ["string (URLs)"],
      "link": "string (URL)",
      "order": "number",
      "isActive": "boolean",
      "createdAt": "ISO date string",
      "updatedAt": "ISO date string"
    }
  ],
  "count": "number"
}
```

### POST - Create new project
**Endpoint:** `POST /api/projects`
**Auth Required:** No (should be protected in production)

**Request Body:**
```json
{
  "title": "string (REQUIRED, 3-100 chars)",
  "des": "string (REQUIRED, 10-500 chars)",
  "img": "string (REQUIRED, valid URL)",
  "images": ["string (URLs)"] (optional),
  "iconLists": ["string (URLs)"] (REQUIRED, 1-10 items),
  "link": "string (REQUIRED, valid URL)",
  "order": "number (optional, auto-assigned)",
  "isActive": "boolean (optional, defaults to true)"
}
```

**Validation Rules:**
- `title`: Required, 3-100 characters
- `des`: Required, 10-500 characters (description)
- `img`: Required, valid URL
- `images`: Optional array of URLs for slideshow
- `iconLists`: Required array, 1-10 technology icon URLs
- `link`: Required, valid URL
- `order`: Optional, auto-assigned (1-10)
- `isActive`: Optional, defaults to `true`
- Max limit: 10 projects total

**Response (201):**
```json
{
  "success": true,
  "project": { /* Project object */ },
  "message": "Project created successfully"
}
```

### PUT - Update project
**Endpoint:** `PUT /api/projects`
**Auth Required:** No (should be protected in production)

**Request Body:**
```json
{
  "id": "string (REQUIRED)",
  "title": "string (optional, 3-100 chars)",
  "des": "string (optional, 10-500 chars)",
  "img": "string (optional, valid URL)",
  "images": ["string (URLs)"] (optional),
  "iconLists": ["string (URLs)"] (optional, 1-10 items)",
  "link": "string (optional, valid URL)",
  "order": "number (optional)",
  "isActive": "boolean (optional)"
}
```

**Response (200):**
```json
{
  "success": true,
  "project": { /* Updated Project object */ },
  "message": "Project updated successfully"
}
```

### DELETE - Delete project
**Endpoint:** `DELETE /api/projects?id={id}&soft={true|false}`
**Auth Required:** No (should be protected in production)

**Query Parameters:**
- `id` (required): Project ID (can also be sent in request body)
- `soft` (optional): `"true"` for soft delete (move to recycle bin)

**Response (200):**
```json
{
  "success": true,
  "message": "Project moved to recycle bin" // or "Project deleted successfully"
}
```

---

## 3. Testimonials API (`/api/testimonials`)

### GET - Fetch all testimonials
**Endpoint:** `GET /api/testimonials`
**Auth Required:** No

**Response:**
```json
{
  "success": true,
  "testimonials": [
    {
      "id": "string",
      "quote": "string",
      "name": "string",
      "title": "string",
      "img": "string (URL, optional)",
      "order": "number",
      "isActive": "boolean",
      "createdAt": "ISO date string",
      "updatedAt": "ISO date string"
    }
  ],
  "count": "number"
}
```

### POST - Create new testimonial(s)
**Endpoint:** `POST /api/testimonials`
**Auth Required:** No (should be protected in production)

**Request Body (Single):**
```json
{
  "quote": "string (REQUIRED, 20-500 chars)",
  "name": "string (REQUIRED, 2-50 chars)",
  "title": "string (REQUIRED, 2-100 chars)",
  "img": "string (optional, URL)",
  "order": "number (optional, auto-assigned)",
  "isActive": "boolean (optional, defaults to true)"
}
```

**Request Body (Batch):**
```json
[
  {
    "quote": "string (REQUIRED, 20-500 chars)",
    "name": "string (REQUIRED, 2-50 chars)",
    "title": "string (REQUIRED, 2-100 chars)",
    "img": "string (optional, URL)",
    "order": "number (optional, auto-assigned)",
    "isActive": "boolean (optional, defaults to true)"
  }
]
```

**Validation Rules:**
- `quote`: Required, 20-500 characters
- `name`: Required, 2-50 characters
- `title`: Required, 2-100 characters (job title)
- `img`: Optional, valid URL for person's photo
- `order`: Optional, auto-assigned
- `isActive`: Optional, defaults to `true`
- Max limit: 20 testimonials total
- Supports batch creation (array of testimonials)

**Response (201):**
```json
{
  "success": true,
  "testimonials": { /* Testimonial object(s) */ },
  "message": "Testimonial created successfully" // or "N testimonials created successfully"
}
```

### PUT - Update testimonial
**Endpoint:** `PUT /api/testimonials`
**Auth Required:** No (should be protected in production)

**Request Body:**
```json
{
  "id": "string (REQUIRED)",
  "quote": "string (optional, 20-500 chars)",
  "name": "string (optional, 2-50 chars)",
  "title": "string (optional, 2-100 chars)",
  "img": "string (optional, URL)",
  "order": "number (optional)",
  "isActive": "boolean (optional)"
}
```

**Response (200):**
```json
{
  "success": true,
  "testimonial": { /* Updated Testimonial object */ },
  "message": "Testimonial updated successfully"
}
```

### DELETE - Delete testimonial
**Endpoint:** `DELETE /api/testimonials?id={id}&soft={true|false}`
**Auth Required:** No (should be protected in production)

**Query Parameters:**
- `id` (required): Testimonial ID
- `soft` (optional): `"true"` for soft delete (move to recycle bin)

**Response (200):**
```json
{
  "success": true,
  "message": "Testimonial moved to recycle bin" // or "Testimonial deleted successfully"
}
```

---

## 4. Work Experience API (`/api/work-experience`)

### GET - Fetch all work experiences
**Endpoint:** `GET /api/work-experience`
**Auth Required:** No

**Response:**
```json
{
  "success": true,
  "workExperiences": [
    {
      "id": "string",
      "title": "string",
      "desc": "string",
      "thumbnail": "string (URL)",
      "company": "string (optional)",
      "duration": "string (optional)",
      "location": "string (optional)",
      "order": "number",
      "isActive": "boolean",
      "createdAt": "ISO date string",
      "updatedAt": "ISO date string"
    }
  ],
  "count": "number"
}
```

### POST - Create new work experience
**Endpoint:** `POST /api/work-experience`
**Auth Required:** No (should be protected in production)

**Request Body:**
```json
{
  "title": "string (REQUIRED, 3-150 chars)",
  "desc": "string (REQUIRED, 10-500 chars)",
  "thumbnail": "string (REQUIRED, valid URL or data URI)",
  "company": "string (optional)",
  "duration": "string (optional, e.g. '2020 - 2021')",
  "location": "string (optional)",
  "order": "number (optional, auto-assigned 1-10)",
  "isActive": "boolean (optional, defaults to true)"
}
```

**Validation Rules:**
- `title`: Required, 3-150 characters
- `desc`: Required, 10-500 characters (description)
- `thumbnail`: Required, valid URL or data URI for icon/image
- `company`: Optional, company name
- `duration`: Optional, duration string
- `location`: Optional, location string
- `order`: Optional, auto-assigned (1-10)
- `isActive`: Optional, defaults to `true`
- Max limit: 10 work experiences total

**Response (201):**
```json
{
  "success": true,
  "workExperience": { /* WorkExperience object */ },
  "message": "Work experience created successfully"
}
```

### PUT - Update work experience
**Endpoint:** `PUT /api/work-experience`
**Auth Required:** No (should be protected in production)

**Request Body:**
```json
{
  "id": "string (REQUIRED)",
  "title": "string (optional, 3-150 chars)",
  "desc": "string (optional, 10-500 chars)",
  "thumbnail": "string (optional, valid URL or data URI)",
  "company": "string (optional)",
  "duration": "string (optional)",
  "location": "string (optional)",
  "order": "number (optional)",
  "isActive": "boolean (optional)"
}
```

**Response (200):**
```json
{
  "success": true,
  "workExperience": { /* Updated WorkExperience object */ },
  "message": "Work experience updated successfully"
}
```

### DELETE - Delete work experience
**Endpoint:** `DELETE /api/work-experience`
**Auth Required:** No (should be protected in production)

**Request Body:**
```json
{
  "id": "string (REQUIRED)"
}
```

**Query Parameters:**
- `soft` (optional): `"true"` for soft delete (move to recycle bin)

**Response (200):**
```json
{
  "success": true,
  "message": "Work experience moved to recycle bin" // or "Work experience deleted successfully"
}
```

---

## 5. Currently Working API (`/api/currently-working`)

### GET - Fetch currently working item(s)
**Endpoint:** `GET /api/currently-working`
**Auth Required:** No

**Query Parameters:**
- `admin` (optional): `"true"` to fetch all items, `"false"` to fetch only active item (default)

**Response (Admin view):**
```json
{
  "success": true,
  "items": [
    {
      "id": "string",
      "headingTitle": "string",
      "title": "string",
      "description": "string",
      "blogContent": "string",
      "images": ["string (URLs)"],
      "iconLists": ["string (URLs)"],
      "githubLink": "string (URL)",
      "liveLink": "string (URL)",
      "isActive": "boolean",
      "showBlogNotification": "boolean",
      "createdAt": "ISO date string",
      "updatedAt": "ISO date string"
    }
  ],
  "count": "number"
}
```

**Response (Frontend view):**
```json
{
  "success": true,
  "item": { /* Single active CurrentlyWorking object or null */ }
}
```

### POST - Create new currently working item
**Endpoint:** `POST /api/currently-working`
**Auth Required:** No (should be protected in production)

**Request Body:**
```json
{
  "headingTitle": "string (REQUIRED, 3-50 chars)",
  "title": "string (REQUIRED, 5-100 chars)",
  "description": "string (REQUIRED, 10-300 chars)",
  "blogContent": "string (optional, max 10000 chars)",
  "images": ["string (URLs)"] (optional, max 5),
  "iconLists": ["string (URLs)"] (REQUIRED, 1-10 items),
  "githubLink": "string (optional, valid URL)",
  "liveLink": "string (optional, valid URL)",
  "isActive": "boolean (optional, defaults to false)",
  "showBlogNotification": "boolean (optional, defaults to false)"
}
```

**Validation Rules:**
- `headingTitle`: Required, 3-50 characters (e.g., "Currently Working")
- `title`: Required, 5-100 characters
- `description`: Required, 10-300 characters
- `blogContent`: Optional, max 10,000 characters
- `images`: Optional array, max 5 image URLs
- `iconLists`: Required array, 1-10 technology icon URLs
- `githubLink`: Optional, valid URL
- `liveLink`: Optional, valid URL
- `isActive`: Optional, defaults to `false`
- `showBlogNotification`: Optional, defaults to `false`

**Response (201):**
```json
{
  "success": true,
  "item": { /* CurrentlyWorking object */ },
  "message": "Currently working item created successfully"
}
```

### PUT - Update currently working item
**Endpoint:** `PUT /api/currently-working`
**Auth Required:** No (should be protected in production)

**Request Body:**
```json
{
  "id": "string (REQUIRED)",
  "headingTitle": "string (optional, 3-50 chars)",
  "title": "string (optional, 5-100 chars)",
  "description": "string (optional, 10-300 chars)",
  "blogContent": "string (optional, max 10000 chars)",
  "images": ["string (URLs)"] (optional, max 5),
  "iconLists": ["string (URLs)"] (optional, 1-10 items)",
  "githubLink": "string (optional, valid URL)",
  "liveLink": "string (optional, valid URL)",
  "isActive": "boolean (optional)",
  "showBlogNotification": "boolean (optional)"
}
```

**Response (200):**
```json
{
  "success": true,
  "item": { /* Updated CurrentlyWorking object */ },
  "message": "Currently working item updated successfully"
}
```

### DELETE - Delete currently working item
**Endpoint:** `DELETE /api/currently-working?id={id}&soft={true|false}`
**Auth Required:** No (should be protected in production)

**Query Parameters:**
- `id` (required): Item ID
- `soft` (optional): `"true"` for soft delete (move to recycle bin)

---

## 6. Contact Submissions API (`/api/contact-submissions`)

**Note:** This is a READ-ONLY API from admin perspective. Submissions are created by visitors via the contact form.

### GET - Fetch all contact submissions
**Endpoint:** `GET /api/contact-submissions`
**Auth Required:** No (should be protected in production)

**Response:**
```json
{
  "success": true,
  "submissions": [
    {
      "id": "string",
      "name": "string",
      "email": "string",
      "message": "string",
      "phone": "string (optional)",
      "subject": "string (optional)",
      "status": "string (new|read|replied|archived)",
      "isRead": "boolean",
      "replied": "boolean",
      "repliedAt": "ISO date string (optional)",
      "adminNotes": "string (optional)",
      "ipAddress": "string",
      "fingerprint": "string",
      "spamScore": "number",
      "createdAt": "ISO date string",
      "updatedAt": "ISO date string"
    }
  ],
  "count": "number"
}
```

### DELETE - Delete contact submission
**Endpoint:** `DELETE /api/contact-submissions?id={id}`
**Auth Required:** No (should be protected in production)

**Query Parameters:**
- `id` (required): Submission ID

**Response (200):**
```json
{
  "success": true,
  "message": "Contact submission deleted successfully"
}
```

### Rate Limits (for visitor submissions via POST):
- 3 submissions per email per 24 hours
- 5 submissions per IP address per hour
- Spam score detection enabled
- Turnstile captcha verification required

---

## 7. Bug Reports API (`/api/bug-reports`)

**Note:** Bug reports are created by visitors. Admins can read, update status, add notes, and delete.

### GET - Fetch all bug reports or single report
**Endpoint:** `GET /api/bug-reports` (all reports)
**Endpoint:** `GET /api/bug-reports?id={id}` (single report)
**Auth Required:** No (should be protected in production)

**Response (All reports):**
```json
{
  "success": true,
  "bugReports": [
    {
      "id": "string",
      "reporterName": "string",
      "reporterEmail": "string",
      "title": "string",
      "severity": "string (low|medium|high|critical)",
      "stepsToReproduce": "string",
      "actualBehavior": "string",
      "expectedBehavior": "string",
      "category": "string (ui|functionality|performance|security|other)",
      "url": "string (URL where bug occurred)",
      "browserInfo": "string",
      "userAgent": "string",
      "ipAddress": "string",
      "fingerprint": "string",
      "spamScore": "number",
      "status": "string (new|in-progress|resolved|duplicate|wont-fix)",
      "attachments": [
        {
          "id": "string",
          "fileName": "string",
          "fileSize": "number",
          "fileType": "string",
          "url": "string",
          "uploadedAt": "ISO date string"
        }
      ],
      "adminNotes": [
        {
          "note": "string",
          "createdBy": "string",
          "createdAt": "ISO date string"
        }
      ],
      "assignedTo": "string (optional)",
      "resolvedAt": "ISO date string (optional)",
      "resolvedBy": "string (optional)",
      "duplicateOf": "string (optional, reference to another bug ID)",
      "createdAt": "ISO date string",
      "updatedAt": "ISO date string"
    }
  ],
  "count": "number"
}
```

**Response (Single report):**
```json
{
  "success": true,
  "bugReport": { /* Single BugReport object */ }
}
```

### PUT - Update bug report (status, notes, assignment)
**Endpoint:** `PUT /api/bug-reports`
**Auth Required:** No (should be protected in production)

**Request Body:**
```json
{
  "id": "string (REQUIRED)",
  "status": "string (optional: new|in-progress|resolved|duplicate|wont-fix)",
  "adminNotes": [
    {
      "note": "string",
      "createdBy": "string (admin identifier)",
      "createdAt": "ISO date string"
    }
  ] (optional),
  "assignedTo": "string (optional)",
  "resolvedBy": "string (optional)",
  "duplicateOf": "string (optional, bug ID reference)"
}
```

**Response (200):**
```json
{
  "success": true,
  "bugReport": { /* Updated BugReport object */ },
  "message": "Bug report updated successfully"
}
```

### DELETE - Delete bug report
**Endpoint:** `DELETE /api/bug-reports?id={id}`
**Auth Required:** No (should be protected in production)

**Query Parameters:**
- `id` (required): Bug report ID

**Response (200):**
```json
{
  "success": true,
  "message": "Bug report deleted successfully"
}
```

### Rate Limits (for visitor submissions):
- 3 bug reports per email per 24 hours
- 5 bug reports per IP address per hour
- File attachments: Max 5 files, 5MB each
- Spam score detection enabled

---

## 8. Bubble Management APIs

### 8.1 Sessions API (`/api/bubble/sessions`)

#### GET - Fetch session(s)
**Endpoint:** `GET /api/bubble/sessions` (admin: all sessions)
**Endpoint:** `GET /api/bubble/sessions?mask={mask}` (visitor: specific session by mask)
**Auth Required:** No

**Query Parameters:**
- `allSessions` (optional): `"true"` to fetch all sessions (admin)
- `mask` (optional): Session mask to fetch specific session (visitor)
- `fingerprint` (optional): Device fingerprint for rate limiting

**Response (Admin - all sessions):**
```json
{
  "success": true,
  "sessions": [
    {
      "id": "string (UUID)",
      "mask": "string (visitor's mask)",
      "deviceFingerprint": "string",
      "visitorEmail": "string (optional)",
      "startedAt": "ISO date string",
      "lastActive": "ISO date string",
      "messageCount": "number",
      "unreadAdminReplies": "number",
      "unreadVisitorMessages": "number",
      "hasUnreadMessages": "boolean",
      "hasUnreadTooltip": "boolean",
      "visitorOnline": "boolean",
      "adminOnline": "boolean",
      "visitorLastSeen": "ISO date string (optional)",
      "adminLastSeen": "ISO date string (optional)",
      "status": "string (pending|active|closed)",
      "deletedAt": "null"
    }
  ]
}
```

**Response (Visitor - single session):**
```json
{
  "session": {
    "id": "string (UUID)",
    "mask": "string",
    "role": "string (visitor)",
    "status": "string (pending|active|closed)",
    "visitorEmail": "string (optional)",
    "deviceFingerprint": "string",
    "startedAt": "ISO date string",
    "lastActive": "ISO date string",
    "messageCount": "number",
    "unreadAdminReplies": "number",
    "unreadVisitorMessages": "number",
    "hasUnreadTooltip": "boolean",
    "visitorOnline": "boolean",
    "adminOnline": "boolean"
  }
}
```

#### POST - Create new session
**Endpoint:** `POST /api/bubble/sessions`
**Auth Required:** No

**Request Body:**
```json
{
  "mask": "string (REQUIRED, visitor's session mask)",
  "role": "string (optional, defaults to 'visitor')"
}
```

**Response (201):**
```json
{
  "success": true,
  "session": {
    "id": "string (UUID)",
    "mask": "string",
    "role": "string",
    "status": "string",
    "startedAt": "ISO date string",
    "lastActive": "ISO date string",
    "messageCount": 0,
    "unreadAdminReplies": 0,
    "unreadVisitorMessages": 0,
    "hasUnreadTooltip": false,
    "visitorOnline": true,
    "adminOnline": false
  }
}
```

#### PUT - Update session (status, metadata)
**Endpoint:** `PUT /api/bubble/sessions`
**Auth Required:** No

**Request Body:**
```json
{
  "sessionId": "string (REQUIRED, UUID)",
  "status": "string (optional: pending|active|closed)",
  "visitorEmail": "string (optional)",
  "adminOnline": "boolean (optional)",
  "visitorOnline": "boolean (optional)"
}
```

#### DELETE - Soft delete session
**Endpoint:** `DELETE /api/bubble/sessions?sessionId={uuid}`
**Auth Required:** No (should be protected in production)

**Query Parameters:**
- `sessionId` (required): Session UUID

---

### 8.2 Messages API (`/api/bubble/messages`)

#### GET - Fetch messages for a session
**Endpoint:** `GET /api/bubble/messages?sessionId={uuid}&role={role}&limit={limit}`
**Auth Required:** No

**Query Parameters:**
- `sessionId` (required): Session UUID
- `role` (optional): `"visitor"` or `"admin"` to auto-mark messages as delivered
- `limit` (optional): Number of messages to fetch (default: 50)
- `fingerprint` (optional): Device fingerprint for rate limiting

**Response:**
```json
{
  "messages": [
    {
      "id": "string (UUID)",
      "sessionId": "string (UUID)",
      "role": "string (visitor|admin)",
      "content": "string",
      "timestamp": "ISO date string",
      "read": "boolean",
      "delivered": "boolean",
      "readAt": "ISO date string (optional)",
      "deliveredAt": "ISO date string (optional)",
      "visitorEmail": "string (optional)"
    }
  ],
  "hasMore": "boolean",
  "totalCount": "number",
  "adminTyping": "boolean",
  "visitorTyping": "boolean",
  "adminLastSeen": "ISO date string (optional)",
  "visitorLastSeen": "ISO date string (optional)",
  "adminOnline": "boolean",
  "visitorOnline": "boolean",
  "visitorUnread": "number",
  "adminUnread": "number"
}
```

#### POST - Send new message
**Endpoint:** `POST /api/bubble/messages`
**Auth Required:** No

**Request Body:**
```json
{
  "sessionId": "string (REQUIRED, UUID)",
  "role": "string (REQUIRED: visitor|admin)",
  "content": "string (REQUIRED, non-empty)",
  "visitorEmail": "string (optional)",
  "fingerprint": "string (optional)",
  "turnstileToken": "string (optional, for visitor messages)"
}
```

**Validation Rules:**
- `sessionId`: Required, valid UUID
- `role`: Required, must be `"visitor"` or `"admin"`
- `content`: Required, non-empty after trimming
- Rate limits apply

**Response (201):**
```json
{
  "success": true,
  "message": {
    "id": "string (UUID)",
    "sessionId": "string (UUID)",
    "role": "string",
    "content": "string",
    "timestamp": "ISO date string",
    "read": false,
    "delivered": false,
    "readAt": null,
    "deliveredAt": null,
    "visitorEmail": "string (optional)"
  }
}
```

#### PUT - Mark message as read
**Endpoint:** `PUT /api/bubble/messages`
**Auth Required:** No

**Request Body:**
```json
{
  "messageId": "string (REQUIRED, custom UUID)",
  "role": "string (REQUIRED, reader role: visitor|admin)"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Message marked as read"
}
```

#### DELETE - Delete message (soft delete)
**Endpoint:** `DELETE /api/bubble/messages?messageId={id}&sessionId={uuid}`
**Auth Required:** No (should be protected in production)

**Query Parameters:**
- `messageId` (required): Message custom UUID
- `sessionId` (required): Session UUID

---

### 8.3 Questions API (`/api/bubble/questions`)

Predefined questions for quick responses in bubble chat.

#### GET - Fetch all active questions
**Endpoint:** `GET /api/bubble/questions`
**Auth Required:** No

**Query Parameters:**
- `includeInactive` (optional): `"true"` to include inactive questions (admin view)

**Response:**
```json
{
  "success": true,
  "questions": [
    {
      "id": "string (UUID)",
      "question": "string",
      "answer": "string",
      "order": "number",
      "active": "boolean",
      "createdAt": "ISO date string",
      "updatedAt": "ISO date string"
    }
  ]
}
```

#### POST - Create new predefined question
**Endpoint:** `POST /api/bubble/questions`
**Auth Required:** No (should be protected in production)

**Request Body:**
```json
{
  "question": "string (REQUIRED)",
  "answer": "string (REQUIRED)",
  "order": "number (optional, defaults to 0)"
}
```

**Response (201):**
```json
{
  "success": true,
  "question": {
    "id": "string (UUID)",
    "question": "string",
    "answer": "string",
    "order": "number",
    "active": true,
    "createdAt": "ISO date string",
    "updatedAt": "ISO date string"
  }
}
```

#### PUT - Update predefined question
**Endpoint:** `PUT /api/bubble/questions`
**Auth Required:** No (should be protected in production)

**Request Body:**
```json
{
  "id": "string (REQUIRED)",
  "question": "string (optional)",
  "answer": "string (optional)",
  "order": "number (optional)",
  "active": "boolean (optional)"
}
```

**Response (200):**
```json
{
  "success": true
}
```

#### DELETE - Delete predefined question
**Endpoint:** `DELETE /api/bubble/questions?questionId={id}&permanent={true|false}`
**Auth Required:** No (should be protected in production)

**Query Parameters:**
- `questionId` (required): Question UUID
- `permanent` (optional): `"true"` for hard delete, `"false"` for soft delete (default)

**Response (200):**
```json
{
  "success": true
}
```

---

## 9. Visitor Analytics APIs

### 9.1 List Visitors (`/api/visitor-analytics/visitors`)

**Endpoint:** `GET /api/visitor-analytics/visitors`
**Auth Required:** No (should be protected in production)

**Response:**
```json
{
  "success": true,
  "visitors": [
    {
      "id": "string (UUID)",
      "mask": "string",
      "firstSeen": "ISO date string",
      "lastSeen": "ISO date string",
      "visitCount": "number",
      "pageViews": "number",
      "deviceFingerprint": "string",
      "ipAddress": "string",
      "userAgent": "string",
      "isBanned": "boolean",
      "bannedReason": "string (optional)",
      "bannedAt": "ISO date string (optional)",
      "bannedBy": "string (optional)",
      "bannedUntil": "ISO date string (optional)",
      "country": "string (optional)",
      "city": "string (optional)",
      "region": "string (optional)"
    }
  ],
  "count": "number"
}
```

### 9.2 Ban Visitor (`/api/visitor-analytics/ban`)

**Endpoint:** `POST /api/visitor-analytics/ban`
**Auth Required:** No (should be protected in production)

**Request Body:**
```json
{
  "mask": "string (REQUIRED)",
  "reason": "string (optional)",
  "bannedBy": "string (optional, defaults to 'admin')",
  "duration": "string (optional: permanent|1hour|1day|1week|1month, defaults to 'permanent')"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Visitor banned successfully",
  "visitor": { /* Updated visitor object with ban details */ }
}
```

### 9.3 Unban Visitor (`/api/visitor-analytics/unban`)

**Endpoint:** `POST /api/visitor-analytics/unban`
**Auth Required:** No (should be protected in production)

**Request Body:**
```json
{
  "mask": "string (REQUIRED)"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Visitor unbanned successfully",
  "visitor": { /* Updated visitor object without ban */ }
}
```

### 9.4 Check Ban Status (`/api/visitor-analytics/check-ban`)

**Endpoint:** `GET /api/visitor-analytics/check-ban?mask={mask}`
**Auth Required:** No

**Query Parameters:**
- `mask` (required): Visitor mask

**Response:**
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

### GET - Fetch all ban appeals
**Endpoint:** `GET /api/ban-appeals`
**Auth Required:** No (should be protected in production)

**Response:**
```json
{
  "success": true,
  "appeals": [
    {
      "id": "string",
      "visitorMask": "string",
      "reason": "string",
      "contactEmail": "string",
      "status": "string (pending|approved|rejected)",
      "adminNotes": "string (optional)",
      "reviewedBy": "string (optional)",
      "reviewedAt": "ISO date string (optional)",
      "createdAt": "ISO date string",
      "updatedAt": "ISO date string"
    }
  ],
  "count": "number"
}
```

### POST - Create ban appeal (visitor)
**Endpoint:** `POST /api/ban-appeals`
**Auth Required:** No

**Request Body:**
```json
{
  "visitorMask": "string (REQUIRED)",
  "reason": "string (REQUIRED, 20-1000 chars)",
  "contactEmail": "string (REQUIRED, valid email)"
}
```

**Response (201):**
```json
{
  "success": true,
  "appeal": { /* BanAppeal object */ },
  "message": "Ban appeal submitted successfully"
}
```

### PUT - Review ban appeal (admin)
**Endpoint:** `PUT /api/ban-appeals`
**Auth Required:** No (should be protected in production)

**Request Body:**
```json
{
  "id": "string (REQUIRED)",
  "status": "string (REQUIRED: approved|rejected)",
  "adminNotes": "string (optional)",
  "reviewedBy": "string (optional, defaults to 'admin')"
}
```

**Response (200):**
```json
{
  "success": true,
  "appeal": { /* Updated BanAppeal object */ },
  "message": "Ban appeal reviewed successfully"
}
```

---

## Common Error Responses

### Validation Error (400)
```json
{
  "success": false,
  "error": "Validation failed",
  "validationErrors": [
    {
      "field": "string",
      "message": "string"
    }
  ]
}
```

### Not Found (404)
```json
{
  "success": false,
  "error": "Item not found"
}
```

### Rate Limit Exceeded (429)
```json
{
  "success": false,
  "error": "Rate limit exceeded. Please try again later.",
  "retryAfter": "number (seconds)"
}
```

### Server Error (500)
```json
{
  "success": false,
  "error": "Failed to perform operation",
  "details": "string (error message)"
}
```

---

## Rate Limiting

Different endpoints have different rate limits:

- **General API calls:** 100 requests per minute
- **Chat polling (GET /api/bubble/messages):** 60 requests per minute
- **Chat messages (POST /api/bubble/messages):** 30 requests per minute
- **Contact submissions:** 3 per email/day, 5 per IP/hour
- **Bug reports:** 3 per email/day, 5 per IP/hour
- **Bubble sessions:** 30 requests per minute

Rate limit headers are included in responses:
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1635724800
```

---

## Authentication & Security

**Current State:** Most APIs are currently open (no authentication required).

**Production Recommendations:**
1. Add Bearer token authentication for all admin APIs
2. Implement role-based access control (RBAC)
3. Use Firebase Admin SDK for server-side auth verification
4. Add CSRF protection for state-changing operations
5. Implement request signing for sensitive operations

**Example Auth Header:**
```
Authorization: Bearer <firebase-id-token>
```

---

## Testing Recommendations

For comprehensive testing, create test scripts that:

1. **CRUD Operations:** Test create, read, update, delete for each resource
2. **Validation:** Test field validation (required fields, length limits, format)
3. **Edge Cases:** Test with invalid IDs, missing fields, duplicate data
4. **Rate Limiting:** Test rate limit enforcement
5. **Soft Deletes:** Verify recycle bin functionality
6. **Batch Operations:** Test batch creates (testimonials)
7. **Filtering:** Test admin vs. public views (active/inactive items)
8. **Ordering:** Test order field and sorting
9. **Max Limits:** Test maximum item count enforcement
10. **Error Handling:** Verify error response formats

---

## API Testing Tools

Recommended tools for testing:
- **Postman:** For manual API testing
- **Jest + Supertest:** For automated API testing
- **k6 or Artillery:** For load testing and rate limit verification
- **Newman:** For running Postman collections in CI/CD

---

## Notes

1. All date fields return ISO 8601 format strings in responses
2. Firestore Timestamps are automatically converted to Date objects
3. Soft deletes move items to `recycleBin` collection with 15-day expiry
4. UUID-sync system translates masks to UUIDs for bubble sessions
5. Spam detection is enabled for contact forms and bug reports
6. File uploads use Firebase Storage with automatic URL generation
7. Real-time updates available via Firestore listeners (not REST endpoints)

---

**Last Updated:** November 25, 2025
**Version:** 1.0.0
