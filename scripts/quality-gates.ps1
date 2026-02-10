#
# Quality Gates - PowerShell version for Windows
# Run before committing or in CI pipeline
#

$ErrorActionPreference = "Stop"

Write-Host "🔍 Running Quality Gates" -ForegroundColor Cyan
Write-Host "========================" -ForegroundColor Cyan
Write-Host ""

$Failed = 0

# 1. TypeScript Compilation
Write-Host "📋 Step 1: TypeScript Compilation" -ForegroundColor Yellow
Write-Host "----------------------------------"
try {
    pnpm run typecheck
    Write-Host "✅ TypeScript: PASSED" -ForegroundColor Green
} catch {
    Write-Host "❌ TypeScript: FAILED" -ForegroundColor Red
    $Failed = 1
}
Write-Host ""

# 2. Linting
Write-Host "🧹 Step 2: Linting" -ForegroundColor Yellow
Write-Host "------------------"
try {
    pnpm run lint
    Write-Host "✅ Linting: PASSED" -ForegroundColor Green
} catch {
    Write-Host "❌ Linting: FAILED" -ForegroundColor Red
    $Failed = 1
}
Write-Host ""

# 3. Unit Tests with Coverage
Write-Host "🧪 Step 3: Unit Tests" -ForegroundColor Yellow
Write-Host "---------------------"
try {
    pnpm run test:coverage
    Write-Host "✅ Tests: PASSED" -ForegroundColor Green
} catch {
    Write-Host "❌ Tests: FAILED" -ForegroundColor Red
    $Failed = 1
}
Write-Host ""

# 4. Coverage Threshold Check
Write-Host "📊 Step 4: Coverage Threshold (95%)" -ForegroundColor Yellow
Write-Host "------------------------------------"
$CoverageFile = "coverage/coverage-summary.json"
if (Test-Path $CoverageFile) {
    $Coverage = Get-Content $CoverageFile | ConvertFrom-Json
    $Threshold = 95
    $CoverageFailed = $false
    
    $Statements = $Coverage.total.statements.pct
    $Branches = $Coverage.total.branches.pct
    $Functions = $Coverage.total.functions.pct
    $Lines = $Coverage.total.lines.pct
    
    Write-Host "Statements: $Statements% (threshold: $Threshold%)"
    Write-Host "Branches:   $Branches% (threshold: $Threshold%)"  
    Write-Host "Functions:  $Functions% (threshold: $Threshold%)"
    Write-Host "Lines:      $Lines% (threshold: $Threshold%)"
    
    if ($Statements -lt $Threshold -or $Branches -lt $Threshold -or $Functions -lt $Threshold -or $Lines -lt $Threshold) {
        Write-Host "❌ Coverage: FAILED" -ForegroundColor Red
        $Failed = 1
    } else {
        Write-Host "✅ Coverage: PASSED" -ForegroundColor Green
    }
} else {
    Write-Host "⚠️  Coverage summary not found" -ForegroundColor Yellow
}
Write-Host ""

# 5. Security Audit
Write-Host "🔒 Step 5: Security Audit" -ForegroundColor Yellow
Write-Host "-------------------------"
try {
    pnpm audit --audit-level=high
    Write-Host "✅ Security: PASSED" -ForegroundColor Green
} catch {
    Write-Host "⚠️  Security: WARNINGS (non-blocking)" -ForegroundColor Yellow
}
Write-Host ""

# 6. Build Check
Write-Host "🏗️  Step 6: Build" -ForegroundColor Yellow
Write-Host "-----------------"
try {
    pnpm run build
    Write-Host "✅ Build: PASSED" -ForegroundColor Green
} catch {
    Write-Host "❌ Build: FAILED" -ForegroundColor Red
    $Failed = 1
}
Write-Host ""

# Summary
Write-Host ""
Write-Host "================================" -ForegroundColor Cyan
Write-Host "Quality Gates Summary" -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Cyan

if ($Failed -eq 0) {
    Write-Host "✅ All quality gates PASSED" -ForegroundColor Green
    Write-Host ""
    Write-Host "Ready for deployment!" -ForegroundColor Green
    exit 0
} else {
    Write-Host "❌ Some quality gates FAILED" -ForegroundColor Red
    Write-Host ""
    Write-Host "Please fix the issues above before committing." -ForegroundColor Red
    exit 1
}
