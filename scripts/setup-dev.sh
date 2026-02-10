#!/bin/bash
#
# Setup script for development environment
# Installs git hooks and validates environment
#

set -e

echo "🛠️  Setting up Composey LMS development environment"
echo "==================================================="
echo ""

# 1. Install git hooks
echo "📎 Installing git hooks..."
if [ -d ".git/hooks" ]; then
  cp scripts/pre-commit .git/hooks/pre-commit
  chmod +x .git/hooks/pre-commit
  echo "✅ Pre-commit hook installed"
else
  echo "⚠️  Not a git repository, skipping hooks"
fi
echo ""

# 2. Check Node.js version
echo "📦 Checking Node.js version..."
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -ge 18 ]; then
  echo "✅ Node.js version: $(node -v)"
else
  echo "❌ Node.js 18+ required. Current: $(node -v)"
  exit 1
fi
echo ""

# 3. Check pnpm
echo "📦 Checking pnpm..."
if command -v pnpm &> /dev/null; then
  echo "✅ pnpm version: $(pnpm -v)"
else
  echo "❌ pnpm not found. Install: npm install -g pnpm"
  exit 1
fi
echo ""

# 4. Install dependencies
echo "📦 Installing dependencies..."
pnpm install
echo "✅ Dependencies installed"
echo ""

# 5. Setup environment file
echo "🔧 Setting up environment..."
if [ ! -f ".env.local" ]; then
  if [ -f ".env.example" ]; then
    cp .env.example .env.local
    echo "✅ Created .env.local from .env.example"
    echo "   Please update .env.local with your database credentials"
  else
    echo "⚠️  No .env.example found"
  fi
else
  echo "ℹ️  .env.local already exists"
fi
echo ""

# 6. Build shared packages
echo "🏗️  Building shared packages..."
pnpm --filter @composey/shared-types build
pnpm --filter @composey/shared-utils build
echo "✅ Shared packages built"
echo ""

# Summary
echo ""
echo "==================================================="
echo "✅ Development environment setup complete!"
echo ""
echo "Next steps:"
echo "  1. Edit .env.local with your database credentials"
echo "  2. Run: pnpm run db:bootstrap"
echo "  3. Run: pnpm run dev"
echo ""
