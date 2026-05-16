# Smart Complaint & Escalation Management System
## Full-Stack Implementation Plan

---

## Tech Stack
| Layer | Technology |
|-------|-----------|
| Backend | Spring Boot 3.x, Spring Security, JWT, JPA/Hibernate |
| Frontend | React 18 + Vite, Tailwind CSS |
| Database | PostgreSQL |
| Build | Maven |
| Java | 21 |

---

## Backend Package Structure
```
com.example.cms
├── config/           # SecurityConfig, JwtConfig, WebConfig, SchedulerConfig
├── controller/       # Auth, Complaint, Comment, Escalation, Analytics, User
├── dto/              # Request & Response DTOs
├── entity/           # User, Complaint, Comment, Escalation, AuditLog, Attachment
├── enums/            # Role, ComplaintStatus, Priority, Department
├── exception/        # GlobalExceptionHandler, custom exceptions
├── repository/       # Spring Data JPA repos
├── security/         # JwtUtil, JwtFilter, UserDetailsServiceImpl
└── service/          # Business logic services
```

---

## Database Schema (Entities)

### User
- id, name, email, password, role (USER/AGENT/MANAGER), department, createdAt

### Complaint
- id, title, description, status (OPEN/IN_PROGRESS/RESOLVED/CLOSED), priority (LOW/MEDIUM/HIGH/CRITICAL)
- department, raisedBy (User), assignedTo (Agent), createdAt, updatedAt, resolvedAt
- slaDeadline (createdAt + 48h), escalated (boolean), rating (1–5)

### Comment
- id, complaint (FK), author (FK), content, createdAt

### EscalationLog
- id, complaint (FK), escalatedBy, reason, escalatedAt

### AuditLog
- id, entityType, entityId, action, performedBy, details, timestamp

### Attachment
- id, complaint (FK), fileName, fileType, filePath, uploadedAt

---

## Business Logic

### Auto-Escalation Scheduler
```java
@Scheduled(fixedRate = 3_600_000) // Every 1 hour
public void autoEscalate() {
    // Find all OPEN or IN_PROGRESS complaints past SLA deadline
    // Set escalated=true, notify manager, create EscalationLog
}
```

### Status Workflow
```
OPEN → IN_PROGRESS → RESOLVED → CLOSED
```
- Only assigned agent can move to IN_PROGRESS/RESOLVED
- Manager/Admin can force-close or reopen

### Priority Queue
- Dashboard API returns complaints ordered by priority DESC, createdAt ASC

### Department-Scoped Assignment
- Only agents with matching department can be assigned to a complaint

---

## API Endpoints

### Auth
- POST /api/auth/register
- POST /api/auth/login
- POST /api/auth/refresh-token

### Complaints
- POST   /api/complaints              (USER)
- GET    /api/complaints              (ALL - filtered by role)
- GET    /api/complaints/{id}
- PUT    /api/complaints/{id}
- DELETE /api/complaints/{id}         (MANAGER/ADMIN)
- PUT    /api/complaints/{id}/assign  (MANAGER)
- PUT    /api/complaints/{id}/status  (AGENT)
- POST   /api/complaints/{id}/rate    (USER)

### Comments
- POST /api/complaints/{id}/comments
- GET  /api/complaints/{id}/comments

### Escalation
- GET  /api/escalations               (MANAGER)
- POST /api/escalations/{id}/manual   (MANAGER)

### Analytics
- GET /api/analytics/summary
- GET /api/analytics/department-stats
- GET /api/analytics/resolution-time

### Users
- GET /api/users/agents               (MANAGER)
- GET /api/users/me

---

## Frontend Structure (React + Vite + Tailwind)
```
src/
├── api/              # axios instance + API calls
├── components/       # Navbar, Sidebar, ComplaintCard, StatusBadge, etc.
├── context/          # AuthContext
├── pages/
│   ├── Login.jsx
│   ├── Register.jsx
│   ├── Dashboard.jsx     # role-specific landing
│   ├── ComplaintList.jsx
│   ├── ComplaintDetail.jsx
│   ├── CreateComplaint.jsx
│   ├── Analytics.jsx     # Manager only
│   └── Escalations.jsx   # Manager only
├── hooks/            # useAuth, useComplaints
└── utils/            # token helpers, date formatters
```

---

## Key Features Implemented
1. ✅ JWT Auth with Role-Based Access (USER / AGENT / MANAGER)
2. ✅ Full Complaint CRUD with validation
3. ✅ Status Workflow Engine (OPEN→IN_PROGRESS→RESOLVED→CLOSED)
4. ✅ Auto-Escalation via @Scheduled every hour
5. ✅ SLA Deadline tracking (48-hour window)
6. ✅ Priority-sorted ticket queue
7. ✅ Department-scoped agent assignment
8. ✅ Comment threads per complaint
9. ✅ Complaint rating (1–5 stars) after resolution
10. ✅ Audit Log for all actions
11. ✅ Analytics Dashboard (resolution time, pending tickets, dept stats)
12. ✅ Escalation history log
13. ✅ File attachment support
14. ✅ Email notification stubs (Spring Mail)
