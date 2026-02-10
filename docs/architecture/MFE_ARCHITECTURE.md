# MFE Architecture Deep Dive

## Overview

Composey uses **Webpack 5 Module Federation** to implement a production-grade micro-frontend system. Each widget is independently built, versioned, and deployed, yet integrates seamlessly into the Next.js shell application.

---

## Module Federation Setup

### Widget Structure (Example: auth-widget)

**File**: `apps/widgets/auth-widget/webpack.config.js`

```javascript
const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const { ModuleFederationPlugin } = require('webpack').container;

module.exports = {
  mode: 'production',
  entry: './src/bootstrap.ts',
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'auth-widget.js',
    chunkFilename: '[name].[contenthash].js',
    publicPath: 'auto',
    library: {
      type: 'window',
      name: ['__composey__', 'authWidgetModuleEntry'],
    },
  },
  module: {
    rules: [
      {
        test: /\.(ts|tsx)$/,
        exclude: /node_modules/,
        use: {
          loader: 'ts-loader',
          options: { configFile: 'tsconfig.json' },
        },
      },
      {
        test: /\.css$/,
        use: ['style-loader', 'css-loader'],
      },
    ],
  },
  plugins: [
    new ModuleFederationPlugin({
      // Unique namespace for this widget
      name: '@composey/auth-widget',
      filename: 'remoteEntry.js',
      
      // What this widget exposes to the shell
      exposes: {
        './contracts': './src/contracts.ts',
        './Component': './src/components/AuthContainer.tsx',
        './hooks': './src/hooks/index.ts',
      },
      
      // Shared dependencies (singletons to avoid duplication)
      shared: {
        react: {
          singleton: true,
          requiredVersion: '^18.0.0',
          strictVersion: false,
        },
        'react-dom': {
          singleton: true,
          requiredVersion: '^18.0.0',
          strictVersion: false,
        },
        '@composey/shared-types': {
          singleton: true,
          strictVersion: false,
        },
      },
    }),
  ],
  resolve: {
    extensions: ['.ts', '.tsx', '.js', '.jsx'],
    alias: {
      '@composey/shared-types': path.resolve(__dirname, '../../packages/shared-types/src'),
    },
  },
  devtool: 'source-map',
  performance: {
    hints: 'warning',
    maxEntrypointSize: 512000,
    maxAssetSize: 512000,
  },
};
```

### Shell Integration (Host)

**File**: `apps/shell/next.config.js`

```javascript
const { NextFederationPlugin } = require('@module-federation/nextjs-mf');

module.exports = {
  webpack: (config, options) => {
    config.plugins.push(
      new NextFederationPlugin({
        // Shell acts as host
        name: '@composey/shell',
        
        // Shared packages available to remote widgets
        shared: {
          react: { singleton: true, requiredVersion: '^18.0.0' },
          'react-dom': { singleton: true, requiredVersion: '^18.0.0' },
          '@composey/shared-types': { singleton: true },
          '@composey/shared-utils': { singleton: true },
        },
        
        // Remote widget definitions (from environment or mfe-registry.ts)
        // Dynamically injected at runtime
      })
    );
    return config;
  },
};
```

### Dynamic Import Map

**File**: `apps/shell/src/lib/mfe-registry.ts`

```typescript
export interface MFEDefinition {
  url: string;
  version: string;
  contract_version: string;
  scope: string;
  dev?: boolean;
}

export const MFE_REGISTRY: Record<string, MFEDefinition> = {
  'auth-widget': {
    url: process.env.NEXT_PUBLIC_AUTH_WIDGET_URL || 'http://localhost:3001/dist/auth-widget.js',
    version: '1.1.0',
    contract_version: 'IAuthWidget@1.1',
    scope: '/@composey/auth-widget',
    dev: process.env.NODE_ENV === 'development',
  },
  'course-management-widget': {
    url: process.env.NEXT_PUBLIC_COURSE_WIDGET_URL || 'http://localhost:3002/dist/course-management-widget.js',
    version: '1.0.0',
    contract_version: 'ICourseWidget@1.0',
    scope: '/@composey/course-widget',
  },
  'lesson-viewer-widget': {
    url: process.env.NEXT_PUBLIC_LESSON_WIDGET_URL || 'http://localhost:3003/dist/lesson-viewer-widget.js',
    version: '1.0.0',
    contract_version: 'ILessonWidget@1.0',
    scope: '/@composey/lesson-widget',
  },
  'quiz-engine-widget': {
    url: process.env.NEXT_PUBLIC_QUIZ_WIDGET_URL || 'http://localhost:3004/dist/quiz-engine-widget.js',
    version: '1.0.0',
    contract_version: 'IQuizWidget@1.0',
    scope: '/@composey/quiz-widget',
  },
  'progress-tracker-widget': {
    url: process.env.NEXT_PUBLIC_PROGRESS_WIDGET_URL || 'http://localhost:3005/dist/progress-tracker-widget.js',
    version: '1.0.0',
    contract_version: 'IProgressWidget@1.0',
    scope: '/@composey/progress-widget',
  },
  'checkout-widget': {
    url: process.env.NEXT_PUBLIC_CHECKOUT_WIDGET_URL || 'http://localhost:3006/dist/checkout-widget.js',
    version: '1.0.0',
    contract_version: 'ICheckoutWidget@1.0',
    scope: '/@composey/checkout-widget',
  },
};

export function getImportMap() {
  const imports: Record<string, string> = {};
  
  Object.entries(MFE_REGISTRY).forEach(([key, def]) => {
    imports[def.scope] = def.url;
    // Also expose at shorter alias
    imports[`@composey/${key}`] = def.url;
  });
  
  return { imports };
}
```

### Widget Bootstrap Validation

**File**: `apps/shell/src/lib/mfe-loader.ts`

```typescript
import { MFE_REGISTRY, MFEDefinition } from './mfe-registry';

export interface MFELoadResult {
  success: boolean;
  widget?: any;
  error?: string;
}

/**
 * Dynamically load an MFE with contract validation.
 * Ensures loaded widget matches expected contract version.
 */
export async function loadMFE(
  widgetName: string,
  expectedContract: string
): Promise<MFELoadResult> {
  const definition = MFE_REGISTRY[widgetName];
  
  if (!definition) {
    return { success: false, error: `MFE not registered: ${widgetName}` };
  }

  try {
    // Validate contract version matches
    if (!expectedContract.startsWith(definition.contract_version.split('@')[0])) {
      return {
        success: false,
        error: `Contract mismatch. Expected ${expectedContract}, got ${definition.contract_version}`,
      };
    }

    // Dynamically import the widget
    const module = await import(/* webpackChunkName: "[request]" */ definition.scope);
    
    // Validate exposed contract
    if (!module.contracts) {
      return {
        success: false,
        error: `MFE missing contract export: ${widgetName}`,
      };
    }

    console.log(`✓ Loaded ${widgetName} v${definition.version}`);
    return { success: true, widget: module };
  } catch (error) {
    return {
      success: false,
      error: `Failed to load ${widgetName}: ${(error as Error).message}`,
    };
  }
}

/**
 * Preload critical MFEs (auth, shell layout) during shell initialization.
 */
export async function preloadCriticalMFEs(): Promise<Map<string, MFELoadResult>> {
  const critical = ['auth-widget'];
  const results = new Map<string, MFELoadResult>();

  for (const mfe of critical) {
    const result = await loadMFE(mfe, MFE_REGISTRY[mfe].contract_version);
    results.set(mfe, result);
  }

  return results;
}
```

---

## Widget Development Lifecycle

### Step 1: Create Widget with Contracts

```bash
cd apps/widgets/auth-widget

# File: src/contracts.ts
export interface IAuthWidget {
  getCurrentUser(): Promise<User | null>;
  login(email: string, password: string): Promise<{ token: string; user: User }>;
  logout(): Promise<void>;
  onAuthStateChange(callback: (user: User | null) => void): () => void;
}

# File: src/bootstrap.ts
import { IAuthWidget } from './contracts';

let authState: User | null = null;
const listeners: ((user: User | null) => void)[] = [];

export const authWidgetAPI: IAuthWidget = {
  async getCurrentUser() {
    // Load from localStorage or call /auth/me
    return authState;
  },

  async login(email: string, password: string) {
    const response = await fetch('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    const data = await response.json();
    authState = data.user;
    listeners.forEach(cb => cb(authState));
    return data;
  },

  logout() {
    authState = null;
    listeners.forEach(cb => cb(null));
  },

  onAuthStateChange(callback) {
    listeners.push(callback);
    return () => {
      listeners.splice(listeners.indexOf(callback), 1);
    };
  },
};

// Export for Module Federation
if (typeof window !== 'undefined') {
  if (!window.__composey__) window.__composey__ = {};
  window.__composey__.authWidget = authWidgetAPI;
}
```

### Step 2: Build the Widget

```bash
# In auth-widget/
npm run build

# Output:
# dist/auth-widget.js (100KB gzipped)
# dist/remoteEntry.js
# dist/[chunk].[hash].js
```

### Step 3: Register in Shell

Update `.env.local`:
```
NEXT_PUBLIC_AUTH_WIDGET_URL=http://localhost:3001/dist/auth-widget.js
```

Or update `mfe-registry.ts` for production URLs:
```typescript
'auth-widget': {
  url: 'https://cdn.composey.com/widgets/auth-widget@1.1.0/dist/auth-widget.js',
  version: '1.1.0',
  // ...
},
```

### Step 4: Use in Shell

```typescript
// apps/shell/src/pages/login.tsx
import { useMFEWidget } from '../hooks/useMFEWidget';

export default function LoginPage() {
  const { widget: authWidget, loading, error } = useMFEWidget('auth-widget', 'IAuthWidget');

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return authWidget ? <authWidget.Component /> : null;
}
```

---

## Contract Versioning Strategy

### Semantic Versioning for Contracts

```
IAuthWidget@1.0
  ├── MAJOR (1.x): Breaking changes (removed methods, type changes)
  ├── MINOR (x.1): Additive changes (new optional methods)
  └── PATCH (x.x.1): Bug fixes (same interface, better error handling)
```

### Backward Compatibility Rules

**✅ ALLOWED** (MINOR bump):
```typescript
// Before
interface IAuthWidget {
  login(email: string, password: string): Promise<LoginResult>;
}

// After - Add optional method
interface IAuthWidget {
  login(email: string, password: string): Promise<LoginResult>;
  loginWithSSO(provider: string): Promise<LoginResult>; // NEW
}
```

**❌ NOT ALLOWED** (MAJOR bump):
```typescript
// Before
interface IAuthWidget {
  login(email: string, password: string): Promise<LoginResult>;
}

// After - Changed signature
interface IAuthWidget {
  login(email: string, password: string, otp: string): Promise<LoginResult>; // BREAKING
}
```

### Rolling Out New Contract Versions

1. **Develop** v2.0 of auth-widget in feature branch
2. **Staging**: Deploy auth-widget@v2.0 → staging.composey.local
3. **Test** full integration suite against v2.0
4. **Prod Canary**: Deploy to 5% traffic, monitor metrics
5. **Prod Full**: Gradual rollout to 100%
6. **Shell Update**: Update shell import map when ready (can run both v1 & v2 in parallel)

### Multiple Versions in Production

```typescript
// apps/shell/src/lib/mfe-registry.ts
'auth-widget': {
  url: 'https://cdn.composey.com/widgets/auth-widget@1.1.0/dist/auth-widget.js',
  version: '1.1.0',
  contract_version: 'IAuthWidget@1.1',
},
'auth-widget-v2': {
  url: 'https://cdn.composey.com/widgets/auth-widget@2.0.0/dist/auth-widget.js',
  version: '2.0.0',
  contract_version: 'IAuthWidget@2.0',
},
```

Users can temporarily access both:
```typescript
// Old login page
import authWidget from '@composey/auth-widget'; // v1.1

// New login page
import authWidget from '@composey/auth-widget-v2'; // v2.0
```

Once all users migrated, remove v1.1 from production.

---

## Error Handling & Fallbacks

### MFE Load Error Recovery

```typescript
// apps/shell/src/components/MFEHost.tsx
export function MFEHost({ widgetName }: { widgetName: string }) {
  const [mfeComponent, setMfeComponent] = useState<React.ReactNode>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadMFE(widgetName, MFE_REGISTRY[widgetName].contract_version)
      .then(result => {
        if (!result.success) {
          setError(result.error || 'Unknown error');
          // Fallback to static HTML or previous version
          sendMetric('mfe_load_error', { widget: widgetName, error: result.error });
        } else {
          setMfeComponent(<result.widget.Component />);
        }
      })
      .catch(error => {
        setError(error.message);
        sendMetric('mfe_load_crash', { widget: widgetName });
      });
  }, [widgetName]);

  if (error) {
    return (
      <ErrorBoundary>
        <div className="mfe-error-fallback">
          <h2>Failed to load {widgetName}</h2>
          <p>{error}</p>
          <button onClick={() => location.reload()}>Reload page</button>
        </div>
      </ErrorBoundary>
    );
  }

  return mfeComponent;
}
```

### Circuit Breaker for Unreliable MFEs

```typescript
// apps/shell/src/lib/circuit-breaker.ts
class CircuitBreaker {
  private failures = 0;
  private lastFailureTime = 0;
  private state: 'closed' | 'open' | 'half-open' = 'closed';

  async load(mfeUrl: string): Promise<any> {
    if (this.state === 'open') {
      if (Date.now() - this.lastFailureTime > 30000) { // 30s timeout
        this.state = 'half-open';
      } else {
        throw new Error(`Circuit breaker open for ${mfeUrl}`);
      }
    }

    try {
      const module = await import(mfeUrl);
      this.failures = 0;
      this.state = 'closed';
      return module;
    } catch (error) {
      this.failures++;
      this.lastFailureTime = Date.now();
      
      if (this.failures >= 3) {
        this.state = 'open';
      }
      
      throw error;
    }
  }
}
```

---

## Performance Optimization

### Bundle Size Control

```bash
# In each widget's package.json
"size": "webpack-bundle-analyzer dist/stats.json",

# Webpack plugin config
new BundleAnalyzerPlugin({ analyzerMode: 'static' })
```

**Target Bundle Sizes**:
- auth-widget: <50KB (gzipped)
- course-management: <80KB
- lesson-viewer: <100KB (contains media player libs)
- quiz-engine: <80KB
- progress-tracker: <60KB
- checkout-widget: <70KB (no payment libs on frontend)

### Code Splitting Strategy

```typescript
// Widget lazy-loads non-critical routes
const AdminPanel = lazy(() => import('./pages/AdminPanel'));
const StudentDashboard = lazy(() => import('./pages/StudentDashboard'));

export function CourseWidget() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <Routes>
        <Route path="/admin" element={<AdminPanel />} />
        <Route path="/dashboard" element={<StudentDashboard />} />
      </Routes>
    </Suspense>
  );
}
```

### Preloading Critical Resources

```typescript
// apps/shell/src/app.tsx
useEffect(() => {
  // Preload auth widget on app init
  const link = document.createElement('link');
  link.rel = 'preload';
  link.as = 'script';
  link.href = MFE_REGISTRY['auth-widget'].url;
  document.head.appendChild(link);

  // Prefetch other widgets after idle
  if ('requestIdleCallback' in window) {
    requestIdleCallback(() => {
      ['course-management-widget', 'checkout-widget'].forEach(widget => {
        const l = document.createElement('link');
        l.rel = 'prefetch';
        l.as = 'script';
        l.href = MFE_REGISTRY[widget].url;
        document.head.appendChild(l);
      });
    });
  }
}, []);
```

---

## Testing MFE Integration

### Unit Tests (Widget Isolation)

```typescript
// apps/widgets/auth-widget/__tests__/authWidget.test.ts
describe('IAuthWidget Contract', () => {
  it('should expose getCurrentUser method', async () => {
    const contract = require('../src/contracts');
    expect(typeof contract.getCurrentUser).toBe('function');
  });

  it('should return null when not authenticated', async () => {
    const user = await authWidgetAPI.getCurrentUser();
    expect(user).toBeNull();
  });

  it('should notify listeners on auth state change', (done) => {
    const unsubscribe = authWidgetAPI.onAuthStateChange((user) => {
      expect(user).not.toBeNull();
      unsubscribe();
      done();
    });

    authWidgetAPI.login('test@example.com', 'password');
  });
});
```

### Contract Tests (Shell ↔ Widget)

```typescript
// apps/shell/__tests__/mfe-contracts.test.ts
describe('MFE Contract Validation', () => {
  describe('auth-widget @ IAuthWidget@1.1', () => {
    let authWidget: any;

    beforeAll(async () => {
      const result = await loadMFE('auth-widget', 'IAuthWidget@1.1');
      authWidget = result.widget;
    });

    it('should expose all required methods', () => {
      expect(authWidget.contracts.getCurrentUser).toBeDefined();
      expect(authWidget.contracts.login).toBeDefined();
      expect(authWidget.contracts.logout).toBeDefined();
      expect(authWidget.contracts.onAuthStateChange).toBeDefined();
    });

    it('should return correct types from contract methods', async () => {
      const user = await authWidget.contracts.getCurrentUser();
      expect(typeof user === 'object' || user === null).toBe(true);
    });
  });

  describe('course-management-widget @ ICourseWidget@1.0', () => {
    // Similar tests for course widget
  });
});
```

### Integration Tests

```typescript
// services/api/__tests__/integration/auth-widget.integration.test.ts
describe('Auth Widget Integration with API', () => {
  it('should load auth widget and call API endpoints', async () => {
    // 1. Load auth widget MFE
    const mfe = await loadMFE('auth-widget', 'IAuthWidget@1.1');

    // 2. Call widget's login method
    const result = await mfe.widget.login('test@example.com', 'password');

    // 3. Verify API was called with correct headers
    expect(result.token).toBeDefined();
    expect(result.user.id).toBeDefined();

    // 4. Verify token works for subsequent API calls
    const response = await fetch('http://localhost:3000/api/courses', {
      headers: { Authorization: `Bearer ${result.token}` },
    });
    expect(response.ok).toBe(true);
  });
});
```

---

## Security Considerations

### Script Injection Prevention

Each MFE loaded via `<script>` tag with SRI (Subresource Integrity):

```typescript
// apps/shell/src/lib/mfe-loader.ts
async function loadMFEWithSRI(url: string, integrity: string) {
  const script = document.createElement('script');
  script.src = url;
  script.integrity = integrity; // e.g., sha384-xxx...
  script.crossOrigin = 'anonymous';
  script.type = 'text/javascript';
  
  return new Promise((resolve, reject) => {
    script.onload = () => resolve(script);
    script.onerror = () => reject(new Error(`Failed to load ${url}`));
    document.head.appendChild(script);
  });
}
```

### CSP Headers Enforcement

Shell HTML:
```html
<meta http-equiv="Content-Security-Policy" content="
  default-src 'self' http://localhost:3001 http://localhost:3002 ...;
  script-src 'self' http://localhost:3001 http://localhost:3002 ...;
  style-src 'self' 'unsafe-inline';
  connect-src 'self' http://localhost:3000 http://localhost:3007;
  frame-ancestors 'none';
">
```

### State Isolation

No global state shared between MFEs:

```typescript
// ❌ BAD - shared global state
window.authState = {}; // Both widgets can mutate this

// ✅ GOOD - encapsulated state
const authState = {}; // Private to auth-widget
export const authAPI = { getCurrentUser: () => ({ ...authState }) };
```

---

## Summary

Module Federation enables **pluggable, independent, production-grade** micro-frontends with:

- ✅ Independent builds & versions
- ✅ Explicit contract definitions
- ✅ Safe integration without shared mutable state
- ✅ Error recovery & circuit breakers
- ✅ Performance optimization (code splitting, preloading)
- ✅ Comprehensive testing (unit, contract, integration)
- ✅ Security boundaries (CSP, SRI, isolation)

This architecture ensures that **Composey widgets can be replaced without breaking the shell**, and the system evolves safely over years of production use.
