# Yaloric Assignment — Full-Stack User Management & RBAC System

Production-grade full-stack user management system with **Role-Based Access Control (RBAC)** built with **NestJS**, **React (Vite)**, **PostgreSQL**, **Prisma ORM**, and **Tailwind CSS**.

The application implements a strict two-tier role architecture (**Student/User** vs. **Admin**) featuring stateless JWT authentication, cryptographic password hashing, declarative input validation, database integrity constraints, and role-guarded routes on both backend and frontend.

---

## Default Admin Credentials

For testing and evaluation, the database includes a pre-seeded administrator account:

| Attribute | Credential |
|---|---|
| **Email** | `admin@yaloric.com` |
| **Password** | `Admin@123` |
| **Role** | `ADMIN` |
| **Default View** | `/admin` (User Directory with Edit/Delete privileges) |

> **Note**: Public user registration (`/register`) automatically assigns the `USER` (Student) role. Public accounts cannot grant themselves `ADMIN` privileges.

---

## Table of Contents

1. [Role-Based Access Control (RBAC) Architecture](#role-based-access-control-rbac-architecture)
2. [System Architecture](#system-architecture)
3. [Request Lifecycle & Execution Flow](#request-lifecycle--execution-flow)
4. [Database Design & ER Diagram](#database-design--er-diagram)
5. [Folder Structure](#folder-structure)
6. [Security & Validation Architecture](#security--validation-architecture)
7. [Data Transfer Objects (DTO) Specification](#data-transfer-objects-dto-specification)
8. [API Specification](#api-specification)
9. [Frontend Route Hierarchy & Guards](#frontend-route-hierarchy--guards)
10. [Environment Variables](#environment-variables)
11. [Setup & Running the Application](#setup--running-the-application)
12. [Database Initialization & Schema Sync](#database-initialization--schema-sync)

---

## Role-Based Access Control (RBAC) Architecture

The application enforces a dual-tier authorization model designed for EdTech platforms:

| Feature / Capability | Student (`USER`) | Administrator (`ADMIN`) |
|---|:---:|:---:|
| **Account Creation** | Self-registration via `/register` | Pre-seeded / Database provisioned |
| **Default Post-Login Route** | `/profile` | `/admin` |
| **View Own Profile** | Yes (`GET /api/users/profile`) | Yes (`GET /api/users/profile`) |
| **Edit Own Profile** | Yes (`PATCH /api/users/profile`) | Yes (`PATCH /api/users/profile`) |
| **View All Users Directory** | **No** (403 Forbidden) | Yes (`GET /api/users`) |
| **Edit Any User's Details** | **No** (403 Forbidden) | Yes (`PATCH /api/users/:id`) |
| **Delete Any User** | **No** (403 Forbidden) | Yes (`DELETE /api/users/:id`) |
| **Create Users in Dashboard** | **No** | **Disabled** (Students self-register) |

---

## System Architecture

The application adopts a **clean, decoupled architecture** separating presentation, transport, validation, authorization, business logic, persistence, and centralized exception handling:

```mermaid
graph TD
    Client[React Client / SPA] -->|HTTP REST + Bearer JWT| Server[NestJS Server Application]

    subgraph NestJS Processing Pipeline
        Server --> CORS[CORS Configuration]
        CORS --> Prefix[Global Prefix: /api]
        Prefix --> Pipe[Global ValidationPipe]
        Pipe --> JwtGuard[JwtAuthGuard - Passport JWT Strategy]
        JwtGuard --> RolesGuard[RolesGuard - Reflector & Metadata]
        RolesGuard --> Controller[Controller Layer]
        Controller --> Service[Service / Business Layer]
        Controller -.-> Filter[Global AllExceptionsFilter]
        Service -.-> Filter
    end

    subgraph Persistence Layer
        Service -->|Prisma Client| Prisma[Prisma ORM]
        Prisma -->|Connection Pool| Postgres[(PostgreSQL Database)]
    end

    Filter -->|Normalized Error Envelope| Client
    Controller -->|200 / 201 JSON Response| Client
```

### Architectural Highlights

- **Dual-Layer RBAC**: Route shielding is enforced twice — declaratively on the backend using NestJS `@UseGuards(JwtAuthGuard, RolesGuard)` and `@Roles(Role.ADMIN)`, and on the frontend using `<ProtectedRoute>` and `<AdminRoute>` components.
- **Controller-Service Decoupling**: Controllers handle route parsing, guard execution, and response status codes. Services encapsulate business rules, password hashing, and database transactions.
- **Fail-Fast Schema Validation**: Payloads are validated against strict DTO schemas via `ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true })` before touching controller logic.
- **Single Source of Truth**: `schema.prisma` declares data models, enums, and unique constraints, complemented by an idempotent `init.sql` script for direct PostgreSQL provisioning.
- **Centralized Error Envelope**: `AllExceptionsFilter` traps standard `HttpException`s, authentication failures, and Prisma error codes (`P2002`, `P2025`), returning structured, predictable error responses.

---

## Request Lifecycle & Execution Flow

```mermaid
sequenceDiagram
    autonumber
    actor Client as React Client (Student / Admin)
    participant Pipe as Global ValidationPipe
    participant AuthG as JwtAuthGuard
    participant RoleG as RolesGuard
    participant Ctrl as UsersController
    participant Svc as UsersService
    participant DB as Prisma / PostgreSQL

    Client->>Pipe: HTTP Request (e.g. GET /api/users)
    Pipe->>AuthG: Validate Authorization: Bearer <token>
    alt Token Missing or Expired
        AuthG-->>Client: 401 Unauthorized
    else Token Validated
        AuthG->>RoleG: Check User Role vs Endpoint @Roles()
        alt Insufficient Role (e.g. Student accessing /api/users)
            RoleG-->>Client: 403 Forbidden ("Access denied: insufficient permissions")
        else Authorized (Role matches requirement)
            RoleG->>Ctrl: Dispatch to Route Handler
            Ctrl->>Svc: Invoke Service Method
            Svc->>DB: prisma.user.findMany()
            DB-->>Svc: User Records Array
            Svc-->>Ctrl: Sanitized Records (Passwords Omitted)
            Ctrl-->>Client: 200 OK (JSON Payload)
        end
    end
```

---

## Database Design & ER Diagram

Relational integrity is maintained with native PostgreSQL UUID primary keys, an enumerated role column, strict string constraints, unique email indices, and automated trigger-based update timestamps.

```mermaid
erDiagram
    users {
        uuid id PK "uuid_generate_v4()"
        varchar first_name "100 chars, not null"
        varchar last_name "100 chars, not null"
        varchar email UK "150 chars, unique, not null"
        varchar phone "20 chars, not null"
        varchar password "255 chars, bcrypt hash, not null"
        user_role role "USER | ADMIN, default: USER"
        timestamptz created_at "default current_timestamp"
        timestamptz updated_at "auto-updated via trigger"
    }
```

### Relational & Integrity Constraints

1. **Role Enumeration**: Database enum `user_role` restricts stored values to `'USER'` and `'ADMIN'`. Default value is `'USER'`.
2. **Unique Identity Constraint**: Unique index `idx_users_email` on `users(email)` ensures single-account uniqueness.
3. **UUID Primary Key**: Cryptographically random UUID identifiers prevent sequential ID enumeration attacks.
4. **Automated Timestamp Triggers**: PostgreSQL trigger `set_updated_at` runs before any row update, automatically synchronizing `updated_at` with `CURRENT_TIMESTAMP`.
5. **Field Bounds**: Column width limits (`VARCHAR(100)`, `VARCHAR(150)`, `VARCHAR(20)`) prevent buffer abuse and memory amplification.

---

## Folder Structure

```
yaloric_assignment/
├── backend/
│   ├── prisma/
│   │   ├── init.sql                    # Standalone PostgreSQL initialization & admin seed script
│   │   └── schema.prisma               # Prisma ORM data model, enums & datasource config
│   ├── src/
│   │   ├── auth/                       # Authentication & Authorization module
│   │   │   ├── decorators/             # roles.decorator.ts (@Roles metadata decorator)
│   │   │   ├── dto/                    # login.dto.ts, register.dto.ts
│   │   │   ├── guards/                 # jwt-auth.guard.ts, roles.guard.ts
│   │   │   ├── strategies/             # jwt.strategy.ts (extracts sub, email, role)
│   │   │   ├── auth.controller.ts      # /api/auth/register, /api/auth/login
│   │   │   ├── auth.module.ts          # Passport, JWT & Reflector configuration
│   │   │   └── auth.service.ts         # User auth logic, password hashing & token signing
│   │   ├── common/
│   │   │   └── filters/
│   │   │       └── http-exception.filter.ts # Global exception handler
│   │   ├── prisma/
│   │   │   ├── prisma.module.ts        # Global Prisma service provider
│   │   │   └── prisma.service.ts       # PrismaClient database connection lifecycle
│   │   ├── users/                      # User management module
│   │   │   ├── dto/                    # create-user.dto.ts, update-user.dto.ts
│   │   │   ├── users.controller.ts     # Profile endpoints & Admin-guarded CRUD endpoints
│   │   │   ├── users.module.ts         # Users feature module definition
│   │   │   └── users.service.ts        # Database queries, uniqueness checks & business rules
│   │   ├── app.module.ts               # Root module
│   │   └── main.ts                     # NestJS application bootstrap & config
│   ├── .env.example                    # Backend environment template
│   ├── nest-cli.json                   # Nest CLI compiler options
│   ├── package.json                    # Backend dependencies & npm scripts
│   └── tsconfig.json                   # TypeScript compiler configuration
│
├── frontend/
│   ├── src/
│   │   ├── api/                        # HTTP transport layer
│   │   │   ├── auth.js                 # Authentication API calls
│   │   │   ├── client.js               # Axios instance with Bearer interceptors
│   │   │   └── users.js                # getProfile, updateProfile, getUsers, updateUser, deleteUser
│   │   ├── components/                 # Reusable interface components
│   │   │   ├── AdminRoute.jsx          # Route guard restricting view to ADMIN role
│   │   │   ├── DeleteModal.jsx         # Accessible deletion confirmation dialog
│   │   │   ├── EditProfileModal.jsx    # Self-profile update modal with client validation
│   │   │   ├── Navbar.jsx              # Navigation bar with role badge & context links
│   │   │   ├── ProtectedRoute.jsx      # Route guard requiring authenticated session
│   │   │   ├── UserDetailsModal.jsx    # Pop-up profile card modal showing all user details
│   │   │   ├── UserModal.jsx           # Admin user edit modal
│   │   │   └── UserTable.jsx           # Responsive user data table with role pills & actions
│   │   ├── context/
│   │   │   └── AuthContext.jsx         # Reactive session state, user role & localStorage persistence
│   │   ├── pages/                      # Page-level components
│   │   │   ├── AdminDashboardPage.jsx  # Admin-only user directory table & actions
│   │   │   ├── LoginPage.jsx           # User sign-in view
│   │   │   ├── ProfilePage.jsx         # Student/User personal dashboard card & self-edit
│   │   │   └── RegisterPage.jsx        # Account registration view
│   │   ├── App.jsx                     # Router tree layout & smart root redirect
│   │   ├── index.css                   # Tailwind CSS root directives
│   │   └── main.jsx                    # React virtual DOM entry point
│   ├── .env.example                    # Frontend environment template
│   ├── index.html                      # Single-page HTML container
│   ├── package.json                    # Frontend dependencies & scripts
│   ├── postcss.config.js               # PostCSS plugin pipeline
│   ├── tailwind.config.js              # Tailwind styling configuration
│   └── vite.config.js                  # Vite bundler build config
│
├── .gitignore                          # Root ignore rules (node_modules, .env, build artifacts)
└── README.md                           # Master architectural documentation
```

---

## Security & Validation Architecture

### 1. Cryptographic Password Hashing
- Passwords are salted and hashed using **bcrypt** with a cost factor of 10 rounds prior to storage.
- Passwords are never returned in database query projections (`select` filter strictly excludes the `password` field).

### 2. Stateless JWT Authentication with Embedded Role
- Successful login issues a signed JSON Web Token containing `{ sub: user.id, email: user.email, role: user.role }`.
- Protected endpoints are secured with `JwtAuthGuard` implementing the Passport JWT extraction strategy (`ExtractJwt.fromAuthHeaderAsBearerToken()`).
- The client-side Axios client automatically injects the token via request interceptors and handles `401 Unauthorized` responses by clearing local storage and routing to `/login`.

### 3. Role-Based Access Control (RBAC) Guard
- Custom `@Roles(Role.ADMIN)` decorator attaches required roles to route metadata using NestJS `Reflector`.
- `RolesGuard` verifies that `req.user.role` matches the route metadata. If insufficient, it immediately throws a `403 Forbidden` (`Access denied: insufficient permissions`).

### 4. Mass-Assignment & Injection Protection
- The global `ValidationPipe` operates with `whitelist: true` and `forbidNonWhitelisted: true`.
- Extra, unexpected, or malicious fields in HTTP request bodies (such as trying to pass `role: "ADMIN"` during registration) are rejected before reaching controller execution.

### 5. Normalized Error Envelope
- Errors are standardized into a uniform structure:
  ```json
  {
    "statusCode": 403,
    "message": "Access denied: insufficient permissions",
    "timestamp": "2026-11-17T16:00:00.000Z"
  }
  ```

---

## Data Transfer Objects (DTO) Specification

| DTO Class | File Location | Applied Endpoint | Validation Rules |
|---|---|---|---|
| `RegisterDto` | `backend/src/auth/dto/register.dto.ts` | `POST /api/auth/register` | `firstName` (string, max 100), `lastName` (string, max 100), `email` (valid email, max 150), `phone` (regex `/^[0-9]{10}$/`, exactly 10 digits), `password` (string, min 6) |
| `LoginDto` | `backend/src/auth/dto/login.dto.ts` | `POST /api/auth/login` | `email` (valid email, required), `password` (string, min 6, required) |
| `UpdateUserDto` | `backend/src/users/dto/update-user.dto.ts` | `PATCH /api/users/profile`, `PUT/PATCH /api/users/:id` | `firstName` (optional, max 100), `lastName` (optional, max 100), `email` (optional, valid email), `phone` (optional, 10 digits). Whitelisted; cannot update `password` or `role`. |

---

## API Specification

### Base URL
```
http://localhost:5000/api
```

---

### 1. Authentication Endpoints

#### Register User (Student Account)
- **Method**: `POST`
- **Route**: `/api/auth/register`
- **Access**: Public
- **Request Body**:
  ```json
  {
    "firstName": "Rahul",
    "lastName": "Sharma",
    "email": "rahul@gmail.com",
    "phone": "9876543210",
    "password": "User@123"
  }
  ```
- **Responses**:
  - `201 Created`: Returns user object with `role: "USER"` and `accessToken`.
  - `400 Bad Request`: Validation failure (e.g. invalid phone number format).
  - `409 Conflict`: Email already in use.

#### Login User
- **Method**: `POST`
- **Route**: `/api/auth/login`
- **Access**: Public
- **Request Body**:
  ```json
  {
    "email": "admin@yaloric.com",
    "password": "Admin@123"
  }
  ```
- **Responses**:
  - `200 OK`:
    ```json
    {
      "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      "user": {
        "id": "e4b2d1c0-0000-0000-0000-000000000001",
        "firstName": "System",
        "lastName": "Admin",
        "email": "admin@yaloric.com",
        "phone": "9999999999",
        "role": "ADMIN"
      }
    }
    ```
  - `401 Unauthorized`: Invalid credentials.

---

### 2. Profile Endpoints (Authenticated — Any Role)

Requires header: `Authorization: Bearer <accessToken>`

#### Get Current Profile
- **Method**: `GET`
- **Route**: `/api/users/profile`
- **Access**: Authenticated (`USER` or `ADMIN`)
- **Response**: `200 OK`
  ```json
  {
    "id": "e4b2d1c0-0000-0000-0000-000000000001",
    "firstName": "Rahul",
    "lastName": "Sharma",
    "email": "rahul@gmail.com",
    "phone": "9876543210",
    "role": "USER",
    "createdAt": "2026-11-17T10:00:00.000Z",
    "updatedAt": "2026-11-17T10:00:00.000Z"
  }
  ```

#### Update Current Profile
- **Method**: `PATCH`
- **Route**: `/api/users/profile`
- **Access**: Authenticated (`USER` or `ADMIN`)
- **Request Body**:
  ```json
  {
    "firstName": "Rahul",
    "lastName": "Verma",
    "phone": "9123456780"
  }
  ```
- **Responses**:
  - `200 OK`: Returns updated user profile.
  - `409 Conflict`: If changing email to one already registered by another account.

---

### 3. User Management Endpoints (ADMIN Role Only)

Requires header: `Authorization: Bearer <accessToken>` with `role: "ADMIN"`

| Method | Route | Description | Status Codes |
|---|---|---|---|
| `GET` | `/api/users` | List all registered users (ordered by creation date desc) | `200`, `401`, `403` |
| `GET` | `/api/users/:id` | Get single user by UUID | `200`, `401`, `403`, `404` |
| `PUT` | `/api/users/:id` | Full update of existing user | `200`, `400`, `401`, `403`, `404`, `409` |
| `PATCH` | `/api/users/:id` | Partial update of existing user | `200`, `400`, `401`, `403`, `404`, `409` |
| `DELETE` | `/api/users/:id` | Delete user record permanently (Admins cannot be deleted) | `200`, `400`, `401`, `403`, `404` |

> Attempting to call these endpoints with a `USER` (Student) token results in **`403 Forbidden`**.

---

## Frontend Route Hierarchy & Guards

The React Single-Page Application (SPA) implements declarative client-side route shielding:

```
/ (Root)
├── If unauthenticated ──> Redirects to /login
├── If role === 'ADMIN' ──> Redirects to /admin
└── If role === 'USER'  ──> Redirects to /profile

/login              [Public Route - redirects to home if already logged in]
/register           [Public Route - redirects to home if already logged in]

/profile            [Protected by <ProtectedRoute>]
                    └── Accessible to both Students and Admins.
                    └── Displays personal card, badges, member details, and self-edit modal.

/admin              [Protected by <AdminRoute>]
                    └── Accessible ONLY to ADMIN role.
                    └── Non-admin authenticated users are redirected to /profile.
                    └── Displays user directory table, edit modal, delete modal, search & count.
```

---

## Environment Variables

### Backend Configuration (`backend/.env`)

```env
PORT=5000
DATABASE_URL="postgresql://postgres:your_password@localhost:5432/yaloric_db?schema=public"
JWT_SECRET=super_secret_jwt_key_change_in_production
JWT_EXPIRATION=1d
```

### Frontend Configuration (`frontend/.env`)

```env
VITE_API_URL=http://localhost:5000/api
```

---

## Setup & Running the Application

### Prerequisites
- **Node.js**: v18.0.0 or higher
- **PostgreSQL**: v14.0.0 or higher running on `localhost:5432`

---

### 1. Database Provisioning & Admin Seeding

Create the database and apply the schema + admin seed:
```bash
# In PostgreSQL CLI (psql):
CREATE DATABASE yaloric_db;

# Run the initialization and seed script:
psql -U postgres -d yaloric_db -f backend/prisma/init.sql
```

The script automatically creates the `user_role` enum, the `users` table, constraints, triggers, and seeds the default administrator account:
- Email: `admin@yaloric.com`
- Password: `Admin@123`

---

### 2. Backend Startup

```bash
cd backend
npm install
npx prisma generate
npx prisma db push
npm run start:dev
```
- Server API URL: `http://localhost:5000/api`

---

### 3. Frontend Startup

Open a separate terminal window:
```bash
cd frontend
npm install
npm run dev
```
- Client Web Application: `http://localhost:5173`

---

## Database Initialization & Schema Sync

Database structure is managed with two coordinated mechanisms:

1. **SQL Initialization Script (`backend/prisma/init.sql`)**:
   - Enables `"uuid-ossp"` extension.
   - Defines `user_role` enum (`USER`, `ADMIN`).
   - Creates the `users` table with strict constraints and `role` column.
   - Establishes the `idx_users_email` lookup index.
   - Configures the `set_updated_at` trigger to auto-update modification timestamps.
   - Seeds `admin@yaloric.com` idempotently (`ON CONFLICT (email) DO NOTHING`).

2. **Prisma ORM (`backend/prisma/schema.prisma`)**:
   - Synchronizes data models with the database:
     ```bash
     npx prisma db push
     ```
   - Generates the type-safe client:
     ```bash
     npx prisma generate
     ```
   - Interactive database inspection:
     ```bash
     npx prisma studio
     ```
