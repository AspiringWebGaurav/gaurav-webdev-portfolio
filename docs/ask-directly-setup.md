# Ask Me Directly - Deployment & Setup Guide

## Overview

The "Ask Me Directly" system is a real-time Q&A feature that allows portfolio visitors to ask questions directly to the admin, with live streaming answers and toast notifications.

## Architecture

```
Frontend (Portfolio)
├── AskDirectlyButton (floating widget)
├── AskDirectlyModal (Q&A interface)  
├── QuestionForm (submission)
└── QuestionsList (history with real-time updates)

Backend (API Routes)
├── /api/direct-questions (CRUD operations)
├── /api/direct-questions/mark-read (visitor mark-as-read)
└── /api/admin/direct-questions (admin bulk operations)

Admin Dashboard  
├── /admin/direct-questions (question management)
├── /admin/direct-questions/[id] (individual question details)
└── Admin navbar integration

Data Layer
├── Firestore collection: directQuestions
├── Security rules for visitor isolation
├── Real-time listeners for live updates
└── Composite indexes for efficient queries
```

## Prerequisites

- Firebase project with Firestore enabled
- Next.js application (App Router)
- Admin authentication system
- Visitor tracking system (UUID-based)

## Installation Steps

### 1. Deploy Firestore Security Rules

```bash
# Deploy security rules
firebase deploy --only firestore:rules

# Or manually upload firestore.rules via Firebase Console
```

### 2. Create Required Firestore Indexes

**Via Firebase Console:**
1. Go to Firestore → Indexes → Composite
2. Add these indexes:

```
Collection: directQuestions
├── visitorUuid (ASC) + createdAt (DESC) 
├── status (ASC) + createdAt (DESC)
├── visitorUuid (ASC) + status (ASC)
├── createdAt (DESC) [single field]
└── updatedAt (DESC) [single field]
```

**Via Firebase CLI:**
```bash
firebase firestore:indexes
# Add indexes to firestore.indexes.json then deploy
firebase deploy --only firestore:indexes
```

### 3. Set Up Admin Custom Claims

Add admin custom claims to Firebase Auth users:

```javascript
// Using Firebase Admin SDK
const admin = require('firebase-admin');

async function setAdminClaim(uid) {
  await admin.auth().setCustomUserClaims(uid, { admin: true });
  console.log('Admin claim set for user:', uid);
}
```

### 4. Environment Variables

Ensure these environment variables are set:

```env
# Firebase Client Config (already required)
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id  
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=your_measurement_id

# Firebase Admin SDK (optional for server routes)
FIREBASE_SERVICE_ACCOUNT_JSON=your_service_account_json
```

## Implementation Checklist

### ✅ Backend Implementation
- [x] API routes created (`/api/direct-questions/*`)
- [x] Admin API routes (`/api/admin/direct-questions/*`)  
- [x] Firestore security rules
- [x] TypeScript interfaces and types
- [x] Visitor UUID integration
- [x] Real-time listener setup
- [x] Rate limiting and validation

### 🔄 Frontend Integration (In Progress)
- [ ] Add AskDirectlyButton to main portfolio
- [ ] Admin dashboard pages
- [ ] Admin navbar integration
- [ ] Real-time toast notifications
- [ ] Error handling and retry logic

### 📋 Testing & Verification
- [ ] End-to-end question submission
- [ ] Real-time answer notifications  
- [ ] Admin reply functionality
- [ ] Security rule validation
- [ ] Cross-browser compatibility
- [ ] Mobile responsive design

## Usage Examples

### 1. Basic Integration

```tsx
// Add to main portfolio page
import { AskDirectlyButton } from '@/components/askDirectly';

export default function PortfolioPage() {
  return (
    <div>
      {/* Your portfolio content */}
      
      {/* Floating Ask Button */}
      <AskDirectlyButton
        position="bottom-right"
        size="md"
        showNotificationBadge={true}
        enableRealTime={true}
      />
    </div>
  );
}
```

### 2. Custom Modal Integration

```tsx
// Custom integration with existing UI
import { AskDirectlyModal, QuestionsList } from '@/components/askDirectly';

export default function ContactSection() {
  const [showModal, setShowModal] = useState(false);

  return (
    <div>
      <button onClick={() => setShowModal(true)}>
        Ask Me Directly
      </button>
      
      <AskDirectlyModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title="Ask Me Anything"
      />
    </div>
  );
}
```

### 3. Admin Dashboard Integration

```tsx
// Admin question management
import { AdminQuestionManager } from '@/components/admin';

export default function AdminDirectQuestions() {
  return (
    <AdminQuestionManager
      enableRealTime={true}
      defaultFilter="unanswered"
      bulkActionsEnabled={true}
    />
  );
}
```

## API Endpoints

### Public Endpoints (Visitor)

```typescript
// Submit new question
POST /api/direct-questions
{
  "question": "Your question here",
  "metadata": {
    "pagePath": "/portfolio",
    "referrer": "https://google.com"
  }
}

// Get visitor's questions
GET /api/direct-questions

// Mark questions as read
POST /api/direct-questions/mark-read
{
  "ids": ["questionId1", "questionId2"]
}
```

### Admin Endpoints

```typescript
// Get all questions (admin)
GET /api/admin/direct-questions?status=unanswered&limit=20

// Update question (admin)
PUT /api/direct-questions
{
  "questionId": "id",
  "adminReply": "Answer here",
  "status": "answered"
}

// Bulk operations (admin)
POST /api/admin/direct-questions
{
  "action": "bulk_reply",
  "questionIds": ["id1", "id2"],
  "data": { "reply": "Bulk answer" }
}
```

## Security Considerations

### 1. Visitor Data Isolation
- Questions are scoped to visitor UUID
- Security rules prevent cross-visitor access
- Server-side validation of visitor ownership

### 2. Admin Authentication  
- Custom claims for admin identification
- Session-based admin verification
- Audit logging for admin actions

### 3. Rate Limiting
- 10-second cooldown between questions
- 500-character question limit
- Spam detection and filtering

### 4. Data Privacy
- IP addresses are hashed
- PII is minimized in metadata
- GDPR-compliant data handling

## Performance Optimizations

### 1. Real-time Efficiency
- Focused Firebase listeners
- Conditional toast notifications
- Page visibility API integration

### 2. Caching Strategy
- Client-side question caching
- Optimistic UI updates
- Background synchronization

### 3. Bundle Optimization
- Lazy loading of modal components
- Tree-shaking of unused utilities
- Code splitting for admin features

## Troubleshooting

### Common Issues

**1. Questions Not Appearing**
```bash
# Check Firestore indexes
firebase firestore:indexes

# Verify security rules
firebase firestore:rules get
```

**2. Admin Access Denied**
```javascript
// Verify custom claims
const user = await admin.auth().getUser(uid);
console.log('Custom claims:', user.customClaims);
```

**3. Real-time Not Working**
- Check Firebase connection
- Verify listener setup
- Review browser console for errors

### Debug Mode

Enable debug logging:

```typescript
// In development
import { enableNetwork } from 'firebase/firestore';
import { db } from '@/lib/firebase';

// Enable detailed logging
if (process.env.NODE_ENV === 'development') {
  enableNetwork(db);
}
```

## Monitoring & Analytics

### 1. Question Metrics
- Submission rate tracking
- Response time monitoring  
- User engagement analysis

### 2. Performance Monitoring
- API response times
- Real-time listener latency
- Error rate tracking

### 3. Admin Analytics
- Question volume trends
- Admin response efficiency
- User satisfaction metrics

## Future Enhancements

### Planned Features
- [ ] Question categories and tagging
- [ ] File attachment support
- [ ] Advanced admin filters
- [ ] Question search functionality
- [ ] Email notifications for admins
- [ ] Question rating system
- [ ] Multi-language support
- [ ] Advanced analytics dashboard

### Integration Opportunities
- CRM system integration
- Slack/Discord notifications
- Automated response suggestions
- Knowledge base integration
- Video response capability

## Support & Maintenance

### Regular Tasks
- Monitor question volume and trends
- Review and update security rules
- Optimize database indexes
- Update rate limiting as needed
- Clean up old archived questions

### Emergency Procedures
- Rate limiting override process
- Spam question cleanup
- Security incident response
- Data export/backup procedures

---

## Contact

For technical support or questions about this implementation:
- **Developer**: Gaurav Patil
- **Documentation**: [Portfolio Ask Directly System]
- **Last Updated**: 2024-03-19

---

*This documentation covers the complete Ask Me Directly Q&A system implementation. Follow the checklist and verify each component before deploying to production.*