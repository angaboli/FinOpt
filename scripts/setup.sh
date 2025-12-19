#!/bin/bash

# Finopt Setup Script
# This script helps you set up Finopt quickly

set -e

echo "🚀 Finopt Setup Script"
echo "======================="
echo ""

# Check prerequisites
echo "📋 Checking prerequisites..."

# Check Docker
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed. Please install Docker Desktop."
    exit 1
fi
echo "✅ Docker found"

# Check Docker Compose
if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose is not installed."
    exit 1
fi
echo "✅ Docker Compose found"

# Check Node.js
if ! command -v node &> /dev/null; then
    echo "⚠️  Node.js is not installed. Required for mobile app."
else
    echo "✅ Node.js found: $(node -v)"
fi

echo ""
echo "📝 Setting up environment files..."

# Setup API .env
if [ ! -f "apps/api/.env" ]; then
    cp apps/api/.env.example apps/api/.env
    echo "✅ Created apps/api/.env"
    echo "⚠️  IMPORTANT: Edit apps/api/.env and add your:"
    echo "   - DATABASE_URL (from Neon)"
    echo "   - ANTHROPIC_API_KEY"
    echo "   - JWT_SECRET_KEY (generate a random string)"
else
    echo "ℹ️  apps/api/.env already exists"
fi

# Setup Mobile .env
if [ ! -f "apps/mobile/.env" ]; then
    cp apps/mobile/.env.example apps/mobile/.env
    echo "✅ Created apps/mobile/.env"
else
    echo "ℹ️  apps/mobile/.env already exists"
fi

echo ""
echo "📦 Installing dependencies..."

# Install root dependencies
if [ -f "package.json" ]; then
    echo "Installing Node.js dependencies..."
    npm install
    echo "✅ Dependencies installed"
fi

echo ""
echo "🐳 Building Docker images..."
docker-compose build

echo ""
echo "✅ Setup complete!"
echo ""
echo "📖 Next steps:"
echo "   1. Create a Neon account at https://neon.tech"
echo "   2. Create a new project and get your connection string"
echo "   3. Edit apps/api/.env and add your DATABASE_URL"
echo "   4. Get an Anthropic API key from https://console.anthropic.com"
echo "   5. Edit apps/api/.env and add your ANTHROPIC_API_KEY"
echo "   6. Run: docker-compose up -d"
echo "   7. Visit http://localhost:8000/docs to see the API"
echo ""
echo "📚 For detailed instructions, see: docs/docker-guide.md"
