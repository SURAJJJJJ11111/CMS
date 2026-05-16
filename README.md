# Smart Complaint & Escalation Management System 🎫

A **production-grade, enterprise-level** full-stack project built with:

| Layer | Stack |
|-------|-------|
| Backend | Spring Boot 3.2 · Spring Security · JWT · JPA/Hibernate |
| Frontend | React 18 + Vite · Tailwind CSS · Recharts |
| Database | PostgreSQL |
| Real-time | WebSocket (STOMP) |

---

## 🚀 Getting Started

### Prerequisites
- Java 21
- Maven 3.8+
- PostgreSQL 14+
- Node.js 18+

---

### Backend Setup

1. **Create the database:**
```sql
CREATE DATABASE cms_db;
```

2. **Configure `application.properties`:**
```properties
spring.datasource.url=jdbc:postgresql://localhost:5432/cms_db
spring.datasource.username=postgres
spring.datasource.password=your_password
```

3. **Run the backend:**
```bash
cd complaint-management-system
./mvnw spring-boot:run
```
Backend runs on **http://localhost:8080**

Swagger UI: **http://localhost:8080/swagger-ui.html**

---

### Frontend Setup

```bash
cd frontend
npm install
npm run dev
```
Frontend runs on **http://localhost:5173**

---

## 🏗️ Architecture

```
complaint-management-system/
├── src/main/java/com/example/cms/
│   ├── config/          # SecurityConfig, WebSocketConfig
│   ├── controller/      # AuthController, ComplaintController, EscalationController
│   │                      AnalyticsController, UserController
│   ├── dto/
│   │   ├── request/     # RegisterRequest, LoginRequest, ComplaintRequest, ...
│   │   └── response/    # AuthResponse, ComplaintResponse, AnalyticsResponse, ...
│   ├── entity/          # User, Complaint, Comment, Attachment, EscalationLog, AuditLog
│   ├── enums/           # Role, ComplaintStatus, Priority, Department
│   ├── exception/       # GlobalExceptionHandler + custom exceptions
│   ├── repository/      # Spring Data JPA repositories
│   ├── security/        # JwtUtil, JwtAuthenticationFilter, UserDetailsServiceImpl
│   └── service/         # AuthService, ComplaintService, EscalationService,
│                          NotificationService, AnalyticsService, AuditLogService
│
└── frontend/src/
    ├── api/             # Axios API client with JWT interceptor
    ├── components/      # Layout, ComplaintCard
    ├── context/         # AuthContext (login/logout/role helpers)
    └── pages/           # Login, Register, Dashboard, ComplaintList,
                           ComplaintDetail, CreateComplaint, Analytics, Escalations
```

---

## 👥 Roles & Permissions

| Feature | USER | AGENT | MANAGER |
|---------|------|-------|---------|
| Raise complaint | ✅ | ❌ | ❌ |
| View own complaints | ✅ | — | — |
| View assigned tickets | — | ✅ | — |
| View all tickets | ❌ | ❌ | ✅ |
| Update status | ❌ | ✅ | ✅ |
| Assign agent | ❌ | ❌ | ✅ |
| Manual escalation | ❌ | ❌ | ✅ |
| Rate resolution | ✅ | ❌ | ❌ |
| Analytics dashboard | ❌ | ❌ | ✅ |
| Escalation log | ❌ | ❌ | ✅ |

---

## ⚙️ Business Logic

### Status Workflow
```
OPEN → IN_PROGRESS → RESOLVED → CLOSED
```
Invalid transitions throw `WorkflowException (400 Bad Request)`

### Auto-Escalation (`@Scheduled`)
- Runs every **1 hour**
- Finds all `OPEN / IN_PROGRESS` complaints past their **48-hour SLA deadline**
- Marks them `escalated = true`
- Creates `EscalationLog` entry with `automatic = true`
- Sends email notification

### Department-Scoped Assignment
```
Agent.department MUST EQUAL Complaint.department
```

### Priority Queue
All complaint lists are sorted:
```
CRITICAL > HIGH > MEDIUM > LOW, then createdAt ASC
```

---

## 📡 API Reference

| Method | Endpoint | Role |
|--------|----------|------|
| POST | `/api/auth/register` | Public |
| POST | `/api/auth/login` | Public |
| GET | `/api/complaints?page=&size=&status=&department=` | All |
| POST | `/api/complaints` | USER |
| GET | `/api/complaints/{id}` | All |
| PUT | `/api/complaints/{id}` | USER/MANAGER |
| DELETE | `/api/complaints/{id}` | USER/MANAGER |
| PUT | `/api/complaints/{id}/assign?agentId=` | MANAGER |
| PUT | `/api/complaints/{id}/status` | AGENT/MANAGER |
| POST | `/api/complaints/{id}/rate` | USER |
| POST | `/api/complaints/{id}/attachments` | All |
| GET/POST | `/api/complaints/{id}/comments` | All |
| GET | `/api/escalations` | MANAGER |
| POST | `/api/escalations/{id}/manual?reason=` | MANAGER |
| GET | `/api/analytics/summary` | MANAGER |
| GET | `/api/users/agents?department=` | MANAGER |

---

## 📊 Features at a Glance

- ✅ JWT Authentication + Role-Based Access Control (3 roles)
- ✅ Full Complaint CRUD with validation
- ✅ Status Workflow Engine (4-state FSM with transition guards)
- ✅ **Auto-Escalation via `@Scheduled`** (runs hourly, 48h SLA)
- ✅ SLA deadline tracking + breach detection
- ✅ Department-scoped agent assignment enforcement
- ✅ Comment threads per ticket
- ✅ File/attachment upload (multipart)
- ✅ Star rating after resolution (USER only)
- ✅ Audit logs on every action
- ✅ Email notifications (`@Async` Spring Mail)
- ✅ WebSocket real-time status push
- ✅ Analytics Dashboard (Recharts: bar, donut, horizontal bar, progress)
- ✅ Escalation history log (auto + manual)
- ✅ Swagger/OpenAPI at `/swagger-ui.html`

---
