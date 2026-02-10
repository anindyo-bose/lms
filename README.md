# Composey LMS

**Production-Grade Learning Management System + E-Commerce Platform**

A security-first, micro-frontend architecture LMS built with Next.js, Express, Node.js, and PostgreSQL. Designed for scalability, security audits, and long-term evolution with 95%+ test coverage.

---

## 📋 Quick Navigation

- [Architecture Overview](#architecture-overview)
- [Micro-Frontend Architecture](#micro-frontend-architecture)
- [Module Structure](#module-structure)
- [Local Development](#local-development)
- [Deployment & Versioning](#deployment--versioning)
- [Security Boundaries](#security-boundaries)
- [Widget Contracts](#widget-contracts)
- [Quality Gates](#quality-gates)

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                    Next.js Shell Application                     │
│                  (Host, Routing, Auth State)                     │
└─────────────────────────────────────────────────────────────────┘
                                │
                ┌───────────────┼───────────────┐
                │               │               │
        ┌───────────────┐ ┌──────────────┐ ┌─────────────┐
        │ Auth Widget   │ │   Course     │ │  Checkout   │
        │ (MFE Port     │ │ Management   │ │  Widget     │
        │  3001)        │ │ (MFE Port    │ │ (MFE Port   │
        │               │ │  3002)       │ │  3006)      │
        └───────────────┘ └──────────────┘ └─────────────┘
                │               │              │
        ┌───────────────┐ ┌──────────────┐ ┌─────────────┐
        │ Lesson        │ │    Quiz      │ │  Progress   │
        │ Viewer        │ │   Engine     │ │  Tracker    │
        │ (MFE Port     │ │(MFE Port     │ │ (MFE Port   │
        │  3003)        │ │  3004)       │ │  3005)      │
        └───────────────┘ └──────────────┘ └─────────────┘
                │               │              │
                └───────────────┼──────────────┘
                                │
            ┌───────────────────┼────────────────────┐
            │                   │                    │
    ┌──────────────┐   ┌─────────────────┐  ┌────────────────┐
    │  API Service │   │  Auth Service   │  │ Payment Service│
    │ (Express)    │   │  (Express)      │  │  (Express)     │
    │ Port 3000    │   │  Port 3007      │  │   Port 3008    │
    └──────────────┘   └─────────────────┘  └────────────────┘
            │                   │                    │
            └───────────────────┼────────────────────┘
                                │
                    ┌──────────────────────┐
                    │   PostgreSQL DB      │
                    │   (Port 5432)        │
                    └──────────────────────┘
```

---

## Micro-Frontend Architecture

### Core Principles

1. **Independent Build & Deployment**: Each widget builds, tests, and deploys independently
2. **No Shared Mutable State**: Communication via explicit contracts and events only
3. **Versioned APIs**: Each MFE exposes a versioned contract
4. **Module Federation**: Uses Webpack 5 Module Federation for safe integration
5. **Security Boundaries**: Each widget operates within its scope; server-side enforcement

### Widget Structure

#### 1. **Auth Widget** (Port 3001)
- **Scope**: Login, signup, role-based routing, forced password changes
- **Contract**: `IAuthWidget` - exposes auth state and token refresh
- **Output**: Compiled bundle compatible with shell's import map
- **Build**: `npm run build:mfe` → outputs to `dist/auth-widget.js`
- **Tests**: Auth isolation, boundary validation, 95%+ coverage

#### 2. **Course Management Widget** (Port 3002)
- **Scope**: Educator dashboard, course CRUD, content management
- **Contract**: `ICourseWidget` - defines course queries, mutations, permissions
- **Enforced Server-Side**: Educator ownership, resource access
- **Output**: `dist/course-management-widget.js`
- **Tests**: Ownership enforcement, access control, curriculum contracts

#### 3. **Lesson Viewer Widget** (Port 3003)
- **Scope**: Student view, lesson playback, interactive content
- **Contract**: `ILessonWidget` - lesson retrieval, progress updates
- **Security**: Server enforces entitlement → lesson access
- **Output**: `dist/lesson-viewer-widget.js`
- **Tests**: Access boundaries, progress atomicity

#### 4. **Quiz Engine Widget** (Port 3004)
- **Scope**: Quiz building, student assessment, result calculation
- **Contract**: `IQuizWidget` - submission handling, scoring logic
- **Enforced Server-Side**: Quiz ownership, attempt limits, answer validation
- **Output**: `dist/quiz-engine-widget.js`
- **Tests**: Answer validation, attempt enforcement, cheating prevention

#### 5. **Progress Tracker Widget** (Port 3005)
- **Scope**: Student progress dashboard, analytics aggregation
- **Contract**: `IProgressWidget` - read-only progress queries
- **Data Model**: Server computes progress; widget only displays
- **Output**: `dist/progress-tracker-widget.js`
- **Tests**: Correctness of progress calculation, caching strategies

#### 6. **Checkout Widget** (Port 3006)
- **Scope**: Course enrollment, payment processing, receipt management
- **Contract**: `ICheckoutWidget` - cart operations, payment submission
- **Security**: No payment secrets in frontend; strict webhook verification
- **Output**: `dist/checkout-widget.js`
- **Tests**: Replay attack prevention, idempotency, PCI compliance

#### 7. **Next.js Shell Application** (Port 3000)
- **Scope**: Routing, auth state injection, MFE orchestration
- **Responsibilities**:
  - Load MFEs dynamically via Module Federation import map
  - Inject authenticated user context into all widgets
  - Route switching without full page reload
  - CSP enforcement, global error boundaries
  - Lighthouse ≥90 on mobile

---

## Module Structure

```
composey-lms/
├── apps/
│   ├── shell/                          # Next.js host application
│   │   ├── src/
│   │   │   ├── pages/                  # Next.js pages (routes)
│   │   │   ├── components/
│   │   │   │   ├── MFEHost.tsx        # Module Federation loader
│   │   │   │   ├── ErrorBoundary.tsx
│   │   │   │   └── AuthProvider.tsx
│   │   │   ├── hooks/
│   │   │   │   ├── useAuth.ts
│   │   │   │   └── useWidget.ts
│   │   │   ├── lib/
│   │   │   │   ├── mfe-registry.ts    # Widget manifest & versioning
│   │   │   │   └── security.ts        # CSP, headers
│   │   │   └── styles/
│   │   ├── next.config.js
│   │   ├── package.json
│   │   └── __tests__/                  # ≥95% coverage
│   │
│   └── widgets/
│       ├── auth-widget/                # Micro-frontend #1
│       │   ├── src/
│       │   │   ├── components/
│       │   │   │   ├── LoginForm.tsx
│       │   │   │   ├── SignupForm.tsx
│       │   │   │   └── ForcedPasswordChange.tsx
│       │   │   ├── hooks/
│       │   │   │   └── useAuthState.ts
│       │   │   ├── bootstrap.ts        # MFE entry point
│       │   │   ├── contracts.ts        # IAuthWidget interface
│       │   │   └── __tests__/          # ≥95% coverage
│       │   ├── webpack.config.js       # Module Federation config
│       │   ├── package.json
│       │   └── public/
│       │
│       ├── course-management-widget/   # Micro-frontend #2
│       ├── lesson-viewer-widget/       # Micro-frontend #3
│       ├── quiz-engine-widget/         # Micro-frontend #4
│       ├── progress-tracker-widget/    # Micro-frontend #5
│       └── checkout-widget/            # Micro-frontend #6
│
├── services/
│   ├── api/                            # Main API service (Express)
│   │   ├── src/
│   │   │   ├── routes/
│   │   │   │   ├── courses.ts
│   │   │   │   ├── lessons.ts
│   │   │   │   ├── quizzes.ts
│   │   │   │   ├── users.ts
│   │   │   │   ├── progress.ts
│   │   │   │   └── admin.ts
│   │   │   ├── middleware/
│   │   │   │   ├── auth.ts
│   │   │   │   ├── rbac.ts
│   │   │   │   ├── logging.ts
│   │   │   │   └── security.ts
│   │   │   ├── models/                 # ORM/DB queries
│   │   │   │   ├── User.ts
│   │   │   │   ├── Course.ts
│   │   │   │   ├── Lesson.ts
│   │   │   │   ├── Quiz.ts
│   │   │   │   ├── Progress.ts
│   │   │   │   └── Enrollment.ts
│   │   │   ├── services/
│   │   │   │   ├── CourseService.ts
│   │   │   │   ├── LessonService.ts
│   │   │   │   ├── QuizService.ts
│   │   │   │   ├── ProgressService.ts
│   │   │   │   └── EnrollmentService.ts
│   │   │   ├── app.ts                  # Express app setup
│   │   │   ├── server.ts               # Server entry
│   │   │   └── __tests__/              # ≥95% coverage
│   │   ├── package.json
│   │   └── .env.example
│   │
│   ├── auth/                           # Auth service (JWT, cookies)
│   │   ├── src/
│   │   │   ├── strategies/
│   │   │   │   ├── jwt.ts
│   │   │   │   └── refresh.ts
│   │   │   ├── middleware/
│   │   │   │   ├── authenticator.ts
│   │   │   │   └── rbac.ts
│   │   │   ├── services/
│   │   │   │   ├── TokenService.ts
│   │   │   │   ├── PasswordService.ts
│   │   │   │   └── SessionService.ts
│   │   │   ├── routes/
│   │   │   │   ├── auth.ts             # Login, signup, refresh, logout
│   │   │   │   └── admin.ts            # Super-admin user mgmt
│   │   │   ├── app.ts
│   │   │   ├── server.ts
│   │   │   └── __tests__/              # ≥95% coverage
│   │   ├── package.json
│   │   └── .env.example
│   │
│   └── payment/                        # Payment service
│       ├── src/
│       │   ├── providers/
│       │   │   ├── StripeProvider.ts
│       │   │   ├── PayPalProvider.ts
│       │   │   └── IPaymentProvider.ts
│       │   ├── services/
│       │   │   ├── PaymentService.ts   # Provider abstraction
│       │   │   ├── EntitlementService.ts
│       │   │   ├── WebhookService.ts   # Idempotent handling
│       │   │   └── RefundService.ts
│       │   ├── routes/
│       │   │   ├── transactions.ts
│       │   │   ├── webhooks.ts         # Replay-proof
│       │   │   └── refunds.ts
│       │   ├── models/
│       │   │   ├── Transaction.ts
│       │   │   ├── Entitlement.ts
│       │   │   └── WebhookEvent.ts
│       │   ├── app.ts
│       │   ├── server.ts
│       │   └── __tests__/              # ≥95% coverage
│       ├── package.json
│       └── .env.example
│
├── packages/
│   ├── shared-types/                   # TypeScript types, contracts
│   │   ├── src/
│   │   │   ├── api/
│   │   │   │   ├── User.ts
│   │   │   │   ├── Course.ts
│   │   │   │   ├── Lesson.ts
│   │   │   │   ├── Quiz.ts
│   │   │   │   ├── Progress.ts
│   │   │   │   ├── Enrollment.ts
│   │   │   │   ├── Transaction.ts
│   │   │   │   └── Entitlement.ts
│   │   │   ├── contracts/              # MFE contracts
│   │   │   │   ├── IAuthWidget.ts
│   │   │   │   ├── ICourseWidget.ts
│   │   │   │   ├── ILessonWidget.ts
│   │   │   │   ├── IQuizWidget.ts
│   │   │   │   ├── IProgressWidget.ts
│   │   │   │   └── ICheckoutWidget.ts
│   │   │   ├── events/                 # Event schemas
│   │   │   │   ├── AuthEvents.ts
│   │   │   │   ├── CourseEvents.ts
│   │   │   │   ├── EnrollmentEvents.ts
│   │   │   │   └── PaymentEvents.ts
│   │   │   ├── errors/
│   │   │   │   └── AppErrors.ts        # Custom error classes
│   │   │   └── constants.ts
│   │   ├── tsconfig.json
│   │   └── package.json
│   │
│   ├── shared-utils/                   # Common utilities
│   │   ├── src/
│   │   │   ├── validation/             # Input validators
│   │   │   ├── crypto/                 # Encryption, hashing
│   │   │   ├── http/                   # HTTP clients, retries
│   │   │   ├── logging/                # Structured logging
│   │   │   ├── errors/                 # Error handling
│   │   │   ├── date/                   # Date utilities
│   │   │   └── __tests__/              # ≥95% coverage
│   │   ├── tsconfig.json
│   │   └── package.json
│   │
│   └── contract-specs/                 # Runtime contract validation
│       ├── src/
│       │   ├── validators/
│       │   │   ├── AuthValidator.ts
│       │   │   ├── CourseValidator.ts
│       │   │   ├── PaymentValidator.ts
│       │   │   └── EventValidator.ts
│       │   ├── __tests__/              # ≥95% coverage
│       │   └── index.ts
│       ├── tsconfig.json
│       └── package.json
│
├── db/
│   ├── migrations/                     # SQL migrations (Knex/TypeORM)
│   │   ├── 001_create_users.ts
│   │   ├── 002_create_courses.ts
│   │   ├── 003_create_lessons.ts
│   │   ├── 004_create_quizzes.ts
│   │   ├── 005_create_enrollments.ts
│   │   ├── 006_create_progress.ts
│   │   ├── 007_create_transactions.ts
│   │   └── 008_create_entitlements.ts
│   ├── seeds/
│   │   ├── 001_super_admin.ts
│   │   ├── 002_sample_educators.ts
│   │   ├── 003_sample_courses.ts
│   │   └── 004_sample_students.ts
│   ├── knexfile.ts
│   └── schema.sql                      # Reference schema
│
├── scripts/
│   ├── bootstrap.sh                    # Initialize DB, seed super_admin
│   ├── bootstrap.ps1                   # Windows version
│   ├── check-coverage.sh               # Enforce 95% coverage gates
│   ├── check-lighthouse.sh             # Lighthouse ≥90 mobile
│   ├── security-scan.sh                # OWASP/SonarQube checks
│   ├── start-all.sh                    # Start all services locally
│   └── docker-compose.yml              # Local dev environment
│
├── docs/
│   ├── architecture/
│   │   ├── MFE_ARCHITECTURE.md         # Deep dive into MFE setup
│   │   ├── WIDGET_CONTRACTS.md         # Contract specs & examples
│   │   ├── SECURITY_BOUNDARIES.md      # Security zones, CSP, auth
│   │   ├── DEPLOYMENT.md               # Versioning, rollout strategy
│   │   └── DATABASE_SCHEMA.md          # ER diagram, constraints
│   ├── CONTRIBUTING.md
│   ├── TESTING.md                      # Testing strategy & coverage
│   ├── TROUBLESHOOTING.md
│   └── API.md                          # API reference
│
├── .github/
│   ├── workflows/
│   │   ├── ci.yml                      # PR checks (tests, coverage, security)
│   │   ├── deploy.yml                  # Release to staging/prod
│   │   └── security-audit.yml          # OWASP, SonarQube
│   ├── copilot-instructions.md         # Workspace instructions
│   └── CODEOWNERS
│
├── .env.example                        # Environment template
├── .gitignore
├── package.json                        # Root monorepo config
├── pnpm-workspace.yaml                 # pnpm monorepo
├── tsconfig.json                       # Root TS config
├── jest.config.js                      # Root Jest config
├── sonar-project.properties            # SonarQube settings
├── docusaurus.config.js                # [Optional] Documentation site
└── LICENSE
```

---

## Local Development

### Prerequisites

```bash
Node.js ≥ 18.x
pnpm ≥ 8.x
PostgreSQL ≥ 14
Docker & Docker Compose (optional, for Postgres in container)
```

### First-Time Setup

```bash
# 1. Install dependencies
pnpm install

# 2. Create .env files (copy from .env.example)
cp .env.example .env.local
# Edit .env.local with local values

# 3. Initialize database (runs migrations, seeds super_admin)
pnpm run db:bootstrap

# 4. Verify super_admin was created
#    Email: admin@composey.local | Temp Password: TempPassword123!
#    (Must change on first login)
```

### Development Workflow

#### Option A: Develop All Services + Shell

```bash
# Terminal 1: Start all MFEs + services in watch mode
pnpm run dev

# This starts:
# - Next.js shell @ http://localhost:3000
# - Auth widget MFE @ http://localhost:3001
# - Course management MFE @ http://localhost:3002
# - Lesson viewer MFE @ http://localhost:3003
# - Quiz engine MFE @ http://localhost:3004
# - Progress tracker MFE @ http://localhost:3005
# - Checkout widget MFE @ http://localhost:3006
# - API service @ http://localhost:3000/api
# - Auth service @ http://localhost:3007
# - Payment service @ http://localhost:3008
# - PostgreSQL @ localhost:5432
```

#### Option B: Develop Single Widget + Core Services

```bash
# Start only core services (API, Auth, Payment, DB)
pnpm run services:dev

# In another terminal, develop auth-widget:
cd apps/widgets/auth-widget
pnpm run dev
# Widget runs @ http://localhost:3001

# The shell will load from the live widget via Module Federation
```

#### Option C: Using Docker Compose (Postgres Only)

```bash
# Start PostgreSQL in a container
docker-compose -f scripts/docker-compose.yml up -d postgres

# Then proceed with development as above
pnpm install
pnpm run db:bootstrap
pnpm run dev
```

### Running Tests Locally

```bash
# All tests with coverage
pnpm run test:coverage

# Watch mode (single widget)
cd apps/widgets/auth-widget
pnpm run test:watch

# Integration tests (require all services running)
pnpm run test:integration

# Security scans
pnpm run security:check
```

### Debugging

**VS Code Launch Configuration** (`.vscode/launch.json`):

```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "Shell App",
      "type": "node",
      "request": "launch",
      "program": "${workspaceFolder}/apps/shell/.next/server",
      "cwd": "${workspaceFolder}/apps/shell",
      "skipFiles": ["<node_internals>/**"],
      "console": "integratedTerminal"
    },
    {
      "name": "API Service",
      "type": "node",
      "request": "launch",
      "program": "${workspaceFolder}/services/api/src/server.ts",
      "preLaunchTask": "tsc: build",
      "cwd": "${workspaceFolder}/services/api",
      "console": "integratedTerminal"
    }
  ]
}
```

---

## Deployment & Versioning

### MFE Versioning Strategy

Each widget is **independently versioned**:

```
auth-widget:
  ├── v1.0.0  (IAuthWidget@1.0)  ← Current production
  ├── v1.1.0  (IAuthWidget@1.1)  ← Staging
  └── v2.0.0  (IAuthWidget@2.0)  ← In development

checkout-widget:
  ├── v1.0.0  (ICheckoutWidget@1.0)  ← Current production
  └── v1.1.0  (ICheckoutWidget@1.1)  ← Staging
```

### Deployment Order

1. **Dev** → Deploy any widget to dev.composey.local
2. **Staging** → Test widget with full integration suite
3. **Canary** → Roll out to 5% of production traffic (monitored)
4. **Production** → Once canary metrics OK, roll to 100%

**No rollback required if contract stable**: Old shell can still load old widget versions from CDN.

### Import Map (Shell Configuration)

File: `apps/shell/src/lib/mfe-registry.ts`

```typescript
export const MFE_REGISTRY = {
  'auth-widget': {
    url: process.env.NEXT_PUBLIC_AUTH_WIDGET_URL || 'http://localhost:3001/dist/auth-widget.js',
    version: '1.1.0',
    contract_version: 'IAuthWidget@1.1',
    scope: '/@composey/auth-widget',
  },
  'course-management-widget': {
    url: process.env.NEXT_PUBLIC_COURSE_WIDGET_URL || 'http://localhost:3002/dist/course-management-widget.js',
    version: '1.0.0',
    contract_version: 'ICourseWidget@1.0',
    scope: '/@composey/course-widget',
  },
  // ... other widgets
};
```

---

## Security Boundaries

### Threats & Mitigations

| Threat | Mitigation | Location |
|--------|-----------|----------|
| XSS | CSP headers, sanitize outputs, no eval | Shell CSP headers + widget isolation |
| CSRF | SameSite cookies, CSRF tokens | API middleware |
| SQL Injection | Parameterized queries, ORM | TypeORM/Knex |
| JWT Theft | SameSite=Strict, HTTPOnly cookies | Auth service + shell |
| Token Replay | Refresh token rotation, expiry | TokenService |
| Unauthorized Access | RBAC middleware on every endpoint | API middleware |
| Payment Hijacking | Webhook signature verification, idempotency keys | Payment service |
| Privilege Escalation | Super-admin user role immutable server-side | User.role enforced in DB |
| Leaked Secrets | No secrets in .env checked in, rotate keys | .gitignore, .env.example only |

### Authentication Flow

```
┌──────────────┐
│  Login Form  │ (Auth Widget, Port 3001)
└──────┬───────┘
       │ POST /auth/login
       ↓
┌─────────────────────────────────────────┐
│      Auth Service (Port 3007)           │
│  - Verify credentials                   │
│  - Issue JWT (5 min) + RefreshToken     │
│  - Set SameSite=Strict HTTPOnly cookie  │
└──────┬────────────────────────────────┬─┘
       │                                │
      JWT                     Refresh Token
    (expires)                 (7 days, rotated)
       │                                │
       ↓                                ↓
┌──────────────┐              ┌─────────────────┐
│Shell Auth    │              │Secure HTTP-only │
│State(Memory) │              │Cookie           │
└──────────────┘              └─────────────────┘
       │
    Token Scoped
    to Widget
       │
       ↓
┌──────────────────────────────────┐
│  Calls API Service (Port 3000)   │
│  Authorization: Bearer JWT       │
└──────────────────────────────────┘
```

### Cross-Origin Security

**Shell CSP Header**:

```
Content-Security-Policy: 
  default-src 'self';
  script-src 'self' http://localhost:3001 http://localhost:3002 ... (MFE origins);
  style-src 'self' 'unsafe-inline';
  connect-src 'self' http://localhost:3000 http://localhost:3007 http://localhost:3008;
  img-src 'self' data:;
  frame-ancestors 'none';
  base-uri 'self';
  form-action 'self';
```

### Widget Isolation

Each MFE runs in its own Webpack container:

```javascript
// auth-widget/webpack.config.js
module.exports = {
  mode: 'production',
  entry: './src/bootstrap.ts',
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'auth-widget.js',
    libraryTarget: 'window',
    library: ['__composey__', 'authWidget'],
  },
  plugins: [
    new ModuleFederationPlugin({
      name: '@composey/auth-widget',
      filename: 'remoteEntry.js',
      exposes: {
        './contracts': './src/contracts.ts',
        './Component': './src/components/AuthContainer.tsx',
      },
      shared: {
        react: { singleton: true, requiredVersion: false },
        'react-dom': { singleton: true, requiredVersion: false },
        '@composey/shared-types': { singleton: true },
      },
    }),
  ],
};
```

No shared global state. All communication is via **explicit event contracts**.

---

## Widget Contracts

### IAuthWidget Contract

**File**: [packages/shared-types/src/contracts/IAuthWidget.ts](packages/shared-types/src/contracts/IAuthWidget.ts)

```typescript
export interface IAuthWidget {
  // Current authenticated user (null if logout)
  getCurrentUser(): Promise<User | null>;

  // Perform login
  login(email: string, password: string): Promise<{ token: string; user: User }>;

  // Perform signup
  signup(data: SignupPayload): Promise<{ token: string; user: User }>;

  // Refresh access token
  refreshToken(): Promise<string>;

  // Logout & clear local state
  logout(): Promise<void>;

  // Listen to auth state changes
  onAuthStateChange(callback: (user: User | null) => void): () => void;
}
```

**Usage in Shell**:

```typescript
// apps/shell/src/hooks/useAuth.ts
import { useEffect, useState } from 'react';

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const authWidget = require('@composey/auth-widget/contracts');
    
    (async () => {
      const u = await authWidget.getCurrentUser();
      setUser(u);
      setLoading(false);
    })();

    // Subscribe to changes
    const unsubscribe = authWidget.onAuthStateChange((u) => setUser(u));
    return unsubscribe;
  }, []);

  return { user, loading };
}
```

### ICourseWidget Contract

**File**: [packages/shared-types/src/contracts/ICourseWidget.ts](packages/shared-types/src/contracts/ICourseWidget.ts)

```typescript
export interface ICourseWidget {
  // Get all courses (educator: own courses, student: enrolled)
  getCourses(): Promise<Course[]>;

  // Get course details
  getCourse(courseId: string): Promise<Course | null>;

  // Create course (educator only)
  createCourse(data: CreateCoursePayload): Promise<Course>;

  // Update course (educator, ownership enforced server-side)
  updateCourse(courseId: string, data: UpdateCoursePayload): Promise<Course>;

  // Delete course (educator, ownership enforced server-side)
  deleteCourse(courseId: string): Promise<void>;

  // Listen to course updates (for real-time sync)
  onCourseUpdate(callback: (course: Course) => void): () => void;
}
```

#### Contract Enforcement

- **Frontend**: Widgets only expose operations declared in contract
- **Backend**: Every operation re-checks ownership/permissions
- **Tests**: Contract tests validate both ends

See [docs/WIDGET_CONTRACTS.md](docs/architecture/WIDGET_CONTRACTS.md) for all contracts.

---

## Quality Gates

### 1. Test Coverage (≥95%)

```bash
pnpm run test:coverage
# Output:
# Statements   : 95.2% ( 1234/1296 )
# Branches     : 95.8% ( 456/476 )
# Functions    : 96.1% ( 789/821 )
# Lines        : 95.4% ( 1100/1153 )
```

**Gating**: No coverage drop allowed. CI fails if `<95%`.

### 2. Lighthouse Score (≥90 mobile)

```bash
pnpm run lighthouse:test
# Metrics:
# Performance: 92
# Accessibility: 96
# Best Practices: 95
# SEO: 100
```

**Gating**: Shell must maintain ≥90 on mobile. Breaks CI if failed.

### 3. No Mixed Content

```bash
pnpm run security:check
# ✓ No mixed HTTP/HTTPS
# ✓ No external fonts
# ✓ All resources same-origin
# ✓ CSP headers correct
```

### 4. No Console Errors

```bash
pnpm run test:ui
# Detects:
# ✓ No console.error() left in tests
# ✓ No console.warn() in production bundle
# ✓ No unhandled promise rejections
```

### 5. No Skipped Tests

```bash
pnpm run test:lint
# Fails if any test uses .skip or .only
# Files: apps/widgets/*/__tests__/*.test.ts
```

---

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for:
- Git workflow (main ← develop, release commits)
- Code style (Prettier, ESLint)
- Widget development checklist
- PR template & review process

---

## Troubleshooting

**Widget not loading at localhost:3000?**
- Check MFE is running: `curl http://localhost:3001/dist/auth-widget.js`
- Verify `.env.local` has correct MFE URLs
- Clear browser cache and Next.js `.next/` folder

**Database migration failed?**
- Check PostgreSQL is running: `psql -U postgres`
- View migration status: `pnpm run db:status`
- Rollback last: `pnpm run db:rollback`

**Tests failing for coverage?**
- Check for `.skip`, `.only`, or commented test blocks
- Run: `pnpm run test:coverage -- --verbose`

See [TROUBLESHOOTING.md](docs/TROUBLESHOOTING.md) for more.

---

## Security & Compliance

- **TLS**: All services behind reverse proxy with TLS termination
- **OWASP**: Top 10 mitigations in place (see [SECURITY_BOUNDARIES.md](docs/architecture/SECURITY_BOUNDARIES.md))
- **SOC2**: Audit-ready structure (logging, access control, incident response)
- **PCI-DSS**: Payment service handles no secrets (provider tokens only)
- **Encryption**: In-transit (TLS) + at-rest (DB column encryption for PII)

---

## License

MIT — See [LICENSE](LICENSE)

---

## Support

- **Issues**: GitHub Issues
- **Discussions**: GitHub Discussions
- **Security**: Email security@composey.local (no public disclosure)

---

**Last Updated**: Feb 10, 2026 | **Status**: Alpha (v0.1.0-dev)
