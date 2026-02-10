# Bootstrap script for Windows (PowerShell)
# Initializes database, creates super_admin user, and seeds sample data

param(
    [switch]$Force
)

Write-Host "🚀 Starting Composey LMS Bootstrap..." -ForegroundColor Green

# Check .env.local exists
if (-not (Test-Path .env.local)) {
    Write-Host "❌ .env.local not found. Creating from .env.example..." -ForegroundColor Red
    Copy-Item .env.example .env.local
    Write-Host "⚠️  Edit .env.local with your database credentials and re-run this script." -ForegroundColor Yellow
    exit 1
}

# Load environment variables
Get-Content .env.local | ForEach-Object {
    if ($_ -match '(.+?)=(.*)') {
        [Environment]::SetEnvironmentVariable($matches[1], $matches[2], 'Process')
    }
}

# Check PostgreSQL connection
Write-Host "📦 Checking PostgreSQL connection..." -ForegroundColor Cyan
try {
    $null = psql -h $env:DB_HOST -U $env:DB_USER -d $env:DB_NAME -c "SELECT 1" 2>&1
    Write-Host "✓ PostgreSQL connected" -ForegroundColor Green
} catch {
    Write-Host "❌ Cannot connect to PostgreSQL at $($env:DB_HOST)" -ForegroundColor Red
    exit 1
}

# Run migrations
Write-Host "🔄 Running database migrations..." -ForegroundColor Cyan
Push-Location db
pnpm run migrate:latest | Out-Null
Pop-Location
Write-Host "✓ Migrations complete" -ForegroundColor Green

# Check if super_admin exists
$AdminExists = psql -h $env:DB_HOST -U $env:DB_USER -d $env:DB_NAME -t -c "SELECT COUNT(*) FROM users WHERE role='super_admin';" 2>&1
$AdminExists = $AdminExists -replace '^\s+|\s+$'

if ($AdminExists -eq "0" -or $Force) {
    Write-Host "👤 Creating super_admin user..." -ForegroundColor Cyan
    
    $TempPassword = "TempPassword123!"
    
    # Hash password using Node.js
    $PasswordHash = node -e "const bcrypt = require('bcrypt'); console.log(bcrypt.hashSync('$TempPassword', 10));" 2>$null
    
    if (-not $PasswordHash) {
        Write-Host "❌ Failed to hash password. Ensure bcrypt is installed." -ForegroundColor Red
        exit 1
    }
    
    # Create user
    psql -h $env:DB_HOST -U $env:DB_USER -d $env:DB_NAME << EOF
INSERT INTO users (id, email, password_hash, first_name, last_name, role, must_change_password, created_at)
VALUES (
  gen_random_uuid(),
  'admin@composey.local',
  '$PasswordHash',
  'System',
  'Administrator',
  'super_admin',
  true,
  CURRENT_TIMESTAMP
) ON CONFLICT DO NOTHING;
EOF
    
    Write-Host "✓ Super-admin created" -ForegroundColor Green
    Write-Host ""
    Write-Host "📧 Initial Credentials:" -ForegroundColor Yellow
    Write-Host "   Email: admin@composey.local"
    Write-Host "   Temp Password: $TempPassword"
    Write-Host "   ⚠️  Must change on first login"
    Write-Host ""
} else {
    Write-Host "✓ Super-admin already exists, skipping creation" -ForegroundColor Green
}

# Seed sample data
if ($env:NODE_ENV -ne "production") {
    Write-Host "🌱 Seeding sample data..." -ForegroundColor Cyan
    Push-Location db
    pnpm run seed:run | Out-Null
    Pop-Location
    Write-Host "✓ Sample data loaded" -ForegroundColor Green
}

Write-Host ""
Write-Host "✅ Bootstrap complete!" -ForegroundColor Green
Write-Host ""
Write-Host "🎯 Next steps:" -ForegroundColor Yellow
Write-Host "   1. Install dependencies: pnpm install"
Write-Host "   2. Start development: pnpm run dev"
Write-Host "   3. Navigate to https://localhost:3000"
Write-Host "   4. Login with admin@composey.local (temporary password above)"
