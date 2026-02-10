#!/bin/bash
#
# Security Check - Run security audits and SAST scans
#

set -e

echo "🔒 Security Audit"
echo "================="
echo ""

WARNINGS=0
CRITICAL=0

# 1. npm audit
echo "📦 Checking npm dependencies..."
if pnpm audit --audit-level=high; then
  echo "✅ No high/critical vulnerabilities in dependencies"
else
  echo "⚠️  Dependency vulnerabilities found"
  WARNINGS=$((WARNINGS + 1))
fi
echo ""

# 2. Check for secrets in code
echo "🔑 Scanning for hardcoded secrets..."
SECRET_PATTERNS=(
  "password\s*=\s*['\"][^'\"]+['\"]"
  "api_key\s*=\s*['\"][^'\"]+['\"]"
  "secret\s*=\s*['\"][^'\"]+['\"]"
  "AWS_ACCESS_KEY"
  "PRIVATE_KEY"
  "sk_live_"
  "sk_test_"
)

SECRETS_FOUND=0
for pattern in "${SECRET_PATTERNS[@]}"; do
  if grep -rI --include="*.ts" --include="*.tsx" --include="*.js" --exclude-dir=node_modules -E "$pattern" . 2>/dev/null | grep -v ".env" | grep -v "example" | grep -v "test"; then
    SECRETS_FOUND=$((SECRETS_FOUND + 1))
  fi
done

if [ $SECRETS_FOUND -eq 0 ]; then
  echo "✅ No hardcoded secrets detected"
else
  echo "❌ Potential secrets found in code!"
  CRITICAL=$((CRITICAL + 1))
fi
echo ""

# 3. Check .env files not committed
echo "📄 Checking for .env files..."
if git ls-files | grep -E "^\.env$|^\.env\.local$|^\.env\.production$" | grep -v ".example"; then
  echo "❌ .env files may be committed to git!"
  CRITICAL=$((CRITICAL + 1))
else
  echo "✅ No .env files in git"
fi
echo ""

# 4. Check for Debug/Console logs in production code
echo "🐛 Checking for debug statements..."
DEBUG_COUNT=$(grep -rI --include="*.ts" --include="*.tsx" --exclude="*.test.*" --exclude="*.spec.*" --exclude-dir=node_modules -c "console\.log\|console\.debug\|debugger" . 2>/dev/null | awk -F: '{sum += $2} END {print sum}' || echo "0")

if [ "$DEBUG_COUNT" -gt 10 ]; then
  echo "⚠️  Found $DEBUG_COUNT console.log/debugger statements"
  WARNINGS=$((WARNINGS + 1))
else
  echo "✅ Minimal debug statements ($DEBUG_COUNT)"
fi
echo ""

# 5. Check for TODO/FIXME in critical paths
echo "📝 Checking for TODO/FIXME comments..."
TODO_COUNT=$(grep -rI --include="*.ts" --include="*.tsx" --exclude-dir=node_modules -c "TODO\|FIXME\|HACK\|XXX" . 2>/dev/null | awk -F: '{sum += $2} END {print sum}' || echo "0")
echo "   Found $TODO_COUNT TODO/FIXME comments"
echo ""

# 6. Check for vulnerable patterns
echo "🛡️  Checking for security anti-patterns..."
ANTIPATTERNS=0

# Check for eval usage
if grep -rI --include="*.ts" --include="*.tsx" --exclude-dir=node_modules "eval(" . 2>/dev/null; then
  echo "⚠️  eval() usage detected"
  ANTIPATTERNS=$((ANTIPATTERNS + 1))
fi

# Check for innerHTML without sanitization
if grep -rI --include="*.ts" --include="*.tsx" --exclude-dir=node_modules "dangerouslySetInnerHTML" . 2>/dev/null | grep -v "sanitize"; then
  echo "⚠️  Unsanitized dangerouslySetInnerHTML usage"
  ANTIPATTERNS=$((ANTIPATTERNS + 1))
fi

if [ $ANTIPATTERNS -eq 0 ]; then
  echo "✅ No security anti-patterns detected"
else
  WARNINGS=$((WARNINGS + ANTIPATTERNS))
fi
echo ""

# Summary
echo "================================"
echo "Security Check Summary"
echo "================================"
echo "Critical issues: $CRITICAL"
echo "Warnings: $WARNINGS"
echo ""

if [ $CRITICAL -gt 0 ]; then
  echo "❌ Security check FAILED - critical issues found"
  exit 1
elif [ $WARNINGS -gt 0 ]; then
  echo "⚠️  Security check PASSED with warnings"
  exit 0
else
  echo "✅ Security check PASSED"
  exit 0
fi
