# Copilot Workspace Setup Instructions

This document provides setup and development guidelines for the Composey LMS workspace.

## Quick Start

1. **Install Dependencies**
   ```bash
   pnpm install
   ```

2. **Setup Environment**
   ```bash
   cp .env.example .env.local
   # Edit .env.local with your database credentials
   ```

3. **Initialize Database**
   ```bash
   pnpm run db:bootstrap
   # Creates super_admin user: admin@composey.local / TempPassword123!
   ```

4. **Start Development**
   ```bash
   pnpm run dev
   # Shell: http://localhost:3000
   # Widgets: http://localhost:3001-3006
   # Services: http://localhost:3007-3008
   ```

## Project Structure

- **apps/shell** - Next.js host application with Module Federation
- **apps/widgets** - 6 independent micro-frontend widgets
  - auth-widget (authentication)
  - course-management-widget (course CRUD)
  - lesson-viewer-widget (content delivery)
  - quiz-engine-widget (assessments)
  - progress-tracker-widget (analytics)
  - checkout-widget (payments)
- **services** - Backend microservices (Express)
  - api (main service)
  - auth (JWT, token refresh)
  - payment (provider abstraction)
- **packages** - Shared code
  - shared-types (TypeScript contracts)
  - shared-utils (common utilities)
  - contract-specs (runtime validation)
- **db** - Database migrations and seeds
- **docs** - Architecture and design documentation
- **scripts** - Bootstrap, testing, deployment automation

## Core Concepts

### Micro-Frontend Architecture

Each widget:
- Builds independently (own webpack config)
- Integrates via Webpack 5 Module Federation
- Exposes explicit typed contracts (TypeScript interfaces)
- Communicates via events, never shared state
- Tests at ≥95% coverage
- Deploys independently with own version

### Security-First Design

- **Authentication**: JWT (5 min) + refresh tokens (7 days) in HTTPOnly cookies
- **Authorization**: RBAC enforced on every endpoint server-side
- **Encryption**: TLS everywhere, PII at-rest encrypted
- **Logging**: Structured, zero sensitive data
- **CSP**: Strict headers prevent XSS
- **Compliance**: OWASP + SOC2 ready

### Testing & Quality

- **Coverage**: 95%+ required globally
- **Lighthouse**: ≥90 mobile score on shell
- **No Skipped Tests**: Every test must execute
- **Contract Tests**: Validate shell ↔ widget communication
- **Security Scans**: npm audit, SonarQube

## Development Workflow

### 1. Create a Feature Branch
```bash
git checkout -b feature/my-feature develop
```

### 2. Develop and Test
```bash
# Make code changes
# Run tests continuously
pnpm run test:watch

# Check coverage
pnpm run test:coverage

# Lint & format
pnpm run lint
pnpm run format
```

### 3. For Widget Development
```bash
# Terminal 1: Start core services
pnpm run services:dev

# Terminal 2: Start your widget
cd apps/widgets/my-widget
pnpm run dev
# Widget runs on assigned port (3001-3006)
```

### 4. Quality Checks Before PR
```bash
# Full test suite
pnpm run test:coverage

# TypeScript compilation
pnpm run typecheck

# Build all
pnpm run build

# Lighthouse check
pnpm run lighthouse:test

# Security audit
pnpm run security:check
```

### 5. Open Pull Request
- Link related issues
- Describe changes clearly
- Ensure all CI checks pass
- Request review from CODEOWNERS

## Important Files & Directories

| Path | Purpose |
|------|---------|
| [README.md](../README.md) | Main project overview |
| [CONTRIBUTING.md](../CONTRIBUTING.md) | Development guidelines |
| [.env.example](../.env.example) | Environment template |
| [docs/architecture/](../docs/architecture/) | Design documentation |
| [db/schema.sql](../db/schema.sql) | Database schema reference |
| [pnpm-workspace.yaml](../pnpm-workspace.yaml) | Monorepo configuration |
| [jest.config.js](../jest.config.js) | Test configuration |
| [tsconfig.json](../tsconfig.json) | TypeScript configuration |

## Common Tasks

### Add New Widget
1. Create directory structure: `mkdir -p apps/widgets/widget-name/src`
2. Copy webpack config from existing widget
3. Define contracts in `src/contracts.ts`
4. Implement in `src/bootstrap.ts`
5. Mark in `package.json` with port
6. Add to mfe-registry in shell
7. Test in isolation, then with shell

### Add Database Migration
```bash
cd db
pnpm run migrate:make create_table_name
# Edit migrations/[timestamp]_create_table_name.ts
pnpm run migrate:latest
```

### Run Integration Tests
```bash
# Ensure all services running
pnpm run dev

# In another terminal
pnpm run test:integration
```

### Deploy to Staging
```bash
# Push feature branch
git push origin feature/my-feature

# Create pull request (CI runs tests)
# When approved and merged to develop

# Staging deployment runs automatically
# Check: https://staging.composey.local
```

## Debugging

### VS Code Configuration

`.vscode/launch.json` includes:
- Shell app debugging
- API service debugging
- Attach to running processes

Press F5 to start debugging, or use:
```
Debug → Start Debugging
```

### Enable Debug Mode

```bash
# In .env.local
DEBUG=*
LOG_LEVEL=debug
```

### Browser DevTools

Lighthouse, React DevTools, Redux DevTools (if used):
```
Install from Chrome Web Store
```

## Troubleshooting

**Q: `Cannot find module '@composey/shared-types'`**
A: Run `pnpm install`, then `pnpm run build` to build the shared packages first.

**Q: Tests fail with "Port 3001 in use"**
A: Previous widgets still running. Kill them: `lsof -i :3001` → `kill -9 <pid>`

**Q: Database connection refused**
A: Check `.env.local`, ensure PostgreSQL running: `psql -U postgres`

**Q: Widget not loading in shell (white screen)**
A: Check browser console, look for CORS/CSP errors. Verify `.env.local` has correct widget URLs.

**Q: TypeScript errors in editor but not in terminal**
A: Reload window: `Cmd/Ctrl + Shift + P` → "Developer: Reload Window"

## Performance Tips

- **For developing single widget**: Run only `pnpm run services:dev` + that widget's `pnpm run dev`
- **To speed up builds**: Use `--filter` flag: `pnpm run build --filter auth-widget`
- **To speed up tests**: Run in parallel: `pnpm run test -- --maxWorkers=4`
- **Clear cache if stuck**: `pnpm exec turbo prune --scope=auth-widget --docker`

## Security Reminder

- ✅ Never commit `.env` files
- ✅ Never log passwords or tokens
- ✅ Always validate input server-side
- ✅ Always use HTTPS in production
- ✅ Rotate secrets regularly
- 🔐 Report security issues privately to security@composey.local

## Additional Resources

- [MFE Architecture Detail](../docs/architecture/MFE_ARCHITECTURE.md)
- [Widget Contracts & APIs](../docs/architecture/WIDGET_CONTRACTS.md)
- [Security Boundaries](../docs/architecture/SECURITY_BOUNDARIES.md)
- [Deployment Strategy](../docs/architecture/DEPLOYMENT.md)
- [Testing Guide](../docs/TESTING.md)

## Getting Help

1. Check [README.md](../README.md) troubleshooting section
2. Search GitHub Issues
3. Check Discord channel
4. Open new issue with minimal reproduction
