# Yaloric Assignment — Full-Stack User Management System

Production-grade full-stack user management system built with **NestJS**, **React (Vite)**, **PostgreSQL**, **Prisma ORM**, and **Tailwind CSS**. The service handles stateless JWT authentication, secure password hashing, declarative input validation, and full CRUD directory lifecycle management with relational data-integrity guarantees.

---

## Table of Contents

1. [System Architecture](#system-architecture)
2. [Request Lifecycle & Execution Flow](#request-lifecycle--execution-flow)
3. [Database Design & ER Diagram](#database-design--er-diagram)
4. [Folder Structure](#folder-structure)
5. [Security & Validation Architecture](#security--validation-architecture)
6. [Data Transfer Objects (DTO) Specification](#data-transfer-objects-dto-specification)
7. [API Specification](#api-specification)
8. [Environment Variables](#environment-variables)
9. [Setup & Running the Application](#setup--running-the-application)
10. [Database Initialization & Schema Sync](#database-initialization--schema-sync)

---

## System Architecture

The application adopts a **clean, decoupled architecture** separating presentation, transport, validation, business logic, data persistence, and centralized exception handling:

```mermaid
graph TD
    Client[React Client / SPA] -->|HTTP REST + Bearer JWT| Server[NestJS Server Application]

    subgraph NestJS Processing Pipeline
        Server --> CORS[CORS Configuration]
        CORS --> Prefix[Global Prefix: /api]
        Prefix --> Pipe[Global ValidationPipe]
        Pipe --> Guard[Passport JWT AuthGuard]
        Guard --> Controller[Controller Layer]
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

- **Controller-Service Decoupling**: Controllers handle HTTP route routing, DTO validation pipes, and status codes. Services encapsulate all business rules, password hashing, and database queries.
- **Fail-Fast Schema Validation**: Payloads are validated against strong DTO schemas via `ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true })` before reaching application logic.
- **Single Source of Truth**: `schema.prisma` declares data models, unique constraints, and database mapping, paired with an idempotent `init.sql` script for PostgreSQL database provisioning.
- **Centralized Error Envelope**: `AllExceptionsFilter` catches `HttpException`s and Prisma engine error codes (`P2000`, `P2002`, `P2025`), returning structured responses without leaking raw stack traces or internal errors.

---

## Request Lifecycle & Execution Flow

```mermaid
sequenceDiagram
    autonumber
    actor User as Client / Browser
    participant VP as Global ValidationPipe
    participant Guard as JwtAuthGuard & Strategy
    participant Ctrl as UsersController
    participant Svc as UsersService
    participant DB as Prisma / PostgreSQL

    User->>VP: HTTP Request (e.g. POST /api/users)
    
    alt Malformed Payload / Missing Fields
        VP-->>User: 400 Bad Request (Field Validation Errors)
    else Schema Validated
        VP->>Guard: Evaluate JWT Token in Authorization Header
        alt Token Missing or Expired
            Guard-->>User: 401 Unauthorized
        else Token Verified
            Guard->>Ctrl: Dispatch to Route Handler
            Ctrl->>Svc: Invoke Service Method with DTO
            Svc->>DB: Check Unique Email Existence
            alt Email Already Exists
                DB-->>Svc: Found Existing User
                Svc-->>User: 409 Conflict (Email already in use)
            else Email Available
                Svc->>Svc: Hash Password (bcrypt, 10 rounds)
                Svc->>DB: prisma.user.create()
                DB-->>Svc: Persisted Record
                Svc-->>Ctrl: Sanitized User Record (Password Omitted)
                Ctrl-->>User: 201 Created (JSON Response)
            end
        end
    end
```

---

## Database Design & ER Diagram

Relational integrity is maintained with native UUID primary keys, strict column lengths, unique constraints, and database triggers.

```mermaid
erDiagram
    users {
        uuid id PK "uuid_generate_v4()"
        varchar first_name "100 chars, not null"
        varchar last_name "100 chars, not null"
        varchar email UK "150 chars, unique, not null"
        varchar phone "20 chars, not null"
        varchar password "255 chars, bcrypt hash, not null"
        timestamptz created_at "default current_timestamp"
        timestamptz updated_at "auto-updated via trigger"
    }
```

### Relational & Integrity Constraints

1. **Unique Identity Constraint**: A unique index `idx_users_email` on `users(email)` ensures strict single-account uniqueness.
2. **UUID Primary Key**: Cryptographically random UUID identifiers prevent sequential ID enumeration attacks.
3. **Automated Timestamp Triggers**: A PostgreSQL trigger `set_updated_at` runs before any row update, automatically synchronizing `updated_at` with `CURRENT_TIMESTAMP`.
4. **Field Bounds**: Column width limits (`VARCHAR(100)`, `VARCHAR(150)`, `VARCHAR(20)`) prevent buffer abuse and memory amplification.

---

## Folder Structure

```
yaloric_assignment/
├── backend/
│   ├── prisma/
│   │   ├── init.sql                    # Standalone PostgreSQL initialization script
│   │   └── schema.prisma               # Prisma ORM data model & datasource config
│   ├── src/
│   │   ├── auth/                       # Authentication module
│   │   │   ├── dto/                    # login.dto.ts, register.dto.ts
│   │   │   ├── guards/                 # jwt-auth.guard.ts
│   │   │   ├── strategies/             # jwt.strategy.ts
│   │   │   ├── auth.controller.ts      # Authentication endpoints
│   │   │   ├── auth.module.ts          # Passport & JWT module registration
│   │   │   └── auth.service.ts         # User auth logic & token signing
│   │   ├── common/
│   │   │   └── filters/
│   │   │       └── http-exception.filter.ts # Global exception handler
│   │   ├── prisma/
│   │   │   ├── prisma.module.ts        # Global Prisma service provider
│   │   │   └── prisma.service.ts       # PrismaClient database connection lifecycle
│   │   ├── users/                      # User management module
│   │   │   ├── dto/                    # create-user.dto.ts, update-user.dto.ts
│   │   │   ├── users.controller.ts     # Protected CRUD endpoints
│   │   │   ├── users.module.ts         # Users feature module definition
│   │   │   └── users.service.ts        # Database queries & business rules
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
│   │   │   └── users.js                # Users CRUD API calls
│   │   ├── components/                 # Reusable interface components
│   │   │   ├── DeleteModal.jsx         # Accessible deletion confirmation dialog
│   │   │   ├── Navbar.jsx              # Application navigation bar & session controls
│   │   │   ├── ProtectedRoute.jsx      # Client-side route authentication barrier
│   │   │   ├── UserModal.jsx           # Create / Edit user form modal
│   │   │   └── UserTable.jsx           # Responsive user data table
│   │   ├── context/
│   │   │   └── AuthContext.jsx         # Reactive session state & localStorage persistence
│   │   ├── pages/                      # Page-level components
│   │   │   ├── DashboardPage.jsx       # Directory management dashboard view
│   │   │   ├── LoginPage.jsx           # User sign-in view
│   │   │   └── RegisterPage.jsx        # Account registration view
│   │   ├── App.jsx                     # Router tree layout
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

### 2. Stateless JWT Authentication
- Successful login issues a signed JSON Web Token containing `{ sub: user.id, email: user.email }`.
- Protected endpoints are secured with `JwtAuthGuard` implementing the Passport JWT extraction strategy (`ExtractJwt.fromAuthHeaderAsBearerToken()`).
- The client-side Axios client automatically injects the token via request interceptors and handles `401 Unauthorized` responses by clearing local storage and routing to `/login`.

### 3. Mass-Assignment & Injection Protection
- The global `ValidationPipe` operates with `whitelist: true` and `forbidNonWhitelisted: true`.
- Extra, unexpected, or malicious fields in HTTP request bodies are rejected before entering controller execution.

### 4. Normalized Error Envelope
- Errors are standardized into a uniform structure:
  ```json
  {
    "statusCode": 400,
    "message": "Phone number must be exactly 10 digits",
    "timestamp": "2026-11-10T17:00:00.000Z"
  }
  ```

---

## Data Transfer Objects (DTO) Specification

DTOs define the strict contract and validation rules for payloads entering the backend:

| DTO Class | File Location | Applied Endpoint | Validation Rules |
|---|---|---|---|
| `RegisterDto` | `backend/src/auth/dto/register.dto.ts` | `POST /api/auth/register` | `firstName` (string, max 100), `lastName` (string, max 100), `email` (valid email, max 150), `phone` (regex `/^[0-9]{10}$/`, exactly 10 digits), `password` (string, min 6) |
| `LoginDto` | `backend/src/auth/dto/login.dto.ts` | `POST /api/auth/login` | `email` (valid email, required), `password` (string, min 6, required) |
| `CreateUserDto` | `backend/src/users/dto/create-user.dto.ts` | `POST /api/users` | `firstName`, `lastName`, `email`, `phone` (10 digits), `password` (optional; defaults to system password) |
| `UpdateUserDto` | `backend/src/users/dto/update-user.dto.ts` | `PUT/PATCH /api/users/:id` | All fields optional to support partial and full updates |

---

## API Specification

### Base URL
```
http://localhost:5000/api
```

---

### 1. Authentication Endpoints

#### Register User
- **Method**: `POST`
- **Route**: `/api/auth/register`
- **Access**: Public
- **Request Body**:
  ```json
  {
    "firstName": "Abhishek",
    "lastName": "Verma",
    "email": "abhishek@gmail.com",
    "phone": "9876543210",
    "password": "secretpassword"
  }
  ```
- **Responses**:
  - `201 Created`:
    ```json
    {
      "message": "Registration successful",
      "user": {
        "id": "35995d54-ce9b-44db-9f05-33ab80a54cc0",
        "firstName": "Abhishek",
        "lastName": "Verma",
        "email": "abhishek@gmail.com",
        "phone": "9876543210"
      }
    }
    ```
  - `400 Bad Request`: Validation failure.
  - `409 Conflict`: Email already in use.

#### Login User
- **Method**: `POST`
- **Route**: `/api/auth/login`
- **Access**: Public
- **Request Body**:
  ```json
  {
    "email": "abhishek@gmail.com",
    "password": "secretpassword"
  }
  ```
- **Responses**:
  - `200 OK`:
    ```json
    {
      "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      "user": {
        "id": "35995d54-ce9b-44db-9f05-33ab80a54cc0",
        "firstName": "Abhishek",
        "lastName": "Verma",
        "email": "abhishek@gmail.com",
        "phone": "9876543210"
      }
    }
    ```
  - `401 Unauthorized`: Invalid credentials.

---

### 2. User Management Endpoints (Requires Auth)

All requests require the header: `Authorization: Bearer <accessToken>`

| Method | Route | Description | Status Codes |
|---|---|---|---|
| `GET` | `/api/users` | List all users (ordered by creation date desc) | `200`, `401` |
| `GET` | `/api/users/:id` | Get single user by UUID | `200`, `401`, `404` |
| `POST` | `/api/users` | Create user from directory dashboard | `201`, `400`, `401`, `409` |
| `PUT` | `/api/users/:id` | Full update of existing user | `200`, `400`, `401`, `404`, `409` |
| `PATCH` | `/api/users/:id` | Partial update of existing user | `200`, `400`, `401`, `404`, `409` |
| `DELETE` | `/api/users/:id` | Delete user record | `200`, `401`, `404` |

#### Create User Payload (Dashboard)
```json
{
  "firstName": "Jane",
  "lastName": "Doe",
  "email": "jane.doe@example.com",
  "phone": "9876543210"
}
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

### 1. Database Provisioning

Create the PostgreSQL database:
```sql
CREATE DATABASE yaloric_db;
```

Run the initialization script:
```bash
psql -U postgres -d yaloric_db -f backend/prisma/init.sql
```

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
   - Creates the `users` table with strict constraints.
   - Establishes the `idx_users_email` lookup index.
   - Configures the `set_updated_at` trigger to auto-update modification timestamps.

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
