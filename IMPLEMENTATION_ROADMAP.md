# Composey LMS - Implementation Roadmap

This guide explains what's been built and how to implement the remaining modules.

---

## Module 0: ✅ COMPLETE

**Status**: Foundation ready for development

### What's Delivered

**Architecture & Documentation**
- Micro-frontend architecture (Module Federation)
- Widget contracts (6 interfaces, fully typed)
- Security boundaries & threat model
- Deployment strategy with canary releases
- Database schema (13 tables)

**Project Setup**
- Monorepo configuration (pnpm workspaces)
- TypeScript strict mode, Jest 95% threshold
- ESLint + Prettier configuration
- Environment template with 60+ variables
- Docker Compose for local PostgreSQL + Redis

**Scripts & Utilities**
- Bootstrap script (idempotent, Windows + Linux)
- Coverage enforcement script (95% minimum)
- Lighthouse performance check (≥90 mobile)
- Database migrations framework

**Guidelines**
- Comprehensive README (700+ lines)
- Contributing guide (git workflow, standards)
- Troubleshooting documentation
- Security checklist (OWASP + SOC2)

---

## Module 1: 🔨 IMPLEMENTATION GUIDE

### Auth Widget + Auth Service

#### Step 1: Setup Auth Service

```bash
cd services/auth
pnpm init -y

# Create package.json
# Add dependencies: express, jsonwebtoken, bcrypt, pg, knex
```

**Key Files to Create**:

```typescript
// src/services/TokenService.ts - JWT + refresh token logic
export class TokenService {
  // issueTokenPair(userId: string): { accessToken, refreshToken }
  // refreshAccessToken(refreshToken: string): { accessToken }
  // revokeToken(refreshToken: string): void
  // validateToken(token: string): { userId, role, scope }
}

// src/routes/auth.ts - Auth endpoints
POST /auth/login → TokenService.issueTokenPair() → Set HTTPOnly cookie
POST /auth/signup → Create user → issueTokenPair()
POST /auth/refresh → TokenService.refreshAccessToken()
POST /auth/logout → TokenService.revokeToken()
PUT /auth/password → Change password, force change check

// src/middleware/authenticator.ts - JWT verification
export function authenticateRequest(req, res, next)
  // Read JWT from Authorization header
  // Throw 401 if invalid or expired
  // Attach req.user = { id, role, scope }
```

**Test Everything at 95%**:
- Token issuance
- Token refresh (rotation)
- Token expiry
- Password hashing (bcrypt)
- Rate limiting (failed logins)
- Forced password change flow

#### Step 2: Setup Auth Widget MFE

```bash
cd apps/widgets/auth-widget
pnpm init -y

# Dependencies: react, webpack, zone.js Module Federation
```

**Key Files**:

```typescript
// src/contracts.ts - Implement IAuthWidget
export interface IAuthWidget { ... } // from @composey/shared-types

// src/bootstrap.ts - Widget bootstrap
export const authWidgetAPI: IAuthWidget = {
  async getCurrentUser() { /* fetch /auth/me */ },
  async login(email, password) { /* POST /auth/login */ },
  async signup(data) { /* POST /auth/signup */ },
  async logout() { /* POST /auth/logout */ },
  onAuthStateChange(callback) { /* Subscription */ },
}

// src/components/LoginForm.tsx
// LoginForm.tsx - Form validation, error handling, loading states
// SignupForm.tsx - Role selection, terms checkbox
// ForcedPasswordChange.tsx - Shown when mustChangePassword=true

// webpack.config.js - Module Federation setup
new ModuleFederationPlugin({
  name: '@composey/auth-widget',
  fileName: 'remoteEntry.js',
  exposes: {
    './contracts': './src/contracts.ts',
    './Component': './src/components/AuthContainer.tsx',
  },
  shared: { react: { singleton: true } },
})
```

**Test at 95%**:
- Login form validation
- Signup role selection
- Token storage in memory
- Onchange callbacks fire
- Error handling (invalid credentials, network)
- Forced password change flow

#### Step 3: Integrate into Shell

```typescript
// apps/shell/src/hooks/useAuth.ts
export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const authWidget = useRef<IAuthWidget | null>(null);

  useEffect(() => {
    loadMFE('auth-widget').then(mfe => {
      authWidget.current = mfe.contracts;
      mfe.contracts.getCurrentUser().then(setUser);
      mfe.contracts.onAuthStateChange(setUser);
    });
  }, []);

  return { user, login: authWidget.current?.login };
}

// pages/login.tsx
export default function LoginPage() {
  const { widget: authWidget } = useMFEWidget('auth-widget');
  return authWidget ? <authWidget.Component /> : <Loading />;
}
```

---

## Module 2: 🔨 IMPLEMENTATION GUIDE

### LMS Core Widgets (Courses, Lessons, Quizzes, Progress)

#### API Service Foundation

```bash
cd services/api
pnpm init -y

# Create CRUD endpoints for:
# - /api/courses
# - /api/lessons
# - /api/quizzes
# - /api/progress (read-only)
# - /api/enrollments
```

**Ownership Enforcement**:

```typescript
// middleware/requireOwnership.ts
export function requireOwnership(resourceType: 'course' | 'lesson') {
  return async (req, res, next) => {
    const resource = await db(resourceType).where('id', req.params.id).first();
    
    if (!resource) return res.status(404).json({ error: 'Not found' });
    
    if (req.user.role === 'super_admin') return next(); // Bypass check
    
    if (resource.educator_id !== req.user.id) {
      return res.status(403).json({ error: 'You do not own this resource' });
    }
    
    next();
  };
}

// routes/courses.ts
router.put('/courses/:id',
  authenticate,
  requireRole(['educator']),
  requireOwnership('course'),
  (req, res) => {
    // Educator can only update their own courses
  }
);
```

#### Widget Development Pattern

**For each widget (course, lesson, quiz, progress):**

1. **Define Contract** (in `@composey/shared-types`)
   ```typescript
   export interface ILessonWidget {
     getLesson(id): Promise<Lesson>;
     createLesson(data): Promise<Lesson>;
     updateProgress(id, progress): Promise<void>;
   }
   ```

2. **Create Widget**
   ```bash
   cd apps/widgets/lesson-viewer-widget
   # Create bootstrap.ts implementing ILessonWidget
   # Create React components (LessonViewer, ProgressBar, etc.)
   # Create webpack.config.js with Module Federation
   ```

3. **Implement API Routes**
   ```typescript
   // services/api/src/routes/lessons.ts
   GET /api/lessons/:id → getLesson (check enrollment)
   POST /api/lessons/:id/progress → updateProgress (check student owns)
   POST /api/lessons (educator only) → createLesson (check educator owns course)
   ```

4. **Test at 95%**
   - Unit tests (widget isolation)
   - Contract tests (API ↔ widget)
   - Access control tests (no unauthorized access)
   - Data consistency tests

---

## Module 3: 🔨 IMPLEMENTATION GUIDE

### Payment Service + Checkout Widget

#### Payment Service

```bash
cd services/payment
pnpm init -y

# Dependencies: stripe, paypal-rest-sdk, express
```

**Key Pattern: Provider Abstraction**

```typescript
// src/providers/IPaymentProvider.ts
export interface IPaymentProvider {
  createPaymentSession(courseId, amount): Promise<SessionId>;
  confirmPayment(sessionId): Promise<TransactionResult>;
  issueRefund(transactionId): Promise<void>;
}

// src/providers/StripeProvider.ts
export class StripeProvider implements IPaymentProvider {
  async createPaymentSession(courseId, amount) {
    const session = await stripe.checkout.sessions.create({
      line_items: [{ price_data: { amount }, quantity: 1 }],
      mode: 'payment',
    });
    return session.id;
  }
}

// src/providers/PayPalProvider.ts
export class PayPalProvider implements IPaymentProvider {
  // Similar pattern for PayPal API
}

// src/services/PaymentService.ts
export class PaymentService {
  private provider: IPaymentProvider;

  constructor(providerName: 'stripe' | 'paypal') {
    this.provider = providerName === 'stripe' 
      ? new StripeProvider() 
      : new PayPalProvider();
  }

  async initiatePayment(courseId: string, amount: number) {
    return this.provider.createPaymentSession(courseId, amount);
  }

  async confirmAndEnroll(transactionId: string, studentId: string) {
    const result = await this.provider.confirmPayment(transactionId);
    
    // Grant entitlement
    await db('entitlements').insert({
      student_id: studentId,
      course_id: result.courseId,
      transaction_id: transactionId,
      granted_at: new Date(),
    });
    
    return result;
  }
}
```

**Webhook Handling (Idempotent)**:

```typescript
// src/routes/webhooks.ts
POST /webhooks/stripe
  // 1. Verify signature (stripe.webhooks.constructEvent)
  // 2. Check if already processed: WHERE transaction_id = event.data.object.id
  // 3. If new: Grant entitlement, send confirmation email
  // 4. Return 200 (important: Stripe retries until 200)

// Protection against replay attacks:
POST /webhooks/stripe
  // 1. Verify signature (stripe signing key)
  // 2. Idempotency: Check if this event_id already processed
  // 3. If yes: Return 200 (already handled)
  // 4. If no: Process payment → grant access → mark as processed
```

#### Checkout Widget

```bash
cd apps/widgets/checkout-widget
pnpm init -y

# Implement ICheckoutWidget contract
# Components:
# - CoursePrice.tsx (show course + price)
# - PaymentMethodSelector.tsx (Stripe card vs PayPal)
# - CheckoutForm.tsx (Stripe Elements or PayPal)
# - OrderConfirmation.tsx (thank you, invoice link)
```

**Key Constraint: No Payment Secrets on Frontend**

```typescript
// ✅ GOOD - Frontend only collects, backend processes
POST /api/checkout/initiate
  Request: { courseId, paymentMethod: 'card' | 'paypal' }
  Response: { clientSecret, publicKey } // Stripe client secret, not secret key

// ❌ BAD - Never send secret key to frontend
REST_API_STRIPE_SECRET=sk_live_***   // NEVER expose to frontend

// In backend webhook handler only:
const event = stripe.webhooks.constructEvent(
  body,
  signature,
  process.env.STRIPE_WEBHOOK_SECRET  // Backend only
);
```

---

## Module 4: 🔨 IMPLEMENTATION GUIDE

### Bootstrap, Quality Gates, Deployment

#### Bootstrap Completion

**Already Provided**: `scripts/bootstrap.sh` (Bash) and `scripts/bootstrap.ps1` (PowerShell)

**To Complete**: Add to GitHub Actions

```yaml
# .github/workflows/bootstrap.yml
on: workflow_dispatch

jobs:
  bootstrap:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: pnpm/action-setup@v2
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'pnpm'
      
      - name: Bootstrap database
        env:
          DB_HOST: postgres-container
          DB_USER: composey
          DB_PASSWORD: ${{ secrets.DB_PASSWORD }}
        run: |
          pnpm install
          bash scripts/bootstrap.sh
```

#### Quality Gates Automation

**Test Coverage (95%)**:

```bash
# Already provided: scripts/check-coverage.sh
# Add to CI:
pnpm run test:coverage
bash scripts/check-coverage.sh
```

**Lighthouse (≥90 mobile)**:

```bash
# Already provided: scripts/check-lighthouse.sh
# Add to CI:
pnpm run lighthouse:test
bash scripts/check-lighthouse.sh

# On failure: Automatically create issue
if [ $? -ne 0 ]; then
  gh issue create --title "Lighthouse Score Dropped" --body "..."
fi
```

**No Skipped Tests**:

```bash
# Check in CI
pnpm run test:lint:skip
# Fails if any .skip, .only, or xit found
```

#### CI/CD Pipeline

```yaml
# .github/workflows/ci.yml
on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - run: pnpm run test:coverage  # Must pass + ≥95%
      - run: pnpm run lint           # ESLint + Prettier
      - run: pnpm run typecheck      # TypeScript
      - run: npm audit --audit-level=high  # Security

  build:
    runs-on: ubuntu-latest
    steps:
      - run: pnpm run build          # Compile all packages
      - run: pnpm run build:widgets  # Webpack bundles

  lighthouse:
    runs-on: ubuntu-latest
    steps:
      - run: pnpm run lighthouse:test  # ≥90 enforced

  deploy-staging:
    if: github.ref == 'refs/heads/develop'
    runs-on: ubuntu-latest
    steps:
      - run: docker build -t composey-shell:staging .
      - run: kubectl set image deployment/shell shell-image=composey-shell:staging
```

---

## Quick Start for Implementation

### For Module 1 (Auth):

```bash
# 1. Setup auth service
cd services/auth
npm init -y
# Install: express, jsonwebtoken, bcrypt, pg, knex

# 2. Implement TokenService
# See: services/auth/src/services/TokenService.ts template above

# 3. Create auth routes
# See: services/auth/src/routes/auth.ts template above

# 4. Test at 95% coverage
npm run test:coverage

# 5. Setup auth widget
cd ../../apps/widgets/auth-widget
npm init -y

# 6. Implement IAuthWidget contract
# See: apps/widgets/auth-widget/src/contracts.ts above

# 7. Create React components (LoginForm, SignupForm)
# 8. Create webpack.config.js with Module Federation
# 9. Test at 95% coverage
npm run test:coverage

# 10. Start development
npm run dev  # Runs on port 3001

# 11. In shell, verify it loads
# Navigate to http://localhost:3000/login
# Should see auth widget from port 3001
```

### For Module 2 (LMS):

```bash
# 1. Implement API routes first
cd services/api

# Add CourseService, LessonService, QuizService, ProgressService
# Add routes following ownership enforcement pattern
# Test each route with curl or Postman

# 2. For each widget, implement the contract
# Start with ICourseWidget
# Then ILessonWidget, IQuizWidget, IProgressWidget

# 3. Create React components in each widget
# 4. Ensure 95% coverage on tests
# 5. Test widget-to-API integration
```

### For Module 3 (Payments):

```bash
# 1. Implement IPaymentProvider interface
# 2. Create StripeProvider, PayPalProvider
# 3. Implement webhook handlers (idempotent)
# 4. Create checkout widget with ICheckoutWidget
# 5. Test payment flow end-to-end
# 6. Test replay attack prevention
```

### For Module 4 (Polish):

```bash
# 1. Verify all scripts work locally
# 2. Set up GitHub Actions CI/CD
# 3. Add monitoring (Prometheus, Sentry)
# 4. Cross-browser testing (BrowserStack)
# 5. Performance profiling
# 6. Security hardening
```

---

## Success Criteria per Module

### Module 1: Auth ✅
- [ ] JWT tokens issued + refreshed
- [ ] HTTPOnly cookies set correctly
- [ ] Forced password change enforced
- [ ] [Rate limiting on login](services/auth/src/middleware/rateLimiter.ts) (5 attempts = lock)
- [ ] Auth widget loads in shell
- [ ] All tests pass (≥95% coverage)  
- [ ] Audit logging of auth events
- [ ] Super-admin console works

### Module 2: LMS ✅
- [ ] Courses, lessons, quizzes created/read/updated/deleted
- [ ] Ownership enforced server-side (educator can only edit own courses)
- [ ] Students can only access enrolled courses
- [ ] Progress tracked automatically
- [ ] All 4 widgets load in shell
- [ ] All tests pass (≥95% coverage)
- [ ] Contract tests validate shell ↔ API communication

### Module 3: Payments ✅
- [ ] Stripe payments work end-to-end
- [ ] PayPal integration working
- [ ] Enrollment granted on payment success
- [ ] Webhooks idempotent (replay-proof)
- [ ] Invoices generated + downloadable
- [ ] Refunds processed correctly
- [ ] No payment secrets exposed on frontend
- [ ] All tests pass (≥95% coverage)

### Module 4: Polish ✅
- [ ] Bootstrap script works (Windows + Linux)
- [ ] Coverage enforced at 95%
- [ ] Lighthouse ≥90 on mobile
- [ ] No skipped tests allowed
- [ ] CI/CD pipeline green
- [ ] Monitoring alerts configured
- [ ] Cross-browser testing complete
- [ ] Security audit passed (OWASP + SOC2)

---

## Resources

- [MFE Architecture Deep Dive](docs/architecture/MFE_ARCHITECTURE.md)
- [Widget Contracts Reference](docs/architecture/WIDGET_CONTRACTS.md)
- [Security Implementation Guide](docs/architecture/SECURITY_BOUNDARIES.md)
- [Deployment Playbook](docs/architecture/DEPLOYMENT.md)
- [Contributing Guidelines](CONTRIBUTING.md)

---

**Next Step**: Start Module 1 implementation. Follow the templates above to implement Auth Service and Auth Widget.

Good luck! 🚀
