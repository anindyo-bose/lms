# Deployment & Versioning Strategy

## Overview

Composey uses **independent widget versioning** with **canary deployments** to ensure zero-downtime releases and easy rollbacks.

---

## Widget Versioning

Each widget follows **semantic versioning**:

```
v1.2.3
├─ 1: MAJOR (breaking changes to contract)
├─ 2: MINOR (new features, backward compatible)
└─ 3: PATCH (bug fixes only)
```

### Deployment Stages

```
Development
  ↓ pnpm run build:widgets
Artifact (dist/widget.js + remoteEntry.js)
  ↓
Dev Environment (http://localhost:3001)
  ↓ (manual QA)
Staging Environment (https://staging.composey.local)
  ↓ (integration tests, performance testing)
Production Canary (5% traffic)
  ↓ (monitor metrics: errors, latency)
Production Stable (100% traffic)
```

### Deployment Checklist

**Before deploying to production:**

1. ✓ All tests pass (95%+ coverage)
2. ✓ Lighthouse ≥90 mobile
3. ✓ No console errors
4. ✓ Contract version matches registry
5. ✓ Bundle size within limits
6. ✓ Security scan clean
7. ✓ Changelog updated
8. ✓ Staged release plan documented

---

## Docker-based Deployment

### Build Widget Docker Image

```dockerfile
# apps/widgets/auth-widget/Dockerfile
FROM node:18-alpine
WORKDIR /app

COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

COPY src ./src
COPY webpack.config.js tsconfig.json ./

RUN pnpm run build
RUN pnpm run test:coverage

# Verify coverage meets threshold
RUN node -e "const c = require('./coverage/coverage-summary.json').total.lines.pct; if(c < 95) throw new Error(\`Coverage \${c}% < 95%\`);"

# Output stage - only the built widget
FROM node:18-alpine
COPY --from=0 /app/dist /app/dist
COPY --from=0 /app/package.json /app/
WORKDIR /app

# Serve static files
ENTRYPOINT ["npx", "http-server", "dist", "-p", "3001", "--gzip"]
```

### Build Command

```bash
# Build widget Docker image
docker build -t composey/auth-widget:v1.2.3 apps/widgets/auth-widget/

# Tag for registry
docker tag composey/auth-widget:v1.2.3 \
  registry.composey.com/composey/auth-widget:v1.2.3

# Push to registry
docker push registry.composey.com/composey/auth-widget:v1.2.3
```

---

## Import Map Management

### Development

File: `apps/shell/.env.local`

```
NEXT_PUBLIC_AUTH_WIDGET_URL=http://localhost:3001/dist/auth-widget.js
```

### Staging

File: `apps/shell/.env.staging`

```
NEXT_PUBLIC_AUTH_WIDGET_URL=https://staging-cdn.composey.com/widgets/auth-widget@v1.2.3/dist/auth-widget.js
```

### Production

File: `apps/shell/.env.production`

```
NEXT_PUBLIC_AUTH_WIDGET_URL=https://cdn.composey.com/widgets/auth-widget@v1.2.3/dist/auth-widget.js
```

Update via CD/CD when deploying new widget version:

```yaml
# .github/workflows/deploy.yml
jobs:
  deploy-auth-widget:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Build widget
        run: |
          cd apps/widgets/auth-widget
          pnpm run build
          pnpm run test:coverage
      
      - name: Push to CDN
        run: |
          aws s3 sync dist/ \
            s3://composey-cdn/widgets/auth-widget@${{ github.ref_name }}/dist/
      
      - name: Update shell import map
        run: |
          # Update .env-production-urls with new CDN URL
          # Redeploy shell app
          gh workflow run shell-deploy.yml
```

---

## Canary Deployment

### Step 1: Deploy to Staging

```bash
# Push new auth-widget version
git push origin feature/auth-sso
# Creates staging deployment
# URL: https://staging.composey.local
# Can test full integration
```

### Step 2: Monitor Staging

```bash
# Performance metrics
curl https://staging-api.composey.com/metrics

# Check error rates
# Expected: < 0.1% error rate
# If > 1%: Do not proceed to production
```

### Step 3: Canary to Production (5%)

```yaml
# .github/workflows/canary-deploy.yml
jobs:
  canary:
    runs-on: ubuntu-latest
    steps:
      - name: Deploy to 5% production traffic
        run: |
          # Update load balancer via Kubernetes
          kubectl set image deployment/shell \
            shell-image=composey-shell:v2.1.0 \
            --record \
            --rollout=slow  # 5% at a time
```

### Step 4: Monitor Canary (30 minutes)

Watch these metrics:

```
error_rate < 1%        (✓ Continue if OK)
p99_latency < 500ms    (✓ Continue if OK)
user_sessions > 1000   (✓ Good traffic)
cpu_usage < 70%        (✓ Not overloaded)
```

If any metric fails:
```bash
# Immediate rollback
kubectl rollout undo deployment/shell
```

### Step 5: Full Rollout

```bash
# Once canary metrics are good for 30 min:
kubectl set image deployment/shell \
  shell-image=composey-shell:v2.1.0 \
  --record
```

---

## Rollback Procedures

### Quick Rollback (Immediate)

```bash
# Rollback shell
kubectl rollout undo deployment/shell

# Rollback specific widget
NEXT_PUBLIC_AUTH_WIDGET_URL=https://cdn.composey.com/widgets/auth-widget@v1.2.2/dist/auth-widget.js \
# Redeploy shell
```

### Check Rollback Status

```bash
# Verify old version running
curl https://composey.local -I | grep X-Shell-Version
# Should show v2.0.1 (previous version)

# Verify metrics recovered
curl https://api.composey.com/metrics
```

### Post-Incident

1. Document what went wrong
2. Update deployment checklist
3. Consider adding automated tests
4. Notify users if data affected

---

## Multiple Widget Versions in Production

### Why Keep Old Versions?

- **Zero-downtime deployment**: Shell loads v1.2 while v2.0 boots
- **Gradual migration**: Some users on v1, new users on v2
- **Easy rollback**: If v2 fails, shell reverts to v1

### Managing Multiple Versions

```typescript
// apps/shell/src/lib/mfe-registry.ts
export const MFE_REGISTRY: Record<string, MFEDefinition> = {
  'auth-widget': {
    url: 'https://cdn.composey.com/widgets/auth-widget@v1.2.3/dist/auth-widget.js',
    version: '1.2.3',
    contract_version: 'IAuthWidget@1.2',
    scope: '/@composey/auth-widget',
    active: true,
  },
  'auth-widget-v2': {
    url: 'https://cdn.composey.com/widgets/auth-widget@v2.0.0/dist/auth-widget.js',
    version: '2.0.0',
    contract_version: 'IAuthWidget@2.0',
    scope: '/@composey/auth-widget-v2',
    active: false, // Not yet default
  },
};
```

**Route traffic based on feature flags**:

```typescript
// pages/login.tsx
import { useFeatureFlag } from '@/hooks/useFeatureFlag';

export default function LoginPage() {
  const useNewAuth = useFeatureFlag('use_auth_widget_v2');
  
  return useNewAuth 
    ? <AuthWidgetV2 />
    : <AuthWidget />;
}
```

Gradually rollout v2:
- Day 1: 1% of users → feature flag `use_auth_widget_v2=0.01`
- Day 2: 10% → `use_auth_widget_v2=0.10`
- Day 3: 50% → `use_auth_widget_v2=0.50`
- Day 4: 100% → Make v2 default, deprecate v1

---

## Production Environment Setup

### DNS & Load Balancing

```
composey.local (DNS)
  ↓
Load Balancer (Traefik / Nginx)
  ├─→ Shell (3 replicas)
  ├─→ API Service (5 replicas)
  ├─→ Auth Service (2 replicas)
  └─→ Payment Service (2 replicas)
```

### TLS Certificates

```bash
# Use Let's Encrypt (automatic via cert-manager in Kubernetes)
apiVersion: cert-manager.io/v1
kind: Certificate
metadata:
  name: composey-cert
spec:
  secretName: composey-tls
  issuerRef:
    name: letsencrypt-prod
  dnsNames:
    - composey.local
    - api.composey.local
    - cdn.composey.com
```

### Monitoring & Alerts

```yaml
# Prometheus alert rules
groups:
  - name: composey
    rules:
      - alert: HighErrorRate
        expr: rate(http_requests_total{status=~"5.."}[5m]) > 0.01
        for: 5m
        annotations:
          summary: "High error rate detected"
      
      - alert: WidgetLoadFailure
        expr: rate(mfe_load_errors_total[5m]) > 0.05
        for: 2m
        annotations:
          summary: "Widget failing to load"
```

---

## Release Notes Template

When deploying a new version, document:

```markdown
# Composey LMS v2.1.0 - Release Notes

## New Features

- ✨ SSO support (Google, GitHub)
- ✨ Certificate downloads
- ✨ Mobile app integration

## Bug Fixes

- 🐛 Fixed quiz timer edge case
- 🐛 Fixed course image loading on slow networks
- 🐛 Fixed payment webhook race condition

## Breaking Changes

- ⚠️ IAuthWidget@1.2 deprecated, use IAuthWidget@2.0
- ⚠️ Session timeout reduced to 30 minutes

## Widget Versions in This Release

| Widget | Version | Status |
|--------|---------|--------|
| auth-widget | v2.0.0 | ✅ New |
| course-management-widget | v1.2.3 | ↔️ Unchanged |
| checkout-widget | v1.1.0 | ✅ Patched |

## Deployment

- **Canary**: 5% for 30 minutes
- **Rollout**: 100% if metrics OK
- **Estimated downtime**: 0 minutes

## Migration Guide

Users on auth-widget v1.2:
1. Auto-migrated on login
2. No action required
3. Can revoke v1 tokens in account settings
```

---

## Summary

✅ **Independent widget versioning** = deploy any widget anytime  
✅ **Canary deployments** = catch issues before 100% rollout  
✅ **Multiple versions in production** = zero-downtime rollbacks  
✅ **Automated quality gates** = no bad code shipped  
✅ **Comprehensive monitoring** = know when things break  

Composey is built for **continuous delivery** with **confidence**.
