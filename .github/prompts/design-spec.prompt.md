---
agent: agent
---

# Claude Copilot Prompt: EcoClean Community Platform

I need you to build a comprehensive full-stack web application called **Hyrexa** - a community-driven platform for reducing plastic waste through gamified cleanup activities with AI-powered verification.

## Core Tech Stack Requirements

### Frontend
- **React 18+** with TypeScript
- **Tailwind CSS** for styling
- **shadcn/ui** for UI components
- **Leaflet + OpenStreetMap** for free, open-source interactive maps
- **Framer Motion** for animations
- **@react-oauth/google** for Google OAuth
- **React Router v6** for routing
- **TanStack Query (React Query)** for server state management
- **Zustand** or **Jotai** for client state management

### Backend
- **Node.js with Express**
- **Prisma ORM** with **PostgreSQL** database
- **MinIO** for object storage (images)
- **bcryptjs** for password hashing
- **jsonwebtoken** for JWT authentication
- **express-validator** for input validation
- **multer** for file uploads
- **axios** for HTTP requests

### AI/ML Integration
- **YOLO11** for image recognition (CPU-accelerated, no GPU dependencies)
- Install **ONNX Runtime** for CPU inference
- Use **sharp** for image preprocessing

## Application Features & Architecture

### 1. Authentication System
- Google OAuth integration using Google Identity Services
- Traditional email/password registration with bcryptjs hashing
- JWT-based session management
- Protected routes and role-based access control (User, Admin)
- Email verification flow (optional but recommended)

### 2. User Profile & Gamification
- **Carbon Points System**: Users earn points for verified cleanups
- **Achievement Badges**: Bronze, Silver, Gold, Platinum tiers
- **Activity History**: Timeline of all cleanup activities
- **Leaderboard**: Top contributors (weekly, monthly, all-time)
- **Public Profile Page**: 
  - Generate unique shareable URL (e.g., `/profile/@username`)
  - Beautiful animated showcase using Framer Motion
  - Display: total cleanups, carbon points, badges, impact statistics
  - Instagram-ready visual design with gradient cards and micro-interactions

### 3. Interactive Map Dashboard
- **Leaflet + OpenStreetMap** implementation with custom markers and clustering
- Display garbage waste markers with color-coded severity (red=high, yellow=medium, green=low)
- Marker clustering for dense areas (using leaflet.markercluster)
- Filter by: waste type, status (reported, in-progress, cleaned), date range
- User geolocation to find nearby waste sites
- Click marker to view details: photos, description, reporter, status
- "Navigate" button to open directions in Maps app
- Info windows with interactive popups
- Smooth marker animations and transitions

### 4. Waste Reporting Flow
**User Side:**
- Report new garbage location with:
  - GPS coordinates (auto-detected or manual pin)
  - Photo upload (multiple images supported)
  - Waste type (plastic bottles, bags, mixed, etc.)
  - Severity level (1-5 scale)
  - Optional description
- View submission status: Pending Review → Approved/Rejected

**Admin Review Panel:**
- AI-assisted image analysis using YOLO11:
  - Detect plastic waste objects in photos
  - Calculate confidence scores
  - Flag suspicious submissions (no waste detected)
- Admin dashboard showing all pending reports
- Side-by-side view: original photo + AI analysis overlay
- Approve/Reject with optional feedback
- Bulk actions for multiple reports

### 5. Cleanup Verification System
**User Side:**
- Select a reported waste location from map
- "Start Cleanup" button (marks as in-progress)
- Upload "after" cleanup photo
- Submit for verification

**Admin Side:**
- Compare before/after photos
- AI analysis to verify cleanup (detect if waste is removed)
- Award carbon points based on:
  - Waste severity cleaned
  - Photo quality/verification score
  - Bonus points for difficult areas
- Approve/Reject cleanup claim

### 6. Landing Page (Public)
Create an engaging, modern landing page with:
- **Hero Section**: 
  - Animated gradient background (Framer Motion)
  - Bold headline: "Turn Trash into Impact"
  - CTA buttons: "Get Started" | "View Map"
- **Live Statistics Counter**:
  - Total cleanups completed
  - Total carbon points earned
  - Active community members
  - Kg of waste removed (estimated)
  - Animate numbers counting up on scroll
- **How It Works Section**: 3-step animated cards
- **Community Impact Map**: Mini embedded map preview
- **Top Contributors Carousel**: Rotating showcase of top users
- **Features Grid**: Icon-based feature highlights
- **Social Proof**: Testimonials with avatar animations
- **Footer**: Links, social media, contact

### 7. Additional Features to Implement

**Community Features:**
- **Team Challenges**: Create cleanup groups/events
- **Social Feed**: Share cleanup stories with photos
- **Comments**: Users can discuss on waste reports
- **Notifications**: Real-time alerts for nearby waste, achievements

**Analytics Dashboard (Admin):**
- Charts showing cleanup trends (Chart.js or Recharts)
- Geographic heatmap of activity
- User growth metrics
- Most active areas/times

**Gamification Enhancements:**
- **Daily Streaks**: Bonus points for consecutive days
- **Special Badges**: "First Cleanup", "100 Club", "Area Champion"
- **Seasonal Events**: Double points periods
- **Referral System**: Invite friends, earn bonus points

**Mobile Responsiveness:**
- Fully responsive design for all screen sizes
- Mobile-first map interactions
- Touch-optimized UI components
- PWA capabilities (optional): offline map caching

## Database Schema (Prisma Models)

Design comprehensive models including:
- **User**: id, email, password, googleId, username, carbonPoints, role, createdAt, profileImage
- **WasteReport**: id, location (coordinates), photos, status, wasteType, severity, reporterId, createdAt, adminNotes
- **CleanupActivity**: id, wasteReportId, userId, beforePhoto, afterPhoto, status, pointsAwarded, verifiedAt, aiConfidenceScore
- **Achievement**: id, name, description, icon, requiredPoints
- **UserAchievement**: userId, achievementId, unlockedAt
- **Notification**: id, userId, type, message, read, createdAt

Implement proper relations, indexes, and constraints.

## AI Integration Architecture

1. **Setup YOLO11 with ONNX Runtime**:
   - Install `onnxruntime-node` (CPU only)
   - Download YOLO11 pre-trained model (convert to ONNX format)
   - Create inference service: `/services/aiAnalysis.js`

2. **Image Analysis Endpoints**:
   - `POST /api/ai/analyze-waste`: Detect plastic waste in images
   - Return: detected objects, confidence scores, bounding boxes
   
3. **Verification Logic**:
   - Compare object counts in before/after photos
   - Calculate cleanup effectiveness score
   - Flag anomalies for manual review

## Security & Best Practices

- Input validation on all endpoints (express-validator)
- Rate limiting (express-rate-limit)
- CORS configuration
- Helmet.js for security headers
- SQL injection prevention (Prisma handles this)
- Image file type/size validation
- Secure MinIO bucket policies (private uploads)
- Environment variables for all secrets (.env)
- API key rotation strategy for Google OAuth

## File Structure
```
/project-root
├── /client (React frontend)
│   ├── /src
│   │   ├── /components (UI components)
│   │   ├── /pages (Landing, Dashboard, Profile, Map, Admin)
│   │   ├── /hooks (custom React hooks)
│   │   ├── /lib (utilities, API client)
│   │   ├── /store (state management)
│   │   └── /assets
│   └── package.json
├── /server (Express backend)
│   ├── /src
│   │   ├── /routes (API endpoints)
│   │   ├── /controllers (business logic)
│   │   ├── /services (AI, storage, auth)
│   │   ├── /middleware (auth, validation)
│   │   ├── /config (db, minio, oauth)
│   │   └── /utils
│   ├── /prisma (schema, migrations)
│   └── package.json
└── docker-compose.yml (Postgres, MinIO)
```

## Deliverables

Build a production-ready application with:
1. Clean, documented code following senior-level standards
2. Proper error handling and logging
3. Loading states and optimistic UI updates
4. Accessibility (ARIA labels, keyboard navigation)
5. SEO optimization for landing page
6. API documentation (comments or Swagger)
7. Database seeding script with sample data
8. README with setup instructions

## Design Guidelines

- Use a nature-inspired color palette (greens, blues, earth tones)
- Smooth animations (avoid janky transitions)
- Micro-interactions on buttons and cards
- Skeleton loaders for async content
- Toast notifications for user actions
- Modal dialogs for confirmations
- Glassmorphism effects where appropriate
- High-quality placeholder images

## Success Criteria

Make this application visually stunning, highly functional, and scalable. The code should demonstrate senior-level engineering with proper separation of concerns, reusable components, and clean architecture. Prioritize user experience and make the gamification elements feel rewarding and motivating.

The application should be ready for production deployment with proper configuration, security measures, and documentation.