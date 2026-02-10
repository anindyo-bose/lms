# Composey LMS - Contributing Guide

## Development Workflow

### 1. Branch Strategy

```
main (production)
  ↑
develop (staging)
  ↑
feature/* (development branches)
```

**Branch naming**:
- Feature: `feature/auth-mfa`
- Bugfix: `bugfix/auth-token-leak`
- Docs: `docs/update-readme`

### 2. Git Commit Convention

Commits follow conventional commits:

```
<type>(<scope>): <subject>

<body>

<footer>
```

**Types**:
- `feat:` New feature
- `fix:` Bug fix
- `docs:` Documentation
- `refactor:` Code refactor (no behavioral change)
- `test:` Add or update tests
- `ci:` CI/CD changes
- `chore:` Dependency updates, tooling

**Example**:
```
feat(auth-widget): add SSO support

Implements OAuth 2.0 with Google and GitHub providers.
Stored securely in HTTPOnly cookies.

Closes #123
```

### 3. Pull Request Checklist

Before opening a PR:

- [ ] Code builds without errors: `pnpm run build`
- [ ] All tests pass: `pnpm run test:coverage` (95%+ coverage)
- [ ] No console errors: `pnpm run test:ui`
- [ ] Linting passes: `pnpm run lint`
- [ ] No skipped tests: `grep -r 'skip\|only' apps/`
- [ ] TypeScript strict: `pnpm run typecheck`
- [ ] Security scan: `npm audit --audit-level=high`
- [ ] Document changes in PR description
- [ ] Link related issues

### 4. Code Review Process

1. **Automated Checks** (CI): Coverage, Lighthouse, security
2. **Manual Review**: Architecture, security, testing
3. **Approval**: At least 2 approvals from CODEOWNERS
4. **Merge**: Squash-merge to reduce noise in main branch

## Widget Development Guide

### Creating a New Widget

1. **Create widget package**:
   ```bash
   mkdir -p apps/widgets/my-widget/src
   ```

2. **Setup webpack.config.js**:
   - Module Federation plugin
   - Expose contracts
   - Shared dependencies

3. **Define contracts**:
   ```typescript
   // src/contracts.ts
   export interface IMyWidget {
     method1(): Promise<Result>;
     method2(): void;
   }
   ```

4. **Implement bootstrap**:
   ```typescript
   // src/bootstrap.ts
   export const myWidgetAPI: IMyWidget = { ... };
   ```

5. **Test comprehensively**:
   - Unit tests (widget isolation)
   - Contract tests (shell integration)
   - No external dependencies

### Widget Checklist

- [ ] Contracts match [packages/shared-types](../../packages/shared-types/src/contracts/)
- [ ] `build:mfe` outputs to `dist/widget-name.js`
- [ ] No shared mutable global state
- [ ] No direct database access
- [ ] All permissions validated server-side
- [ ] Tests cover ≥95% of code
- [ ] Bundle size < target (see [MFE_ARCHITECTURE.md](docs/architecture/MFE_ARCHITECTURE.md))
- [ ] Lighthouse ≥90 mobile
- [ ] CSP compliant
- [ ] Documented in README

## Testing Conventions

### Unit Tests

```typescript
// Widget isolation - no external calls
describe('IAuthWidget Contract', () => {
  it('should expose getCurrentUser method', () => {
    expect(typeof authWidget.getCurrentUser).toBe('function');
  });
});
```

### Contract Tests

```typescript
// Shell ↔ Widget integration
describe('Auth Widget Contract @ IAuthWidget@1.1', () => {
  it('should conform to contract', async () => {
    const mfe = await loadMFE('auth-widget');
    expect(mfe.contracts).toMatchObject({
      getCurrentUser: expect.any(Function),
      login: expect.any(Function),
    });
  });
});
```

### Integration Tests

```typescript
// Full system flow
describe('Auth Flow - UI to API', () => {
  it('should login and access protected endpoint', async () => {
    const result = await authWidget.login('test@example.com', 'password');
    const response = await fetch('http://localhost:3000/api/courses', {
      headers: { Authorization: `Bearer ${result.token}` },
    });
    expect(response.ok).toBe(true);
  });
});
```

## Code Style

### TypeScript (Strict Mode)

```typescript
// ✓ GOOD
interface User {
  id: string;
  email: string;
}

function getUser(id: string): Promise<User | null> {
  return fetchUser(id);
}

// ❌ BAD
function getUser(id) { // Missing types
  return fetchUser(id);
}

const data: any = user; // Avoid any
```

### React Components

```typescript
// ✓ GOOD - Functional component with hooks
const LoginForm: React.FC = () => {
  const [email, setEmail] = useState('');
  return <form>...</form>;
};

// ❌ BAD - Class components (avoid)
class LoginForm extends React.Component { ... }
```

### No Console Logs in Production

```javascript
// ✓ GOOD
if (process.env.NODE_ENV === 'development') {
  console.log('Debug:', data);
}

// ✓ GOOD - Use structured logging
logger.info('User login', { userId, email });

// ❌ BAD
console.log('data:', data);
```

## Security Checklist

- [ ] No secrets in code
- [ ] No plaintext passwords
- [ ] No tokens in logs
- [ ] Input validation on all endpoints
- [ ] Output sanitization for HTML
- [ ] CORS properly configured
- [ ] Rate limiting on auth endpoints
- [ ] Audit logging for sensitive actions
- [ ] PII masked in logs
- [ ] OWASP Top 10 addressed

## Documentation

All public APIs must be documented:

```typescript
/**
 * Get user by ID
 * @param userId User identifier
 * @returns User object or null if not found
 * @throws UserError if database error
 * @example
 * const user = await getUserById('user_123');
 */
async function getUserById(userId: string): Promise<User | null> {
  // ...
}
```

## Troubleshooting

**Q: My widget doesn't load in the shell**
A: Check MFE URL in `mfe-registry.ts`, verify webpack config, check browser console for CSP errors

**Q: Tests fail with coverage below 95%**
A: Run `pnpm run test:coverage -- --verbose` to find untested lines

**Q: Lighthouse score dropped**
A: Use DevTools → Lighthouse to identify slow components, check bundle size

**Q: TypeScript errors in CI but not locally**
A: Run `pnpm run typecheck`, may need to rebuild: `pnpm run clean && pnpm install`

## Resources

- [MFE Architecture Guide](docs/architecture/MFE_ARCHITECTURE.md)
- [Widget Contracts](docs/architecture/WIDGET_CONTRACTS.md)
- [Security Boundaries](docs/architecture/SECURITY_BOUNDARIES.md)
- [Testing Strategy](docs/TESTING.md)

---

**Questions?** Open an issue or discussion on GitHub.
