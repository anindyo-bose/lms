#!/bin/bash
#
# Quality Gates - Master script to run all quality checks
# Run this before committing or in CI pipeline
#

set -e

echo "🔍 Running Quality Gates"
echo "========================"
echo ""

FAILED=0

# 1. TypeScript Compilation
echo "📋 Step 1: TypeScript Compilation"
echo "----------------------------------"
if pnpm run typecheck; then
  echo "✅ TypeScript: PASSED"
else
  echo "❌ TypeScript: FAILED"
  FAILED=1
fi
echo ""

# 2. Linting
echo "🧹 Step 2: Linting"
echo "------------------"
if pnpm run lint; then
  echo "✅ Linting: PASSED"
else
  echo "❌ Linting: FAILED"
  FAILED=1
fi
echo ""

# 3. Unit Tests with Coverage
echo "🧪 Step 3: Unit Tests"
echo "---------------------"
if pnpm run test:coverage; then
  echo "✅ Tests: PASSED"
else
  echo "❌ Tests: FAILED"
  FAILED=1
fi
echo ""

# 4. Coverage Threshold Check
echo "📊 Step 4: Coverage Threshold (95%)"
echo "------------------------------------"
if ./scripts/check-coverage.sh; then
  echo "✅ Coverage: PASSED"
else
  echo "❌ Coverage: FAILED"
  FAILED=1
fi
echo ""

# 5. Security Audit
echo "🔒 Step 5: Security Audit"
echo "-------------------------"
if ./scripts/security-check.sh; then
  echo "✅ Security: PASSED"
else
  echo "⚠️  Security: WARNINGS (non-blocking)"
fi
echo ""

# 6. Build Check
echo "🏗️  Step 6: Build"
echo "-----------------"
if pnpm run build; then
  echo "✅ Build: PASSED"
else
  echo "❌ Build: FAILED"
  FAILED=1
fi
echo ""

# Summary
echo ""
echo "================================"
echo "Quality Gates Summary"
echo "================================"

if [ $FAILED -eq 0 ]; then
  echo "✅ All quality gates PASSED"
  echo ""
  echo "Ready for deployment!"
  exit 0
else
  echo "❌ Some quality gates FAILED"
  echo ""
  echo "Please fix the issues above before committing."
  exit 1
fi
