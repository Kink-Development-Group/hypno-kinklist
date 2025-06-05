#!/bin/bash

# Pipeline Test Script - Lokale Simulation der CI/CD Pipeline
# Usage: ./scripts/test-pipeline.sh [dev|prod]

set -e

ENVIRONMENT=${1:-dev}
echo "🧪 Testing pipeline for $ENVIRONMENT environment..."
echo "=========================================="

# Test 1: Node.js Setup
echo ""
echo "1️⃣ Testing Node.js setup..."
if command -v node >/dev/null 2>&1; then
    echo "✅ Node.js found: $(node --version)"
else
    echo "❌ Node.js not found!"
    exit 1
fi

if command -v npm >/dev/null 2>&1; then
    echo "✅ npm found: $(npm --version)"
else
    echo "❌ npm not found!"
    exit 1
fi

# Test 2: Dependencies
echo ""
echo "2️⃣ Testing dependencies..."
if [ -f "package.json" ]; then
    echo "✅ package.json found"
    echo "📦 Installing dependencies..."
    npm ci
    echo "✅ Dependencies installed"
else
    echo "❌ package.json not found!"
    exit 1
fi

# Test 3: Tests
echo ""
echo "3️⃣ Running tests..."
npm test -- --run
if [ $? -eq 0 ]; then
    echo "✅ All tests passed"
else
    echo "❌ Tests failed!"
    exit 1
fi

# Test 4: Build
echo ""
echo "4️⃣ Testing build..."
npm run build
if [ $? -eq 0 ]; then
    echo "✅ Build successful"
else
    echo "❌ Build failed!"
    exit 1
fi

# Test 5: Build validation
echo ""
echo "5️⃣ Validating build artifacts..."
if [ ! -d "./dist" ]; then
    echo "❌ Build directory not found!"
    exit 1
fi

if [ ! -f "./dist/index.html" ]; then
    echo "❌ index.html not found in build directory!"
    exit 1
fi

echo "✅ Build artifacts validated"
echo "📋 Build contents:"
ls -la ./dist/

# Test 6: Environment variables check
echo ""
echo "6️⃣ Checking environment configuration..."
echo "🌿 Environment: $ENVIRONMENT"

if [ "$ENVIRONMENT" = "prod" ]; then
    echo "🎯 Target: Production deployment"
    TARGET_DIR="${SFTP_REMOTE_DIR_PROD:-/var/www/html/kinklist}"
elif [ "$ENVIRONMENT" = "dev" ]; then
    echo "🎯 Target: Development deployment"
    TARGET_DIR="${SFTP_REMOTE_DIR_DEV:-/var/www/html/kinklist-dev}"
else
    echo "❌ Invalid environment: $ENVIRONMENT"
    exit 1
fi

echo "📁 Target directory: $TARGET_DIR"

# Test 7: Create deployment manifest (simulate)
echo ""
echo "7️⃣ Creating deployment manifest..."
cat > "./dist/deployment-info.json" << EOF
{
  "deployment": {
    "timestamp": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
    "environment": "$ENVIRONMENT",
    "branch": "$(git branch --show-current 2>/dev/null || echo 'unknown')",
    "commit": "$(git rev-parse HEAD 2>/dev/null || echo 'unknown')",
    "build_dir": "./dist",
    "target_dir": "$TARGET_DIR",
    "test_run": true
  }
}
EOF

if [ -f "./dist/deployment-info.json" ]; then
    echo "✅ Deployment manifest created"
    cat "./dist/deployment-info.json"
else
    echo "❌ Failed to create deployment manifest"
    exit 1
fi

# Final summary
echo ""
echo "🎉 Pipeline test completed successfully!"
echo "✅ All steps passed for $ENVIRONMENT environment"
echo ""
echo "📋 Summary:"
echo "  • Node.js version: $(node --version)"
echo "  • npm version: $(npm --version)"
echo "  • Tests: PASSED"
echo "  • Build: SUCCESSFUL"
echo "  • Environment: $ENVIRONMENT"
echo "  • Target: $TARGET_DIR"
echo ""
echo "🚀 Ready for deployment!"

# Optional: Cleanup
read -p "🗑️  Delete build directory? (y/N): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    rm -rf ./dist
    echo "✅ Build directory cleaned up"
fi
