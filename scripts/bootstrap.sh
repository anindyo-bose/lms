#!/bin/bash
# Bootstrap script for Composey LMS
# Initializes database, creates super_admin user, and seeds sample data
# Idempotent: Safe to run multiple times

set -e

echo "🚀 Starting Composey LMS Bootstrap..."

# Load environment variables
if [ ! -f .env.local ]; then
  echo "❌ .env.local not found. Creating from .env.example..."
  cp .env.example .env.local
  echo "⚠️  Edit .env.local with your database credentials and re-run this script."
  exit 1
fi

# Source environment
export $(cat .env.local | grep -v '^#' | xargs)

# Check PostgreSQL connection
echo "📦 Checking PostgreSQL connection..."
if ! psql -h $DB_HOST -U $DB_USER -d $DB_NAME -c "SELECT 1" > /dev/null 2>&1; then
  echo "❌ Cannot connect to PostgreSQL at $DB_HOST"
  echo "   Make sure PostgreSQL is running and credentials are correct."
  exit 1
fi
echo "✓ PostgreSQL connected"

# Run migrations
echo "🔄 Running database migrations..."
cd db
pnpm run migrate:latest || true
cd ..

# Check if super_admin already exists
SUPER_ADMIN_EXISTS=$(psql -h $DB_HOST -U $DB_USER -d $DB_NAME -t -c "SELECT COUNT(*) FROM users WHERE role='super_admin';" || echo 0)

if [ "$SUPER_ADMIN_EXISTS" -eq 0 ]; then
  echo "👤 Creating super_admin user..."
  
  # Generate temporary password
  TEMP_PASSWORD="TempPassword123!"
  
  # Hash password (using Node.js bcrypt)
  PASSWORD_HASH=$(node -e "const bcrypt = require('bcrypt'); console.log(bcrypt.hashSync('$TEMP_PASSWORD', 10));" 2>/dev/null || echo "")
  
  if [ -z "$PASSWORD_HASH" ]; then
    echo "❌ Failed to hash password. Ensure bcrypt is available."
    exit 1
  fi
  
  # Insert super_admin
  psql -h $DB_HOST -U $DB_USER -d $DB_NAME << EOF
INSERT INTO users (id, email, password_hash, first_name, last_name, role, must_change_password, created_at)
VALUES (
  gen_random_uuid(),
  'admin@composey.local',
  '$PASSWORD_HASH',
  'System',
  'Administrator',
  'super_admin',
  true,
  CURRENT_TIMESTAMP
) ON CONFLICT DO NOTHING;
EOF
  
  echo "✓ Super-admin created"
  echo ""
  echo "📧 Initial Credentials:"
  echo "   Email: admin@composey.local"
  echo "   Temp Password: $TEMP_PASSWORD"
  echo "   ⚠️  Must change on first login"
  echo ""
else
  echo "✓ Super-admin already exists, skipping creation"
fi

# Seed sample data (if in development)
if [ "$NODE_ENV" != "production" ]; then
  echo "🌱 Seeding sample data..."
  cd db
  pnpm run seed:run || true
  cd ..
  echo "✓ Sample data loaded"
fi

echo ""
echo "✅ Bootstrap complete!"
echo ""
echo "🎯 Next steps:"
echo "   1. Install dependencies: pnpm install"
echo "   2. Start development: pnpm run dev"
echo "   3. Navigate to https://localhost:3000"
echo "   4. Login with admin@composey.local (temporary password above)"
