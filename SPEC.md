# EXAM GUARDRAIL SYSTEM - Specification Document

## Project Overview

**Project Name**: Exam Guardrail System
**Project Type**: AI-Powered Secure Online Examination Platform
**Core Functionality**: A comprehensive online exam platform with AI monitoring, trust scoring, real-time proctoring, and anti-cheating mechanisms
**Target Users**: Educational institutions, certification bodies, corporate training departments, and online examination platforms

---

## UI/UX Specification

### Design Philosophy

**Theme**: Dark futuristic with green accent colors - conveying security, trust, and technology

### Color Palette

| Role | Color | Hex Code |
|------|-------|----------|
| Background Primary | Deep Black | `#0a0a0f` |
| Background Secondary | Dark Gray | `#12121a` |
| Background Card | Dark Glass | `#1a1a25` |
| Accent Primary | Neon Green | `#00ff88` |
| Accent Secondary | Electric Green | `#00cc6a` |
| Accent Tertiary | Mint | `#66ffb2` |
| Text Primary | White | `#ffffff` |
| Text Secondary | Gray | `#9ca3af` |
| Text Muted | Dark Gray | `#6b7280` |
| Success | Green | `#22c55e` |
| Warning | Amber | `#f59e0b` |
| Danger | Red | `#ef4444` |
| Border | Dark Border | `#2a2a3a` |

### Typography

| Element | Font Family | Size | Weight |
|---------|-------------|------|--------|
| Heading 1 | Inter | 48px | 800 |
| Heading 2 | Inter | 36px | 700 |
| Heading 3 | Inter | 24px | 600 |
| Body | Inter | 16px | 400 |
| Small | Inter | 14px | 400 |
| Caption | Inter | 12px | 400 |

### Layout Structure

#### Responsive Breakpoints

- Mobile: 0-640px
- Tablet: 641-1024px
- Desktop: 1025px+

### Spacing System

- Base unit: 4px
- xs: 4px
- sm: 8px
- md: 16px
- lg: 24px
- xl: 32px
- 2xl: 48px

### Visual Effects

1. **Glass Morphism**: Background blur with transparency for cards
2. **Glow Effects**: Neon green glow on interactive elements
3. **Animations**: Smooth transitions with 300ms ease
4. **Shadows**: Colored shadows for depth perception

---

## Page Specifications

### 1. Landing Page (`/`)

**Layout**:
- Full-screen dark background with subtle grid pattern
- Centered content with logo, title, and action buttons
- Animated background particles or gradient mesh

**Components**:
- Logo (shield icon with AI brain)
- Title: "EXAM GUARDRAIL"
- Subtitle: "AI-Powered Secure Online Examination Platform"
- Two main buttons:
  - Student Portal (green outline)
  - Examiner Login (green filled)
- Footer with copyright

### 2. Student Join Page (`/join/[examCode]`)

**Layout**:
- Split screen: Left side exam info, Right side login form

**Components**:
- Exam details card
- Student name input
- Student ID input
- Exam password input
- Join button

### 3. Student Exam Interface (`/exam/[sessionId]`)

**Layout**:
- Full-screen exam mode
- Header: Exam title, student info, timer, trust score
- Main content: Question area with answer options
- Footer: Navigation buttons

**Security Features**:
- Fullscreen enforcement
- Copy/paste blocking
- Tab switch detection
- Screenshot prevention overlay

### 4. Examiner Login Page (`/examiner/login`)

**Layout**:
- Centered card on dark background
- Logo at top
- Email/password form
- Google OAuth button

### 5. Examiner Dashboard (`/examiner/dashboard`)

**Layout**:
- Fixed sidebar (280px width)
- Main content area with header and grid cards

**Sidebar Menu**:
- Dashboard Overview
- Create Exam
- Question Builder
- Live Monitoring
- Credibility Reports
- Students

**Dashboard Cards**:
- Total Exams
- Active Students
- Average Trust Score
- Recent Violations

### 6. Exam Builder (`/examiner/create-exam`)

**Layout**:
- Form-based interface
- Two columns: Settings left, Questions right

**Exam Fields**:
- Exam Title (text input)
- Exam Description (textarea)
- Global Exam Timer (number input in minutes)
- Trust Score Threshold (number input 0-100)
- Exam Password (text input)

**Question Builder**:
- Question type dropdown
- Question text editor
- Options for MCQ/Multiple Select
- Correct answer selection
- Marks per question
- Per-question timer (optional)
- Add/Duplicate/Delete buttons
- Preview button

**Supported Question Types**:
1. Multiple Choice (Radio buttons)
2. Multiple Select (Checkboxes)
3. True/False
4. Short Answer (Text input)
5. Paragraph (Textarea)
6. Numerical (Number input)
7. Code Editor (Monaco Editor)
8. File Upload
9. Image Based (with image display)
10. Match Following (Drag matching)
11. Drag and Drop Ordering

### 7. Live Monitoring (`/examiner/monitor`)

**Layout**:
- Real-time table with live updates

**Table Columns**:
- Student Name
- Student ID
- Trust Score (with color indicator)
- Violations count
- Marks
- Status (Safe/Warning/High Risk/Terminated)
- Actions (View Details)

**Status Colors**:
- Safe: Green (#22c55e)
- Warning: Yellow (#f59e0b)
- High Risk: Red (#ef4444)
- Terminated: Gray (#6b7280)

### 8. Student Detail Modal

**Components**:
- Student photo placeholder
- Trust score gauge
- Violation timeline
- Camera snapshots
- Marks breakdown

### 9. Credibility Reports (`/examiner/reports`)

**Layout**:
- Report cards grid
- Each card shows:
  - Student name
  - Exam name
  - Marks
  - Trust Score
  - Risk Level
  - View Full Report button

**Full Report Includes**:
- Student details
- Exam details
- Marks with percentage
- Trust Score
- Risk Level
- Violation summary
- Behavior analysis
- Marks vs Trust Score graph

---

## Functionality Specification

### Authentication System

**Examiner Authentication**:
1. Email + Password login
2. Google OAuth 2.0
3. JWT token management
4. Role-based access control

**Student Authentication**:
- Exam code + password
- Session token generation

### Exam Management

**Create Exam**:
- Generate unique 5-character exam code
- Store exam with password
- Support multiple question types
- Configure timers

**Publish Exam**:
- Save to database
- Generate join URL
- Return exam credentials

### AI Proctoring Engine

**Face Detection**:
- MediaPipe Face Detection
- Track face presence
- Detect multiple faces

**Face Mesh**:
- Eye gaze detection
- Head movement tracking
- Facial landmark analysis

**Object Detection**:
- COCO-SSD for phone detection
- Monitor for suspicious objects

**Audio Analysis**:
- Microphone access
- Voice activity detection
- External help detection

### Trust Score System

**Initial Value**: 100

**Deductions**:
- Tab Switch: -10 points
- Copy Attempt: -15 points
- Multiple Faces: -25 points
- Phone Detected: -20 points
- Voice Detected: -15 points
- Looking Away: -5 points per occurrence

**Status Levels**:
- 80-100: SAFE (Green)
- 50-79: WARNING (Yellow)
- Below 50: HIGH RISK (Red)
- Below 40: TERMINATE (Gray)

### Timer Engine

**Modes**:
1. Global Timer: Total exam time
2. Per-Question Timer: Individual question timeouts
3. Hybrid: Both global and per-question

**Synchronization**:
- Socket.io for real-time updates
- Server-side timer authority
- Client-side countdown display

### Security Features

**Browser Restrictions**:
- Fullscreen enforcement
- Disable right-click
- Block keyboard shortcuts (Ctrl+C/V/X/A)
- Detect print screen
- DevTools detection

**Tab/Focus Detection**:
- Window blur event
- Visibility change event
- Mouse leave detection

---

## Technical Architecture

### Frontend Stack
- Next.js 14 (App Router)
- React 19
- TypeScript
- Tailwind CSS 4
- Framer Motion
- Socket.io Client
- Chart.js
- TensorFlow.js
- MediaPipe
- Monaco Editor

### Backend Stack
- Next.js API Routes
- Socket.io Server (integrated)
- JWT Authentication
- Google OAuth 2.0

### Database (In-Memory for Demo)
- For production: MongoDB Atlas
- Schema design ready

---

## API Routes

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/auth/login | Examiner login |
| POST | /api/auth/google | Google OAuth callback |
| GET | /api/auth/me | Get current user |
| POST | /api/exam/create | Create new exam |
| GET | /api/exam/:id | Get exam details |
| POST | /api/exam/join | Join exam |
| POST | /api/exam/submit | Submit exam |
| GET | /api/exam/:id/students | Get exam students |
| POST | /api/violation | Log violation |
| GET | /api/monitoring/:examId | Get live monitoring data |
| GET | /api/report/:studentId/:examId | Get credibility report |

---

## Socket Events

### Client → Server
- `join-exam`: Join exam room
- `submit-answer`: Submit answer
- `log-violation`: Log violation
- `timer-sync`: Request timer sync

### Server → Client
- `timer-update`: Timer countdown
- `trust-score-update`: Trust score change
- `student-update`: Student data update
- `exam-terminated`: Exam terminated
- `violation-alert`: New violation

---

## Acceptance Criteria

1. Landing page loads with dark futuristic UI and green accents
2. Examiner can login with email/password or Google OAuth
3. Examiner can create exam with all question types
4. Student can join exam with valid credentials
5. Student exam interface blocks cheating attempts
6. AI proctoring detects faces, multiple faces, phones
7. Trust score updates in real-time
8. Timer syncs across all clients
9. Live monitoring shows all students
10. Credibility reports generate correctly
11. Application is responsive across all devices
12. All security features work as specified
