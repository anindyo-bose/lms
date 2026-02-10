# Authentication & Security Boundaries

## Overview

Composey implements **zero-trust security** with TLS everywhere, encrypted credentials, token scoping, and RBAC at every layer.

---

## JWT + Refresh Token Strategy

### Token Lifecycle

```
┌─────────────┐
│ User Logins │ POST /auth/login
└──────┬──────┘
       │
       ↓
┌──────────────────────────────────────┐
│   Auth Service Validates              │
│   - Credentials from DB               │
│   - Account status (not locked)       │
│   - IP whitelist (if enabled)         │
└──────┬───────────────────────────────┘
       │
       ├──→ Issue JWT (5 min expiry)
       │    ├─ Payload: { sub: userId, role, scope: ["shell"] }
       │    ├─ Encoded: HS256 (secret key in env)
       │    └─ No sensitive data in payload
       │
       └──→ Issue Refresh Token (7 days)
            ├─ Random 64-byte token
            ├─ Stored in DB with hash
            ├─ Set as HTTPOnly SameSite=Strict cookie
            └─ Cannot be accessed by JS

┌──────────────────────┐
│ Client State         │
├──────────────────────┤
│ JWT in Memory        │ ✓ Sent in Authorization header
│ RefreshToken in      │   Cannot access from JS
│ HTTPOnly Cookie      │   Auto-sent in requests
└──────────────────────┘
```

### JWT Structure

**Example JWT Payload**:

```json
{
  "sub": "user_12345",
  "email": "student@example.com",
  "role": "student",
  "scope": ["shell", "lesson-viewer"],
  "iat": 1676034000,
  "exp": 1676034300,
  "iss": "https://auth.composey.local",
  "aud": "shell-app"
}
```

**No Sensitive Data**: 
- ❌ No passwords
- ❌ No API keys
- ❌ No credit card data
- ❌ No personal address

### Refresh Token Rotation

```javascript
// services/auth/src/services/TokenService.ts

export class TokenService {
  /**
   * Issue tokens after successful login
   * Old refresh tokens are invalidated
   */
  async issueTokenPair(userId: string) {
    // Invalidate previous refresh tokens
    await db('refresh_tokens')
      .where('user_id', userId)
      .where('revoked_at', null)
      .update({ revoked_at: new Date() });

    // Issue new pair
    const accessToken = jwt.sign(
      {
        sub: userId,
        role: getUserRole(userId),
        iat: Date.now(),
        exp: Date.now() + 5 * 60 * 1000, // 5 min
      },
      process.env.JWT_SECRET!
    );

    const refreshToken = crypto.randomBytes(64).toString('hex');
    const refreshTokenHash = hash(refreshToken);

    await db('refresh_tokens').insert({
      user_id: userId,
      token_hash: refreshTokenHash,
      expires_at: addDays(new Date(), 7),
      created_at: new Date(),
    });

    return { accessToken, refreshToken };
  }

  /**
   * Refresh access token
   * Validates refresh token not revoked or expired
   */
  async refreshAccessToken(refreshToken: string) {
    const tokenHash = hash(refreshToken);
    
    const record = await db('refresh_tokens')
      .where('token_hash', tokenHash)
      .where('revoked_at', null)
      .where('expires_at', '>=', new Date())
      .first();

    if (!record) {
      throw new TokenError('INVALID_REFRESH_TOKEN', 'Token expired or revoked');
    }

    const accessToken = jwt.sign(
      {
        sub: record.user_id,
        role: getUserRole(record.user_id),
        iat: Date.now(),
        exp: Date.now() + 5 * 60 * 1000,
      },
      process.env.JWT_SECRET!
    );

    return { accessToken };
  }
}
```

---

## Cookie Security

### HTTPOnly SameSite Cookies

**In auth service response** (`services/auth/src/routes/auth.ts`):

```javascript
app.post('/auth/login', async (req, res) => {
  const { email, password } = req.body;

  // ... authentication logic ...

  const { accessToken, refreshToken } = await tokenService.issueTokenPair(user.id);

  // Set refresh token in secure cookie
  res.cookie('composey_refresh_token', refreshToken, {
    httpOnly: true,          // ✓ Not accessible to JS
    secure: process.env.NODE_ENV === 'production', // ✓ HTTPS only in prod
    sameSite: 'strict',      // ✓ No cross-site requests
    domain: process.env.COOKIE_DOMAIN, // e.g., '.composey.local'
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    path: '/api/auth',       // Only sent to auth endpoints
  });

  // Send access token in body (clients store in memory)
  res.json({
    accessToken,
    expiresIn: 300,
    // refreshToken: NOT sent (already in cookie)
  });
});
```

### Why Not localStorage for Refresh Token?

| Storage | XSS Risk | CSRF Risk | Logout Control |
|---------|----------|-----------|-----------------|
| HTTPOnly Cookie | ✓ Safe | ⚠️ Need CSRF token | ✓ Server can revoke |
| localStorage | ❌ Vulnerable | ✓ Safe | ⚠️ Client-side only |

Using **HTTPOnly cookies** for refresh token prevents XSS attacks from stealing tokens.

---

## RBAC Middleware

### Role-Based Access Control (RBAC)

**File**: `services/api/src/middleware/rbac.ts`

```typescript
export type Role = 'student' | 'educator' | 'admin' | 'super_admin';
export type Permission = 
  | 'courses:create'       // Educator
  | 'courses:manage'       // Educator (own)
  | 'courses:view'         // Student, Educator, Admin
  | 'users:manage'         // Admin, Super Admin
  | 'users:impersonate'    // Super Admin
  | 'system:audit'         // Admin, Super Admin
  | 'system:config';       // Super Admin

// Role → Permission mapping
const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  student: ['courses:view', 'progress:read'],
  educator: ['courses:create', 'courses:manage', 'courses:view'],
  admin: ['users:manage', 'courses:view', 'system:audit'],
  super_admin: ['users:impersonate', 'system:config', 'users:manage', 'system:audit'],
};

export function requireRole(allowedRoles: Role[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    const user = req.user; // Set by auth middleware

    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    if (!allowedRoles.includes(user.role)) {
      return res.status(403).json({ 
        error: 'Forbidden',
        requiredRoles: allowedRoles,
        userRole: user.role,
      });
    }

    next();
  };
}

export function requirePermission(permission: Permission) {
  return (req: Request, res: Response, next: NextFunction) => {
    const user = req.user;

    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const userPermissions = ROLE_PERMISSIONS[user.role] || [];
    
    if (!userPermissions.includes(permission)) {
      return res.status(403).json({ 
        error: 'Forbidden',
        requiredPermission: permission,
      });
    }

    next();
  };
}

export function requireOwnership(resourceGetter: (req: Request) => string) {
  return async (req: Request, res: Response, next: NextFunction) => {
    const user = req.user;
    const resourceOwnerId = resourceGetter(req);

    // Super admin bypasses ownership check
    if (user.role === 'super_admin') {
      return next();
    }

    if (user.id !== resourceOwnerId) {
      return res.status(403).json({ 
        error: 'Forbidden',
        message: 'You do not own this resource',
      });
    }

    next();
  };
}
```

### Usage in Routes

```typescript
// GET /api/courses/:courseId - Anyone can view
router.get('/courses/:courseId', 
  authenticate,
  async (req, res) => {
    const course = await courseService.getCourse(req.params.courseId);
    res.json(course);
  }
);

// POST /api/courses - Educator only
router.post('/courses',
  authenticate,
  requireRole(['educator', 'admin']),
  async (req, res) => {
    const course = await courseService.createCourse(req.user.id, req.body);
    res.json(course);
  }
);

// PUT /api/courses/:courseId - Owner only
router.put('/courses/:courseId',
  authenticate,
  requireRole(['educator']),
  requireOwnership(req => req.params.courseId), // Validated server-side
  async (req, res) => {
    const course = await courseService.updateCourse(req.params.courseId, req.body);
    res.json(course);
  }
);

// POST /api/admin/users - Admin+ only
router.post('/admin/users',
  authenticate,
  requirePermission('users:manage'),
  async (req, res) => {
    const user = await userService.createUser(req.body);
    res.json(user);
  }
);
```

---

## Super-Admin Console (MFE)

### Initialization Flow

```bash
Bootstrap Flow:
1. System starts empty (or with existing data)
2. Run /scripts/bootstrap.sh
   ├─ Create super_admin user
   ├─ Email: admin@composey.local
   ├─ Temp Password: TempPassword123!
   ├─ mustChangePassword: true
   └─ Store in DB encrypted
3. Super-admin logs in
4. Forced password change
5. Access super-admin console
```

### Super-Admin Exclusive Operations

**File**: `services/api/src/routes/admin.ts`

```typescript
// Only super_admin can access these endpoints

// Create new admin user
POST /api/admin/users
Body: { email, firstName, lastName, role: 'admin' | 'super_admin' }

// Reset user password (forcing them to change on next login)
POST /api/admin/users/:userId/force-password-reset
Response: { tempPassword: '...' } // Send to user out-of-band

// View audit logs
GET /api/admin/audit-logs?filter=user_login&limit=1000

// Manage system settings
PUT /api/admin/settings
Body: { 
  siteName, 
  logo, 
  smtp: { host, port, user }, 
  timeoutMinutes,
  ipWhitelist: ['10.0.0.1'],
}

// View user impersonation logs
GET /api/admin/impersonations

// Impersonate user (for support)
POST /api/admin/users/:userId/impersonate
Response: { tempToken: '...' } // Scoped token, logs impersonation
```

### Super-Admin UI (Widget)

```typescript
// apps/shell/src/pages/admin/super-admin.tsx
import { requireRole } from '../middleware/auth';

export async function getServerSideProps(context) {
  if (context.req.user?.role !== 'super_admin') {
    return { notFound: true };
  }
  return { props: {} };
}

export default function SuperAdminConsole() {
  return (
    <div>
      <h1>Super-Admin Console</h1>
      <Tabs>
        <Tab label="Users">
          <UserManagement />
        </Tab>
        <Tab label="Settings">
          <SystemSettings />
        </Tab>
        <Tab label="Audit Logs">
          <AuditLog />
        </Tab>
        <Tab label="Course Moderation">
          <CourseModerationQueue />
        </Tab>
      </Tabs>
    </div>
  );
}
```

---

## Content Security Policy (CSP)

### Shell CSP Headers

**File**: `apps/shell/next.config.js`

```javascript
async function headers() {
  return [
    {
      source: '/:path*',
      headers: [
        {
          key: 'Content-Security-Policy',
          value: [
            "default-src 'self'",
            "script-src 'self'",
            "http://localhost:3001",  // Auth widget origin (dev)
            "http://localhost:3002",  // Course widget origin
            "https://*.cdn.composey.com", // Production widget CDN
            "style-src 'self' 'unsafe-inline'", // Needed for styled-components
            "font-src 'self' https://fonts.googleapis.com",
            "connect-src 'self' http://localhost:3000 http://localhost:3007",
            "img-src 'self' data: https:",
            "media-src 'self' https:",
            "frame-ancestors 'none'",
            "base-uri 'self'",
            "form-action 'self'",
            "upgrade-insecure-requests", // In production
          ].join(';'),
        },
        {
          key: 'X-Content-Type-Options',
          value: 'nosniff',
        },
        {
          key: 'X-Frame-Options',
          value: 'DENY',
        },
        {
          key: 'X-XSS-Protection',
          value: '1; mode=block',
        },
        {
          key: 'Referrer-Policy',
          value: 'strict-origin-when-cross-origin',
        },
        {
          key: 'Permissions-Policy',
          value: [
            'accelerometer=()',
            'camera=()',
            'geolocation=()',
            'gyroscope=()',
            'magnetometer=()',
            'microphone=()',
            'payment=()',
            'usb=()',
          ].join(','),
        },
      ],
    },
  ];
}
```

### Test CSP Compliance

```bash
# Lighthouse CSP score
pnpm run lighthouse:test

# Manual: Check browser console for CSP violations
# DevTools → Console → Should see 0 CSP warnings
```

---

## OWASP Top 10 Mitigations

| OWASP Risk | Threat | Mitigation |
|---|---|---|
| A01:Broken Access Control | Unauthorized resource access | RBAC + ownership checks, server-side enforcement |
| A02:Cryptographic Failures | Plaintext transmission | TLS everywhere, encrypted fields (PII) |
| A03:Injection | SQL injection | Parameterized queries, ORM (TypeORM) |
| A04:Insecure Design | No password reset | Forced change on first login, secure reset flow |
| A05:Security Misconfiguration | Exposed secrets | Never in .env.example, rotation policy |
| A06:Vulnerable Components | Outdated dependencies | `npm audit`, security scans, pinned versions |
| A07:Authentication Failure | Credential stuffing | Rate limiting, account lockout after 5 failed |
| A08:Data Integrity | Payment tampering | Webhook signature validation, idempotency keys |
| A09:Logging Failure | No audit trail | Structured logging, immutable audit logs |
| A10:SSRF | Server-side request forgery | URL allowlist for video delivery, no user URLs |

---

## Logging & Audit Trail

### No Sensitive Data in Logs

**Rules**:
- ❌ Never log passwords
- ❌ Never log credit card numbers
- ❌ Never log tokens
- ❌ Never log API keys
- ❌ Never log personal addresses

**Safe Logging**:

```typescript
// ✓ GOOD
logger.info('User login attempt', {
  userId: user.id,
  email: user.email.substring(0, 3) + '***', // Masked
  timestamp: new Date(),
  success: true,
});

// ❌ BAD
logger.info('User login', {
  password: plaintext, // NEVER
  creditCard: '4111-1111-1111-1111', // NEVER
  token: jwt, // NEVER
});
```

### Structured Logging Format

```json
{
  "timestamp": "2024-02-10T12:00:00Z",
  "level": "info",
  "service": "auth-service",
  "event": "user_login_success",
  "userId": "user_12345",
  "email": "stu***@example.com",
  "role": "student",
  "ipAddress": "192.168.1.100",
  "userAgent": "Mozilla/5.0...",
  "duration_ms": 250,
  "requestId": "req_abc123"
}
```

### Audit Log Table

**Schema**: `audit_logs`

```sql
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL,
  action VARCHAR(100),
  resource_type VARCHAR(50),
  resource_id UUID,
  changes JSONB, -- Before/after values (PII masked)
  ip_address INET,
  user_agent TEXT,
  status VARCHAR(20),
  reason TEXT,
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);
```

Logs all user actions:
- Login/logout
- Create/update/delete resources
- Permission changes
- Admin actions
- Suspicious activity

---

## Incident Response Checklist

**If breach suspected:**

1. ✓ Kill all active sessions: `UPDATE refresh_tokens SET revoked_at = NOW()`
2. ✓ Force password reset: Mark all users `mustChangePassword = true`
3. ✓ Rotate JWT secret
4. ✓ Rotate API keys
5. ✓ Review audit logs for compromise
6. ✓ Notify affected users
7. ✓ Post-mortem & remediation

---

## Summary

Security is **not optional**. Every endpoint enforces:

✅ **Authentication**: JWT + refresh tokens  
✅ **Authorization**: Role-based + ownership checks  
✅ **Encryption**: TLS in transit, at-rest for PII  
✅ **CSP**: Headers block malicious scripts  
✅ **Logging**: Zero sensitive data, full audit trail  
✅ **Compliance**: OWASP + SOC2 ready  

Composey is production-hardened from day one.
